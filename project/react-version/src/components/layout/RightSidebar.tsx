import React, { useState } from 'react';
import type { ContentBlock } from '../../types/manual.types';
import { ParserService, type AiGenerateResult } from '../../services/ParserService';
import { StatusModal, type StatusModalState } from '../ui/StatusModal';
import type { ColorThemeId } from '../../utils/colorThemes';
import { getAllColorThemes, getCustomColorTheme, DEFAULT_COLOR_THEME } from '../../utils/colorThemes';
import { CustomColorPickerModal } from '../common/CustomColorPickerModal';
import { useAuth } from '../../context/AuthContext';

interface DraggableItem {
  label: string;
  icon: React.ReactNode;
  block: ContentBlock;
  description?: string;
}

const COMPONENT_ITEMS: DraggableItem[] = [
  {
    label: 'Judul Utama (Heading 1)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>,
    block: { kind: 'section-title', text: '', accentColor: '#00d2ff' },
    description: 'Heading dengan aksen bar',
  },
  {
    label: 'Paragraph',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>,
    block: { kind: 'paragraph', html: '' },
    description: 'Teks paragraf',
  },
  {
    label: 'Sub-Bab (Heading 2)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
    block: { kind: 'subtitle', text: '' },
    description: 'Sub-chapter heading (H2)',
  },
  {
    label: 'Sub-Sub-Bab (Heading 3)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="12" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>,
    block: { kind: 'sub-subtitle', text: '' },
    description: 'Sub-sub-chapter heading (H3)',
  },
  {
    label: 'Sub-Sub-Sub-Bab (Heading 4)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="18" x2="12" y2="18"/></svg>,
    block: { kind: 'sub-sub-subtitle', text: '' },
    description: 'Sub-sub-sub-chapter heading (H4)',
  },
  {
    label: 'Sub-Sub-Sub-Sub-Bab (Heading 5)',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="8" y2="12"/><line x1="3" y1="18" x2="10" y2="18"/></svg>,
    block: { kind: 'sub-sub-sub-subtitle', text: '' },
    description: 'Sub-sub-sub-sub-chapter heading (H5)',
  },
  {
    label: 'Step Item',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    block: { kind: 'step', text: '' },
    description: 'Langkah terstruktur',
  },
  {
    label: 'Bullet Points',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
    block: { kind: 'bullet-list' },
    description: 'Daftar poin',
  },
  {
    label: 'Image',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    block: { kind: 'image' },
    description: 'Upload gambar',
  },
  {
    label: 'Two Columns',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>,
    block: { kind: 'two-columns', left: [{ kind: 'paragraph', html: '' }], right: [{ kind: 'paragraph', html: '' }] },
    description: 'Tata letak 2 kolom',
  },
];

interface Props {
  isOpen: boolean;
  isViewer?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onAddBlock: (block: ContentBlock, pageId: string) => void;
  activePageId: string | null;
  onAiDocumentLoaded?: (res: AiGenerateResult) => void;
  projectId?: string;
  onRegenerateToc?: () => void;
  onAutoSplitToc?: () => void;
  onReflow?: () => void;
  colorTheme?: ColorThemeId;
  onChangeColorTheme?: (theme: ColorThemeId) => void;
  customAccentColor?: string;
  onChangeCustomAccentColor?: (hex: string | undefined) => void;
}

