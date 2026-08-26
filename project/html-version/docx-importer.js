/* ============================================================
   DOCX IMPORTER FOR MANUALARCH (AI-FREE)
   Extracts text, headings, lists, and images from DOCX and 
   converts them to Legacy HTML Template DOM structures.
============================================================ */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function esc(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---- self-contained ZIP reader (uses native DecompressionStream) ---- */
function readZip(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65557; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP tidak valid');
  const cdOffset = dv.getUint32(eocd + 16, true);
  const count = dv.getUint16(eocd + 10, true);
  const entries = {}; let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));
    entries[name] = { method, compSize, localOff };
    p += 46 + nameLen + extraLen + commentLen;
  }
  const dataOffset = e => {
    const ln = dv.getUint16(e.localOff + 26, true);
    const le = dv.getUint16(e.localOff + 28, true);
    return e.localOff + 30 + ln + le;
  };
  return {
    has: name => !!entries[name],
    async bytes(name) {
      const e = entries[name]; if (!e) return null;
      const start = dataOffset(e);
      const raw = buf.subarray(start, start + e.compSize);
      if (e.method === 0) return raw;
      if (typeof DecompressionStream === 'undefined') throw new Error('Browser tidak mendukung DecompressionStream. Gunakan Chrome/Edge terbaru.');
      const ds = new DecompressionStream('deflate-raw');
      const s = new Blob([raw]).stream().pipeThrough(ds);
      return new Uint8Array(await new Response(s).arrayBuffer());
    },
    async text(name) { const b = await this.bytes(name); return b ? new TextDecoder('utf-8').decode(b) : null; }
  };
}

/* ---- DOCX XML helpers ---- */
function u8ToB64(u8) { let s = ''; const c = 0x8000; for (let i = 0; i < u8.length; i += c)s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); }
function ln(node) { return node.localName || (node.nodeName.includes(':') ? node.nodeName.split(':').pop() : node.nodeName); }
function findAll(node, local) { return [...node.getElementsByTagName('*')].filter(e => ln(e) === local); }
function findFirst(node, local) { for (const e of node.getElementsByTagName('*')) if (ln(e) === local) return e; return null; }
function attrLocal(el, local) { if (!el) return null; for (const a of el.attributes) if ((a.localName || a.name.split(':').pop()) === local) return a.value; return null; }

