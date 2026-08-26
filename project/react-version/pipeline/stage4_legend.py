#!/usr/bin/env python3
"""
Stage 4: Glossary & Visual Mapping Script
Memetakan elemen gambar (`image_ref`) dengan caption (misal "Gambar 1.1") serta
memasangkan data gambar Base64 (`src`), dan menyiapkan glosarium (`tech_legend`).
"""

import json
import re
import urllib.request

_GLOSSARY_HEADING_RE = re.compile(r'^(glosarium|daftar istilah|glossary|legend|istilah\s*teknis)$', re.I)
_TABLE_MARKER_RE = re.compile(r'^\[TABLE_(\d+)\]$')
# Chapter numbering a writer may put in front of the heading: "5.", "5.1", "A.", "BAB V", "BAB".
_HEADING_NUMBER_PREFIX_RE = re.compile(r'^(bab(\s+[ivxlcdm\d]+)?|\d+(\.\d+)*|[a-z])\s*[\.\)\:]?\s+', re.I)
# Trailing punctuation a writer may put after it: "Glosarium :", "Glosarium -".
_HEADING_TRAILING_PUNCT_RE = re.compile(r'[\s\.\:\-–—]+$')
_GLOSSARY_HEADER_CELL_WORDS = {
    'istilah', 'term', 'kata', 'no', 'keterangan', 'definisi', 'deskripsi', 'desc', 'arti'
}


_HEADER_TAG_RE = re.compile(r'\[HEADER_STYLE(?:_\d+)?\]|\[NUMERIC_HEADER\]')


def _clean_header_tags(p):
    if not p:
        return ""
    return _HEADER_TAG_RE.sub("", p).strip()


def _normalize_heading(p):
    """Reduce a raw heading paragraph to bare words so the glossary heading is still
    recognised when the writer numbers the chapter or adds punctuation - "5.1 Glosarium",
    "BAB V GLOSARIUM" and "Glosarium :" all normalise to "glosarium"."""
    t = _clean_header_tags(p)
    if not t:
        return ""
    t = _HEADING_NUMBER_PREFIX_RE.sub("", t)
    t = _HEADING_TRAILING_PUNCT_RE.sub("", t)
    return re.sub(r'\s+', ' ', t).strip()


def _rows_to_glossary_items(rows):
    """Map raw docx table rows [[term, desc], [term, category, desc], ...] to tech_legend items as-is,
    skipping a header row (e.g. "Istilah | Kategori | Penjelasan") if present."""
    if not rows:
        return None
    items = []
    for row in rows:
        if len(row) >= 3:
            term = (row[0] or "").strip()
            category = (row[1] or "").strip()
            desc = (row[2] or "").strip()
            if not term:
                continue
            if not items and term.lower() in _GLOSSARY_HEADER_CELL_WORDS:
                continue
            items.append({"term": term, "category": category, "desc": desc})
        elif len(row) == 2:
            term = (row[0] or "").strip()
            desc = (row[1] or "").strip()
            if not term or not desc:
                continue
            if not items and term.lower() in _GLOSSARY_HEADER_CELL_WORDS:
                continue
            items.append({"term": term, "desc": desc})
    return items or None


def detect_glossary_table(paragraphs, tables):
    """Look for a 'Glosarium'/'Daftar Istilah'/'Glossary'/'Legend' heading immediately
    followed by a [TABLE_N] marker in the raw extracted paragraphs. If found and the
    referenced table maps to at least one usable term/desc row, return (items, heading_idx, t_idx)
    with those items taken from the document AS-IS (no AI). `heading_idx` lets the caller
    drop the heading paragraph too. Returns (None, None, None) if no such table exists."""
    if not paragraphs or not tables:
        return None, None, None

    for i, p in enumerate(paragraphs):
        if not _GLOSSARY_HEADING_RE.match(_normalize_heading(p)):
            continue
        for j in range(i + 1, min(i + 6, len(paragraphs))):
            candidate = paragraphs[j].strip()
            m = _TABLE_MARKER_RE.match(candidate)
            if m:
                t_idx = int(m.group(1))
                if t_idx < len(tables):
                    items = _rows_to_glossary_items(tables[t_idx])
                    if items:
                        return items, i, t_idx
                break
            if candidate:
                # Real content appears before any table marker - not immediately
                # followed by a table, so this heading doesn't qualify.
                break

    return None, None, None


