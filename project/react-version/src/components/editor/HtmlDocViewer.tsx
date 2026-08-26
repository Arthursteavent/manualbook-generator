import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { generateDocumentPages, generateCoverPage, getLangStyle, detectSubheadLevelFromEl, getTocLevelStyle, type Section, type TechLegendItem, type GeneratedPage, type LangStyle } from '../../utils/docxImporterBridge';
import type { ContentBlock, LanguageCode } from '../../types/manual.types';
import { getCustomColorTheme, getAllColorThemes, DEFAULT_COLOR_THEME, type ColorThemeId } from '../../utils/colorThemes';

interface Props {
  docTitle: string;
  sections: Section[];
  techLegend?: TechLegendItem[];
  language?: LanguageCode;
  colorTheme?: ColorThemeId;
  customAccentColor?: string;
  initialPages?: GeneratedPage[];
  isViewer?: boolean;
  onTitleChange?: (newTitle: string) => void;
  onPagesChange?: (updatedPages: GeneratedPage[]) => void;
  onUserEdit?: () => void;
  onRegisterAddChapter?: (fn: () => void) => void;
  onRegisterAddSubhead?: (fn: () => void) => void;
  onRegisterSyncToc?: (fn: () => void) => void;
  onRegisterAutoSplitToc?: (fn: () => void) => void;
  onRegisterReflow?: (fn: () => void) => void;
  onRegisterSyncDom?: (fn: () => GeneratedPage[]) => void;
}

