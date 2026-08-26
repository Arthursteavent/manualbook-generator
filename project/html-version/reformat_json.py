#!/usr/bin/env python3
import json
import os
import re

def clean_phrasing_and_grammar(text):
    if not text:
        return text

    # Fix spaces around parentheses and commas
    text = re.sub(r'\(\s+', '(', text)
    text = re.sub(r'\s+\)', ')', text)
    text = re.sub(r'\s+,\s+', ', ', text)

    # Common typo and spelling fixes
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

    # Capitalize first letter of normal text
    if text and text[0].islower() and not text.startswith(('http', 'data:', '**')):
        text = text[0].upper() + text[1:]

    return text.strip()

def format_conditional_feature(p):
    """
    Format lines like:
    'Fungsi LTE TX Power Mengatur daya pancar sinyal LTE JIKA dinaikan Jangkauan sinyal lebih luas... JIKA diturunkan Jangkauan lebih pendek...'
    """
    p_clean = clean_phrasing_and_grammar(p)
    
    # 1. Standard pattern: Fungsi X Mengatur Y JIKA dinaikan A JIKA diturunkan B
    match = re.match(r'^(Fungsi\s+[A-Za-z0-9\s\(\)]+?)\s+(Mengatur\s+.+?)\s+JIKA\s+(?:dinaik?an|mengurangi)\s+(.+?)\s+JIKA\s*(?:diturunkan)?\s*(.+)$', p_clean, re.I)
    if match:
        title_part = clean_phrasing_and_grammar(match.group(1))
        desc_part = clean_phrasing_and_grammar(match.group(2))
        up_part = clean_phrasing_and_grammar(match.group(3))
        down_part = clean_phrasing_and_grammar(match.group(4))
        
        # Clean up 'jangkauan Perangkat' or lowercase starts
        if up_part and up_part[0].islower():
            up_part = up_part[0].upper() + up_part[1:]
        if down_part and down_part[0].islower():
            down_part = down_part[0].upper() + down_part[1:]

        return f"**{title_part}**: {desc_part}\n• **Jika Dinaikkan**: {up_part}\n• **Jika Diturunkan**: {down_part}"
    
    return p_clean

def reformat_project(file_path):
    print(f"Processing {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Clean raw_text if present in sections
    for sec in data.get("sections", []):
        if "raw_text" in sec and isinstance(sec["raw_text"], list):
            sec["raw_text"] = [clean_phrasing_and_grammar(t) for t in sec["raw_text"]]

        new_blocks = []
        blocks = sec.get("blocks", [])
        for b in blocks:
            btype = b.get("type")
            if btype in ("para", "subhead", "note"):
                text = b.get("text", "")
                if text.lower().startswith("fungsi ") and ("jika" in text.lower() or "dinaik" in text.lower()):
                    formatted_text = format_conditional_feature(text)
                    b["text"] = formatted_text
                    if "\n• " in formatted_text:
                        b["type"] = "para"
                else:
                    b["text"] = clean_phrasing_and_grammar(text)
                
                if "merged_from_raw" in b and isinstance(b["merged_from_raw"], list):
                    b["merged_from_raw"] = [clean_phrasing_and_grammar(x) for x in b["merged_from_raw"]]
            
            elif btype == "steps":
                if "items" in b and isinstance(b["items"], list):
                    b["items"] = [clean_phrasing_and_grammar(it) for it in b["items"]]
                if "merged_from_raw" in b and isinstance(b["merged_from_raw"], list):
                    b["merged_from_raw"] = [clean_phrasing_and_grammar(x) for x in b["merged_from_raw"]]

            elif btype == "feature_list":
                if "items" in b and isinstance(b["items"], list):
                    new_items = []
                    for item in b["items"]:
                        if "fungsi " in item.lower() and "jika" in item.lower():
                            new_items.append(format_conditional_feature(item))
                        else:
                            new_items.append(clean_phrasing_and_grammar(item))
                    b["items"] = new_items

            elif btype == "image_ref":
                if "legend_items" in b and isinstance(b["legend_items"], list):
                    b["legend_items"] = [clean_phrasing_and_grammar(it) for it in b["legend_items"]]
                if "merged_from_raw" in b and isinstance(b["merged_from_raw"], list):
                    b["merged_from_raw"] = [clean_phrasing_and_grammar(x) for x in b["merged_from_raw"]]

            new_blocks.append(b)

        sec["blocks"] = new_blocks

    # Save formatted data back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved clean JSON to {file_path}")

if __name__ == "__main__":
    target_dir = "/home/aio/manualbook-generator/project/html-version/projects/2026-07-22_19-17-53"
    file1 = os.path.join(target_dir, "2026-07-22_19-17-53.json")
    file2 = os.path.join(target_dir, "data.json")

    if os.path.exists(file1):
        reformat_project(file1)
    if os.path.exists(file2):
        reformat_project(file2)
