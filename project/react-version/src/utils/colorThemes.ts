/**
 * Color Theme System for Manual Book Generator
 * =============================================
 * 5 distinct color themes with unique typography pairings.
 * Each theme controls cover page gradient, accent colors, TOC styling,
 * content page headers, and font families throughout the document.
 */

export type ColorThemeId = 'ocean-blue' | 'crimson-red' | 'emerald-green' | 'royal-gold' | 'obsidian-black' | 'original';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;

  // ── Accent Colors ──
  accent: string;           // Primary accent (borders, badges, highlights)
  accentLight: string;      // Light variant for subtle backgrounds
  accentDark: string;       // Darker variant
  accentRgba: string;       // RGBA for overlays (e.g. "0,210,255")

  // ── Cover Page ──
  coverGradient: string;    // CSS linear-gradient for cover background
  coverBadgeBg: string;     // Badge pill background on cover
  coverBadgeBorder: string; // Badge pill border on cover
  coverBadgeColor: string;  // Badge pill text color
  coverAccentBar: string;   // Decorative accent bar color
  coverSubtitleColor: string;

  // ── TOC ──
  tocChapterNumBg: string;  // Chapter number circle/square bg in TOC
  tocChapterNumColor: string;
  tocPageNumColor: string;
  tocPageNumBg: string;
  tocDotColor: string;

  // ── Content Pages ──
  chapterNumBg: string;     // Chapter number badge background
  chapterNumColor: string;
  chapterLabelColor: string;
  subheadBorderColor: string;
  stepBorderColor: string;
  stepBgColor: string;
  featureBorderColor: string;
  featureBgColor: string;

  // ── Typography ──
  headingFont: string;      // Font for headings (cover title, section titles)
  bodyFont: string;         // Font for body text (paragraphs, lists)

  // ── Page Background Motifs & Patterns ──
  pageBgColor: string;          // Page background tint color
  patternClassName: string;     // Theme pattern CSS class name
  headerBarGradient: string;    // Gradient for top header decor bar
  pageFrameBorder: string;      // Page border style
  cornerWatermarkSvg: string;   // Decorative corner SVG watermark overlay
  centerWatermarkSvg: string;   // Central emblem SVG watermark overlay

  // ── Preview ──
  previewGradient: string;  // Gradient for theme card preview in selector
  previewAccent: string;    // Accent line for preview card
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Definitions
// ─────────────────────────────────────────────────────────────────────────────

const OCEAN_BLUE: ColorTheme = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  description: 'Tema biru laut klasik dengan aksen cyan & sirkuit cyber digital',

  accent: '#00d2ff',
  accentLight: '#f0f9ff',
  accentDark: '#0088cc',
  accentRgba: '0,210,255',

  coverGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  coverBadgeBg: 'rgba(0,210,255,0.15)',
  coverBadgeBorder: 'rgba(0,210,255,0.3)',
  coverBadgeColor: '#00d2ff',
  coverAccentBar: '#00d2ff',
  coverSubtitleColor: '#64748b',

  tocChapterNumBg: '#00d2ff',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#0088cc',
  tocPageNumBg: '#f0f9ff',
  tocDotColor: '#94a3b8',

  chapterNumBg: '#00d2ff',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#0088cc',
  subheadBorderColor: '#00d2ff',
  stepBorderColor: '#00d2ff',
  stepBgColor: '#f8fafc',
  featureBorderColor: '#00d2ff',
  featureBgColor: '#f8fafc',

  headingFont: "'Playfair Display', serif",
  bodyFont: "'Inter', sans-serif",

  pageBgColor: '#f4f9ff',
  patternClassName: 'theme-pattern-ocean-blue',
  headerBarGradient: 'linear-gradient(90deg, #00d2ff 0%, #0088cc 50%, #0284c7 100%)',
  pageFrameBorder: '1px solid rgba(0, 210, 255, 0.35)',
  cornerWatermarkSvg: `<svg class="page-corner-watermark top-right" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 80 Q 140 180 340 40 M0 150 Q 180 250 340 110 M0 220 Q 200 310 340 190" stroke="#00d2ff" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/><path d="M40 0 Q 160 140 340 260 M110 0 Q 210 160 340 310" stroke="#0088cc" stroke-width="1.8" stroke-dasharray="6 6" opacity="0.3"/><circle cx="280" cy="70" r="14" fill="none" stroke="#00d2ff" stroke-width="1.5" opacity="0.35"/><circle cx="280" cy="70" r="5" fill="#00d2ff" opacity="0.4"/><circle cx="220" cy="140" r="9" fill="none" stroke="#0088cc" stroke-width="1.2" opacity="0.3"/><circle cx="160" cy="210" r="6" fill="#00d2ff" opacity="0.3"/></svg>`,
  centerWatermarkSvg: `<svg class="page-center-watermark" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="200" r="180" stroke="#00d2ff" stroke-width="2" stroke-dasharray="8 6" opacity="0.14"/><circle cx="200" cy="200" r="140" stroke="#0088cc" stroke-width="1.5" opacity="0.12"/><path d="M200 20 C 100 120 100 280 200 380 M200 20 C 300 120 300 280 200 380 M20 200 C 120 100 280 100 380 200 M20 200 C 120 300 280 300 380 200" stroke="#00d2ff" stroke-width="1.2" opacity="0.1"/><circle cx="200" cy="200" r="30" fill="none" stroke="#00d2ff" stroke-width="2" opacity="0.15"/></svg>`,

  previewGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  previewAccent: '#00d2ff',
};

