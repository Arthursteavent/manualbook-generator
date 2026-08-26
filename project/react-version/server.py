#!/usr/bin/env python3
import os
import sys
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import base64
import io
import re
import time
import pymysql

OLLAMA_URL = "http://172.15.5.30:11434/api/generate"
MODEL_NAME = "deepseek-r1:14b"

sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))
from orchestrator import run_manualbook_pipeline

# ─── MySQL Database Configuration ─────────────────────────────────────────────
DB_CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'db_config.json')

def load_db_config():
    config = {
        'host': os.environ.get('MYSQL_HOST', '127.0.0.1'),
        'port': int(os.environ.get('MYSQL_PORT', 3306)),
        'user': os.environ.get('MYSQL_USER', 'root'),
        'password': os.environ.get('MYSQL_PASSWORD', ''),
        'database': os.environ.get('MYSQL_DB', 'manualarch_db'),
    }
    if os.path.exists(DB_CONFIG_FILE):
        try:
            with open(DB_CONFIG_FILE, 'r', encoding='utf-8') as f:
                file_cfg = json.load(f)
                config.update(file_cfg)
        except Exception as e:
            print(f"[DB-WARN] Could not read db_config.json: {e}", flush=True)
    return config

def get_db_connection():
    cfg = load_db_config()
    try:
        conn = pymysql.connect(
            host=cfg['host'],
            port=int(cfg['port']),
            user=cfg['user'],
            password=cfg['password'],
            database=cfg['database'],
            autocommit=True,
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except pymysql.err.OperationalError as e:
        if e.args[0] == 1049:  # Unknown database
            try:
                conn_no_db = pymysql.connect(
                    host=cfg['host'],
                    port=int(cfg['port']),
                    user=cfg['user'],
                    password=cfg['password'],
                    autocommit=True
                )
                with conn_no_db.cursor() as cursor:
                    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{cfg['database']}` DEFAULT CHARACTER SET utf8mb4;")
                conn_no_db.close()
                return get_db_connection()
            except Exception as create_err:
                print(f"[DB-ERROR] Failed auto-creating MySQL database `{cfg['database']}`: {create_err}", flush=True)
        return None
    except Exception as err:
        print(f"[DB-WARN] MySQL Connection failed ({cfg['host']}:{cfg['port']}, user={cfg['user']}): {err}", flush=True)
        return None

def init_db():
    conn = get_db_connection()
    if not conn:
        print(f"[DB-WARN] MySQL not connected. Using local fallback.", flush=True)
        return False

    try:
        with conn.cursor() as cursor:
            # Table: Users
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(64) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'Editor',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Seed default admin & user if empty
            cursor.execute("SELECT COUNT(*) as cnt FROM users;")
            row = cursor.fetchone()
            if row and row['cnt'] == 0:
                cursor.execute("""
                    INSERT INTO users (id, name, email, password, role) VALUES
                    ('usr_admin', 'Administrator', 'admin@manualarch.com', 'password123', 'Admin'),
                    ('usr_user', 'Standard User', 'user@manualarch.com', 'user123', 'Editor');
                """)
                print(f"[DB-INIT] Seeded default MySQL admin & user accounts.", flush=True)

            # Table: Projects
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id VARCHAR(128) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    folder_name VARCHAR(255),
                    data_json LONGTEXT,
                    user_email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
        conn.close()
        print(f"[DB-INIT] ✅ MySQL Database & Tables initialized successfully!", flush=True)
        return True
    except Exception as err:
        print(f"[DB-ERROR] Failed initializing MySQL tables: {err}", flush=True)
        if conn:
            conn.close()
        return False

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
    def send_json(self, data, status_code=200):
        try:
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
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

        # Prevent Python from rendering Directory Listing HTML when SPA route /projects/ is requested
        if self.path.rstrip('/') in ('/projects', '/users', '/editor'):
            self.send_response(404)
            self.end_headers()
            return

        if self.path == '/api/auth/users':
            conn = get_db_connection()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC;")
                        rows = cursor.fetchall()
                    conn.close()
                    for r in rows:
                        if r.get('created_at'):
                            r['created_at'] = str(r['created_at'])
                    self.send_json({'users': rows})
                    return
                except Exception as e:
                    if conn: conn.close()
                    self.send_json({'error': str(e)}, 500)
                    return

        if self.path.startswith('/api/projects/list'):
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            user_email = query_params.get('email', [''])[0].strip().lower()

            project_list = []
            seen_ids = set()

            conn = get_db_connection()
            if conn:
                try:
                    with conn.cursor() as cursor:
                        if user_email:
                            cursor.execute("""
                                SELECT id, title, folder_name, data_json, user_email, updated_at 
                                FROM projects 
                                WHERE LOWER(user_email) = %s OR user_email IS NULL OR user_email = ''
                                ORDER BY updated_at DESC;
                            """, (user_email,))
                        else:
                            cursor.execute("SELECT id, title, folder_name, data_json, user_email, updated_at FROM projects ORDER BY updated_at DESC;")
                        rows = cursor.fetchall()
                    conn.close()

                    for r in rows:
                        data_obj = None
                        if r.get('data_json'):
                            try:
                                data_obj = json.loads(r['data_json'])
                            except Exception:
                                pass

                        if not data_obj:
                            local_file = os.path.join(os.path.dirname(__file__), 'projects', r['id'], 'data.json')
                            if os.path.exists(local_file):
                                try:
                                    with open(local_file, 'r', encoding='utf-8') as f:
                                        data_obj = json.load(f)
                                except Exception:
                                    pass

                        updated_at = str(r['updated_at']) if r.get('updated_at') else ''
                        seen_ids.add(r['id'])
                        project_list.append({
                            'id': r['id'],
                            'name': r['title'] or (data_obj.get('meta', {}).get('title') if data_obj else 'Untitled Project'),
                            'title': r['title'] or (data_obj.get('meta', {}).get('title') if data_obj else 'Untitled Project'),
                            'folder_name': r['folder_name'],
                            'user_email': r['user_email'] or '',
                            'savedAt': updated_at,
                            'document': data_obj or {'meta': {'title': r['title']}, 'pages': []}
                        })
                except Exception as e:
                    print(f"[AI-SERVER] ⚠️ Error querying projects DB: {e}", flush=True)
                    if conn: conn.close()

            # Local filesystem fallback for any project folders missing in DB
            projects_dir = os.path.join(os.path.dirname(__file__), 'projects')
            if os.path.exists(projects_dir):
                for folder in os.listdir(projects_dir):
                    if folder in seen_ids:
                        continue
                    full_dir = os.path.join(projects_dir, folder)
                    if os.path.isdir(full_dir):
                        data_file = os.path.join(full_dir, 'data.json')
                        if os.path.exists(data_file):
                            try:
                                with open(data_file, 'r', encoding='utf-8') as f:
                                    data_obj = json.load(f)
                                title = data_obj.get('docTitle') or data_obj.get('meta', {}).get('title') or folder
                                mtime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(data_file)))
                                project_list.append({
                                    'id': folder,
                                    'name': title,
                                    'title': title,
                                    'folder_name': folder,
                                    'user_email': user_email,
                                    'savedAt': mtime,
                                    'document': data_obj
                                })
                            except Exception:
                                pass

            self.send_json({'projects': project_list})
            return

        if self.path.startswith('/api/projects/get'):
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            proj_id = query_params.get('id', [''])[0].strip()

            if not proj_id:
                self.send_json({'error': 'Project ID required'}, 400)
                return

            conn = get_db_connection()
            data_obj = None
            title = 'Untitled Project'
            user_email = ''
            saved_at = ''

            if conn:
                try:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT id, title, folder_name, data_json, user_email, updated_at FROM projects WHERE id = %s;", (proj_id,))
                        row = cursor.fetchone()
                    conn.close()
                    if row:
                        title = row['title']
                        user_email = row['user_email'] or ''
                        saved_at = str(row['updated_at']) if row.get('updated_at') else ''
                        if row.get('data_json'):
                            try:
                                data_obj = json.loads(row['data_json'])
                            except Exception:
                                pass
                except Exception as e:
                    if conn: conn.close()

            if not data_obj:
                local_file = os.path.join(os.path.dirname(__file__), 'projects', proj_id, 'data.json')
                if os.path.exists(local_file):
                    try:
                        with open(local_file, 'r', encoding='utf-8') as f:
                            data_obj = json.load(f)
                    except Exception:
                        pass

            if not data_obj:
                self.send_json({'error': 'Project not found'}, 404)
                return

            self.send_json({
                'id': proj_id,
                'name': title,
                'user_email': user_email,
                'savedAt': saved_at,
                'document': data_obj
            })
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
        if self.path == '/api/auth/login':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))
                email = req_data.get('email', '').strip().lower()
                password = req_data.get('password', '')

                conn = get_db_connection()
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT * FROM users WHERE LOWER(email) = %s;", (email,))
                        row = cursor.fetchone()
                    conn.close()

                    if not row:
                        self.send_json({'error': 'Email tidak terdaftar dalam MySQL.'}, 400)
                        return
                    if row['password'] != password:
                        self.send_json({'error': 'Password salah.'}, 400)
                        return

                    self.send_json({
                        'status': 'ok',
                        'user': {
                            'id': row['id'],
                            'name': row['name'],
                            'email': row['email'],
                            'role': row['role'],
                        }
                    })
                    return
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
                return

        elif self.path == '/api/auth/add-user':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))
                name = req_data.get('name', '').strip()
                email = req_data.get('email', '').strip().lower()
                password = req_data.get('password', '')
                role = req_data.get('role', 'Editor')

                if not name or not email or not password:
                    self.send_json({'error': 'Semua field (Nama, Email, Password) wajib diisi.'}, 400)
                    return

                conn = get_db_connection()
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT * FROM users WHERE LOWER(email) = %s;", (email,))
                        if cursor.fetchone():
                            conn.close()
                            self.send_json({'error': 'Email sudah terdaftar.'}, 400)
                            return
                        user_id = f"usr_{int(time.time()*1000)}"
                        cursor.execute(
                            "INSERT INTO users (id, name, email, password, role) VALUES (%s, %s, %s, %s, %s);",
                            (user_id, name, email, password, role)
                        )
                    conn.close()
                    self.send_json({'status': 'ok', 'message': f'Pengguna {name} ({email}) tersimpan ke MySQL.'})
                    return
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
                return

        elif self.path == '/api/auth/delete-user':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))
                email = req_data.get('email', '').strip().lower()

                conn = get_db_connection()
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("DELETE FROM users WHERE LOWER(email) = %s;", (email,))
                    conn.close()
                    self.send_json({'status': 'ok'})
                    return
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
                return

        elif self.path == '/api/projects/save':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))
                proj_id = req_data.get('id') or f"proj_{int(time.time()*1000)}"
                title = req_data.get('title', 'Untitled Project')
                folder_name = req_data.get('folder_name', proj_id)
                data_obj = req_data.get('data', {})
                data_json = json.dumps(data_obj, ensure_ascii=False)
                user_email = req_data.get('user_email', '')

                # 1. Always save locally to projects/ directory
                try:
                    projects_base = os.path.join(os.path.dirname(__file__), 'projects')
                    proj_dir = os.path.join(projects_base, proj_id)
                    os.makedirs(proj_dir, exist_ok=True)
                    with open(os.path.join(proj_dir, 'data.json'), 'w', encoding='utf-8') as f:
                        f.write(data_json)
                    print(f"[AI-SERVER] 💾 Saved project '{title}' locally to projects/{proj_id}/data.json", flush=True)
                except Exception as local_err:
                    print(f"[AI-SERVER] ⚠️ Local project save error: {local_err}", flush=True)

                # 2. Save to MySQL database table if connected
                conn = get_db_connection()
                if conn:
                    try:
                        with conn.cursor() as cursor:
                            cursor.execute("""
                                INSERT INTO projects (id, title, folder_name, data_json, user_email)
                                VALUES (%s, %s, %s, %s, %s)
                                ON DUPLICATE KEY UPDATE
                                    title = VALUES(title),
                                    folder_name = VALUES(folder_name),
                                    data_json = VALUES(data_json),
                                    user_email = VALUES(user_email);
                            """, (proj_id, title, folder_name, data_json, user_email))
                        conn.close()
                        print(f"[AI-SERVER] 🗄️ Saved project '{title}' to MySQL database table 'projects'", flush=True)
                    except Exception as db_err:
                        print(f"[AI-SERVER] ⚠️ MySQL save error: {db_err}", flush=True)
                        if conn: conn.close()

                self.send_json({'status': 'ok', 'id': proj_id})
                return
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
                return

        elif self.path == '/api/projects/delete':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                req_data = json.loads(body.decode('utf-8'))
                proj_id = req_data.get('id')

                if not proj_id:
                    self.send_json({'error': 'Project ID is required'}, 400)
                    return

                conn = get_db_connection()
                if conn:
                    with conn.cursor() as cursor:
                        cursor.execute("DELETE FROM projects WHERE id = %s;", (proj_id,))
                    conn.close()

                print(f"[AI-SERVER] 🗑️ Deleted project '{proj_id}' from MySQL table 'projects'", flush=True)
                self.send_json({'status': 'ok', 'message': f'Project {proj_id} deleted successfully'})
                return
            except Exception as e:
                self.send_json({'error': str(e)}, 500)
                return

        if self.path.startswith('/api/ai-generate'):
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            gen_user_email = query_params.get('email', [''])[0].strip().lower()

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

                def attr_val(node):
                    return node.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') or node.attrib.get('val') or ""

                numbering_map = {}
                if 'word/numbering.xml' in z.namelist():
                    try:
                        n_root = ET.fromstring(z.read('word/numbering.xml').decode('utf-8'))
                        abs_fmt = {}
                        for elem in n_root:
                            if ln(elem.tag) == "abstractNum":
                                a_id = elem.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}abstractNumId') or elem.attrib.get("abstractNumId")
                                if a_id:
                                    fmt = "decimal"
                                    for child in elem.iter():
                                        if ln(child.tag) == "numFmt":
                                            fmt = attr_val(child)
                                            break
                                    abs_fmt[a_id] = fmt
                        for elem in n_root:
                            if ln(elem.tag) == "num":
                                n_id = elem.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numId') or elem.attrib.get("numId")
                                if n_id:
                                    for child in elem:
                                        if ln(child.tag) == "abstractNumId":
                                            a_id = attr_val(child)
                                            numbering_map[n_id] = (abs_fmt.get(a_id, "decimal").lower() == "bullet")
                    except Exception as n_err:
                        print(f"[AI-SERVER] ⚠️ Gagal membaca numbering.xml: {n_err}", flush=True)

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

                # Running counters for Word native auto-numbering, keyed by
                # (numId, ilvl). Word stores no literal number in the text —
                # the value must be computed from paragraph order. Same numId
                # appearing again later continues its sequence (Word's
                # "continue numbering" behaviour).
                num_counters = {}

                for elem in root.iter():
                    if ln(elem.tag) == "p":
                        pStyle = ""
                        num_id = ""
                        num_ilvl = 0
                        for child in elem.iter():
                            if ln(child.tag) == "pStyle":
                                pStyle = child.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') or child.attrib.get('val') or ""
                            elif ln(child.tag) == "numId":
                                num_id = attr_val(child)
                            elif ln(child.tag) == "ilvl":
                                try:
                                    num_ilvl = int(attr_val(child) or "0")
                                except ValueError:
                                    num_ilvl = 0

                        texts = [t.text for t in elem.iter() if ln(t.tag) == "t" and t.text]
                        full_text = "".join(texts).strip()

                        is_num_bullet = numbering_map.get(num_id, False) if num_id else False
                        is_bullet_style = is_num_bullet or bool(re.search(r'\b(bullet|list\s*bullet)\b', pStyle, re.I)) or full_text.startswith(('•', '-', '*'))
                        has_num_pr = any(ln(child.tag) in ("numPr", "numLvl") for child in elem.iter())

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
                            # If Word native numbering (numPr / List style) was used without explicit
                            # text prefix, prepend the computed sequence number so the real Word
                            # numbering is preserved downstream.
                            if is_bullet_style and not full_text.startswith(('•', '-', '*')):
                                full_text = f"• {full_text}"
                            elif has_num_pr and not is_bullet_style and not re.match(r'^(\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))', full_text) and not full_text.startswith(('•', '-', '*')):
                                key = (num_id, num_ilvl)
                                num_counters[key] = num_counters.get(key, 0) + 1
                                for deeper in [k for k in num_counters if k[0] == num_id and k[1] > num_ilvl]:
                                    del num_counters[deeper]
                                full_text = f"{num_counters[key]}. {full_text}"

                            # Intelligent header hint tagging
                            if re.match(r'^(Heading\s*1|Heading1|Title|Judul\s*1|Judul Utama)', pStyle, re.I):
                                full_text = f"[HEADER_STYLE_1] {full_text}"
                            elif re.match(r'^(Heading\s*2|Heading2|Subtitle|Subjudul|Judul\s*2)', pStyle, re.I):
                                full_text = f"[HEADER_STYLE_2] {full_text}"
                            elif re.match(r'^(Heading\s*3|Heading3|Judul\s*3|Heading\s*30)', pStyle, re.I):
                                full_text = f"[HEADER_STYLE_3] {full_text}"
                            elif re.match(r'^\d+\.\d+\.\d+[\.\)\:]?\s+[A-Z0-9]', full_text):
                                full_text = f"[HEADER_STYLE_3] {full_text}"
                            elif re.match(r'^\d+\.\d+[\.\)\:]?\s+[A-Z0-9]', full_text):
                                full_text = f"[HEADER_STYLE_2] {full_text}"
                            elif re.match(r'^(Heading|Title|Header|Judul|Head)', pStyle, re.I):
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

                # Save original uploaded Word file
                try:
                    original_docx_path = os.path.join(project_folder_dir, "original.docx")
                    with open(original_docx_path, "wb") as docx_f:
                        docx_f.write(file_bytes)
                    print(f"[AI-SERVER] 💾 Saved original Word document to {original_docx_path}", flush=True)
                except Exception as docx_save_err:
                    print(f"[AI-SERVER] ⚠️ Failed saving original Word document: {docx_save_err}", flush=True)

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

                # Also save project record into MySQL database if connected
                conn = get_db_connection()
                if conn:
                    try:
                        with conn.cursor() as cursor:
                            cursor.execute("""
                                INSERT INTO projects (id, title, folder_name, data_json, user_email)
                                VALUES (%s, %s, %s, %s, %s)
                                ON DUPLICATE KEY UPDATE
                                    title = VALUES(title),
                                    folder_name = VALUES(folder_name),
                                    data_json = VALUES(data_json),
                                    user_email = VALUES(user_email);
                            """, (timestamp_str, parsed_json.get('docTitle', 'AI Generated Manual'), timestamp_str, json.dumps(parsed_json, ensure_ascii=False), gen_user_email))
                        conn.close()
                        print(f"[AI-SERVER] 🗄️ Saved project record for user '{gen_user_email}' to MySQL database table 'projects'", flush=True)
                    except Exception as db_save_err:
                        print(f"[AI-SERVER] ⚠️ Could not save project record to MySQL: {db_save_err}", flush=True)
                        if conn: conn.close()

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
            self.send_json({'error': 'Endpoint not found'}, 404)

if __name__ == "__main__":
    init_db()
    port = 3002
    server = ThreadingHTTPServer(('0.0.0.0', port), ManualArchHandler)
    print(f"[AI-SERVER] 🚀 Server active on http://0.0.0.0:{port}", flush=True)
    server.serve_forever()
