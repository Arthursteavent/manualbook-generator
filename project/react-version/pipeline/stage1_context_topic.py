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

_HEADER_TAG_RE = re.compile(r'\[HEADER_STYLE(?:_\d+)?\]|\[NUMERIC_HEADER\]')

def clean_tags(p):
    if not p:
        return ""
    return _HEADER_TAG_RE.sub("", p).strip()

def is_caption_line(clean_p):
    """Detects image caption labels like 'Gambar 8' / 'Figure 8' so they're never
    mistaken for a chapter/section heading, even if the source DOCX paragraph
    was (mis)styled with a Heading style."""
    if not clean_p:
        return False
    return bool(re.match(r'^(gambar|figure|fig\.?)\s+\d+\s*$', clean_p, re.I))

OLLAMA_URL = "http://172.15.5.30:11434/api/generate"
MODEL_NAME = "deepseek-r1:32b"

def is_toc_line(p):
    clean_p = clean_tags(p)
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
        clean_p = clean_tags(p)
        if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I):
            has_toc = True
            toc_end_idx = idx
        elif has_toc and is_toc_line(p):
            toc_end_idx = idx
        elif has_toc and (p.startswith("[HEADER_STYLE") or p.startswith("[NUMERIC_HEADER]")):
            return idx
    if has_toc:
        return toc_end_idx + 1
    return 0

def extract_existing_toc_sections(paragraphs):
    body_start = get_body_start_idx(paragraphs)
    toc_idx = -1
    for idx in range(min(50, len(paragraphs))):
        p = paragraphs[idx]
        clean_p = clean_tags(p)
        if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I):
            toc_idx = idx
            break

    if toc_idx == -1:
        return None

    major_entries = []
    for idx in range(toc_idx + 1, min(toc_idx + 60, len(paragraphs))):
        p = paragraphs[idx]
        clean_p = clean_tags(p)
        
        # Stop collecting if body content header starts after TOC
        if idx >= body_start and p.startswith('[HEADER_STYLE') and not is_toc_line(p):
            break

        if "[TABLE_" in clean_p or "TABLE_" in clean_p or "[IMAGE_" in clean_p:
            continue

        # Clean trailing page numbers (e.g. "1. Transmission Data Acquisition 3" -> "1. Transmission Data Acquisition")
        clean_entry = re.sub(r'([A-Za-z0-9\s\(\)\/\-\.\,]+)\d{1,3}$', r'\1', clean_p).strip()
        
        # Exclude sub-decimals (e.g. 23.1, 230.1, 1.1) from Major Chapters
        is_sub_decimal = bool(re.match(r'^\d+\.\d+', clean_entry))

        # Accept major chapters (e.g. "BAB 1 ...", "1. ...", "2. ...", "A. ...").
        # Spasi setelah nomor dibuat opsional: pemisah pada Daftar Isi Word adalah
        # tab di elemen terpisah, jadi teksnya sering menyatu jadi "3.Login".
        is_major_chapter = bool(
            not is_sub_decimal and (
                p.startswith('[HEADER_STYLE_1]') or
                re.match(r'^(BAB|CHAPTER)\s+([IVXLCDM0-9]+)\b', clean_entry, re.I) or
                re.match(r'^[0-9]{1,2}\.[\s\t]*[A-Za-z]', clean_entry) or
                re.match(r'^[A-Z]\.[\s\t]*[A-Za-z]', clean_entry)
            )
        )
        if is_major_chapter:
            major_entries.append(clean_entry)

    if len(major_entries) < 1:
        return None

    print(f"[AI-SERVER] 📋 Found existing Table of Contents in DOCX with {len(major_entries)} sections!", flush=True)

    total_len = len(paragraphs)
    sections = []
    
    for i, title in enumerate(major_entries):
        clean_title = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[A-Za-z0-9][\.\:\-])\s*', '', title, flags=re.I).strip()
        if not clean_title or "[IMAGE_" in clean_title:
            continue
        
        # Normalize title for matching: lowercase, strip punct/numbers from front
        norm_title = re.sub(r'^\d+[\.\)]\s*', '', clean_title).strip().lower()
        
        match_idx = -1
        # Search ONLY in body content (AFTER TOC area) to avoid matching TOC lines
        for idx in range(body_start, total_len):
            p = paragraphs[idx]
            if is_toc_line(p):
                continue
            check_p = p
            clean_check_p = clean_tags(p)
            norm_check = re.sub(r'^\d+[\.\)]\s*', '', clean_check_p).strip().lower()
            
            # Strategy 1: Exact normalized match (most reliable)
            if norm_title and norm_check == norm_title:
                match_idx = idx
                break
            # Strategy 2: clean_title is fully contained in paragraph (also reliable)
            if clean_title.lower() in check_p.lower() and len(clean_title) >= 4:
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
    
    # Deduplicate: if two sections have same start_idx, keep only first
    deduped = [sections[0]]
    for s in sections[1:]:
        if s["start_idx"] != deduped[-1]["start_idx"]:
            deduped.append(s)
    sections = deduped
    
    if len(sections) < 2:
        return None
    
    if sections[0].get("start_idx") is None or sections[0]["start_idx"] < body_start:
        sections[0]["start_idx"] = body_start
    for i in range(len(sections) - 1):
        sections[i]["end_idx"] = sections[i+1]["start_idx"] - 1
    sections[-1]["end_idx"] = total_len - 1

    return sections