const CRIMSON_RED: ColorTheme = {
  id: 'crimson-red',
  name: 'Crimson Red',
  description: 'Tema merah industri dengan aksen drafter 45° khas cetak biru arsitektur',

  accent: '#ef4444',
  accentLight: '#fef2f2',
  accentDark: '#b91c1c',
  accentRgba: '239,68,68',

  coverGradient: 'linear-gradient(135deg, #1a0505 0%, #450a0a 50%, #7f1d1d 100%)',
  coverBadgeBg: 'rgba(239,68,68,0.15)',
  coverBadgeBorder: 'rgba(239,68,68,0.4)',
  coverBadgeColor: '#fca5a5',
  coverAccentBar: '#ef4444',
  coverSubtitleColor: '#78716c',

  tocChapterNumBg: '#ef4444',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#b91c1c',
  tocPageNumBg: '#fef2f2',
  tocDotColor: '#a8a29e',

  chapterNumBg: '#ef4444',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#b91c1c',
  subheadBorderColor: '#ef4444',
  stepBorderColor: '#ef4444',
  stepBgColor: '#fef2f2',
  featureBorderColor: '#ef4444',
  featureBgColor: '#fef2f2',

  headingFont: "'Source Sans 3', sans-serif",
  bodyFont: "'Source Sans 3', sans-serif",

  pageBgColor: '#fdfaf7',
  patternClassName: 'theme-pattern-crimson-red',
  headerBarGradient: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 80%)',
  pageFrameBorder: '2px solid #b91c1c',
  cornerWatermarkSvg: `<svg class="page-corner-watermark top-right" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M340 0 H220 V24 H340 V0 Z M340 0 V120 H316 V0 H340 Z" fill="#ef4444" fill-opacity="0.15" stroke="#b91c1c" stroke-width="1.8" opacity="0.45"/><path d="M340 60 L60 340 M340 120 L120 340 M340 180 L180 340 M340 240 L240 340" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="8 4" opacity="0.32"/><rect x="240" y="44" width="64" height="64" stroke="#b91c1c" stroke-width="1.8" fill="none" opacity="0.3"/></svg>`,
  centerWatermarkSvg: `<svg class="page-center-watermark" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="60" y="60" width="280" height="280" stroke="#ef4444" stroke-width="2" stroke-dasharray="10 5" fill="none" opacity="0.14" transform="rotate(45 200 200)"/><rect x="100" y="100" width="200" height="200" stroke="#b91c1c" stroke-width="1.2" fill="none" opacity="0.1" transform="rotate(45 200 200)"/><circle cx="200" cy="200" r="130" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="0.12"/></svg>`,

  previewGradient: 'linear-gradient(135deg, #1a0505 0%, #450a0a 50%, #7f1d1d 100%)',
  previewAccent: '#ef4444',
};

