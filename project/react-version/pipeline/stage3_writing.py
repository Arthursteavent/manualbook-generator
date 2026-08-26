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

_HEADER_TAG_RE = re.compile(r'\[HEADER_STYLE(?:_\d+)?\]|\[NUMERIC_HEADER\]')
_HEADER_STYLE_MARKER_RE = re.compile(r'^\[HEADER_STYLE(?:_(\d+))?\]')
MAX_HEADING_LEVEL = 5

# Kedalaman heading -> tipe blok yang dikenali renderer A4 di frontend.
# Level 1 (Bab) hanya muncul di sini bila stage 1 gagal memotongnya jadi section
# tersendiri; ia tetap dirender sebagai sub-bab agar judulnya tidak hilang.
HEADING_LEVEL_BLOCK_TYPES = {
    1: "subhead",
    2: "subhead",
    3: "sub_subhead",
    4: "sub_sub_subhead",
    5: "sub_sub_sub_subhead",
}


def strip_header_tags(p):
    if not p:
        return ""
    return _HEADER_TAG_RE.sub("", p).strip()


def header_marker_level(p):
    """Kedalaman heading dari marker [HEADER_STYLE_N] yang ditanam extractor DOCX.

    Mengembalikan 0 bila paragraf tidak bertanda heading. Marker generik
    [HEADER_STYLE] (style heading tanpa nomor) dianggap sub-bab (level 2).
    """
    m = _HEADER_STYLE_MARKER_RE.match(p or "")
    if not m:
        return 0
    if not m.group(1):
        return 2
    return min(int(m.group(1)), MAX_HEADING_LEVEL)


def numbering_depth(text):
    """Kedalaman heading yang ditulis manual sebagai penomoran ("1.2.3 Judul" -> 3).

    Mengembalikan 0 bila teks tidak diawali penomoran bertingkat.
    """
    m = re.match(r'^(\d+(?:\.\d+)*)(?=[\s\.\:\)\-]|$)', (text or "").strip())
    if not m:
        return 0
    return min(len(m.group(1).split('.')), MAX_HEADING_LEVEL)


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
    return blocks

def merge_consecutive_short_paragraphs(blocks):
    new_blocks = []
    i = 0
    n = len(blocks)
    while i < n:
        b = blocks[i]
        if b.get("type") == "para":
            txt = b.get("text", "").strip()
            # If current block is a short item (under 70 chars)
            if 0 < len(txt) < 70:
                group = [b]
                j = i + 1
                while j < n:
                    next_b = blocks[j]
                    if next_b.get("type") == "para":
                        next_txt = next_b.get("text", "").strip()
                        if 0 < len(next_txt) < 70 and not (next_txt.endswith('.') and len(next_txt.split()) > 10):
                            group.append(next_b)
                            j += 1
                        else:
                            break
                    else:
                        break

                prev_txt = new_blocks[-1].get("text", "") if new_blocks and new_blocks[-1].get("type") == "para" else ""
                is_intro_list = any(w in prev_txt.lower() for w in ["berikut", "terdiri dari", "antara lain", "yaitu", "meliputi", "sebagai berikut"]) or prev_txt.endswith(":")

                if len(group) >= 2 or (len(group) >= 1 and is_intro_list):
                    items = [g.get("text", "").strip() for g in group if g.get("text", "").strip()]
                    if len(items) >= 2 or (len(items) >= 1 and is_intro_list):
                        new_blocks.append({
                            "type": "steps",
                            "items": items,
                            "was_merged": True,
                            "merged_count": len(items),
                            "merged_from_raw": items
                        })
                        i = j
                        continue

        new_blocks.append(b)
        i += 1
    return new_blocks

