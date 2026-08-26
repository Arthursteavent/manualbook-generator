import type { LanguageCode } from '../types/manual.types';
import { TEXT_DIRECTION } from '../types/manual.types';
import { getColorTheme, DEFAULT_COLOR_THEME } from './colorThemes';
import type { ColorTheme, ColorThemeId } from './colorThemes';

export interface I18nStrings {
  coverSubtitleLabel: string;
  coverTagline: string;
  coverPublisherLabel: string;
  coverPublisherName: string;
  coverDocLabel: string;
  coverDocType: string;
  tocTitle: string;
  tocGlossaryTitle: string;
  pageFooterLabel: (pageNum: number) => string;
  glossaryTitle: string;
  glossaryTermHeader: string;
  glossaryCategoryHeader: string;
  glossaryDescHeader: string;
  glossaryAddButton: string;
  glossaryDeleteButtonTitle: string;
  featureListDefaultTitle: string;
  paragraphFiller: string;
  runningHeader: string;
  deletePageBtn: string;
  autoReflowBtn: string;
}

const UI_I18N: Record<LanguageCode, I18nStrings> = {
  id: {
    coverSubtitleLabel: 'DOKUMENTASI RESMI',
    coverTagline: 'Panduan Pengoperasian, Arsitektur Sistem, dan Prosedur Standar Operasional Terstruktur',
    coverPublisherLabel: 'Diterbitkan Oleh',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: 'Dokumen',
    coverDocType: 'Halaman Sampul',
    tocTitle: 'DAFTAR ISI',
    tocGlossaryTitle: 'Glosarium Istilah Teknologi',
    pageFooterLabel: (n) => `Hal ${n}`,
    glossaryTitle: 'Glosarium Istilah Teknologi',
    glossaryTermHeader: 'Istilah',
    glossaryCategoryHeader: 'Kategori',
    glossaryDescHeader: 'Penjelasan',
    glossaryAddButton: '+ Tambah Istilah Baru',
    glossaryDeleteButtonTitle: 'Hapus baris istilah ini',
    featureListDefaultTitle: '',
    paragraphFiller: ' Modul ini dirancang secara terstruktur untuk memastikan seluruh fungsi operasional dan kontrol antarmuka dapat diakses secara optimal dan responsif oleh pengguna.',
    runningHeader: '',
    deletePageBtn: '🗑️ Hapus Halaman',
    autoReflowBtn: '✨ Padatkan Halaman (Auto Reflow)',
  },
  en: {
    coverSubtitleLabel: 'OFFICIAL DOCUMENTATION',
    coverTagline: 'Structured Operating Guide, System Architecture, and Standard Operating Procedures',
    coverPublisherLabel: 'Published By',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: 'Document',
    coverDocType: 'Cover Page',
    tocTitle: 'TABLE OF CONTENTS',
    tocGlossaryTitle: 'Technology Glossary',
    pageFooterLabel: (n) => `Page ${n}`,
    glossaryTitle: 'Technology Glossary',
    glossaryTermHeader: 'Term',
    glossaryCategoryHeader: 'Category',
    glossaryDescHeader: 'Explanation',
    glossaryAddButton: '+ Add New Term',
    glossaryDeleteButtonTitle: 'Delete this term',
    featureListDefaultTitle: '',
    paragraphFiller: ' This module is structurally designed to ensure all operational functions and interface controls can be accessed optimally and responsively by users.',
    runningHeader: '',
    deletePageBtn: '🗑️ Delete Page',
    autoReflowBtn: '✨ Auto Reflow Pages',
  },
  zh: {
    coverSubtitleLabel: '官方文档',
    coverTagline: '结构化操作指南、系统架构与标准作业程序',
    coverPublisherLabel: '出版方',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: '文档',
    coverDocType: '封面页',
    tocTitle: '目录',
    tocGlossaryTitle: '技术术语词汇表',
    pageFooterLabel: (n) => `第 ${n} 页`,
    glossaryTitle: '技术术语词汇表',
    glossaryTermHeader: '术语',
    glossaryCategoryHeader: '类别',
    glossaryDescHeader: '解释',
    glossaryAddButton: '+ 添加新术语',
    glossaryDeleteButtonTitle: '删除此术语',
    featureListDefaultTitle: '',
    paragraphFiller: ' 本模块采用结构化设计，以确保用户能够优化且响应迅速地访问所有操作功能和界面控制。',
    runningHeader: '',
    deletePageBtn: '🗑️ 删除页面',
    autoReflowBtn: '✨ 自动调整页面 (Auto Reflow)',
  },
  ar: {
    coverSubtitleLabel: 'الوثائق الرسمية',
    coverTagline: 'دليل التشغيل المهيكل، وبنية النظام، وإجراءات التشغيل القياسية',
    coverPublisherLabel: 'نُشر بواسطة',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: 'مستند',
    coverDocType: 'صفحة الغلاف',
    tocTitle: 'جدول المحتويات',
    tocGlossaryTitle: 'قاموس المصطلحات التقنية',
    pageFooterLabel: (n) => `الصفحة ${n}`,
    glossaryTitle: 'قاموس المصطلحات التقنية',
    glossaryTermHeader: 'المصطلح',
    glossaryCategoryHeader: 'الفئة',
    glossaryDescHeader: 'الشرح',
    glossaryAddButton: '+ إضافة مصطلح جديد',
    glossaryDeleteButtonTitle: 'حذف هذا المصطلح',
    featureListDefaultTitle: '',
    paragraphFiller: ' تم تصميم هذا الموديول بشكل هيكلي لضمان إمكانية الوصول إلى جميع الوظائف التشغيلية وعناصر التحكم في الواجهة بشكل تحسيني واستجابي من قبل المستخدمين.',
    runningHeader: '',
    deletePageBtn: '🗑️ حذف الصفحة',
    autoReflowBtn: '✨ إعادة ضبط الصفحات تلقائياً',
  },
  ko: {
    coverSubtitleLabel: '공식 문서',
    coverTagline: '체계적인 운영 가이드, 시스템 아키텍처 및 표준 작업 절차',
    coverPublisherLabel: '발행처',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: '문서',
    coverDocType: '표지',
    tocTitle: '목차',
    tocGlossaryTitle: '기술 용어집',
    pageFooterLabel: (n) => `${n} 페이지`,
    glossaryTitle: '기술 용어집',
    glossaryTermHeader: '용어',
    glossaryCategoryHeader: '카테고리',
    glossaryDescHeader: '설명',
    glossaryAddButton: '+ 새 용어 추가',
    glossaryDeleteButtonTitle: '이 용어 삭제',
    featureListDefaultTitle: '',
    paragraphFiller: ' 본 모듈은 사용자가 모든 작동 기능과 인터페이스 제어 항목에 최적으로 신속하게 접근할 수 있도록 체계적으로 설계되었습니다.',
    runningHeader: '',
    deletePageBtn: '🗑️ 페이지 삭제',
    autoReflowBtn: '✨ 페이지 자동 정렬 (Auto Reflow)',
  },
  ja: {
    coverSubtitleLabel: '公式ドキュメント',
    coverTagline: '体系的な操作ガイド、システムアーキテクチャ、および標準作業手順書',
    coverPublisherLabel: '発行元',
    coverPublisherName: 'MANUAL ARCH',
    coverDocLabel: 'ドキュメント',
    coverDocType: '表紙',
    tocTitle: '目次',
    tocGlossaryTitle: '技術用語集',
    pageFooterLabel: (n) => `${n} ページ`,
    glossaryTitle: '技術用語集',
    glossaryTermHeader: '用語',
    glossaryCategoryHeader: 'カテゴリ',
    glossaryDescHeader: '説明',
    glossaryAddButton: '+ 新しい用語を追加',
    glossaryDeleteButtonTitle: 'この用語を削除',
    featureListDefaultTitle: '',
    paragraphFiller: ' 本モジュールは、ユーザーがすべての操作機能およびインターフェース制御に最適かつ迅速にアクセスできるように体系的に設計されています。',
    runningHeader: '',
    deletePageBtn: '🗑️ ページを削除',
    autoReflowBtn: '✨ ページ自動整形 (Auto Reflow)',
  },
};

export interface LangStyle {
  code: LanguageCode;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  headingFont: string;
  bodyFont: string;
  i18n: I18nStrings;
  colorTheme: ColorTheme;
}

