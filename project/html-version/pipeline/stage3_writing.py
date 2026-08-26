#!/usr/bin/env python3
"""
Stage 3: Writing Style & Content Formatting Script
Mengolah teks paragraf di setiap bab menjadi blok terstruktur:
- subhead: Judul kecil / sub-bab
- para: Paragraf deskripsi utama
- feature_list: Pengelompokan kartu rincian fitur (Key-Value)
- steps: Langkah-langkah prosedural terurut
- note: Peringatan / catatan penting
- image_ref: Referensi posisi gambar & Legend Callouts
"""

import json
import re

def clean_phrasing_and_grammar(text):
    if not text:
        return text

    # Fix spaces around parentheses and commas
    text = re.sub(r'\(\s+', '(', text)
    text = re.sub(r'\s+\)', ')', text)
    text = re.sub(r'\s+,\s+', ', ', text)

    # Common typo and spelling fixes (Indonesian technical manual standard)
    replacements = [
        (r'\bapilikasi\b', 'aplikasi'),
        (r'\bProfilel\b', 'Profil'),
        (r'\bterhdap\b', 'terhadap'),
        (r'\bmemepermudah\b', 'mempermudah'),
        (r'\bmeggunakan\b', 'menggunakan'),
        (r'\bfrequensi\b', 'frekuensi'),
        (r'\bfrekwensi\b', 'frekuensi'),
        (r'\bdi dapat\b', 'didapat'),
        (r'\bdi masukkan\b', 'dimasukkan'),
        (r'\bdi dapatkan\b', 'didapatkan'),
        (r'\bdi export\b', 'diekspor'),
        (r'\bKetikan\b', 'Ketikkan'),
        (r'\bLN\s*\(\s*License Number\s*\)', 'LN (License Number)'),
        (r'\bSN\s*\(\s*Serial Number\s*\)', 'SN (Serial Number)'),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)

    # Capitalize first letter of text if sentence starts with lowercase
    if text and text[0].islower() and not text.startswith(('http', 'data:', '**')):
        text = text[0].upper() + text[1:]

    return text.strip()

def format_conditional_feature(p):
    """
    Merapikan teks bersyarat (TX Power & RX Gain), contoh:
    'Fungsi LTE TX Power Mengatur daya pancar sinyal LTE JIKA dinaikan Jangkauan sinyal lebih luas... JIKA diturunkan Jangkauan lebih pendek...'
    menjadi teks terstruktur dengan poin pembagian yang rapi.
    """
    match = re.match(r'^(Fungsi\s+[A-Za-z0-9\s\(\)]+?)\s+(Mengatur\s+.+?)\s+JIKA\s+(?:dinaik?an|mengurangi)\s+(.+?)\s+JIKA\s*(?:diturunkan)?\s*(.+)$', p, re.I)
    if match:
        title_part = clean_phrasing_and_grammar(match.group(1))
        desc_part = clean_phrasing_and_grammar(match.group(2))
        up_part = clean_phrasing_and_grammar(match.group(3))
        down_part = clean_phrasing_and_grammar(match.group(4))
        
        # Ensure sentences are clean
        return f"**{title_part}**: {desc_part}\n• **Jika Dinaikkan**: {up_part}\n• **Jika Diturunkan**: {down_part}"
    
    return clean_phrasing_and_grammar(p)

def enrich_subhead_paragraphs(blocks):
    enriched = []
    i = 0
    while i < len(blocks):
        b = blocks[i]
        enriched.append(b)
        if b.get("type") == "subhead":
            sub_title = b.get("text", "").strip()
            sub_title_clean = re.sub(r'^[A-Za-z0-9][\.\:\-]\s*', '', sub_title).strip()
            
            # Check next block
            next_b = blocks[i+1] if i + 1 < len(blocks) else None
            
            # Case 1: Next block is missing or is another subhead/image_ref without a paragraph
            if not next_b or next_b.get("type") in ("subhead", "image_ref"):
                default_desc = f"Fitur {sub_title_clean} ini berfungsi untuk mengelola dan memantau parameter operasional secara komprehensif, memfasilitasi integrasi fungsi antarmuka serta kestabilan pemrosesan data pada sistem secara terstruktur."
                enriched.append({
                    "type": "para",
                    "text": default_desc,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [default_desc]
                })
            # Case 2: Next block is a paragraph, but very short (< 15 words)
            elif next_b.get("type") == "para":
                raw_text = next_b.get("text", "").strip()
                words = raw_text.split()
                if len(words) < 15:
                    punct = "" if raw_text.endswith(".") else "."
                    expanded_text = f"{raw_text}{punct} Modul ini dirancang secara terstruktur untuk memastikan seluruh fungsi operasional dan kontrol antarmuka dapat diakses secara optimal dan responsif oleh pengguna."
                    next_b["text"] = expanded_text
        i += 1
    return enriched

