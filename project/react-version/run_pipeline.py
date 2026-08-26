#!/usr/bin/env python3
import sys
import os
import json
import zipfile
import xml.etree.ElementTree as ET
import base64
import io
import re

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://172.15.5.30:11434/api/generate")
MODEL_NAME = os.environ.get("MODEL_NAME", "deepseek-r1:14b")

# Add pipeline directory to import path
sys.path.append(os.path.join(os.path.dirname(__file__), 'pipeline'))
from orchestrator import run_manualbook_pipeline

# Word style id -> kedalaman heading. Style id di document.xml biasanya tanpa spasi
# ("Heading1", "Heading2"), tetapi dokumen hasil konversi/localized bisa memakai
# "Heading 3", "Judul2", "Tajuk 4", dst.
_HEADING_STYLE_LEVEL_RE = re.compile(r'^(?:heading|head|hdg|judul|tajuk|kop)\s*[-_]?\s*([1-9])\b', re.I)
_TITLE_STYLE_RE = re.compile(r'^(?:title|judul\s*utama)\s*$', re.I)
_SUBTITLE_STYLE_RE = re.compile(r'^(?:subtitle|subjudul)\s*$', re.I)
_GENERIC_HEADING_STYLE_RE = re.compile(r'^(?:heading|head|header|judul|tajuk|kop)\b', re.I)
MAX_HEADING_LEVEL = 5


W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def _ln(tag):
    return tag.split("}")[-1] if "}" in tag else tag


def _wval(node):
    return node.attrib.get(W_NS + "val") or node.attrib.get("val") or ""


def iter_content(node):
    """Semua turunan elemen, kecuali isi mc:Fallback.

    mc:AlternateContent menyimpan dua versi objek yang sama (mc:Choice untuk Word
    modern, mc:Fallback berupa VML lama). Keduanya memuat teks identik, jadi kalau
    Fallback ikut dibaca setiap kotak teks tercatat dua kali - itu asal judul sampul
    "User ManualUser ManualAERISAERIS...".
    """
    for child in node:
        if _ln(child.tag) == "Fallback":
            continue
        yield child
        for sub in iter_content(child):
            yield sub


def paragraph_text(elem):
    """Teks sebuah w:p. Paragraf di dalam kotak teks (txbxContent) digabung dengan
    spasi supaya baris-baris sampul tidak menempel jadi satu kata."""
    inner_paras = [c for c in iter_content(elem) if _ln(c.tag) == "p"]
    if inner_paras:
        chunks = []
        for inner in inner_paras:
            part = "".join(t.text for t in iter_content(inner) if _ln(t.tag) == "t" and t.text).strip()
            if part:
                chunks.append(part)
        # Teks yang berada langsung di paragraf luar (di luar kotak teks)
        nested = {id(n) for p in inner_paras for n in iter_content(p)}
        own = "".join(t.text for t in iter_content(elem)
                      if _ln(t.tag) == "t" and t.text and id(t) not in nested).strip()
        if own:
            chunks.insert(0, own)
        return " ".join(chunks).strip()

    return "".join(t.text for t in iter_content(elem) if _ln(t.tag) == "t" and t.text).strip()


def load_style_map(z):
    """Peta styleId -> definisi style dari word/styles.xml.

    Wajib dibaca: banyak dokumen (ekspor Google Docs, LibreOffice, konverter PDF)
    memakai styleId buram berupa angka - w:pStyle val="4" - dan satu-satunya
    petunjuk bahwa itu Heading 3 ada pada w:name di dalam styles.xml.
    """
    styles = {}
    if 'word/styles.xml' not in z.namelist():
        return styles
    try:
        root = ET.fromstring(z.read('word/styles.xml').decode('utf-8'))
    except Exception as style_err:
        print(f"[AI-BRIDGE] ⚠️ Gagal membaca word/styles.xml: {style_err}", file=sys.stderr)
        return styles

    for st in root:
        if _ln(st.tag) != "style":
            continue
        style_id = st.attrib.get(W_NS + "styleId") or st.attrib.get("styleId")
        if not style_id:
            continue
        entry = {"name": "", "based_on": "", "outline": None}
        for child in st:
            tag_c = _ln(child.tag)
            if tag_c == "name":
                entry["name"] = _wval(child)
            elif tag_c == "basedOn":
                entry["based_on"] = _wval(child)
            elif tag_c == "pPr":
                for prop in child:
                    if _ln(prop.tag) == "outlineLvl":
                        try:
                            entry["outline"] = int(_wval(prop))
                        except (TypeError, ValueError):
                            entry["outline"] = None
        styles[style_id] = entry
    return styles


