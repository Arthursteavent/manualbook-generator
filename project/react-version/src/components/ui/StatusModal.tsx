

export interface StatusModalState {
  isOpen: boolean;
  type: 'loading' | 'success' | 'error';
  title?: string;
  message?: string;
  onClose?: () => void;
  onConfirmSuccess?: () => void;
}

export function StatusModal({ isOpen, type, title, message, onClose, onConfirmSuccess }: StatusModalState) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#0f172a',
          border: `1px solid ${
            type === 'loading'
              ? 'rgba(0, 210, 255, 0.4)'
              : type === 'success'
              ? 'rgba(0, 230, 118, 0.4)'
              : 'rgba(255, 85, 85, 0.4)'
          }`,
          borderRadius: 16,
          padding: 28,
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.6), ${
            type === 'loading'
              ? '0 0 30px rgba(0, 210, 255, 0.15)'
              : type === 'success'
              ? '0 0 30px rgba(0, 230, 118, 0.15)'
              : '0 0 30px rgba(255, 85, 85, 0.15)'
          }`,
          textAlign: 'center',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* ICON & ANIMATION */}
        {type === 'loading' && (
          <div style={{ margin: '0 auto 20px', width: 64, height: 64, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px solid rgba(0, 210, 255, 0.15)',
                borderTopColor: '#00d2ff',
                borderRightColor: '#6d5efc',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ position: 'absolute', fontSize: 24 }}>✨</span>
          </div>
        )}

        {type === 'success' && (
          <div
            style={{
              margin: '0 auto 20px',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(0, 230, 118, 0.12)',
              border: '2px solid #00e676',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#00e676',
              boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)',
            }}
          >
            ✓
          </div>
        )}

        {type === 'error' && (
          <div
            style={{
              margin: '0 auto 20px',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 85, 85, 0.12)',
              border: '2px solid #ff5555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#ff5555',
              boxShadow: '0 0 20px rgba(255, 85, 85, 0.3)',
            }}
          >
            ⚠️
          </div>
        )}

        {/* TITLE */}
        <h3
          style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: type === 'loading' ? 0 : 10,
            color: type === 'loading' ? '#00d2ff' : type === 'success' ? '#00e676' : '#ff5555',
          }}
        >
          {title || (type === 'loading' ? 'Memproses Dokumen AI...' : type === 'success' ? 'Generasi Berhasil!' : 'Terjadi Kesalahan')}
        </h3>

        {/* MESSAGE (Hidden during loading mode) */}
        {type !== 'loading' && message && (
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            {message}
          </p>
        )}

        {/* ACTION BUTTONS */}
        {type === 'success' && (
          <button
            onClick={onConfirmSuccess || onClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00e676, #00b0ff)',
              color: '#0f172a',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 230, 118, 0.4)',
              transition: 'transform 0.2s',
            }}
          >
            ✨ Lihat Hasil Dokumen →
          </button>
        )}

        {type === 'error' && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 10,
              background: '#ff5555',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 85, 85, 0.4)',
            }}
          >
            Tutup
          </button>
        )}

        {/* CSS KEYFRAMES */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