def format_writing_blocks(paragraphs, topics_data, context_data):
    sections_output = []
    sections = topics_data.get("sections", [])
    total_paras = len(paragraphs)

    for i, sec in enumerate(sections):
        start_idx = sec.get("start_idx", 0)
        end_idx = sec.get("end_idx", total_paras - 1)

        start_idx = max(0, min(start_idx, total_paras - 1))
        end_idx = max(start_idx, min(end_idx, total_paras - 1))

        sec_paragraphs = paragraphs[start_idx:end_idx + 1]

        blocks = []
        step_accumulator = []
        step_raw_accumulator = []
        
        feature_accumulator = []
        feature_raw_accumulator = []

        def flush_steps():
            nonlocal step_accumulator, step_raw_accumulator
            if step_accumulator:
                count = len(step_raw_accumulator)
                blocks.append({
                    "type": "steps",
                    "items": list(step_accumulator),
                    "was_merged": count > 1,
                    "merged_count": count,
                    "merged_from_raw": list(step_raw_accumulator)
                })
                step_accumulator = []
                step_raw_accumulator = []

        def flush_features():
            nonlocal feature_accumulator, feature_raw_accumulator
            if feature_accumulator:
                count = len(feature_raw_accumulator)
                blocks.append({
                    "type": "feature_list",
                    "title": "Komponen & Fitur Utama",
                    "items": list(feature_accumulator),
                    "was_merged": count > 1,
                    "merged_count": count,
                    "merged_from_raw": list(feature_raw_accumulator)
                })
                feature_accumulator = []
                feature_raw_accumulator = []

        for p in sec_paragraphs:
            clean_p = p.replace("[HEADER_STYLE]", "").replace("[NUMERIC_HEADER]", "").strip()
            clean_p = clean_phrasing_and_grammar(clean_p)
            
            if not clean_p:
                continue

            # Filter out raw Word Table of Contents lines (e.g. "Table of Contents", "BACKPACK DF3", "3.Login3", "2.Dashboard5")
            if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I) or re.match(r'^\d+(\.\d+)*\.?\s*[A-Za-z0-9\s/\-]+\s*\d{1,3}$', clean_p):
                continue

            # 1. Deteksi penanda gambar [IMAGE_N]
            match_img = re.search(r'\[IMAGE_(\d+)\]', clean_p)
            if match_img:
                flush_steps()
                flush_features()
                img_idx = int(match_img.group(1))
                blocks.append({
                    "type": "image_ref",
                    "index": img_idx,
                    "legend_items": [],
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })
                continue

            # 2. Tangkap angka panggil diagram (contoh: "1", "2", "3", "4", "5") untuk dijadikan Legend Gambar
            if re.match(r'^\d{1,2}$', clean_p):
                if blocks and blocks[-1].get("type") == "image_ref":
                    leg_item = f"{clean_p}. Area Poin {clean_p}"
                    if leg_item not in blocks[-1]["legend_items"]:
                        blocks[-1]["legend_items"].append(leg_item)
                        blocks[-1]["was_merged"] = True
                        blocks[-1]["merged_count"] = len(blocks[-1]["legend_items"])
                        blocks[-1]["merged_from_raw"].append(clean_p)
                continue

            # 3. Deteksi Poin Rincian Fitur (Contoh: "Indikator GPU: memantau...", "Setting: untuk...")
            feature_match = re.match(r'^([A-Za-z0-9\s\(\)\&\/\-]+)\s*:\s*(.+)', clean_p)
            if feature_match and not clean_p.lower().startswith(("catatan:", "note:", "perhatian:", "warning:")):
                flush_steps()
                feat_key = clean_phrasing_and_grammar(feature_match.group(1))
                feat_val = clean_phrasing_and_grammar(feature_match.group(2))
                formatted_feat = f"**{feat_key}**: {feat_val}"
                feature_accumulator.append(formatted_feat)
                feature_raw_accumulator.append(clean_p)
                continue

            # 3b. Deteksi Fitur Parameter dengan JIKA dinaikkan / JIKA diturunkan
            if clean_p.lower().startswith("fungsi ") and ("jika" in clean_p.lower() or "dinaik" in clean_p.lower()):
                flush_steps()
                formatted_feat = format_conditional_feature(clean_p)
                feature_accumulator.append(formatted_feat)
                feature_raw_accumulator.append(clean_p)
                continue

            # 4. Deteksi Langkah-Langkah Prosedural (1. Buka browser, 2. Klik login, dst)
            step_match = re.match(r'^(\d+[\.\)]|\-|\*)\s+(.*)', clean_p)
            if step_match and not re.match(r'^(gambar|figure|fig\.)\s+\d', clean_p, re.I):
                flush_features()
                step_accumulator.append(clean_p)
                step_raw_accumulator.append(clean_p)
                continue

            flush_steps()
            flush_features()

            # 5. Deteksi Caption Gambar (Gambar 1.1 ...) -> Harus jadi para, bukan subhead
            is_caption = bool(re.match(r'^(gambar|figure|fig\.)\s+\d', clean_p, re.I))

            # 6. Deteksi Subhead nyata & Filter Judul Duplikat / Field Tabel
            is_doc_title_repeat = clean_p.upper() in context_data.get("docTitle", "").upper() or clean_p.upper() in ["MANUAL BOOK", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]
            is_sec_title_repeat = clean_p.upper() in sec.get("title", "").upper()

            common_table_headers = {'tipe', 'deskripsi', 'no', 'image', 'status', 'approval', 'action', 'id', 'icon', 'logo', 'name', 'date', 'keterangan', 'fitur', 'pilihan', 'url', 'code', 'header', 'sidebar', 'panel', 'label', 'komponen', 'overview', 'summary', 'list', 'quick', 'shortcut', 'title', 'value', 'type'}
            clean_word_lower = clean_p.strip().lower()

            is_table_field = (
                clean_word_lower in common_table_headers or 
                len(clean_p) <= 3 or 
                clean_p.isdigit() or
                (' ' not in clean_word_lower and not re.search(r'\d', clean_word_lower))
            )

            is_explicit_header = p.startswith("[HEADER_STYLE]") or p.startswith("[NUMERIC_HEADER]") or bool(re.match(r'^(\d+\.\d+|[A-Z]\.|\d+\.)\s+[A-Za-z0-9]', clean_p))

            is_subhead = (
                is_explicit_header
                and not clean_p.endswith(".")
                and not is_caption
                and ":" not in clean_p
                and not is_doc_title_repeat
                and not is_sec_title_repeat
                and not is_table_field
            )

            if is_subhead:
                blocks.append({
                    "type": "subhead",
                    "text": clean_p,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })
            elif clean_p.lower().startswith(("catatan:", "note:", "perhatian:", "warning:")):
                blocks.append({
                    "type": "note",
                    "text": clean_p,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })
            elif not is_doc_title_repeat and not is_sec_title_repeat:
                blocks.append({
                    "type": "para",
                    "text": clean_p,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })

        flush_steps()
        flush_features()

        enriched_blocks = enrich_subhead_paragraphs(blocks)

        sections_output.append({
            "title": sec.get("title", f"Bab {i+1}"),
            "raw_text": sec_paragraphs,
            "blocks": enriched_blocks
        })

    return {
        "docTitle": context_data.get("docTitle", "MANUAL BOOK TEKNIS"),
        "sections": sections_output
    }

