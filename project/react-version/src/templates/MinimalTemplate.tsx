import React from 'react';
import type { ManualDocument, ContentBlock } from '../types/manual.types';

interface Props { doc: ManualDocument; }

function renderBlock(block: ContentBlock, idx: number): React.ReactNode {
  switch (block.kind) {
    case 'section-title':
      return <div key={idx} style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 8, marginTop: 24, borderBottom: '2px solid #000', paddingBottom: 4 }}>{block.text}</div>;
    case 'paragraph':
      return <p key={idx} style={{ fontSize: 13, lineHeight: 1.8, color: '#333', marginBottom: 12, textAlign: 'justify', textJustify: 'inter-word', wordBreak: 'normal', overflowWrap: 'break-word', textIndent: 0 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'subtitle':
      return <div key={idx} style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '18px 0 8px' }}>{block.text}</div>;
    case 'sub-subtitle':
      return <div key={idx} style={{ fontSize: 12.5, fontWeight: 600, color: '#222', margin: '12px 0 6px 10px', borderBottom: '1px dashed #666', paddingBottom: 2 }}>{block.text}</div>;
    case 'step':
      return <li key={idx} style={{ padding: '8px 12px', borderLeft: '3px solid #000', marginBottom: 8, fontSize: 13, color: '#333', lineHeight: 1.6 }}>{block.text}</li>;
    case 'image':
      return (
        <div key={idx} style={{ width: '100%', margin: '16px 0', border: '1px solid #ccc', paddingTop: block.size === 'large' ? '56.25%' : '40%', position: 'relative', overflow: 'hidden' }}>
          {block.src && <img src={block.src} alt={block.alt || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      );
    case 'table':
      return (
        <div key={idx} style={{ margin: '16px 0' }}>
          {block.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#000', marginBottom: 6 }}>{block.title}</div>}
          <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #000' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              {block.headers && block.headers.length > 0 && (
                <thead>
                  <tr>
                    {block.headers.map((h, i) => (
                      <th key={i} style={{ padding: '7px 10px', background: '#eee', color: '#000', fontWeight: 700, border: '1px solid #000', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              {block.rows && block.rows.length > 0 && (
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: '#fff' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '6px 10px', color: '#333', border: '1px solid #ccc', verticalAlign: 'top' }}>{cell}</td>
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
            <ul style={{ margin: 0, paddingLeft: 18, color: '#222', fontSize: 13.5, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
          </div>
        );
      }
      const items: string[] = bAny.items || [];
      return (
        <ul key={idx} style={{ margin: '10px 0 12px 16px', paddingLeft: 18, color: '#222', fontSize: 13.5, lineHeight: 1.7 }}>
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
            <ol style={{ margin: 0, paddingLeft: 20, color: '#222', fontSize: 13.5, lineHeight: 1.7, listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: bAny.html }} />
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
              <span style={{ fontSize: 13, color: '#222', lineHeight: 1.6, flex: 1 }}>{item}</span>
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
            <li key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderLeft: '3px solid #000', marginBottom: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{sIdx + 1}</span>
              <span style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{(step as any).text}</span>
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

export function MinimalTemplate({ doc }: Props): React.ReactElement {
  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      {/* Cover */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 72px', border: '20px solid #000', boxSizing: 'border-box', position: 'relative' }}>
        <div style={{ fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#666' }}>{doc.meta.company}</div>
        <div style={{ textAlign: 'left', marginTop: 'auto', marginBottom: 40 }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#000', lineHeight: 1.05, letterSpacing: -1, marginBottom: 24, borderLeft: '5px solid #000', paddingLeft: 20 }}>{doc.meta.title}</div>
          <div style={{ width: 80, height: 2, background: '#000', margin: '0 0 24px 25px' }} />
          {doc.meta.subtitle && <div style={{ fontSize: 18, color: '#555', lineHeight: 1.6, paddingLeft: 25 }}>{doc.meta.subtitle}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#999', borderTop: '1px solid #eee', paddingTop: 20 }}>
          <span>{doc.meta.company}</span>
          <span>01</span>
        </div>
      </div>

      {/* TOC */}
      <div className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: '72px 80px', position: 'relative' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#000', marginBottom: 8 }}>Table of Contents</div>
        <div style={{ width: 60, height: 2, background: '#000', marginBottom: 40 }} />
        {doc.toc.map((item) => (
          <div key={item.id} style={{ marginLeft: ((item.level || 1) - 1) * 18, display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#000', width: 32 }}>{item.number}.</div>
            <div style={{ flex: 1, fontSize: 14, color: '#333' }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>{item.pageNumber}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 48, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
          <span>{doc.meta.footerBrand}</span><span>02</span>
        </div>
      </div>

      {/* Content pages */}
      {doc.pages.filter(p => p.type === 'content').map((page) => (
        <div key={page.id} className="pdf-page-unit" style={{ width: 794, minHeight: 1122, background: '#fff', padding: '72px 80px', position: 'relative' }}>
          {(() => {
            const displayName = (page.chapterName || '').replace(/^[A-Za-z0-9]+[\.\:\-]\s*/, '').trim() || page.chapterName || '';
            return (
              <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '2px solid #000' }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>{page.chapterLabel}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#000' }}>{displayName}</div>
              </div>
            );
          })()}
          {renderBlocksWithGrouping(page.blocks)}
          <div style={{ position: 'absolute', bottom: 48, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 12 }}>
            <span>{page.footerBrand}</span><span>{page.footerPage}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