def is_key_value_table(raw_rows):
    """
    Mendeteksi apakah tabel [TABLE_N] sebenarnya adalah daftar rincian field / 
    pasangan Kunci-Nilai (Key-Value Field Description List) yang dibuat dari
    tabel Word borderless.
    """
    if not raw_rows or len(raw_rows) < 1:
        return False

    common_headers = {
        'no', 'number', '#', 'nama', 'name', 'fitur', 'feature', 'deskripsi', 'description', 
        'keterangan', 'status', 'aksi', 'action', 'approval', 'tipe', 'type', 'parameter', 
        'nilai', 'value', 'url', 'image', 'gambar', 'icon', 'logo', 'id', 'code', 'kode',
        'istilah', 'term', 'definisi', 'definition', 'penjelasan', 'explanation',
        'modul', 'module', 'fungsi', 'function', 'komponen', 'component', 'kategori', 'category'
    }

    first_row_cleaned = [r.strip().lower() for r in raw_rows[0] if r.strip()]
    if len(first_row_cleaned) >= 2:
        matches = sum(1 for c in first_row_cleaned if c in common_headers)
        if matches >= 1 or any(c in common_headers for c in first_row_cleaned):
            return False

    key_value_rows = 0
    total_valid_rows = 0

    for row in raw_rows:
        non_empty = [c.strip() for c in row if c.strip() and c.strip() != ':']
        if not non_empty:
            continue
        total_valid_rows += 1

        first_cell = non_empty[0]
        first_cell_clean = re.sub(r'[\:\.\-]$', '', first_cell).strip()
        
        if len(first_cell_clean) < 45 and (len(non_empty) >= 2 or ':' in first_cell):
            key_value_rows += 1

    if total_valid_rows > 0 and (key_value_rows / total_valid_rows) >= 0.7:
        return True

    return False

