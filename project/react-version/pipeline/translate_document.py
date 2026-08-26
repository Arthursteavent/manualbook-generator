#!/usr/bin/env python3
"""
Translate an already-generated manual book JSON (docTitle, sections[].blocks[], tech_legend, etc.)
into a target language via the local Ollama LLM.

This script recursively extracts ALL translatable text fields (text, title, caption, html, items,
headers, rows, etc.) from any block structure and ensures 100% complete translation
by automatically retrying any units omitted by the LLM.
"""

import sys
import os
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://172.15.5.30:11434/api/generate")
DEFAULT_MODEL = os.environ.get("TRANSLATE_MODEL", "qwen2.5:14b")
FAST_MODEL_OVERRIDES = {}

LANGUAGE_NAMES = {
    "en": "English",
    "zh": "Simplified Chinese (简体中文)",
    "ar": "Modern Standard Arabic (العربية الفصحى)",
    "ko": "Korean (한국어)",
    "ja": "Japanese (日本語)",
}

BATCH_SIZE = 10
MAX_WORKERS = int(os.environ.get("TRANSLATE_WORKERS", "2"))


def model_for_language(target_lang):
    return FAST_MODEL_OVERRIDES.get(target_lang, DEFAULT_MODEL)


def call_ollama(prompt, model, timeout=180):
    data = json.dumps({
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 2048,
            "num_thread": 8
        },
    }).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        res = json.loads(resp.read().decode("utf-8"))
    text = res.get("response", "").strip()
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    return text


def translate_units(units, target_lang, model_override=None):
    """units: list of {"id": str, "text": str}. Returns dict id -> translated text."""
    if not units:
        return {}

    model = model_override or model_for_language(target_lang)
    lang_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    payload = json.dumps({"items": units}, ensure_ascii=False)

    prompt = f"""You are a professional technical translator. Translate ALL Indonesian text inside the "text" value of every item below into {lang_name}.

Rules:
1. Translate EVERY Indonesian word, section heading, button label, action item, and figure label (e.g. convert "Gambar" to "Figure", "Tambah" to "Add", "Hapus" to "Delete", "Panduan" to "Guide", "Mode Whitelist" to "Whitelist Mode") into natural, technical {lang_name}.
2. Translate ONLY the "text" values into {lang_name}. Keep every "id" EXACTLY as given, unchanged.
3. Do NOT leave any Indonesian words untranslated.
4. Return ONLY a valid JSON object containing an "items" array with every translated item:
{{"items": [{{"id": "...", "text": "..."}}]}}

Input:
{payload}
"""

    result_map = {}
    try:
        raw = call_ollama(prompt, model, timeout=180)
        parsed = json.loads(raw)
        items = parsed.get("items", []) if isinstance(parsed, dict) else parsed
        if isinstance(items, list):
            for it in items:
                if isinstance(it, dict) and "id" in it and "text" in it and it.get("text"):
                    result_map[it["id"]] = it["text"]
    except Exception as e:
        print(f"[TRANSLATE] ⚠️ Batch translation with model '{model}' failed ({len(units)} units): {e}", file=sys.stderr, flush=True)

    return result_map