function escapeHtml(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTableCellContent(cellStr: string = ''): string {
  const str = String(cellStr || '');
  if (str.includes('<img ')) {
    return str.replace(/<img\s+([^>]+)>/gi, (_match, attrs) => {
      let cleanedAttrs = attrs;
      if (!cleanedAttrs.includes('style=')) {
        cleanedAttrs += ' style="max-height:80px; max-width:140px; width:auto; height:auto; object-fit:contain; border-radius:4px; display:inline-block; vertical-align:middle; margin:2px;"';
      }
      return `<img ${cleanedAttrs}>`;
    });
  }
  return escapeHtml(str);
}

function blockToHtmlString(block: ContentBlock): string {
  switch (block.kind) {
    case 'section-title':
      return `<div class="deletable page-header-block" style="position: relative; margin-top: 18px; margin-bottom: 16px; padding-left: 36px; padding-right: 36px;">
        <div class="page-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div class="page-header-left" style="display: flex; align-items: center; gap: 12px;">
            <div class="chapter-num editable-text" contenteditable="true" style="outline: none; cursor: text;" title="Klik untuk mengedit nomor bab">1</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline: none;">${escapeHtml(block.text || '')}</div>
            </div>
          </div>
        </div>
      </div>`;
    case 'subtitle':
      return `<div class="deletable subhead-frame" style="position: relative; margin-top: 14px; margin-bottom: 6px; border-bottom: 2px solid #00d2ff; padding-bottom: 4px; margin-left: 36px; margin-right: 36px; padding-left: 0; padding-right: 0;">
        <div class="subhead-text editable-text body-subtitle" contenteditable="true" style="font-size: 13.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.01em; outline: none;">${escapeHtml(block.text || '')}</div>
      </div>`;
    case 'sub-subtitle':
      return `<div class="deletable subhead-frame sub-subhead-frame" style="position: relative; margin-top: 12px; margin-bottom: 6px; border-bottom: 2px solid #00d2ff; padding-bottom: 4px; margin-left: 44px; margin-right: 44px; padding-left: 0; padding-right: 0;">
        <div class="subhead-text editable-text body-sub-subtitle" contenteditable="true" style="font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: 0.01em; outline: none;">${escapeHtml(block.text || '')}</div>
      </div>`;
    case 'sub-sub-subtitle':
      return `<div class="deletable subhead-frame sub-sub-subhead-frame" style="position: relative; margin-top: 11px; margin-bottom: 6px; border-bottom: 2px solid #00d2ff; padding-bottom: 4px; margin-left: 48px; margin-right: 48px; padding-left: 0; padding-right: 0;">
        <div class="subhead-text editable-text body-sub-sub-subtitle" contenteditable="true" style="font-size: 12.5px; font-weight: 700; color: #0f172a; letter-spacing: 0.01em; outline: none;">${escapeHtml(block.text || '')}</div>
      </div>`;
    case 'sub-sub-sub-subtitle':
      return `<div class="deletable subhead-frame sub-sub-sub-subhead-frame" style="position: relative; margin-top: 10px; margin-bottom: 6px; margin-left: 52px; margin-right: 52px; padding-left: 0; padding-right: 0;">
        <div class="subhead-text editable-text body-sub-sub-sub-subtitle" contenteditable="true" style="font-size: 12px; font-weight: 700; font-style: italic; color: #0f172a; letter-spacing: 0.01em; outline: none;">${escapeHtml(block.text || '')}</div>
      </div>`;
    case 'paragraph':
      return `<p class="deletable enriched-paragraph" contenteditable="true" style="font-size:13.5px; line-height:1.75; color:#334155; margin-top:12px; margin-bottom:12px; text-align:justify; text-justify:inter-word; word-break:normal; overflow-wrap:break-word; hyphens:none; padding-left:36px; padding-right:36px; text-indent:0;">${block.html || ''}</p>`;
    case 'step':
      return `<div class="deletable step-card" contenteditable="true" style="display:flex; align-items:flex-start; gap:12px; margin-top:12px; margin-bottom:12px; padding:12px 16px; background:#f8fafc; border-left:4px solid ${block.accentColor || '#00d2ff'}; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.03);"><div style="font-weight:700; color:#00d2ff; font-size:14px;">▸</div><div style="font-size:13px; color:#334155; line-height:1.6; flex:1;">${escapeHtml(block.text || '')}</div></div>`;
    case 'image': {
      const imgSrc = block.url || block.src || block.image_url || '';
      const caption = block.caption || '';
      if (imgSrc) {
        return `<div class="deletable image-frame" style="position: relative; margin-top: 8px; margin-bottom: 8px; text-align: center;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px; display:inline-flex; flex-direction:column; align-items:center; width:max-content; max-width:100%; box-sizing:border-box;">
            <img src="${escapeHtml(imgSrc)}" style="max-width:480px; max-height:260px; width:auto !important; height:auto !important; object-fit:contain; display:block; margin:0 auto; border-radius:4px;" />
            <div class="image-caption editable-text" contenteditable="true" style="font-size:11px; color:#64748b; margin-top:5px; font-style:italic; outline:none; width:100%; text-align:center;">${escapeHtml(caption)}</div>
          </div>
        </div>`;
      }
      return `<div class="deletable image-frame" style="position: relative; margin-top: 8px; margin-bottom: 8px; text-align: center;">
        <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:8px; padding:16px 20px; display:inline-flex; flex-direction:column; align-items:center; width:max-content; max-width:480px; cursor:pointer; text-align:center; transition:all 0.2s;" onclick="this.querySelector('input[type=file]')?.click()">
          <input type="file" accept="image/*" style="display:none;" onchange="
            if(this.files && this.files[0]){
              const reader = new FileReader();
              reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'max-width:480px; max-height:260px; width:auto !important; height:auto !important; object-fit:contain; display:block; margin:0 auto; border-radius:4px;';
                const cap = document.createElement('div');
                cap.className = 'image-caption editable-text';
                cap.contentEditable = 'true';
                cap.style.cssText = 'font-size:11px; color:#64748b; margin-top:5px; font-style:italic; outline:none; width:100%; text-align:center;';
                cap.textContent = '';
                const container = this.closest('div');
                container.style.border = '1px solid #e2e8f0';
                container.style.padding = '6px';
                container.style.background = '#f8fafc';
                container.style.display = 'inline-flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.width = 'max-content';
                container.style.maxWidth = '100%';
                container.innerHTML = '';
                container.appendChild(img);
                container.appendChild(cap);
              };
              reader.readAsDataURL(this.files[0]);
            }
          " />
          <div style="font-size:24px; margin-bottom:4px;">🖼️</div>
          <div style="font-size:12.5px; font-weight:700; color:#3b82f6;">Klik untuk Upload Gambar</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">Ukuran proporsional bawaan (Max 480x260px)</div>
        </div>
      </div>`;
    }
    case 'table': {
      const titleTxt = block.title ? `<div class="table-title editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:#0f172a; margin-bottom:6px;">${escapeHtml(block.title)}</div>` : '';
      const headersHtml = block.headers && block.headers.length > 0
        ? '<thead><tr>' + block.headers.map(h => `<th class="editable-text" contenteditable="true" style="padding:7px 10px; background:#f1f5f9; color:#0f172a; font-weight:700; font-size:11.5px; border:1px solid #cbd5e1; text-align:left;">${escapeHtml(h)}</th>`).join('') + '<th style="padding:7px 4px; width:32px; text-align:center;" data-editor-ui="true"></th></tr></thead>'
        : '';
      const rowsHtml = block.rows && block.rows.length > 0
        ? '<tbody>' + block.rows.map((r, ri) => `<tr style="background:${ri % 2 === 1 ? '#f8fafc' : '#ffffff'};">${r.map(c => `<td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; border:1px solid #e2e8f0; vertical-align:middle;">${formatTableCellContent(c)}</td>`).join('')}<td style="padding:6px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true"><button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button></td></tr>`).join('') + '</tbody>'
        : '';
      return `<div class="deletable table-frame" style="position:relative; margin-top:10px; margin-bottom:14px; padding-left:36px; padding-right:36px;">${titleTxt}<div class="document-table-container" style="width:100%; overflow-x:auto; border-radius:6px; border:1px solid #cbd5e1;"><table class="document-table" style="width:100%; border-collapse:collapse; font-size:11.5px;">${headersHtml}${rowsHtml}</table><div style="margin-top:6px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true"><button class="btn-add-doc-table-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">➕ Tambah Baris</button></div></div></div>`;
    }
    case 'two-columns':
      return `<div class="deletable two-columns" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; margin-bottom:16px;"><div contenteditable="true" style="padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; color:#334155;"></div><div contenteditable="true" style="padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; color:#334155;"></div></div>`;
    case 'bullet-list':
    case 'bullet':
    case 'bullets':
      if (block.html) {
        return `<div class="deletable bullet-list-wrapper" style="position:relative; margin-top:8px; margin-bottom:12px; padding-left:36px; padding-right:36px;"><ul class="bullet-list" style="margin:0; padding-left:24px; color:#334155; font-size:13.5px; line-height:1.75; list-style-type:disc;">${block.html}</ul></div>`;
      }
      if (block.items && block.items.length > 0) {
        const lis = block.items.map(it => `<li contenteditable="true" style="margin-bottom:6px; outline:none; cursor:text;">${escapeHtml(it)}</li>`).join('');
        return `<div class="deletable bullet-list-wrapper" style="position:relative; margin-top:8px; margin-bottom:12px; padding-left:36px; padding-right:36px;"><ul class="bullet-list" style="margin:0; padding-left:24px; color:#334155; font-size:13.5px; line-height:1.75; list-style-type:disc;">${lis}</ul></div>`;
      }
      return `<div class="deletable bullet-list-wrapper" style="position:relative; margin-top:8px; margin-bottom:12px; padding-left:36px; padding-right:36px;">
        <ul class="bullet-list" style="margin:0; padding-left:24px; color:#334155; font-size:13.5px; line-height:1.75; list-style-type:disc;">
          <li contenteditable="true" style="margin-bottom:6px; outline:none; cursor:text;"></li>
        </ul>
      </div>`;
    case 'numbered-list':
    case 'numbered':
    case 'steps':
      if (block.html) {
        return `<div class="deletable numbered-list-wrapper" style="position:relative; margin-top:8px; margin-bottom:12px; padding-left:36px; padding-right:36px;"><ol class="numbered-list" style="margin:0; padding-left:24px; color:#334155; font-size:13.5px; line-height:1.75; list-style-type:decimal;">${block.html}</ol></div>`;
      }
      if (block.items && block.items.length > 0) {
        const stepRows = block.items.map((it, idx) => {
          const isLangkahHeader = /^Langkah\s*\d+/i.test(it.trim());
          if (isLangkahHeader) {
            return `<div style="margin-top: 8px; margin-bottom: 6px; font-weight: 700; color: #0f172a; font-size: 13.5px;" class="editable-text" contenteditable="true" style="outline: none;">${escapeHtml(it)}</div>`;
          }
          return `
          <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px;">
            <span class="editable-text step-badge" contenteditable="true" style="width: 22px; height: 22px; border-radius: 50%; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; outline: none; cursor: text;" title="Klik untuk mengedit nomor langkah">${escapeHtml(block.numbers?.[idx] || String(idx + 1))}</span>
            <span class="editable-text" contenteditable="true" style="font-size: 13px; color: #334155; line-height: 1.5; outline: none; flex: 1;">${escapeHtml(it)}</span>
          </div>`;
        }).join('');
        return `<div class="deletable steps-frame" style="position: relative; margin-top: 8px; margin-bottom: 10px; padding-left: 36px; padding-right: 36px;"><div style="display: flex; flex-direction: column; gap: 4px;">${stepRows}</div></div>`;
      }
      return `<div class="deletable numbered-list-wrapper" style="position:relative; margin-top:8px; margin-bottom:12px; padding-left:36px; padding-right:36px;">
        <ol class="numbered-list" style="margin:0; padding-left:24px; color:#334155; font-size:13.5px; line-height:1.75; list-style-type:decimal;">
          <li contenteditable="true" style="margin-bottom:6px; outline:none; cursor:text;"></li>
        </ol>
      </div>`;
    default:
      return `<div class="deletable" contenteditable="true" style="font-size:13.5px; color:#334155; margin-top:12px;"></div>`;
  }
}

function getValidDeletables(innerEl: HTMLElement | null | undefined): HTMLElement[] {
  if (!innerEl) return [];
  const raw = Array.from(
    innerEl.querySelectorAll('.deletable:not(.page):not(.page-content):not(.toc-container):not(.legend-container)')
  ) as HTMLElement[];
  return raw.filter(el => !el.parentElement?.closest('.deletable:not(.page):not(.page-content)'));
}

function getPageContainer(innerEl: HTMLElement | null | undefined): HTMLElement | null {
  if (!innerEl) return null;
  return (innerEl.querySelector('.page') || innerEl.firstElementChild) as HTMLElement | null;
}

function isContentPageId(id: string): boolean {
  return id !== 'cover-page' && !id.includes('toc') && !id.includes('legend') && !id.includes('glossary');
}

// Top boundary content may not cross on a page: the footer's real on-screen top.
// Measured via live rects so any zoom/scale applies equally to both sides.
function getContentLimit(pageContainer: HTMLElement): number {
  const footer = pageContainer.querySelector('.page-footer') as HTMLElement | null;
  if (footer) return footer.getBoundingClientRect().top;
  return pageContainer.getBoundingClientRect().bottom - 90;
}


function cleanPageHtml(id: string, rawHtml: string): string {
  if (!rawHtml) return '';
  let cleaned = rawHtml;

  const pageTempDiv = window.document.createElement('div');
  pageTempDiv.innerHTML = cleaned;
  const chapNums = pageTempDiv.querySelectorAll('.chapter-num, .step-badge');
  chapNums.forEach(cn => {
    cn.setAttribute('contenteditable', 'true');
    cn.classList.add('editable-text');
    (cn as HTMLElement).style.outline = 'none';
    (cn as HTMLElement).style.cursor = 'text';
  });

  // Ensure step frame circle badges are also editable
  const stepCircleSpans = pageTempDiv.querySelectorAll('.steps-frame span:first-child, .step-item-frame span:first-child');
  stepCircleSpans.forEach(sb => {
    sb.setAttribute('contenteditable', 'true');
    sb.classList.add('editable-text');
    (sb as HTMLElement).style.outline = 'none';
    (sb as HTMLElement).style.cursor = 'text';
  });

  // Ensure document tables have row delete buttons and add-row buttons
  const docTables = pageTempDiv.querySelectorAll('.document-table, .table-frame table');
  docTables.forEach((tbl) => {
    if (tbl.closest('.legend-container')) return;
    const thead = tbl.querySelector('thead');
    const tbody = tbl.querySelector('tbody') || tbl;

    const headTr = thead ? thead.querySelector('tr') : tbl.querySelector('tr');
    if (headTr) {
      const hasUiTh = headTr.querySelector('th[data-editor-ui], td[data-editor-ui]');
      if (!hasUiTh) {
        const th = window.document.createElement('th');
        th.setAttribute('data-editor-ui', 'true');
        th.style.cssText = 'padding:7px 4px; width:32px; text-align:center; background:#f1f5f9; border:1px solid #cbd5e1;';
        headTr.appendChild(th);
      }
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach((tr) => {
      if (tr.querySelector('th')) return;
      const hasUiTd = tr.querySelector('td[data-editor-ui], button.btn-delete-doc-table-row');
      if (!hasUiTd) {
        const td = window.document.createElement('td');
        td.setAttribute('data-editor-ui', 'true');
        td.style.cssText = 'padding:6px 4px; text-align:center; vertical-align:top; width:32px; border:1px solid #e2e8f0;';
        td.innerHTML = `<button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button>`;
        tr.appendChild(td);
      }
    });

    const frameOrContainer = tbl.closest('.table-frame, .document-table-container') || tbl.parentElement;
    if (frameOrContainer && !frameOrContainer.querySelector('.btn-add-doc-table-row')) {
      const btnDiv = window.document.createElement('div');
      btnDiv.setAttribute('data-editor-ui', 'true');
      btnDiv.style.cssText = 'margin-top:6px; display:flex; gap:8px; justify-content:flex-end;';
      btnDiv.innerHTML = `<button class="btn-add-doc-table-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">➕ Tambah Baris</button>`;
      frameOrContainer.appendChild(btnDiv);
    }
  });

  cleaned = pageTempDiv.innerHTML;

  if (id && (id.includes('toc') || id === 'page-toc')) {
    cleaned = cleaned.replace(/•\s*/g, '');

    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = cleaned;

    const allRows = Array.from(tempDiv.querySelectorAll('.toc-row-section, .toc-row-subhead'));
    let secCounter = 0;

    allRows.forEach(row => {
      const titleEl = row.querySelector('.toc-text-title, .toc-text-subtitle') as HTMLElement | null;
      if (!titleEl) return;

      const rawText = (titleEl.innerText || '').trim();

      const isSubSub = row.classList.contains('toc-row-subsubhead') || /^\d+\.\d+\.\d+\b/.test(rawText);
      const isSubhead = row.classList.contains('toc-row-subhead') || /^\d+\.\d+\b/.test(rawText);

      if (isSubSub) {
        row.className = 'toc-row-subhead toc-row-subsubhead';
        (row as HTMLElement).style.marginLeft = '0px';
        (row as HTMLElement).style.paddingLeft = '0px';

        titleEl.className = 'toc-text-subtitle editable-text';
        titleEl.setAttribute('contenteditable', 'true');
        titleEl.style.wordBreak = 'break-word';
        titleEl.style.maxWidth = '480px';
        titleEl.style.outline = 'none';
        titleEl.style.fontSize = '11.5px';
        titleEl.style.color = '#475569';
        titleEl.style.fontWeight = '500';
        titleEl.style.marginLeft = '40px';

        if (!rawText) {
          titleEl.innerText = 'Sub-Sub-Bab Baru';
        }
      } else if (isSubhead) {
        row.className = 'toc-row-subhead';
        (row as HTMLElement).style.marginLeft = '0px';
        (row as HTMLElement).style.paddingLeft = '0px';

        titleEl.className = 'toc-text-subtitle editable-text';
        titleEl.setAttribute('contenteditable', 'true');
        titleEl.style.wordBreak = 'break-word';
        titleEl.style.maxWidth = '480px';
        titleEl.style.outline = 'none';
        titleEl.style.fontSize = '12.5px';
        titleEl.style.color = '#334155';
        titleEl.style.fontWeight = '600';
        titleEl.style.marginLeft = '20px';

        if (!rawText) {
          titleEl.innerText = 'Sub-bab Baru';
        }
      } else {
        secCounter++;

        row.className = 'toc-row-section';
        (row as HTMLElement).style.marginLeft = '0px';
        (row as HTMLElement).style.paddingLeft = '0px';

        titleEl.className = 'toc-text-title editable-text';
        titleEl.setAttribute('contenteditable', 'true');
        titleEl.style.wordBreak = 'break-word';
        titleEl.style.maxWidth = '480px';
        titleEl.style.outline = 'none';
        titleEl.style.fontSize = '13.5px';
        titleEl.style.color = '#0f172a';
        titleEl.style.fontWeight = '700';

        if (!rawText) {
          titleEl.innerText = `${secCounter}. Bab Baru`;
        }
      }

      // Ensure dot leader is editable
      let dotLeader = row.querySelector('.toc-dot-leader') as HTMLElement | null;
      if (!dotLeader) {
        dotLeader = window.document.createElement('span');
        dotLeader.className = 'toc-dot-leader editable-text';
        dotLeader.setAttribute('contenteditable', 'true');
        dotLeader.style.cssText = 'flex:1; min-width:16px; border-bottom:1px dotted #94a3b8; margin:0 8px; align-self:flex-end; margin-bottom:4px; outline:none; cursor:text;';
        if (titleEl && titleEl.nextSibling) {
          row.insertBefore(dotLeader, titleEl.nextSibling);
        } else {
          row.appendChild(dotLeader);
        }
      } else {
        dotLeader.className = 'toc-dot-leader editable-text';
        dotLeader.setAttribute('contenteditable', 'true');
        dotLeader.style.minWidth = '16px';
        dotLeader.style.outline = 'none';
        dotLeader.style.cursor = 'text';
      }

      // Ensure TOC row action buttons (Convert Bab <-> Sub-Bab & Delete)
      let uiActions = row.querySelector('[data-editor-ui]') as HTMLElement | null;
      const isSub = row.classList.contains('toc-row-subhead');
      const toggleLabel = isSub ? '📖 Jadi Bab' : '📌 Jadi Sub-Bab';
      const toggleTitle = isSub ? 'Ubah ke Bab utama' : 'Ubah ke Sub-Bab';
      const toggleStyle = isSub
        ? 'background:#f0f9ff; border:1px solid #0284c7; border-radius:4px; color:#0284c7; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;'
        : 'background:#fcf5ff; border:1px solid #8b5cf6; border-radius:4px; color:#8b5cf6; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;';

      if (!uiActions) {
        uiActions = window.document.createElement('div');
        uiActions.setAttribute('data-editor-ui', 'true');
        uiActions.style.cssText = 'margin-left:8px; display:inline-flex; gap:4px; opacity:0.8; flex-shrink:0;';
        uiActions.innerHTML = `
          <button class="btn-toggle-toc-type" data-editor-ui="true" title="${toggleTitle}" style="${toggleStyle}">${toggleLabel}</button>
          <button class="btn-delete-toc-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:2px;">🗑️</button>
        `;
        row.appendChild(uiActions);
      } else {
        const toggleBtn = uiActions.querySelector('.btn-toggle-toc-type') as HTMLElement | null;
        if (toggleBtn) {
          toggleBtn.textContent = toggleLabel;
          toggleBtn.setAttribute('title', toggleTitle);
          toggleBtn.style.cssText = toggleStyle;
        }
      }
    });

    cleaned = tempDiv.innerHTML;
  }

  // Ensure TOC pages have the "Tambah Bab" button
  if (id && (id.includes('toc') || id === 'page-toc')) {
    if (!cleaned.includes('btn-add-toc-row')) {
      // Insert the button inside the toc-container, before its closing tag
      cleaned = cleaned.replace(
        /(<div[^>]*class="[^"]*toc-container[^"]*"[^>]*>[\s\S]*?)(<\/div>\s*<div[^>]*class="[^"]*page-footer)/i,
        `$1<div style="margin-top:14px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true"><button class="btn-add-toc-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">➕ Tambah Bab</button><button class="btn-add-toc-subhead" data-editor-ui="true" style="background:#fcf5ff; border:1px dashed #8b5cf6; color:#8b5cf6; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">📌 + Tambah Sub-Bab</button></div></div><div class="page-footer`
      );
    }
  }

  if (cleaned.includes('btn-add-legend-row') && !cleaned.includes('btn-add-legend-page')) {
    cleaned = cleaned.replace(
      /(<button\s+class="btn-add-legend-row"[^>]*>[\s\S]*?<\/button>)/gi,
      `$1<button class="btn-add-legend-page" data-editor-ui="true" style="background:#f0fdf4; border:1px dashed #16a34a; color:#16a34a; padding:5px 12px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer; margin-left:8px;">📄 + Tambah Halaman Glosarium</button>`
    );
  }

  return cleaned;
}

function sanitizePagesList(pagesList: GeneratedPage[], langStyle?: LangStyle): GeneratedPage[] {
  if (!pagesList) return [];
  return pagesList.map((p, idx) => {
    let cleanedHtml = cleanPageHtml(p.id, p.html);
    if (p.id !== 'cover-page') {
      const pageNum = idx + 1;
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = cleanedHtml;
      const pageEl = (tempDiv.querySelector('.page') || tempDiv.firstElementChild) as HTMLElement;
      if (pageEl) {
        const footerEl = pageEl.querySelector('.page-footer') as HTMLElement | null;
        const footerPageEl = pageEl.querySelector('.footer-page');

        if (langStyle && footerPageEl) {
          footerPageEl.textContent = langStyle.i18n.pageFooterLabel(pageNum);
        }

        if (footerEl) {
          const isEven = pageNum % 2 === 0;
          const isFlipped = footerEl.getAttribute('data-flipped') === 'true';
          const dir = isFlipped
            ? (isEven ? 'row-reverse' : 'row')
            : (isEven ? 'row' : 'row-reverse');
          footerEl.style.flexDirection = dir;
          footerEl.style.background = 'transparent';
          footerEl.style.display = 'flex';
          footerEl.style.justifyContent = 'space-between';
          footerEl.style.alignItems = 'center';
          footerEl.style.left = '48px';
          footerEl.style.right = '48px';
          footerEl.style.bottom = '32px';
        }

        // Localize Header Titles & Action Buttons if langStyle is provided
        if (langStyle) {
          // TOC Pages
          if (p.id.includes('toc') || p.id === 'page-toc') {
            const headerTitleEl = pageEl.querySelector('.chapter-name');
            if (headerTitleEl) {
              const rawTitle = headerTitleEl.textContent?.trim() || '';
              if (/^(DAFTAR ISI|TABLE OF CONTENTS|目录|جدول المحتويات|목차|目次)$/i.test(rawTitle)) {
                headerTitleEl.textContent = langStyle.i18n.tocTitle;
              }
            }

            const addTocBtn = pageEl.querySelector('.btn-add-toc-row');
            if (addTocBtn) {
              addTocBtn.textContent = langStyle.code === 'en' ? '➕ Add Chapter' : '➕ Tambah Bab';
            }
            const addSubheadBtn = pageEl.querySelector('.btn-add-toc-subhead');
            if (addSubheadBtn) {
              addSubheadBtn.textContent = langStyle.code === 'en' ? '📌 + Add Sub-Chapter' : '📌 + Tambah Sub-Bab';
            }
            const splitTocBtn = pageEl.querySelector('.btn-split-toc-pages');
            if (splitTocBtn) {
              splitTocBtn.textContent = langStyle.code === 'en' ? '✂️ Split Pages' : '✂️ Rapikan / Pecah Halaman';
            }
            const addTocPageBtn = pageEl.querySelector('.btn-add-toc-page');
            if (addTocPageBtn) {
              addTocPageBtn.textContent = langStyle.code === 'en' ? '📄 + Add TOC Page' : '📄 + Tambah Halaman Daftar Isi';
            }

            const subRows = pageEl.querySelectorAll('.toc-row-subhead');
            subRows.forEach(row => {
              (row as HTMLElement).style.marginLeft = '0px';
              (row as HTMLElement).style.marginRight = '0px';
              (row as HTMLElement).style.paddingLeft = '0px';
              (row as HTMLElement).style.paddingRight = '0px';
              (row as HTMLElement).style.width = '100%';
              const subTitle = row.querySelector('.toc-text-subtitle, .toc-text-title') as HTMLElement | null;
              if (subTitle) {
                if (langStyle.isRtl) {
                  subTitle.style.marginRight = '18px';
                  subTitle.style.marginLeft = '0px';
                } else {
                  subTitle.style.marginLeft = '18px';
                  subTitle.style.marginRight = '0px';
                }
              }
            });

            const subToggleBtns = pageEl.querySelectorAll('.btn-toggle-toc-type');
            subToggleBtns.forEach(btn => {
              const row = btn.closest('.toc-row-section, .toc-row-subhead');
              const isSub = row?.classList.contains('toc-row-subhead');
              if (langStyle.code === 'en') {
                btn.textContent = isSub ? '📖 Set as Chapter' : '📌 Set as Sub-Chapter';
                btn.setAttribute('title', isSub ? 'Convert to main Chapter' : 'Convert to Sub-Chapter');
              } else {
                btn.textContent = isSub ? '📖 Jadi Bab' : '📌 Jadi Sub-Bab';
                btn.setAttribute('title', isSub ? 'Ubah ke Bab utama' : 'Ubah ke Sub-Bab');
              }
            });
          }

          // Legend / Glossary Pages
          if (p.id.includes('legend') || p.id.includes('glossary')) {
            const headerTitleEl = pageEl.querySelector('.chapter-name');
            if (headerTitleEl) {
              const rawTitle = headerTitleEl.textContent?.trim() || '';
              if (/^(GLOSARIUM ISTILAH TEKNOLOGI|TECHNOLOGY GLOSSARY|技术术语词汇表|قاموس المصطلحات التقنية|기술 용어집|技術用語集)$/i.test(rawTitle)) {
                headerTitleEl.textContent = langStyle.i18n.glossaryTitle;
              }
            }

            const contentThs = Array.from(pageEl.querySelectorAll('.legend-container th:not([data-editor-ui])'));
            if (contentThs.length >= 3) {
              (contentThs[0] as HTMLElement).textContent = langStyle.i18n.glossaryTermHeader;
              (contentThs[1] as HTMLElement).textContent = langStyle.i18n.glossaryCategoryHeader || 'Kategori';
              (contentThs[2] as HTMLElement).textContent = langStyle.i18n.glossaryDescHeader;
            } else if (contentThs.length >= 2) {
              (contentThs[0] as HTMLElement).textContent = langStyle.i18n.glossaryTermHeader;
              (contentThs[1] as HTMLElement).textContent = langStyle.i18n.glossaryDescHeader;
            }

            const addRowBtn = pageEl.querySelector('.btn-add-legend-row');
            if (addRowBtn) {
              addRowBtn.textContent = langStyle.i18n.glossaryAddButton;
            }
            const addLegPageBtn = pageEl.querySelector('.btn-add-legend-page');
            if (addLegPageBtn) {
              addLegPageBtn.textContent = langStyle.code === 'en' ? '📄 + Add Glossary Page' : '📄 + Tambah Halaman Glosarium';
            }
          }
        }

        cleanedHtml = pageEl.outerHTML;
      }
    }
    return {
      ...p,
      html: cleanedHtml,
    };
  });
}

const PageContentWrapper = memo(({
  id,
  html,
  idx,
  isDragOver,
  isSpecialPage,
  bodyFont,
  isViewer,
  onDeletePage,
  onUploadCoverImage,
  onResetCoverImage,
  hasCustomCoverImage,
  coverImageFit = 'contain',
  onToggleCoverFit,
  onFlipFooter,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  id: string;
  html: string;
  idx: number;
  isDragOver: boolean;
  isSpecialPage: boolean;
  bodyFont: string;
  isViewer?: boolean;
  onDeletePage?: (id: string) => void;
  onUploadCoverImage?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetCoverImage?: () => void;
  hasCustomCoverImage?: boolean;
  coverImageFit?: 'contain' | 'cover' | 'fill';
  onToggleCoverFit?: () => void;
  onFlipFooter?: (idx: number) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}) => {
  const isCoverPage = id === 'cover-page';
  const displayHtml = isViewer ? html.replace(/contenteditable="true"/g, 'contenteditable="false"') : html;

  return (
    <div className="page-content-wrapper" data-page-idx={idx} style={{ position: 'relative' }}>
      {!isViewer && !isCoverPage && (
        <div data-editor-ui="true" style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 20,
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onFlipFooter && onFlipFooter(idx);
            }}
            style={{
              background: 'rgba(0, 210, 255, 0.12)',
              border: '1px solid #00d2ff',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            title="Putar balik posisi footer/halaman (Kiri ↔ Kanan)"
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 210, 255, 0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0, 210, 255, 0.12)')}
          >
            🔄 Putar Kiri/Kanan
          </button>

          {!isCoverPage && (
            <button
              onClick={() => onDeletePage && onDeletePage(id)}
              title={isSpecialPage ? 'Hapus Halaman Daftar Isi' : 'Hapus Halaman ini'}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            >
              🗑️ Hapus Halaman
            </button>
          )}
        </div>
      )}

      {!isViewer && isCoverPage && (
        <div data-editor-ui="true" style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 30,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 210, 255, 0.4)',
          padding: '6px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'linear-gradient(135deg, #00d2ff, #3b82f6)',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            margin: 0,
          }}>
            🖼️ {hasCustomCoverImage ? 'Ganti Cover Image' : 'Upload Cover'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onUploadCoverImage} />
          </label>

          {hasCustomCoverImage && onToggleCoverFit && (
            <button
              onClick={onToggleCoverFit}
              style={{
                background: 'rgba(0, 210, 255, 0.15)',
                border: '1px solid #00d2ff',
                color: '#38bdf8',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Ubah ukuran tampilan gambar cover (Utuh / Crop / Stretch)"
            >
              {coverImageFit === 'contain' ? '🔍 Mode: Utuh' : coverImageFit === 'cover' ? '📐 Mode: Crop' : '↔️ Mode: Stretch'}
            </button>
          )}

          {hasCustomCoverImage && onResetCoverImage && (
            <button
              onClick={onResetCoverImage}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#e2e8f0',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Kembalikan ke warna/gradien tema"
            >
              🔄 Reset ke Cover Standar
            </button>
          )}

          {onDeletePage && (
            <button
              onClick={() => onDeletePage(id)}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Hapus Halaman Cover"
            >
              🗑️ Hapus Cover
            </button>
          )}
        </div>
      )}

      <div
        data-inner-page="true"
        onDragOver={e => !isViewer && onDragOver(e, id)}
        onDragLeave={() => !isViewer && onDragLeave(id)}
        onDrop={e => !isViewer && onDrop(e, id)}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
        style={{
          width: '794px',
          height: '1123px',
          minHeight: '1123px',
          maxHeight: '1123px',
          overflow: 'hidden',
          borderRadius: '10px',
          boxShadow: isDragOver
            ? '0 0 0 3px #00d2ff, 0 12px 40px rgba(0,210,255,0.4)'
            : '0 8px 30px rgba(0,0,0,0.4)',
          color: '#1e293b',
          fontFamily: bodyFont,
          position: 'relative',
          boxSizing: 'border-box',
          transition: 'box-shadow 0.2s ease',
        }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.html === nextProps.html &&
    prevProps.idx === nextProps.idx &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.isSpecialPage === nextProps.isSpecialPage &&
    prevProps.bodyFont === nextProps.bodyFont &&
    prevProps.hasCustomCoverImage === nextProps.hasCustomCoverImage &&
    prevProps.coverImageFit === nextProps.coverImageFit &&
    prevProps.isViewer === nextProps.isViewer
  );
});

function applyThemeToExistingPages(pagesList: GeneratedPage[], newThemeId: ColorThemeId, customHex?: string): GeneratedPage[] {
  const newTheme = getCustomColorTheme(newThemeId, customHex);
  const allThemes = getAllColorThemes();

  return pagesList.map((p) => {
    let html = p.html;

    allThemes.forEach((t) => {
      // 1. Cover gradients
      if (t.coverGradient) {
        html = html.replaceAll(t.coverGradient, newTheme.coverGradient);
      }

      // 2. Heading fonts & Body fonts
      if (t.headingFont) {
        html = html.replaceAll(`font-family:${t.headingFont}`, `font-family:${newTheme.headingFont}`);
        html = html.replaceAll(`font-family: ${t.headingFont}`, `font-family: ${newTheme.headingFont}`);
      }
      if (t.bodyFont) {
        html = html.replaceAll(`font-family:${t.bodyFont}`, `font-family:${newTheme.bodyFont}`);
        html = html.replaceAll(`font-family: ${t.bodyFont}`, `font-family: ${newTheme.bodyFont}`);
      }

      // 3. Cover Badges & Accent Bars
      if (t.coverBadgeBg) {
        html = html.replaceAll(`background:${t.coverBadgeBg}`, `background:${newTheme.coverBadgeBg}`);
        html = html.replaceAll(`background: ${t.coverBadgeBg}`, `background: ${newTheme.coverBadgeBg}`);
      }
      if (t.coverBadgeBorder) {
        html = html.replaceAll(`border:1px solid ${t.coverBadgeBorder}`, `border:1px solid ${newTheme.coverBadgeBorder}`);
        html = html.replaceAll(`border: 1px solid ${t.coverBadgeBorder}`, `border: 1px solid ${newTheme.coverBadgeBorder}`);
      }
      if (t.coverBadgeColor) {
        html = html.replaceAll(`color:${t.coverBadgeColor}`, `color:${newTheme.coverBadgeColor}`);
        html = html.replaceAll(`color: ${t.coverBadgeColor}`, `color: ${newTheme.coverBadgeColor}`);
      }
      if (t.coverAccentBar) {
        html = html.replaceAll(`solid ${t.coverAccentBar}`, `solid ${newTheme.coverAccentBar}`);
      }
      if (t.coverSubtitleColor) {
        html = html.replaceAll(`color:${t.coverSubtitleColor}`, `color:${newTheme.coverSubtitleColor}`);
        html = html.replaceAll(`color: ${t.coverSubtitleColor}`, `color: ${newTheme.coverSubtitleColor}`);
      }

      // 4. Subhead Borders
      if (t.subheadBorderColor) {
        html = html.replaceAll(`border-bottom: 2px solid ${t.subheadBorderColor}`, `border-bottom: 2px solid ${newTheme.subheadBorderColor}`);
        html = html.replaceAll(`border-bottom:2px solid ${t.subheadBorderColor}`, `border-bottom:2px solid ${newTheme.subheadBorderColor}`);
      }

      // 5. Feature & Step Borders/Backgrounds
      if (t.featureBorderColor) {
        html = html.replaceAll(`border-left:4px solid ${t.featureBorderColor}`, `border-left:4px solid ${newTheme.featureBorderColor}`);
        html = html.replaceAll(`border-left: 4px solid ${t.featureBorderColor}`, `border-left: 4px solid ${newTheme.featureBorderColor}`);
        html = html.replaceAll(`border-right:4px solid ${t.featureBorderColor}`, `border-right:4px solid ${newTheme.featureBorderColor}`);
        html = html.replaceAll(`border-right: 4px solid ${t.featureBorderColor}`, `border-right: 4px solid ${newTheme.featureBorderColor}`);
      }
      if (t.featureBgColor) {
        html = html.replaceAll(`background:${t.featureBgColor}`, `background:${newTheme.featureBgColor}`);
        html = html.replaceAll(`background: ${t.featureBgColor}`, `background: ${newTheme.featureBgColor}`);
      }
      if (t.stepBorderColor) {
        html = html.replaceAll(`border-left:4px solid ${t.stepBorderColor}`, `border-left:4px solid ${newTheme.stepBorderColor}`);
        html = html.replaceAll(`border-left: 4px solid ${t.stepBorderColor}`, `border-left: 4px solid ${newTheme.stepBorderColor}`);
      }
      if (t.stepBgColor) {
        html = html.replaceAll(`background:${t.stepBgColor}`, `background:${newTheme.stepBgColor}`);
        html = html.replaceAll(`background: ${t.stepBgColor}`, `background: ${newTheme.stepBgColor}`);
      }

      // 6. Chapter Num Badges
      if (t.chapterNumBg) {
        html = html.replaceAll(`background:${t.chapterNumBg}`, `background:${newTheme.chapterNumBg}`);
        html = html.replaceAll(`background: ${t.chapterNumBg}`, `background: ${newTheme.chapterNumBg}`);
      }

      // 7. TOC Badges & Accent colors
      if (t.tocPageNumColor) {
        html = html.replaceAll(`color:${t.tocPageNumColor}`, `color:${newTheme.tocPageNumColor}`);
        html = html.replaceAll(`color: ${t.tocPageNumColor}`, `color: ${newTheme.tocPageNumColor}`);
      }
      if (t.tocPageNumBg) {
        html = html.replaceAll(`background:${t.tocPageNumBg}`, `background:${newTheme.tocPageNumBg}`);
        html = html.replaceAll(`background: ${t.tocPageNumBg}`, `background: ${newTheme.tocPageNumBg}`);
      }
      if (t.tocDotColor) {
        html = html.replaceAll(`border-bottom:1px dotted ${t.tocDotColor}`, `border-bottom:1px dotted ${newTheme.tocDotColor}`);
        html = html.replaceAll(`border-bottom: 1px dotted ${t.tocDotColor}`, `border-bottom: 1px dotted ${newTheme.tocDotColor}`);
      }
      if (t.accent) {
        html = html.replaceAll(`color:${t.accent}`, `color:${newTheme.accent}`);
        html = html.replaceAll(`color: ${t.accent}`, `color: ${newTheme.accent}`);
        html = html.replaceAll(`border-bottom:3px solid ${t.accent}`, `border-bottom:3px solid ${newTheme.accent}`);
        html = html.replaceAll(`border-bottom: 3px solid ${t.accent}`, `border-bottom: 3px solid ${newTheme.accent}`);
      }
    });

    const pageTempDiv = window.document.createElement('div');
    pageTempDiv.innerHTML = html;
    const pageEl = (pageTempDiv.querySelector('.page') || pageTempDiv.firstElementChild) as HTMLElement | null;
    if (pageEl) {
      allThemes.forEach((t) => {
        if (t.patternClassName) pageEl.classList.remove(t.patternClassName);
      });
      pageEl.classList.add(newTheme.patternClassName);

      if (pageEl.classList.contains('page-cover')) {
        pageEl.style.background = newTheme.coverGradient;
        pageEl.style.border = 'none';
        pageEl.querySelectorAll('.page-side-accent-strip, .page-header-decor-bar, .page-footer-decor-bar').forEach(el => el.remove());
        
        const badge = pageEl.querySelector('.cover-badge, [class*="badge"]') as HTMLElement | null;
        if (badge) {
          badge.style.background = newTheme.coverBadgeBg;
          badge.style.border = `1px solid ${newTheme.coverBadgeBorder}`;
          badge.style.color = newTheme.coverBadgeColor;
        }
        const titleBar = pageEl.querySelector('.cover-title-bar, [class*="title-bar"]') as HTMLElement | null;
        if (titleBar) {
          titleBar.style.borderColor = newTheme.coverAccentBar;
        }
      } else {
        pageEl.style.backgroundColor = newTheme.pageBgColor;
        pageEl.style.backgroundImage = '';
        pageEl.style.border = newTheme.pageFrameBorder;

        let decorBar = pageEl.querySelector('.page-header-decor-bar') as HTMLElement | null;
        if (!decorBar) {
          decorBar = window.document.createElement('div');
          decorBar.className = 'page-header-decor-bar';
          pageEl.insertBefore(decorBar, pageEl.firstChild);
        }
        decorBar.style.background = newTheme.headerBarGradient;

        let footerBar = pageEl.querySelector('.page-footer-decor-bar') as HTMLElement | null;
        if (!footerBar) {
          footerBar = window.document.createElement('div');
          footerBar.className = 'page-footer-decor-bar';
          pageEl.insertBefore(footerBar, pageEl.firstChild);
        }
        footerBar.style.background = newTheme.headerBarGradient;

        let sideStrip = pageEl.querySelector('.page-side-accent-strip') as HTMLElement | null;
        if (!sideStrip) {
          sideStrip = window.document.createElement('div');
          sideStrip.className = 'page-side-accent-strip';
          pageEl.insertBefore(sideStrip, pageEl.firstChild);
        }
        sideStrip.style.background = newTheme.accent;

        // Dynamic element color updates for content pages
        pageEl.querySelectorAll('.chapter-num').forEach(cn => {
          (cn as HTMLElement).style.background = newTheme.chapterNumBg;
          (cn as HTMLElement).style.color = newTheme.chapterNumColor;
        });

        pageEl.querySelectorAll('.chapter-name').forEach(cn => {
          (cn as HTMLElement).style.borderBottomColor = newTheme.accent;
          (cn as HTMLElement).style.fontFamily = newTheme.headingFont;
        });

        pageEl.querySelectorAll('.subhead-frame, .subhead-title').forEach(st => {
          (st as HTMLElement).style.borderBottomColor = newTheme.subheadBorderColor;
        });

        pageEl.querySelectorAll('.step-card').forEach(sc => {
          (sc as HTMLElement).style.borderLeftColor = newTheme.stepBorderColor;
          (sc as HTMLElement).style.backgroundColor = newTheme.stepBgColor;
        });

        pageEl.querySelectorAll('.document-table th, .legend-container th').forEach(th => {
          if (!th.getAttribute('data-editor-ui')) {
            (th as HTMLElement).style.backgroundColor = newTheme.accentLight;
            (th as HTMLElement).style.color = newTheme.accentDark;
          }
        });

        pageEl.querySelectorAll('.toc-num, .toc-page-num').forEach(tn => {
          (tn as HTMLElement).style.backgroundColor = newTheme.tocPageNumBg;
          (tn as HTMLElement).style.color = newTheme.tocPageNumColor;
        });

        pageEl.querySelectorAll('.enriched-paragraph, .body-text, p').forEach(p => {
          (p as HTMLElement).style.fontFamily = newTheme.bodyFont;
        });
      }

      const footerEl = pageEl.querySelector('.page-footer') as HTMLElement | null;
      if (footerEl) {
        footerEl.style.background = 'transparent';
        footerEl.style.display = 'flex';
        footerEl.style.justifyContent = 'space-between';
        footerEl.style.alignItems = 'center';
        footerEl.style.left = '48px';
        footerEl.style.right = '48px';
        footerEl.style.bottom = '32px';
      }

      const existingWatermarks = pageEl.querySelectorAll('.page-corner-watermark, .page-center-watermark');
      existingWatermarks.forEach(wm => wm.remove());

      if (newTheme.centerWatermarkSvg) {
        const wmWrapCenter = window.document.createElement('div');
        wmWrapCenter.innerHTML = newTheme.centerWatermarkSvg;
        if (wmWrapCenter.firstElementChild) {
          pageEl.insertBefore(wmWrapCenter.firstElementChild, pageEl.firstChild);
        }
      }

      const wmWrapTop = window.document.createElement('div');
      wmWrapTop.innerHTML = newTheme.cornerWatermarkSvg;
      if (wmWrapTop.firstElementChild) {
        pageEl.insertBefore(wmWrapTop.firstElementChild, pageEl.firstChild);
      }

      const wmWrapBottom = window.document.createElement('div');
      wmWrapBottom.innerHTML = `<svg class="page-corner-watermark bottom-left" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">${newTheme.cornerWatermarkSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;
      if (wmWrapBottom.firstElementChild) {
        pageEl.insertBefore(wmWrapBottom.firstElementChild, pageEl.firstChild);
      }

      html = pageEl.outerHTML;
    }

    return { ...p, html };
  });
}

export function HtmlDocViewer({ docTitle, sections, techLegend, language, colorTheme, customAccentColor, initialPages, isViewer, onTitleChange, onPagesChange, onUserEdit, onRegisterAddChapter, onRegisterAddSubhead, onRegisterSyncToc, onRegisterAutoSplitToc, onRegisterReflow, onRegisterSyncDom }: Props) {
  const langStyle = getLangStyle(language, colorTheme);
  const [pages, setPages] = useState<GeneratedPage[]>(() => {
    const raw = initialPages && initialPages.length > 0 ? sanitizePagesList(initialPages) : [];
    return applyThemeToExistingPages(raw, colorTheme || DEFAULT_COLOR_THEME, customAccentColor);
  });
  const [customCoverImage, setCustomCoverImage] = useState<string | undefined>(undefined);
  const [coverImageFit, setCoverImageFit] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<GeneratedPage[]>(pages);
  pagesRef.current = pages;

  // Custom accent color effect (when provided)
  useEffect(() => {
    if (customAccentColor) {
      setPages(prev => applyThemeToExistingPages(prev, colorTheme || DEFAULT_COLOR_THEME, customAccentColor));
    }
  }, [customAccentColor]);

  const renumberFooterPagesList = useCallback((sourcePages: GeneratedPage[]): GeneratedPage[] => {
    return sanitizePagesList(sourcePages, langStyle);
  }, [langStyle]);

  // Imperative DOM → state sync exposed to parent via onRegisterSyncDom.
  // Reads the live contenteditable HTML from every rendered page and returns it.
  const syncAllPagesFromDom = useCallback((): GeneratedPage[] => {
    const currentPages = pagesRef.current;
    if (!containerRef.current || !currentPages || currentPages.length === 0) return currentPages || [];
    const updated = currentPages.map((p, idx) => {
      const pageWrapper = containerRef.current?.querySelector(`[data-page-idx="${idx}"]`);
      const inner = pageWrapper?.querySelector('[data-inner-page]');
      if (inner) {
        const firstEl = inner.firstElementChild as HTMLElement | null;
        if (firstEl) {
          const footerEl = firstEl.querySelector('.page-footer') as HTMLElement | null;
          if (footerEl) {
            footerEl.style.background = 'transparent';
            footerEl.style.display = 'flex';
            footerEl.style.justifyContent = 'space-between';
            footerEl.style.alignItems = 'center';
            footerEl.style.left = '48px';
            footerEl.style.right = '48px';
            footerEl.style.bottom = '32px';
          }
        }
        const html = firstEl ? firstEl.outerHTML : inner.innerHTML;
        return { id: p.id, html };
      }
      return p;
    });
    const renumbered = renumberFooterPagesList(updated);
    setPages(renumbered);
    return renumbered;
  }, [renumberFooterPagesList]);

  // Track hovered block by POSITION (page index + block index within page)
  const [hoveredBlockHtml, setHoveredBlockHtml] = useState<string | null>(null);
  const [hoveredPageIdx, setHoveredPageIdx] = useState<number>(-1);
  const [hoveredBlockIdx, setHoveredBlockIdx] = useState<number>(-1);
  const [hoverCoords, setHoverCoords] = useState<{ top: number; left: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2500);
  }, []);

  // History Undo/Redo Stacks for Document Object Movements & Structural Actions
  const undoStackRef = useRef<GeneratedPage[][]>([]);
  const redoStackRef = useRef<GeneratedPage[][]>([]);

  const saveHistorySnapshot = useCallback(() => {
    const currentPages = pagesRef.current;
    if (!currentPages || currentPages.length === 0) return;
    const snapshot = currentPages.map(p => ({ ...p }));
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 40) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      showToast('ℹ️ Tidak ada aksi untuk dibatalkan');
      return;
    }
    const currentPages = pagesRef.current.map(p => ({ ...p }));
    redoStackRef.current.push(currentPages);

    const prevPages = undoStackRef.current.pop()!;
    setPages(prevPages);
    showToast('↩️ Undo: Perubahan dibatalkan');
  }, [showToast]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) {
      showToast('ℹ️ Tidak ada aksi untuk diulang');
      return;
    }
    const currentPages = pagesRef.current.map(p => ({ ...p }));
    undoStackRef.current.push(currentPages);

    const nextPages = redoStackRef.current.pop()!;
    setPages(nextPages);
    showToast('↪️ Redo: Perubahan diterapkan kembali');
  }, [showToast]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (e.shiftKey) {
          if (redoStackRef.current.length > 0) {
            e.preventDefault();
            handleRedo();
          }
        } else {
          const activeEl = document.activeElement as HTMLElement | null;
          const isInputOrTextArea = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          if (!isInputOrTextArea && undoStackRef.current.length > 0) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if (key === 'y') {
        const activeEl = document.activeElement as HTMLElement | null;
        const isInputOrTextArea = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        if (!isInputOrTextArea && redoStackRef.current.length > 0) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const handleToggleCoverFit = () => {
    const nextFit: 'contain' | 'cover' | 'fill' =
      coverImageFit === 'contain' ? 'cover' : coverImageFit === 'cover' ? 'fill' : 'contain';
    setCoverImageFit(nextFit);
    if (customCoverImage) {
      setPages(prev => prev.map(p => {
        if (p.id === 'cover-page') {
          return generateCoverPage(docTitle, langStyle, customCoverImage, nextFit);
        }
        return p;
      }));
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCustomCoverImage(dataUrl);
        setPages(prev => prev.map(p => {
          if (p.id === 'cover-page') {
            return generateCoverPage(docTitle, langStyle, dataUrl, coverImageFit);
          }
          return p;
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetCoverImage = () => {
    setCustomCoverImage(undefined);
    setPages(prev => prev.map(p => {
      if (p.id === 'cover-page') {
        return generateCoverPage(docTitle, langStyle);
      }
      return p;
    }));
  };

  const handleAddCoverPage = () => {
    setPages(prev => {
      if (prev.some(p => p.id === 'cover-page')) return prev;
      const coverPage = generateCoverPage(docTitle, langStyle, customCoverImage, coverImageFit);
      return [coverPage, ...prev];
    });
  };

  // Add a new Chapter page (Bab Baru)
  const handleAddChapterPage = useCallback(() => {
    setPages(prev => {
      let maxChapterNum = 0;
      prev.forEach(p => {
        if (typeof window !== 'undefined') {
          const tempDiv = window.document.createElement('div');
          tempDiv.innerHTML = p.html || '';
          const chapNumEl = tempDiv.querySelector('.chapter-num');
          if (chapNumEl) {
            const numText = chapNumEl.textContent?.trim() || '';
            const num = parseInt(numText, 10);
            if (!isNaN(num) && num > maxChapterNum) {
              maxChapterNum = num;
            }
          }
        }
      });
      const nextSecNum = maxChapterNum + 1;
      const chapterId = `sec-${nextSecNum}-${Date.now()}`;

      const newPageCount = prev.length + 1;
      const isEven = newPageCount % 2 === 0;
      const pageNumStr = langStyle.i18n.pageFooterLabel(newPageCount);

      const headerHtml = `
        <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px; margin-top: 0; padding-left: 36px; padding-right: 36px;">
          <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
            <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
              <div class="chapter-num editable-text" contenteditable="true" style="background:${langStyle.colorTheme.chapterNumBg}; color:${langStyle.colorTheme.chapterNumColor}; outline:none; cursor:text;">${nextSecNum}</div>
              <div class="chapter-info">
                <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${nextSecNum}. Bab Baru</div>
              </div>
            </div>
          </div>
        </div>`;

      const footerHtml = `
        <div class="page-footer" style="position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
          <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(docTitle)}</div>
          <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${escapeHtml(pageNumStr)}</div>
        </div>`;

      const headerDecorBar = `<div class="page-header-decor-bar" style="background:${langStyle.colorTheme.headerBarGradient};"></div>`;
      const watermarkSvg = `${langStyle.colorTheme.cornerWatermarkSvg}<svg class="page-corner-watermark bottom-left" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">${langStyle.colorTheme.cornerWatermarkSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;

      const pageHtml = `
        <div class="page page-content ${langStyle.colorTheme.patternClassName}" id="page-${chapterId}" data-page="${chapterId}" dir="${langStyle.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:${langStyle.colorTheme.pageBgColor}; border:${langStyle.colorTheme.pageFrameBorder}; border-radius:10px; padding:40px 48px; position:relative; overflow:hidden;">
          ${headerDecorBar}
          ${watermarkSvg}
          ${headerHtml}
          <p class="deletable enriched-paragraph" contenteditable="true" style="font-size:13.5px; line-height:1.75; color:#334155; margin-top:16px; margin-bottom:12px; text-align:justify; text-justify:inter-word; word-break:normal; overflow-wrap:break-word; hyphens:none; padding-left:36px; padding-right:36px; text-indent:0;">Tambahkan deskripsi atau isi materi bab di sini. Klik teks ini untuk mengedit.</p>
          ${footerHtml}
        </div>`;

      const newChapterPage: GeneratedPage = { id: chapterId, html: pageHtml };

      let insertIdx = prev.length;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].id.includes('legend') || prev[i].id.includes('glossary')) {
          insertIdx = i;
        }
      }

      const nextPages = [...prev];
      nextPages.splice(insertIdx, 0, newChapterPage);

      const updatedWithToc = nextPages.map((p) => {
        if (p.id.includes('toc')) {
          const tempDiv = window.document.createElement('div');
          tempDiv.innerHTML = p.html;
          const tocContainer = tempDiv.querySelector('.toc-container');
          if (tocContainer) {
            const newTocRow = window.document.createElement('div');
            newTocRow.className = 'toc-row-section';
            newTocRow.setAttribute('data-sec-idx', String(nextSecNum - 1));
            newTocRow.style.cssText = 'display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; margin-bottom:6px; padding-bottom:4px; width:100%;';
            newTocRow.innerHTML = `
              <span class="toc-text-title editable-text" contenteditable="true" style="font-weight:700; font-size:13.5px; color:#0f172a; outline:none; display:inline-block; max-width:540px; word-break:break-word; cursor:text;">${nextSecNum}. Bab Baru</span>
              <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${langStyle.colorTheme.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:4px; outline:none; cursor:text;"></span>
              <span class="toc-text-page editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:${langStyle.colorTheme.tocPageNumColor}; background:${langStyle.colorTheme.tocPageNumBg}; width:32px; min-width:32px; height:22px; line-height:22px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${insertIdx + 1}</span>
            `;

            const btnContainer = tocContainer.querySelector('[data-editor-ui]');
            if (btnContainer) {
              tocContainer.insertBefore(newTocRow, btnContainer);
            } else {
              tocContainer.appendChild(newTocRow);
            }
            const pagePage = tempDiv.querySelector('.page') || tempDiv.firstElementChild;
            const finalTocHtml = pagePage ? (pagePage as HTMLElement).outerHTML : tempDiv.innerHTML;
            return { ...p, html: finalTocHtml };
          }
        }
        return p;
      });

      return renumberFooterPagesList(updatedWithToc);
    });

    setTimeout(() => {
      if (containerRef.current) {
        const pagesWrapper = containerRef.current.querySelectorAll('.page-content-wrapper');
        const lastWrapper = pagesWrapper[pagesWrapper.length - 1];
        lastWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }, [docTitle, langStyle]);

  // Add a Sub-heading (Heading 2.1) to active page
  const handleAddSubhead = useCallback(() => {
    try {
      setPages(prev => {
        if (!prev || prev.length === 0) return prev;
        let targetIdx = hoveredPageIdx >= 0 ? hoveredPageIdx : prev.length - 1;
        if (prev[targetIdx]?.id === 'cover-page' || prev[targetIdx]?.id.includes('toc')) {
          targetIdx = prev.findIndex(p => p && p.id !== 'cover-page' && !p.id.includes('toc'));
          if (targetIdx < 0) targetIdx = prev.length - 1;
        }

        const targetPage = prev[targetIdx];
        if (!targetPage || !targetPage.html) return prev;

        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = targetPage.html;
        const pageEl = (tempDiv.querySelector('.page') || tempDiv.firstElementChild) as HTMLElement;
        if (!pageEl) return prev;

        const chapNumEl = pageEl.querySelector('.chapter-num');
        const rawSecText = chapNumEl ? (chapNumEl.textContent?.trim() || '1') : '1';
        const numMatch = rawSecText.match(/\d+/);
        const secNum = numMatch ? numMatch[0] : '1';
        const secIdxVal = Math.max(0, parseInt(secNum, 10) - 1);

        const existingSubheads = pageEl.querySelectorAll('.subhead-title');
        const subNum = existingSubheads.length + 1;
        const subNumStr = `${secNum}.${subNum}`;

        const subheadEl = window.document.createElement('div');
        subheadEl.className = 'deletable subhead-title';
        subheadEl.setAttribute('contenteditable', 'true');
        subheadEl.style.cssText = `font-size:15px; font-weight:700; color:#1e293b; margin-top:18px; margin-bottom:8px; padding-left:36px; padding-right:36px; font-family:'Inter', sans-serif; border-bottom: 2px solid ${langStyle.colorTheme.subheadBorderColor}; padding-bottom: 4px; outline:none; cursor:text;`;
        subheadEl.textContent = `${subNumStr} Sub-bab Baru`;

        const footerEl = pageEl.querySelector('.page-footer');
        if (footerEl) {
          pageEl.insertBefore(subheadEl, footerEl);
        } else {
          pageEl.appendChild(subheadEl);
        }

        const updatedPageHtml = pageEl.outerHTML;

        const updatedPages = prev.map((p, i) => {
          if (i === targetIdx) {
            return { ...p, html: updatedPageHtml };
          }
          if (p && p.id && p.id.includes('toc') && p.html) {
            const tocTemp = window.document.createElement('div');
            tocTemp.innerHTML = p.html;
            const tocContainer = tocTemp.querySelector('.toc-container');
            if (tocContainer) {
              const subRow = window.document.createElement('div');
              subRow.className = 'toc-row-subhead';
              subRow.setAttribute('data-sec-idx', String(secIdxVal));
              subRow.style.cssText = `display:flex; justify-content:space-between; align-items:baseline; margin-left:18px; margin-top:4px; margin-bottom:4px; padding-bottom:2px; width:100%;`;
              subRow.innerHTML = `
                <span class="toc-text-subtitle editable-text" contenteditable="true" style="font-size:12.5px; color:#334155; outline:none; display:inline-block; max-width:510px; word-break:break-word; cursor:text;">${subNumStr} Sub-bab Baru</span>
                <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${langStyle.colorTheme.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:3px; outline:none; cursor:text;"></span>
                <span class="toc-text-page editable-text" contenteditable="true" style="font-size:11.5px; font-weight:600; color:${langStyle.colorTheme.tocPageNumColor}; background:${langStyle.colorTheme.tocPageNumBg}; width:32px; min-width:32px; height:20px; line-height:20px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${targetIdx + 1}</span>
              `;
              const btnContainer = tocContainer.querySelector('[data-editor-ui]');
              if (btnContainer) {
                tocContainer.insertBefore(subRow, btnContainer);
              } else {
                tocContainer.appendChild(subRow);
              }
              const pagePage = tocTemp.querySelector('.page') || tocTemp.firstElementChild;
              const finalTocHtml = pagePage ? (pagePage as HTMLElement).outerHTML : tocTemp.innerHTML;
              return { ...p, html: finalTocHtml };
            }
          }
          return p;
        });

        return updatedPages;
      });
    } catch (err) {
      console.error('Error adding subhead:', err);
    }
  }, [hoveredPageIdx, langStyle]);

  const createTocPage = useCallback((pageNum: number, title: string, lang: any, itemsHtml: string = ''): GeneratedPage => {
    const isEven = pageNum % 2 === 0;
    const id = `toc-page-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const headerTitle = lang.i18n.tocTitle;
    const ct = lang.colorTheme;

    const headerHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px; padding-left: 36px; padding-right: 36px;">
        <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
          <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
            <div class="chapter-num" style="background:${ct.tocChapterNumBg}; color:${ct.tocChapterNumColor};">📋</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${escapeHtml(headerTitle)}</div>
            </div>
          </div>
        </div>
      </div>`;

    const footerHtml = `
      <div class="page-footer" style="position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
        <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(title)}</div>
        <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${escapeHtml(lang.i18n.pageFooterLabel(pageNum))}</div>
      </div>`;

    const html = `
    <div class="page page-content" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:#ffffff; border-radius:10px; padding:40px 48px; position:relative; overflow:hidden;">
      ${headerHtml}

      <div class="deletable toc-container" style="position: relative; margin-top: 10px; margin-bottom: 16px; background: #ffffff; border-radius: 10px; padding: 18px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; max-height:880px; overflow:hidden;">
        ${itemsHtml}
        <div style="margin-top:14px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true">
          <button class="btn-split-toc-pages" data-editor-ui="true" style="background:#fefce8; border:1px dashed #ca8a04; color:#ca8a04; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">✂️ Rapikan / Pecah Halaman</button>
          <button class="btn-add-toc-page" data-editor-ui="true" style="background:#f0fdf4; border:1px dashed #16a34a; color:#16a34a; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">📄 + Tambah Halaman Daftar Isi</button>
          <button class="btn-delete-toc-page" data-editor-ui="true" style="background:#fef2f2; border:1px dashed #ef4444; color:#ef4444; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">🗑️ Hapus Halaman Daftar Isi Ini</button>
        </div>
      </div>

      ${footerHtml}
    </div>`;

    return { id, html };
  }, []);

  // Regenerate / Auto-Sync Table of Contents from actual pages and headings
  const handleRegenerateToc = useCallback(() => {
    setPages(prev => {
      if (!prev || prev.length === 0) return prev;

      interface TocEntry {
        type: 'section' | 'subhead' | 'legend';
        /** Kedalaman judul 2..5 (sub-bab sampai sub-sub-sub-sub-bab); hanya untuk type 'subhead'. */
        level?: number;
        title: string;
        pageNum: number;
        secIdx: number;
      }

      const tocEntries: TocEntry[] = [];
      let secCounter = 0;

      prev.forEach((p, pIdx) => {
        const actualPageNum = pIdx + 1;
        if (p.id === 'cover-page' || p.id.includes('toc')) return;

        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = p.html || '';

        // Check if page contains Glosarium / Legend
        if (p.id.includes('legend') || p.id.includes('glossary') || tempDiv.querySelector('.legend-container')) {
          const alreadyHasLegend = tocEntries.some(e => e.type === 'legend');
          if (!alreadyHasLegend) {
            tocEntries.push({
              type: 'legend',
              title: langStyle.i18n.tocGlossaryTitle,
              pageNum: actualPageNum,
              secIdx: secCounter,
            });
          }
          return;
        }

        // Check for Chapter Header Block
        const headerBlock = tempDiv.querySelector('.page-header-block');
        if (headerBlock) {
          secCounter++;
          const chapNumEl = headerBlock.querySelector('.chapter-num');
          const chapNameEl = headerBlock.querySelector('.chapter-name');

          const numText = chapNumEl?.textContent?.trim() || String(secCounter);
          let nameText = chapNameEl?.textContent?.trim() || `Bab ${secCounter}`;

          nameText = nameText.replace(/^\d+[\.\)]?\s*/, '').trim();
          const fullTitle = numText ? `${numText}. ${nameText}` : nameText;

          tocEntries.push({
            type: 'section',
            title: fullTitle,
            pageNum: actualPageNum,
            secIdx: secCounter - 1,
          });
        }

        // Judul bertingkat pada halaman ini, dari sub-bab (Heading 2) sampai level 5
        const subheadEls = Array.from(tempDiv.querySelectorAll('.subhead-title, .subhead-frame, .subhead-text, .body-subtitle, .body-sub-subtitle, .body-sub-sub-subtitle, .body-sub-sub-sub-subtitle'));
        const seenSubTexts = new Set<string>();
        subheadEls.forEach(subEl => {
          const subText = subEl.textContent?.trim() || '';
          if (subText && !seenSubTexts.has(subText)) {
            seenSubTexts.add(subText);
            tocEntries.push({
              type: 'subhead',
              level: detectSubheadLevelFromEl(subEl),
              title: subText,
              pageNum: actualPageNum,
              secIdx: Math.max(0, secCounter - 1),
            });
          }
        });
      });

      const ct = langStyle.colorTheme;
      const subIndentSide = langStyle.isRtl ? 'margin-right' : 'margin-left';

      const MAX_TOC_ROWS = 18;
      const rowChunks: string[][] = [];
      for (let i = 0; i < tocEntries.length; i += MAX_TOC_ROWS) {
        rowChunks.push(
          tocEntries.slice(i, i + MAX_TOC_ROWS).map(entry => {
            if (entry.type === 'subhead') {
              const level = entry.level && entry.level >= 2 ? entry.level : 2;
              const tocStyle = getTocLevelStyle(level);
              const rowClass = level > 2
                ? `toc-row-subhead toc-row-subsubhead toc-row-level-${level}`
                : 'toc-row-subhead toc-row-level-2';
              return `
                <div class="${rowClass}" data-sec-idx="${entry.secIdx}" data-subhead-level="${level}" style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px; margin-bottom:4px; padding-bottom:2px; width:100%;">
                  <span class="toc-text-subtitle editable-text" contenteditable="true" style="${tocStyle.text} outline:none; display:inline-block; max-width:480px; word-break:break-word; cursor:text; ${subIndentSide}:${tocStyle.indent};">${escapeHtml(entry.title)}</span>
                  <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${ct.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:3px; outline:none; cursor:text;"></span>
                  <span class="toc-text-page editable-text" contenteditable="true" style="font-size:11.5px; font-weight:600; color:${ct.tocPageNumColor}; background:${ct.tocPageNumBg}; width:32px; min-width:32px; height:20px; line-height:20px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${entry.pageNum}</span>
                  <div style="margin-left:8px; display:inline-flex; gap:4px; opacity:0.8;" data-editor-ui="true">
                    <button class="btn-move-toc-up" data-editor-ui="true" title="Naikkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬆️</button>
                    <button class="btn-move-toc-down" data-editor-ui="true" title="Turunkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬇️</button>
                    <button class="btn-toggle-toc-type" data-editor-ui="true" title="Ubah ke Bab utama" style="background:#f0f9ff; border:1px solid #0284c7; border-radius:4px; color:#0284c7; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">📖 Jadi Bab</button>
                    <button class="btn-delete-toc-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:2px;">🗑️</button>
                  </div>
                </div>`;
            } else {
              return `
                <div class="toc-row-section" data-sec-idx="${entry.secIdx}" style="display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; margin-bottom:6px; padding-bottom:4px; width:100%;">
                  <span class="toc-text-title editable-text" contenteditable="true" style="font-weight:700; font-size:13.5px; color:#0f172a; outline:none; display:inline-block; max-width:480px; word-break:break-word; cursor:text;">${escapeHtml(entry.title)}</span>
                  <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${ct.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:4px; outline:none; cursor:text;"></span>
                  <span class="toc-text-page editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:${ct.tocPageNumColor}; background:${ct.tocPageNumBg}; width:32px; min-width:32px; height:22px; line-height:22px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${entry.pageNum}</span>
                  <div style="margin-left:8px; display:inline-flex; gap:4px; opacity:0.8;" data-editor-ui="true">
                    <button class="btn-move-toc-up" data-editor-ui="true" title="Naikkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬆️</button>
                    <button class="btn-move-toc-down" data-editor-ui="true" title="Turunkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬇️</button>
                    <button class="btn-toggle-toc-type" data-editor-ui="true" title="Ubah ke Sub-Bab" style="background:#fcf5ff; border:1px solid #8b5cf6; border-radius:4px; color:#8b5cf6; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">📌 Jadi Sub-Bab</button>
                    <button class="btn-delete-toc-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:2px;">🗑️</button>
                  </div>
                </div>`;
            }
          })
        );
      }
      if (rowChunks.length === 0) rowChunks.push([]);

      const firstTocIdx = prev.findIndex(p => p && (p.id.includes('toc') || p.id === 'page-toc'));
      if (firstTocIdx === -1) return prev;

      const nonTocPages = prev.filter(p => p && !(p.id.includes('toc') || p.id === 'page-toc'));
      const newTocPages: GeneratedPage[] = rowChunks.map((chunk, idx) => {
        const itemsHtml = chunk.join('');
        return createTocPage(firstTocIdx + idx + 1, docTitle, langStyle, itemsHtml);
      });

      const nextPages = [...nonTocPages];
      nextPages.splice(firstTocIdx, 0, ...newTocPages);
      return renumberFooterPagesList(nextPages);
    });
  }, [createTocPage, docTitle, langStyle, renumberFooterPagesList]);

  const handleAutoSplitTocPages = useCallback(() => {
    if (!containerRef.current) return;
    const tocContainers = containerRef.current.querySelectorAll('.toc-container');
    const allRows: string[] = [];

    tocContainers.forEach(c => {
      const rows = c.querySelectorAll('.toc-row-section, .toc-row-subhead');
      rows.forEach(r => {
        allRows.push((r as HTMLElement).outerHTML);
      });
    });

    if (allRows.length === 0) return;

    const ROWS_PER_PAGE = 18;
    const chunkedRows: string[][] = [];
    for (let i = 0; i < allRows.length; i += ROWS_PER_PAGE) {
      chunkedRows.push(allRows.slice(i, i + ROWS_PER_PAGE));
    }

    setPages(prev => {
      if (!prev || prev.length === 0) return prev;

      const firstTocIdx = prev.findIndex(p => p && (p.id.includes('toc') || p.id === 'page-toc'));
      if (firstTocIdx === -1) return prev;

      const nonTocPages = prev.filter(p => p && !(p.id.includes('toc') || p.id === 'page-toc'));
      const newTocPages: GeneratedPage[] = chunkedRows.map((chunk, idx) => {
        const itemsHtml = chunk.join('');
        return createTocPage(firstTocIdx + idx + 1, docTitle, langStyle, itemsHtml);
      });

      const nextPages = [...nonTocPages];
      nextPages.splice(firstTocIdx, 0, ...newTocPages);
      return renumberFooterPagesList(nextPages);
    });
  }, [createTocPage, docTitle, langStyle, renumberFooterPagesList]);



  const prevInitialPagesRef = useRef<GeneratedPage[] | undefined>(undefined);
  const prevLanguageRef = useRef<string | undefined>(undefined);
  const prevColorThemeRef = useRef<ColorThemeId | undefined>(undefined);
  const prevSectionsRef = useRef<Section[] | undefined>(undefined);
  // Tracks the pages array that we most recently sent up via onPagesChange.
  // When the parent echoes back this same array as `initialPages`, we skip
  // re-initialization to avoid the circular loop that resets contenteditable DOM.
  const outgoingPagesRef = useRef<GeneratedPage[] | null>(null);

  useEffect(() => {
    const isLanguageChanged = prevLanguageRef.current !== undefined && prevLanguageRef.current !== language;
    prevLanguageRef.current = language;

    const isColorThemeChanged = prevColorThemeRef.current !== undefined && prevColorThemeRef.current !== colorTheme;
    prevColorThemeRef.current = colorTheme;

    const isSectionsChanged =
      prevSectionsRef.current !== undefined &&
      prevSectionsRef.current !== sections &&
      JSON.stringify(prevSectionsRef.current) !== JSON.stringify(sections);
    prevSectionsRef.current = sections;

    if (isColorThemeChanged) {
      setPages((prev) => {
        if (prev && prev.length > 0) {
          const rethemed = applyThemeToExistingPages(prev, colorTheme || DEFAULT_COLOR_THEME, customAccentColor);
          return sanitizePagesList(rethemed, langStyle);
        }
        if (sections && sections.length > 0) {
          const generated = generateDocumentPages(docTitle, sections, techLegend || null, langStyle);
          return sanitizePagesList(generated, langStyle);
        }
        return prev;
      });
      return;
    }

    if (!isLanguageChanged && initialPages && initialPages.length > 0 && prevInitialPagesRef.current !== initialPages) {
      // If this initialPages is the same array we sent up via onPagesChange, skip
      // re-initialization — it's our own data coming back from the parent.
      if (outgoingPagesRef.current === initialPages) {
        prevInitialPagesRef.current = initialPages;
        return;
      }
      prevInitialPagesRef.current = initialPages;
      const sanitized = sanitizePagesList(initialPages, langStyle);
      setPages(sanitized);
      return;
    }

    if (isLanguageChanged && initialPages && initialPages.length > 0) {
      // Language changed with pre-built pages (from translation/cache) — use them
      // directly instead of re-generating from sections so edits are preserved.
      prevInitialPagesRef.current = initialPages;
      const sanitized = sanitizePagesList(initialPages, langStyle);
      setPages(sanitized);
    } else if ((!pages || pages.length === 0 || (isSectionsChanged && (!initialPages || initialPages.length === 0))) && (!initialPages || initialPages.length === 0) && sections && sections.length > 0) {
      const generated = generateDocumentPages(docTitle, sections, techLegend || null, langStyle);
      const sanitizedGenerated = sanitizePagesList(generated, langStyle);
      prevInitialPagesRef.current = initialPages;
      setPages(sanitizedGenerated);
    }
  }, [sections, initialPages, language, colorTheme, langStyle]);

  const onRegisterAddChapterRef = useRef(onRegisterAddChapter);
  const onRegisterAddSubheadRef = useRef(onRegisterAddSubhead);
  const onRegisterSyncTocRef = useRef(onRegisterSyncToc);
  const onRegisterAutoSplitTocRef = useRef(onRegisterAutoSplitToc);
  const onRegisterReflowRef = useRef(onRegisterReflow);
  const onRegisterSyncDomRef = useRef(onRegisterSyncDom);
  onRegisterAddChapterRef.current = onRegisterAddChapter;
  onRegisterAddSubheadRef.current = onRegisterAddSubhead;
  onRegisterSyncTocRef.current = onRegisterSyncToc;
  onRegisterAutoSplitTocRef.current = onRegisterAutoSplitToc;
  onRegisterReflowRef.current = onRegisterReflow;
  onRegisterSyncDomRef.current = onRegisterSyncDom;

  useEffect(() => {
    if (onRegisterAddChapterRef.current) {
      onRegisterAddChapterRef.current(() => handleAddChapterPage());
    }
    if (onRegisterAddSubheadRef.current) {
      onRegisterAddSubheadRef.current(() => handleAddSubhead());
    }
    if (onRegisterSyncTocRef.current) {
      onRegisterSyncTocRef.current(() => handleRegenerateToc());
    }
    if (onRegisterAutoSplitTocRef.current) {
      onRegisterAutoSplitTocRef.current(() => handleAutoSplitTocPages());
    }
    if (onRegisterSyncDomRef.current) {
      onRegisterSyncDomRef.current(syncAllPagesFromDom);
    }
  }, [handleAddChapterPage, handleAddSubhead, handleRegenerateToc, handleAutoSplitTocPages, syncAllPagesFromDom]);

  // Always emit, including the very first pages set after mount: the parent
  // treats that first emission as its sanitized baseline (not a user edit), so
  // swallowing it here would make the parent mistake the user's first real edit
  // for the baseline and never mark the document dirty.
  useEffect(() => {
    if (pages && pages.length > 0 && onPagesChange) {
      outgoingPagesRef.current = pages;
      onPagesChange(pages);
    }
  }, [pages]);

  const createLegendPage = (pageNum: number, title: string, lang: any, hasCategory: boolean = false): GeneratedPage => {
    const headAlign = lang.isRtl ? 'right' : 'left';
    const isEven = pageNum % 2 === 0;
    const id = `legend-page-${Date.now()}`;
    const headerTitle = lang.i18n.glossaryTitle;

    const rowsHtml = hasCategory
      ? `
      <tr style="background:#ffffff;">
        <td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; word-break:break-word;">Istilah Baru</td>
        <td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; word-break:break-word;">Kategori...</td>
        <td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; word-break:break-word;">Penjelasan istilah baru...</td>
        <td style="padding:6px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true">
          <button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button>
        </td>
      </tr>`
      : `
      <tr style="background:#ffffff;">
        <td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; word-break:break-word;">Istilah Baru</td>
        <td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; word-break:break-word;">Penjelasan istilah baru...</td>
        <td style="padding:6px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true">
          <button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button>
        </td>
      </tr>`;

    const headerHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px; padding-left: 36px; padding-right: 36px;">
        <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
          <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
            <div class="chapter-num" style="background:#0284c7; color:#fff;">📖</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${escapeHtml(headerTitle)}</div>
            </div>
          </div>
        </div>
      </div>`;

    const footerHtml = `
      <div class="page-footer" style="position:absolute; bottom:32px; left:36px; right:36px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
        <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(title)}</div>
        <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${escapeHtml(lang.i18n.pageFooterLabel(pageNum))}</div>
      </div>`;

    const tableHeaderHtml = hasCategory
      ? `<thead>
          <tr style="background:#f1f5f9; color:#0f172a; font-size:11.5px; font-weight:700; text-align:${headAlign};">
            <th class="editable-text" contenteditable="true" style="padding:7px 10px; border:1px solid #cbd5e1;">${escapeHtml(lang.i18n.glossaryTermHeader)}</th>
            <th class="editable-text" contenteditable="true" style="padding:7px 10px; border:1px solid #cbd5e1;">${escapeHtml(lang.i18n.glossaryCategoryHeader || 'Kategori')}</th>
            <th class="editable-text" contenteditable="true" style="padding:7px 10px; border:1px solid #cbd5e1;">${escapeHtml(lang.i18n.glossaryDescHeader)}</th>
            <th style="padding:7px 4px; width:32px; text-align:center;" data-editor-ui="true"></th>
          </tr>
        </thead>`
      : `<thead>
          <tr style="background:#f1f5f9; color:#0f172a; font-size:11.5px; font-weight:700; text-align:${headAlign};">
            <th class="editable-text" contenteditable="true" style="padding:7px 10px; border:1px solid #cbd5e1;">${escapeHtml(lang.i18n.glossaryTermHeader)}</th>
            <th class="editable-text" contenteditable="true" style="padding:7px 10px; border:1px solid #cbd5e1;">${escapeHtml(lang.i18n.glossaryDescHeader)}</th>
            <th style="padding:7px 4px; width:32px; text-align:center;" data-editor-ui="true"></th>
          </tr>
        </thead>`;

    const html = `
      <div class="page page-content" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:#ffffff; border-radius:10px; padding:40px 0; position:relative; overflow:hidden;">
        ${headerHtml}
        <div class="deletable table-frame" style="position: relative; margin-top: 10px; margin-bottom: 14px; padding-left: 36px; padding-right: 36px;">
          <div class="document-table-container" style="width:100%; overflow-x:auto; border-radius:6px; border:1px solid #cbd5e1;">
            <table class="document-table" style="width:100%; border-collapse:collapse; font-size:11.5px; font-family:inherit;">
              ${tableHeaderHtml}
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div style="margin-top:6px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true">
              <button class="btn-add-doc-table-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">➕ Tambah Baris</button>
            </div>
          </div>
        </div>
        ${footerHtml}
      </div>`;

    return { id, html };
  };


  const handleToggleFlipFooter = useCallback((pageIdx: number) => {
    // 1. Instantly toggle live physical DOM footer
    const pageWrapper = containerRef.current?.querySelector(`[data-page-idx="${pageIdx}"]`);
    const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const pageEl = (innerDiv?.firstElementChild || innerDiv) as HTMLElement | null;
    let footerEl = pageEl?.querySelector('.page-footer') as HTMLElement | null;

    if (pageEl) {
      const pageNum = pageIdx + 1;
      const isEven = pageNum % 2 === 0;

      if (!footerEl) {
        footerEl = window.document.createElement('div');
        footerEl.className = 'page-footer';
        footerEl.style.cssText = `position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}`;
        footerEl.innerHTML = `
          <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(docTitle)}</div>
          <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${escapeHtml(langStyle.i18n.pageFooterLabel(pageNum))}</div>
        `;
        pageEl.appendChild(footerEl);
      }

      const isFlipped = footerEl.getAttribute('data-flipped') === 'true';
      const newFlipped = !isFlipped;
      if (newFlipped) {
        footerEl.setAttribute('data-flipped', 'true');
      } else {
        footerEl.removeAttribute('data-flipped');
      }

      const newDir = newFlipped
        ? (isEven ? 'row-reverse' : 'row')
        : (isEven ? 'row' : 'row-reverse');
      footerEl.style.flexDirection = newDir;

      // 2. Sync updated HTML into React state
      const updatedPageHtml = pageEl.outerHTML;
      setPages(prev => prev.map((p, i) => i === pageIdx ? { ...p, html: updatedPageHtml } : p));
    }
  }, [docTitle, langStyle]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 1. Delete Legend Table Row
    const deleteBtn = target.closest('.btn-delete-legend-row');
    if (deleteBtn) {
      e.stopPropagation();
      e.preventDefault();
      const tr = deleteBtn.closest('tr');
      const pageWrapper = deleteBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (tr) {
        tr.remove();
        if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
          const idx = parseInt(pageIdxAttr, 10);
          const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
          if (innerDiv) {
            const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
            setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
          }
        }
      }
      return;
    }

    // 1b. Delete Document Table Row
    const deleteDocRowBtn = target.closest('.btn-delete-doc-table-row');
    if (deleteDocRowBtn) {
      e.stopPropagation();
      e.preventDefault();
      const tr = deleteDocRowBtn.closest('tr');
      const pageWrapper = deleteDocRowBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (tr) {
        tr.remove();
        if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
          const idx = parseInt(pageIdxAttr, 10);
          const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
          if (innerDiv) {
            const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
            setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
          }
        }
        showToast('🗑️ Baris tabel berhasil dihapus');
      }
      return;
    }

    // 1c. Add Document Table Row
    const addDocRowBtn = target.closest('.btn-add-doc-table-row');
    if (addDocRowBtn) {
      e.stopPropagation();
      e.preventDefault();
      const tableFrame = addDocRowBtn.closest('.table-frame, .document-table-container') || addDocRowBtn.parentElement;
      const table = tableFrame?.querySelector('table') as HTMLTableElement | null;
      const tbody = table?.querySelector('tbody') || table;
      const pageWrapper = addDocRowBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (tbody && pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const idx = parseInt(pageIdxAttr, 10);
        const sampleTr = tbody.querySelector('tr');
        const numContentCells = sampleTr ? sampleTr.querySelectorAll('td:not([data-editor-ui]), th:not([data-editor-ui])').length : 3;

        const newTr = window.document.createElement('tr');
        newTr.style.cssText = 'background:#ffffff; border-bottom:1px solid #e2e8f0;';

        let cellsHtml = '';
        for (let c = 0; c < numContentCells; c++) {
          cellsHtml += `<td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:top; outline:none;">Teks baru...</td>`;
        }
        const delBtnHtml = `<td style="padding:6px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true"><button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button></td>`;

        newTr.innerHTML = cellsHtml + delBtnHtml;
        tbody.appendChild(newTr);

        const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
        if (innerDiv) {
          const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
          setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
        }
        showToast('➕ Baris tabel berhasil ditambahkan');
      }
      return;
    }

    // 2. Add Legend Page
    const addPageBtn = target.closest('.btn-add-legend-page');
    if (addPageBtn) {
      e.stopPropagation();
      e.preventDefault();
      const pageWrapper = addPageBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const idx = parseInt(pageIdxAttr, 10);
        const hasCategory = Boolean(pageWrapper?.querySelector('.legend-container th:nth-child(3):not([data-editor-ui])'));
        setPages(prev => {
          const newLegendPage = createLegendPage(idx + 2, docTitle, langStyle, hasCategory);
          const nextPages = [...prev];
          nextPages.splice(idx + 1, 0, newLegendPage);
          return renumberFooterPagesList(nextPages);
        });

        setTimeout(() => {
          const nextWrapper = containerRef.current?.querySelector(`[data-page-idx="${idx + 1}"]`);
          nextWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return;
    }

    // 3. Add TOC Row (Tambah Bab)
    const addTocBtn = target.closest('.btn-add-toc-row');
    if (addTocBtn) {
      e.stopPropagation();
      e.preventDefault();
      handleAddChapterPage();
      return;
    }

    // 3b. Add TOC Subhead (Tambah Sub-Bab)
    const addTocSubheadBtn = target.closest('.btn-add-toc-subhead');
    if (addTocSubheadBtn) {
      e.stopPropagation();
      e.preventDefault();
      handleAddSubhead();
      return;
    }

    // 4. Regenerate / Sync TOC
    const regenTocBtn = target.closest('.btn-regenerate-toc');
    if (regenTocBtn) {
      e.stopPropagation();
      e.preventDefault();
      handleRegenerateToc();
      return;
    }

    // 4. Add Legend Table Row
    const addBtn = target.closest('.btn-add-legend-row');
    if (addBtn) {
      e.stopPropagation();
      e.preventDefault();
      const legendContainer = addBtn.closest('.legend-container');
      const table = legendContainer?.querySelector('table');
      const tbody = legendContainer?.querySelector('tbody');
      const pageWrapper = addBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (tbody && pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const idx = parseInt(pageIdxAttr, 10);
        const contentThs = table ? table.querySelectorAll('th:not([data-editor-ui])') : [];
        const hasCategory = contentThs.length >= 3;

        const tr = window.document.createElement('tr');
        tr.style.cssText = 'border-bottom: 1px solid #e2e8f0; background: #ffffff;';

        if (hasCategory) {
          tr.innerHTML = `<td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:700; color:#0f172a; font-size:12px; width:25%; vertical-align:top; border-right:1px solid #e2e8f0; outline:none;">Istilah Baru</td><td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:600; color:#475569; font-size:11.5px; width:25%; vertical-align:top; border-right:1px solid #e2e8f0; outline:none;">Kategori...</td><td class="editable-text" contenteditable="true" style="padding:9px 12px; color:#334155; font-size:11.5px; line-height:1.5; vertical-align:top; outline:none;">Penjelasan istilah baru...</td><td style="padding:9px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true"><button class="btn-delete-legend-row" data-editor-ui="true" title="Hapus baris" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button></td>`;
        } else {
          tr.innerHTML = `<td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:700; color:#0f172a; font-size:12px; width:30%; vertical-align:top; border-right:1px solid #e2e8f0; outline:none;">Istilah Baru</td><td class="editable-text" contenteditable="true" style="padding:9px 12px; color:#334155; font-size:11.5px; line-height:1.5; vertical-align:top; outline:none;">Penjelasan istilah baru...</td><td style="padding:9px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true"><button class="btn-delete-legend-row" data-editor-ui="true" title="Hapus baris" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button></td>`;
        }
        tbody.appendChild(tr);

        const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
        if (innerDiv) {
          const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
          setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
        }
      }
      return;
    }

    // 5. Toggle TOC Row Type (Bab <-> Sub-Bab)
    const toggleTocTypeBtn = target.closest('.btn-toggle-toc-type');
    if (toggleTocTypeBtn) {
      e.stopPropagation();
      e.preventDefault();
      const row = toggleTocTypeBtn.closest('.toc-row-section, .toc-row-subhead') as HTMLElement | null;
      const pageWrapper = toggleTocTypeBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (row && pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const titleEl = row.querySelector('.toc-text-title, .toc-text-subtitle') as HTMLElement | null;
        if (titleEl) {
          const rawText = titleEl.innerText.trim();
          const isCurrentSubhead = row.classList.contains('toc-row-subhead');

          if (isCurrentSubhead) {
            // Convert Sub-Bab -> Bab
            row.className = 'toc-row-section';
            (row as HTMLElement).style.marginLeft = '0px';
            (row as HTMLElement).style.marginTop = '12px';
            (row as HTMLElement).style.marginBottom = '6px';
            (row as HTMLElement).style.paddingBottom = '4px';

            const match = rawText.match(/^(\d+)\.\d+\.?\s*(.*)/);
            let newText = rawText;
            if (match) {
              newText = `${match[1]}. ${match[2]}`;
            }
            titleEl.className = 'toc-text-title editable-text';
            titleEl.style.fontWeight = '700';
            titleEl.style.fontSize = '13.5px';
            titleEl.style.color = '#0f172a';
            titleEl.innerText = newText;
            toggleTocTypeBtn.setAttribute('title', 'Ubah ke Sub-Bab');
            toggleTocTypeBtn.textContent = '📌 Jadi Sub-Bab';
            (toggleTocTypeBtn as HTMLElement).style.cssText = 'background:#fcf5ff; border:1px solid #8b5cf6; border-radius:4px; color:#8b5cf6; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;';
          } else {
            // Convert Bab -> Sub-Bab
            row.className = 'toc-row-subhead';
            (row as HTMLElement).style.marginLeft = '18px';
            (row as HTMLElement).style.marginTop = '4px';
            (row as HTMLElement).style.marginBottom = '4px';
            (row as HTMLElement).style.paddingBottom = '2px';

            const match = rawText.match(/^(\d+)[\.\)]?\s*(.*)/);
            let newText = rawText;
            if (match) {
              newText = `${match[1]}.1 ${match[2]}`;
            }
            titleEl.className = 'toc-text-subtitle editable-text';
            titleEl.style.fontWeight = '400';
            titleEl.style.fontSize = '12.5px';
            titleEl.style.color = '#334155';
            titleEl.innerText = newText;
            toggleTocTypeBtn.setAttribute('title', 'Ubah ke Bab utama');
            toggleTocTypeBtn.textContent = '📖 Jadi Bab';
            (toggleTocTypeBtn as HTMLElement).style.cssText = 'background:#f0f9ff; border:1px solid #0284c7; border-radius:4px; color:#0284c7; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;';
          }

          const idx = parseInt(pageIdxAttr, 10);
          const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
          if (innerDiv) {
            const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
            setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
          }
        }
      }
      return;
    }

    // 6. Delete TOC Row
    const deleteTocRowBtn = target.closest('.btn-delete-toc-row');
    if (deleteTocRowBtn) {
      e.stopPropagation();
      e.preventDefault();
      saveHistorySnapshot();
      const row = deleteTocRowBtn.closest('.toc-row-section, .toc-row-subhead');
      const pageWrapper = deleteTocRowBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (row) {
        row.remove();
        if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
          const idx = parseInt(pageIdxAttr, 10);
          const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
          if (innerDiv) {
            const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
            setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
          }
        }
      }
      return;
    }

    // 7. Move TOC Row UP (Naikkan Urutan)
    const moveTocUpBtn = target.closest('.btn-move-toc-up');
    if (moveTocUpBtn) {
      e.stopPropagation();
      e.preventDefault();
      saveHistorySnapshot();
      const row = moveTocUpBtn.closest('.toc-row-section, .toc-row-subhead') as HTMLElement | null;
      if (!row) return;

      const container = row.closest('.toc-container') || row.parentElement;
      if (!container) return;

      const allRows = Array.from(container.querySelectorAll('.toc-row-section, .toc-row-subhead'));
      const rowIndex = allRows.indexOf(row);
      const pageWrapper = moveTocUpBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (rowIndex > 0) {
        const prevRow = allRows[rowIndex - 1];
        prevRow.parentNode?.insertBefore(row, prevRow);
        syncPagesFromDom();
      } else if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const currentIdx = parseInt(pageIdxAttr, 10);
        let prevTocIdx = -1;
        for (let i = currentIdx - 1; i >= 0; i--) {
          if (pages[i] && (pages[i].id.includes('toc') || pages[i].id === 'page-toc')) {
            prevTocIdx = i;
            break;
          }
        }
        if (prevTocIdx >= 0) {
          const prevWrapper = containerRef.current?.querySelector(`[data-page-idx="${prevTocIdx}"]`);
          const prevTocContainer = prevWrapper?.querySelector('.toc-container');
          if (prevTocContainer) {
            const prevRows = prevTocContainer.querySelectorAll('.toc-row-section, .toc-row-subhead');
            if (prevRows.length > 0) {
              const lastRow = prevRows[prevRows.length - 1];
              lastRow.parentNode?.insertBefore(row, lastRow.nextSibling);
            } else {
              const bottomBar = Array.from(prevTocContainer.children).find(el => el.getAttribute('data-editor-ui') === 'true');
              if (bottomBar) {
                prevTocContainer.insertBefore(row, bottomBar);
              } else {
                prevTocContainer.appendChild(row);
              }
            }
            syncPagesFromDom();
          }
        } else {
          showToast('ℹ️ Baris sudah di urutan teratas Daftar Isi');
        }
      }
      return;
    }

    // 8. Move TOC Row DOWN (Turunkan Urutan)
    const moveTocDownBtn = target.closest('.btn-move-toc-down');
    if (moveTocDownBtn) {
      e.stopPropagation();
      e.preventDefault();
      saveHistorySnapshot();
      const row = moveTocDownBtn.closest('.toc-row-section, .toc-row-subhead') as HTMLElement | null;
      if (!row) return;

      const container = row.closest('.toc-container') || row.parentElement;
      if (!container) return;

      const allRows = Array.from(container.querySelectorAll('.toc-row-section, .toc-row-subhead'));
      const rowIndex = allRows.indexOf(row);
      const pageWrapper = moveTocDownBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (rowIndex >= 0 && rowIndex < allRows.length - 1) {
        const nextRow = allRows[rowIndex + 1];
        nextRow.parentNode?.insertBefore(row, nextRow.nextSibling);
        syncPagesFromDom();
      } else if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const currentIdx = parseInt(pageIdxAttr, 10);
        let nextTocIdx = -1;
        for (let i = currentIdx + 1; i < pages.length; i++) {
          if (pages[i] && (pages[i].id.includes('toc') || pages[i].id === 'page-toc')) {
            nextTocIdx = i;
            break;
          }
        }
        if (nextTocIdx >= 0) {
          const nextWrapper = containerRef.current?.querySelector(`[data-page-idx="${nextTocIdx}"]`);
          const nextTocContainer = nextWrapper?.querySelector('.toc-container');
          if (nextTocContainer) {
            const firstNextRow = nextTocContainer.querySelector('.toc-row-section, .toc-row-subhead');
            if (firstNextRow) {
              firstNextRow.parentNode?.insertBefore(row, firstNextRow);
            } else {
              const bottomBar = Array.from(nextTocContainer.children).find(el => el.getAttribute('data-editor-ui') === 'true');
              if (bottomBar) {
                nextTocContainer.insertBefore(row, bottomBar);
              } else {
                nextTocContainer.appendChild(row);
              }
            }
            syncPagesFromDom();
          }
        } else {
          showToast('ℹ️ Baris sudah di urutan terbawah Daftar Isi');
        }
      }
      return;
    }

    // 9. Split TOC Pages (Rapikan / Pecah Halaman Daftar Isi)
    const splitTocBtn = target.closest('.btn-split-toc-pages');
    if (splitTocBtn) {
      e.stopPropagation();
      e.preventDefault();
      handleAutoSplitTocPages();
      return;
    }

    // 10. Add TOC Page (Tambah Halaman Daftar Isi)
    const addTocPageBtn = target.closest('.btn-add-toc-page');
    if (addTocPageBtn) {
      e.stopPropagation();
      e.preventDefault();
      const pageWrapper = addTocPageBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const idx = parseInt(pageIdxAttr, 10);
        setPages(prev => {
          const newTocPage = createTocPage(idx + 2, docTitle, langStyle, '');
          const nextPages = [...prev];
          nextPages.splice(idx + 1, 0, newTocPage);
          return renumberFooterPagesList(nextPages);
        });

        setTimeout(() => {
          const nextWrapper = containerRef.current?.querySelector(`[data-page-idx="${idx + 1}"]`);
          nextWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return;
    }

    // 10b. Delete TOC Page (Hapus Halaman Daftar Isi Ini)
    const deleteTocPageBtn = target.closest('.btn-delete-toc-page');
    if (deleteTocPageBtn) {
      e.stopPropagation();
      e.preventDefault();
      const pageWrapper = deleteTocPageBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');
      if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
        const idx = parseInt(pageIdxAttr, 10);
        const targetPage = pages[idx];
        if (targetPage) {
          handleDeletePage(targetPage.id);
        }
      }
      return;
    }

    // 11. Adjust Table Column Widths (Lebarkan Istilah / Standar)
    const adjustColBtn = target.closest('.btn-adjust-table-col');
    if (adjustColBtn) {
      e.stopPropagation();
      e.preventDefault();
      const tableContainer = adjustColBtn.closest('.legend-container, .document-table-container, .table-frame') as HTMLElement | null;
      const table = tableContainer?.querySelector('table') as HTMLTableElement | null;
      const pageWrapper = adjustColBtn.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');

      if (table) {
        const mode = adjustColBtn.getAttribute('data-mode');
        const thCols = Array.from(table.querySelectorAll('th:not([data-editor-ui])'));

        if (thCols.length >= 3) {
          const col1Width = mode === 'wide-term' ? '30%' : '25%';
          const col2Width = '25%';
          (thCols[0] as HTMLElement).style.width = col1Width;
          (thCols[1] as HTMLElement).style.width = col2Width;

          table.querySelectorAll('tbody tr').forEach(tr => {
            const tds = Array.from(tr.querySelectorAll('td:not([data-editor-ui])'));
            if (tds[0]) (tds[0] as HTMLElement).style.width = col1Width;
            if (tds[1]) (tds[1] as HTMLElement).style.width = col2Width;
          });
        } else if (thCols.length >= 2) {
          const targetWidth = mode === 'wide-term' ? '35%' : mode === 'balanced' ? '33%' : '30%';
          (thCols[0] as HTMLElement).style.width = targetWidth;

          table.querySelectorAll('tbody tr').forEach(tr => {
            const firstTd = tr.querySelector('td') as HTMLElement | null;
            if (firstTd) firstTd.style.width = targetWidth;
          });
        }

        if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
          const idx = parseInt(pageIdxAttr, 10);
          const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
          if (innerDiv) {
            const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;
            setPages(prev => prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p));
          }
        }
      }
      return;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Do NOT intercept clicks on legend/TOC buttons
    if (
      target.closest('.btn-add-legend-row') ||
      target.closest('.btn-add-legend-page') ||
      target.closest('.btn-delete-legend-row') ||
      target.closest('.btn-add-toc-row') ||
      target.closest('.btn-regenerate-toc') ||
      target.closest('.btn-toggle-toc-type') ||
      target.closest('.btn-delete-toc-row') ||
      target.closest('.btn-move-toc-up') ||
      target.closest('.btn-move-toc-down') ||
      target.closest('.btn-add-toc-page') ||
      target.closest('.btn-split-toc-pages') ||
      target.closest('.btn-adjust-table-col')
    ) {
      return;
    }

    const deletable = target.closest('.deletable') as HTMLElement | null;

    if (
      deletable &&
      !deletable.classList.contains('page') &&
      !deletable.classList.contains('page-content') &&
      !deletable.classList.contains('toc-container') &&
      !deletable.classList.contains('legend-container')
    ) {
      // Find which page wrapper this element belongs to
      const pageWrapper = deletable.closest('[data-page-idx]') as HTMLElement | null;
      const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');
      const pageIdx = pageIdxAttr !== null && pageIdxAttr !== undefined ? parseInt(pageIdxAttr, 10) : -1;

      if (pageIdx < 0) return;

      // Find the positional index of this block among valid .deletable elements in this page
      const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
      const validDeletables = getValidDeletables(innerDiv);
      const blockIdx = validDeletables.indexOf(deletable);

      const rect = deletable.getBoundingClientRect();
      const parentRect = containerRef.current?.getBoundingClientRect();
      if (parentRect && blockIdx >= 0) {
        // Capture the block HTML from live DOM (without data-block-id to keep it clean)
        const cloneEl = deletable.cloneNode(true) as HTMLElement;
        cloneEl.removeAttribute('data-block-id');
        setHoveredBlockHtml(cloneEl.outerHTML);
        setHoveredPageIdx(pageIdx);
        setHoveredBlockIdx(blockIdx);
        // Keep the controls clear of the fixed topbar: when the hovered block's
        // top edge is near the viewport top, render them just inside the block
        // instead of 32px above it (where the topbar strip sits).
        const nearViewportTop = rect.top < 64;
        setHoverCoords({
          top: rect.top - parentRect.top + (nearViewportTop ? 8 : -32),
          left: rect.right - parentRect.left - 110,
        });
      }
    } else {
      const isControls = (target as HTMLElement).closest('.floating-block-controls');
      if (!isControls) {
        setHoveredBlockHtml(null);
        setHoveredPageIdx(-1);
        setHoveredBlockIdx(-1);
        setHoverCoords(null);
      }
    }
  };

  // Pure reflow: takes a snapshot of pages and returns a new array with content
  // pages rebuilt so no block overflows the fixed A4 page height (measured against
  // the real DOM, not an estimate). Cover/TOC pages pass through untouched. Doesn't
  // touch React state itself, so it's safe to call from inside a setPages updater.
  const reflowPages = useCallback((sourcePages: GeneratedPage[]): GeneratedPage[] => {
    const frontSpecialPages: GeneratedPage[] = [];
    const endSpecialPages: GeneratedPage[] = [];
    const contentSourcePages: GeneratedPage[] = [];

    sourcePages.forEach(p => {
      if (p.id === 'cover-page' || p.id.includes('toc')) {
        frontSpecialPages.push(p);
      } else if (p.id.includes('legend') || p.id.includes('glossary')) {
        endSpecialPages.push(p);
      } else {
        contentSourcePages.push(p);
      }
    });

    // Collect all deletable blocks from content pages only
    const allBlocks: { html: string }[] = [];
    contentSourcePages.forEach(p => {
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = p.html;
      const rawBlocks = Array.from(
        tempDiv.querySelectorAll('.deletable:not(.page):not(.page-content):not(.toc-container):not(.legend-container)')
      ) as HTMLElement[];
      const topLevelBlocks = rawBlocks.filter(el => !el.parentElement?.closest('.deletable:not(.page):not(.page-content)'));
      topLevelBlocks.forEach(b => allBlocks.push({ html: b.outerHTML }));
    });

    if (allBlocks.length === 0) return sourcePages;

    // Measure block heights off-screen
    const measureEl = window.document.createElement('div');
    measureEl.style.cssText = 'position:fixed;left:-9999px;top:0;width:698px;visibility:hidden;font-family:Inter,sans-serif;';
    window.document.body.appendChild(measureEl);

    const measured = allBlocks.map(b => {
      measureEl.innerHTML = b.html;
      const el = measureEl.firstElementChild as HTMLElement;
      let h = Math.max(el?.getBoundingClientRect().height || 40, 20);

      const img = el?.querySelector('img') as HTMLImageElement | null;
      if (img) {
        if (img.naturalHeight && img.naturalWidth) {
          const containerWidth = Math.min(480, el.clientWidth || 480);
          const calculatedH = Math.min(260, (containerWidth / img.naturalWidth) * img.naturalHeight);
          h = Math.max(h, calculatedH + 24);
        } else {
          const styleMaxH = img.style.maxHeight ? parseInt(img.style.maxHeight, 10) : 260;
          h = Math.max(h, (isNaN(styleMaxH) ? 260 : styleMaxH) + 24);
        }
      }
      return { html: b.html, height: h };
    });
    window.document.body.removeChild(measureEl);

    const MAX_H = 920;
    const reflowedContentPages: GeneratedPage[] = [];
    let pageBlocks: string[] = [];
    let currentH = 0;
    let pageNum = frontSpecialPages.length + 1;

    const flushPage = () => {
      if (pageBlocks.length === 0) return;
      const id = `reflow-${pageNum}`;
      const isEven = pageNum % 2 === 0;
      reflowedContentPages.push({
        id,
        html: `<div class="page page-content" id="page-${id}" style="width:794px;height:1123px;min-height:1123px;max-height:1123px;box-sizing:border-box;background:#fff;border-radius:10px;padding:40px 48px;position:relative;overflow:hidden;">${pageBlocks.join('')}<div class="page-footer" style="position:absolute;bottom:32px;left:48px;right:48px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:12px;background:#ffffff;z-index:5;${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}"><span class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(docTitle)}</span><span class="footer-page editable-text" contenteditable="true" style="outline:none;">${langStyle.i18n.pageFooterLabel(pageNum)}</span></div></div>`
      });
      pageBlocks = [];
      currentH = 0;
      pageNum++;
    };

    measured.forEach(({ html, height }) => {
      const isChapterHeader =
        html.includes('page-header-block') ||
        html.includes('chapter-num') ||
        html.includes('chapter-name');

      if ((isChapterHeader || currentH + height > MAX_H) && pageBlocks.length > 0) {
        flushPage();
      }
      pageBlocks.push(html);
      currentH += height;
    });
    flushPage();

    const fullList = [...frontSpecialPages, ...reflowedContentPages, ...endSpecialPages];
    return fullList.map((p, idx) => {
      const pNum = idx + 1;
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = p.html;
      const pageEl = tempDiv.firstElementChild;
      if (pageEl) {
        const footerPageEl = pageEl.querySelector('.footer-page');
        if (footerPageEl) {
          footerPageEl.textContent = langStyle.i18n.pageFooterLabel(pNum);
          return { id: p.id, html: pageEl.outerHTML };
        }
      }
      return p;
    });
  }, [docTitle, langStyle]);

  // Manual "Auto Reflow" button handler
  const handleReflow = useCallback(() => {
    setPages(prev => reflowPages(prev));
  }, [reflowPages]);

  useEffect(() => {
    if (onRegisterReflowRef.current) {
      onRegisterReflowRef.current(() => handleReflow());
    }
  }, [handleReflow]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const editable = target.closest('[contenteditable="true"]') as HTMLElement | null;
    if (!editable) return;

    e.preventDefault();
    let text = e.clipboardData.getData('text/plain') || '';
    text = text.replace(/\r\n/g, '\n');

    const isTableCell = !!editable.closest('td, th');
    const isSingleLine = editable.tagName === 'SPAN' ||
      editable.classList.contains('toc-text-title') ||
      editable.classList.contains('toc-text-page') ||
      editable.classList.contains('chapter-name');

    if (isTableCell || isSingleLine) {
      text = text.replace(/\s*\n\s*/g, ' ').trim();
    }

    if (text) {
      if (window.document.queryCommandSupported('insertText')) {
        window.document.execCommand('insertText', false, text);
      } else {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(window.document.createTextNode(text));
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const li = target.closest('li') as HTMLElement | null;
    const ul = target.closest('.bullet-list') as HTMLElement | null;

    if (li && ul && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const newLi = window.document.createElement('li');
      newLi.setAttribute('contenteditable', 'true');
      newLi.style.cssText = 'margin-bottom:6px; outline:none; cursor:text;';
      newLi.innerHTML = '';

      if (li.nextSibling) {
        ul.insertBefore(newLi, li.nextSibling);
      } else {
        ul.appendChild(newLi);
      }
      if (!isViewer) onUserEdit?.();

      setTimeout(() => {
        const selection = window.getSelection();
        const range = window.document.createRange();
        range.selectNodeContents(newLi);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        newLi.focus();
      }, 10);
      return;
    }

    if (li && ul && e.key === 'Backspace') {
      const textContent = li.textContent || '';
      if (textContent.trim() === '' && ul.querySelectorAll('li').length > 1) {
        e.preventDefault();
        e.stopPropagation();
        const prevLi = li.previousElementSibling as HTMLElement | null;
        li.remove();
        if (!isViewer) onUserEdit?.();
        if (prevLi) {
          setTimeout(() => {
            const selection = window.getSelection();
            const range = window.document.createRange();
            range.selectNodeContents(prevLi);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
            prevLi.focus();
          }, 10);
        }
        return;
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Sanitize Glosarium/table cell content on blur to strip rich elements/badges
    if (target && target.tagName === 'TD' && target.classList.contains('editable-text')) {
      if (target.children.length > 0) {
        const text = target.innerText.trim();
        target.textContent = text;
      }
    }

    // Sync contentEditable changes back to state via the page wrapper
    const pageWrapper = target.closest('[data-page-idx]') as HTMLElement | null;
    const pageIdxAttr = pageWrapper?.getAttribute('data-page-idx');
    if (pageIdxAttr !== null && pageIdxAttr !== undefined) {
      const idx = parseInt(pageIdxAttr, 10);
      const innerDiv = pageWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
      if (innerDiv) {
        const updatedOuterHtml = innerDiv.firstElementChild ? (innerDiv.firstElementChild as HTMLElement).outerHTML : innerDiv.innerHTML;

        // Try to update document title if it's the cover page's chapter-name
        const activePage = pages[idx];
        if (activePage && activePage.id === 'cover-page' && target.classList.contains('chapter-name') && onTitleChange) {
          onTitleChange(target.innerText.trim());
        }

        setPages(prev => {
          return prev.map((p, i) => i === idx ? { id: p.id, html: updatedOuterHtml } : p);
        });
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverPageId(prev => {
      if (prev !== pageId) return pageId;
      return prev;
    });
  }, []);

  const handleDragLeave = useCallback((pageId: string) => {
    setDragOverPageId(prev => prev === pageId ? null : prev);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    setDragOverPageId(null);
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;
    try {
      const blockData: ContentBlock = JSON.parse(rawData);
      const htmlInsert = blockToHtmlString(blockData);
      setPages(prev => {
        const updated = prev.map(p => {
          if (p.id !== pageId) return p;
          const tempDiv = window.document.createElement('div');
          tempDiv.innerHTML = p.html;
          const pageEl = tempDiv.firstElementChild as HTMLElement;
          const blockDiv = window.document.createElement('div');
          blockDiv.innerHTML = htmlInsert;
          const newEl = blockDiv.firstElementChild;
          if (newEl) {
            const footerEl = pageEl.querySelector('.page-footer');
            footerEl ? pageEl.insertBefore(newEl, footerEl) : pageEl.appendChild(newEl);
          }
          return { id: p.id, html: pageEl.outerHTML };
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to parse dropped block payload:', err);
    }
  }, []);
  const syncPagesFromDom = () => {
    setPages(prev => {
      const updated = prev.map((p, idx) => {
        const pageWrapper = containerRef.current?.querySelector(`[data-page-idx="${idx}"]`);
        const inner = pageWrapper?.querySelector('[data-inner-page]');
        if (inner) {
          const firstEl = inner.firstElementChild as HTMLElement | null;
          const html = firstEl ? firstEl.outerHTML : inner.innerHTML;
          return { id: p.id, html };
        }
        return p;
      });
      return updated;
    });
  };

  // After a cross-page move, walk forward from startIdx pushing whatever sank
  // below each page's footer onto the next content page, chaining as far as
  // needed. protectedEl is the block the user just moved: it is never pushed
  // back itself — the blocks around it give way instead. Blocks that fall off
  // the last content page are detached and returned as spill for a new page.
  const resolveOverflowAfterMove = (startIdx: number, protectedEl: HTMLElement | null) => {
    const spill: HTMLElement[] = [];
    let spillAfterIdx = -1;
    let moved = false;

    for (let idx = Math.max(0, startIdx); idx < pages.length; idx++) {
      if (!pages[idx] || !isContentPageId(pages[idx].id)) continue;

      const wrapper = containerRef.current?.querySelector(`[data-page-idx="${idx}"]`);
      const inner = wrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
      const pageContainer = getPageContainer(inner);
      if (!pageContainer) continue;

      let nextContentIdx = -1;
      for (let j = idx + 1; j < pages.length; j++) {
        if (pages[j] && isContentPageId(pages[j].id)) { nextContentIdx = j; break; }
      }
      const nextWrapper = nextContentIdx >= 0
        ? containerRef.current?.querySelector(`[data-page-idx="${nextContentIdx}"]`)
        : null;
      const nextInner = nextWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
      const nextPageContainer = getPageContainer(nextInner);

      let guard = 0;
      while (guard++ < 60) {
        const blocks = getValidDeletables(inner);
        if (blocks.length === 0) break;

        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock.getBoundingClientRect().bottom <= getContentLimit(pageContainer) + 2) break;

        // A page down to its final block can't be shrunk any further — pushing
        // a lone oversized block along would just snowball empty pages.
        if (blocks.length <= 1) break;

        let candIdx = blocks.length - 1;
        if (blocks[candIdx] === protectedEl) candIdx--;
        if (candIdx < 0) break;
        const cand = blocks[candIdx];

        if (nextPageContainer) {
          const header = nextPageContainer.querySelector('.page-header-block');
          if (header && header.nextSibling) {
            nextPageContainer.insertBefore(cand, header.nextSibling);
          } else {
            nextPageContainer.insertBefore(cand, nextPageContainer.firstChild);
          }
        } else {
          cand.remove();
          spill.unshift(cand);
          spillAfterIdx = idx;
        }
        moved = true;
      }
    }

    return { spill, spillAfterIdx, moved };
  };

  // Build a fresh content page holding spilled blocks and insert it after
  // afterIdx, then renumber the footer page labels.
  const insertSpillPage = (prev: GeneratedPage[], afterIdx: number, blocksHtml: string[]): GeneratedPage[] => {
    const id = `overflow-${Date.now()}`;
    const html = `<div class="page page-content" id="page-${id}" style="width:794px;height:1123px;min-height:1123px;max-height:1123px;box-sizing:border-box;background:#fff;border-radius:10px;padding:40px 48px;position:relative;overflow:hidden;">${blocksHtml.join('')}<div class="page-footer" style="position:absolute;bottom:32px;left:48px;right:48px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:12px;background:#ffffff;z-index:5;"><span class="footer-brand editable-text" contenteditable="true" style="outline:none;">${escapeHtml(docTitle)}</span><span class="footer-page editable-text" contenteditable="true" style="outline:none;"></span></div></div>`;
    const out = [...prev];
    out.splice(afterIdx + 1, 0, { id, html });

    let pageNumCounter = 0;
    return out.map(p => {
      if (p.id === 'cover-page') return p;
      pageNumCounter++;
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = p.html;
      const pageEl = tempDiv.firstElementChild;
      if (pageEl) {
        const footerPageEl = pageEl.querySelector('.footer-page');
        if (footerPageEl) {
          footerPageEl.textContent = langStyle.i18n.pageFooterLabel(pageNumCounter);
          return { id: p.id, html: pageEl.outerHTML };
        }
      }
      return p;
    });
  };

  // Shared tail for the move handlers: cascade overflow from the first affected
  // page, sync DOM state, then materialize any spill into a brand-new page.
  const finishMoveWithOverflowCheck = (startIdx: number, protectedEl: HTMLElement | null) => {
    const res = resolveOverflowAfterMove(startIdx, protectedEl);
    syncPagesFromDom();
    if (res.spill.length > 0 && res.spillAfterIdx >= 0) {
      const blocksHtml = res.spill.map(el => el.outerHTML);
      setPages(prev => insertSpillPage(prev, res.spillAfterIdx, blocksHtml));
    }
    if (res.moved) {
      showToast('⤵️ Halaman penuh — blok lain didorong ke halaman berikutnya');
    }
  };

  // Move block UP (within current page, or to previous page if at top)
  const handlePullUp = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;

    saveHistorySnapshot();

    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const currPageContainer = getPageContainer(currInner);
    const liveDeletables = getValidDeletables(currInner);

    const targetEl = liveDeletables[blkIdx];
    if (!targetEl || !currPageContainer) return;

    let cascadeStartIdx = currIdx;

    if (blkIdx > 0) {
      // Move UP within the current page (Swap with prevBlockEl)
      const prevBlockEl = liveDeletables[blkIdx - 1];
      const parent = prevBlockEl.parentNode || currPageContainer;
      parent.insertBefore(targetEl, prevBlockEl);
    } else {
      // At top of current page (blkIdx === 0), move cleanly to bottom of previous content page
      let prevContentIdx = -1;
      for (let i = currIdx - 1; i >= 0; i--) {
        if (pages[i] && pages[i].id !== 'cover-page' && !pages[i].id.includes('toc')) {
          prevContentIdx = i;
          break;
        }
      }

      if (prevContentIdx >= 0) {
        const prevWrapper = containerRef.current?.querySelector(`[data-page-idx="${prevContentIdx}"]`);
        const prevInner = prevWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
        const prevPageContainer = getPageContainer(prevInner);

        if (prevPageContainer) {
          const footer = prevPageContainer.querySelector('.page-footer');
          if (footer) {
            prevPageContainer.insertBefore(targetEl, footer);
          } else {
            prevPageContainer.appendChild(targetEl);
          }
          cascadeStartIdx = prevContentIdx;
        }
      } else {
        showToast('ℹ️ Blok sudah di posisi paling atas halaman dokumen');
      }
    }

    finishMoveWithOverflowCheck(cascadeStartIdx, targetEl);
    setTimeout(() => handleRegenerateToc(), 50);

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  // Move block DOWN (within current page, or to next page if at bottom)
  const handlePushDown = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;

    saveHistorySnapshot();

    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const currPageContainer = getPageContainer(currInner);
    const liveDeletables = getValidDeletables(currInner);

    const targetEl = liveDeletables[blkIdx];
    if (!targetEl || !currPageContainer) return;

    if (blkIdx < liveDeletables.length - 1) {
      // Move DOWN within the current page (Swap with nextBlockEl)
      const nextBlockEl = liveDeletables[blkIdx + 1];
      const parent = nextBlockEl.parentNode || currPageContainer;
      parent.insertBefore(targetEl, nextBlockEl.nextSibling);
    } else {
      // At bottom of current page, move cleanly to top of next content page
      let nextContentIdx = -1;
      for (let i = currIdx + 1; i < pages.length; i++) {
        if (pages[i] && pages[i].id !== 'cover-page' && !pages[i].id.includes('toc')) {
          nextContentIdx = i;
          break;
        }
      }

      if (nextContentIdx >= 0) {
        const nextWrapper = containerRef.current?.querySelector(`[data-page-idx="${nextContentIdx}"]`);
        const nextInner = nextWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
        const nextPageContainer = getPageContainer(nextInner);

        if (nextPageContainer) {
          const header = nextPageContainer.querySelector('.page-header-block');
          if (header && header.nextSibling) {
            nextPageContainer.insertBefore(targetEl, header.nextSibling);
          } else {
            nextPageContainer.insertBefore(targetEl, nextPageContainer.firstChild);
          }
        }
      } else {
        showToast('ℹ️ Blok sudah di posisi paling bawah halaman dokumen');
      }
    }

    finishMoveWithOverflowCheck(currIdx, targetEl);
    setTimeout(() => handleRegenerateToc(), 50);

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  // Delete a block
  const handleDelete = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;

    saveHistorySnapshot();

    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const liveDeletables = getValidDeletables(currInner);
    const targetEl = liveDeletables[blkIdx];

    if (targetEl) {
      targetEl.remove();
      syncPagesFromDom();
    }

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  const handlePromoteSubheadToBab = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;
    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const liveDeletables = getValidDeletables(currInner);
    const targetEl = liveDeletables[blkIdx];

    if (targetEl && targetEl.classList.contains('subhead-title')) {
      const text = targetEl.textContent?.trim() || '';
      const match = text.match(/^(\d+(\.\d+)*)\.?\s*(.*)/);
      const cleanTitle = match ? match[3] : text;
      const numPrefix = match ? match[1].split('.')[0] : '1';

      const newBabEl = window.document.createElement('div');
      newBabEl.className = 'deletable page-header-block';
      newBabEl.style.cssText = 'position: relative; margin-bottom: 16px; margin-top: 0; padding-left: 36px; padding-right: 36px;';
      newBabEl.innerHTML = `
        <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
          <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
            <div class="chapter-num editable-text" contenteditable="true" style="background:${langStyle.colorTheme.chapterNumBg}; color:${langStyle.colorTheme.chapterNumColor}; outline:none; cursor:text;">${numPrefix}</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${numPrefix}. ${cleanTitle || 'Bab Baru'}</div>
            </div>
          </div>
        </div>`;

      targetEl.replaceWith(newBabEl);
      syncPagesFromDom();
      setTimeout(() => handleRegenerateToc(), 50);
    }

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  const handleDemoteBabToSubhead = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;
    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const liveDeletables = getValidDeletables(currInner);
    const targetEl = liveDeletables[blkIdx];

    if (targetEl && (targetEl.classList.contains('page-header-block') || targetEl.classList.contains('chapter-name'))) {
      const chapNameEl = targetEl.querySelector('.chapter-name') || targetEl;
      const text = chapNameEl.textContent?.trim() || targetEl.textContent?.trim() || '';
      const match = text.match(/^(\d+[\.\)]?)?\s*(.*)/);
      const cleanTitle = match ? match[2] : text;
      const numPrefix = match && match[1] ? match[1].replace(/\.$/, '') : '2';

      const newSubheadEl = window.document.createElement('div');
      newSubheadEl.className = 'deletable subhead-title';
      newSubheadEl.setAttribute('contenteditable', 'true');
      newSubheadEl.style.cssText = `font-size:15px; font-weight:700; color:#1e293b; margin-top:18px; margin-bottom:8px; padding-left:36px; padding-right:36px; font-family:'Inter', sans-serif; border-bottom: 2px solid ${langStyle.colorTheme.subheadBorderColor}; padding-bottom: 4px; outline:none; cursor:text;`;
      newSubheadEl.textContent = `${numPrefix}.1 ${cleanTitle || 'Sub-bab Baru'}`;

      targetEl.replaceWith(newSubheadEl);
      syncPagesFromDom();
      setTimeout(() => handleRegenerateToc(), 50);
    }

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  const handleInsertSubheadBelowTarget = () => {
    if (hoveredPageIdx < 0 || hoveredBlockIdx < 0) return;
    const currIdx = hoveredPageIdx;
    const blkIdx = hoveredBlockIdx;

    const currWrapper = containerRef.current?.querySelector(`[data-page-idx="${currIdx}"]`);
    const currInner = currWrapper?.querySelector('[data-inner-page]') as HTMLElement | null;
    const liveDeletables = getValidDeletables(currInner);
    const targetEl = liveDeletables[blkIdx];

    if (targetEl) {
      const pageEl = (currInner?.querySelector('.page') || currInner?.firstElementChild) as HTMLElement;
      const chapNumEl = pageEl?.querySelector('.chapter-num');
      const rawSecText = chapNumEl ? (chapNumEl.textContent?.trim() || '1') : '1';
      const numMatch = rawSecText.match(/\d+/);
      const secNum = numMatch ? numMatch[0] : '1';

      const existingSubheads = pageEl?.querySelectorAll('.subhead-title') || [];
      const subNum = existingSubheads.length + 1;
      const subNumStr = `${secNum}.${subNum}`;

      const newSubheadEl = window.document.createElement('div');
      newSubheadEl.className = 'deletable subhead-title';
      newSubheadEl.setAttribute('contenteditable', 'true');
      newSubheadEl.style.cssText = `font-size:15px; font-weight:700; color:#1e293b; margin-top:18px; margin-bottom:8px; padding-left:36px; padding-right:36px; font-family:'Inter', sans-serif; border-bottom: 2px solid ${langStyle.colorTheme.subheadBorderColor || '#00d2ff'}; padding-bottom: 4px; outline:none; cursor:text;`;
      newSubheadEl.textContent = `${subNumStr} Sub-bab Baru`;

      targetEl.after(newSubheadEl);
      syncPagesFromDom();
      setTimeout(() => handleRegenerateToc(), 50);
    }

    setHoveredBlockHtml(null);
    setHoveredPageIdx(-1);
    setHoveredBlockIdx(-1);
    setHoverCoords(null);
  };

  const isSubheadBlock = Boolean(hoveredBlockHtml?.includes('subhead-title'));
  const isChapterBlock = Boolean(
    (hoveredBlockHtml?.includes('page-header-block') || (hoveredBlockHtml?.includes('chapter-name') && !hoveredBlockHtml?.includes('toc-container'))) &&
    !hoveredBlockHtml?.includes('legend-container')
  );
  const isTableBlock = Boolean(hoveredBlockHtml?.includes('table-frame') || hoveredBlockHtml?.includes('document-table'));

  const handleDeletePage = useCallback((pageId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus halaman ini beserta seluruh isinya?')) return;
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      let pageNumCounter = 1;
      return filtered.map(p => {
        if (p.id === 'cover-page') return p;
        pageNumCounter++;
        const tempDiv = window.document.createElement('div');
        tempDiv.innerHTML = p.html;
        const pageEl = tempDiv.firstElementChild;
        if (pageEl) {
          const footerPageEl = pageEl.querySelector('.footer-page');
          if (footerPageEl) footerPageEl.textContent = langStyle.i18n.pageFooterLabel(pageNumCounter);
          return { id: p.id, html: pageEl.outerHTML };
        }
        return p;
      });
    });
  }, [langStyle]);

  // Pure reflow: takes a snapshot of pages and returns a new array with content
  // pages rebuilt so no block overflows the fixed A4 page height (measured against
  // the real DOM, not an estimate). Cover/TOC pages pass through untouched. Doesn't
  // touch React state itself, so it's safe to call from inside a setPages updater.
  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPaste={handlePaste}
      onInput={() => { if (!isViewer) onUserEdit?.(); }}
      style={{
        padding: '95px 20px 120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '36px',
        background: '#0f1117',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        maxWidth: '100vw',
      }}
    >


      {/* Floating block controls — positioned relative to the scroll container */}
      {!isViewer && hoverCoords && (
        <div
          className="floating-block-controls"
          style={{
            position: 'absolute',
            top: hoverCoords.top,
            left: hoverCoords.left,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            background: '#1e293b',
            border: '1px solid #00d2ff',
            borderRadius: '6px',
            padding: '2px 4px',
            gap: 4,
            boxShadow: '0 4px 16px rgba(0,210,255,0.3)',
            pointerEvents: 'all',
          }}
        >
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleInsertSubheadBelowTarget(); }}
            title="Tambah Sub-Bab baru di bawah elemen ini"
            style={{ background: '#fcf5ff', border: '1px solid #8b5cf6', color: '#8b5cf6', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}
          >📌 + Sub-Bab</button>
          {isSubheadBlock && (
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePromoteSubheadToBab(); }}
              title="Ubah Sub-Bab ini menjadi Bab utama (Heading 1)"
              style={{ background: '#f0f9ff', border: '1px solid #0284c7', color: '#0284c7', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}
            >📖 Jadi Bab</button>
          )}
          {isChapterBlock && (
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDemoteBabToSubhead(); }}
              title="Ubah Bab ini menjadi Sub-Bab (Heading 2)"
              style={{ background: '#fcf5ff', border: '1px solid #8b5cf6', color: '#8b5cf6', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}
            >📌 Jadi Sub-Bab</button>
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePullUp(); }}
            title="Pindah Ke Atas / Halaman Sebelumnya"
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '15px', padding: '3px 6px', lineHeight: 1 }}
          >⬆️</button>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePushDown(); }}
            title="Pindah Ke Bawah / Halaman Berikutnya"
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '15px', padding: '3px 6px', lineHeight: 1 }}
          >⬇️</button>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
            title={isTableBlock ? "Hapus seluruh tabel" : "Hapus blok ini"}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px', padding: '3px 6px', lineHeight: 1 }}
          >🗑️</button>
        </div>
      )}

      {/* Add Cover Page Button if document does not currently have cover */}
      {!isViewer && !pages.some(p => p.id === 'cover-page') && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <button
            onClick={handleAddCoverPage}
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #3b82f6)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,210,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ➕ Tambah Cover Page
          </button>
        </div>
      )}

      {/* Pages */}
      {pages.map((p, idx) => {
        const isDragOver = dragOverPageId === p.id;
        const isSpecialPage = p.id === 'cover-page' || p.id.includes('toc');
        return (
          <PageContentWrapper
            key={p.id}
            id={p.id}
            html={p.html}
            idx={idx}
            isDragOver={isDragOver}
            isSpecialPage={isSpecialPage}
            bodyFont={langStyle.bodyFont}
            isViewer={isViewer}
            onDeletePage={handleDeletePage}
            onFlipFooter={handleToggleFlipFooter}
            onUploadCoverImage={handleCoverImageUpload}
            onResetCoverImage={handleResetCoverImage}
            hasCustomCoverImage={Boolean(customCoverImage)}
            coverImageFit={coverImageFit}
            onToggleCoverFit={handleToggleCoverFit}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        );
      })}

      {/* Boundary Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0, 210, 255, 0.4)',
            color: '#38bdf8',
            fontSize: '12.5px',
            fontWeight: 700,
            padding: '8px 18px',
            borderRadius: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(0, 210, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
