#!/usr/bin/env python3
"""
AI Manual Book Processor (CLI Utility)
Membaca file DOCX, mengekstrak teks & gambar, lalu memanggil 4-Stage Pipeline
untuk menghasilkan struktur JSON terstruktur siap-render ke HTML Portrait.
"""

import sys
import os
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET

sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))
from orchestrator import run_manualbook_pipeline

OLLAMA_URL = "http://172.15.5.30:11434/api/generate"
MODEL_NAME = "deepseek-r1:32b"

def extract_docx_content(docx_path):
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File tidak ditemukan: {docx_path}")

    z = zipfile.ZipFile(docx_path)
    doc_xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(doc_xml)

    def ln(tag):
        return tag.split("}")[-1] if "}" in tag else tag

    paragraphs = []
    image_count = 0

    for elem in root.iter():
        if ln(elem.tag) == "p":
            texts = [t.text for t in elem.iter() if ln(t.tag) == "t" and t.text]
            full_text = "".join(texts).strip()
            
            # Check for images
            has_img = any(ln(child.tag) in ("blip", "imagedata") for child in elem.iter())
            if has_img:
                paragraphs.append(f"[IMAGE_{image_count}]")
                image_count += 1
            if full_text:
                paragraphs.append(full_text)

    return paragraphs

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ai_processor.py <path_to_docx>")
        sys.exit(1)

    docx_file = sys.argv[1]
    print(f"[*] Membaca {docx_file}...")
    paras = extract_docx_content(docx_file)
    print(f"[*] Mengekstrak {len(paras)} elemen...")
    print(f"[*] Menjalankan 4-Stage Manual Book Pipeline...")
    result_json = run_manualbook_pipeline(paras, [], ollama_url=OLLAMA_URL, model=MODEL_NAME)
    print("\n=== HASIL JSON TERSTRUKTUR DARI 4-STAGE PIPELINE ===")
    print(json.dumps(result_json, indent=2, ensure_ascii=False))