def chunked(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def process_batch(args):
    bi, batch, total_batches, target_lang = args
    translated = translate_units(batch, target_lang)
    return bi, batch, translated


def collect_and_translate(units, target_lang):
    """Translate all units in parallel batches. Automatically retries missing units in smaller sub-batches."""
    if not units:
        return {}

    result = {}
    total = len(units)
    batches = list(chunked(units, BATCH_SIZE))
    total_batches = len(batches)
    done_units = 0

    print(f"[TRANSLATE] 🌐 Parallel translating {total} text units to '{target_lang}' ({total_batches} batches, {MAX_WORKERS} workers)...", file=sys.stderr, flush=True)

    tasks = [(bi, batch, total_batches, target_lang) for bi, batch in enumerate(batches, start=1)]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_batch, task): task for task in tasks}
        for future in as_completed(futures):
            try:
                bi, batch, translated = future.result()
                for u in batch:
                    if u["id"] in translated:
                        result[u["id"]] = translated[u["id"]]
                done_units += len(batch)
                pct = round(done_units / total * 100) if total else 100
                print(f"[TRANSLATE] 📊 Progress: {done_units}/{total} units processed ({pct}%)", file=sys.stderr, flush=True)
            except Exception as exc:
                print(f"[TRANSLATE] ⚠️ Exception processing batch: {exc}", file=sys.stderr, flush=True)

    # Check for any missing/untranslated units and retry them in sub-batches of 5
    missing = [u for u in units if u["id"] not in result or not result[u["id"]]]
    if missing:
        print(f"[TRANSLATE] 🔄 Retrying {len(missing)} missing units...", file=sys.stderr, flush=True)
        retry_batches = list(chunked(missing, 5))
        retry_model = model_for_language(target_lang)
        retry_workers = min(2, MAX_WORKERS)
        with ThreadPoolExecutor(max_workers=retry_workers) as executor:
            futures = {executor.submit(translate_units, b, target_lang, retry_model): b for b in retry_batches}
            for future in as_completed(futures):
                try:
                    retried = future.result()
                    for uid, txt in retried.items():
                        if txt:
                            result[uid] = txt
                except Exception as exc:
                    print(f"[TRANSLATE] ⚠️ Exception retrying batch: {exc}", file=sys.stderr, flush=True)

    # Fallback to original text only if retry also failed
    for u in units:
        if u["id"] not in result or not result[u["id"]]:
            result[u["id"]] = u["text"]

    return result


def is_translatable_string(val):
    if not isinstance(val, str):
        return False
    s = val.strip()
    if not s:
        return False
    # Skip pure numbers, image filenames, data URIs, or URLs
    if s.startswith("data:") or s.startswith("http://") or s.startswith("https://"):
        return False
    if re.match(r'^/?[a-zA-Z0-9_\-]+\.(png|jpg|jpeg|gif|svg|webp)$', s):
        return False
    if re.match(r'^\d+[\.\:\-\)]*$', s):
        return False
    # Must contain at least one letter
    return bool(re.search(r'[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u4e00-\u9fff\u0600-\u06ff]', s))


def extract_block_units(block, prefix, units):
    """Recursively extract all translatable string fields from any block."""
    if not isinstance(block, dict):
        return

    # Direct string fields
    string_fields = ["text", "title", "caption", "html", "subtitle", "heading", "description", "name", "label", "summary", "overview"]
    for f in string_fields:
        val = block.get(f)
        if is_translatable_string(val):
            clean_val = strip_html_tags(val)
            if clean_val:
                units.append({"id": f"{prefix}.{f}", "text": clean_val})

    # List of string fields
    list_fields = ["items", "headers", "raw_text"]
    for f in list_fields:
        items = block.get(f)
        if isinstance(items, list):
            for idx, item in enumerate(items):
                if is_translatable_string(item):
                    clean_item = strip_html_tags(item)
                    if clean_item:
                        units.append({"id": f"{prefix}.{f}.{idx}", "text": clean_item})

    # 2D list of string fields (e.g. table rows)
    rows = block.get("rows")
    if isinstance(rows, list):
        for r_idx, row in enumerate(rows):
            if isinstance(row, list):
                for c_idx, cell in enumerate(row):
                    if is_translatable_string(cell):
                        clean_cell = strip_html_tags(cell)
                        if clean_cell:
                            units.append({"id": f"{prefix}.rows.{r_idx}.{c_idx}", "text": clean_cell})

    # Nested sub-blocks (e.g. two-columns left/right or children/blocks)
    nested_fields = ["blocks", "left", "right", "children"]
    for nf in nested_fields:
        sub_blocks = block.get(nf)
        if isinstance(sub_blocks, list):
            for s_idx, s_blk in enumerate(sub_blocks):
                extract_block_units(s_blk, f"{prefix}.{nf}.{s_idx}", units)


