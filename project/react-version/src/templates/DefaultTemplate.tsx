import React from 'react';
import type { ManualDocument, ManualPage, ContentBlock } from '../types/manual.types';

interface Props { doc: ManualDocument; }

function renderBlock(block: ContentBlock, idx: number): React.ReactNode {
  switch (block.kind) {
    case 'section-title':
      return (
        <div key={idx}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: '#0f1117', marginBottom: 8, marginTop: 24 }}>
            {block.text}
          </div>
          <div style={{ width: 36, height: 3, background: block.accentColor || 'linear-gradient(90deg,#00d2ff,#00e676)', borderRadius: 2, marginBottom: 16 }} />
        </div>
      );
    case 'paragraph':
      return (
        <p key={idx} style={{ fontSize: 13.5, lineHeight: 1.8, color: '#4a5568', marginBottom: 16, textAlign: 'justify', textJustify: 'inter-word', wordBreak: 'normal', overflowWrap: 'break-word', textIndent: 0 }}
          dangerouslySetInnerHTML={{ __html: block.html }} />
      );
    case 'subtitle':
      return <div key={idx} style={{ fontSize: 15, fontWeight: 600, color: '#2d3748', margin: '24px 0 12px' }}>{block.text}</div>;
    case 'sub-subtitle':
      return <div key={idx} style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', margin: '16px 0 8px 12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: 3 }}>{block.text}</div>;
    case 'step':
      return (
        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#f8faff', borderRadius: 8, borderLeft: `3px solid ${block.accentColor || '#00d2ff'}`, marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>{block.text}</span>
        </li>
      );
    case 'image':
      return (
        <div key={idx} style={{ width: '100%', margin: '16px 0', borderRadius: 12, background: 'linear-gradient(135deg,#f0f4ff,#e8ecf8)', border: '2px dashed #c3cfe2', paddingTop: block.size === 'large' ? '56.25%' : '40%', position: 'relative' }}>
          {block.src && <img src={block.src} alt={block.alt || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
        </div>
      );
    case 'table':
      return (
        <div key={idx} style={{ margin: '16px 0' }}>
          {block.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{block.title}</div>}
          <div style={{ width: '100%', overflowX: 'auto', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              {block.headers && block.headers.length > 0 && (
                <thead>
                  <tr>
                    {block.headers.map((h, i) => (
                      <th key={i} style={{ padding: '7px 10px', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, border: '1px solid #cbd5e1', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              {block.rows && block.rows.length > 0 && (
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '6px 10px', color: '#334155', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      );
    case 'two-columns':
      return (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
          <div>{block.left.map((b, i) => renderBlock(b, i))}</div>
          <div>{block.right.map((b, i) => renderBlock(b, i))}</div>
        </div>
      );
    case 'bullet-list':
    case 'bullet':
    case 'bullets': {
      const bAny = block as any;
      if (bAny.html) {
        return (
          <div key={idx} style={{ margin: '10px 0 12px 16px' }}>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4a5568', fontSize: 13.5, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
          </div>
        );
      }
      const items: string[] = bAny.items || [];
      return (
        <ul key={idx} style={{ margin: '10px 0 12px 16px', paddingLeft: 18, color: '#4a5568', fontSize: 13.5, lineHeight: 1.8 }}>
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
            <ol style={{ margin: 0, paddingLeft: 20, color: '#4a5568', fontSize: 13.5, lineHeight: 1.8, listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
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
              <span style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6, flex: 1 }}>{item}</span>
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
            <li key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#f8faff', borderRadius: 8, borderLeft: `3px solid ${(step as any).accentColor || '#00d2ff'}`, marginBottom: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00d2ff, #00b8d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{sIdx + 1}</span>
              <span style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>{(step as any).text}</span>
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

function CoverPage({ doc }: { doc: ManualDocument }) {
  return (
    <div className="pdf-page-unit" style={{
      width: 794, minHeight: 1122, position: 'relative',
      overflow: 'hidden',
      background: doc.meta.coverGradient || `linear-gradient(145deg,${doc.meta.coverColor || '#0a0e1a'} 0%,#091b24 100%)`,
      color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 72px',
    }}>
      {doc.meta.coverGlowEnabled && (
        <>
          <div style={{ position: 'absolute', width: doc.meta.coverGlowSize || 140, height: doc.meta.coverGlowSize || 140, top: '10%', right: '10%', borderRadius: '50%', filter: 'blur(22px)', background: `radial-gradient(circle,${doc.meta.coverGlowColor || '#00d2ff'}40,transparent 52%)` }} />
          <div style={{ position: 'absolute', width: doc.meta.coverGlowSize || 140, height: doc.meta.coverGlowSize || 140, bottom: '10%', left: '10%', borderRadius: '50%', filter: 'blur(22px)', background: `radial-gradient(circle,${doc.meta.coverGlowColor || '#00d2ff'}40,transparent 52%)` }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,210,255,0.12)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#00d2ff', textTransform: 'uppercase' }}>
          Manual Book
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px 0 20px 0', textAlign: 'left', position: 'relative', zIndex: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase', color: '#00d2ff', marginBottom: 16 }}>{doc.meta.company || ''}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, lineHeight: 1.1, color: '#fff', marginBottom: 8, borderLeft: '5px solid #00d2ff', paddingLeft: 20 }}>{doc.meta.title}</div>
        {doc.meta.subtitle && <div style={{ fontSize: 20, fontWeight: 300, color: '#a0aec0', marginTop: 12, letterSpacing: 1, lineHeight: 1.5, paddingLeft: 25 }}>{doc.meta.subtitle}</div>}
        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#00d2ff,#00e676)', margin: '24px 0 0 25px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#4a5568', textTransform: 'uppercase' }}>{doc.meta.company || ''}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', letterSpacing: 1 }}>01</div>
      </div>
    </div>
  );
}

function TocPage({ doc }: { doc: ManualDocument }) {
  return (
    <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#f8faff', padding: 72, position: 'relative' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#00d2ff', marginBottom: 8 }}>Navigation</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, color: '#0f1117' }}>Table of Contents</div>
        <div style={{ width: 48, height: 3, background: 'linear-gradient(90deg,#00d2ff,#00e676)', marginTop: 16 }} />
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {doc.toc.map((item) => (
          <li key={item.id} style={{ marginLeft: ((item.level || 1) - 1) * 18, display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: 10, background: item.style === 'transparent' ? 'transparent' : '#fff', border: `1px solid ${item.style === 'transparent' ? 'rgba(203,213,224,0.45)' : '#e8ecf8'}` }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00d2ff22,#00e67622)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#00b8d4', flexShrink: 0 }}>{item.number}</div>
            <div style={{ flex: 1, marginLeft: 16, fontSize: 14, fontWeight: 500, color: '#2d3748' }}>{item.title}</div>
            <div style={{ flex: 1, borderBottom: '1px dashed #cbd5e0', margin: '0 12px' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a0aec0' }}>{item.pageNumber}</div>
          </li>
        ))}
      </ul>
      <div style={{ position: 'absolute', bottom: 32, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e8ecf8', paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#c3cfe2' }}>{doc.meta.footerBrand || doc.meta.company || ''}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', letterSpacing: 1 }}>02</div>
      </div>
    </div>
  );
}

function ContentPage({ page }: { page: ManualPage }) {
  const pageNumInt = parseInt((page.footerPage || '').replace(/\D/g, ''), 10) || 1;
  const isEven = pageNumInt % 2 === 0;

  return (
    <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: 72, position: 'relative', backgroundImage: 'linear-gradient(rgba(15,17,23,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(15,17,23,0.04) 1px,transparent 1px)', backgroundSize: '16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e8ecf8' }}>
        {(() => {
          const rawNum = (page.chapterNumber || '1').trim();
          const displayNum = rawNum ? (rawNum.endsWith('.') ? rawNum : `${rawNum}.`) : '1.';
          const displayName = (page.chapterName || '').replace(/^[A-Za-z0-9]+[\.\:\-]\s*/, '').trim() || page.chapterName || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#00d2ff,#00b8d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{displayNum}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#00d2ff' }}>{page.chapterLabel || ''}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>{displayName}</div>
              </div>
            </div>
          );
        })()}
      </div>
      {renderBlocksWithGrouping(page.blocks)}
      <div style={{ position: 'absolute', bottom: 32, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', flexDirection: isEven ? 'row' : 'row-reverse', alignItems: 'center', borderTop: '1px solid #e8ecf8', paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#c3cfe2' }}>{page.footerBrand || ''}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#a0aec0', letterSpacing: 1 }}>{page.footerPage || ''}</div>
      </div>
    </div>
  );
}

export function DefaultTemplate({ doc }: Props): React.ReactElement {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {doc.pages.map((page) => {
        if (page.type === 'cover') return <CoverPage key={page.id} doc={doc} />;
        if (page.type === 'toc') return <TocPage key={page.id} doc={doc} />;
        return <ContentPage key={page.id} page={page} />;
      })}
    </div>
  );
}
