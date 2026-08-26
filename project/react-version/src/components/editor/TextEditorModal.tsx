import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  value: string;
  label?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function TextEditorModal({ isOpen, value, label, onSave, onClose }: Props) {
  const [text, setText] = useState(value);
  const [fontFamily, setFontFamily] = useState("'Inter', sans-serif");
  const [textColor, setTextColor] = useState('#1a202c');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value);
  }, [value, isOpen]);

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = value;
      // Place caret at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || text;
    onSave(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const applyBold = () => {
    document.execCommand('bold');
    editorRef.current?.focus();
  };

  const applyColor = (color: string) => {
    setTextColor(color);
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      document.execCommand('foreColor', false, color);
    } else if (editorRef.current) {
      editorRef.current.style.color = color;
    }
    editorRef.current?.focus();
  };

  const applyFont = (font: string) => {
    setFontFamily(font);
    document.execCommand('fontName', false, font);
    editorRef.current?.focus();
  };

  return (
    <div className={`text-editor-overlay ${isOpen ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="text-editor-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(0,210,255,0.15)' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#00d2ff', fontWeight: 700, marginBottom: 2 }}>Text Editor</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{label || 'Edit Text'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        {/* Formatting toolbar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
          <button
            onClick={applyBold}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#e2e8f0', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
            title="Bold"
          >
            B
          </button>

          <button
            onClick={() => {
              document.execCommand('insertUnorderedList');
              editorRef.current?.focus();
            }}
            style={{ background: 'rgba(0,210,255,0.12)', border: '1px solid #00d2ff', borderRadius: 6, color: '#00d2ff', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
            title="Buat Poin Bullet (•)"
          >
            • Bullet List
          </button>

          <select
            value={fontFamily}
            onChange={(e) => applyFont(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#e2e8f0', padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
          >
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Playfair Display', serif">Playfair Display</option>
            <option value="'Georgia', serif">Georgia</option>
            <option value="'Arial', sans-serif">Arial</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#718096' }}>Color</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => applyColor(e.target.value)}
              style={{ width: 28, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none' }}
            />
          </div>
        </div>

        {/* Content editable */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          style={{
            minHeight: 80, maxHeight: 240, overflowY: 'auto',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,210,255,0.2)',
            borderRadius: 8, padding: 12, color: '#e2e8f0', fontSize: 14, lineHeight: 1.7,
            outline: 'none',
          }}
        />

        <div style={{ fontSize: 11, color: '#4a5568' }}>
          Press <strong style={{ color: '#718096' }}>Enter</strong> to save • <strong style={{ color: '#718096' }}>Shift+Enter</strong> for new line • <strong style={{ color: '#718096' }}>Esc</strong> to cancel
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#ff5ec7,#ff80c5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