const EMERALD_GREEN: ColorTheme = {
  id: 'emerald-green',
  name: 'Emerald Green',
  description: 'Tema hijau segar dengan kontur vein daun organik & sarang lebah eco',

  accent: '#10b981',
  accentLight: '#ecfdf5',
  accentDark: '#047857',
  accentRgba: '16,185,129',

  coverGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)',
  coverBadgeBg: 'rgba(16,185,129,0.15)',
  coverBadgeBorder: 'rgba(16,185,129,0.4)',
  coverBadgeColor: '#6ee7b7',
  coverAccentBar: '#10b981',
  coverSubtitleColor: '#6b7280',

  tocChapterNumBg: '#10b981',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#047857',
  tocPageNumBg: '#ecfdf5',
  tocDotColor: '#9ca3af',

  chapterNumBg: '#10b981',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#047857',
  subheadBorderColor: '#10b981',
  stepBorderColor: '#10b981',
  stepBgColor: '#ecfdf5',
  featureBorderColor: '#10b981',
  featureBgColor: '#ecfdf5',

  headingFont: "'Lora', serif",
  bodyFont: "'Nunito Sans', sans-serif",

  pageBgColor: '#f5faf7',
  patternClassName: 'theme-pattern-emerald-green',
  headerBarGradient: 'linear-gradient(90deg, #10b981 0%, #047857 70%, transparent 100%)',
  pageFrameBorder: '1px solid rgba(16, 185, 129, 0.3)',
  cornerWatermarkSvg: `<svg class="page-corner-watermark top-right" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M340 0 C 220 60 100 180 0 340 C 140 240 240 140 340 0 Z" fill="#10b981" fill-opacity="0.08" stroke="#10b981" stroke-width="2" opacity="0.35"/><path d="M260 50 C 200 100 140 170 80 260 M220 90 C 170 140 120 200 70 280" stroke="#047857" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.3"/><polygon points="280,20 310,35 310,70 280,85 250,70 250,35" stroke="#10b981" stroke-width="1.8" fill="none" opacity="0.35"/></svg>`,
  centerWatermarkSvg: `<svg class="page-center-watermark" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="200,30 347,115 347,285 200,370 53,285 53,115" stroke="#10b981" stroke-width="2" stroke-dasharray="6 6" fill="none" opacity="0.14"/><polygon points="200,70 312,135 312,265 200,330 88,265 88,135" stroke="#047857" stroke-width="1.2" fill="none" opacity="0.1"/><path d="M200 50C140 150 140 250 200 350C260 250 260 150 200 50Z" fill="#10b981" fill-opacity="0.05" stroke="#10b981" stroke-width="1.5" opacity="0.14"/></svg>`,

  previewGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)',
  previewAccent: '#10b981',
};

const ROYAL_GOLD: ColorTheme = {
  id: 'royal-gold',
  name: 'Royal Gold',
  description: 'Tema emas mewah dengan ornamen damask klasik & bingkai ganda royal',

  accent: '#f59e0b',
  accentLight: '#fffbeb',
  accentDark: '#b45309',
  accentRgba: '245,158,11',

  coverGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
  coverBadgeBg: 'rgba(245,158,11,0.15)',
  coverBadgeBorder: 'rgba(245,158,11,0.4)',
  coverBadgeColor: '#fcd34d',
  coverAccentBar: '#f59e0b',
  coverSubtitleColor: '#78716c',

  tocChapterNumBg: '#f59e0b',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#b45309',
  tocPageNumBg: '#fffbeb',
  tocDotColor: '#a8a29e',

  chapterNumBg: '#f59e0b',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#b45309',
  subheadBorderColor: '#f59e0b',
  stepBorderColor: '#f59e0b',
  stepBgColor: '#fffbeb',
  featureBorderColor: '#f59e0b',
  featureBgColor: '#fffbeb',

  headingFont: "'Cormorant Garamond', serif",
  bodyFont: "'Raleway', sans-serif",

  pageBgColor: '#fdfbf7',
  patternClassName: 'theme-pattern-royal-gold',
  headerBarGradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
  pageFrameBorder: '2px double rgba(245, 158, 11, 0.5)',
  cornerWatermarkSvg: `<svg class="page-corner-watermark top-right" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M340 0 C 270 40 230 100 230 170 C 230 240 170 300 100 300 C 50 300 0 340 0 340" stroke="#f59e0b" stroke-width="2.5" fill="none" opacity="0.4"/><path d="M340 40 C 290 80 260 130 260 190 C 260 250 200 310 140 310" stroke="#b45309" stroke-width="1.8" stroke-dasharray="4 4" fill="none" opacity="0.3"/><circle cx="280" cy="60" r="14" fill="#f59e0b" fill-opacity="0.12" stroke="#d97706" stroke-width="1.8" opacity="0.4"/><path d="M272 60 L288 60 M280 52 L280 68" stroke="#d97706" stroke-width="1.8" opacity="0.45"/></svg>`,
  centerWatermarkSvg: `<svg class="page-center-watermark" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="200" r="175" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4" fill="none" opacity="0.14"/><circle cx="200" cy="200" r="145" stroke="#b45309" stroke-width="1.2" fill="none" opacity="0.1"/><path d="M200 50C250 120 280 150 350 200C280 250 250 280 200 350C150 280 120 250 50 200C120 150 150 120 200 50Z" fill="none" stroke="#f59e0b" stroke-width="1.8" opacity="0.14"/></svg>`,

  previewGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
  previewAccent: '#f59e0b',
};

