#!/usr/bin/env python3
"""
Unified Stage 1: Context & Topic Determination Script
Menggabungkan penentuan Konteks Dokumen (docTitle, systemName)
dengan Pembagian Bab & Pemetaan Indeks Paragraf secara bersamaan.
Memahami kontinuitas kalimat ("apakah masih satu kalimat/paragraf")
dan batas indeks paragraf secara presisi.
"""

import json
import urllib.request
import re
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from json_helper import clean_and_repair_json

OLLAMA_URL = "http://172.15.5.30:11434/api/generate"
MODEL_NAME = "deepseek-r1:32b"

def is_toc_line(p):
    clean_p = p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
    if not clean_p:
        return False
    if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I):
        return True
    if re.match(r'^\d+(\.\d+)*\.?\s*[A-Za-z0-9\s/\-]+\s*\d{1,3}$', clean_p):
        return True
    return False

def get_body_start_idx(paragraphs):
    has_toc = False
    toc_end_idx = 0
    for idx, p in enumerate(paragraphs):
        clean_p = p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
        if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I):
            has_toc = True
            toc_end_idx = idx
        elif has_toc and is_toc_line(p):
            toc_end_idx = idx
        elif has_toc and (p.startswith("[HEADER_STYLE]") or p.startswith("[NUMERIC_HEADER]")):
            return idx
    if has_toc:
        return toc_end_idx + 1
    return 0

def extract_existing_toc_sections(paragraphs):
    body_start = get_body_start_idx(paragraphs)
    toc_idx = -1
    for idx in range(min(50, len(paragraphs))):
        p = paragraphs[idx]
        clean_p = p.replace('[HEADER_STYLE]', '').replace('[NUMERIC_HEADER]', '').strip()
        if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I):
            toc_idx = idx
            break

    if toc_idx == -1:
        return None

    major_entries = []
    for idx in range(toc_idx + 1, min(toc_idx + 60, len(paragraphs))):
        p = paragraphs[idx]
        clean_p = p.replace('[HEADER_STYLE]', '').replace('[NUMERIC_HEADER]', '').strip()
        
        # Stop collecting if body content header starts after TOC
        if idx >= body_start and p.startswith('[HEADER_STYLE]') and not is_toc_line(p):
            break

        # Clean trailing page numbers (e.g. "1. Transmission Data Acquisition 3" -> "1. Transmission Data Acquisition")
        clean_entry = re.sub(r'([A-Za-z0-9\s\(\)\/\-\.\,]+)\d{1,3}$', r'\1', clean_p).strip()
        
        # Only take major chapters (e.g. "BAB 1 ...", "1. ...", "2. ...", top-level numbered without sub-decimals like 1.1)
        is_major_chapter = bool(
            (re.match(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]{1,2}\.\s+[A-Za-z0-9])', clean_entry, re.I) and not re.match(r'^\d+\.\d+', clean_entry)) or
            (p.startswith('[HEADER_STYLE]') and not is_toc_line(p))
        )
        if is_major_chapter:
            major_entries.append(clean_entry)

    if len(major_entries) < 2:
        return None

    print(f"[AI-SERVER] 📋 Found existing Table of Contents in DOCX with {len(major_entries)} sections!", flush=True)

    total_len = len(paragraphs)
    sections = []
    
    for i, title in enumerate(major_entries):
        clean_title = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[A-Za-z0-9][\.\:\-])\s*', '', title, flags=re.I).strip()
        if not clean_title or "[IMAGE_" in clean_title:
            continue
            
        match_idx = -1
        for idx in range(body_start, total_len):
            check_p = paragraphs[idx].replace('[HEADER_STYLE]', '').replace('[NUMERIC_HEADER]', '').strip()
            if clean_title.lower() in check_p.lower():
                match_idx = idx
                break
                
        if match_idx != -1:
            sections.append({
                "title": f"{i+1}. {clean_title}",
                "start_idx": match_idx,
                "end_idx": total_len - 1
            })

    if len(sections) < 2:
        return None

    sections.sort(key=lambda s: s["start_idx"])
    sections[0]["start_idx"] = body_start
    for i in range(len(sections) - 1):
        sections[i]["end_idx"] = sections[i+1]["start_idx"] - 1
    sections[-1]["end_idx"] = total_len - 1

    return sections