const FONT_STACKS: Record<LanguageCode, { heading: string; body: string }> = {
  id: { heading: "'Playfair Display', serif", body: "'Inter', sans-serif" },
  en: { heading: "'Playfair Display', serif", body: "'Inter', sans-serif" },
  zh: { heading: "'Noto Sans SC', 'Playfair Display', sans-serif", body: "'Noto Sans SC', 'Inter', sans-serif" },
  ar: { heading: "'Noto Sans Arabic', 'Playfair Display', sans-serif", body: "'Noto Sans Arabic', 'Inter', sans-serif" },
  ko: { heading: "'Noto Sans KR', 'Playfair Display', sans-serif", body: "'Noto Sans KR', 'Inter', sans-serif" },
  ja: { heading: "'Noto Sans JP', 'Playfair Display', sans-serif", body: "'Noto Sans JP', 'Inter', sans-serif" },
};

export function getLangStyle(language: LanguageCode = 'id', themeId: ColorThemeId = DEFAULT_COLOR_THEME): LangStyle {
  const dir = TEXT_DIRECTION[language] || 'ltr';
  const fonts = FONT_STACKS[language] || FONT_STACKS.id;
  const i18n = UI_I18N[language] || UI_I18N.id;
  const colorTheme = getColorTheme(themeId);
  // For non-Latin scripts (CJK, Arabic), keep the script-specific fonts.
  // For Latin scripts (id, en), use the theme's fonts.
  const isLatinScript = language === 'id' || language === 'en';
  const headingFont = isLatinScript ? colorTheme.headingFont : fonts.heading;
  const bodyFont = isLatinScript ? colorTheme.bodyFont : fonts.body;
  return { code: language, dir, isRtl: dir === 'rtl', headingFont, bodyFont, i18n, colorTheme };
}

const DEFAULT_LANG: LangStyle = getLangStyle('id');

export interface Block {
  type: string;
  text?: string;
  items?: string[];
  title?: string;
  headers?: string[];
  src?: string;
  image_url?: string;
  caption?: string;
  rows?: string[][];
  [key: string]: any;
}

export interface Section {
  title: string;
  blocks?: Block[];
  raw_text?: string[];
  [key: string]: any;
}

export interface TechLegendItem {
  term: string;
  category?: string;
  kategori?: string;
  desc: string;
  [key: string]: any;
}

export interface GeneratedPage {
  id: string;
  html: string;
}

