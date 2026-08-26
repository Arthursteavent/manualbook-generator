export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Hapus Proyek',
  cancelText = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#0d1117',
          border: `1px solid ${isDanger ? 'rgba(255, 85, 85, 0.35)' : 'rgba(0, 210, 255, 0.35)'}`,
          borderRadius: 20,
          padding: '30px 28px',
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.8), ${
            isDanger ? '0 0 40px rgba(255, 85, 85, 0.15)' : '0 0 40px rgba(0, 210, 255, 0.15)'
          }`,
          textAlign: 'center',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* ICON CIRCLE */}
        <div
          style={{
            margin: '0 auto 20px',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: isDanger ? 'rgba(255, 85, 85, 0.12)' : 'rgba(0, 210, 255, 0.12)',
            border: `2px solid ${isDanger ? '#ff5555' : '#00d2ff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 24px ${isDanger ? 'rgba(255, 85, 85, 0.35)' : 'rgba(0, 210, 255, 0.35)'}`,
          }}
        >
          {isDanger ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff5555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        {/* TITLE */}
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 10,
            letterSpacing: '-0.3px',
            color: isDanger ? '#ff5555' : '#f8fafc',
          }}
        >
          {title}
        </h3>

        {/* MESSAGE */}
        <p style={{ fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
          {message}
        </p>

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              background: isDanger
                ? 'linear-gradient(135deg, #ff416c, #ff4b2b)'
                : 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: isDanger
                ? '0 6px 20px rgba(255, 65, 108, 0.4)'
                : '0 6px 20px rgba(0, 210, 255, 0.4)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
          >
            {confirmText}
          </button>
        </div>

        {/* ANIMATIONS */}
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
