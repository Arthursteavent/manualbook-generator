import { useNavigate } from 'react-router-dom';
import type { ProjectData } from '../../types/manual.types';
import { extractCoverInfo } from './ProjectCoverPreview';

interface CoverPreviewModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export function CoverPreviewModal({ project, onClose }: CoverPreviewModalProps) {
  const navigate = useNavigate();

  if (!project) return null;

  const { coverImage, coverFit, coverHtml, title, subtitle, coverGradient, meta } =
    extractCoverInfo(project);

  const handleOpenEditor = () => {
    onClose();
    navigate(`/editor/${project.id}`);
  };

  const sanitizedHtml = coverHtml
    ? coverHtml
        .replace(/contenteditable="true"/g, 'contenteditable="false"')
        .replace(/<button[^>]*>.*?<\/button>/gi, '')
    : undefined;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#090d16',
          border: '1px solid rgba(0, 210, 255, 0.3)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 210, 255, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d2ff', letterSpacing: 1, textTransform: 'uppercase' }}>
              Preview Cover Dokumen
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>
              {project.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: 8,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body / A4 Cover Canvas View */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#04070d',
          }}
        >
          <div
            style={{
              width: 360,
              height: 508, // A4 Aspect ratio ~ 1:1.414
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 12px 36px rgba(0,0,0,0.9), 0 0 2px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: coverImage ? '#090a0f' : coverGradient,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: coverImage || sanitizedHtml ? 0 : '28px 24px',
              boxSizing: 'border-box',
            }}
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt={title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: coverFit,
                  display: 'block',
                }}
              />
            ) : sanitizedHtml ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    width: 794,
                    height: 1123,
                    transform: 'scale(0.453)', // 360 / 794
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              </div>
            ) : (
              <>
                {/* Glow ring */}
                {meta.coverGlowEnabled && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-15%',
                      left: '-15%',
                      width: '130%',
                      height: '130%',
                      background: `radial-gradient(circle, ${meta.coverGlowColor || '#00d2ff'}40 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Top Badge */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      background: 'linear-gradient(135deg, #00d2ff, #ff5ec7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      border: '1px solid rgba(0, 210, 255, 0.4)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    MANUAL BOOK
                  </span>
                </div>

                {/* Main Content (Bottom-Left Placement) */}
                <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', marginBottom: 16, textAlign: 'left' }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#ffffff',
                      lineHeight: 1.3,
                      marginBottom: 8,
                      textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                      borderLeft: '4px solid #00d2ff',
                      paddingLeft: 12,
                    }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        lineHeight: 1.4,
                        margin: 0,
                        paddingLeft: 16,
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Footer Metadata */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    paddingTop: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    fontSize: 9,
                    color: '#64748b',
                  }}
                >
                  <div>
                    {meta.company && <div style={{ fontWeight: 700, color: '#cbd5e1' }}>{meta.company}</div>}
                    {meta.author && <div>Penulis: {meta.author}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {meta.version && <div>Ver: {meta.version}</div>}
                    {meta.date && <div>{meta.date}</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
          <button
            onClick={handleOpenEditor}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #00d2ff, #3b82f6)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 210, 255, 0.3)',
            }}
          >
            ✏️ Buka Editor Proyek
          </button>
        </div>
      </div>
    </div>
  );
}