const OBSIDIAN_BLACK: ColorTheme = {
  id: 'obsidian-black',
  name: 'Obsidian Black',
  description: 'Tema hitam elegan dengan aksen cetak biru & tanda bidik presisi CAD',

  accent: '#a1a1aa',
  accentLight: '#f4f4f5',
  accentDark: '#71717a',
  accentRgba: '161,161,170',

  coverGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
  coverBadgeBg: 'rgba(161,161,170,0.12)',
  coverBadgeBorder: 'rgba(161,161,170,0.3)',
  coverBadgeColor: '#d4d4d8',
  coverAccentBar: '#a1a1aa',
  coverSubtitleColor: '#71717a',

  tocChapterNumBg: '#27272a',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#52525b',
  tocPageNumBg: '#f4f4f5',
  tocDotColor: '#a1a1aa',

  chapterNumBg: '#27272a',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#52525b',
  subheadBorderColor: '#71717a',
  stepBorderColor: '#52525b',
  stepBgColor: '#fafafa',
  featureBorderColor: '#52525b',
  featureBgColor: '#fafafa',

  headingFont: "'DM Serif Display', serif",
  bodyFont: "'DM Sans', sans-serif",

  pageBgColor: '#f4f4f5',
  patternClassName: 'theme-pattern-obsidian-black',
  headerBarGradient: 'linear-gradient(90deg, #71717a 0%, #27272a 80%)',
  pageFrameBorder: '1px solid rgba(113, 113, 122, 0.4)',
  cornerWatermarkSvg: `<svg class="page-corner-watermark top-right" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M260 20 H320 V80 M280 20 V60 H320" stroke="#71717a" stroke-width="2" opacity="0.45"/><line x1="290" y1="10" x2="290" y2="90" stroke="#71717a" stroke-width="1.8" opacity="0.45"/><line x1="250" y1="50" x2="330" y2="50" stroke="#71717a" stroke-width="1.8" opacity="0.45"/><circle cx="290" cy="50" r="18" stroke="#71717a" stroke-width="1.5" fill="none" opacity="0.4"/><circle cx="290" cy="50" r="30" stroke="#71717a" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.3"/><text x="215" y="42" fill="#71717a" font-family="monospace" font-size="10" opacity="0.45">X: 340.0</text><text x="215" y="55" fill="#71717a" font-family="monospace" font-size="10" opacity="0.45">Y: 000.0</text></svg>`,
  centerWatermarkSvg: `<svg class="page-center-watermark" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="200" r="170" stroke="#71717a" stroke-width="2" fill="none" opacity="0.14"/><circle cx="200" cy="200" r="130" stroke="#27272a" stroke-width="1.2" stroke-dasharray="4 4" fill="none" opacity="0.12"/><line x1="200" y1="20" x2="200" y2="380" stroke="#71717a" stroke-width="1.2" stroke-dasharray="10 5" opacity="0.12"/><line x1="20" y1="200" x2="380" y2="200" stroke="#71717a" stroke-width="1.2" stroke-dasharray="10 5" opacity="0.12"/></svg>`,

  previewGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
  previewAccent: '#a1a1aa',
};

const ORIGINAL: ColorTheme = {
  id: 'original',
  name: 'Original',
  description: 'Tema polos tanpa garis & ornamen dengan aksen biru — bersih dan fokus ke konten',

  accent: '#2563eb',
  accentLight: '#eff6ff',
  accentDark: '#1e40af',
  accentRgba: '37,99,235',

  coverGradient: 'linear-gradient(135deg, #0a1633 0%, #10224d 100%)',
  coverBadgeBg: 'rgba(96,165,250,0.15)',
  coverBadgeBorder: 'rgba(96,165,250,0.4)',
  coverBadgeColor: '#93c5fd',
  coverAccentBar: '#3b82f6',
  coverSubtitleColor: '#9aa7bd',

  tocChapterNumBg: '#2563eb',
  tocChapterNumColor: '#ffffff',
  tocPageNumColor: '#1e40af',
  tocPageNumBg: '#eff6ff',
  tocDotColor: '#a3a3a3',

  chapterNumBg: '#2563eb',
  chapterNumColor: '#ffffff',
  chapterLabelColor: '#1e40af',
  subheadBorderColor: '#2563eb',
  stepBorderColor: '#2563eb',
  stepBgColor: '#eff6ff',
  featureBorderColor: '#2563eb',
  featureBgColor: '#eff6ff',

  headingFont: "'Inter', 'Segoe UI', sans-serif",
  bodyFont: "'Inter', sans-serif",

  pageBgColor: '#ffffff',
  patternClassName: 'theme-pattern-original',
  headerBarGradient: 'transparent',
  pageFrameBorder: 'none',
  cornerWatermarkSvg: '',
  centerWatermarkSvg: '',

  previewGradient: 'linear-gradient(135deg, #0a1633 0%, #10224d 100%)',
  previewAccent: '#3b82f6',
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  'ocean-blue': OCEAN_BLUE,
  'crimson-red': CRIMSON_RED,
  'emerald-green': EMERALD_GREEN,
  'royal-gold': ROYAL_GOLD,
  'obsidian-black': OBSIDIAN_BLACK,
  'original': ORIGINAL,
};