def strip_table_markers(paragraphs, exclude_indices=None):
    """Remove specified [TABLE_N] markers from paragraph stream (e.g. consumed glossary tables).
    If exclude_indices is None or empty, preserve table markers for generic table rendering."""
    if exclude_indices is None:
        return paragraphs
    exclude_set = set(exclude_indices)
    result = []
    for p in paragraphs:
        m = _TABLE_MARKER_RE.match(p.strip())
        if m and int(m.group(1)) in exclude_set:
            continue
        result.append(p)
    return result


def strip_glossary_heading(paragraphs, heading_idx):
    """Drop the glossary heading paragraph once its table has been consumed. The glossary
    is rendered as its own dedicated page from tech_legend, so leaving the heading in the
    stream would make stage1 open a second, empty chapter for it (its table is gone by then)."""
    if heading_idx is None or not (0 <= heading_idx < len(paragraphs)):
        return paragraphs
    return [p for k, p in enumerate(paragraphs) if k != heading_idx]


def extract_raw_para_candidates(sections):
    candidates = []
    seen = set()

    # Lead-in words and common Indonesian stop words that must NEVER start a candidate term
    lead_in_stopwords = {
        'berikut', 'langkah', 'langkah-langkah', 'pada', 'di', 'ke', 'dari', 'ini', 'itu',
        'dengan', 'untuk', 'adalah', 'dapat', 'secara', 'oleh', 'maka', 'jika', 'bila',
        'akan', 'telah', 'harus', 'bisa', 'ada', 'sudah', 'tersebut', 'merupakan', 'lakukan',
        'dilakukan', 'memastikan', 'seluruh', 'fungsi', 'kontrol', 'antarmuka', 'akses',
        'optimal', 'responsif', 'pengguna', 'digunakan', 'menampilkan', 'ringkasan', 'tugas',
        'modul', 'dirancang', 'terstruktur', 'aplikasi', 'menu', 'pilih', 'langkah', 'nomor',
        'tanpa', 'memasukkan', 'ketikkan', 'nama', 'pencarian', 'berupa', 'huruf', 'angka',
        'detail', 'mengenai', 'aktivitas', 'dipakai', 'versi', 'mengatur', 'sensitivitas',
        'sinyal', 'sesuai', 'kebutuhan', 'operasional', 'tampil', 'menampilkan', 'halaman', 'tombol',
        'berfungsi', 'performa', 'sistem', 'suatu', 'agar', 'mencari', 'melihat', 'proses', 'dibuat',
        'masukan', 'masukkan', 'klik', 'buka', 'isi', 'ketik', 'tekan', 'logo', 'durasi', 'hapus',
        'tambah', 'simpan', 'batal', 'kembali', 'yang', 'dan', 'atau', 'sebagai', 'dalam', 'setiap',
        'pada', 'seperti', 'hanya', 'serta', 'dapat', 'oleh', 'karena', 'tentang', 'kemudian'
    }

    # Common non-technical words that structurally LOOK like a term (Title-Case, acronym-ish)
    # but are plain vocabulary, not technology terminology. Kept separate from lead_in_stopwords
    # because these can appear as a WHOLE candidate, not just as a leading word.
    generic_word_denylist = {
        'ok', 'yes', 'no', 'ya', 'oke', 'baru', 'lama', 'atas', 'bawah', 'kiri', 'kanan',
        'home', 'about', 'help', 'info', 'close', 'open', 'next', 'back', 'done', 'save',
        'cancel', 'edit', 'view', 'add', 'delete', 'search', 'filter', 'sort', 'refresh',
    }

    def clean_and_add(term):
        t = term.strip().strip(".:;,()[]{}'\"`*")
        if not t or len(t) < 2 or len(t) > 35:
            return

        # Word count check: term must be 1 to 4 words max
        words = t.split()
        if len(words) > 4:
            return

        # Check first word
        first_word = words[0].lower()
        if first_word in lead_in_stopwords:
            return

        # Check if entire term is a stopword or generic non-technical word
        if t.lower() in lead_in_stopwords or t.lower() in generic_word_denylist:
            return

        # Skip pure numbers
        if t.isdigit():
            return

        if t.lower() not in seen:
            candidates.append(t)
            seen.add(t.lower())

    # Deliberately restricted to STRUCTURAL signals of real technology terminology —
    # parenthetical definitions, acronyms, and multi-word Title-Case technical phrases.
    # A previous version also grabbed every plain 3-25 char word in every paragraph, which
    # pulled in ordinary Indonesian vocabulary (menu labels, connectors, etc.) as "candidates"
    # and made the LLM prone to inventing/mislabeling non-technical terms as a glossary entry.
    for sec in sections:
        blocks = sec.get("blocks", [])
        for b in blocks:
            if b.get("type") != "para":
                continue

            txt = b.get("text", "").strip()
            if not txt:
                continue

            # 1. Terms in parentheses e.g. (License Number), (Receive Sensitivity), (Tx Power)
            in_parens = re.findall(r'\(([^)]+)\)', txt)
            for p in in_parens:
                clean_and_add(p)

            # 2. Acronyms & Uppercase terms e.g. IMSI, BTS, RF, PDF, CSV, USB, SSL, API, HTTP, LN, SN, SCW
            acronyms = re.findall(r'\b[A-Z0-9]{2,10}\b', txt)
            for ac in acronyms:
                if not ac.isdigit():
                    clean_and_add(ac)

            # 3. Multi-word Title-Case / Capitalized technical phrases e.g. Transmit Power, Whitelist Mode, Signal Jamming
            title_phrases = re.findall(r'\b[A-Z][a-z0-9\-_]+(?:\s+[A-Z0-9][a-z0-9\-_]+){1,3}\b', txt)
            for tp in title_phrases:
                clean_and_add(tp)

    return candidates