def apply_block_translations(block, prefix, translations):
    """Recursively apply translated strings back to a copy of block."""
    if not isinstance(block, dict):
        return block

    new_blk = dict(block)

    string_fields = ["text", "title", "caption", "html", "subtitle", "heading", "description", "name", "label", "summary", "overview"]
    for f in string_fields:
        val = block.get(f)
        if is_translatable_string(val):
            uid = f"{prefix}.{f}"
            if uid in translations:
                new_blk[f] = translations[uid]

    list_fields = ["items", "headers", "raw_text"]
    for f in list_fields:
        items = block.get(f)
        if isinstance(items, list):
            new_items = []
            for idx, item in enumerate(items):
                if is_translatable_string(item):
                    uid = f"{prefix}.{f}.{idx}"
                    new_items.append(translations.get(uid, item))
                else:
                    new_items.append(item)
            new_blk[f] = new_items

    rows = block.get("rows")
    if isinstance(rows, list):
        new_rows = []
        for r_idx, row in enumerate(rows):
            if isinstance(row, list):
                new_row = []
                for c_idx, cell in enumerate(row):
                    if is_translatable_string(cell):
                        uid = f"{prefix}.rows.{r_idx}.{c_idx}"
                        new_row.append(translations.get(uid, cell))
                    else:
                        new_row.append(cell)
                new_rows.append(new_row)
            else:
                new_rows.append(row)
        new_blk["rows"] = new_rows

    nested_fields = ["blocks", "left", "right", "children"]
    for nf in nested_fields:
        sub_blocks = block.get(nf)
        if isinstance(sub_blocks, list):
            new_sub = []
            for s_idx, s_blk in enumerate(sub_blocks):
                new_sub.append(apply_block_translations(s_blk, f"{prefix}.{nf}.{s_idx}", translations))
            new_blk[nf] = new_sub

    return new_blk


def strip_html_tags(s):
    if not isinstance(s, str):
        return s
    return re.sub(r'<[^>]+>', '', s).strip()


def extract_html_text_units(html_str, prefix, units):
    if not html_str:
        return
    matches = list(re.finditer(r'>([^<]+)<', html_str))
    for idx, m in enumerate(matches):
        clean_text = m.group(1).strip()
        if is_translatable_string(clean_text):
            units.append({"id": f"{prefix}.h{idx}", "text": clean_text})


def apply_html_text_translations(html_str, prefix, translations):
    if not html_str:
        return html_str
    matches = list(re.finditer(r'>([^<]+)<', html_str))
    out_chars = list(html_str)
    for idx in range(len(matches) - 1, -1, -1):
        m = matches[idx]
        raw_text = m.group(1)
        clean_text = raw_text.strip()
        if is_translatable_string(clean_text):
            uid = f"{prefix}.h{idx}"
            if uid in translations and translations[uid]:
                new_text = translations[uid]
                leading_ws = raw_text[:len(raw_text) - len(raw_text.lstrip())]
                trailing_ws = raw_text[len(raw_text.rstrip()):]
                replaced = leading_ws + new_text + trailing_ws
                start, end = m.start(1), m.end(1)
                out_chars[start:end] = list(replaced)
    return "".join(out_chars)


