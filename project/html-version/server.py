#!/usr/bin/env python3
import os
import sys
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET
from http.server import SimpleHTTPRequestHandler, HTTPServer
import base64
import io
import re
import time

OLLAMA_URL = "http://172.15.5.30:11434/api/generate"
MODEL_NAME = "deepseek-r1:32b"

sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))
from orchestrator import run_manualbook_pipeline

def parse_multipart_file(headers, rfile):
    content_type = headers.get('Content-Type', '')
    if 'boundary=' not in content_type:
        return None, b''
    
    boundary = content_type.split('boundary=')[1].split(';')[0].strip().strip('"').encode('utf-8')
    content_length = int(headers.get('Content-Length', 0))
    body = rfile.read(content_length)

    parts = body.split(b'--' + boundary)
    for part in parts:
        if b'Content-Disposition:' in part and b'filename=' in part:
            header_part, content = part.split(b'\r\n\r\n', 1)
            content = content.rsplit(b'\r\n', 1)[0]
            header_str = header_part.decode('utf-8', errors='ignore')
            
            filename = "uploaded.docx"
            for line in header_str.split('\r\n'):
                if 'filename=' in line:
                    filename = line.split('filename=')[1].strip().strip('"')
            
            return filename, content

class ManualArchHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Quietly handle favicon and missing project json to avoid 404 spam in journalctl logs
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        if '/projects/' in self.path and self.path.endswith('.json'):
            target_path = self.translate_path(self.path)
            if not os.path.exists(target_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{}')
                return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/ai-generate':
            start_time = time.time()
            try:
                print(f"[AI-SERVER] 📥 Received POST /api/ai-generate request", flush=True)

                filename, file_bytes = parse_multipart_file(self.headers, self.rfile)
                if not file_bytes:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'No file uploaded or file empty'}).encode('utf-8'))
                    return

                print(f"[AI-SERVER] 📄 Uploaded file: {filename} ({len(file_bytes)} bytes)", flush=True)
                print(f"[AI-SERVER] 🔍 Extracting text & images from DOCX...", flush=True)

                z = zipfile.ZipFile(io.BytesIO(file_bytes))
                doc_xml = z.read("word/document.xml").decode("utf-8")
                root = ET.fromstring(doc_xml)

                def ln(tag):
                    return tag.split("}")[-1] if "}" in tag else tag

                paragraphs = []
                extracted_images = []

                rels = {}
                if 'word/_rels/document.xml.rels' in z.namelist():
                    rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
                    rels_root = ET.fromstring(rels_xml)
                    for rel in rels_root:
                        rid = rel.attrib.get('Id')
                        target = rel.attrib.get('Target')
                        if rid and target: rels[rid] = target

                for elem in root.iter():
                    if ln(elem.tag) == "p":
                        pStyle = ""
                        for child in elem.iter():
                            if ln(child.tag) == "pStyle":
                                pStyle = child.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') or child.attrib.get('val') or ""

                        texts = [t.text for t in elem.iter() if ln(t.tag) == "t" and t.text]
                        full_text = "".join(texts).strip()

                        for c in elem.iter():
                            tag_c = ln(c.tag)
                            if tag_c in ("blip", "imagedata", "graphic", "shape", "object", "drawing"):
                                for val in c.attrib.values():
                                    if val in rels:
                                        target = rels[val].replace('../', '').lstrip('/')
                                        target_path = 'word/' + target if not target.startswith('word/') else target
                                        if target_path in z.namelist():
                                            img_data = None
                                            try:
                                                img_data = z.read(target_path)
                                            except Exception as read_err:
                                                print(f"[AI-SERVER] ⚠️ Failed/Skipped image {target_path} (CRC/Zip error): {read_err}", flush=True)
                                            
                                            if img_data:
                                                ext = target.split('.')[-1].lower()
                                                mime = 'image/png' if ext in ('png', 'svg') else 'image/gif' if ext == 'gif' else 'image/jpeg'
                                                b64 = f"data:{mime};base64,{base64.b64encode(img_data).decode('utf-8')}"
                                                img_idx = len(extracted_images)
                                                extracted_images.append(b64)
                                                paragraphs.append(f"[IMAGE_{img_idx}]")
                                                break

                        if full_text:
                            # Intelligent header hint tagging
                            if re.match(r'^(Heading|Title|Header|Judul|Heading1|Heading2|Head)', pStyle, re.I):
                                full_text = f"[HEADER_STYLE] {full_text}"
                            elif re.match(r'^\d+(\.\d+)*[\.\)\:]\s+[A-Z0-9]', full_text) or re.match(r'^[A-Z][\.\)\:]\s+[A-Z0-9]', full_text):
                                full_text = f"[NUMERIC_HEADER] {full_text}"

                            paragraphs.append(full_text)

                print(f"[AI-SERVER] ════════════════════════════════════════════════════════════", flush=True)
                print(f"[AI-SERVER] 📥 NEW GENERATION REQUEST RECEIVED", flush=True)
                print(f"[AI-SERVER] 📄 File: {filename} ({len(file_bytes) / (1024*1024):.2f} MB)", flush=True)
                print(f"[AI-SERVER] 🔍 Extracting text nodes & embedded visual assets from DOCX...", flush=True)
                print(f"[AI-SERVER] ✅ Extraction Completed: {len(paragraphs)} text nodes & {len(extracted_images)} images extracted", flush=True)
                print(f"[AI-SERVER] 🚀 Initializing Ollama 4-Stage Manual Book Pipeline...", flush=True)

                parsed_json = run_manualbook_pipeline(
                    paragraphs=paragraphs,
                    extracted_images=extracted_images,
                    ollama_url=OLLAMA_URL,
                    model=MODEL_NAME
                )

                from datetime import datetime
                timestamp_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

                duration = round(time.time() - start_time, 2)
                sections_count = len(parsed_json.get('sections', []))
                print(f"[AI-SERVER] ✨ PIPELINE GENERATION COMPLETED SUCCESSFULLY!", flush=True)
                print(f"[AI-SERVER] 📊 Execution Summary: {duration}s total | {sections_count} chapters generated", flush=True)
                print(f"[AI-SERVER] 💾 Storage Location: projects/{timestamp_str}/", flush=True)
                print(f"[AI-SERVER] 🎯 HTTP 200 OK — Response delivered to browser", flush=True)
                print(f"[AI-SERVER] ════════════════════════════════════════════════════════════", flush=True)

                # Save generated JSON & physical images locally inside dedicated timestamp folder (projects/YYYY-MM-DD_HH-MM-SS/)
                project_folder_dir = os.path.join(os.path.dirname(__file__), 'projects', timestamp_str)
                images_dir = os.path.join(project_folder_dir, 'images')
                os.makedirs(images_dir, exist_ok=True)

                # Save physical extracted images to projects/TIMESTAMP/images/image_N.png
                saved_image_paths = []
                for idx, b64_str in enumerate(extracted_images):
                    try:
                        ext = "png"
                        if "image/jpeg" in b64_str or "image/jpg" in b64_str:
                            ext = "jpg"
                        elif "image/gif" in b64_str:
                            ext = "gif"
                        elif "image/svg" in b64_str:
                            ext = "svg"
                            
                        header, encoded = b64_str.split(",", 1) if "," in b64_str else ("", b64_str)
                        img_bytes = base64.b64decode(encoded)
                        
                        img_filename = f"image_{idx}.{ext}"
                        img_filepath = os.path.join(images_dir, img_filename)
                        with open(img_filepath, "wb") as img_f:
                            img_f.write(img_bytes)
                            
                        rel_path = f"images/{img_filename}"
                        saved_image_paths.append(rel_path)
                    except Exception as img_err:
                        print(f"[AI-SERVER] ⚠️ Failed saving image_{idx}: {img_err}", flush=True)

                # Attach image file paths and URLs to image_ref blocks in parsed_json
                if "sections" in parsed_json:
                    for sec in parsed_json["sections"]:
                        for blk in sec.get("blocks", []):
                            if blk.get("type") == "image_ref" and isinstance(blk.get("index"), int):
                                idx = blk["index"]
                                if idx < len(extracted_images):
                                    blk["image_file"] = saved_image_paths[idx] if idx < len(saved_image_paths) else ""
                                    blk["image_url"] = extracted_images[idx]

                save_filename = f"{timestamp_str}.json"
                save_filepath = os.path.join(project_folder_dir, save_filename)
                data_json_path = os.path.join(project_folder_dir, "data.json")

                parsed_json["_saved_folder"] = timestamp_str
                parsed_json["_saved_file"] = save_filename

                try:
                    with open(save_filepath, 'w', encoding='utf-8') as f:
                        json.dump(parsed_json, f, indent=2, ensure_ascii=False)
                    with open(data_json_path, 'w', encoding='utf-8') as f:
                        json.dump(parsed_json, f, indent=2, ensure_ascii=False)
                    print(f"[AI-SERVER] 💾 Saved generated JSON & {len(saved_image_paths)} images to projects/{timestamp_str}/", flush=True)
                except Exception as save_err:
                    print(f"[AI-SERVER] ⚠️ Failed saving local JSON copy: {save_err}", flush=True)

                response_bytes = json.dumps(parsed_json).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                print(f"[AI-SERVER] 🎯 Response delivered to browser successfully!", flush=True)

            except Exception as e:
                print(f"[AI-SERVER] ❌ Error processing request: {e}", flush=True)
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif self.path == '/api/save-pdf':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))

                folder_name = req_data.get('folder_name')
                pdf_b64 = req_data.get('pdf_base64')
                pdf_filename = req_data.get('filename') or f"{folder_name}.pdf"

                if not folder_name or not pdf_b64:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Missing folder_name or pdf_base64'}).encode('utf-8'))
                    return

                folder_path = os.path.join(os.path.dirname(__file__), 'projects', folder_name)
                os.makedirs(folder_path, exist_ok=True)

                if ',' in pdf_b64:
                    pdf_b64 = pdf_b64.split(',', 1)[1]

                pdf_bytes = base64.b64decode(pdf_b64)
                save_pdf_path = os.path.join(folder_path, pdf_filename)
                with open(save_pdf_path, 'wb') as f:
                    f.write(pdf_bytes)

                print(f"[AI-SERVER] 💾 Saved exported PDF locally to projects/{folder_name}/{pdf_filename} ({len(pdf_bytes)} bytes)", flush=True)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'saved_path': save_pdf_path}).encode('utf-8'))
            except Exception as e:
                print(f"[AI-SERVER] ❌ Error saving PDF: {e}", flush=True)
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            super().do_POST()

if __name__ == "__main__":
    port = 3002
    server = HTTPServer(('0.0.0.0', port), ManualArchHandler)
    print(f"[AI-SERVER] 🚀 Server active on http://0.0.0.0:{port}", flush=True)
    server.serve_forever()