def format_writing_blocks(paragraphs, topics_data, context_data, tables=None):
    sections_output = []
    sections = topics_data.get("sections", [])
    total_paras = len(paragraphs)
    tables = tables or []

    # Kalau penulis dokumen sudah memakai style Heading Word, hierarkinya dianggap
    # sudah lengkap: tebakan berbasis kata kunci dimatikan supaya kalimat biasa
    # ("Konfigurasi berhasil diterapkan apabila...") tidak ikut jadi sub-bab dan
    # menggeser penomoran judul di bawahnya.
    has_explicit_word_headings = any(header_marker_level(p) > 0 for p in paragraphs)

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

        bullet_accumulator = []
        bullet_raw_accumulator = []

        def flush_all():
            nonlocal bullet_accumulator, bullet_raw_accumulator, step_accumulator, step_raw_accumulator, feature_accumulator, feature_raw_accumulator
            if bullet_accumulator:
                count = len(bullet_raw_accumulator)
                blocks.append({
                    "type": "bullets",
                    "items": list(bullet_accumulator),
                    "was_merged": count > 1,
                    "merged_count": count,
                    "merged_from_raw": list(bullet_raw_accumulator)
                })
                bullet_accumulator = []
                bullet_raw_accumulator = []

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

            if feature_accumulator:
                count = len(feature_raw_accumulator)
                blocks.append({
                    "type": "feature_list",
                    "title": "",
                    "items": list(feature_accumulator),
                    "was_merged": count > 1,
                    "merged_count": count,
                    "merged_from_raw": list(feature_raw_accumulator)
                })
                feature_accumulator = []
                feature_raw_accumulator = []

        def flush_steps():
            flush_all()

        def flush_features():
            flush_all()

        for p in sec_paragraphs:
            clean_p = strip_header_tags(p)
            clean_p = clean_phrasing_and_grammar(clean_p)
            marker_level = header_marker_level(p)
            
            if not clean_p:
                continue

            # Filter out raw Word Table of Contents lines (e.g. "Table of Contents", "BACKPACK DF3", "3.Login3", "2.Dashboard5")
            if re.match(r'^(table of contents|daftar isi)$', clean_p, re.I) or re.match(r'^\d+(\.\d+)*\.?\s*[A-Za-z0-9\s/\-]+\s*\d{1,3}$', clean_p):
                continue

            # 1. Deteksi penanda tabel [TABLE_N]
            match_tbl = re.search(r'\[TABLE_(\d+)\]', clean_p)
            if match_tbl:
                flush_all()
                t_idx = int(match_tbl.group(1))
                if t_idx < len(tables):
                    raw_rows = tables[t_idx]
                    if raw_rows:
                        table_title = ""
                        if blocks and blocks[-1].get("type") in ("para", "subhead"):
                            prev_text = blocks[-1].get("text", "").strip()
                            if re.match(r'^(tabel|table)\s*\d*[\:\.\-]?\s*', prev_text, re.I) or (len(prev_text) < 80 and prev_text.endswith(':')):
                                table_title = prev_text
                                blocks.pop()
                        
                        if len(raw_rows) > 1:
                            headers = raw_rows[0]
                            rows = raw_rows[1:]
                        else:
                            headers = []
                            rows = raw_rows

                        blocks.append({
                            "type": "table",
                            "title": table_title,
                            "headers": headers,
                            "rows": rows,
                            "was_merged": False,
                            "merged_count": 1,
                            "merged_from_raw": [clean_p]
                        })
                continue

            # 1.5. Deteksi penanda gambar [IMAGE_N]
            match_img = re.search(r'\[IMAGE_(\d+)\]', clean_p)
            if match_img:
                flush_all()
                img_idx = int(match_img.group(1))
                blocks.append({
                    "type": "image_ref",
                    "index": img_idx,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })
                continue

            # 2. Buang paragraf yang isinya hanya angka (nomor halaman / nomor panggil
            # yang tercecer di dokumen). Ini bukan kalimat, jadi tidak dijadikan blok apa pun.
            if re.match(r'^\d{1,2}$', clean_p):
                continue

            # 2.5 Deteksi Poin Langkah (Contoh: "Langkah 1 : Tekan...", "Langkah : Tekan...") -> Numbered Steps
            langkah_match = re.match(r'^(?:\[BULLET\]|•|\-|\*|▪|▫|◦|⁃|–|—|\u2022|\u25cf|\u25cb|\u25aa|\u25ab)?\s*(langkah(?:\s*\d+)?)\s*[\:\.\-]?\s*(.+)?$', clean_p, re.I)
            if langkah_match and not clean_p.lower().startswith(("catatan:", "note:", "perhatian:", "warning:")):
                if bullet_accumulator or feature_accumulator:
                    flush_all()
                lang_key = clean_phrasing_and_grammar(langkah_match.group(1))
                lang_val = clean_phrasing_and_grammar(langkah_match.group(2)) if langkah_match.group(2) else ""
                formatted_item = f"**{lang_key}**: {lang_val}" if lang_val else f"**{lang_key}**"
                step_accumulator.append(formatted_item)
                step_raw_accumulator.append(clean_p)
                continue

            # 2.6 Deteksi Poin Bullet Umum (Contoh: "• Poin 1", "- Poin 2", "▪ Poin 3", "[BULLET] Poin 4")
            # Jika diawali bullet tetapi isinya angka/langkah (mis. "• 1. Teks"), jangan masukan ke bullet
            bullet_match = re.match(r'^(?:\[BULLET\]|•|\-|\*|▪|▫|◦|⁃|–|—|\u2022|\u25cf|\u25cb|\u25aa|\u25ab|\u2013|\u2014|\u2023|\u25b6|\u25c0)\s*(.*)', clean_p)
            if bullet_match:
                item_content = bullet_match.group(1).strip()
                # Jika setelah bullet simbol ada pola penomoran numerik "1. ", serahkan ke step_match
                if re.match(r'^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\)|Langkah\s*\d+)\s*', item_content, re.I):
                    clean_p = item_content
                elif item_content:
                    if step_accumulator or feature_accumulator:
                        flush_all()
                    formatted_item = clean_phrasing_and_grammar(item_content)
                    bullet_accumulator.append(formatted_item)
                    bullet_raw_accumulator.append(clean_p)
                    continue

            is_explicit_header_line = (
                marker_level > 0 or
                bool(re.match(r'^BAB\s+(\d+|[IVXLCDM]+)\b', clean_p, re.I))
            )

            # Skip duplicating section main title paragraph inside content blocks
            sec_clean = re.sub(r'^(BAB\s+(\d+|[IVXLCDM]+)\b|BAB|\d+(\.\d+)*)\s*[\:\.\-]?\s*', '', sec.get("title", ""), flags=re.I).strip()
            para_clean = re.sub(r'^(BAB\s+(\d+|[IVXLCDM]+)\b|BAB|\d+(\.\d+)*)\s*[\:\.\-]?\s*', '', clean_p, flags=re.I).strip()
            is_sec_title_repeat = bool(sec_clean and para_clean and (sec_clean.upper() == para_clean.upper() or para_clean.upper() in sec_clean.upper()))
            if is_sec_title_repeat and p.startswith("[HEADER_STYLE_1]"):
                continue

            # 3. Deteksi Poin Rincian Fitur (Contoh: "Indikator GPU: memantau...", "Setting: untuk...")
            # Guard: paragraphs with any Word heading style must NOT be captured as feature items
            feature_match = re.match(r'^([A-Za-z0-9\s\(\)\&\/\-]+)\s*:\s*(.+)', clean_p)
            if feature_match and not is_explicit_header_line and not clean_p.lower().startswith(("catatan:", "note:", "perhatian:", "warning:")):
                if step_accumulator or bullet_accumulator:
                    flush_all()
                feat_key = clean_phrasing_and_grammar(feature_match.group(1))
                feat_val = clean_phrasing_and_grammar(feature_match.group(2))
                formatted_feat = f"**{feat_key}**: {feat_val}"
                feature_accumulator.append(formatted_feat)
                feature_raw_accumulator.append(clean_p)
                continue

            # 3b. Deteksi Fitur Parameter dengan JIKA dinaikkan / JIKA diturunkan
            if clean_p.lower().startswith("fungsi ") and ("jika" in clean_p.lower() or "dinaik" in clean_p.lower()):
                if step_accumulator or bullet_accumulator:
                    flush_all()
                formatted_feat = format_conditional_feature(clean_p)
                feature_accumulator.append(formatted_feat)
                feature_raw_accumulator.append(clean_p)
                continue

            # 4. Deteksi Langkah-Langkah Prosedural Angka / Numbering (1. Klik..., 10.canva, a. Item, dst)
            # Catatan: [NUMERIC_HEADER] SENGAJA tidak masuk exclusion ini. Tag itu hanya menandai
            # pola teks "1. Kata Kapital..." secara heuristik (bukan style Heading asli di Word),
            # jadi banyak menangkap item list bernomor biasa (mis. "1. Google Cloud", "2. Microsoft").
            # Item seperti itu harus tetap jadi list bernomor (steps), bukan malah dikecualikan lalu
            # berakhir sebagai subhead palsu di bagian 6 di bawah.
            is_explicit_num_header = (
                marker_level > 0 or
                bool(re.match(r'^\d+\.\d+(\.\d+)*\b', clean_p))
            )
            step_match = re.match(r'^(\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))\s*(.*)', clean_p)
            if step_match and not is_explicit_num_header and not re.match(r'^(gambar|figure|fig\.)\s+\d', clean_p, re.I):
                if bullet_accumulator or feature_accumulator:
                    flush_all()
                step_accumulator.append(clean_p)
                step_raw_accumulator.append(clean_p)
                continue

            flush_all()

            # 5. Deteksi Caption Gambar (Gambar 1.1 ...) -> Harus jadi para, bukan subhead
            is_caption = bool(re.match(r'^(gambar|figure|fig\.)\s+\d', clean_p, re.I))

            # 6. Deteksi Subhead nyata & Filter Judul Duplikat / Field Tabel
            doc_title = (context_data.get("docTitle", "") if context_data else "").strip()
            doc_subtitle = (context_data.get("docSubtitle", "") if context_data else "").strip()
            clean_p_upper = clean_p.upper()

            is_doc_title_repeat = (
                (bool(doc_title) and clean_p_upper == doc_title.upper()) or
                (bool(doc_subtitle) and clean_p_upper == doc_subtitle.upper()) or
                (bool(doc_title) and len(doc_title) >= 5 and doc_title.upper() in clean_p_upper and len(clean_p) <= len(doc_title) + 15) or
                clean_p_upper in ["MANUAL BOOK", "PANDUAN PENGGUNAAN", "SMART CONTENT WATCHER DASHBOARD APPLICATION"]
            )

            if is_doc_title_repeat:
                continue

            is_sec_title_repeat = clean_p_upper in sec.get("title", "").upper()

            common_table_headers = {'tipe', 'deskripsi', 'no', 'image', 'status', 'approval', 'action', 'id', 'icon', 'logo', 'name', 'date', 'keterangan', 'fitur', 'pilihan', 'url', 'code', 'header', 'sidebar', 'panel', 'label', 'komponen', 'overview', 'summary', 'list', 'quick', 'shortcut', 'title', 'value', 'type'}
            clean_word_lower = clean_p.strip().lower()

            is_explicit_word_header = marker_level > 0

            is_table_field = (
                not is_explicit_word_header and (
                    clean_word_lower in common_table_headers or 
                    len(clean_p) <= 3 or 
                    clean_p.isdigit() or
                    (' ' not in clean_word_lower and not re.search(r'\d', clean_word_lower))
                )
            )

            clean_p_no_dot = clean_p.rstrip('.').strip()
            clean_p_lower = clean_p_no_dot.lower()

            # Filter out non-heading result/description sentences, expected result, and table/image tags
            is_non_heading_text = (
                "[TABLE_" in clean_p or "TABLE_" in clean_p or "[IMAGE_" in clean_p or
                "expected result" in clean_p_lower or "hasil" == clean_p_lower or "komponen" == clean_p_lower or
                clean_p_lower.startswith(("perubahan ", "daftar pengguna", "akun pengguna")) or
                "berhasil disimpan" in clean_p_lower or "berhasil ditambahkan" in clean_p_lower or "berhasil ditampilkan" in clean_p_lower
            )

            # Judul tebakan: hanya dipakai untuk dokumen yang tidak memakai style
            # Heading Word, dan tetap ditolak bila berbentuk kalimat (diakhiri titik
            # dua/koma atau terlalu panjang untuk sebuah judul).
            is_guessed_header = (
                bool(re.match(r'^\d+(\.\d+)+\b', clean_p_no_dot)) or
                bool(re.match(r'^[A-Z]\.[\s\t]+[A-Za-z0-9]', clean_p_no_dot)) or
                (not has_explicit_word_headings and
                 bool(re.match(r'^(sub-?bab|fitur utama|modul|bagian utama|spesifikasi|konfigurasi|persyaratan sistem)\b', clean_p_no_dot, re.I)))
            )
            if is_guessed_header and (clean_p_no_dot.endswith((':', ',', ';')) or len(clean_p_no_dot) > 80):
                is_guessed_header = False

            is_explicit_header = not is_non_heading_text and (marker_level > 0 or is_guessed_header)

            is_subhead = (
                is_explicit_header
                and not is_caption
                and not is_doc_title_repeat
                and not is_sec_title_repeat
                and not is_table_field
                and len(clean_p_no_dot) < 120
            )

            if is_subhead:
                # Kedalaman diambil dari style Word (Heading 1..5). Penomoran manual
                # yang lebih dalam dari style-nya ("1.2.3" pada paragraf Heading 2)
                # tetap menang supaya hierarki tulisan penulis dokumen dihormati.
                text_depth = numbering_depth(clean_p_no_dot)
                heading_level = max(marker_level, text_depth if text_depth >= 2 else 0)
                if heading_level < 1:
                    heading_level = 2
                block_type = HEADING_LEVEL_BLOCK_TYPES.get(heading_level, "sub_sub_sub_subhead")
                blocks.append({
                    "type": block_type,
                    "level": heading_level,
                    "text": clean_p_no_dot,
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
            else:
                blocks.append({
                    "type": "para",
                    "text": clean_p,
                    "was_merged": False,
                    "merged_count": 1,
                    "merged_from_raw": [clean_p]
                })

        flush_all()

        enriched_blocks = enrich_subhead_paragraphs(blocks)

        sections_output.append({
            "title": sec.get("title", f"Bab {i+1}"),
            "raw_text": sec_paragraphs,
            "blocks": enriched_blocks
        })

    return {
        "docTitle": context_data.get("docTitle", ""),
        "docSubtitle": context_data.get("docSubtitle", ""),
        "systemName": context_data.get("systemName", ""),
        "sections": sections_output
    }

