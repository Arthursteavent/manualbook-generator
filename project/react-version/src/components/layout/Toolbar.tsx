import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LanguageCode } from '../../types/manual.types';
import { LANGUAGE_LABELS } from '../../types/manual.types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isExporting: boolean;
  exportProgress?: number;
  exportStatusText?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  isViewer?: boolean;
  onExportPdf: () => void;
  onSave?: () => void;
  language?: LanguageCode;
  onChangeLanguage?: (lang: LanguageCode) => void;
  isTranslating?: boolean;
  componentsOpen?: boolean;
}

const LANGUAGE_ORDER: LanguageCode[] = ['id', 'en', 'zh', 'ar', 'ko', 'ja'];

export function Toolbar({
  isExporting,
  exportProgress = 0,
  exportStatusText = '',
  isDirty = false,
  isSaving = false,
  isViewer = false,
  onExportPdf,
  onSave,
  language = 'id',
  onChangeLanguage,
  isTranslating = false,
  componentsOpen = false,
}: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <>
      {/* High-Fidelity PDF Export Loading Progress Modal */}
      {isExporting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          background: 'rgba(4, 7, 13, 0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0e1526, #141c2e)',
            border: '1px solid rgba(0, 210, 255, 0.35)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 210, 255, 0.2)',
            borderRadius: '18px',
            padding: '36px 42px',
            width: '430px',
            maxWidth: '90vw',
            textAlign: 'center',
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
          }}>
            {/* Spinning Ring */}
            <div style={{
              position: 'relative',
              width: 68,
              height: 68,
              margin: '0 auto 22px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px solid rgba(0, 210, 255, 0.15)',
                borderTopColor: '#00d2ff',
                borderRightColor: '#3b82f6',
                animation: 'spin 0.9s linear infinite',
              }} />
              <span style={{ fontSize: 26 }}>📑</span>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: 19, fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>
              Mengekspor Dokumen PDF
            </h3>
            <p style={{ margin: '0 0 22px 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
              {exportStatusText || 'Sedang memproses halaman dokumen...'}
            </p>

            {/* Progress Bar Container */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.07)',
              borderRadius: '100px',
              height: '11px',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, exportProgress))}%`,
                background: 'linear-gradient(90deg, #00d2ff, #3b82f6, #6366f1)',
                borderRadius: '100px',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 14px rgba(0, 210, 255, 0.65)',
              }} />
            </div>

            {/* Progress Percentage Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              <span>Progress Export</span>
              <span style={{ color: '#00d2ff', fontSize: '14px', fontWeight: 800 }}>{exportProgress}%</span>
            </div>
          </div>
        </div>
      )}

      <div className={`editor-topbar ${componentsOpen ? 'components-open' : ''}`}>
        {/* Multi-language selector */}
        {onChangeLanguage && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Ubah bahasa dokumen">
            <select
              value={language || 'id'}
              disabled={isTranslating}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
              style={{
                appearance: 'none',
                background: 'rgba(0, 210, 255, 0.08)',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                color: '#00d2ff',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 24px 6px 10px',
                borderRadius: '6px',
                cursor: isTranslating ? 'wait' : 'pointer',
                opacity: isTranslating ? 0.6 : 1,
                whiteSpace: 'nowrap',
                outline: 'none',
              }}
            >
              {LANGUAGE_ORDER.map((code) => (
                <option key={code} value={code} style={{ background: '#0f1117', color: '#f8fafc' }}>
                  {LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
            {isTranslating ? (
              <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2" style={{ position: 'absolute', right: 7, pointerEvents: 'none' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2.5" style={{ position: 'absolute', right: 7, pointerEvents: 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        )}

        <div className="topbar-divider" />
        <button
          className="btn btn-pdf"
          onClick={onExportPdf}
          disabled={isExporting}
          style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '6px', fontWeight: 700 }}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Exporting ({exportProgress}%)...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              PDF
            </>
          )}
        </button>

      {/* Save button */}
      {!isViewer && onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          title="Simpan (Ctrl+S)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: isSaving ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            background: isDirty
              ? 'linear-gradient(135deg, #00d2ff, #3b82f6)'
              : 'rgba(16, 185, 129, 0.12)',
            border: isDirty
              ? '1px solid #00d2ff'
              : '1px solid rgba(16, 185, 129, 0.3)',
            color: isDirty ? '#ffffff' : '#10b981',
            boxShadow: isDirty ? '0 0 8px rgba(0, 210, 255, 0.35)' : 'none',
            flexShrink: 0,
          }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Saving...
            </>
          ) : isDirty ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save
            </>
          ) : (
            <>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              Saved
            </>
          )}
        </button>
      )}

      {isViewer && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: '6px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: '#38bdf8', fontSize: '11px', fontWeight: 600,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Viewer Mode</span>
        </div>
      )}

      <div className="topbar-divider" />

      {/* Profile Avatar */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#ffffff',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 210, 255, 0.35)',
            flexShrink: 0, transition: 'transform 0.15s ease',
          }}
          onClick={() => setShowDropdown(!showDropdown)}
          title={user?.name || 'User'}
        >
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>

        {showDropdown && (
          <div className="topbar-avatar-dropdown">
            <div className="dropdown-user-info">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{user?.role || 'Editor'}</div>
            </div>
            <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/users'); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Users
            </button>
            <button className="dropdown-item danger" onClick={() => { setShowDropdown(false); logout(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
