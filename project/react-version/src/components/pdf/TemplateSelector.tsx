import React from 'react';
import type { TemplateId } from '../../types/template.types';

interface Props {
  selectedTemplate: TemplateId;
  onSelect: (id: TemplateId) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const TEMPLATES: { id: TemplateId; name: string; description: string; preview: React.ReactNode }[] = [
  {
    id: 'default',
    name: 'Default Accent',
    description: 'Original dark cover style with cyan & pink accents',
    preview: (
      <div style={{ width: '100%', height: 110, background: 'linear-gradient(145deg,#0a0e1a,#091b24)', display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderRadius: 6 }}>
        <div style={{ height: 5, width: '60%', background: 'linear-gradient(90deg,#00d2ff,#00e676)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '80%', background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: 6, width: 50, background: 'rgba(0,210,255,0.4)', borderRadius: 2, marginBottom: 4 }} />
            <div style={{ height: 4, width: 70, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'Modern Clean',
    description: 'Clean white pages with bold purple typography',
    preview: (
      <div style={{ width: '100%', height: 110, background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderRadius: 6 }}>
        <div style={{ height: 6, width: '70%', background: 'rgba(108,99,255,0.6)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '50%', background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ height: 3, width: '80%', background: 'linear-gradient(90deg,#6c63ff,#a78bfa)', borderRadius: 2 }} />
        </div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal Mono',
    description: 'Classic black-and-white print-optimized layout',
    preview: (
      <div style={{ width: '100%', height: 110, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 8, border: '2px solid #000', boxSizing: 'border-box', gap: 4, borderRadius: 6 }}>
        <div style={{ height: 5, width: '70%', background: '#000' }} />
        <div style={{ height: 3, width: '40%', background: '#000' }} />
        <div style={{ height: 2, width: '50%', background: '#555' }} />
      </div>
    ),
  },
  {
    id: 'corporate',
    name: 'Corporate Navy',
    description: 'Formal navy blue with structured header & grid',
    preview: (
      <div style={{ width: '100%', height: 110, background: 'linear-gradient(160deg,#1e3a5f,#051423)', display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderRadius: 6 }}>
        <div style={{ height: 4, width: '30%', background: '#3b82f6', borderRadius: 2 }} />
        <div style={{ height: 6, width: '75%', background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '55%', background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '80%', background: '#3b82f6', borderRadius: 2, marginTop: 4 }} />
      </div>
    ),
  },
  {
    id: 'crimson',
    name: 'Crimson Red',
    description: 'Warm crimson red cover with elegant serif headers',
    preview: (
      <div style={{ width: '100%', height: 110, background: 'linear-gradient(135deg, #1a0505, #7f1d1d)', display: 'flex', flexDirection: 'column', padding: 8, gap: 4, borderRadius: 6 }}>
        <div style={{ height: 4, width: '35%', background: '#ef4444', borderRadius: 2 }} />
        <div style={{ height: 6, width: '70%', background: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '50%', background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
        <div style={{ height: 3, width: '75%', background: '#ef4444', borderRadius: 2, marginTop: 4 }} />
      </div>
    ),
  },
];

export function TemplateSelector({ selectedTemplate, onSelect, onConfirm, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,17,23,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 12000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 640,
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0f1117',
        border: '1px solid rgba(0,210,255,0.3)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(0,210,255,0.15)' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#00d2ff', fontWeight: 700, marginBottom: 2 }}>PDF Export</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Pilih Template PDF</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>×</button>
        </div>

        {/* Template grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => onSelect(tmpl.id)}
                style={{
                  border: `2px solid ${isSelected ? '#00d2ff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0,210,255,0.08)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 16px rgba(0,210,255,0.2)' : 'none',
                }}
              >
                <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', marginBottom: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                  {tmpl.preview}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d2ff', flexShrink: 0 }} />}
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#00d2ff' : '#fff' }}>{tmpl.name}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{tmpl.description}</div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(0,210,255,0.15)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#00d2ff,#00b8d4)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(0,210,255,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF Sekarang →
          </button>
        </div>
      </div>
    </div>
  );
}
