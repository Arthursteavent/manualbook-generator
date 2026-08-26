#!/usr/bin/env python3
"""
Pipeline Orchestrator (Streamlined 3-Stage Architecture)
1. Stage 1: Unified Context & Topic Determination (Context + Paragraph Index Topic Mapping)
2. Stage 2: Writing Style & Content Block Formatting
3. Stage 3: Legend & Visual Mapping
"""

import sys
import os
import json
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from stage1_context_topic import analyze_context_and_topics
from stage3_writing import format_writing_blocks
from stage4_legend import (process_legend_and_visuals, detect_glossary_table,
                           strip_table_markers, strip_glossary_heading)

def run_manualbook_pipeline(paragraphs, extracted_images, tables=None, ollama_url="http://172.15.5.30:11434/api/generate", model="deepseek-r1:32b"):
    start_time = time.time()
    print("[AI-SERVER] 🚀 Starting Streamlined Manual Book Pipeline...", flush=True)

    tables = tables or []

    # If the source DOCX has its own Glosarium/Daftar Istilah table, use it as-is
    # instead of asking the LLM to invent definitions later in Stage 3, and drop that
    # chapter's heading so Stage 1 doesn't reopen it as an empty chapter beside the
    # dedicated glossary page. Either way, [TABLE_N] markers are stripped before
    # Stage 1/2 since generic table content isn't rendered as a content block yet.
    glossary_from_doc, glossary_heading_idx, glossary_table_idx = detect_glossary_table(paragraphs, tables)
    paragraphs = strip_glossary_heading(paragraphs, glossary_heading_idx)
    if glossary_table_idx is not None:
        paragraphs = strip_table_markers(paragraphs, exclude_indices=[glossary_table_idx])

    # Stage 1: Context & Topic Determination
    print("[AI-SERVER] 📌 [Stage 1/3] Analyzing Context, Title & Section Paragraph Ranges...", flush=True)
    t1 = time.time()
    context_data, topics_data = analyze_context_and_topics(paragraphs, ollama_url=ollama_url, model=model)
    num_sections = len(topics_data.get("sections", []))
    print(f"[AI-SERVER] ✅ [Stage 1/3 Complete] Title: '{context_data.get('docTitle')}', Found {num_sections} sections ({time.time() - t1:.2f}s)", flush=True)

    # Stage 2: Writing & Content Block Formatting
    print("[AI-SERVER] 📌 [Stage 2/3] Formatting Content Blocks & Sentence Phrasing...", flush=True)
    t2 = time.time()
    structured_data = format_writing_blocks(paragraphs, topics_data, context_data, tables=tables)
    print(f"[AI-SERVER] ✅ [Stage 2/3 Complete] Content blocks formatted ({time.time() - t2:.2f}s)", flush=True)

    # Stage 3: Legend & Visual Mapping
    print("[AI-SERVER] 📌 [Stage 3/3] Mapping Visual Legends, Captions & Images...", flush=True)
    t3 = time.time()
    final_result = process_legend_and_visuals(structured_data, extracted_images, glossary_from_doc=glossary_from_doc, ollama_url=ollama_url, model=model)
    print(f"[AI-SERVER] ✅ [Stage 3/3 Complete] Images & Legends mapped ({time.time() - t3:.2f}s)", flush=True)

    total_duration = time.time() - start_time
    print(f"[AI-SERVER] 🎉 All Pipeline Stages Finished Successfully in {total_duration:.2f}s!", flush=True)

    return final_result

if __name__ == "__main__":
    print("Manual Book Pipeline Orchestrator loaded successfully.")