export function RightSidebar({
  isOpen, isViewer, onOpen, onAddBlock, activePageId,
  onAiDocumentLoaded, projectId, onRegenerateToc, onAutoSplitToc, onReflow,
  colorTheme = DEFAULT_COLOR_THEME, onChangeColorTheme, customAccentColor, onChangeCustomAccentColor,
}: Props) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('Pilih file Word (.docx), lalu klik Generate via AI.');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [modalState, setModalState] = useState<StatusModalState>({ isOpen: false, type: 'loading', title: '', message: '' });

  const themes = getAllColorThemes();

  const handleDragStart = (e: React.DragEvent, block: ContentBlock) => {
    e.dataTransfer.setData('application/json', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAiStatus(`File siap: ${file.name}`);
    }
  };

  const handleDownloadWordInstruction = () => {
    const link = document.createElement('a');
    link.href = '/api/download-word-instruction';
    link.download = 'Panduan_Visual_Format_ManualBook.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartAi = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setModalState({ isOpen: true, type: 'loading', title: 'Memproses Dokumen via AI...' });
    try {
      const res = await ParserService.parseDocxViaAi(selectedFile, user?.email, (msg) => setAiStatus(msg), projectId);
      setAiStatus('Selesai! Berhasil di-generate');
      const sectionCount = res.sections ? res.sections.length : 0;
      if (onAiDocumentLoaded) onAiDocumentLoaded(res);
      setModalState({
        isOpen: true, type: 'success',
        title: 'Manual Book Berhasil Di-Generate',
        message: `Dokumen "${res.docTitle || selectedFile.name}" berhasil diproses (${sectionCount} bab).`,
        onConfirmSuccess: () => setModalState((prev) => ({ ...prev, isOpen: false })),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI Backend Error';
      setAiStatus(`Error: ${msg}`);
      setModalState({
        isOpen: true, type: 'error', title: 'Gagal Memproses AI',
        message: `Terjadi kesalahan: ${msg}`,
        onClose: () => setModalState((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <StatusModal {...modalState} />

      {/* Floating Right-Edge Tab Button (Visible when sidebar is closed) */}
      {!isOpen && onOpen && (
        <button
          onClick={onOpen}
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 997,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 7px 14px 9px',
            borderRadius: '8px 0 0 8px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            borderRight: 'none',
            color: '#00d2ff',
            cursor: 'pointer',
            boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.15s ease',
          }}
          title="Buka Panel Komponen & Alat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      <div className={`components-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="components-header" style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', letterSpacing: '1px', textTransform: 'uppercase' }}>KOMPONEN</span>
        </div>

        <div className="components-body" style={{ padding: 14 }}>
          {isViewer ? (
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px', padding: '18px 14px', textAlign: 'center', color: '#94a3b8',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>Mode Viewer (Read-Only)</div>
              <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>Editing dan penambahan komponen tidak tersedia.</div>
            </div>
          ) : (
            <>
              {/* TEMPLATE & COLOR CARD */}
              {(onChangeColorTheme || onChangeCustomAccentColor) && (
                <div style={{
                  marginBottom: 14, padding: 12,
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {onChangeColorTheme && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 5 }}>Template</div>
                        <div style={{ position: 'relative' }}>
                          <select
                            value={colorTheme || DEFAULT_COLOR_THEME}
                            onChange={(e) => onChangeColorTheme(e.target.value as ColorThemeId)}
                            style={{
                              appearance: 'none', background: '#0f1117',
                              border: '1px solid rgba(255, 255, 255, 0.12)', color: '#f8fafc',
                              fontSize: '11.5px', fontWeight: 600, padding: '7px 24px 7px 9px',
                              borderRadius: '6px', cursor: 'pointer', width: '100%', outline: 'none',
                            }}
                          >
                            {themes.map((t) => (
                              <option key={t.id} value={t.id} style={{ background: '#0f1117', color: '#f8fafc' }}>{t.name}</option>
                            ))}
                          </select>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {onChangeCustomAccentColor && (
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 5 }}>Color</div>
                        <button
                          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 8px', borderRadius: '6px',
                            background: '#0f1117',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: customAccentColor || getCustomColorTheme(colorTheme).accent,
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            flexShrink: 0,
                          }} />
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WORD INSTRUCTION DOWNLOAD BUTTON */}
              <button
                onClick={handleDownloadWordInstruction}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
                  width: '100%', border: '1px solid rgba(56, 189, 248, 0.25)', padding: 8, borderRadius: 6,
                  fontWeight: 600, fontSize: 11.5, cursor: 'pointer',
                  marginBottom: 14, transition: 'all 0.15s',
                }}
                title="Download panduan visual cara menyusun file Word (.docx)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Word Instruction</span>
              </button>

              {/* AI GENERATED MODE CARD */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: 12,
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#818cf8' }}>
                      AI GENERATED MODE
                    </span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 6px', borderRadius: 4 }}>
                    OLLAMA
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                  Upload file Word (.docx). Teks & gambar disusun otomatis via AI.
                </div>

                <label style={{
                  background: 'rgba(255, 255, 255, 0.03)', color: '#cbd5e1',
                  border: '1px dashed rgba(255, 255, 255, 0.15)', cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
                  padding: 8, borderRadius: 6, fontSize: 11.5, fontWeight: 500,
                  transition: 'all 0.15s',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                    {selectedFile ? selectedFile.name : 'Pilih File Word (.docx)'}
                  </span>
                  <input type="file" accept=".docx" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={handleStartAi}
                  disabled={!selectedFile || isGenerating}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'rgba(99, 102, 241, 0.15)', color: selectedFile && !isGenerating ? '#a5b4fc' : '#475569',
                    width: '100%', border: '1px solid rgba(99, 102, 241, 0.3)', padding: 8, borderRadius: 6,
                    fontWeight: 600, fontSize: 11.5,
                    cursor: selectedFile && !isGenerating ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <span>{isGenerating ? 'Processing...' : 'Generate via Ollama AI'}</span>
                </button>

                <div style={{ fontSize: 10, lineHeight: 1.4, color: '#64748b' }}>{aiStatus}</div>
              </div>

              {/* DOCUMENT ACTIONS & TOOLS CARD */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, padding: 12,
                background: 'rgba(15, 23, 42, 0.6)', borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#38bdf8' }}>
                    AKSI & ALAT DOKUMEN
                  </span>
                </div>

                {onRegenerateToc && (
                  <button
                    onClick={onRegenerateToc}
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399',
                      padding: '7px 10px', borderRadius: 6,
                      fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                    title="Pindai ulang seluruh halaman dan perbarui Daftar Isi"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9"/><polyline points="3 12 3 16 7 16"/><path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 9-9"/><polyline points="21 12 21 8 17 8"/></svg>
                    <span>Sync / Regenerate Daftar Isi</span>
                  </button>
                )}

                {onAutoSplitToc && (
                  <button
                    onClick={onAutoSplitToc}
                    style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.25)', color: '#fbbf24',
                      padding: '7px 10px', borderRadius: 6,
                      fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                    title="Pecah Daftar Isi jika terlalu panjang"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                    <span>Pecah / Rapikan Daftar Isi</span>
                  </button>
                )}

                {onReflow && (
                  <button
                    onClick={onReflow}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8',
                      padding: '7px 10px', borderRadius: 6,
                      fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/><path d="M5 8h7"/><path d="M5 12h7"/><path d="M5 16h7"/></svg>
                    <span>Padatkan Halaman (Auto Reflow)</span>
                  </button>
                )}
              </div>

              {/* COMPONENT DRAG LIST */}
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, paddingLeft: 2 }}>
                Drag to add • Click to append
              </div>

              {COMPONENT_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="component-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.block)}
                  onClick={() => onAddBlock(item.block, activePageId || 'page-1')}
                  title={item.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 6, cursor: 'grab', marginBottom: 5,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <div style={{ flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: '#e2e8f0' }}>{item.label}</div>
                    {item.description && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="components-footer">
          {!activePageId && (
            <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>
              Scroll to / click a page to set it active
            </div>
          )}
        </div>
      </div>

      {onChangeCustomAccentColor && (
        <CustomColorPickerModal
          isOpen={isColorPickerOpen}
          onClose={() => setIsColorPickerOpen(false)}
          currentTheme={getCustomColorTheme(colorTheme, customAccentColor)}
          customColor={customAccentColor}
          onChangeColor={onChangeCustomAccentColor}
        />
      )}
    </>
  );
}