export function getColorTheme(id: ColorThemeId): ColorTheme {
  return COLOR_THEMES[id] || COLOR_THEMES['original'];
}

export function getAllColorThemes(): ColorTheme[] {
  return Object.values(COLOR_THEMES);
}

export const DEFAULT_COLOR_THEME: ColorThemeId = 'original';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function getCustomColorTheme(id: ColorThemeId, customHex?: string): ColorTheme {
  const baseTheme = getColorTheme(id);
  if (!customHex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customHex)) {
    return baseTheme;
  }

  const rgb = hexToRgb(customHex);
  if (!rgb) return baseTheme;

  const accentRgba = `${rgb.r},${rgb.g},${rgb.b}`;
  const darkR = Math.max(0, Math.floor(rgb.r * 0.75));
  const darkG = Math.max(0, Math.floor(rgb.g * 0.75));
  const darkB = Math.max(0, Math.floor(rgb.b * 0.75));
  const accentDark = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

  const cDark1R = Math.floor(rgb.r * 0.18);
  const cDark1G = Math.floor(rgb.g * 0.18);
  const cDark1B = Math.floor(rgb.b * 0.18);
  const cDark2R = Math.floor(rgb.r * 0.38);
  const cDark2G = Math.floor(rgb.g * 0.38);
  const cDark2B = Math.floor(rgb.b * 0.38);
  const cDark3R = Math.floor(rgb.r * 0.58);
  const cDark3G = Math.floor(rgb.g * 0.58);
  const cDark3B = Math.floor(rgb.b * 0.58);
  const coverGradient = `linear-gradient(135deg, rgb(${cDark1R}, ${cDark1G}, ${cDark1B}) 0%, rgb(${cDark2R}, ${cDark2G}, ${cDark2B}) 50%, rgb(${cDark3R}, ${cDark3G}, ${cDark3B}) 100%)`;
  const coverBadgeBg = `rgba(${accentRgba}, 0.18)`;
  const coverBadgeBorder = `rgba(${accentRgba}, 0.45)`;
  const coverBadgeColor = customHex;
  const coverAccentBar = customHex;

  const cornerWatermarkSvg = baseTheme.cornerWatermarkSvg
    .replace(new RegExp(baseTheme.accent, 'gi'), customHex)
    .replace(new RegExp(baseTheme.accentDark, 'gi'), accentDark);
  const centerWatermarkSvg = baseTheme.centerWatermarkSvg
    .replace(new RegExp(baseTheme.accent, 'gi'), customHex)
    .replace(new RegExp(baseTheme.accentDark, 'gi'), accentDark);

  return {
    ...baseTheme,
    accent: customHex,
    accentDark,
    accentLight: `rgba(${accentRgba}, 0.08)`,
    accentRgba,
    coverGradient,
    coverBadgeBg,
    coverBadgeBorder,
    coverBadgeColor,
    coverAccentBar,
    headerBarGradient: `linear-gradient(90deg, ${customHex} 0%, ${accentDark} 80%)`,
    pageFrameBorder: baseTheme.pageFrameBorder === 'none' ? 'none' : `1px solid rgba(${accentRgba}, 0.35)`,
    tocChapterNumBg: customHex,
    tocPageNumColor: accentDark,
    tocPageNumBg: `rgba(${accentRgba}, 0.1)`,
    chapterNumBg: customHex,
    chapterLabelColor: accentDark,
    subheadBorderColor: customHex,
    stepBorderColor: customHex,
    stepBgColor: `rgba(${accentRgba}, 0.08)`,
    featureBorderColor: customHex,
    featureBgColor: `rgba(${accentRgba}, 0.08)`,
    cornerWatermarkSvg,
    centerWatermarkSvg,
    previewAccent: customHex,
  };
}
