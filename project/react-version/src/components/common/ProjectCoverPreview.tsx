import type { ProjectData } from '../../types/manual.types';

export function extractCoverInfo(project: ProjectData) {
  const doc = (project?.document || {}) as any;
  const meta = doc.meta || {};

  let coverImage = meta.coverImage;
  let coverFit: 'contain' | 'cover' | 'fill' = meta.coverImageFit || 'contain';
  let coverHtml: string | undefined = undefined;

  const pagesList = Array.isArray(doc.pages)
    ? doc.pages
    : Array.isArray(doc.generatedPages)
    ? doc.generatedPages
    : Array.isArray(doc.htmlPages)
    ? doc.htmlPages
    : [];

  const coverPage = pagesList.find(
    (p: any) => p && (p.id === 'cover-page' || p.type === 'cover')
  );

  if (coverPage) {
    if (typeof coverPage.html === 'string' && coverPage.html.trim() !== '') {
      coverHtml = coverPage.html;
      if (!coverImage) {
        const imgMatch = coverPage.html.match(/<img[\s\S]*?src=["']([\s\S]*?)["']/i);
        if (imgMatch && imgMatch[1]) {
          coverImage = imgMatch[1].replace(/[\r\n\t]/g, '').trim();
        }
        const fitMatch = coverPage.html.match(/object-fit:\s*([a-z]+)/i);
        if (fitMatch && fitMatch[1]) {
          coverFit = fitMatch[1] as any;
        }
      }
    } else if (Array.isArray(coverPage.blocks)) {
      if (!coverImage) {
        const imgBlock = coverPage.blocks.find(
          (b: any) =>
            b &&
            (b.kind === 'image' || b.type === 'image') &&
            (b.src || b.url || b.image_url)
        );
        if (imgBlock) {
          coverImage = (imgBlock.src || imgBlock.url || imgBlock.image_url || '').replace(/[\r\n\t]/g, '').trim();
        }
      }
    }
  }

  if (coverImage) {
    coverImage = coverImage.replace(/[\r\n\t]/g, '').trim();
  }

  const title = project.name?.trim() || meta.title || 'Untitled Manual';
  const subtitle = meta.subtitle || '';
  const coverGradient =
    meta.coverGradient ||
    `linear-gradient(145deg, ${meta.coverColor || '#0a0e1a'} 0%, #091b24 100%)`;

  return { coverImage, coverFit, coverHtml, title, subtitle, coverGradient, meta };
}

interface ProjectCoverPreviewProps {
  project: ProjectData;
  onOpenPreviewModal?: (project: ProjectData) => void;
  height?: number | string;
}

export function ProjectCoverPreview({
  project,
  onOpenPreviewModal,
  height = 110,
}: ProjectCoverPreviewProps) {
  const { coverImage, coverFit, coverHtml, title, subtitle, coverGradient, meta } =
    extractCoverInfo(project);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenPreviewModal) {
      onOpenPreviewModal(project);
    }
  };

  // Clean coverHtml for mini thumbnail display
  const sanitizedHtml = coverHtml
    ? coverHtml
        .replace(/contenteditable="true"/g, 'contenteditable="false"')
        .replace(/<button[^>]*>.*?<\/button>/gi, '')
    : undefined;

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        background: coverImage ? '#090a0f' : coverGradient,
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: coverImage || sanitizedHtml ? 0 : '10px 12px',
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
            zIndex: 1,
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
              transform: `scale(${typeof height === 'number' ? height / 1123 : 0.1})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      ) : (
        <>
          {/* Cover Background Glow if enabled */}
          {meta.coverGlowEnabled && (
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '140%',
                height: '140%',
                background: `radial-gradient(circle, ${meta.coverGlowColor || '#00d2ff'}33 0%, transparent 70%)`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}

          {/* Top Badge */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #00d2ff, #ff5ec7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                border: '1px solid rgba(0, 210, 255, 0.3)',
                borderRadius: '4px',
                padding: '1px 5px',
                backdropFilter: 'blur(4px)',
                lineHeight: 1.2,
              }}
            >
              Manual Book
            </span>
          </div>

          {/* Main Title & Subtitle Mini Display */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              marginTop: 'auto',
              marginBottom: 10,
              textAlign: 'left',
              padding: '0 4px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                borderLeft: '3px solid #00d2ff',
                paddingLeft: 6,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: '8px',
                  color: '#94a3b8',
                  marginTop: 2,
                  paddingLeft: 9,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Footer Metadata Mini Line */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 4,
              fontSize: '7.5px',
              color: '#64748b',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.company || meta.author || 'Document Cover'}
            </span>
            <span>A4</span>
          </div>
        </>
      )}

      {/* Hover Action Overlay: Eye button for full preview */}
      {onOpenPreviewModal && (
        <div
          onClick={handlePreviewClick}
          title="Preview Cover Ukuran Penuh"
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(0, 210, 255, 0.4)',
            color: '#38bdf8',
            borderRadius: '6px',
            padding: '3px 7px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00d2ff';
            e.currentTarget.style.color = '#000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
            e.currentTarget.style.color = '#38bdf8';
          }}
        >
          👁️ Preview
        </div>
      )}
    </div>
  );
}