def analyze_context_and_topics(paragraphs, ollama_url=OLLAMA_URL, model=MODEL_NAME):
    # 1. Bersihkan penanda judul awal untuk fallback title (abaikan gambar & TOC)
    non_img_paras = [p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip() 
                     for p in paragraphs if not p.startswith("[IMAGE_") and p.strip() and not is_toc_line(p)]
    
    fallback_title = "MANUAL BOOK TEKNIS"
    if len(non_img_paras) >= 2 and "MANUAL BOOK" in non_img_paras[0].upper():
        fallback_title = f"{non_img_paras[0]} {non_img_paras[1]}"
    elif len(non_img_paras) >= 1:
        fallback_title = non_img_paras[0]

    context_data = {
        "docTitle": fallback_title,
        "systemName": "Sistem Aplikasi Teknis"
    }

    # CHECKER: Check if document ALREADY has an explicit Table of Contents (Daftar Isi)
    existing_toc_sections = extract_existing_toc_sections(paragraphs)
    if existing_toc_sections:
        print("[AI-SERVER] ✅ Preserved existing Table of Contents structure from DOCX document!", flush=True)
        return context_data, {"sections": existing_toc_sections}

    body_start = get_body_start_idx(paragraphs)

    indexed_lines = []
    for idx in range(body_start, min(body_start + 150, len(paragraphs))):
        p = paragraphs[idx]
        if not is_toc_line(p):
            indexed_lines.append(f"[{idx}] {p}")

    # When explicit [HEADER_STYLE] or [NUMERIC_HEADER] markers exist in DOCX text,
    # use explicit header topic partitioning for 100% accurate section boundaries without topic merging.
    has_explicit_headers = any(p.startswith("[HEADER_STYLE]") or p.startswith("[NUMERIC_HEADER]") for p in paragraphs[body_start:])
    if has_explicit_headers:
        heuristic_sections = fallback_heuristic_topics(paragraphs)
        if heuristic_sections and len(heuristic_sections) > 1:
            return context_data, {"sections": heuristic_sections}

    full_text = "\n".join(indexed_lines)

    prompt_text = f"""Anda adalah AI Senior Analis Dokumen Teknis Bahasa Indonesia.
Tugas Anda: Analisis teks berindeks berikut untuk:
1. Menentukan Judul Dokumen Utama (docTitle).
2. Membagi dokumen menjadi Bab Utama (sections) berdasarkan judul/heading asli dokumen beserta rentang indeks paragrafnya (start_idx & end_idx).

ATURAN PENTING:
- Gunakan judul heading ASLI dari dokumen (contoh: "1. Transmission Data Acquisition", "2. Dashboard Overview", dst). DILARANG membuat judul palsu seperti "Login" jika tidak ada di dokumen!
- Perhatikan kontinuitas kalimat: Paragraf deskripsi yang bersambung dengan bab di atasnya WAJIB dimasukkan ke dalam bab yang sama!
- DILARANG memecah setiap poin fitur kecil menjadi Bab terpisah!

Format output WAJIB JSON:
{{
  "docTitle": "{fallback_title}",
  "systemName": "Nama Sistem/Aplikasi",
  "sections": [
    {{
      "title": "1. Judul Bab Pertama",
      "start_idx": {body_start},
      "end_idx": {body_start + 10}
    }}
  ]
}}

Teks Dokumen Berindeks:
{full_text}"""

    payload = {
        "model": model,
        "prompt": prompt_text,
        "format": "json",
        "stream": False,
        "keep_alive": 0
    }

    try:
        req = urllib.request.Request(
            ollama_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            resp_str = result.get("response", "{}")
            data = clean_and_repair_json(resp_str)
            
            if data and isinstance(data, dict):
                if data.get("docTitle"):
                    context_data["docTitle"] = data["docTitle"]
                if data.get("systemName"):
                    context_data["systemName"] = data["systemName"]

                if "sections" in data and isinstance(data["sections"], list) and len(data["sections"]) > 0:
                    normalized = sanitize_and_normalize_sections(data["sections"], len(paragraphs), paragraphs)
                    if normalized:
                        return context_data, {"sections": normalized}
    except Exception as e:
        print(f"[AI-SERVER] ⚠️ [Unified Stage 1] AI Call Fallback: {e}", flush=True)

    # Fallback berbasis heurisitik dengan kontinuitas 100%
    fallback_sections = fallback_heuristic_topics(paragraphs)
    return context_data, {"sections": fallback_sections}

def sanitize_and_normalize_sections(sections, total_len, paragraphs=None):
    valid = []
    body_start = get_body_start_idx(paragraphs) if paragraphs else 0

    for s in sections:
        if isinstance(s, dict) and "title" in s:
            t = str(s["title"]).strip()
            # Clean trailing page numbers (e.g. "3.Login3" -> "3. Login")
            t = re.sub(r'([A-Za-z\s\(\)\/\-\.\,]+)\d{1,3}$', r'\1', t).strip()
            # Filter out raw Table of Contents entries and IMAGE markers
            if re.match(r'^(table of contents|daftar isi)$', t, re.I) or t.startswith("[IMAGE_") or "[IMAGE_" in t:
                continue
            s["title"] = t
            if s.get("start_idx", 0) < body_start:
                s["start_idx"] = body_start
            valid.append(s)

    if not valid:
        return None

    valid.sort(key=lambda s: s.get("start_idx", 0))

    # Header Pinning Guard: Tentukan start_idx agar tepat menancap pada judul bab utama (mencegah kebocoran konteks)
    if paragraphs and len(paragraphs) > 0:
        for i in range(len(valid)):
            st = valid[i].get("start_idx", body_start)
            st = max(body_start, min(st, total_len - 1))
            for offset in range(min(10, total_len - st)):
                check_p = paragraphs[st + offset].strip()
                if is_toc_line(check_p):
                    continue
                clean_p = check_p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
                is_header = (
                    check_p.startswith("[HEADER_STYLE]") or 
                    check_p.startswith("[NUMERIC_HEADER]") or
                    re.match(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]+\.|\d+\.\d+|[A-Z]\.)\s+[A-Za-z0-9]', clean_p) or
                    clean_p.upper() in valid[i]["title"].upper()
                )
                if is_header and not check_p.startswith("[IMAGE_") and "[IMAGE_" not in check_p:
                    valid[i]["start_idx"] = st + offset
                    break

    valid[0]["start_idx"] = body_start
    for i in range(len(valid) - 1):
        next_start = valid[i+1].get("start_idx", valid[i].get("end_idx", 0) + 1)
        valid[i]["end_idx"] = max(valid[i]["start_idx"], next_start - 1)
        valid[i+1]["start_idx"] = valid[i]["end_idx"] + 1

    valid[-1]["end_idx"] = total_len - 1
    return valid