def analyze_context_and_topics(paragraphs, ollama_url=OLLAMA_URL, model=MODEL_NAME):
    # 1. Extrak judul asli dari paragraf awal dokumen (abaikan gambar & TOC).
    # Kandidat dibatasi pada halaman sampul, yaitu sebelum baris "DAFTAR ISI":
    # entri daftar isi tanpa nomor ("Gambaran Umum Sistem5") lolos dari is_toc_line
    # dan pernah terpakai sebagai subtitle cover.
    cover_limit = len(paragraphs)
    for idx, p in enumerate(paragraphs[:80]):
        if re.match(r'^(table of contents|daftar isi)$', clean_tags(p), re.I):
            cover_limit = idx
            break

    def pick_head_paragraphs(limit):
        return [p for p in paragraphs[:limit]
                if not p.startswith("[IMAGE_") and p.strip() and not is_toc_line(p)]

    head_paras = pick_head_paragraphs(cover_limit)
    if not head_paras:
        # Sampul hanya berisi gambar: pakai seluruh dokumen seperti perilaku lama
        # daripada membiarkan judul kosong.
        head_paras = pick_head_paragraphs(len(paragraphs))
    non_img_paras = [clean_tags(p) for p in head_paras]

    # Ollama tetap dibekali awal isi dokumen bila sampulnya cuma satu-dua baris,
    # supaya penentuan systemName tidak kehilangan konteks.
    sample_paras = list(non_img_paras)
    if len(sample_paras) < 6:
        body_paras = [clean_tags(p) for p in paragraphs[get_body_start_idx(paragraphs):]
                      if not p.startswith("[IMAGE_") and p.strip() and not is_toc_line(p)]
        sample_paras += body_paras[:6 - len(sample_paras)]

    extracted_title = non_img_paras[0] if len(non_img_paras) >= 1 else ""
    # Baris kedua dipakai sebagai subtitle cover hanya bila memang teks biasa;
    # kalau ia judul Bab pertama, cover tidak boleh mencurinya. Pemeriksaan harus
    # dilakukan pada paragraf mentah karena clean_tags sudah membuang markernya.
    has_heading_marker = len(head_paras) >= 2 and head_paras[1].startswith("[HEADER_STYLE")
    extracted_subtitle = non_img_paras[1] if (len(non_img_paras) >= 2 and not has_heading_marker) else ""
    
    context_data = {
        "docTitle": extracted_title,
        "docSubtitle": extracted_subtitle,
        "systemName": extracted_title
    }

    # 2. Coba jalankan Ollama lokal untuk mengekstrak docTitle, docSubtitle, dan systemName secara cerdas dari teks dokumen asli
    if sample_paras:
        sample_header_text = "\n".join(sample_paras[:10])
        prompt_meta = f"""Anda adalah AI Senior Analis Dokumen Teknis Bahasa Indonesia.
Tugas Anda: Analisis teks awal dokumen berikut dan tentukan:
1. docTitle: Judul dokumen utama yang sebenarnya dari teks (DILARANG menggunakan teks dummy seperti "MANUAL BOOK TEKNIS" jika ada judul asli di teks).
2. docSubtitle: Subjudul atau deskripsi singkat dokumen (jika ada).
3. systemName: Nama sistem, modul, atau aplikasi yang dibahas.

Format output WAJIB JSON:
{{
  "docTitle": "Judul Asli Dokumen",
  "docSubtitle": "Subjudul Asli",
  "systemName": "Nama Sistem"
}}

Teks Awal Dokumen:
{sample_header_text}"""
        try:
            payload_meta = {
                "model": model,
                "prompt": prompt_meta,
                "format": "json",
                "stream": False
            }
            req_meta = urllib.request.Request(
                ollama_url,
                data=json.dumps(payload_meta).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req_meta, timeout=30) as resp_meta:
                res_meta = json.loads(resp_meta.read().decode("utf-8"))
                meta_json = clean_and_repair_json(res_meta.get("response", "{}"))
                if meta_json and isinstance(meta_json, dict):
                    if meta_json.get("docTitle") and len(str(meta_json["docTitle"]).strip()) > 2:
                        context_data["docTitle"] = str(meta_json["docTitle"]).strip()
                    if meta_json.get("docSubtitle"):
                        context_data["docSubtitle"] = str(meta_json["docSubtitle"]).strip()
                    if meta_json.get("systemName"):
                        context_data["systemName"] = str(meta_json["systemName"]).strip()
        except Exception as meta_err:
            print(f"[AI-SERVER] ⚠️ Ollama metadata extraction fallback: {meta_err}", flush=True)

    body_start = get_body_start_idx(paragraphs)

    # When explicit [HEADER_STYLE_1] markers exist in DOCX body text,
    # use explicit header topic partitioning for 100% accurate section boundaries based on real document headings.
    has_explicit_headers = any(p.startswith("[HEADER_STYLE_1]") for p in paragraphs[body_start:])
    if has_explicit_headers:
        heuristic_sections = fallback_heuristic_topics(paragraphs)
        if heuristic_sections and len(heuristic_sections) > 1:
            print("[AI-SERVER] 🚀 Using explicit Heading 1 styles from DOCX body directly!", flush=True)
            enhanced = enhance_generic_section_titles(heuristic_sections, paragraphs)
            return context_data, {"sections": enhanced}

    # CHECKER: Fallback to existing Table of Contents (Daftar Isi) if no explicit Heading 1 styles
    existing_toc_sections = extract_existing_toc_sections(paragraphs)
    if existing_toc_sections:
        print("[AI-SERVER] ✅ Preserved existing Table of Contents structure from DOCX document!", flush=True)
        enhanced = enhance_generic_section_titles(existing_toc_sections, paragraphs)
        return context_data, {"sections": enhanced}

    indexed_lines = [f"[{idx}] {p}" for idx, p in enumerate(paragraphs)]
    full_text = "\n".join(indexed_lines)

    prompt_text = f"""Anda adalah AI Senior Analis Dokumen Teknis Bahasa Indonesia.
Tugas Anda: Analisis teks berindeks berikut untuk:
1. Menentukan Judul Dokumen Utama (docTitle).
2. Membagi dokumen menjadi Bab Utama (sections) berdasarkan judul/heading asli dokumen beserta rentang indeks paragrafnya (start_idx & end_idx).

ATURAN PENTING:
- Gunakan judul heading ASLI dari dokumen (contoh: "1. Transmission Data Acquisition", "2. Dashboard Overview", dst). DILARANG membuat judul palsu jika tidak ada di dokumen!
- Perhatikan kontinuitas kalimat: Paragraf deskripsi yang bersambung dengan bab di atasnya WAJIB dimasukkan ke dalam bab yang sama!
- DILARANG memecah setiap poin fitur kecil menjadi Bab terpisah!

Format output WAJIB JSON:
{{
  "docTitle": "Judul Asli Dokumen",
  "systemName": "Nama Sistem",
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
        "stream": False
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
                    dt = str(data["docTitle"]).strip()
                    if not re.match(r'^\[?\d+\]?$', dt) and len(dt) > 2:
                        context_data["docTitle"] = dt
                if data.get("systemName"):
                    context_data["systemName"] = data["systemName"]

                if "sections" in data and isinstance(data["sections"], list) and len(data["sections"]) > 0:
                    normalized = sanitize_and_normalize_sections(data["sections"], len(paragraphs), paragraphs)
                    if normalized:
                        enhanced = enhance_generic_section_titles(normalized, paragraphs)
                        return context_data, {"sections": enhanced}
    except Exception as e:
        print(f"[AI-SERVER] ⚠️ [Unified Stage 1] AI Call Fallback: {e}", flush=True)

    # Fallback berbasis heurisitik dengan kontinuitas 100%
    fallback_sections = fallback_heuristic_topics(paragraphs)
    enhanced = enhance_generic_section_titles(fallback_sections, paragraphs)
    return context_data, {"sections": enhanced}

def enhance_generic_section_titles(sections, paragraphs):
    if not sections or not paragraphs:
        return sections
    
    for i, sec in enumerate(sections):
        title = sec.get("title", "")

        # Judul yang datang dari style Heading 1 asli dokumen tidak boleh ditebak
        # ulang: bab bernama "FITUR" itu judul sah penulis, bukan placeholder, dan
        # dulu tertimpa oleh judul sub-bab pertamanya.
        start_idx_raw = sec.get("start_idx")
        if isinstance(start_idx_raw, int) and 0 <= start_idx_raw < len(paragraphs):
            if paragraphs[start_idx_raw].startswith("[HEADER_STYLE"):
                continue

        # Get section number (e.g. "1" from "1. Introduction" or just use i+1)
        sec_num = i + 1
        num_match = re.match(r'^(\d+)\.', title)
        if num_match:
            sec_num = int(num_match.group(1))
            
        clean_title = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]+(\.[0-9]+)*\.?)\s*', '', title, flags=re.I).strip()
        clean_title = re.sub(r'^\[?\d+\]?\s*', '', clean_title).strip()
        
        is_generic = (
            clean_title.upper() in ["MANUAL BOOK", "PANDUAN", "FITUR", "FITUR UTAMA", "CONTENT", "UNTITLED", "INTRODUCTION", "PENDAHULUAN", "GUIDE"] or
            re.match(r'^(fitur|feature|chapter|bab|fitur utama)\s*\d+$', clean_title, re.I) or
            re.match(r'^\[?\d+\]?$', clean_title) or
            len(clean_title) < 3
        )
        
        if is_generic:
            better_title = None
            start_idx = sec.get("start_idx", 0)
            end_idx = sec.get("end_idx", len(paragraphs) - 1)
            
            # Scan paragraphs in this section to find a better title
            for idx in range(start_idx, min(end_idx + 1, start_idx + 15)):
                p = paragraphs[idx]
                clean_p = clean_tags(p)
                if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p:
                    continue
                
                # Check if this paragraph contains a period and extract the prefix before the period if it's short
                # (e.g., "Sniffer. Modul ini..." -> "Sniffer")
                first_sent = clean_p.split(".")[0].strip()
                if len(first_sent) > 2 and len(first_sent) < 30 and first_sent[0].isupper() and not any(x in first_sent.upper() for x in ["MANUAL BOOK", "PANDUAN", "FITUR", "FITUR UTAMA", "DRAFT"]):
                    better_title = first_sent
                    break
                
                # Otherwise, check clean_p itself
                clean_p_sub = re.sub(r'^([a-zA-Z]\.|\d+(\.\d+)*|\d+[\.\)\:]|\s)+', '', clean_p).strip()
                is_candidate = (
                    p.startswith("[HEADER_STYLE") or p.startswith("[NUMERIC_HEADER]") or
                    (len(clean_p_sub) > 3 and len(clean_p_sub) < 50 and not clean_p_sub.endswith(".") and clean_p_sub[0].isupper())
                )
                if is_candidate:
                    p_upper = clean_p_sub.upper()
                    if p_upper not in ["MANUAL BOOK", "PANDUAN", "FITUR", "FITUR UTAMA", "DAFTAR ISI", "TABLE OF CONTENTS"] and not re.match(r'^(fitur|feature|chapter|bab|fitur utama)\s*\d+$', p_upper, re.I):
                        better_title = clean_p_sub
                        break
            
            if better_title:
                sec["title"] = f"{sec_num}. {better_title}"
                print(f"[AI-SERVER] 💡 Enhanced generic section title from '{title}' to '{sec['title']}'", flush=True)
                
    return sections

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
                clean_p = clean_tags(check_p)
                is_header = (
                    check_p.startswith("[HEADER_STYLE") or 
                    check_p.startswith("[NUMERIC_HEADER]") or
                    re.match(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]+\.|\d+\.\d+|[A-Z]\.)\s+[A-Za-z0-9]', clean_p) or
                    clean_p.upper() in valid[i]["title"].upper()
                )
                if is_header and not check_p.startswith("[IMAGE_") and "[IMAGE_" not in check_p:
                    valid[i]["start_idx"] = st + offset
                    break

    if valid[0].get("start_idx") is None or valid[0]["start_idx"] < body_start:
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
        clean_p = clean_tags(p)
        if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p:
            continue

        is_doc_title_repeat = clean_p.upper() in ["MANUAL BOOK", "BACKPACK DF", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]
        if is_doc_title_repeat:
            continue

        # 1. Search FIRST for explicit main chapter markers (Heading 1 style [HEADER_STYLE_1], "BAB N ...", "CHAPTER N ...")
    headers = []
    for idx in range(body_start, total_len):
        p = paragraphs[idx]
        if is_toc_line(p) or p.startswith("[IMAGE_") or "[IMAGE_" in p or "[TABLE_" in p or "TABLE_" in p:
            continue
        clean_p = clean_tags(p)
        if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p or "[TABLE_" in clean_p or is_caption_line(clean_p):
            continue

        if clean_p.upper() in ["MANUAL BOOK", "BACKPACK DF", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]:
            continue

        is_explicit_bab = bool(
            p.startswith("[HEADER_STYLE_1]") or
            re.match(r'^(BAB|CHAPTER)\s+(\d+|[IVXLCDM]+)\b(?!\s*ini\b)', clean_p, re.I)
        )

        if is_explicit_bab:
            headers.append((idx, clean_p))

    # 2. If NO explicit BAB / Heading 1 markers exist, check for top-level numbered headings (e.g. 1. Title, 2. Title)
    if not headers:
        for idx in range(body_start, total_len):
            p = paragraphs[idx]
            if is_toc_line(p) or p.startswith("[IMAGE_") or "[IMAGE_" in p or "[TABLE_" in p or "TABLE_" in p:
                continue
            clean_p = clean_tags(p)
            if not clean_p or clean_p.startswith("[IMAGE_") or "[IMAGE_" in clean_p or "[TABLE_" in clean_p or is_caption_line(clean_p):
                continue
            if clean_p.upper() in ["MANUAL BOOK", "BACKPACK DF", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]:
                continue

            is_sub_decimal = bool(re.match(r'^\d+\.\d+', clean_p))

            is_top_numbered = bool(
                not is_sub_decimal and
                (
                    p.startswith("[HEADER_STYLE_1]") or
                    p.startswith("[HEADER_STYLE]") or
                    re.match(r'^[0-9]{1,2}\.[\s\t]+[A-Za-z0-9]', clean_p) or
                    re.match(r'^[A-Z]\.[\s\t]+[A-Za-z0-9]', clean_p)
                )
            )
            if is_top_numbered:
                headers.append((idx, clean_p))

    if not headers:
        first_p_clean = clean_tags(paragraphs[body_start]) if body_start < total_len else "Panduan Penggunaan"
        first_title = re.sub(r'^(BAB\s+[IVXLCDM0-9]+|[0-9]{1,2}\.[\s\t]+)\s*', '', first_p_clean, flags=re.I).strip() or "Panduan Penggunaan"
        return [{
            "title": f"1. {first_title}",
            "start_idx": body_start,
            "end_idx": total_len - 1
        }]

    sections = []
    sec_idx = 1
    for i in range(len(headers)):
        start_i, title_str = headers[i]
        end_i = headers[i+1][0] - 1 if i + 1 < len(headers) else total_len - 1

        title_str = clean_tags(title_str)
        title_str = re.sub(r'([A-Za-z\s\(\)\/\-\.\,]+)\d{1,3}$', r'\1', title_str).strip()
        
        # Clean any old prefix (BAB I, BAB 1, 1.1, 1., etc) and trailing punctuation
        clean_title = re.sub(r'^(BAB\s+(\d+|[IVXLCDM]+)\b|BAB|\d+(\.\d+)*)\s*[\:\.\-]?\s*', '', title_str, flags=re.I).strip()
        clean_title = re.sub(r'^[\:\.\-\s]+', '', clean_title).strip()
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
        if sections[0].get("start_idx") is None or sections[0]["start_idx"] < body_start:
            sections[0]["start_idx"] = body_start
        sections[-1]["end_idx"] = total_len - 1

    return sections