function paraText(p) { let out = ''; (function walk(n) { for (const c of n.childNodes) { if (c.nodeType === 1) { const t = ln(c); if (t === 't') out += c.textContent; else if (t === 'tab') out += '\t'; else if (t === 'br' || t === 'cr') out += ' '; else walk(c); } } })(p); return out.trim(); }
function paraStyle(p) { return attrLocal(findFirst(p, 'pStyle'), 'val') || ''; }
function paraNum(p) { const np = findFirst(p, 'numPr'); if (!np) return null; return attrLocal(findFirst(np, 'numId'), 'val'); }
function paraImages(p) {
  const blips = findAll(p, 'blip').map(b => attrLocal(b, 'embed'));
  const vmls = findAll(p, 'imagedata').map(b => attrLocal(b, 'id') || attrLocal(b, 'relid'));
  return [...blips, ...vmls].filter(Boolean);
}
function parseRels(xml) { const m = {}; if (!xml) return m; const d = new DOMParser().parseFromString(xml, 'application/xml'); findAll(d, 'Relationship').forEach(r => { const id = attrLocal(r, 'Id'), t = attrLocal(r, 'Target'); if (id) m[id] = t; }); return m; }
function parseNumbering(xml) {
  const map = {}; if (!xml) return map;
  const d = new DOMParser().parseFromString(xml, 'application/xml');
  const abs = {};
  findAll(d, 'abstractNum').forEach(a => {
    const id = attrLocal(a, 'abstractNumId');
    const lvls = findAll(a, 'lvl');
    const lvl = lvls.find(l => attrLocal(l, 'ilvl') === '0') || lvls[0];
    let fmt = 'bullet';
    if (lvl) { const f = findFirst(lvl, 'numFmt'); if (f) fmt = attrLocal(f, 'val') || 'bullet'; }
    abs[id] = fmt;
  });
  findAll(d, 'num').forEach(nn => {
    const numId = attrLocal(nn, 'numId');
    const a = findFirst(nn, 'abstractNumId');
    map[numId] = (abs[a ? attrLocal(a, 'val') : ''] || 'bullet') !== 'bullet';
  });
  return map;
}
async function imageDataUri(zip, rels, rId) {
  const target = rels[rId]; if (!target) return null;
  const ext = (target.split('.').pop() || '').toLowerCase();
  if (ext === 'emf' || ext === 'wmf') return null;
  const clean = target.replace(/^\.\.\//, '').replace(/^\//, '');
  const bytes = await zip.bytes('word/' + clean) || await zip.bytes(clean);
  if (!bytes) return null;
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : 'image/' + (ext || 'png');
  return 'data:' + mime + ';base64,' + u8ToB64(bytes);
}

function paraMaxSize(p) { let mx = 0; for (const sz of findAll(p, 'sz')) { const v = +attrLocal(sz, 'val'); if (v > mx) mx = v; } return mx; }
function paraAllBold(p) {
  const runs = findAll(p, 'r'); let textRuns = 0, allBold = true;
  for (const r of runs) {
    const t = (r.textContent || '').trim(); if (!t) continue; textRuns++;
    const rpr = findFirst(r, 'rPr'); const b = rpr ? findFirst(rpr, 'b') : null;
    let bold = false; if (b) { const v = attrLocal(b, 'val'); bold = (v === null || v === '' || v === 'true' || v === '1' || v === 'on'); }
    if (!bold) allBold = false;
  }
  return textRuns > 0 && allBold;
}
function wordCount(t) { return t.split(/\s+/).filter(Boolean).length; }
function modeOf(arr) { if (!arr.length) return 0; const c = {}; let best = arr[0], bc = 0; for (const v of arr) { c[v] = (c[v] || 0) + 1; if (c[v] > bc) { bc = c[v]; best = v; } } return best; }

/* parse a .docx buffer → {docTitle, subtitle, sections[{title, blocks[]}]} */
async function parseDocx(buf) {
  const zip = readZip(buf);
  const xml = await zip.text('word/document.xml');
  if (!xml) throw new Error('Bukan file DOCX yang valid');
  const rels = parseRels(await zip.text('word/_rels/document.xml.rels'));
  const numMap = parseNumbering(await zip.text('word/numbering.xml'));
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('XML dokumen rusak');
  const body = findFirst(doc, 'body');
  if (!body) throw new Error('Struktur DOCX tidak dikenali');

  const kids = [];
  (function walk(node) {
    if (!node) return;
    for (const el of node.children) {
      const tag = ln(el);
      if (tag === 'p' || tag === 'tbl') kids.push(el);
      else walk(el);
    }
  })(body);
  let hasHeadingStyle = false, hasH1 = false; const sizes = [];
  for (const el of kids) {
    if (ln(el) !== 'p') continue;
    const sl = paraStyle(el).toLowerCase();
    if (/title|heading|berschrift|titre|subtitle/.test(sl)) hasHeadingStyle = true;
    if (/heading\s*1|heading1|berschrift1/.test(sl)) hasH1 = true;
    const t = paraText(el);
    if (wordCount(t) > 12) { const sz = paraMaxSize(el); if (sz > 0) sizes.push(sz); }
  }
  const bodySize = sizes.length ? modeOf(sizes) : 22;

  const sections = []; let cur = null, firstPara = false, listBuf = null, docTitle = '', titleLines = [];
  const ensure = t => { cur = { title: t || 'Bagian', blocks: [] }; sections.push(cur); firstPara = true; };
  const need = (fallbackText) => { if (!cur) ensure(fallbackText); return cur; };
  const flush = () => { if (listBuf && listBuf.items.length) need().blocks.push(listBuf); listBuf = null; };

  for (const el of kids) {
    const tag = ln(el);
    if (tag === 'p') {
      const sl = paraStyle(el).toLowerCase();
      const text = paraText(el);
      const imgs = paraImages(el);
      const numId = paraNum(el);

      let head = 0;
      const wc = wordCount(text);
      if (hasHeadingStyle) {
        if (/^title$|^titre|berschrifttitel/.test(sl)) head = 't';
        else if (/heading\s*1|heading1|berschrift1/.test(sl)) head = 1;
        else if (/heading\s*2|heading2|berschrift2/.test(sl)) head = hasH1 ? 2 : 1;
        else if (/heading\s*[3-6]|heading[3-6]|subtitle/.test(sl)) head = 2;
      }

      if (text && (text.includes('[IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(text.trim()))) {
        head = 0;
      }

      if (!head && text && !imgs.length && !text.includes('[IMAGE_') && !/^\[?IMAGE_\d+\]?$/i.test(text.trim())) {
        const sz = paraMaxSize(el), bold = paraAllBold(el);
        const isTitle = sz >= bodySize + 10, big = sz >= bodySize + 6, med = sz >= bodySize + 3;
        const isNumberedHeader = /^[A-Z0-9][\.\:\)]\s+/i.test(text);

        if (isTitle && wc <= 12) head = 't';
        else if (isNumberedHeader && wc <= 10) head = 1;
        else if (numId !== null && wc <= 8 && (bold || !cur || sl.includes('list'))) head = 1;
        else if (numId === null && wc <= 14 && (big || (bold && sz >= bodySize))) head = (big || (bold && med)) ? 1 : 2;
        else if (numId === null && wc <= 18 && bold) head = 2;
      }

      if (head === 't') { if (text) titleLines.push(text); continue; }
      if (head === 1) { 
        if (text && !text.includes('[IMAGE_') && !/^\[?IMAGE_\d+\]?$/i.test(text.trim())) {
          flush(); ensure(text || 'Bagian'); continue; 
        }
      }
      if (head === 2) {
        flush();
        if (text && !text.includes('[IMAGE_') && !/^\[?IMAGE_\d+\]?$/i.test(text.trim())) {
          if (!cur) { ensure(text); continue; }
          else { need().blocks.push({ type: 'subhead', text }); continue; }
        }
      }

      if (text && !imgs.length && numId === null && cur && cur.blocks.length) {
        const last = cur.blocks[cur.blocks.length - 1];
        if (last.type === 'image' && !last.caption && /^(gambar|figure|gbr|fig\.?|image)\b/i.test(text) && wordCount(text) <= 8) {
          last.caption = text; continue;
        }
      }

      if (imgs.length) {
        flush();
        for (const rId of imgs) { const uri = await imageDataUri(zip, rels, rId); if (uri) need().blocks.push({ type: 'image', src: uri }); }
        if (text) need().blocks.push({ type: 'para', text });
        continue;
      }
      if (numId !== null) {
        const want = numMap[numId] ? 'steps' : 'bullets';
        if (!listBuf || listBuf.type !== want) { flush(); listBuf = { type: want, items: [] }; }
        if (text) listBuf.items.push(text);
        continue;
      }
      flush();
      if (text) { need().blocks.push({ type: firstPara ? 'lead' : 'para', text }); firstPara = false; }
      continue;
    }
    if (tag === 'tbl') {
      flush();
      const tblImgs = paraImages(el);
      for (const rId of tblImgs) {
        const uri = await imageDataUri(zip, rels, rId);
        if (uri) need().blocks.push({ type: 'image', src: uri });
      }
      const rows = findAll(el, 'tr').map(tr =>
        findAll(tr, 'tc').map(tc =>
          findAll(tc, 'p').map(paraText).join('\n').trim()));
      if (rows.length) need().blocks.push({ type: 'table', rows });
      continue;
    }
  }
  flush();
  let subtitle = '';
  if (titleLines.length) {
    const sorted = [...titleLines].sort((a, b) => b.length - a.length);
    docTitle = sorted[0];
    subtitle = titleLines.filter(t => t !== docTitle).join(' · ');
  }
  if (!docTitle && sections[0]) docTitle = sections[0].title;
  if (!docTitle) docTitle = 'Untitled Manual';
  return { docTitle, subtitle, sections };
}

/* ============================================================
   CONVERT BLOCKS TO HTML STRINGS FOR new.html
============================================================ */
function blockToHtml(b) {
  if (b.type === 'subhead') {
    return `<div class="deletable text-frame" style="position: relative; margin-top: 14px; margin-bottom: 6px;">
      <div class="body-subtitle editable-text" onclick="makeEditable(this)" style="font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #00d2ff; padding-bottom: 4px; display: inline-block; width: 100%;">${esc(b.text)}</div>
    </div>`;
  }
  if (b.type === 'para' || b.type === 'lead') {
    let rawTxt = (b.text || '').trim();
    if (rawTxt.length > 0 && rawTxt.length < 60 && !rawTxt.includes('\n')) {
      if (!rawTxt.endsWith('.')) rawTxt += '.';
      rawTxt += " Modul ini dirancang secara terstruktur untuk memastikan seluruh fungsi operasional dan kontrol antarmuka dapat diakses secara optimal dan responsif oleh pengguna.";
    }
    return `<div class="deletable text-frame" style="position: relative; margin-bottom: 6px;">
      <div class="body-text editable-text" onclick="makeEditable(this)" style="text-align: justify; font-size: 13px; line-height: 1.6; color: #334155;">${esc(rawTxt)}</div>
    </div>`;
  }
  if (b.type === 'feature_list') {
    const itemsHtml = (b.items || []).map(it => {
      const escapedStr = esc(it);
      const formatted = escapedStr.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a; font-weight:700;">$1</strong>');
      return `<li style="font-size:12.5px; color:#334155; line-height:1.5; padding-left:14px; position:relative;">
        <span style="position:absolute; left:0; top:6px; width:5px; height:5px; background:#00d2ff; border-radius:50%;"></span>
        ${formatted}
      </li>`;
    }).join('');

    return `<div class="deletable feature-list-card" style="position: relative; margin-top: 10px; margin-bottom: 10px; background: #f8faff; border-left: 3.5px solid #00d2ff; border-radius: 8px; padding: 12px 16px; box-shadow: 0 2px 8px rgba(0,210,255,0.05);">
      <div style="font-size: 11px; font-weight: 700; color: #0088cc; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">✦ ${esc(b.title || 'Komponen & Fitur Utama')}</div>
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
        ${itemsHtml}
      </ul>
    </div>`;
  }
  if (b.type === 'bullets') {
    const itemsHtml = b.items.map(t => `<li class="step-item deletable template-delete-processed" style="border-left-color:transparent; background:transparent;"><div class="step-text editable-text" onclick="makeEditable(this)">${esc(t)}</div></li>`).join('');
    return `<div class="deletable" style="position: relative; margin-bottom: 6px;">
      <ul class="steps-list" style="list-style-type:disc; padding-left:24px;">${itemsHtml}</ul>
    </div>`;
  }
  if (b.type === 'steps') {
    const itemsHtml = b.items.map(t => `<li class="step-item deletable template-delete-processed" style="padding:8px 12px; margin-bottom:4px;"><div class="step-text editable-text" onclick="makeEditable(this)" style="font-size:12.5px; line-height:1.5;">${esc(t)}</div></li>`).join('');
    return `<div class="deletable" style="position: relative; margin-bottom: 6px;">
      <ul class="steps-list" style="gap:4px;">${itemsHtml}</ul>
    </div>`;
  }
  if (b.type === 'image' || b.type === 'image_ref') {
    const imgSrc = b.src || (b.image_url ? b.image_url : '');
    let captionHtml = b.caption ? `<div class="body-cite editable-text" onclick="makeEditable(this)" style="text-align:center; margin-top:4px; font-size:12px; font-weight:700; color:#0f172a; letter-spacing:0.02em;">${esc(b.caption)}</div>` : '';

    let legendHtml = '';
    if (b.legend_items && b.legend_items.length > 0) {
      const itemsList = b.legend_items.map(it => `<li class="step-item deletable template-delete-processed" style="padding:4px 8px; margin-bottom:2px;"><div class="step-text editable-text" onclick="makeEditable(this)" style="font-size:11.5px; color:#334155;">${esc(it)}</div></li>`).join('');
      legendHtml = `<div style="margin-top:6px; width:100%; text-align:left; background:#f8faff; border-radius:6px; padding:8px 12px; border:1px solid #e2e8f0; border-left:3px solid #00d2ff;">
        <div style="font-size:10.5px; font-weight:700; color:#0088cc; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">📌 Keterangan Gambar</div>
        <ul class="steps-list" style="gap:2px;">${itemsList}</ul>
      </div>`;
    }

    return `<div class="deletable image-block-container" style="position: relative; margin-top: 8px; margin-bottom: 8px; text-align:center;">
      ${imgSrc ? `<img src="${imgSrc}" alt="${esc(b.caption || 'Gambar Manual')}" style="max-width:480px; max-height:260px; width:auto; height:auto; border-radius:6px; display:block; margin:0 auto; object-fit:contain; box-shadow:0 3px 10px rgba(0,0,0,0.06);">` : ''}
      ${captionHtml}
      ${legendHtml}
    </div>`;
  }
  if (b.type === 'table') {
    const thead = b.rows[0] ? `<thead><tr>${b.rows[0].map(c => `<th style="padding:6px; border:1px solid #e8ecf8; background:#f8faff; font-size:12px; font-weight:600;">${esc(c)}</th>`).join('')}</tr></thead>` : '';
    const tbody = b.rows.slice(1).map(r => `<tr>${r.map(c => `<td style="padding:6px; border:1px solid #e8ecf8; font-size:12px;">${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="deletable" style="position: relative; margin-bottom: 8px;">
      <table style="width:100%; border-collapse:collapse; text-align:left;">
        ${thead}
        <tbody>${tbody}</tbody>
      </table>
    </div>`;
  }
  return '';
}

/* ============================================================
   PAGINATION LOGIC (Server-side-like generation of pages)
============================================================ */
function estimateHeight(b) {
  if (b.type === 'para' || b.type === 'lead') return 20 + Math.ceil((b.text || '').length / 90) * 16;
  if (b.type === 'subhead') return 35;
  if (b.type === 'feature_list') return 30 + ((b.items || []).length * 20);
  if (b.type === 'image' || b.type === 'image_ref') {
    let h = 280;
    if (b.caption) h += 20;
    if (b.legend_items) h += (b.legend_items.length * 18);
    return h;
  }
  if (b.type === 'bullets' || b.type === 'steps') return (b.items || []).length * 22;
  if (b.type === 'table') return (b.rows || []).length * 25;
  return 20;
}

function generateSectionPages(section, letterOffset) {
  const pagesHtml = [];
  const MAX_HEIGHT = 950; // Usable vertical A4 content height
  const FIRST_PAGE_HEADER_HEIGHT = 80; // Height of the chapter header block on first page
  const RUNNING_HEADER_HEIGHT = 0;     // No running header on continuation pages

  const secNum = letterOffset + 1;
  const titleText = section.title.trim().replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '');
  const displayTitle = `${secNum}. ${titleText}`;

  let currentHeight = FIRST_PAGE_HEADER_HEIGHT; // Account for header on first page
  let pageBlocksHtml = [];
  let isFirstPage = true;
  let pageIndex = 1;

  const pushPage = () => {
    const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    let headerHtml = '';

    if (isFirstPage) {
      headerHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 12px;">
        <div class="page-header">
          <div class="page-header-left">
            <div class="chapter-num">${secNum}</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" onclick="makeEditable(this)" style="font-size: 15px; font-weight: 700; color: #0f172a;">${esc(displayTitle)}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else {
      headerHtml = '';
    }

    const html = `
    <div class="page page-content" id="page-${id}" data-page="${id}">
      <button class="page-adjust-button btn-adj-toggle" onclick="togglePageAdjust(this)" title="Edit Tata Letak" style="position:absolute; top:16px; right:16px; z-index:10;"><span class="material-symbols-outlined">tune</span></button>
      ${headerHtml}
      ${pageBlocksHtml.join('')}
      
      <div class="page-footer">
        <div class="footer-brand editable-text" onclick="makeEditable(this)">MANUAL ARCH</div>
        <div class="footer-page editable-text" onclick="makeEditable(this)">Hal ${pageIndex}</div>
      </div>
    </div>`;
    pagesHtml.push({ id, html });
  };

  const blocks = section.blocks;
  let subheadCount = 0;
  for (let bi = 0; bi < blocks.length; bi++) {
    let b = blocks[bi];
    if (b.type === 'subhead') {
      const cleanSub = (b.text || '').replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim();
      
      // Skip subhead if it duplicates the section title
      if (isDuplicateSectionTitle(cleanSub, section.title)) {
        continue;
      }

      // Skip subhead if there is no actual content (para/image/steps) after it in this section
      const hasContentAfter = blocks.slice(bi + 1).some(blk => blk.type !== 'subhead');
      if (!hasContentAfter) {
        continue;
      }

      const subLetter = String.fromCharCode(97 + (subheadCount % 26));
      subheadCount++;
      b = { ...b, text: `${subLetter}. ${cleanSub}` };
    }

    const h = estimateHeight(b);

    // Anti-orphan: If this is a subhead, ensure there's enough space for the subhead PLUS at least ~100px of content below it.
    // If remaining space is too small (< 130px), push to a fresh page so subhead & content stay together.
    if (b.type === 'subhead' && pageBlocksHtml.length > 0) {
      if (MAX_HEIGHT - currentHeight < 130) {
        pushPage();
        isFirstPage = false;
        pageBlocksHtml = [];
        currentHeight = RUNNING_HEADER_HEIGHT;
        pageIndex++;
      }
    }

    if (currentHeight + h > MAX_HEIGHT && pageBlocksHtml.length > 0) {
      pushPage();
      isFirstPage = false;
      pageBlocksHtml = [];
      currentHeight = RUNNING_HEADER_HEIGHT; // Account for running header on continuation pages
      pageIndex++;
    }

    pageBlocksHtml.push(blockToHtml(b));
    currentHeight += h;
  }

  if (pageBlocksHtml.length > 0) {
    pushPage();
  }

  return pagesHtml;
}

/* ============================================================
   MAIN ENTRY POINT
============================================================ */
window.handleDocxUpload = async function (file, onStatus) {
  if (!file) return;
  if (onStatus) onStatus('Membaca dokumen...', 'info');

  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const { docTitle, subtitle, sections } = await parseDocx(buf);

    if (!sections || sections.length === 0) {
      if (onStatus) onStatus('Dokumen kosong atau gagal dibaca.', 'err');
      return;
    }

    if (onStatus) onStatus('Mengkonversi ke format halaman...', 'info');

    let allPagesData = {}; // { 'page-id': '<html>...' }
    let pageOrder = []; // array of page ids

    const tocPage = generateTocPage(docTitle, sections);
    allPagesData[tocPage.id] = tocPage.html;
    pageOrder.push(tocPage.id);

    sections.forEach((sec, idx) => {
      const generatedPages = generateSectionPages(sec, idx);
      generatedPages.forEach(gp => {
        allPagesData[gp.id] = gp.html;
        pageOrder.push(gp.id);
      });
    });

    // Check if we are in dashboard.html or new.html
    const isNewHtml = window.location.pathname.endsWith('new.html');

    if (isNewHtml) {
      // Inject directly into DOM to avoid localStorage quota on initial load
      const pdfPages = document.getElementById('pdfPages');
      if (pdfPages) {
        // Keep the cover page
        const cover = document.getElementById('p1');
        pdfPages.innerHTML = '';
        if (cover) {
          const titleEl = cover.querySelector('.cover-title');
          if (titleEl) {
            titleEl.innerHTML = docTitle + ' <span class="body-cite"></span>';
          }
          pdfPages.appendChild(cover);
        }

        // Also update projectNameBadge if it exists
        const badge = document.getElementById('projectNameBadge');
        if (badge) {
          badge.innerText = docTitle;
        }

        // Append all imported pages
        Object.values(allPagesData).forEach(htmlStr => {
          const temp = document.createElement('div');
          temp.innerHTML = htmlStr;
          if (temp.firstElementChild) {
            pdfPages.appendChild(temp.firstElementChild);
          }
        });

        // Refresh sidebar navigation
        if (typeof populateSidebarPages === 'function') {
          populateSidebarPages();
        }

        // Add a small delay for DOM to settle, then initialize drag events manually if needed
        // Since loadState() handles attaching controls, we can just trigger window.saveState() 
        // which might fail with quota, but at least the DOM is present for the user to see!
        if (typeof window.hasUnsavedProjectChanges !== 'undefined') {
          window.hasUnsavedProjectChanges = true;
        }
        if (typeof window.hasUnsavedChanges !== 'undefined') {
          window.hasUnsavedChanges = true;
        }

        if (typeof window.showNotification === 'function') {
          window.showNotification('Dokumen berhasil diimpor', 'success');
        }
        if (onStatus) onStatus('Dokumen diimpor', 'ok');
      }
    } else {
      // (This path shouldn't be hit anymore since we removed the input from dashboard, 
      // but keep it as a fallback)
      const newProjectId = 'proj_' + Date.now();
      localStorage.setItem('current_project_id', newProjectId);
      localStorage.setItem('last_loaded_project', newProjectId);
      localStorage.setItem('project_name_' + newProjectId, docTitle);

      try {
        localStorage.setItem('page_custom_edits_' + newProjectId, JSON.stringify(allPagesData));
        localStorage.setItem('page_custom_added_' + newProjectId, JSON.stringify(pageOrder));
      } catch (e) {
        if (onStatus) onStatus('Gagal: Ukuran dokumen terlalu besar (Quota Exceeded)', 'err');
        return;
      }

      if (onStatus) onStatus(`Selesai! Membuka ${sections.length} bagian...`, 'ok');

      setTimeout(() => {
        window.location.href = 'new.html';
      }, 500);
    }

  } catch (err) {
    console.error(err);
    if (onStatus) onStatus('Gagal: ' + err.message, 'err');
  }
};

function getSubheadLetter(idx) {
  let str = '';
  let n = idx + 1;
  while (n > 0) {
    let rem = (n - 1) % 26;
    str = String.fromCharCode(97 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

function isTableField(str) {
  if (!str) return true;
  const clean = str.replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim().toLowerCase();
  const fields = [
    'tipe', 'deskripsi', 'no', 'image', 'status', 'approval', 'action', 'id', 'icon', 'logo',
    'name', 'date', 'keterangan', 'fitur', 'pilihan', 'url', 'code', 'header', 'sidebar',
    'panel', 'label', 'komponen', 'overview', 'summary', 'list', 'quick', 'shortcut', 'title',
    'value', 'type', 'setting', 'param', 'user', 'role', 'akses', 'system'
  ];
  if (fields.includes(clean) || clean.length <= 3 || /^\d+$/.test(clean)) return true;
  if (!clean.includes(' ') && !/^\d+[\.\)]/.test(clean)) {
    return true;
  }
  return false;
}

function generateTocPages(docTitle, sections, sectionPageNumbers = {}, legendPageNum = null) {
  const items = [];
  sections.forEach((sec, idx) => {
    const secNum = idx + 1;
    const titleText = (sec.title || '').trim().replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '');
    
    // Skip IMAGE placeholders from TOC
    if (!titleText || titleText.includes('[IMAGE_') || titleText.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(titleText)) {
      return;
    }

    const displayTitle = `${secNum}. ${titleText}`;
    const pageNum = sectionPageNumbers[idx] !== undefined ? sectionPageNumbers[idx] : (idx + 3);

    items.push({
      type: 'section',
      height: 32,
      html: `<div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; margin-bottom:6px; border-bottom:1px dashed #cbd5e1; padding-bottom:4px;">
        <span style="font-weight:700; font-size:13.5px; color:#0f172a;">${esc(displayTitle)}</span>
        <span style="font-size:12.5px; font-weight:700; color:#0088cc; background:#f0f9ff; padding:2px 8px; border-radius:4px;">${pageNum}</span>
      </div>`
    });

    if (sec.blocks) {
      let subCount = 0;
      sec.blocks.forEach(b => {
        if (b.type === 'subhead') {
          const cleanSub = (b.text || '').replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim();
          if (!cleanSub || cleanSub.includes('[IMAGE_') || cleanSub.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(cleanSub) || isTableField(cleanSub)) {
            return;
          }
          const subLetter = getSubheadLetter(subCount);
          subCount++;
          items.push({
            type: 'subhead',
            height: 22,
            html: `<div style="display:flex; justify-content:space-between; align-items:baseline; margin-left:18px; margin-bottom:4px; font-size:12px; color:#475569;">
              <span>• ${esc(subLetter)}. ${esc(cleanSub)}</span>
            </div>`
          });
        }
      });
    }
  });

  if (legendPageNum) {
    items.push({
      type: 'legend',
      height: 32,
      html: `<div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; margin-bottom:6px; border-bottom:1px dashed #cbd5e1; padding-bottom:4px;">
        <span style="font-weight:700; font-size:13.5px; color:#0f172a;">Legenda Istilah Teknologi</span>
        <span style="font-size:12.5px; font-weight:700; color:#0088cc; background:#f0f9ff; padding:2px 8px; border-radius:4px;">${legendPageNum}</span>
      </div>`
    });
  }

  const MAX_TOC_HEIGHT = 650;
  const tocPages = [];
  let currentItems = [];
  let currentH = 0;

  items.forEach((it) => {
    if (currentH + it.height > MAX_TOC_HEIGHT && currentItems.length > 0) {
      tocPages.push(currentItems);
      currentItems = [];
      currentH = 0;
    }
    currentItems.push(it);
    currentH += it.height;
  });
  if (currentItems.length > 0) {
    tocPages.push(currentItems);
  }

  const pages = [];
  tocPages.forEach((pageItems, pIdx) => {
    const pageNum = pIdx + 2; // Cover is Hal 1, TOC starts at Hal 2
    const id = pIdx === 0 ? 'page-toc' : `page-toc-${pIdx + 1}`;
    const headerTitle = pIdx === 0 ? 'DAFTAR ISI' : 'DAFTAR ISI (Lanjutan)';
    const itemsHtml = pageItems.map(it => it.html).join('');

    const html = `
    <div class="page page-content" id="page-${id}" data-page="${id}">
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px;">
        <div class="page-header">
          <div class="page-header-left">
            <div class="chapter-num" style="background:#00d2ff; color:#fff;">📋</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" onclick="makeEditable(this)" style="font-size: 16px; font-weight: 700; color: #0f172a;">${headerTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="deletable toc-container" style="position: relative; margin-top: 10px; margin-bottom: 16px; background: #ffffff; border-radius: 10px; padding: 18px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
        ${itemsHtml}
      </div>

      <div class="page-footer">
        <div class="footer-brand editable-text" onclick="makeEditable(this)">MANUAL ARCH</div>
        <div class="footer-page editable-text" onclick="makeEditable(this)">Hal ${pageNum}</div>
      </div>
    </div>`;

    pages.push({ id, html });
  });

  return pages;
}

function generateLegendPage(techLegend, legendPageNum, docTitle) {
  if (!techLegend || techLegend.length === 0) return null;

  const id = 'legend-page';
  let rowsHtml = '';
  techLegend.forEach((item, idx) => {
    const bg = (idx % 2 === 0) ? '#ffffff' : '#f8fafc';
    rowsHtml += `
    <tr style="background:${bg}; border-bottom:1px solid #e2e8f0;">
      <td style="padding:9px 12px; font-weight:700; color:#0f172a; font-size:12px; width:22%; vertical-align:top; border-right:1px solid #e2e8f0;">${esc(item.term)}</td>
      <td style="padding:9px 12px; color:#334155; font-size:11.5px; line-height:1.5; vertical-align:top;">${esc(item.desc)}</td>
    </tr>`;
  });

  const headerHtml = `
  <div class="deletable page-header-block" style="position: relative; margin-bottom: 14px;">
    <div class="page-header">
      <div class="page-header-left">
        <div class="chapter-num" style="background:#0284c7; color:#fff;">📖</div>
        <div class="chapter-info">
          <div class="chapter-name editable-text" onclick="makeEditable(this)" style="font-size: 16px; font-weight: 700; color: #0f172a;">Legenda Istilah Teknologi</div>
        </div>
      </div>
    </div>
  </div>`;

  const html = `
  <div class="page page-content" id="page-${id}" data-page="${id}">
    <button class="page-adjust-button btn-adj-toggle" onclick="togglePageAdjust(this)" title="Edit Tata Letak" style="position:absolute; top:16px; right:16px; z-index:10;"><span class="material-symbols-outlined">tune</span></button>
    ${headerHtml}
    
    <div class="deletable legend-container" style="position: relative; margin-top: 6px; margin-bottom: 14px;">
      <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; font-family:inherit;">
        <thead>
          <tr style="background:#1e293b; color:#ffffff; font-size:12px; text-align:left;">
            <th style="padding:10px 12px; width:22%; border-right:1px solid #334155;">Istilah</th>
            <th style="padding:10px 12px;">Penjelasan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <div class="page-footer">
      <div class="footer-brand editable-text" onclick="makeEditable(this)">MANUAL ARCH</div>
      <div class="footer-page editable-text" onclick="makeEditable(this)">Hal ${legendPageNum}</div>
    </div>
  </div>`;

  return { id, html };
}

/* ============================================================
   OLLAMA AI INTEGRATION (172.15.5.30:11434)
============================================================ */
function isDuplicateSectionTitle(blockText, sectionTitle) {
  if (!blockText || !sectionTitle) return false;
  const cleanBlock = blockText.replace(/^[A-Z0-9\.\:\-]\s*/i, '').trim().toLowerCase();
  const cleanSec = sectionTitle.replace(/^[A-Z0-9\.\:\-]\s*/i, '').trim().toLowerCase();
  if (!cleanBlock || !cleanSec) return false;
  return cleanBlock === cleanSec || cleanSec.endsWith(cleanBlock) || cleanBlock.endsWith(cleanSec);
}

function generateDocumentPages(docTitle, sections, techLegend = null) {
  const sectionPagesHtml = [];
  const sectionPageNumbers = {};

  // Estimate TOC height and number of TOC pages
  let totalTocH = 0;
  sections.forEach(sec => {
    const titleText = (sec.title || '').trim().replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '');
    if (!titleText || titleText.includes('[IMAGE_') || titleText.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(titleText)) return;
    totalTocH += 32;
    if (sec.blocks) {
      sec.blocks.forEach(b => {
        if (b.type === 'subhead') {
          const cleanSub = (b.text || '').replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim();
          if (cleanSub && !cleanSub.includes('[IMAGE_') && !cleanSub.includes('IMAGE_') && !/^\[?IMAGE_\d+\]?$/i.test(cleanSub)) {
            totalTocH += 22;
          }
        }
      });
    }
  });

  const numTocPages = Math.max(1, Math.ceil(totalTocH / 650));
  let pageIndex = 1 + numTocPages + 1; // Cover is Hal 1, TOC occupies Hal 2 .. Hal (1+numTocPages)

  let pageBlocksHtml = [];
  const MAX_HEIGHT = 950;
  const FIRST_PAGE_HEADER_HEIGHT = 80;
  const RUNNING_HEADER_HEIGHT = 0;
  let currentHeight = FIRST_PAGE_HEADER_HEIGHT;
  let isFirstSectionPage = true;

  const pushPage = (primaryTitle, secIdx) => {
    const id = 'sec-' + secIdx + '-' + pageIndex;
    const secNum = secIdx + 1;
    const cleanTitle = primaryTitle.replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim();
    const displayTitle = `${secNum}. ${cleanTitle}`;

    let headerHtml = '';
    if (isFirstSectionPage) {
      headerHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 12px;">
        <div class="page-header">
          <div class="page-header-left">
            <div class="chapter-num">${secNum}</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" onclick="makeEditable(this)" style="font-size: 15px; font-weight: 700; color: #0f172a;">${esc(displayTitle)}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else {
      headerHtml = '';
    }

    const html = `
    <div class="page page-content" id="page-${id}" data-page="${id}">
      <button class="page-adjust-button btn-adj-toggle" onclick="togglePageAdjust(this)" title="Edit Tata Letak" style="position:absolute; top:16px; right:16px; z-index:10;"><span class="material-symbols-outlined">tune</span></button>
      ${headerHtml}
      ${pageBlocksHtml.join('')}
      <div class="page-footer">
        <div class="footer-brand editable-text" onclick="makeEditable(this)">MANUAL ARCH</div>
        <div class="footer-page editable-text" onclick="makeEditable(this)">Hal ${pageIndex}</div>
      </div>
    </div>`;
    sectionPagesHtml.push({ id, html });
  };

  let activeTitle = (sections[0] && sections[0].title) ? sections[0].title : (docTitle || 'Panduan Penggunaan');
  let activeSecIdx = 0;

  sections.forEach((sec, idx) => {
    // Each new section/topic starts on a fresh page
    if (idx > 0 && pageBlocksHtml.length > 0) {
      pushPage(activeTitle, activeSecIdx);
      isFirstSectionPage = true;
      pageIndex++;
      pageBlocksHtml = [];
      currentHeight = FIRST_PAGE_HEADER_HEIGHT;
    }

    if (sectionPageNumbers[idx] === undefined) {
      sectionPageNumbers[idx] = pageIndex;
    }

    if (sec.title) {
      activeTitle = sec.title;
      activeSecIdx = idx;
    }

    if (sec.blocks) {
      let subheadCount = 0;
      sec.blocks.forEach((origB, bIdx) => {
        let b = origB;
        if (b.type === 'subhead') {
          const cleanSub = (b.text || '').replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim();

          if (isDuplicateSectionTitle(cleanSub, sec.title) || (idx + 1 < sections.length && isDuplicateSectionTitle(cleanSub, sections[idx + 1].title)) || isTableField(cleanSub)) {
            return;
          }

          const hasContentAfter = sec.blocks.slice(bIdx + 1).some(blk => blk.type !== 'subhead');
          if (!hasContentAfter) {
            return;
          }

          const subLetter = getSubheadLetter(subheadCount);
          subheadCount++;
          b = { ...b, text: `${subLetter}. ${cleanSub}` };
        }

        if (bIdx === 0 && (b.type === 'para' || b.type === 'subhead') && isDuplicateSectionTitle(b.text, sec.title)) {
          return;
        }

        const h = estimateHeight(b);

        if (b.type === 'subhead' && pageBlocksHtml.length > 0) {
          if (MAX_HEIGHT - currentHeight < 130) {
            pushPage(activeTitle, activeSecIdx);
            isFirstSectionPage = false;
            pageIndex++;
            pageBlocksHtml = [];
            currentHeight = RUNNING_HEADER_HEIGHT;
          }
        }

        if (currentHeight + h > MAX_HEIGHT && pageBlocksHtml.length > 0) {
          pushPage(activeTitle, activeSecIdx);
          isFirstSectionPage = false;
          pageIndex++;
          pageBlocksHtml = [];
          currentHeight = RUNNING_HEADER_HEIGHT;
        }
        pageBlocksHtml.push(blockToHtml(b));
        currentHeight += h;
      });
    }
  });

  if (pageBlocksHtml.length > 0) {
    pushPage(activeTitle, activeSecIdx);
  }

  let legendPageNum = null;
  if (techLegend && techLegend.length > 0) {
    legendPageNum = pageIndex + 1;
    const legendPage = generateLegendPage(techLegend, legendPageNum, docTitle);
    if (legendPage) {
      sectionPagesHtml.push(legendPage);
    }
  }

  const tocPages = generateTocPages(docTitle, sections, sectionPageNumbers, legendPageNum);
  return [...tocPages, ...sectionPagesHtml];
}

function renderParsedDocument(docTitle, sections, techLegend, onStatus) {
  if (typeof techLegend === 'function') {
    onStatus = techLegend;
    techLegend = null;
  }

  let allPagesData = {};
  let pageOrder = [];

  const generatedPages = generateDocumentPages(docTitle, sections, techLegend);
  generatedPages.forEach(gp => {
    allPagesData[gp.id] = gp.html;
    pageOrder.push(gp.id);
  });

  const pdfPages = document.getElementById('pdfPages');
  if (pdfPages) {
    const cover = document.getElementById('p1');
    pdfPages.innerHTML = '';
    if (cover) {
      const titleEl = cover.querySelector('.cover-title');
      if (titleEl) {
        titleEl.innerHTML = esc(docTitle) + ' <span class="body-cite"></span>';
      }
      pdfPages.appendChild(cover);
    }

    const badge = document.getElementById('projectNameBadge');
    if (badge) {
      badge.innerText = docTitle;
    }

    Object.values(allPagesData).forEach(htmlStr => {
      const temp = document.createElement('div');
      temp.innerHTML = htmlStr;
      if (temp.firstElementChild) {
        pdfPages.appendChild(temp.firstElementChild);
      }
    });

    if (typeof window.hasUnsavedProjectChanges !== 'undefined') window.hasUnsavedProjectChanges = true;
    if (typeof window.hasUnsavedChanges !== 'undefined') window.hasUnsavedChanges = true;

    if (typeof window.showNotification === 'function') {
      window.showNotification('Manual AI berhasil disiapkan!', 'success');
    }
    if (onStatus) onStatus('Selesai! Berhasil di-generate via Ollama AI', 'ok');
  }
}

function showAiLoadingOverlay(msg) {
  let overlay = document.getElementById('aiLoadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'aiLoadingOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 17, 23, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    overlay.innerHTML = `
      <div style="background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(0, 210, 255, 0.4); border-radius: 20px; padding: 40px 48px; display: flex; flex-direction: column; align-items: center; gap: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,210,255,0.15); text-align: center; max-width: 440px; width: 90%;">
        <div style="position: relative; width: 70px; height: 70px;">
          <div class="ai-spinner" style="width: 70px; height: 70px; border: 4px solid rgba(0, 210, 255, 0.15); border-top: 4px solid #00d2ff; border-right: 4px solid #3b82f6; border-radius: 50%; animation: aiSpin 1s linear infinite;"></div>
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #00d2ff;">✦</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #00d2ff, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; letter-spacing: 0.5px;">Memproses Dokumen...</div>
          <div id="aiLoadingStatusText" style="font-size: 14px; color: #94a3b8; line-height: 1.6; min-height: 44px; display: flex; align-items: center; justify-content: center;">${msg || 'Mohon tunggu, AI sedang menyusun Manual Book...'}</div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="width: 8px; height: 8px; background: #00d2ff; border-radius: 50%; display: inline-block; animation: pulse 1.4s infinite ease-in-out;"></span>
          <span style="width: 8px; height: 8px; background: #00d2ff; border-radius: 50%; display: inline-block; animation: pulse 1.4s infinite ease-in-out 0.2s;"></span>
          <span style="width: 8px; height: 8px; background: #00d2ff; border-radius: 50%; display: inline-block; animation: pulse 1.4s infinite ease-in-out 0.4s;"></span>
        </div>
        <style>
          @keyframes aiSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        </style>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
  } else {
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
    const txt = document.getElementById('aiLoadingStatusText');
    if (txt) txt.innerText = msg || 'Mohon tunggu, AI sedang menyusun Manual Book...';
  }
}

function hideAiLoadingOverlay() {
  const overlay = document.getElementById('aiLoadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }
}

window.handleAiDocxUpload = async function (file, onStatus) {
  if (!file) return;

  const updateMsg = (msg, status) => {
    showAiLoadingOverlay(msg);
    if (onStatus) onStatus(msg, status);
  };

  updateMsg('1/3 Mengirim file ke backend AI server...', 'info');

  try {
    const formData = new FormData();
    formData.append('file', file);

    updateMsg('2/3 Memproses via 4-Stage AI Pipeline (Context, Topic, Writing, Legend)...', 'info');

    const res = await fetch('/api/ai-generate', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || ('HTTP ' + res.status));
    }

    const parsed = await res.json();
    if (parsed._saved_folder) {
      window.currentProjectFolder = parsed._saved_folder;
    }

    updateMsg('3/3 Menyusun halaman Portrait A4...', 'info');

    renderParsedDocument(parsed.docTitle || 'AI Generated Manual', parsed.sections || [], parsed.tech_legend || [], onStatus);

    setTimeout(hideAiLoadingOverlay, 600);

  } catch (err) {
    hideAiLoadingOverlay();
    console.warn('Ollama AI backend failed:', err);
    if (onStatus) onStatus('AI Server Gagal: ' + err.message, 'err');
  }
};

window.saveExportedPdfToServer = async function (pdfObj, safeName) {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fallbackFolder = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const folderName = window.currentProjectFolder || fallbackFolder;
    const pdfDataUri = pdfObj.output('datauristring');
    const pdfFilename = `${folderName}.pdf`;

    await fetch('/api/save-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder_name: folderName,
        pdf_base64: pdfDataUri,
        filename: pdfFilename
      })
    });
    console.log('[AI-SERVER] 💾 Exported PDF saved to projects/' + folderName + '/' + pdfFilename);
  } catch (err) {
    console.warn('Failed to save PDF to server:', err);
  }
};
