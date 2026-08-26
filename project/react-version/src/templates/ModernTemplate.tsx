import React from 'react';
import type { ManualDocument, ContentBlock } from '../types/manual.types';

interface Props { doc: ManualDocument; }

function renderBlock(block: ContentBlock, idx: number): React.ReactNode {
  switch (block.kind) {
    case 'section-title':
      return (
        <div key={idx} style={{ marginBottom: 20, marginTop: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', letterSpacing: -0.5 }}>{block.text}</div>
          <div style={{ width: 32, height: 4, background: '#6c63ff', borderRadius: 2, marginTop: 8 }} />
        </div>
      );
    case 'paragraph':
      return <p key={idx} style={{ fontSize: 14, lineHeight: 1.75, color: '#374151', marginBottom: 14, textAlign: 'justify', textJustify: 'inter-word', wordBreak: 'normal', overflowWrap: 'break-word', textIndent: 0 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'subtitle':
      return <div key={idx} style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '20px 0 10px' }}>{block.text}</div>;
    case 'sub-subtitle':
      return <div key={idx} style={{ fontSize: 13.5, fontWeight: 600, color: '#4b5563', margin: '14px 0 8px 12px', borderBottom: '1px dashed #a78bfa', paddingBottom: 3 }}>{block.text}</div>;
    case 'step':
      return (
        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 14px', background: '#f5f3ff', borderRadius: 8, borderLeft: '4px solid #6c63ff', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.6 }}>{block.text}</span>
        </li>
      );
    case 'image':
      return (
        <div key={idx} style={{ width: '100%', margin: '16px 0', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb', paddingTop: block.size === 'large' ? '56.25%' : '40%', position: 'relative', overflow: 'hidden' }}>
          {block.src && <img src={block.src} alt={block.alt || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      );
    case 'table':
      return (
        <div key={idx} style={{ margin: '16px 0' }}>
          {block.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>{block.title}</div>}
          <div style={{ width: '100%', overflowX: 'auto', borderRadius: 6, border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              {block.headers && block.headers.length > 0 && (
                <thead>
                  <tr>
                    {block.headers.map((h, i) => (
                      <th key={i} style={{ padding: '7px 10px', background: '#f5f3ff', color: '#1a1a2e', fontWeight: 700, border: '1px solid #e5e7eb', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              {block.rows && block.rows.length > 0 && (
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? '#f9fafb' : '#ffffff' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '6px 10px', color: '#374151', border: '1px solid #f3f4f6', verticalAlign: 'top' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      );
    case 'bullet-list':
    case 'bullet':
    case 'bullets': {
      const bAny = block as any;
      if (bAny.html) {
        return (
          <div key={idx} style={{ margin: '10px 0 12px 16px' }}>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 13.5, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
          </div>
        );
      }
      const items: string[] = bAny.items || [];
      return (
        <ul key={idx} style={{ margin: '10px 0 12px 16px', paddingLeft: 18, color: '#374151', fontSize: 13.5, lineHeight: 1.7 }}>
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      );
    }
    case 'numbered-list':
    case 'numbered':
    case 'steps': {
      const bAny = block as any;
      if (bAny.html) {
        return (
          <div key={idx} style={{ margin: '10px 0 12px 16px' }}>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 13.5, lineHeight: 1.7, listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
          </div>
        );
      }
      const items: string[] = bAny.items || [];
      const numbers: string[] = bAny.numbers || [];
      return (
        <div key={idx} style={{ margin: '10px 0 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{numbers[i] || String(i + 1)}</span>
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, flex: 1 }}>{item}</span>
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

function renderBlocksWithGrouping(blocks: ContentBlock[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < blocks.length) {
    if (blocks[i].kind === 'step') {
      const stepGroup: ContentBlock[] = [];
      const startIdx = i;
      while (i < blocks.length && blocks[i].kind === 'step') {
        stepGroup.push(blocks[i]);
        i++;
      }
      result.push(
        <ol key={`step-group-${startIdx}`} style={{ listStyle: 'none', margin: '10px 0 12px 0', padding: 0 }}>
          {stepGroup.map((step, sIdx) => (
            <li key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 14px', background: '#f5f3ff', borderRadius: 8, borderLeft: '4px solid #6c63ff', marginBottom: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{sIdx + 1}</span>
              <span style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.6 }}>{(step as any).text}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      result.push(renderBlock(blocks[i], i));
      i++;
    }
  }
  return result;
}

export function ModernTemplate({ doc }: Props): React.ReactElement {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Cover */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', color: '#fff', display: 'flex', flexDirection: 'column', padding: '60px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 300, height: 300, right: -60, top: -60, borderRadius: '50%', background: 'rgba(108,99,255,0.15)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, left: -40, bottom: 100, borderRadius: '50%', background: 'rgba(108,99,255,0.1)', filter: 'blur(30px)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#6c63ff', fontWeight: 600 }}>TECHNICAL DOCUMENTATION</div>
          <div style={{ marginTop: 'auto', marginBottom: 40, textAlign: 'left' }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{doc.meta.company}</div>
            <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: '#fff', marginBottom: 24, borderLeft: '4px solid #6c63ff', paddingLeft: 16 }}>{doc.meta.title}</div>
            {doc.meta.subtitle && <div style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, paddingLeft: 20 }}>{doc.meta.subtitle}</div>}
            <div style={{ width: 80, height: 4, background: 'linear-gradient(90deg,#6c63ff,#a78bfa)', marginTop: 24, borderRadius: 2, marginLeft: 20 }} />
          </div>
          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>{doc.meta.company}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Page 01</div>
          </div>
        </div>
      </div>

      {/* TOC */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: '60px 64px', position: 'relative' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: '#6c63ff', marginBottom: 8, fontWeight: 700 }}>CONTENTS</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#1a1a2e', letterSpacing: -1 }}>Table of Contents</div>
          <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg,#6c63ff,#a78bfa)', marginTop: 16, borderRadius: 2 }} />
        </div>
        {doc.toc.map((item, i) => (
          <div key={item.id} style={{ marginLeft: ((item.level || 1) - 1) * 18, display: 'flex', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: i % 2 === 0 ? '#6c63ff' : '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.number}</div>
            <div style={{ flex: 1, marginLeft: 16, fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>{item.title}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6c63ff' }}>p.{item.pageNumber}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 32, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>{doc.meta.footerBrand}</div>
          <div style={{ fontSize: 9, color: '#9ca3af' }}>02</div>
        </div>
      </div>

      {/* Content pages */}
      {doc.pages.filter(p => p.type === 'content').map((page) => (
        <div key={page.id} className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: '60px 64px', position: 'relative' }}>
          {(() => {
            const rawNum = (page.chapterNumber || '1').trim();
            const displayNum = rawNum ? (rawNum.endsWith('.') ? rawNum : `${rawNum}.`) : '1.';
            const displayName = (page.chapterName || '').replace(/^[A-Za-z0-9]+[\.\:\-]\s*/, '').trim() || page.chapterName || '';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, paddingBottom: 20, borderBottom: '2px solid #f3f4f6' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>{displayNum}</div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6c63ff', fontWeight: 700 }}>{page.chapterLabel}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{displayName}</div>
                </div>
              </div>
            );
          })()}
          {renderBlocksWithGrouping(page.blocks)}
          <div style={{ position: 'absolute', bottom: 32, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase' }}>{page.footerBrand}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{page.footerPage}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