def translate_document(doc, target_lang):
    units = []

    doc_title = doc.get("docTitle", "")
    if is_translatable_string(doc_title):
        units.append({"id": "docTitle", "text": doc_title})

    meta = doc.get("meta")
    if isinstance(meta, dict):
        for mf in ["title", "subtitle", "company", "author", "description"]:
            mv = meta.get(mf)
            if is_translatable_string(mv):
                units.append({"id": f"meta.{mf}", "text": mv})

    sections = doc.get("sections", [])
    for si, sec in enumerate(sections):
        title = sec.get("title", "")
        if is_translatable_string(title):
            units.append({"id": f"s{si}.title", "text": title})

        blocks = sec.get("blocks", [])
        for bi, blk in enumerate(blocks):
            extract_block_units(blk, f"s{si}.b{bi}", units)

    pages = doc.get("pages", [])
    is_raw_html_pages = pages and all(isinstance(p, dict) and "html" in p and "blocks" not in p for p in pages)

    if is_raw_html_pages:
        for pi, page in enumerate(pages):
            extract_html_text_units(page.get("html", ""), f"p{pi}", units)
    elif pages:
        for pi, page in enumerate(pages):
            for pf in ["chapterName", "chapterLabel", "footerBrand"]:
                pv = page.get(pf)
                if is_translatable_string(pv):
                    units.append({"id": f"p{pi}.{pf}", "text": pv})

            pblocks = page.get("blocks", [])
            for bi, blk in enumerate(pblocks):
                extract_block_units(blk, f"p{pi}.b{bi}", units)

    toc = doc.get("toc", [])
    for ti, item in enumerate(toc):
        if is_translatable_string(item.get("title")):
            units.append({"id": f"toc{ti}.title", "text": item["title"]})

    tech_legend = doc.get("tech_legend", [])
    for ti, term in enumerate(tech_legend):
        if is_translatable_string(term.get("term")):
            units.append({"id": f"tl{ti}.term", "text": term["term"]})
        if is_translatable_string(term.get("desc")):
            units.append({"id": f"tl{ti}.desc", "text": term["desc"]})

    print(f"[TRANSLATE] 🌐 Extracted {len(units)} text units to translate to '{target_lang}'.", file=sys.stderr)
    translations = collect_and_translate(units, target_lang)
    print(f"[TRANSLATE] ✅ Received {len(translations)}/{len(units)} translated units.", file=sys.stderr)

    out = dict(doc)

    if doc_title:
        trans_title = translations.get("docTitle")
        if trans_title:
            out["docTitle"] = strip_html_tags(str(trans_title)) or doc_title
        else:
            out["docTitle"] = doc_title

    if isinstance(meta, dict):
        new_meta = dict(meta)
        for mf in ["title", "subtitle", "company", "author", "description"]:
            if f"meta.{mf}" in translations and translations[f"meta.{mf}"]:
                new_meta[mf] = strip_html_tags(str(translations[f"meta.{mf}"]))
        out["meta"] = new_meta

    if sections:
        out_sections = []
        for si, sec in enumerate(sections):
            new_sec = dict(sec)
            sec_title = sec.get("title")
            if sec_title:
                trans_sec_title = translations.get(f"s{si}.title")
                if trans_sec_title:
                    new_sec["title"] = strip_html_tags(str(trans_sec_title)) or sec_title
                else:
                    new_sec["title"] = sec_title

            blocks = sec.get("blocks", [])
            new_blocks = []
            for bi, blk in enumerate(blocks):
                new_blocks.append(apply_block_translations(blk, f"s{si}.b{bi}", translations))
            new_sec["blocks"] = new_blocks
            out_sections.append(new_sec)
        out["sections"] = out_sections

    if is_raw_html_pages:
        out_pages = []
        for pi, page in enumerate(pages):
            new_page = dict(page)
            if "html" in new_page:
                new_page["html"] = apply_html_text_translations(new_page["html"], f"p{pi}", translations)
            out_pages.append(new_page)
        out["pages"] = out_pages
    elif pages:
        out_pages = []
        for pi, page in enumerate(pages):
            new_page = dict(page)
            for pf in ["chapterName", "chapterLabel", "footerBrand"]:
                if f"p{pi}.{pf}" in translations:
                    new_page[pf] = strip_html_tags(translations[f"p{pi}.{pf}"])
            pblocks = page.get("blocks", [])
            new_pblocks = []
            for bi, blk in enumerate(pblocks):
                new_pblocks.append(apply_block_translations(blk, f"p{pi}.b{bi}", translations))
            new_page["blocks"] = new_pblocks
            out_pages.append(new_page)
        out["pages"] = out_pages

    if toc:
        out_toc = []
        for ti, item in enumerate(toc):
            new_item = dict(item)
            if f"toc{ti}.title" in translations:
                new_item["title"] = strip_html_tags(translations[f"toc{ti}.title"])
            out_toc.append(new_item)
        out["toc"] = out_toc

    out_legend = []
    for ti, term in enumerate(tech_legend):
        new_term = dict(term)
        if term.get("term") and f"tl{ti}.term" in translations:
            new_term["term"] = translations[f"tl{ti}.term"]
        if term.get("desc") and f"tl{ti}.desc" in translations:
            new_term["desc"] = translations[f"tl{ti}.desc"]
        out_legend.append(new_term)
    out["tech_legend"] = out_legend

    out["language"] = target_lang
    return out


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 translate_document.py <input_json> <output_json> <target_lang: en|zh|ar>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    target_lang = sys.argv[3]

    if target_lang not in LANGUAGE_NAMES:
        print(f"[TRANSLATE] ❌ Unsupported target language: {target_lang}", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        source_doc = json.load(f)

    result = translate_document(source_doc, target_lang)

    # Write atomically: the server treats the existence of output_path as a valid
    # cached translation, so a half-written file must never appear at that path.
    tmp_path = output_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, output_path)

    print(f"[TRANSLATE] 💾 Saved translated document to {output_path}", file=sys.stderr)
