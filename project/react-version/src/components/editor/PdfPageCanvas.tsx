import React, { useState } from 'react';
import type { ManualDocument, ManualPage, ContentBlock, TocItem } from '../../types/manual.types';
import { TextEditorModal } from './TextEditorModal';

interface Props {
  document: ManualDocument;
  activePageId: string | null;
  isViewer?: boolean;
  onSetActivePage: (id: string) => void;
  onUpdateBlock: (pageId: string, idx: number, block: ContentBlock) => void;
  onRemoveBlock: (pageId: string, idx: number) => void;
  onDropBlock: (pageId: string, block: ContentBlock) => void;
  onUpdatePage: (pageId: string, updates: Partial<ManualPage>) => void;
  onUpdateMeta?: (updates: Partial<ManualDocument['meta']>) => void;
  onUpdateToc?: (toc: TocItem[]) => void;
  onDeletePage?: (pageId: string) => void;
  onAddCoverPage?: () => void;
}

// ─── Individual block renderers ─────────────────────────────────────────────

function SectionTitleBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'section-title' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text !== block.text) {
      onUpdateBlock(pageId, idx, { ...block, text });
    }
  };
  return (
    <div className="deletable" style={{ position: 'relative' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      <div className="editable-text section-title" contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>{block.text}</div>
      <div className="section-accent" style={{ background: block.accentColor ? `linear-gradient(90deg,${block.accentColor},${block.accentColor}88)` : undefined }} />
    </div>
  );
}

function ParagraphBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'paragraph' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const handleBlur = (e: React.FocusEvent<HTMLParagraphElement>) => {
    const html = e.currentTarget.innerHTML;
    if (html !== block.html) {
      onUpdateBlock(pageId, idx, { ...block, html });
    }
  };
  return (
    <p className="body-text editable-text deletable" style={{ position: 'relative', color: block.color, fontFamily: block.fontFamily }} contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>
      <span dangerouslySetInnerHTML={{ __html: block.html }} />
      <span className="element-controls" style={{ position: 'absolute', top: 2, right: 2 }} contentEditable={false}>
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </span>
    </p>
  );
}

function SubtitleBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'subtitle' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text !== block.text) {
      onUpdateBlock(pageId, idx, { ...block, text });
    }
  };
  return (
    <div className="body-subtitle editable-text deletable" style={{ position: 'relative' }} contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>
      {block.text}
      <span className="element-controls" contentEditable={false}>
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </span>
    </div>
  );
}

function SubSubtitleBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'sub-subtitle' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text !== block.text) {
      onUpdateBlock(pageId, idx, { ...block, text });
    }
  };
  return (
    <div className="body-sub-subtitle editable-text deletable" style={{ position: 'relative', fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '18px 0 8px 12px', borderBottom: '2px solid #cbd5e1', paddingBottom: 3 }} contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>
      {block.text}
      <span className="element-controls" contentEditable={false}>
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </span>
    </div>
  );
}

function StepItemBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'step' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text !== block.text) {
      onUpdateBlock(pageId, idx, { ...block, text });
    }
  };
  return (
    <li className="step-item deletable" style={{ position: 'relative', borderLeftColor: block.accentColor || '#00d2ff' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      <span className="step-text editable-text" contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>{block.text}</span>
    </li>
  );
}

function DeepSubtitleBlock({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'sub-sub-subtitle' | 'sub-sub-sub-subtitle' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const deepest = block.kind === 'sub-sub-sub-subtitle';
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText.trim();
    if (text !== block.text) {
      onUpdateBlock(pageId, idx, { ...block, text });
    }
  };
  return (
    <div className="editable-text deletable" style={{ position: 'relative', fontSize: deepest ? 12 : 12.5, fontWeight: 700, fontStyle: deepest ? 'italic' : 'normal', color: '#0f172a', margin: deepest ? '14px 0 6px 24px' : '16px 0 7px 18px', borderBottom: deepest ? undefined : '2px solid #cbd5e1', paddingBottom: 3 }} contentEditable={true} suppressContentEditableWarning={true} onBlur={handleBlur}>
      {block.text}
      <span className="element-controls" contentEditable={false}>
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </span>
    </div>
  );
}

function StepsListBlockEl({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'numbered-list' | 'numbered' | 'steps' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const items = block.items || [];
  const updateItem = (i: number, text: string) => {
    if (text === items[i]) return;
    const next = [...items];
    next[i] = text;
    onUpdateBlock(pageId, idx, { ...block, items: next });
  };
  const updateNumber = (i: number, num: string) => {
    const numbers = items.map((_, k) => block.numbers?.[k] || String(k + 1));
    if (num === numbers[i]) return;
    numbers[i] = num;
    onUpdateBlock(pageId, idx, { ...block, numbers });
  };
  if (block.html) {
    return (
      <div className="deletable" style={{ position: 'relative', margin: '10px 0 12px 12px' }}>
        <div className="element-controls">
          <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: 13, lineHeight: 1.7, listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: block.html }} />
      </div>
    );
  }
  return (
    <div className="deletable" style={{ position: 'relative', margin: '10px 0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span className="editable-text step-badge" contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => updateNumber(i, e.currentTarget.innerText.trim())} title="Klik untuk mengedit nomor langkah" style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, outline: 'none', cursor: 'text' }}>
            {block.numbers?.[i] || String(i + 1)}
          </span>
          <span className="editable-text" contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => updateItem(i, e.currentTarget.innerText.trim())} style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, outline: 'none', flex: 1 }}>
            {it}
          </span>
        </div>
      ))}
    </div>
  );
}

