#!/usr/bin/env python3
"""
Stage 4: Legend & Visual Mapping Script
Memetakan elemen gambar (`image_ref`) dengan caption (misal "Gambar 1.1"),
legend / item keterangan, serta memasangkan data gambar Base64 (`src`).
"""

import json
import re

import urllib.request

def extract_legend_from_json_blocks(sections):
    items = []
    seen = set()

    for sec in sections:
        sec_title = sec.get("title", "")
        blocks = sec.get("blocks", [])
        
        for idx, b in enumerate(blocks):
            if b.get("type") == "subhead":
                term = b.get("text", "").strip()
                term_clean = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[A-Z0-9]+\.[0-9\.]*|[A-Z]\.|\d+[\.\:\-])\s*', '', term, flags=re.I).strip()
                if term_clean and term_clean.lower() not in seen and len(term_clean) < 45:
                    # Find description from next paragraph
                    desc = ""
                    if idx + 1 < len(blocks) and blocks[idx+1].get("type") == "para":
                        desc = blocks[idx+1].get("text", "").strip()
                    if not desc:
                        desc = f"Fitur/modul {term_clean} yang terdapat pada bab {sec_title}."
                    items.append({"term": term_clean, "desc": desc})
                    seen.add(term_clean.lower())
    return items

def generate_tech_legend_from_json(structured_data, ollama_url="http://172.15.5.30:11434/api/generate", model="deepseek-r1:32b"):
    sections = structured_data.get("sections", [])
    doc_title = structured_data.get("docTitle", "Manual Book")

    text_samples = []
    for sec in sections:
        text_samples.append(f"Bab: {sec.get('title', '')}")
        for b in sec.get("blocks", []):
            if b.get("type") in ["para", "subhead"] and b.get("text"):
                text_samples.append(b.get("text"))

    doc_text = "\n".join(text_samples[:60])

    prompt = f"""Anda adalah AI Analis Dokumen Teknis.
Berdasarkan isi dokumen '{doc_title}' berikut, analisis dan buatlah daftar Istilah Teknologi / Glosarium (5-10 istilah) yang BENAR-BENAR dijelaskan atau disebutkan dalam dokumen ini.

DILARANG KERAS membuat istilah dummy di luar dokumen ini!

Teks Dokumen:
---
{doc_text}
---

Format output WAJIB berupa JSON array murni saja tanpa markdown/penjelasan lain, contoh:
[
  {{"term": "Nama Istilah", "desc": "Penjelasan istilah berdasarkan dokumen."}}
]
"""

    req_data = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2}
    }).encode("utf-8")

    try:
        req = urllib.request.Request(ollama_url, data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=8) as response:
            res = json.loads(response.read().decode("utf-8"))
            ai_text = res.get("response", "").strip()

            ai_text = re.sub(r'```json\s*', '', ai_text)
            ai_text = re.sub(r'```\s*', '', ai_text)
            
            match = re.search(r'\[\s*\{.*\}\s*\]', ai_text, re.DOTALL)
            if match:
                extracted_json = json.loads(match.group(0))
                if isinstance(extracted_json, list) and len(extracted_json) > 0:
                    return extracted_json
    except Exception as e:
        pass

    return extract_legend_from_json_blocks(sections)

def process_legend_and_visuals(structured_data, extracted_images, ollama_url="http://172.15.5.30:11434/api/generate", model="deepseek-r1:32b"):
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

                # Duplicate dict to preserve all keys (legend_items, was_merged, merged_from_raw, image_file, etc.)
                img_block = dict(blk)
                img_block["caption"] = caption_text
                if img_idx < len(extracted_images):
                    img_block["src"] = extracted_images[img_idx]

                # 3. Cek Legend SESUDAHNYA (misal steps 1. 2. 3.) jika belum punya legend_items
                if not img_block.get("legend_items") and i + 1 < len(blocks) and blocks[i+1].get("type") == "steps":
                    legend_candidate = blocks[i+1].get("items", [])
                    if legend_candidate:
                        img_block["legend_items"] = legend_candidate
                        i += 1 # Konsumsi blok steps legend

                new_blocks.append(img_block)
            else:
                new_blocks.append(blk)

            i += 1

        sec["blocks"] = new_blocks

    tech_legend = generate_tech_legend_from_json(structured_data, ollama_url=ollama_url, model=model)

    return {
        "docTitle": doc_title,
        "sections": sections,
        "tech_legend": tech_legend
    }