def load_numbering_map(z):
    """Peta numId -> is_bullet (bool) dari word/numbering.xml."""
    num_map = {}
    if 'word/numbering.xml' not in z.namelist():
        return num_map
    try:
        root = ET.fromstring(z.read('word/numbering.xml').decode('utf-8'))
        abstract_fmt = {}
        for elem in root:
            if _ln(elem.tag) == "abstractNum":
                abs_id = elem.attrib.get(W_NS + "abstractNumId") or elem.attrib.get("abstractNumId")
                if not abs_id:
                    continue
                fmt = "decimal"
                for child in elem.iter():
                    if _ln(child.tag) == "numFmt":
                        fmt = _wval(child)
                        break
                abstract_fmt[abs_id] = fmt

        for elem in root:
            if _ln(elem.tag) == "num":
                num_id = elem.attrib.get(W_NS + "numId") or elem.attrib.get("numId")
                if not num_id:
                    continue
                for child in elem:
                    if _ln(child.tag) == "abstractNumId":
                        abs_id = _wval(child)
                        fmt = abstract_fmt.get(abs_id, "decimal")
                        num_map[num_id] = (fmt.lower() == "bullet")
    except Exception as err:
        print(f"[AI-BRIDGE] ⚠️ Gagal membaca word/numbering.xml: {err}", file=sys.stderr)
    return num_map


def _level_from_style_token(token):
    """Kedalaman heading dari sepotong nama/id style. -1 = heading tanpa kedalaman jelas."""
    token = (token or "").strip()
    if not token:
        return 0
    m = _HEADING_STYLE_LEVEL_RE.match(token)
    if m:
        return min(int(m.group(1)), MAX_HEADING_LEVEL)
    if _TITLE_STYLE_RE.match(token):
        return 1
    if _SUBTITLE_STYLE_RE.match(token):
        return 2
    if _GENERIC_HEADING_STYLE_RE.match(token):
        return -1
    return 0


def resolve_style_heading_level(style_id, style_map, seen=None):
    """Telusuri styleId -> nama style -> outlineLvl -> style induk (basedOn)."""
    if not style_id:
        return 0
    seen = seen if seen is not None else set()
    if style_id in seen:
        return 0
    seen.add(style_id)

    generic = False
    entry = (style_map or {}).get(style_id) or {}

    for token in (style_id, entry.get("name")):
        lvl = _level_from_style_token(token)
        if lvl > 0:
            return lvl
        if lvl == -1:
            generic = True

    outline = entry.get("outline")
    if outline is not None and 0 <= outline <= 8:
        return min(outline + 1, MAX_HEADING_LEVEL)

    inherited = resolve_style_heading_level(entry.get("based_on"), style_map, seen)
    if inherited != 0:
        return inherited

    return -1 if generic else 0


def detect_heading_level(p_style, outline_lvl, full_text, has_num_pr, style_map=None):
    """Tentukan kedalaman heading sebuah paragraf Word.

    Mengembalikan 1..5 (Bab, Sub-Bab, Sub-Sub-Bab, dan seterusnya), -1 bila
    paragraf jelas sebuah heading tetapi kedalamannya tidak diketahui, atau 0
    bila paragraf bukan heading. Level di bawah 5 dipangkas ke 5 karena
    template manual book hanya merender sampai kedalaman kelima.
    """
    level = resolve_style_heading_level((p_style or "").strip(), style_map)
    if level > 0:
        return level

    # Style kustom bisa saja tidak punya nama yang mengandung "Heading", tetapi Word
    # menyimpan kedalamannya pada w:outlineLvl paragraf (0 = Heading 1, 9 = body text).
    if outline_lvl is not None and 0 <= outline_lvl <= 8 and not has_num_pr and len(full_text) < 200:
        return min(outline_lvl + 1, MAX_HEADING_LEVEL)

    return level

