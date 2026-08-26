import { useNavigate } from 'react-router-dom';
import type { ManualDocument } from '../../types/manual.types';
import { detectSubheadLevelFromEl } from '../../utils/docxImporterBridge';
import type { GeneratedPage } from '../../utils/docxImporterBridge';

interface Props {
  document: ManualDocument;
  aiPages?: GeneratedPage[];
  isViewer?: boolean;
  onPageClick: (pageId: string) => void;
  onSyncToc?: () => void;
}

interface SidebarItemInfo {
  id: string;
  title: string;
  subtitle?: string;
  type: 'cover' | 'toc' | 'chapter' | 'subhead' | 'subsubhead' | 'legend';
  pageNum: string;
  badge: string;
  /** 1 = Bab, 2 = Sub-Bab, sampai 5 mengikuti Heading 1..5 dokumen Word. */
  level: number;
}

export function LeftSidebar({ document, aiPages, isViewer, onPageClick, onSyncToc }: Props) {
  const navigate = useNavigate();
  const items: SidebarItemInfo[] = [];

  if (aiPages && aiPages.length > 0) {
    let chapterCounter = 0;

    aiPages.forEach((p, idx) => {
      const pageNumStr = String(idx + 1).padStart(2, '0');
      if (p.id === 'cover-page') {
        items.push({ id: p.id, title: 'Cover Page', subtitle: 'Halaman Sampul', type: 'cover', pageNum: pageNumStr, badge: 'C', level: 1 });
      } else if (p.id.includes('toc')) {
        items.push({ id: p.id, title: 'Daftar Isi', subtitle: 'Table of Contents', type: 'toc', pageNum: pageNumStr, badge: 'T', level: 1 });
      } else if (p.id.includes('legend') || p.id.includes('glossary')) {
        items.push({ id: p.id, title: 'Glosarium Istilah', subtitle: 'Glossary', type: 'legend', pageNum: pageNumStr, badge: 'G', level: 1 });
      } else {
        if (typeof window !== 'undefined') {
          const tempDiv = window.document.createElement('div');
          tempDiv.innerHTML = p.html;

          const chapNameEl = tempDiv.querySelector('.chapter-name');
          const chapNumEl = tempDiv.querySelector('.chapter-num');

          if (chapNameEl && chapNameEl.textContent?.trim()) {
            chapterCounter++;
            const title = chapNameEl.textContent.trim();
            const badge = chapNumEl?.textContent?.trim() || String(chapterCounter);
            items.push({ id: p.id, title, type: 'chapter', pageNum: pageNumStr, badge, level: 1 });
          }

          // Kumpulkan judul bertingkat (Sub-Bab sampai level 5) jadi kartu tersendiri
          const subheadEls = Array.from(tempDiv.querySelectorAll('.subhead-frame, .subhead-title, .subhead-text, .body-subtitle, .body-sub-subtitle, .body-sub-sub-subtitle, .body-sub-sub-sub-subtitle'));

          subheadEls.forEach(el => {
            const txt = el.textContent?.trim();
            if (!txt || txt === chapNameEl?.textContent?.trim()) return;

            // Avoid adding duplicate title if already added on this page
            if (items.some(it => it.id === p.id && it.title === txt)) return;

            const level = detectSubheadLevelFromEl(el);
            items.push({
              id: p.id,
              title: txt,
              type: level > 2 ? 'subsubhead' : 'subhead',
              pageNum: pageNumStr,
              badge: level > 2 ? '•' : '↳',
              level,
            });
          });
        }
      }
    });
  } else if (document && document.pages) {
    document.pages.forEach((page, idx) => {
      const pageNumStr = page.footerPage || String(idx + 1).padStart(2, '0');
      if (page.type === 'cover') {
        items.push({ id: page.id, title: 'Cover Page', subtitle: 'Halaman Sampul', type: 'cover', pageNum: pageNumStr, badge: 'C', level: 1 });
      } else if (page.type === 'toc') {
        items.push({ id: page.id, title: 'Daftar Isi', subtitle: 'Table of Contents', type: 'toc', pageNum: pageNumStr, badge: 'T', level: 1 });
      } else if (page.chapterName && page.chapterName.trim()) {
        items.push({
          id: page.id,
          title: page.chapterName.trim(),
          subtitle: page.chapterLabel,
          type: 'chapter',
          pageNum: pageNumStr,
          badge: String(items.filter(i => i.type === 'chapter').length + 1),
          level: 1,
        });
      }
    });
  }

  const getBadgeStyle = (type: SidebarItemInfo['type']) => {
    switch (type) {
      case 'cover':
        return { background: 'linear-gradient(135deg, #ff5ec7, #ff80c5)', color: '#ffffff' };
      case 'toc':
        return { background: 'linear-gradient(135deg, #00d2ff, #00b8d4)', color: '#ffffff' };
      case 'legend':
        return { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' };
      case 'subhead':
        return { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
      case 'subsubhead':
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8' };
      default:
        return { background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff' };
    }
  };

  const getItemCardStyle = (level: number, type: SidebarItemInfo['type']) => {
    let background = 'rgba(255, 255, 255, 0.03)';
    let border = '1px solid rgba(255, 255, 255, 0.07)';

    if (type === 'cover') {
      background = 'rgba(255, 94, 199, 0.05)';
      border = '1px solid rgba(255, 94, 199, 0.2)';
    } else if (type === 'toc') {
      background = 'rgba(0, 210, 255, 0.05)';
      border = '1px solid rgba(0, 210, 255, 0.2)';
    }

    return {
      marginLeft: Math.max(0, level - 1) * 12,
      padding: '8px 10px',
      background,
      border,
      borderRadius: 8,
    };
  };

  return (
    <div className="sidebar open">
      {/* Brand Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(255,125,180,0.2), rgba(0,210,255,0.2))',
            border: '1px solid rgba(0,210,255,0.3)', flexShrink: 0
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div className="sidebar-brand-text">
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: '#f8fafc', textTransform: 'uppercase' as const }}>MANUALARCH</div>
            <div className="sidebar-domain" style={{ fontSize: 9.5, color: '#64748b', fontWeight: 600 }}>manualarch.app</div>
          </div>
        </div>
        <button
          className="sidebar-back-btn"
          onClick={async () => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: '7px 10px', borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#cbd5e1'; }}
          title="Kembali ke Dashboard"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Section Label */}
      <div style={{ padding: '12px 16px 6px' }}>
        <span className="sidebar-header-title" style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
          NAVIGASI BAB
        </span>
      </div>

      {/* Sync TOC Button Card */}
      {!isViewer && onSyncToc && (
        <div className="sidebar-sync-area" style={{ padding: '4px 14px 10px' }}>
          <button
            onClick={onSyncToc}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9"/><polyline points="3 12 3 16 7 16"/><path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 9-9"/><polyline points="21 12 21 8 17 8"/></svg>
            <span>Sync / Regenerate Daftar Isi</span>
          </button>
        </div>
      )}

      {/* Navigation Items (Uniform Card Boxes for Every Entry!) */}
      <div className="sidebar-content" style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="sidebar-item"
            onClick={() => onPageClick(item.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              ...getItemCardStyle(item.level, item.type)
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 210, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
            }}
            onMouseLeave={e => {
              const normalStyle = getItemCardStyle(item.level, item.type);
              e.currentTarget.style.background = normalStyle.background;
              e.currentTarget.style.borderColor = normalStyle.border.split(' ')[2];
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                ...getBadgeStyle(item.type)
              }}>
                {item.badge}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#f1f5f9',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', flexShrink: 0, fontWeight: 600, marginLeft: 4 }}>
              pg {item.pageNum}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