def is_grounded_candidate(term, candidates_lower, full_text_lower):
    """Anti-hallucination guard: a glossary term returned by the LLM is only accepted if it can
    actually be traced back to the source document — either it was one of the extracted
    candidates, or its core text (ignoring an abbreviation in parentheses) literally appears
    somewhere in the document. This rejects terms the model invented rather than pulled from
    the text."""
    core = re.sub(r'\s*\([^)]*\)', '', term).strip().lower()
    if not core:
        return False
    if core in candidates_lower:
        return True
    return core in full_text_lower

def extract_legend_from_json_blocks(sections):
    items = []
    seen = set()

    candidates = extract_raw_para_candidates(sections)

    for sec in sections:
        blocks = sec.get("blocks", [])
        for b in blocks:
            if b.get("type") != "para":
                continue
            
            txt = b.get("text", "").strip()
            if not txt:
                continue

            for term_candidate in candidates:
                if term_candidate.lower() not in seen and term_candidate.lower() in txt.lower():
                    sentences = re.split(r'(?<=[.!?])\s+', txt)
                    matched_sent = ""
                    for sent in sentences:
                        if term_candidate.lower() in sent.lower():
                            matched_sent = sent.strip()
                            break
                    if matched_sent:
                        desc = f"Istilah/konsep teknis '{term_candidate}' yang digunakan dalam sistem. Konteks penggunaan: \"{matched_sent}\""
                    else:
                        desc = f"Istilah/konsep teknis '{term_candidate}' yang terdapat pada dokumen ini."
                    items.append({"term": term_candidate, "desc": desc})
                    seen.add(term_candidate.lower())

    return items

