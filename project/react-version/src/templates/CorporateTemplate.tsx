import React from 'react';
import type { ManualDocument, ContentBlock } from '../types/manual.types';

interface Props { doc: ManualDocument; }

function renderBlock(block: ContentBlock, idx: number): React.ReactNode {
  switch (block.kind) {
    case 'section-title':
      return <div key={idx} style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 8, marginTop: 24, paddingLeft: 12, borderLeft: '4px solid #1e3a5f' }}>{block.text}</div>;
    case 'paragraph':
      return <p key={idx} style={{ fontSize: 13, lineHeight: 1.8, color: '#374151', marginBottom: 12, textAlign: 'justify', textJustify: 'inter-word', wordBreak: 'normal', overflowWrap: 'break-word', textIndent: 0 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'subtitle':
      return <div key={idx} style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', margin: '18px 0 8px' }}>{block.text}</div>;
    case 'sub-subtitle':
      return <div key={idx} style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', margin: '14px 0 6px 12px', borderBottom: '1px dashed #93c5fd', paddingBottom: 2 }}>{block.text}</div>;
    case 'step':
      return <li key={idx} style={{ padding: '10px 14px', background: '#f0f4f8', borderRadius: 6, borderLeft: '4px solid #1e3a5f', marginBottom: 8, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{block.text}</li>;
    case 'image':
      return (
        <div key={idx} style={{ width: '100%', margin: '16px 0', borderRadius: 8, border: '1px solid #dbeafe', paddingTop: block.size === 'large' ? '56.25%' : '40%', position: 'relative', overflow: 'hidden', background: '#f8fafc' }}>
          {block.src && <img src={block.src} alt={block.alt || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      );
    case 'table':
      return (
        <div key={idx} style={{ margin: '16px 0' }}>
          {block.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>{block.title}</div>}
          <div style={{ width: '100%', overflowX: 'auto', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              {block.headers && block.headers.length > 0 && (
                <thead>
                  <tr>
                    {block.headers.map((h, i) => (
                      <th key={i} style={{ padding: '7px 10px', background: '#f0f4f8', color: '#1e3a5f', fontWeight: 700, border: '1px solid #cbd5e1', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              {block.rows && block.rows.length > 0 && (
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '6px 10px', color: '#374151', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{cell}</td>
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
            <li key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#f0f4f8', borderRadius: 6, borderLeft: '4px solid #1e3a5f', marginBottom: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{sIdx + 1}</span>
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{(step as any).text}</span>
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

export function CorporateTemplate({ doc }: Props): React.ReactElement {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Cover */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: 'linear-gradient(160deg,#1e3a5f 0%,#0d2137 60%,#051423 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'rgba(59,130,246,0.1)', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 200, height: 200, background: 'rgba(59,130,246,0.08)', borderRadius: '0 100% 0 0' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 4, padding: '6px 14px', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#93c5fd', textTransform: 'uppercase' }}>
            Official Documentation
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 0 20px 0', textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase', color: '#93c5fd', marginBottom: 20 }}>{doc.meta.company}</div>
          <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1, color: '#fff', marginBottom: 16, letterSpacing: -1, borderLeft: '4px solid #3b82f6', paddingLeft: 16 }}>{doc.meta.title}</div>
          {doc.meta.subtitle && <div style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, paddingLeft: 20 }}>{doc.meta.subtitle}</div>}
          <div style={{ width: 80, height: 3, background: '#3b82f6', marginTop: 24, borderRadius: 2, marginLeft: 20 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{doc.meta.company}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Page 01</div>
        </div>
      </div>

      {/* TOC */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#f8fafc', padding: '60px 72px', position: 'relative' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0d2137)', padding: '24px 28px', borderRadius: 10, marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#93c5fd', fontWeight: 600, marginBottom: 4 }}>Navigation</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Table of Contents</div>
        </div>
        {doc.toc.map((item, i) => (
          <div key={item.id} style={{ marginLeft: ((item.level || 1) - 1) * 18, display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: 8, marginBottom: 8, background: i % 2 === 0 ? '#fff' : '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.number}</div>
            <div style={{ flex: 1, marginLeft: 14, fontSize: 14, fontWeight: 600, color: '#1e3a5f' }}>{item.title}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', background: '#dbeafe', padding: '2px 10px', borderRadius: 20 }}>{item.pageNumber}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 40, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <span>{doc.meta.footerBrand}</span><span>02</span>
        </div>
      </div>

      {/* Content pages */}
      {doc.pages.filter(p => p.type === 'content').map((page) => (
        <div key={page.id} className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: '60px 72px', position: 'relative' }}>
          {(() => {
            const rawNum = (page.chapterNumber || '1').trim();
            const displayNum = rawNum ? (rawNum.endsWith('.') ? rawNum : `${rawNum}.`) : '1.';
            const displayName = (page.chapterName || '').replace(/^[A-Za-z0-9]+[\.\:\-]\s*/, '').trim() || page.chapterName || '';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36, paddingBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a5f,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>{displayNum}</div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700 }}>{page.chapterLabel}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>{displayName}</div>
                </div>
              </div>
            );
          })()}
          {renderBlocksWithGrouping(page.blocks)}
          <div style={{ position: 'absolute', bottom: 40, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #1e3a5f', paddingTop: 14 }}>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>{page.footerBrand}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e3a5f' }}>{page.footerPage}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
