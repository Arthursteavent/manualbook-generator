// ─── Language ───────────────────────────────────────────────────────────────

export type LanguageCode = 'id' | 'en' | 'zh' | 'ar' | 'ko' | 'ja';

export const TEXT_DIRECTION: Record<LanguageCode, 'ltr' | 'rtl'> = {
  id: 'ltr',
  en: 'ltr',
  zh: 'ltr',
  ar: 'rtl',
  ko: 'ltr',
  ja: 'ltr',
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
  zh: '中文',
  ar: 'العربية',
  ko: '한국어',
  ja: '日本語',
};

// ─── Core Manual Document Schema ───────────────────────────────────────────

export interface ManualMeta {
  title: string;
  subtitle?: string;
  author?: string;
  version?: string;
  company?: string;
  date?: string;
  coverColor?: string;
  coverGradient?: string;
  coverStyle?: 'default' | 'premium' | 'vintage' | 'modern';
  coverGlowEnabled?: boolean;
  coverGlowSize?: number;
  coverGlowColor?: string;
  coverImage?: string;
  coverImageFit?: 'contain' | 'cover' | 'fill';
  footerBrand?: string;
}

export interface TocItem {
  id: string;
  number: string;
  title: string;
  pageNumber: string;
  style?: 'white' | 'transparent';
  /** Heading depth 1–5 (h1–h5). Absent = level 1 (legacy documents). */
  level?: number;
}

export type ContentBlock =
  | SectionTitleBlock
  | ParagraphBlock
  | SubtitleBlock
  | SubSubtitleBlock
  | SubSubSubTitleBlock
  | SubSubSubSubTitleBlock
  | StepBlock
  | BulletListBlock
  | NumberedListBlock
  | ImageBlock
  | TableBlock
  | TwoColumnsBlock
  | PageHeaderBlock
  | RawHtmlBlock;

export interface BulletListBlock {
  kind: 'bullet-list' | 'bullet' | 'bullets';
  items?: string[];
  html?: string;
  accentColor?: string;
}

export interface NumberedListBlock {
  kind: 'numbered-list' | 'numbered' | 'steps';
  items?: string[];
  html?: string;
  accentColor?: string;
  /** Per-item badge numbers taken from the source document (typed or list position). */
  numbers?: string[];
}

export interface TableBlock {
  kind: 'table';
  title?: string;
  headers?: string[];
  rows: string[][];
  accentColor?: string;
}

export interface SectionTitleBlock {
  kind: 'section-title';
  text: string;
  accentColor?: string;
}

export interface ParagraphBlock {
  kind: 'paragraph';
  html: string;
  bold?: boolean;
  color?: string;
  fontFamily?: string;
}

export interface SubtitleBlock {
  kind: 'subtitle';
  text: string;
}

export interface SubSubtitleBlock {
  kind: 'sub-subtitle';
  text: string;
  accentColor?: string;
}

export interface SubSubSubTitleBlock {
  kind: 'sub-sub-subtitle';
  text: string;
  accentColor?: string;
}

export interface SubSubSubSubTitleBlock {
  kind: 'sub-sub-sub-subtitle';
  text: string;
  accentColor?: string;
}

export interface StepBlock {
  kind: 'step';
  text: string;
  accentColor?: string;
  iconSrc?: string;
}

export interface ImageBlock {
  kind: 'image';
  src?: string;
  url?: string;
  image_url?: string;
  caption?: string;
  size?: 'large' | 'medium' | 'small' | 'icon';
  alt?: string;
}

export interface TwoColumnsBlock {
  kind: 'two-columns';
  left: ContentBlock[];
  right: ContentBlock[];
}

export interface PageHeaderBlock {
  kind: 'page-header';
  chapterNum: string;
  label: string;
  name: string;
}

export interface RawHtmlBlock {
  kind: 'raw-html';
  html: string;
}

export interface ManualPage {
  id: string;
  type: 'cover' | 'toc' | 'content';
  chapterNumber?: string;
  chapterLabel?: string;
  chapterName?: string;
  footerBrand?: string;
  footerPage?: string;
  blocks: ContentBlock[];
}

export interface ManualDocument {
  meta: ManualMeta;
  toc: TocItem[];
  pages: ManualPage[];
}

// ─── Editor State ───────────────────────────────────────────────────────────

export interface EditorState {
  document: ManualDocument;
  isDirty: boolean;
  projectId: string | null;
  projectName: string;
}

// ─── Saved Edits (localStorage) ─────────────────────────────────────────────

export type SavedEdits = Record<string, string>;

export interface ProjectData {
  id: string;
  name: string;
  document: ManualDocument;
  savedAt: string;
}