def generate_tech_legend_from_json(structured_data, ollama_url="http://172.15.5.30:11434/api/generate", model="deepseek-r1:14b"):
    sections = structured_data.get("sections", [])
    doc_title = structured_data.get("docTitle", "Manual Book")

    candidates = extract_raw_para_candidates(sections)

    if not candidates:
        return extract_legend_from_json_blocks(sections)

    full_text = "\n".join(
        b.get("text", "")
        for sec in sections
        for b in sec.get("blocks", [])
        if b.get("type") == "para"
    )
    full_text_lower = full_text.lower()
    candidates_lower = {c.lower() for c in candidates}

    prompt = f"""Anda adalah AI Analis Dokumen Teknis yang berpengalaman.
Tugas Anda adalah membuat Glosarium Istilah Teknologi berdasarkan dokumen '{doc_title}'.

Target pembaca glosarium ini adalah orang awam yang tidak memiliki latar belakang IT/Teknis ("orang awam").
Oleh karena itu, setiap istilah teknologi harus dijelaskan dengan sangat detail, menggunakan analogi sederhana jika perlu, serta menjelaskan apa kegunaan atau fungsinya dalam konteks sistem ini.

Berikut adalah daftar calon istilah, singkatan, dan konsep teknis yang diambil MURNI dari paragraf teks dokumen:
{", ".join(candidates[:150])}

Instruksi Khusus (SANGAT PENTING — WAJIB DIPATUHI):
1. DILARANG KERAS mengarang atau menambahkan istilah yang TIDAK ADA di "daftar calon istilah" di atas maupun di dalam dokumen. Setiap istilah yang Anda tulis HARUS bisa ditelusuri kembali ke kata/frasa yang benar-benar tertulis dalam dokumen — JANGAN berhalusinasi.
2. HANYA pilih istilah dari daftar calon yang MERUPAKAN istilah teknologi murni (IT, jaringan, frekuensi radio/RF, protokol, mode operasional sistem, komponen perangkat). Jika sebuah kandidat di daftar ternyata adalah kata umum sehari-hari, label menu UI, atau instruksi biasa (misal 'Masukan Task Name', 'Klik Logo Play', 'Menu Home', 'Simpan', 'Cari'), JANGAN masukkan ke hasil — abaikan saja.
3. Gunakan bentuk istilah teknis utuh jika singkatannya tersedia, contoh: "Transmit Power (Tx Power)", "Serial Number (SN)", "License Number (LN)".
4. Tuliskan penjelasan (desc) secara sangat detail (2-3 kalimat panjang), jelas, dan akurat dengan bahasa yang sangat mudah dipahami oleh orang awam. Penjelasan HARUS konsisten dengan bagaimana istilah tersebut dipakai di dalam dokumen — jangan mengarang fungsi yang tidak disebutkan/tidak relevan dengan dokumen.
   - Contoh bagus: "IMSI (International Mobile Subscriber Identity): Nomor identitas unik yang digunakan untuk mengidentifikasi pengguna pada jaringan seluler. Di sistem ini, IMSI digunakan untuk melacak dan memblokir target yang dicurigai."
   - Contoh bagus: "Transmit Power (Tx Power): Daya pemancaran sinyal frekuensi radio yang dikeluarkan oleh modul radio sistem. Pengaturan daya ini menentukan seberapa jauh jangkauan pemancaran sinyal pelacak atau sinyal pengganggu (jamming)."
5. JANGAN memaksakan jumlah istilah tertentu. Pilih SEBANYAK istilah teknologi murni yang benar-benar relevan dan valid — boleh sedikit (misal di bawah 10) kalau dokumennya memang sederhana, atau lebih banyak kalau dokumennya sangat teknis. Lebih baik daftar pendek yang akurat daripada daftar panjang yang mengada-ada.
6. Format output harus berupa JSON murni tanpa penjelasan tambahan di luar JSON.
7. Struktur JSON yang diharapkan:
{{
  "glosarium": [
    {{
      "term": "NAMA ISTILAH TEKNIS UTUH",
      "desc": "Penjelasan detail dan mudah dipahami oleh orang awam."
    }}
  ]
}}
"""

    req_data = json.dumps({
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 4096}
    }).encode("utf-8")

    try:
        req = urllib.request.Request(ollama_url, data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as response:
            res = json.loads(response.read().decode("utf-8"))
            ai_text = res.get("response", "").strip()

            # Clean reasoning <think>...</think> tag if present
            ai_text = re.sub(r'<think>.*?</think>', '', ai_text, flags=re.DOTALL).strip()
            ai_text = re.sub(r'```json\s*', '', ai_text)
            ai_text = re.sub(r'```\s*', '', ai_text)

            parsed = None
            try:
                parsed = json.loads(ai_text)
            except Exception:
                match = re.search(r'(\{.*\}|\[.*\])', ai_text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))

            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list) and len(v) > 0:
                        parsed = v
                        break

            if isinstance(parsed, list) and len(parsed) > 0:
                # Anti-hallucination guard: drop any term the LLM could not have gotten from
                # the source document (invented terms, or terms that drifted from the actual text).
                grounded = [
                    item for item in parsed
                    if isinstance(item, dict) and item.get("term")
                    and is_grounded_candidate(str(item["term"]), candidates_lower, full_text_lower)
                ]
                dropped = len(parsed) - len(grounded)
                if dropped > 0:
                    print(f"[AI-SERVER] 🛡️ Dropped {dropped} ungrounded/hallucinated glossary term(s) not found in source document.", flush=True)
                if grounded:
                    print(f"[AI-SERVER] ✅ Successfully generated {len(grounded)} tech legend items via Ollama AI LLM!", flush=True)
                    return grounded
    except Exception as e:
        print(f"[AI-SERVER] ⚠️ Failed generating tech legend via LLM: {e}", flush=True)

    return extract_legend_from_json_blocks(sections)