function esc(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getSubheadLetter(idx: number): string {
  let str = '';
  let n = idx + 1;
  while (n > 0) {
    let rem = (n - 1) % 26;
    str = String.fromCharCode(97 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

/**
 * Tipe blok judul bertingkat, berurut dari sub-bab (Heading 2 di Word) sampai
 * kedalaman kelima. Indeks array + 2 = level heading aslinya.
 */
export const SUBHEAD_BLOCK_TYPES = ['subhead', 'sub_subhead', 'sub_sub_subhead', 'sub_sub_sub_subhead'] as const;

export const MAX_SUBHEAD_LEVEL = SUBHEAD_BLOCK_TYPES.length + 1;

/** Level heading sebuah blok: 2 (sub-bab) sampai 5, atau 0 bila bukan judul. */
export function getSubheadLevel(type?: string): number {
  const idx = SUBHEAD_BLOCK_TYPES.indexOf(type as typeof SUBHEAD_BLOCK_TYPES[number]);
  return idx === -1 ? 0 : idx + 2;
}

export function isSubheadBlock(type?: string): boolean {
  return getSubheadLevel(type) > 0;
}

/**
 * Nomor urut judul bertingkat: "1.2", "1.2.3", "1.2.3.4", dst. Counter untuk
 * level yang lebih dalam direset setiap kali level di atasnya bertambah, persis
 * seperti penomoran otomatis Word.
 */
export function nextSubheadNumber(secNum: number, counters: number[], level: number): string {
  const depth = Math.min(Math.max(level, 2), MAX_SUBHEAD_LEVEL) - 2;
  counters[depth] = (counters[depth] || 0) + 1;
  for (let i = depth + 1; i < counters.length; i++) counters[i] = 0;

  const parts = [String(secNum)];
  for (let i = 0; i <= depth; i++) parts.push(String(counters[i] || 1));
  return parts.join('.');
}

/**
 * Nomor setiap judul bertingkat di seluruh dokumen, dipetakan per objek blok.
 * Daftar isi dan halaman isi sama-sama memanggil ini atas data yang sama,
 * sehingga nomor pada daftar isi selalu identik dengan nomor di badan halaman.
 */
export function buildSubheadNumbering(sections: Section[]): Map<Block, string> {
  const numbering = new Map<Block, string>();
  sections.forEach((sec, idx) => {
    const secNum = idx + 1;
    const counters = new Array(SUBHEAD_BLOCK_TYPES.length).fill(0);
    (sec.blocks || []).forEach(b => {
      const level = getSubheadLevel(b.type);
      if (!level) return;
      numbering.set(b, nextSubheadNumber(secNum, counters, level));
    });
  });
  return numbering;
}

/**
 * Level judul dari elemen HTML halaman yang sudah dirender. Halaman lama yang
 * tersimpan di database belum punya atribut data-subhead-level, jadi kelas frame
 * dan pola penomoran teks dipakai sebagai cadangan.
 */
export function detectSubheadLevelFromEl(el: Element): number {
  const frame = (el.closest ? el.closest('.subhead-frame') : null) || el;

  const attr = frame.getAttribute('data-subhead-level');
  if (attr) {
    const parsed = parseInt(attr, 10);
    if (parsed >= 2 && parsed <= MAX_SUBHEAD_LEVEL) return parsed;
  }

  const classNames = `${frame.getAttribute('class') || ''} ${el.getAttribute('class') || ''}`;
  if (/sub-sub-sub-subhead-frame|body-sub-sub-sub-subtitle/.test(classNames)) return 5;
  if (/sub-sub-subhead-frame|body-sub-sub-subtitle/.test(classNames)) return 4;
  if (/sub-subhead-frame|body-sub-subtitle/.test(classNames)) return 3;

  const numbering = (el.textContent || '').trim().match(/^(\d+(?:\.\d+)+)(?=[\s\.\:\-]|$)/);
  if (numbering) return Math.min(numbering[1].split('.').length, MAX_SUBHEAD_LEVEL);

  return 2;
}

/** Gaya baris Daftar Isi (indentasi + tipografi) untuk sebuah level judul. */
export function getTocLevelStyle(level: number): { indent: string; text: string } {
  return TOC_STYLE_BY_LEVEL[level] ?? TOC_STYLE_BY_LEVEL[MAX_SUBHEAD_LEVEL];
}

/** Tinggi baris perkiraan judul per level, dipakai penghitung pemenggalan halaman. */
const SUBHEAD_HEIGHT_BY_LEVEL: Record<number, number> = { 2: 24, 3: 20, 4: 18, 5: 16 };

/** Tampilan judul bertingkat di badan halaman A4, makin dalam makin kecil & menjorok. */
const SUBHEAD_STYLE_BY_LEVEL: Record<number, {
  fontSize: string;
  fontStyle: string;
  marginTop: string;
  indent: string;
  underline: boolean;
  frameClass: string;
  bodyClass: string;
}> = {
  2: { fontSize: '13.5px', fontStyle: 'normal', marginTop: '14px', indent: '36px', underline: true, frameClass: 'subhead-frame-level2', bodyClass: 'body-subtitle' },
  3: { fontSize: '13px', fontStyle: 'normal', marginTop: '12px', indent: '40px', underline: true, frameClass: 'sub-subhead-frame', bodyClass: 'body-sub-subtitle' },
  4: { fontSize: '12.5px', fontStyle: 'normal', marginTop: '11px', indent: '44px', underline: true, frameClass: 'sub-sub-subhead-frame', bodyClass: 'body-sub-sub-subtitle' },
  5: { fontSize: '12px', fontStyle: 'italic', marginTop: '10px', indent: '48px', underline: false, frameClass: 'sub-sub-sub-subhead-frame', bodyClass: 'body-sub-sub-sub-subtitle' },
};

/** Tampilan judul bertingkat pada baris Daftar Isi. */
const TOC_STYLE_BY_LEVEL: Record<number, { indent: string; text: string }> = {
  2: { indent: '20px', text: 'font-size:12.5px; color:#334155; font-weight:600;' },
  3: { indent: '40px', text: 'font-size:11.5px; color:#475569; font-weight:500;' },
  4: { indent: '56px', text: 'font-size:11px; color:#64748b; font-weight:500;' },
  5: { indent: '70px', text: 'font-size:10.5px; color:#64748b; font-weight:500; font-style:italic;' },
};

export function cleanSubheadText(text: string): string {
  if (!text) return '';
  return stripTags(text)
    .replace(/^[\*\_\#\-\s]+/, '')
    .replace(/^(sub\s*bab|bab)\s*\d+(\.\d+)*[\.\:\-]?\s*/gi, '')
    .replace(/^\d+(\.\d+)*[\.\:\-]?\s*/, '')
    .trim();
}

export function cleanSectionTitle(title: string): string {
  if (!title) return '';
  if (title.includes('[TABLE_') || title.includes('TABLE_') || title.includes('[IMAGE_') || /^\[?(IMAGE|TABLE)_\d+\]?$/i.test(title)) return '';
  const cleaned = stripTags(title)
    .replace(/\[HEADER_STYLE_\d+\]/gi, '')
    .replace(/\[HEADER_STYLE\]/gi, '')
    .replace(/\[NUMERIC_HEADER\]/gi, '')
    .replace(/^\[\d+\]\s*/, '')
    .replace(/^(bab\s*\d+|\d+)[\.\:\-]?\s*/gi, '')
    .replace(/^[\.\:\-\,\;\s\•\-\*\)]+/, '');
  if (!cleaned || /^\[?\d+\]?$/.test(cleaned) || /^TABLE_\d+$/i.test(cleaned)) return '';
  return cleaned;
}

export function isTableField(str: string): boolean {
  if (!str) return true;
  const clean = stripTags(str).replace(/^[A-Za-z0-9][\.\:\-]\s*/i, '').trim().toLowerCase();
  if (clean.length <= 2 || /^\d+$/.test(clean)) return true;
  return false;
}

export function estimateHeight(b: Block): number {
  if (b.type === 'para' || b.type === 'lead') {
    const txt = b.text || '';
    const cleanTxt = stripTags(txt);
    const lineCount = Math.max(1, Math.ceil(cleanTxt.length / 60));
    return 16 + lineCount * 22;
  }
  const subheadLevel = getSubheadLevel(b.type);
  if (subheadLevel > 0) {
    const txt = b.text || '';
    const cleanTxt = stripTags(txt);
    const lineCount = Math.max(1, Math.ceil(cleanTxt.length / 45));
    const baseH = SUBHEAD_HEIGHT_BY_LEVEL[subheadLevel] ?? 16;
    return baseH + lineCount * baseH;
  }
  if (b.type === 'feature_list') {
    const items = b.items || [];
    return 30 + items.length * 28;
  }
  if (b.type === 'image' || b.type === 'image_ref') {
    let h = 280;
    const captionLower = (b.caption || '').toLowerCase();
    const isIcon = captionLower.includes('icon') || captionLower.includes('tombol') || captionLower.includes('button') || captionLower.includes('logo') || captionLower.includes('filter');
    if (b.size === 'small' || isIcon) {
      h = 120;
    } else if (b.size === 'medium') {
      h = 200;
    }
    if (b.caption) {
      const capLines = Math.max(1, Math.ceil(stripTags(b.caption).length / 70));
      h += capLines * 16;
    }
    return h;
  }
  if (b.type === 'bullets' || b.type === 'steps') {
    const items = b.items || [];
    const totalLines = items.reduce((acc, item) => acc + Math.max(1, Math.ceil(stripTags(item).length / 60)), 0);
    return 18 + totalLines * 22 + items.length * 4;
  }
  if (b.type === 'table') {
    const titleHeight = b.title ? 28 : 0;
    const headersHeight = (b.headers && b.headers.length > 0) ? 30 : 0;
    const rows = b.rows || [];
    const rowsHeight = rows.reduce((acc: number, row: string[]) => {
      const maxCellLen = row.reduce((max: number, cell: string) => Math.max(max, stripTags(cell).length), 0);
      const cellLines = Math.max(1, Math.ceil(maxCellLen / 30));
      return acc + (cellLines * 20 + 10);
    }, 0);
    return 24 + titleHeight + headersHeight + rowsHeight;
  }
  return 30;
}

export function blockToHtml(b: Block, lang: LangStyle = DEFAULT_LANG): string {
  const accentSide = lang.isRtl ? 'border-right' : 'border-left';
  const listPadSide = lang.isRtl ? 'padding-right' : 'padding-left';
  const ct = lang.colorTheme;

  if (b.type === 'table') {
    const titleTxt = stripTags(b.title || '').trim();
    const titleHtml = titleTxt ? `<div class="table-title editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:#0f172a; margin-bottom:6px; letter-spacing:0.01em;">${esc(titleTxt)}</div>` : '';

    let headersHtml = '';
    if (b.headers && b.headers.length > 0) {
      headersHtml = '<thead><tr>' + b.headers.map((h: string) => `<th class="editable-text" contenteditable="true" style="padding:7px 10px; background:#f1f5f9; color:#0f172a; font-weight:700; font-size:11.5px; border:1px solid #cbd5e1; text-align:left; word-break:break-word;">${esc(stripTags(h))}</th>`).join('') + `<th style="padding:7px 4px; width:32px; text-align:center;" data-editor-ui="true"></th></tr></thead>`;
    }

    let rowsHtml = '';
    if (b.rows && b.rows.length > 0) {
      rowsHtml = '<tbody>' + b.rows.map((row: string[], rIdx: number) => {
        const bg = rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
        const cellsHtml = row.map((cell: string) => `<td class="editable-text" contenteditable="true" style="padding:6px 10px; color:#334155; font-size:11.5px; line-height:1.5; border:1px solid #e2e8f0; vertical-align:middle; word-break:break-word;">${formatTableCellContent(cell)}</td>`).join('');
        return `<tr style="background:${bg};">${cellsHtml}<td style="padding:6px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true"><button class="btn-delete-doc-table-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6;">🗑️</button></td></tr>`;
      }).join('') + '</tbody>';
    }

    return `<div class="deletable table-frame" style="position: relative; margin-top: 10px; margin-bottom: 14px; padding-left: 36px; padding-right: 36px;">
      ${titleHtml}
      <div class="document-table-container" style="width:100%; overflow-x:auto; border-radius:6px; border:1px solid #cbd5e1;">
        <table class="document-table" style="width:100%; border-collapse:collapse; font-size:11.5px; font-family:inherit;">
          ${headersHtml}
          ${rowsHtml}
        </table>
        <div style="margin-top:6px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true">
          <button class="btn-add-doc-table-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">➕ Tambah Baris</button>
        </div>
      </div>
    </div>`;
  }
  const subheadLevel = getSubheadLevel(b.type);
  if (subheadLevel > 0) {
    const cleanTxt = stripTags(b.text || '');
    const st = SUBHEAD_STYLE_BY_LEVEL[subheadLevel] ?? SUBHEAD_STYLE_BY_LEVEL[MAX_SUBHEAD_LEVEL];

    const underlineCss = st.underline ? `border-bottom: 2px solid ${ct.subheadBorderColor}; padding-bottom: 4px;` : '';
    const indent = `margin-left: ${st.indent}; margin-right: ${st.indent};`;

    return `<div class="deletable subhead-frame ${st.frameClass}" data-subhead-level="${subheadLevel}" style="position: relative; margin-top: ${st.marginTop}; margin-bottom: 6px; ${underlineCss} ${indent} padding-left: 0; padding-right: 0;">
      <div class="subhead-text editable-text ${st.bodyClass}" contenteditable="true" style="font-size: ${st.fontSize}; font-weight: 700; font-style: ${st.fontStyle}; color: #0f172a; letter-spacing: 0.01em;">${esc(cleanTxt)}</div>
    </div>`;
  }
  if (b.type === 'para' || b.type === 'lead') {
    let rawTxt = stripTags(b.text || '').trim();

    // Callout Note Box (Catatan / Perhatian / Warning)
    const matchNote = rawTxt.match(/^(catatan|perhatian|warning|note)[\:\-]\s*(.+)$/i);
    if (matchNote) {
      const noteTitle = esc(matchNote[1]);
      const noteBody = esc(matchNote[2]);
      return `<div class="deletable note-frame" style="position: relative; margin-top: 8px; margin-bottom: 10px; margin-left: 36px; margin-right: 36px; background: #fffbebf0; ${accentSide}: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; color: #92400e; font-size: 12.5px;">
        <strong contenteditable="true" style="outline: none;">${noteTitle}:</strong> <span contenteditable="true" style="outline: none;">${noteBody}</span>
      </div>`;
    }

    // Numbered Step Item (1. apa, 2. apa, 3. apa)
    const matchStep = rawTxt.match(/^(\d+)[\.\)]\s*(.+)$/);
    if (matchStep) {
      const stepNum = matchStep[1];
      const stepBody = esc(matchStep[2]);
      return `<div class="deletable para-frame step-item-frame" style="position: relative; margin-top: 6px; margin-bottom: 8px; padding-left: 36px; padding-right: 36px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span class="editable-text step-badge" contenteditable="true" suppressContentEditableWarning="true" style="width: 22px; height: 22px; border-radius: 50%; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; outline: none; cursor: text;" title="Klik untuk mengedit nomor langkah">
            ${stepNum}
          </span>
          <p class="editable-text" contenteditable="true" style="font-size: 13px; line-height: 1.6; color: #334155; margin: 0; text-indent: 0; flex: 1;">${stepBody}</p>
        </div>
      </div>`;
    }

    return `<div class="deletable para-frame" style="position: relative; margin-top: 6px; margin-bottom: 10px; padding-left: 36px; padding-right: 36px;">
      <p class="editable-text" contenteditable="true" style="font-size: 13px; line-height: 1.7; color: #334155; text-align: justify; text-justify: inter-word; word-break: normal; overflow-wrap: break-word; hyphens: none; margin: 0; text-indent: 0;">${esc(rawTxt)}</p>
    </div>`;
  }
  if (b.type === 'feature_list') {
    let itemsHtml = '';
    (b.items || []).forEach(item => {
      let cleanItem = esc(stripTags(item)).replace(/^\*\*(.*?)\*\*/, '<strong style="color:#0f172a;">$1</strong>');
      itemsHtml += `<li contenteditable="true" style="margin-bottom:6px; font-size:12.5px; color:#334155; line-height:1.5;">${cleanItem}</li>`;
    });
    const rawTitle = stripTags(b.title || '').trim();
    const isDefaultTitle = !rawTitle || rawTitle === 'Komponen & Fitur Utama' || rawTitle === 'Main Components & Features' || rawTitle === '主要组件与功能' || rawTitle === 'المكونات والميزات الرئيسية' || rawTitle === '주요 구성 요소 및 기능' || rawTitle === '主なコンポーネントと機能';
    const titleHtml = isDefaultTitle ? '' : `<div contenteditable="true" style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:6px;">${esc(rawTitle)}</div>`;
    return `<div class="deletable feature-frame" style="position: relative; margin-top: 10px; margin-bottom: 12px; background:${ct.featureBgColor}; ${accentSide}:4px solid ${ct.featureBorderColor}; padding:12px 16px; border-radius:0 8px 8px 0;">
      ${titleHtml}
      <ul style="margin:0; ${listPadSide}:18px;">${itemsHtml}</ul>
    </div>`;
  }
  if (b.type === 'image' || b.type === 'image_ref') {
    const src = b.src || b.image_url || (b.image_file ? (b.image_file.startsWith('/') ? b.image_file : `/${b.image_file}`) : '');
    const cleanCap = stripTags(b.caption || '');
    return `<div class="deletable image-frame" style="position: relative; margin-top: 6px; margin-bottom: 6px; text-align: center;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px; display:inline-flex; flex-direction:column; align-items:center; width:max-content; max-width:100%; box-sizing:border-box;">
        ${src ? `<img src="${esc(src)}" ${src.startsWith('data:') ? '' : 'crossOrigin="anonymous"'} style="max-width:480px; max-height:260px; width:auto !important; height:auto !important; object-fit:contain; display:block; margin:0 auto; border-radius:4px;" />` : `<div style="width:480px; max-width:100%; height:180px; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:12px;">Image Placeholder</div>`}
        <div class="image-caption editable-text" contenteditable="true" style="font-size:11px; color:#64748b; margin-top:5px; font-style:italic; outline:none; width:100%; text-align:center;">${esc(cleanCap || 'Gambar')}</div>
      </div>
    </div>`;
  }
  if (b.type === 'bullets') {
    let itemsHtml = '';
    (b.items || []).forEach(item => {
      let cleanItem = esc(stripTags(item))
        .replace(/^\*\*(.*?)\*\*/, '<strong style="color:#0f172a;">$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');
      itemsHtml += `<li contenteditable="true" style="margin-bottom:4px; font-size:12.5px; color:#334155; line-height:1.5;">${cleanItem}</li>`;
    });
    return `<div class="deletable list-frame" style="position: relative; margin-top: 8px; margin-bottom: 10px; padding-left: 36px; padding-right: 36px;">
      <ul style="margin:0; ${listPadSide}:16px; list-style-type:disc;">${itemsHtml}</ul>
    </div>`;
  }
  if (b.type === 'steps') {
    let itemsHtml = '';
    let runningNum = 1;
    (b.items || []).forEach((item) => {
      let rawText = stripTags(item).trim();
      const isLangkahTitle = /^Langkah\s*\d+/i.test(rawText);
      if (isLangkahTitle) {
        let cleanTitle = esc(rawText)
          .replace(/^\*\*(.*?)\*\*/, '<strong style="color:#0f172a;">$1</strong>')
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');
        itemsHtml += `
          <div style="margin-top: 8px; margin-bottom: 6px; font-weight: 700; color: #0f172a; font-size: 13.5px;" class="editable-text" contenteditable="true" style="outline: none;">${cleanTitle}</div>`;
        return;
      }
      const typedNum = rawText.match(/^(\d+)[\.\)]\s*/);
      const badgeNum = typedNum ? typedNum[1] : String(runningNum);
      let textWithoutNum = rawText.replace(/^(\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))\s*/, '');
      let cleanItem = esc(textWithoutNum || rawText)
        .replace(/^\*\*(.*?)\*\*/, '<strong style="color:#0f172a;">$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');
      itemsHtml += `
        <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px;">
          <span class="editable-text step-badge" contenteditable="true" suppressContentEditableWarning="true" style="width: 22px; height: 22px; border-radius: 50%; background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; outline: none; cursor: text;" title="Klik untuk mengedit nomor langkah">
            ${badgeNum}
          </span>
          <span class="editable-text" contenteditable="true" style="font-size: 13px; color: #334155; line-height: 1.5; outline: none; flex: 1;">${cleanItem}</span>
        </div>`;
      runningNum = typedNum ? parseInt(typedNum[1], 10) + 1 : runningNum + 1;
    });
    return `<div class="deletable steps-frame" style="position: relative; margin-top: 8px; margin-bottom: 10px; padding-left: 36px; padding-right: 36px;">
      <div style="display: flex; flex-direction: column; gap: 4px;">${itemsHtml}</div>
    </div>`;
  }
  return '';
}

export function isDuplicateSectionTitle(blockText: string, sectionTitle: string): boolean {
  if (!blockText || !sectionTitle) return false;
  const cleanBlock = blockText.replace(/^[A-Z0-9\.\:\-]\s*/i, '').trim().toLowerCase();
  const cleanSec = sectionTitle.replace(/^[A-Z0-9\.\:\-]\s*/i, '').trim().toLowerCase();
  if (!cleanBlock || !cleanSec) return false;
  return cleanBlock === cleanSec || cleanSec.endsWith(cleanBlock) || cleanBlock.endsWith(cleanSec);
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
  return esc(stripTags(str));
}

function stripTags(str: string = ''): string {
  return String(str)
    .replace(/\[HEADER_STYLE_\d+\]/gi, '')
    .replace(/\[HEADER_STYLE\]/gi, '')
    .replace(/\[NUMERIC_HEADER\]/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

export function generateCoverPage(
  docTitle: string,
  lang: LangStyle = DEFAULT_LANG,
  coverImageUrl?: string,
  coverImageFit: 'contain' | 'cover' | 'fill' = 'contain',
  docSubtitle?: string
): GeneratedPage {
  const id = 'cover-page';

  if (coverImageUrl) {
    const html = `
    <div class="page page-cover" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; padding:0; margin:0; border-radius:10px; position:relative; overflow:hidden; background:#0f172a; display:flex; align-items:center; justify-content:center;">
      <img src="${coverImageUrl}" alt="Full Cover Image" style="width:100%; height:100%; object-fit:${coverImageFit}; display:block;" />
    </div>`;
    return { id, html };
  }

  const cleanTitle = stripTags(docTitle || 'Panduan Penggunaan Manual Book');
  const cleanSubtitle = stripTags(docSubtitle || lang.i18n.coverTagline);
  const accentSide = lang.isRtl ? 'border-right' : 'border-left';
  const padSide = lang.isRtl ? 'padding-right' : 'padding-left';
  const ct = lang.colorTheme;
  const html = `
  <div class="page page-cover ${ct.patternClassName}" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="display:flex; flex-direction:column; justify-content:space-between; width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:${ct.coverGradient}; border:${ct.pageFrameBorder}; color:#ffffff; padding:60px 50px; border-radius:10px; position:relative; overflow:hidden;">
    <div class="page-header-decor-bar" style="background:${ct.headerBarGradient};"></div>
    ${ct.cornerWatermarkSvg}
    <!-- Top Brand -->
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <div style="font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${ct.coverBadgeColor}; background:${ct.coverBadgeBg}; padding:6px 16px; border-radius:20px; border:1px solid ${ct.coverBadgeBorder};">
        MANUAL BOOK
      </div>
      <div style="font-size:12px; color:#94a3b8; font-weight:600; letter-spacing:1px;">VERSION 1.0</div>
    </div>

    <!-- Bottom-Left Title Hero -->
    <div style="margin-top:auto; margin-bottom:36px; padding:20px 0; text-align:left;">
      <div style="font-size:12px; font-weight:700; color:${ct.coverSubtitleColor}; letter-spacing:3px; text-transform:uppercase; margin-bottom:16px;">${esc(lang.i18n.coverSubtitleLabel)}</div>
      <h1 class="chapter-name editable-text" contenteditable="true" style="font-size:38px; font-weight:800; line-height:1.25; color:#ffffff; font-family:${lang.headingFont}; ${accentSide}:6px solid ${ct.coverAccentBar}; ${padSide}:24px; margin:0; outline:none;">
        ${esc(cleanTitle)}
      </h1>
      <div class="chapter-subtitle editable-text" contenteditable="true" style="font-size:15px; color:#94a3b8; margin-top:24px; ${padSide}:30px; line-height:1.6; max-width:600px; outline:none; cursor:text;" title="Klik untuk mengedit deskripsi/subtitle cover">
        ${esc(cleanSubtitle)}
      </div>
    </div>

    <!-- Bottom Footer -->
    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.15); padding-top:24px;">
      <div>
        <div style="font-size:10px; color:${ct.coverSubtitleColor}; text-transform:uppercase; letter-spacing:1.5px;">${esc(lang.i18n.coverPublisherLabel)}</div>
        <div style="font-size:14px; font-weight:800; color:${ct.accent}; margin-top:4px;">${esc(lang.i18n.coverPublisherName)}</div>
      </div>
      <div style="text-align:${lang.isRtl ? 'left' : 'right'};">
        <div style="font-size:10px; color:${ct.coverSubtitleColor}; text-transform:uppercase; letter-spacing:1.5px;">${esc(lang.i18n.coverDocLabel)}</div>
        <div style="font-size:13px; font-weight:700; color:#ffffff; margin-top:4px;">${esc(lang.i18n.coverDocType)}</div>
      </div>
    </div>
  </div>`;
  return { id, html };
}

export function generateTocPages(
  docTitle: string,
  sections: Section[],
  sectionPageNumbers: Record<number, number> = {},
  subheadPageNumbers: Record<string, number> = {},
  legendPageNum: number | null = null,
  lang: LangStyle = DEFAULT_LANG
): GeneratedPage[] {
  const ct = lang.colorTheme;
  const subIndentSide = lang.isRtl ? 'margin-right' : 'margin-left';
  // Nomor judul dihitung dari data yang sama dengan badan halaman, jadi
  // "3.2.1 Verifikasi" di daftar isi selalu sama dengan yang tercetak di isi.
  const subheadNumbering = buildSubheadNumbering(sections);
  const items: { type: string; height: number; html: string }[] = [];
  sections.forEach((sec, idx) => {
    const secNum = idx + 1;
    let cleanSecName = cleanSectionTitle(sec.title || '') || stripTags(sec.title || '').trim();

    if (!cleanSecName || cleanSecName.includes('[IMAGE_') || cleanSecName.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(cleanSecName)) {
      cleanSecName = `Fitur Tambahan ${secNum}`;
    }

    const displayTitle = cleanSecName.match(/^\d+[\.\)]/) ? cleanSecName : `${secNum}. ${cleanSecName}`;
    const pageNum = sectionPageNumbers[idx] !== undefined ? sectionPageNumbers[idx] : (idx + 3);

    items.push({
      type: 'section',
      height: displayTitle.length > 40 ? 60 : 44,
      html: `<div class="toc-row-section" data-sec-idx="${idx}" style="display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; margin-bottom:6px; padding-bottom:4px; width:100%;">
        <span class="toc-text-title editable-text" contenteditable="true" style="font-weight:700; font-size:13.5px; color:#0f172a; outline:none; display:inline-block; max-width:480px; word-break:break-word; cursor:text;">${esc(displayTitle)}</span>
        <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${ct.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:4px; outline:none; cursor:text;" title="Klik untuk mengedit atau mengetik karakter kustom pada garis titik"></span>
        <span class="toc-text-page editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:${ct.tocPageNumColor}; background:${ct.tocPageNumBg}; width:32px; min-width:32px; height:22px; line-height:22px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${pageNum}</span>
        <div style="margin-left:8px; display:inline-flex; gap:4px; opacity:0.8;" data-editor-ui="true">
          <button class="btn-move-toc-up" data-editor-ui="true" title="Naikkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬆️</button>
          <button class="btn-move-toc-down" data-editor-ui="true" title="Turunkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬇️</button>
          <button class="btn-toggle-toc-type" data-editor-ui="true" title="Ubah ke Sub-Bab" style="background:#fcf5ff; border:1px solid #8b5cf6; border-radius:4px; color:#8b5cf6; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">📌 Jadi Sub-Bab</button>
          <button class="btn-delete-toc-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:2px;">🗑️</button>
        </div>
      </div>`
    });

    if (sec.blocks) {
      sec.blocks.forEach(b => {
        const level = getSubheadLevel(b.type);
        if (level > 0) {
          const cleanSub = cleanSubheadText(b.text || '');
          const cleanSubLower = cleanSub.toLowerCase();
          const isNonHeadingSub = (
            !cleanSub || cleanSub.length > 120 ||
            cleanSub.includes('[IMAGE_') || cleanSub.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(cleanSub) ||
            cleanSub.includes('[TABLE_') || cleanSub.includes('TABLE_') || /^\[?TABLE_\d+\]?$/i.test(cleanSub) ||
            cleanSubLower.startsWith('expected result') || cleanSubLower === 'hasil' || cleanSubLower === 'komponen' ||
            cleanSubLower.includes('berhasil disimpan') || cleanSubLower.includes('berhasil ditambahkan') || cleanSubLower.includes('berhasil ditampilkan') ||
            isTableField(cleanSub)
          );
          if (isNonHeadingSub) {
            return;
          }
          const subNumber = subheadNumbering.get(b);
          const displaySubText = subNumber ? `${subNumber} ${cleanSub}` : cleanSub;

          const subKey = `${idx}_${cleanSub}`;
          const subPageNum = subheadPageNumbers[subKey] !== undefined ? subheadPageNumbers[subKey] : pageNum;

          const tocStyle = TOC_STYLE_BY_LEVEL[level] ?? TOC_STYLE_BY_LEVEL[MAX_SUBHEAD_LEVEL];
          const rowClass = level > 2
            ? `toc-row-subhead toc-row-subsubhead toc-row-level-${level}`
            : 'toc-row-subhead toc-row-level-2';

          items.push({
            type: b.type,
            height: cleanSub.length > 40 ? 52 : 32,
            html: `<div class="${rowClass}" data-sec-idx="${idx}" data-subhead-level="${level}" data-subhead-text="${esc(cleanSub)}" style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px; margin-bottom:4px; padding-bottom:2px; width:100%;">
              <span class="toc-text-subtitle editable-text" contenteditable="true" style="${tocStyle.text} outline:none; display:inline-block; max-width:480px; word-break:break-word; cursor:text; ${subIndentSide}:${tocStyle.indent};">${esc(displaySubText)}</span>
              <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${ct.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:3px; outline:none; cursor:text;" title="Klik untuk mengedit atau mengetik karakter kustom pada garis titik"></span>
              <span class="toc-text-page editable-text" contenteditable="true" style="font-size:11.5px; font-weight:600; color:${ct.tocPageNumColor}; background:${ct.tocPageNumBg}; width:32px; min-width:32px; height:20px; line-height:20px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${subPageNum}</span>
              <div style="margin-left:8px; display:inline-flex; gap:4px; opacity:0.8;" data-editor-ui="true">
                <button class="btn-move-toc-up" data-editor-ui="true" title="Naikkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬆️</button>
                <button class="btn-move-toc-down" data-editor-ui="true" title="Turunkan urutan" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; color:#475569; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">⬇️</button>
                <button class="btn-toggle-toc-type" data-editor-ui="true" title="Ubah ke Bab utama" style="background:#f0f9ff; border:1px solid #0284c7; border-radius:4px; color:#0284c7; cursor:pointer; font-size:10px; padding:2px 5px; font-weight:600;">📖 Jadi Bab</button>
                <button class="btn-delete-toc-row" data-editor-ui="true" title="Hapus baris ini" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:2px;">🗑️</button>
              </div>
            </div>`
          });
        }
      });
    }
  });

  if (legendPageNum !== null) {
    items.push({
      type: 'section',
      height: 44,
      html: `<div class="toc-row-section" style="display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; margin-bottom:6px; padding-bottom:4px; overflow:hidden; width:100%;">
        <span class="toc-text-title editable-text" contenteditable="true" style="font-weight:700; font-size:13.5px; color:#0f172a; outline:none; display:inline-block; max-width:540px; word-break:break-word; cursor:text;">${esc(lang.i18n.tocGlossaryTitle)}</span>
        <span class="toc-dot-leader editable-text" contenteditable="true" style="flex:1; min-width:16px; border-bottom:1px dotted ${ct.tocDotColor}; margin:0 8px; align-self:flex-end; margin-bottom:4px; outline:none; cursor:text;" title="Klik untuk mengedit atau mengetik karakter kustom pada garis titik"></span>
        <span class="toc-text-page editable-text" contenteditable="true" style="font-size:12.5px; font-weight:700; color:${ct.tocPageNumColor}; background:${ct.tocPageNumBg}; width:32px; min-width:32px; height:22px; line-height:22px; padding:0; border-radius:4px; outline:none; white-space:nowrap; flex-shrink:0; display:inline-block; text-align:center; cursor:text; box-sizing:border-box;">${legendPageNum}</span>
      </div>`
    });
  }

  const MAX_TOC_HEIGHT = 780;
  const tocPages: { type: string; height: number; html: string }[][] = [];
  let currentItems: { type: string; height: number; html: string }[] = [];
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

  const pages: GeneratedPage[] = [];
  tocPages.forEach((pageItems, pIdx) => {
    const pageNum = pIdx + 2;
    const id = pIdx === 0 ? 'page-toc' : `page-toc-${pIdx + 1}`;
    const headerTitle = lang.i18n.tocTitle;
    const itemsHtml = pageItems.map(it => it.html).join('');
    const isEven = pageNum % 2 === 0;

    const headerHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px; padding-left: 36px; padding-right: 36px;">
        <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
          <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
            <div class="chapter-num" style="background:${ct.tocChapterNumBg}; color:${ct.tocChapterNumColor};">📋</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${esc(headerTitle)}</div>
            </div>
          </div>
        </div>
      </div>`;

    const footerHtml = `
      <div class="page-footer" style="position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
        <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${esc(docTitle)}</div>
        <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${esc(lang.i18n.pageFooterLabel(pageNum))}</div>
      </div>`;

    const headerDecorBar = `<div class="page-header-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const footerDecorBar = `<div class="page-footer-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const sideStrip = `<div class="page-side-accent-strip" style="background:${ct.accent};"></div>`;
    const centerWatermark = ct.centerWatermarkSvg || '';
    const watermarkSvg = `${ct.cornerWatermarkSvg}<svg class="page-corner-watermark bottom-left" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">${ct.cornerWatermarkSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;

    const html = `
    <div class="page page-content ${ct.patternClassName}" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:${ct.pageBgColor}; border:${ct.pageFrameBorder}; border-radius:10px; padding:40px 48px; position:relative; overflow:hidden;">
      ${headerDecorBar}
      ${footerDecorBar}
      ${sideStrip}
      ${centerWatermark}
      ${watermarkSvg}
      ${headerHtml}

      <div class="deletable toc-container" style="position: relative; margin-top: 10px; margin-bottom: 16px; background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); border-radius: 10px; padding: 18px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
        ${itemsHtml}
        <div style="margin-top:14px; display:flex; gap:8px; justify-content:flex-end;" data-editor-ui="true">
          <button class="btn-add-toc-row" data-editor-ui="true" style="background:#f0f9ff; border:1px dashed #0284c7; color:#0284c7; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">➕ Tambah Bab</button>
          <button class="btn-regenerate-toc" data-editor-ui="true" style="background:#f0fdf4; border:1px dashed #16a34a; color:#16a34a; padding:5px 14px; border-radius:4px; font-size:11.5px; font-weight:600; cursor:pointer;">🔄 Sync / Regenerate Daftar Isi</button>
        </div>
      </div>

      ${footerHtml}
    </div>`;

    pages.push({ id, html });
  });

  return pages;
}

export function generateLegendPages(
  techLegend: TechLegendItem[],
  startPageNum: number,
  docTitle: string,
  lang: LangStyle = DEFAULT_LANG
): GeneratedPage[] {
  if (!techLegend || techLegend.length === 0) return [];

  const ct = lang.colorTheme;
  const separatorSide = lang.isRtl ? 'border-left' : 'border-right';
  const headAlign = lang.isRtl ? 'right' : 'left';
  const ITEMS_PER_PAGE = 10;
  const pages: GeneratedPage[] = [];
  const totalPages = Math.ceil(techLegend.length / ITEMS_PER_PAGE);

  const hasCategory = techLegend.some(item => Boolean(item.category || item.kategori));

  for (let p = 0; p < totalPages; p++) {
    const pageNum = startPageNum + p;
    const id = `legend-page-${p + 1}`;
    const chunk = techLegend.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);
    const isEven = pageNum % 2 === 0;

    let rowsHtml = '';
    chunk.forEach((item, idx) => {
      const globalIdx = p * ITEMS_PER_PAGE + idx;
      const bg = (globalIdx % 2 === 0) ? '#ffffff' : '#f8fafc';
      if (hasCategory) {
        const catVal = item.category || item.kategori || '';
        rowsHtml += `
        <tr style="background:${bg}; border-bottom:1px solid #e2e8f0;">
          <td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:700; color:#0f172a; font-size:12px; width:25%; vertical-align:top; ${separatorSide}:1px solid #e2e8f0; outline:none;">${esc(item.term)}</td>
          <td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:600; color:#475569; font-size:11.5px; width:25%; vertical-align:top; ${separatorSide}:1px solid #e2e8f0; outline:none;">${esc(catVal)}</td>
          <td class="editable-text" contenteditable="true" style="padding:9px 12px; color:#334155; font-size:11.5px; line-height:1.5; vertical-align:top; outline:none;">${esc(item.desc)}</td>
          <td style="padding:9px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true">
            <button class="btn-delete-legend-row" data-editor-ui="true" title="${esc(lang.i18n.glossaryDeleteButtonTitle)}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6; transition:opacity 0.2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.6'">🗑️</button>
          </td>
        </tr>`;
      } else {
        rowsHtml += `
        <tr style="background:${bg}; border-bottom:1px solid #e2e8f0;">
          <td class="editable-text" contenteditable="true" style="padding:9px 12px; font-weight:700; color:#0f172a; font-size:12px; width:30%; vertical-align:top; ${separatorSide}:1px solid #e2e8f0; outline:none;">${esc(item.term)}</td>
          <td class="editable-text" contenteditable="true" style="padding:9px 12px; color:#334155; font-size:11.5px; line-height:1.5; vertical-align:top; outline:none;">${esc(item.desc)}</td>
          <td style="padding:9px 4px; text-align:center; vertical-align:top; width:32px;" data-editor-ui="true">
            <button class="btn-delete-legend-row" data-editor-ui="true" title="${esc(lang.i18n.glossaryDeleteButtonTitle)}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; opacity:0.6; transition:opacity 0.2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.6'">🗑️</button>
          </td>
        </tr>`;
      }
    });

    const headerTitle = lang.i18n.glossaryTitle;
    const headerHtml = `
    <div class="deletable page-header-block" style="position: relative; margin-bottom: 16px; padding-left: 0; padding-right: 0;">
      <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
        <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
          <div class="chapter-num" style="background:${ct.chapterNumBg}; color:${ct.chapterNumColor};">📖</div>
          <div class="chapter-info">
            <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${esc(headerTitle)}</div>
          </div>
        </div>
      </div>
    </div>`;

    const footerHtml = `
      <div class="page-footer" style="position:absolute; bottom:32px; left:36px; right:36px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
        <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${esc(docTitle)}</div>
        <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${esc(lang.i18n.pageFooterLabel(pageNum))}</div>
      </div>`;

    const tableHeaderHtml = hasCategory
      ? `<thead>
            <tr style="background:#1e293b; color:#ffffff; font-size:12px; text-align:${headAlign};">
              <th style="padding:10px 12px; width:25%; ${separatorSide}:1px solid #334155;">${esc(lang.i18n.glossaryTermHeader)}</th>
              <th style="padding:10px 12px; width:25%; ${separatorSide}:1px solid #334155;">${esc(lang.i18n.glossaryCategoryHeader || 'Kategori')}</th>
              <th style="padding:10px 12px;">${esc(lang.i18n.glossaryDescHeader)}</th>
              <th style="padding:10px 4px; width:32px; text-align:center;" data-editor-ui="true"></th>
            </tr>
          </thead>`
      : `<thead>
            <tr style="background:#1e293b; color:#ffffff; font-size:12px; text-align:${headAlign};">
              <th style="padding:10px 12px; width:30%; ${separatorSide}:1px solid #334155;">${esc(lang.i18n.glossaryTermHeader)}</th>
              <th style="padding:10px 12px;">${esc(lang.i18n.glossaryDescHeader)}</th>
              <th style="padding:10px 4px; width:32px; text-align:center;" data-editor-ui="true"></th>
            </tr>
          </thead>`;

    const headerDecorBar = `<div class="page-header-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const footerDecorBar = `<div class="page-footer-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const sideStrip = `<div class="page-side-accent-strip" style="background:${ct.accent};"></div>`;
    const centerWatermark = ct.centerWatermarkSvg || '';
    const watermarkSvg = `${ct.cornerWatermarkSvg}<svg class="page-corner-watermark bottom-left" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">${ct.cornerWatermarkSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;

    const html = `
    <div class="page page-content ${ct.patternClassName}" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:${ct.pageBgColor}; border:${ct.pageFrameBorder}; border-radius:10px; padding:40px 36px; position:relative; overflow:hidden;">
      ${headerDecorBar}
      ${footerDecorBar}
      ${sideStrip}
      ${centerWatermark}
      ${watermarkSvg}
      ${headerHtml}

      <div class="deletable table-frame" style="position: relative; margin-top: 10px; margin-bottom: 14px;">
        <div class="document-table-container" style="width:100%; overflow-x:auto; border-radius:6px; border:1px solid #cbd5e1; background:rgba(255,255,255,0.9);">
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

    pages.push({ id, html });
  }

  return pages;
}

export function generateDocumentPages(
  docTitle: string,
  sections: Section[],
  techLegend: TechLegendItem[] | null = null,
  lang: LangStyle = DEFAULT_LANG,
  docSubtitle?: string
): GeneratedPage[] {
  const ct = lang.colorTheme;
  const sectionPagesHtml: GeneratedPage[] = [];
  const sectionPageNumbers: Record<number, number> = {};
  const subheadPageNumbers: Record<string, number> = {};

  const effectiveSections: Section[] = [...sections];
  if (techLegend && techLegend.length > 0) {
    const hasCategory = techLegend.some(item => Boolean(item.category || item.kategori));
    const headers = hasCategory
      ? [lang.i18n.glossaryTermHeader, lang.i18n.glossaryCategoryHeader || 'Kategori', lang.i18n.glossaryDescHeader]
      : [lang.i18n.glossaryTermHeader, lang.i18n.glossaryDescHeader];

    const rows = techLegend.map(item => {
      if (hasCategory) {
        return [item.term || '', item.category || item.kategori || '', item.desc || ''];
      }
      return [item.term || '', item.desc || ''];
    });

    effectiveSections.push({
      title: lang.i18n.glossaryTitle,
      blocks: [
        {
          type: 'table',
          headers,
          rows
        }
      ]
    });
  }

  const subheadNumbering = buildSubheadNumbering(effectiveSections);

  const tocItemHeights: number[] = [];
  effectiveSections.forEach((sec) => {
    const titleText = (sec.title || '').trim().replace(/^[A-Za-z0-9]+[\.\:\-]\s*/i, '');
    if (!titleText || titleText.includes('[IMAGE_') || titleText.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(titleText)) return;
    tocItemHeights.push(32);
    if (sec.blocks) {
      sec.blocks.forEach(b => {
        if (isSubheadBlock(b.type)) {
          const cleanSub = cleanSubheadText(b.text || '');
          const cleanSubLower = cleanSub.toLowerCase();
          const isNonHeadingSub = (
            !cleanSub || cleanSub.length > 120 ||
            cleanSub.includes('[IMAGE_') || cleanSub.includes('IMAGE_') || /^\[?IMAGE_\d+\]?$/i.test(cleanSub) ||
            cleanSub.includes('[TABLE_') || cleanSub.includes('TABLE_') || /^\[?TABLE_\d+\]?$/i.test(cleanSub) ||
            cleanSubLower.startsWith('expected result') || cleanSubLower === 'hasil' || cleanSubLower === 'komponen' ||
            cleanSubLower.includes('berhasil disimpan') || cleanSubLower.includes('berhasil ditambahkan') || cleanSubLower.includes('berhasil ditampilkan') ||
            isTableField(cleanSub)
          );
          if (!isNonHeadingSub) {
            tocItemHeights.push(22);
          }
        }
      });
    }
  });

  const MAX_TOC_HEIGHT = 780;
  let numTocPages = 0;
  let curH = 0;
  tocItemHeights.forEach(h => {
    if (curH + h > MAX_TOC_HEIGHT) {
      numTocPages++;
      curH = h;
    } else {
      curH += h;
    }
  });
  if (curH > 0) numTocPages++;
  if (numTocPages === 0) numTocPages = 1;

  let pageIndex = 1 + numTocPages + 1;
  let pageBlocksHtml: string[] = [];
  const MAX_HEIGHT = 920;
  const SECTION_HEADER_HEIGHT = 70;
  const RUNNING_HEADER_HEIGHT = 0;
  let currentHeight = 0;

  const pushPage = (_primaryTitle: string, secIdx: number) => {
    const id = 'sec-' + secIdx + '-' + pageIndex;
    const isEven = pageIndex % 2 === 0;

    const headerHtml = (lang.i18n.runningHeader && lang.i18n.runningHeader.trim()) ? `
      <div class="page-header-block deletable" style="position: relative; margin-bottom: 12px; padding-left: 36px; padding-right: 36px;">
        <div class="page-header-running" style="display:flex; justify-content:space-between; font-size:11px; color:#64748b; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:12px;">
          <span></span>
          <span>${esc(lang.i18n.runningHeader)}</span>
        </div>
      </div>` : '';

    const footerHtml = `
      <div class="page-footer" style="position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}">
        <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${esc(docTitle)}</div>
        <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${esc(lang.i18n.pageFooterLabel(pageIndex))}</div>
      </div>`;

    const headerDecorBar = `<div class="page-header-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const footerDecorBar = `<div class="page-footer-decor-bar" style="background:${ct.headerBarGradient};"></div>`;
    const sideStrip = `<div class="page-side-accent-strip" style="background:${ct.accent};"></div>`;
    const centerWatermark = ct.centerWatermarkSvg || '';
    const watermarkSvg = `${ct.cornerWatermarkSvg}<svg class="page-corner-watermark bottom-left" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">${ct.cornerWatermarkSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;

    const html = `
    <div class="page page-content ${ct.patternClassName}" id="page-${id}" data-page="${id}" dir="${lang.dir}" style="width:794px; height:1123px; min-height:1123px; max-height:1123px; box-sizing:border-box; background:${ct.pageBgColor}; border:${ct.pageFrameBorder}; border-radius:10px; padding:40px 48px; position:relative; overflow:hidden;">
      ${headerDecorBar}
      ${footerDecorBar}
      ${sideStrip}
      ${centerWatermark}
      ${watermarkSvg}
      ${headerHtml}
      ${pageBlocksHtml.join('')}
      ${footerHtml}
    </div>`;

    sectionPagesHtml.push({ id, html });
    pageIndex++;
    pageBlocksHtml = [];
    currentHeight = RUNNING_HEADER_HEIGHT;
  };

  let activeTitle = '';
  let activeSecIdx = 0;

  effectiveSections.forEach((sec, idx) => {
    if (sectionPageNumbers[idx] === undefined) {
      sectionPageNumbers[idx] = pageIndex;
    }

    if (sec.title) {
      activeTitle = sec.title;
      activeSecIdx = idx;
    }

    const secNum = idx + 1;
    const cleanTitle = cleanSectionTitle(sec.title || '');
    const displayTitle = cleanTitle || `Bab ${secNum}`;
    const boxNum = `${secNum}`;
    const sectionHeaderHtml = `
      <div class="deletable page-header-block" style="position: relative; margin-bottom: 12px; margin-top: ${idx > 0 ? '18px' : '0'}; padding-left: 36px; padding-right: 36px;">
        <div class="page-header" style="display:flex; align-items:center; justify-content:space-between;">
          <div class="page-header-left" style="display:flex; align-items:center; gap:12px;">
            <div class="chapter-num editable-text" contenteditable="true" style="background:${ct.chapterNumBg}; color:${ct.chapterNumColor}; outline:none; cursor:text;" title="Klik untuk mengedit nomor bab">${boxNum}</div>
            <div class="chapter-info">
              <div class="chapter-name editable-text" contenteditable="true" style="font-size: 16px; font-weight: 700; color: #0f172a; outline:none;">${displayTitle}</div>
            </div>
          </div>
        </div>
      </div>`;

    if (idx > 0 && pageBlocksHtml.length > 0) {
      pushPage(activeTitle, activeSecIdx);
    }

    pageBlocksHtml.push(sectionHeaderHtml);
    currentHeight += SECTION_HEADER_HEIGHT;

    if (sec.blocks) {
      sec.blocks.forEach((origB) => {
        let b = origB;

        const rawText = b.text || '';
        if (rawText) {
          const cleanBText = rawText.replace(/^(BAB\s+\d+|BAB\s+[IVXLCDM]+|\d+(\.\d+)*[\.\:\-]?)\s*/i, '').trim().toLowerCase();
          const cleanDisplay = displayTitle.replace(/^(BAB\s+\d+|BAB\s+[IVXLCDM]+|\d+(\.\d+)*[\.\:\-]?)\s*/i, '').trim().toLowerCase();
          if (cleanBText && cleanDisplay && cleanBText === cleanDisplay) {
            return;
          }
        }

        if (isSubheadBlock(b.type)) {
          const cleanSub = cleanSubheadText(b.text || '');
          const subNumStr = subheadNumbering.get(origB);
          b = { ...b, text: subNumStr ? `${subNumStr} ${cleanSub}` : cleanSub };
        }

        if (b.type === 'steps' && b.items && b.items.length > 0) {
          const updatedItems: string[] = [];
          b.items.forEach((item) => {
            let rawText = stripTags(item).trim();
            let textWithoutNum = rawText.replace(/^(\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))\s*/, '');
            updatedItems.push(textWithoutNum || rawText);
          });
          b = { ...b, items: updatedItems };
        }

        const h = estimateHeight(b);

        if (b.type === 'table' && b.rows && b.rows.length > 0) {
          if (currentHeight + h > MAX_HEIGHT) {
            let remainingRows = [...b.rows];
            let isFirstChunk = true;
            let mainTitle = b.title || '';

            const getRowHeight = (r: string[]) => {
              const maxCellLen = r.reduce((max: number, cell: string) => Math.max(max, stripTags(cell).length), 0);
              const cellLines = Math.max(1, Math.ceil(maxCellLen / 30));
              return cellLines * 20 + 10;
            };

            const getBaseTableHeight = (title?: string, hasHeaders?: boolean) => {
              const titleH = title ? 28 : 0;
              const headersH = hasHeaders ? 30 : 0;
              return 24 + titleH + headersH;
            };

            while (remainingRows.length > 0) {
              const chunkTitle = isFirstChunk ? mainTitle : (mainTitle ? `${mainTitle} (Lanjutan)` : '');
              const hasHeaders = Boolean(b.headers && b.headers.length > 0);
              const baseH = getBaseTableHeight(chunkTitle, hasHeaders);

              const TABLE_SAFETY_MARGIN = 50;
              const availableHeight = MAX_HEIGHT - TABLE_SAFETY_MARGIN;

              if (pageBlocksHtml.length > 0 && availableHeight - currentHeight < baseH + getRowHeight(remainingRows[0])) {
                pushPage(activeTitle, activeSecIdx);
              }

              const availableForRows = availableHeight - currentHeight - baseH;
              let count = 0;
              let usedRowsH = 0;

              for (let i = 0; i < remainingRows.length; i++) {
                const rh = getRowHeight(remainingRows[i]);
                if (usedRowsH + rh <= availableForRows || (count === 0 && pageBlocksHtml.length === 0)) {
                  usedRowsH += rh;
                  count++;
                } else {
                  break;
                }
              }

              const chunkRows = remainingRows.slice(0, count);
              remainingRows = remainingRows.slice(count);

              const tableChunkBlock: Block = {
                ...b,
                title: chunkTitle,
                headers: b.headers,
                rows: chunkRows,
              };

              const chunkTotalH = baseH + usedRowsH;
              pageBlocksHtml.push(blockToHtml(tableChunkBlock, lang));
              currentHeight += chunkTotalH;

              if (remainingRows.length > 0) {
                pushPage(activeTitle, activeSecIdx);
              }
              isFirstChunk = false;
            }
            return;
          }
        }

        if (isSubheadBlock(b.type) && pageBlocksHtml.length > 0) {
          // Jangan tinggalkan judul menggantung sendirian di kaki halaman.
          if (MAX_HEIGHT - currentHeight < 130) {
            pushPage(activeTitle, activeSecIdx);
          }
        }

        if (currentHeight + h > MAX_HEIGHT && pageBlocksHtml.length > 0) {
          pushPage(activeTitle, activeSecIdx);
        }

        if (isSubheadBlock(b.type)) {
          const cleanSubKey = cleanSubheadText(origB.text || '');
          const subKey = `${idx}_${cleanSubKey}`;
          if (subheadPageNumbers[subKey] === undefined) {
            subheadPageNumbers[subKey] = pageIndex;
          }
        }

        pageBlocksHtml.push(blockToHtml(b, lang));
        currentHeight += h;
      });
    }
  });

  if (pageBlocksHtml.length > 0) {
    pushPage(activeTitle, effectiveSections.length - 1);
  }

  const coverPage = generateCoverPage(docTitle, lang, undefined, 'contain', docSubtitle);
  const tocPages = generateTocPages(docTitle, effectiveSections, sectionPageNumbers, subheadPageNumbers, null, lang);
  const rawList = [coverPage, ...tocPages, ...sectionPagesHtml];

  return rawList.map((p, idx) => {
    if (p.id === 'cover-page') return p;
    const pageNum = idx + 1;
    const isEven = pageNum % 2 === 0;
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = p.html;
    const pageEl = (tempDiv.querySelector('.page') || tempDiv.firstElementChild) as HTMLElement;
    if (pageEl) {
      let footerEl = pageEl.querySelector('.page-footer') as HTMLElement | null;
      let footerPageEl = pageEl.querySelector('.footer-page');

      if (!footerEl) {
        footerEl = window.document.createElement('div');
        footerEl.className = 'page-footer';
        footerEl.style.cssText = `position:absolute; bottom:32px; left:48px; right:48px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; background:#ffffff; z-index:5; ${isEven ? 'flex-direction:row;' : 'flex-direction:row-reverse;'}`;
        footerEl.innerHTML = `
          <div class="footer-brand editable-text" contenteditable="true" style="outline:none;">${esc(docTitle)}</div>
          <div class="footer-page editable-text" contenteditable="true" style="outline:none;">${esc(lang.i18n.pageFooterLabel(pageNum))}</div>
        `;
        pageEl.appendChild(footerEl);
      } else {
        if (footerPageEl) {
          footerPageEl.textContent = lang.i18n.pageFooterLabel(pageNum);
        }
        const isFlipped = footerEl.getAttribute('data-flipped') === 'true';
        footerEl.style.flexDirection = isFlipped
          ? (isEven ? 'row-reverse' : 'row')
          : (isEven ? 'row' : 'row-reverse');
      }
      return { id: p.id, html: pageEl.outerHTML };
    }
    return p;
  });
}