def extract_from_docx(docx_filepath, output_images_dir=None):
    with open(docx_filepath, 'rb') as f:
        file_bytes = f.read()

    z = zipfile.ZipFile(io.BytesIO(file_bytes))
    doc_xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(doc_xml)
    style_map = load_style_map(z)
    numbering_map = load_numbering_map(z)

    ln = _ln

    paragraphs = []
    extracted_images = []
    tables = []

    rels = {}
    if 'word/_rels/document.xml.rels' in z.namelist():
        rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
        rels_root = ET.fromstring(rels_xml)
        for rel in rels_root:
            rid = rel.attrib.get('Id')
            target = rel.attrib.get('Target')
            if rid and target:
                rels[rid] = target

    def attr_val(node):
        return node.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') or node.attrib.get('val') or ""

    def read_paragraph_properties(elem):
        """Baca w:pStyle & w:outlineLvl dari w:pPr milik paragraf itu sendiri.

        Wajib dibatasi pada pPr langsung, bukan elem.iter(): sebuah paragraf bisa
        memuat pPr lain di dalam w:pPrChange (revisi tracked changes) atau di dalam
        objek tertanam, dan mengambil yang terakhir membuat style heading terbaca
        sebagai style lama/asing.
        """
        p_style = ""
        outline_lvl = None
        for child in elem:
            if ln(child.tag) != "pPr":
                continue
            for prop in child:
                tag_p = ln(prop.tag)
                if tag_p == "pStyle" and not p_style:
                    p_style = attr_val(prop)
                elif tag_p == "outlineLvl" and outline_lvl is None:
                    try:
                        outline_lvl = int(attr_val(prop))
                    except (TypeError, ValueError):
                        outline_lvl = None
            break
        return p_style, outline_lvl

    def process_paragraph_elem(elem):
        pStyle, outlineLvl = read_paragraph_properties(elem)

        full_text = paragraph_text(elem)

        processed_targets = set()
        for c in iter_content(elem):
            tag_c = ln(c.tag)
            if tag_c in ("blip", "imagedata"):
                # Check if image is heavily cropped via srcRect (sibling of blip inside blipFill)
                skip_image = False
                if tag_c == "blip":
                    for candidate in elem.iter():
                        if ln(candidate.tag) == "blipFill":
                            has_our_blip = False
                            for child_of_bf in candidate:
                                if child_of_bf is c:
                                    has_our_blip = True
                                    break
                            if has_our_blip:
                                for sibling in candidate:
                                    if ln(sibling.tag) == "srcRect":
                                        try:
                                            l_crop = int(sibling.attrib.get('l', '0'))
                                            t_crop = int(sibling.attrib.get('t', '0'))
                                            r_crop = int(sibling.attrib.get('r', '0'))
                                            b_crop = int(sibling.attrib.get('b', '0'))
                                            visible_w = 100000 - l_crop - r_crop
                                            visible_h = 100000 - t_crop - b_crop
                                            visible_pct = (visible_w * visible_h) / (100000 * 100000) * 100
                                            if visible_pct < 10:
                                                print(f"[AI-BRIDGE] ⏭️  Skipping heavily-cropped image (visible {visible_pct:.1f}%)", file=sys.stderr)
                                                skip_image = True
                                        except (ValueError, TypeError):
                                            pass
                                break

                if skip_image:
                    continue

                for val in c.attrib.values():
                    if val in rels:
                        target = rels[val].replace('../', '').lstrip('/')
                        target_path = 'word/' + target if not target.startswith('word/') else target
                        if target_path in processed_targets:
                            continue
                        if target_path in z.namelist():
                            img_data = None
                            try:
                                img_data = z.read(target_path)
                            except Exception as read_err:
                                print(f"[AI-BRIDGE] ⚠️ Failed/Skipped image {target_path}: {read_err}", file=sys.stderr)

                            if img_data:
                                processed_targets.add(target_path)
                                ext = target.split('.')[-1].lower()
                                if ext not in ('png', 'jpeg', 'jpg', 'gif', 'svg', 'webp'):
                                    ext = 'png'
                                img_idx = len(extracted_images)

                                if output_images_dir:
                                    os.makedirs(output_images_dir, exist_ok=True)
                                    img_filename = f"image_{img_idx}.{ext}"
                                    img_filepath = os.path.join(output_images_dir, img_filename)
                                    with open(img_filepath, 'wb') as img_f:
                                        img_f.write(img_data)
                                    rel_path = f"images/{img_filename}"
                                    extracted_images.append(rel_path)
                                else:
                                    mime = 'image/png' if ext in ('png', 'svg') else 'image/gif' if ext == 'gif' else 'image/jpeg'
                                    b64 = f"data:{mime};base64,{base64.b64encode(img_data).decode('utf-8')}"
                                    extracted_images.append(b64)

                                paragraphs.append(f"[IMAGE_{img_idx}]")

        has_num_pr = any(ln(child.tag) == "numPr" for child in iter_content(elem))
        num_id = ""
        for child in iter_content(elem):
            if ln(child.tag) == "numId":
                num_id = attr_val(child)
                break

        # Check if numbering XML defines this numId as bullet
        is_num_bullet = numbering_map.get(num_id, False) if num_id else False

        style_name = (style_map.get(pStyle, {}).get("name") or pStyle or "")
        is_bullet_style = is_num_bullet or bool(re.search(r'\b(bullet|list\s*bullet)\b', style_name, re.I)) or bool(re.match(r'^(?:•|\-|\*|▪|▫|◦|⁃|–|—|\[BULLET\]|\u2022|\u25cf|\u25cb|\u25aa|\u25ab)\s*', full_text))
        is_number_style = (bool(num_id) and not is_num_bullet) or bool(re.search(r'\b(number|list\s*number|numbering)\b', style_name, re.I))
        is_numeric_text = bool(re.match(r'^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\)|Langkah\s*\d+)\s*', full_text, re.I))

        if full_text:
            if not full_text.startswith("[IMAGE_") and "[TABLE_" not in full_text and "TABLE_" not in full_text:
                heading_level = detect_heading_level(pStyle, outlineLvl, full_text, has_num_pr, style_map)
                if heading_level == 0 and re.match(r'^(BAB|CHAPTER)\s+(\d+|[IVXLCDM]+)\b', full_text, re.I):
                    heading_level = 1

                if heading_level > 0:
                    full_text = f"[HEADER_STYLE_{heading_level}] {full_text}"
                elif heading_level == -1:
                    full_text = f"[HEADER_STYLE] {full_text}"
                elif is_bullet_style and not re.match(r'^(?:•|\-|\*|▪|▫|◦|⁃|–|—|\[BULLET\]|\u2022|\u25cf|\u25cb|\u25aa|\u25ab)\s*', full_text):
                    full_text = f"• {full_text}"
                elif (has_num_pr or is_number_style) and not is_numeric_text and not is_bullet_style:
                    full_text = f"1. {full_text}"
                elif re.match(r'^\d+(\.\d+)*[\.\)\:]\s+[A-Za-z0-9]', full_text) or re.match(r'^[A-Z][\.\)\:]\s+[A-Za-z0-9]', full_text) or re.match(r'^(BAB|CHAPTER)\s+', full_text, re.I):
                    full_text = f"[NUMERIC_HEADER] {full_text}"

            paragraphs.append(full_text)

    def extract_cell_image(elem):
        for c in iter_content(elem):
            tag = ln(c.tag)
            if tag in ("blip", "imagedata"):
                for val in c.attrib.values():
                    if val in rels:
                        target = rels[val].replace('../', '').lstrip('/')
                        target_path = 'word/' + target if not target.startswith('word/') else target
                        if target_path in z.namelist():
                            try:
                                img_data = z.read(target_path)
                                if img_data:
                                    ext = target.split('.')[-1].lower()
                                    if ext not in ('png', 'jpeg', 'jpg', 'gif', 'svg', 'webp'):
                                        ext = 'png'
                                    cell_img_idx = len(tables) * 10 + 1
                                    if output_images_dir:
                                        os.makedirs(output_images_dir, exist_ok=True)
                                        img_filename = f"tbl_cell_{cell_img_idx}_{ext}"
                                        img_filepath = os.path.join(output_images_dir, img_filename)
                                        with open(img_filepath, 'wb') as img_f:
                                            img_f.write(img_data)
                                        return f"images/{img_filename}"
                                    else:
                                        mime = 'image/png' if ext in ('png', 'svg') else 'image/gif' if ext == 'gif' else 'image/jpeg'
                                        return f"data:{mime};base64,{base64.b64encode(img_data).decode('utf-8')}"
                            except Exception as read_err:
                                print(f"[AI-BRIDGE] ⚠️ Failed table cell image: {read_err}", file=sys.stderr)
        return None

    def cell_text(tc):
        # Join text and extracted cell images paragraph-by-paragraph
        parts = []
        for p in tc:
            if ln(p.tag) != "p":
                continue
            img_src = extract_cell_image(p)
            part = paragraph_text(p)
            if img_src:
                img_tag = f'<img src="{img_src}" style="max-height:80px; max-width:140px; width:auto; height:auto; object-fit:contain; border-radius:4px; display:inline-block; vertical-align:middle; margin:2px;" />'
                if part:
                    parts.append(f"{part} {img_tag}")
                else:
                    parts.append(img_tag)
            elif part:
                parts.append(part)
        return " ".join(parts).strip()

    def process_table_elem(elem):
        rows = []
        for tr in elem:
            if ln(tr.tag) != "tr":
                continue
            cells = [cell_text(tc) for tc in tr if ln(tc.tag) == "tc"]
            if any(cells):
                rows.append(cells)
        if rows:
            table_idx = len(tables)
            tables.append(rows)
            paragraphs.append(f"[TABLE_{table_idx}]")

    def walk(container):
        # Walk direct children in document order, descending into structural
        # wrappers (e.g. <w:sdt> content controls) but treating <w:tbl>/<w:p> as
        # units handled as a whole - a table's own <w:p> cells must NOT also be
        # walked here, or their text would be duplicated as flat paragraphs.
        for child in container:
            tag = ln(child.tag)
            if tag == "Fallback":
                # Salinan cadangan mc:AlternateContent - isinya sama dengan mc:Choice
                continue
            if tag == "tbl":
                process_table_elem(child)
            elif tag == "p":
                process_paragraph_elem(child)
            else:
                walk(child)

    body = None
    for elem in root.iter():
        if ln(elem.tag) == "body":
            body = elem
            break
    walk(body if body is not None else root)

    return paragraphs, extracted_images, tables

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 run_pipeline.py <path_to_docx> [output_json_path] [output_images_dir]", file=sys.stderr)
        sys.exit(1)

    docx_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    images_dir = sys.argv[3] if len(sys.argv) > 3 else None

    print(f"[AI-BRIDGE] 🚀 Starting docx extraction for {docx_path}...", file=sys.stderr)
    paragraphs, extracted_images, tables = extract_from_docx(docx_path, output_images_dir=images_dir)
    print(f"[AI-BRIDGE] ✅ Extracted {len(paragraphs)} text nodes, {len(extracted_images)} images & {len(tables)} tables.", file=sys.stderr)

    print(f"[AI-BRIDGE] 🤖 Running 4-Stage Manual Book Pipeline...", file=sys.stderr)
    parsed_json = run_manualbook_pipeline(
        paragraphs=paragraphs,
        extracted_images=extracted_images,
        tables=tables,
        ollama_url=OLLAMA_URL,
        model=MODEL_NAME
    )

    result = {
        "parsed_json": parsed_json,
        "extracted_images": extracted_images
    }

    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False)
        print(f"[AI-BRIDGE] 💾 Result saved to {output_path}", file=sys.stderr)
    else:
        print(json.dumps(result, ensure_ascii=False))