def process_legend_and_visuals(structured_data, extracted_images, glossary_from_doc=None, ollama_url="http://172.15.5.30:11434/api/generate", model="deepseek-r1:14b"):
    doc_title = structured_data.get("docTitle", "MANUAL BOOK")
    sections = structured_data.get("sections", [])

    for sec in sections:
        blocks = sec.get("blocks", [])
        new_blocks = []
        
        i = 0
        while i < len(blocks):
            blk = blocks[i]
            
            if blk.get("type") == "image_ref":
                img_idx = blk.get("index", 0)
                caption_text = f"Gambar {img_idx + 1}"
                
                # 1. Cek Caption SEBELUMNYA (misal "Gambar 1.1")
                if len(new_blocks) > 0 and new_blocks[-1].get("type") == "para":
                    prev_txt = new_blocks[-1].get("text", "").strip()
                    if re.match(r'^(gambar|figure|fig\.)\s+\d', prev_txt, re.I):
                        caption_text = prev_txt
                        new_blocks.pop()

                # 2. Cek Caption SESUDAHNYA (jika belum dapet)
                if caption_text.startswith(f"Gambar {img_idx + 1}") and i + 1 < len(blocks) and blocks[i+1].get("type") == "para":
                    next_txt = blocks[i+1].get("text", "").strip()
                    if re.match(r'^(gambar|figure|fig\.)\s+\d', next_txt, re.I):
                        caption_text = next_txt
                        i += 1 # Konsumsi blok caption sesudahnya

                # Duplicate dict to preserve all keys (was_merged, merged_from_raw, image_file, etc.)
                img_block = dict(blk)
                img_block["caption"] = caption_text
                if img_idx < len(extracted_images):
                    img_block["src"] = extracted_images[img_idx]

                new_blocks.append(img_block)
            else:
                new_blocks.append(blk)

            i += 1

        sec["blocks"] = new_blocks

    if glossary_from_doc:
        tech_legend = glossary_from_doc
        print(f"[AI-SERVER] 📖 Using {len(tech_legend)} glossary term(s) extracted as-is from the original document's table.", flush=True)
    else:
        tech_legend = []
        print("[AI-SERVER] ⏭️ Skipping automatic AI glossary generation (set to empty).", flush=True)

    doc_subtitle = structured_data.get("docSubtitle", "")

    return {
        "docTitle": doc_title,
        "docSubtitle": doc_subtitle,
        "sections": sections,
        "tech_legend": tech_legend
    }
