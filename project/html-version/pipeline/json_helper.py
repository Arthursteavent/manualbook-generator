#!/usr/bin/env python3
"""
JSON Helper Utility for Ollama LLM Responses
"""
import json
import re

def clean_and_repair_json(json_str):
    # 1. Strip reasoning <think>...</think> tags if present
    json_str = re.sub(r'<think>.*?</think>', '', json_str, flags=re.DOTALL).strip()
    
    # 2. Extract JSON object
    match = re.search(r'\{.*\}', json_str, re.DOTALL)
    if match:
        json_str = match.group(0)

    # 3. Try standard parse first
    try:
        return json.loads(json_str)
    except Exception:
        pass

    # 4. Repair trailing commas and missing delimiters
    json_str = re.sub(r',\s*([\]\}])', r'\1', json_str)
    json_str = re.sub(r'([}\]"0-9a-zA-Z])\s*\n\s*("[a-zA-Z0-9_]+\s*":|\{)', r'\1,\n\2', json_str)

    try:
        return json.loads(json_str)
    except Exception:
        pass

    # 5. Escape unescaped newlines within quote strings
    cleaned = []
    in_string = False
    for i, char in enumerate(json_str):
        if char == '"' and (i == 0 or json_str[i-1] != '\\'):
            in_string = not in_string
        if char == '\n' and in_string:
            cleaned.append('\\n')
        elif char == '\r' and in_string:
            cleaned.append('')
        elif char == '\t' and in_string:
            cleaned.append('\\t')
        else:
            cleaned.append(char)
    json_str = "".join(cleaned)

    return json.loads(json_str)