def fallback_heuristic_topics(paragraphs):
    total_len = len(paragraphs)
    body_start = get_body_start_idx(paragraphs)

    # 1. Look for explicit main chapter markers (Heading 1, BAB N, 1. Title, 2. Title, etc.)
    headers = []
    for idx in range(body_start, total_len):
        p = paragraphs[idx]
        if is_toc_line(p) or p.startswith("[IMAGE_") or "[IMAGE_" in p:
            continue
        clean_p = p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
        if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p:
            continue

        is_doc_title_repeat = clean_p.upper() in ["MANUAL BOOK", "BACKPACK DF", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]
        if is_doc_title_repeat:
            continue

        # Major chapter pattern: "BAB 1 ...", "1. Transmission Data...", "2. Dashboard..."
        is_major_chapter = bool(
            re.match(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]{1,2}\.\s+[A-Za-z0-9])', clean_p, re.I) or
            (p.startswith("[HEADER_STYLE]") and re.search(r'heading\s*1\b', p, re.I))
        )

        if is_major_chapter:
            headers.append((idx, clean_p))

    # 2. If no explicit major chapter markers exist, pick top-level numbered/style headers with enough paragraph gap between them
    if len(headers) < 2:
        candidate_headers = []
        for idx in range(body_start, total_len):
            p = paragraphs[idx]
            if is_toc_line(p) or p.startswith("[IMAGE_") or "[IMAGE_" in p:
                continue
            clean_p = p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
            if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p:
                continue
            if clean_p.upper() in ["MANUAL BOOK", "BACKPACK DF", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]:
                continue

            is_header_marked = p.startswith("[HEADER_STYLE]") or p.startswith("[NUMERIC_HEADER]")
            words = clean_p.split()
            is_short = len(words) <= 6 and not clean_p.endswith(".") and not clean_p.endswith(",") and not re.match(r'^(gambar|figure|fig\.)\s+\d', clean_p, re.I)

            if is_header_marked or is_short:
                candidate_headers.append((idx, clean_p))

        # Filter candidates: enforce minimum gap of at least 8-10 paragraphs between main chapters to prevent over-segmentation
        headers = []
        last_idx = -100
        for item in candidate_headers:
            if item[0] - last_idx >= 8:
                headers.append(item)
                last_idx = item[0]

    if not headers:
        return [{
            "title": "1. Panduan Penggunaan",
            "start_idx": body_start,
            "end_idx": total_len - 1
        }]

    # Cap maximum main chapters to 5 for a clean manual book structure
    if len(headers) > 6:
        # Pick evenly spaced top headers to keep max 5 sections
        step = len(headers) / 5.0
        headers = [headers[int(i * step)] for i in range(5)]

    sections = []
    sec_idx = 1
    for i in range(len(headers)):
        start_i, title_str = headers[i]
        end_i = headers[i+1][0] - 1 if i + 1 < len(headers) else total_len - 1

        title_str = re.sub(r'([A-Za-z\s\(\)\/\-\.\,]+)\d{1,3}$', r'\1', title_str).strip()
        
        # Clean any old prefix
        clean_title = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[A-Za-z0-9][\.\:\-])\s*', '', title_str, flags=re.I).strip()
        if not clean_title or "[IMAGE_" in clean_title or "IMAGE_" in clean_title or re.search(r'\[?IMAGE_\d+\]?', clean_title, re.I):
            clean_title = f"Fitur Utama {sec_idx}"

        formatted_title = f"{sec_idx}. {clean_title}"
        sec_idx += 1

        sections.append({
            "title": formatted_title,
            "start_idx": start_i,
            "end_idx": end_i
        })

    if sections:
        sections[0]["start_idx"] = body_start
        sections[-1]["end_idx"] = total_len - 1

    return sections