function BulletListBlockEl({ block, pageId, idx, onUpdateBlock, onDelete }: { block: ContentBlock & { kind: 'bullet-list' | 'bullet' | 'bullets' }; pageId: string; idx: number; onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void; onDelete: () => void }) {
  const items = block.items || [];
  const updateItem = (i: number, text: string) => {
    if (text === items[i]) return;
    const next = [...items];
    next[i] = text;
    onUpdateBlock(pageId, idx, { ...block, items: next });
  };
  if (block.html) {
    return (
      <div className="deletable" style={{ position: 'relative', margin: '10px 0 12px 12px' }}>
        <div className="element-controls">
          <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.7, listStyleType: 'disc' }} dangerouslySetInnerHTML={{ __html: block.html }} />
      </div>
    );
  }
  return (
    <div className="deletable" style={{ position: 'relative', margin: '10px 0 12px 12px' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.7, listStyleType: 'disc' }}>
        {items.map((it, i) => (
          <li key={i} className="editable-text" contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => updateItem(i, e.currentTarget.innerText.trim())} style={{ marginBottom: 4, outline: 'none' }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageBlockEl({ block, pageId, blockIdx, onUpdateBlock, onDelete }: {
  block: ContentBlock & { kind: 'image' };
  pageId: string;
  blockIdx: number;
  onUpdateBlock: (pageId: string, idx: number, block: ContentBlock) => void;
  onDelete: () => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdateBlock(pageId, blockIdx, { ...block, src: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const paddingMap = { large: '56.25%', medium: '40%', small: '15%', icon: '30px' };

  return (
    <div className={`img-placeholder deletable ${block.src ? 'has-image' : ''}`} style={{ paddingTop: paddingMap[block.size || 'medium'] || '40%', position: 'relative' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      {block.src ? (
        <img src={block.src} alt={block.alt || ''} />
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <div className="ph-label">Click to Upload</div>
            <div className="ph-sub">PNG, JPG, SVG</div>
          </div>
          <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleFileChange} />
        </>
      )}
    </div>
  );
}

function TwoColumnsBlockEl({ block, onDelete }: {
  block: ContentBlock & { kind: 'two-columns' };
  onDelete: () => void;
}) {
  return (
    <div className="two-columns-layout deletable" style={{ padding: 10, position: 'relative' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      <div className="col" style={{ padding: 10 }}>
        {block.left.map((b, i) => (
          <p key={i} className="body-text" style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: b.kind === 'paragraph' ? b.html : (b as any).text || '' }} />
        ))}
        <div style={{ position: 'absolute', bottom: 4, left: '25%', transform: 'translateX(-50%)', fontSize: 9, color: '#718096', pointerEvents: 'none' }}>LEFT COL</div>
      </div>
      <div className="col" style={{ padding: 10 }}>
        {block.right.map((b, i) => (
          <p key={i} className="body-text" style={{ fontSize: 13 }} dangerouslySetInnerHTML={{ __html: b.kind === 'paragraph' ? b.html : (b as any).text || '' }} />
        ))}
        <div style={{ position: 'absolute', bottom: 4, right: '25%', transform: 'translateX(50%)', fontSize: 9, color: '#718096', pointerEvents: 'none' }}>RIGHT COL</div>
      </div>
    </div>
  );
}

function TableBlockEl({ block, pageId, idx, onUpdateBlock, onDelete }: {
  block: ContentBlock & { kind: 'table' };
  pageId: string;
  idx: number;
  onUpdateBlock: (pId: string, i: number, b: ContentBlock) => void;
  onDelete: () => void;
}) {
  const handleTitleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    onUpdateBlock(pageId, idx, { ...block, title: e.currentTarget.innerText });
  };

  const handleHeaderBlur = (cellIdx: number, val: string) => {
    const newHeaders = [...(block.headers || [])];
    newHeaders[cellIdx] = val;
    onUpdateBlock(pageId, idx, { ...block, headers: newHeaders });
  };

  const handleCellBlur = (rIdx: number, cIdx: number, val: string) => {
    const newRows = (block.rows || []).map((r, ri) => {
      if (ri !== rIdx) return r;
      const copy = [...r];
      copy[cIdx] = val;
      return copy;
    });
    onUpdateBlock(pageId, idx, { ...block, rows: newRows });
  };

  const handleDeleteRow = (rIdx: number) => {
    const newRows = (block.rows || []).filter((_, ri) => ri !== rIdx);
    onUpdateBlock(pageId, idx, { ...block, rows: newRows });
  };

  const handleAddRow = () => {
    const numCols = block.headers?.length || (block.rows?.[0]?.length || 3);
    const newRow = Array(numCols).fill('Teks baru');
    onUpdateBlock(pageId, idx, { ...block, rows: [...(block.rows || []), newRow] });
  };

  return (
    <div className="deletable table-frame" style={{ position: 'relative', margin: '10px 0' }}>
      <div className="element-controls">
        <button className="ctrl-btn del-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>×</button>
      </div>
      {block.title !== undefined && (
        <div
          className="table-title editable-text"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onBlur={handleTitleBlur}
          style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}
        >
          {block.title}
        </div>
      )}
      <div className="document-table-container" style={{ width: '100%', overflowX: 'auto', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        <table className="document-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
          {block.headers && block.headers.length > 0 && (
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="editable-text"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => handleHeaderBlur(i, e.currentTarget.innerText)}
                    style={{ padding: '7px 10px', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1', textAlign: 'left', wordBreak: 'break-word' }}
                  >
                    {h}
                  </th>
                ))}
                <th style={{ padding: '7px 4px', width: '32px', textAlign: 'center' }} data-editor-ui="true"></th>
              </tr>
            </thead>
          )}
          {block.rows && block.rows.length > 0 && (
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="editable-text"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleCellBlur(rIdx, cIdx, e.currentTarget.innerText)}
                      style={{ padding: '6px 10px', color: '#334155', border: '1px solid #e2e8f0', verticalAlign: 'top', wordBreak: 'break-word' }}
                    >
                      {cell}
                    </td>
                  ))}
                  <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'top', width: '32px' }} data-editor-ui="true">
                    <button
                      className="btn-delete-doc-table-row"
                      data-editor-ui="true"
                      title="Hapus baris ini"
                      onClick={(e) => { e.stopPropagation(); handleDeleteRow(rIdx); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', opacity: 0.6 }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
        <div style={{ marginTop: '6px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }} data-editor-ui="true">
          <button
            className="btn-add-doc-table-row"
            data-editor-ui="true"
            onClick={handleAddRow}
            style={{ background: '#f0f9ff', border: '1px dashed #0284c7', color: '#0284c7', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
          >
            ➕ Tambah Baris
          </button>
        </div>
      </div>
    </div>
  );
}

function renderBlock(
  block: ContentBlock,
  idx: number,
  pageId: string,
  _onEdit: (pageId: string, idx: number, block: ContentBlock) => void,
  onDelete: (pageId: string, idx: number) => void,
  onUpdateBlock: (pageId: string, idx: number, block: ContentBlock) => void,
): React.ReactNode {
  const del = () => onDelete(pageId, idx);

  switch (block.kind) {
    case 'section-title':
      return <SectionTitleBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'paragraph':
      return <ParagraphBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'subtitle':
      return <SubtitleBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'sub-subtitle':
      return <SubSubtitleBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'sub-sub-subtitle':
    case 'sub-sub-sub-subtitle':
      return <DeepSubtitleBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'numbered-list':
    case 'numbered':
    case 'steps':
      return <StepsListBlockEl key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'bullet-list':
    case 'bullet':
    case 'bullets':
      return <BulletListBlockEl key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'step':
      return <StepItemBlock key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'image':
      return <ImageBlockEl key={idx} block={block} pageId={pageId} blockIdx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'table':
      return <TableBlockEl key={idx} block={block} pageId={pageId} idx={idx} onUpdateBlock={onUpdateBlock} onDelete={del} />;
    case 'two-columns':
      return <TwoColumnsBlockEl key={idx} block={block} onDelete={del} />;
    default:
      return null;
  }
}

// ─── Cover Page ─────────────────────────────────────────────────────────────

function CoverPage({
  doc,
  pageId,
  onEdit,
  onUpdateMeta,
  onDeletePage,
}: {
  doc: ManualDocument;
  pageId: string;
  onEdit: (key: string, val: string) => void;
  onUpdateMeta?: (updates: Partial<ManualDocument['meta']>) => void;
  onDeletePage?: (pageId: string) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateMeta) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        onUpdateMeta({ coverImage: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const coverFit = doc.meta.coverImageFit || 'contain';

  const handleToggleFit = () => {
    if (!onUpdateMeta) return;
    const nextFit: 'contain' | 'cover' | 'fill' =
      coverFit === 'contain' ? 'cover' : coverFit === 'cover' ? 'fill' : 'contain';
    onUpdateMeta({ coverImageFit: nextFit });
  };

  const actionControls = (
    <div data-editor-ui="true" style={{
      position: 'absolute',
      top: 14,
      right: 14,
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
        🖼️ {doc.meta.coverImage ? 'Ganti Cover Image' : 'Upload Cover'}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </label>

      {doc.meta.coverImage && onUpdateMeta && (
        <button
          onClick={handleToggleFit}
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
          {coverFit === 'contain' ? '🔍 Mode: Utuh' : coverFit === 'cover' ? '📐 Mode: Crop' : '↔️ Mode: Stretch'}
        </button>
      )}

      {doc.meta.coverImage && onUpdateMeta && (
        <button
          onClick={() => onUpdateMeta({ coverImage: undefined })}
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
          title="Kembalikan ke format cover teks standar"
        >
          🔄 Reset ke Cover Standar
        </button>
      )}

      {onDeletePage && (
        <button
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin menghapus halaman cover ini?')) {
              onDeletePage(pageId);
            }
          }}
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
  );

  if (doc.meta.coverImage) {
    return (
      <div className="page page-cover" style={{ width: 794, height: 1123, padding: 0, position: 'relative', overflow: 'hidden', borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {actionControls}
        <img src={doc.meta.coverImage} alt="Full Cover Image" style={{ width: '100%', height: '100%', objectFit: coverFit, display: 'block' }} />
      </div>
    );
  }

  const bgStyle = doc.meta.coverGradient || `linear-gradient(145deg,${doc.meta.coverColor || '#0a0e1a'} 0%,#091b24 100%)`;

  return (
    <div className="page page-cover" style={{ background: bgStyle, position: 'relative' }}>
      {actionControls}
      {doc.meta.coverGlowEnabled && (
        <>
          <div className="cover-glow-ring cover-ring-1" style={{ '--cover-ring-color-1': `${doc.meta.coverGlowColor || '#00d2ff'}40` } as any} />
          <div className="cover-glow-ring cover-ring-2" style={{ '--cover-ring-color-2': `${doc.meta.coverGlowColor || '#00d2ff'}40` } as any} />
        </>
      )}
      <div><span className="cover-badge editable-text" onClick={() => onEdit('badge', 'Manual Book')}>Manual Book</span></div>
      <div className="cover-main">
        <div className="cover-eyebrow editable-text" onClick={() => onEdit('company', doc.meta.company || '')}>{doc.meta.company || 'Company Name'}</div>
        <div className="cover-title editable-text" onClick={() => onEdit('title', doc.meta.title)}>{doc.meta.title}</div>
        {doc.meta.subtitle && <div className="cover-sub editable-text" onClick={() => onEdit('subtitle', doc.meta.subtitle || '')}>{doc.meta.subtitle}</div>}
        <div className="cover-divider" />
      </div>
      <div className="cover-footer">
        <div className="cover-logo-text editable-text" onClick={() => onEdit('company', doc.meta.company || '')}>{doc.meta.company || ''}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', letterSpacing: 1 }}>01</div>
      </div>
    </div>
  );
}

// ─── TOC Page ───────────────────────────────────────────────────────────────

function TocPage({ doc, onUpdateToc }: { doc: ManualDocument; onUpdateToc?: (toc: TocItem[]) => void }) {
  const handleItemChange = (id: string, key: keyof TocItem, val: string) => {
    if (!onUpdateToc) return;
    const updated = doc.toc.map(item => item.id === id ? { ...item, [key]: val } : item);
    onUpdateToc(updated);
  };

  return (
    <div className="page page-toc">
      <div className="toc-header">
        <div className="section-label">Navigation</div>
        <div className="toc-title">Table of Contents</div>
        <div className="toc-divider" />
      </div>
      <ul className="toc-list">
        {doc.toc.map((item) => (
          <li key={item.id} className={`toc-item ${item.style || ''}`} style={{ marginLeft: ((item.level || 1) - 1) * 18, fontSize: (item.level || 1) > 1 ? 12 : undefined }}>
            <div
              className="toc-num editable-text"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleItemChange(item.id, 'number', e.currentTarget.innerText.trim())}
              style={{ cursor: 'text' }}
            >
              {item.number}
            </div>
            <div
              className="toc-name editable-text"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleItemChange(item.id, 'title', e.currentTarget.innerText.trim())}
              style={{ cursor: 'text' }}
            >
              {item.title}
            </div>
            <div className="toc-dot" style={{ flex: 1, minWidth: 12 }} />
            <div
              className="toc-page editable-text"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleItemChange(item.id, 'pageNumber', e.currentTarget.innerText.trim())}
              style={{ cursor: 'text' }}
            >
              {item.pageNumber}
            </div>
          </li>
        ))}
      </ul>
      <div className="page-footer">
        <div className="footer-brand">{doc.meta.footerBrand || doc.meta.company}</div>
        <div className="footer-page">02</div>
      </div>
    </div>
  );
}

// ─── Content Page ────────────────────────────────────────────────────────────

function ContentPage({ page, isActive, onActivate, onEdit, onDelete, onUpdateBlock, onDropBlock, onUpdatePage }: {
  page: ManualPage; isActive: boolean;
  onActivate: () => void;
  onEdit: (pageId: string, idx: number, block: ContentBlock) => void;
  onDelete: (pageId: string, idx: number) => void;
  onUpdateBlock: (pageId: string, idx: number, block: ContentBlock) => void;
  onDropBlock: (pageId: string, block: ContentBlock) => void;
  onUpdatePage: (pageId: string, updates: Partial<ManualPage>) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json')) as ContentBlock;
      onDropBlock(page.id, data);
    } catch {}
  };

  return (
    <div
      id={`page-${page.id}`}
      className={`page page-content grid-page`}
      style={{ outline: isActive ? '2px solid rgba(0,210,255,0.5)' : 'none', outlineOffset: 4 }}
      onClick={onActivate}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(() => {
        const rawNum = (page.chapterNumber || '1').replace(/\D/g, '') || '1';
        const displayNum = `${rawNum}.`;
        const cleanName = (page.chapterName || '').replace(/^(bab\s*\d+|\d+)[\.\:\-]?\s*/gi, '').replace(/^[\.\:\-\,\;\s\•\-\*\)]+/, '').trim();
        const displayName = cleanName || `Chapter ${rawNum}`;

        const handleNumBlur = (e: React.FocusEvent<HTMLDivElement>) => {
          let val = e.currentTarget.innerText.trim();
          if (val.endsWith('.')) {
            val = val.slice(0, -1);
          }
          if (val !== page.chapterNumber) {
            onUpdatePage(page.id, { chapterNumber: val });
          }
        };

        const handleLabelBlur = (e: React.FocusEvent<HTMLDivElement>) => {
          const val = e.currentTarget.innerText.trim();
          if (val !== page.chapterLabel) {
            onUpdatePage(page.id, { chapterLabel: val });
          }
        };

        const handleNameBlur = (e: React.FocusEvent<HTMLDivElement>) => {
          const val = e.currentTarget.innerText.trim();
          if (val !== page.chapterName) {
            onUpdatePage(page.id, { chapterName: val });
          }
        };

        return (
          <div className="page-header">
            <div className="page-header-left">
              <div
                className="chapter-num"
                contentEditable={true}
                suppressContentEditableWarning={true}
                onBlur={handleNumBlur}
                style={{ cursor: 'text' }}
              >
                {displayNum}
              </div>
              <div>
                <div
                  className="chapter-label"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={handleLabelBlur}
                  style={{ cursor: 'text', minWidth: 50 }}
                >
                  {page.chapterLabel || 'Chapter'}
                </div>
                <div
                  className="chapter-name"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={handleNameBlur}
                  style={{ cursor: 'text', minWidth: 100 }}
                >
                  {displayName || 'Untitled Chapter'}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {page.blocks.map((block, i) => renderBlock(block, i, page.id, onEdit, onDelete, onUpdateBlock))}

      {page.blocks.length === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4, padding: 40 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <div style={{ fontSize: 12, color: '#718096' }}>Drop components here or use the sidebar</div>
        </div>
      )}

      <div className="page-footer">
        <div className="footer-brand">{page.footerBrand || ''}</div>
        <div className="footer-page">{page.footerPage || ''}</div>
      </div>
    </div>
  );
}

// ─── Main Canvas ─────────────────────────────────────────────────────────────

export function PdfPageCanvas({
  document,
  activePageId,
  isViewer,
  onSetActivePage,
  onUpdateBlock,
  onRemoveBlock,
  onDropBlock,
  onUpdatePage,
  onUpdateMeta,
  onUpdateToc,
  onDeletePage,
  onAddCoverPage,
}: Props) {
  const [editState, setEditState] = useState<{
    show: boolean;
    pageId: string;
    blockIdx: number;
    block: ContentBlock;
  } | null>(null);

  const hasCoverPage = document.pages.some((p) => p.type === 'cover');

  const handleEdit = (pageId: string, idx: number, block: ContentBlock) => {
    if (isViewer) return;
    setEditState({ show: true, pageId, blockIdx: idx, block });
  };

  const handleSaveEdit = (newContent: string) => {
    if (!editState || isViewer) return;
    const { pageId, blockIdx, block } = editState;

    let updated: ContentBlock;
    switch (block.kind) {
      case 'paragraph': updated = { ...block, html: newContent }; break;
      case 'section-title': updated = { ...block, text: newContent }; break;
      case 'subtitle': updated = { ...block, text: newContent }; break;
      case 'sub-subtitle': updated = { ...block, text: newContent }; break;
      case 'step': updated = { ...block, text: newContent }; break;
      default: updated = block;
    }

    onUpdateBlock(pageId, blockIdx, updated);
    setEditState(null);
  };

  const getEditText = (block: ContentBlock): string => {
    switch (block.kind) {
      case 'paragraph': return block.html;
      case 'section-title': return block.text;
      case 'subtitle': return block.text;
      case 'sub-subtitle': return block.text;
      case 'step': return block.text;
      default: return '';
    }
  };

  return (
    <>
      {!isViewer && !hasCoverPage && onAddCoverPage && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={onAddCoverPage}
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

      <div className="pdf-pages">
        {document.pages.map((page) => {
          if (page.type === 'cover') {
            return (
              <CoverPage
                key={page.id}
                pageId={page.id}
                doc={document}
                onEdit={() => {}}
                onUpdateMeta={isViewer ? undefined : onUpdateMeta}
                onDeletePage={isViewer ? undefined : onDeletePage}
              />
            );
          }
          if (page.type === 'toc') {
            return <TocPage key={page.id} doc={document} onUpdateToc={isViewer ? undefined : onUpdateToc} />;
          }
          return (
            <ContentPage
              key={page.id}
              page={page}
              isActive={activePageId === page.id}
              onActivate={() => onSetActivePage(page.id)}
              onEdit={isViewer ? () => {} : handleEdit}
              onDelete={isViewer ? () => {} : onRemoveBlock}
              onUpdateBlock={isViewer ? () => {} : onUpdateBlock}
              onDropBlock={isViewer ? () => {} : onDropBlock}
              onUpdatePage={isViewer ? () => {} : onUpdatePage}
            />
          );
        })}
      </div>

      {/* Block Text Editor */}
      {editState && (
        <TextEditorModal
          isOpen={editState.show}
          value={getEditText(editState.block)}
          onSave={handleSaveEdit}
          onClose={() => setEditState(null)}
          label={editState.block.kind}
        />
      )}
    </>
  );
}
