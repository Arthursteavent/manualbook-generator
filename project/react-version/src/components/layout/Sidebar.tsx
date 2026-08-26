import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onAiGeneratorClick?: () => void;
}

export function Sidebar({ onAiGeneratorClick }: SidebarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  void onAiGeneratorClick;

  const currentPath = location.pathname;

  const userRole = (user?.role || '').trim().toLowerCase();
  const isAdmin = userRole === 'admin';
  const isViewer = userRole === 'viewer' || userRole === 'view' || userRole.includes('view') || userRole.includes('read');

  const navItems = [
    { label: 'Dashboard', icon: '⊞', path: '/', isDashboard: true, visible: true },
    { label: '👥 User Management', icon: '👤', path: '/users', visible: isAdmin },
    { label: 'My Projects', icon: '📁', path: '/projects', visible: !isViewer },
    { label: '📚 Panduan Format', icon: '📚', path: '/docs', visible: true },
  ].filter(item => item.visible);

  return (
    <div
      style={{
        width: 200,
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: '#000',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        flexShrink: 0,
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px 16px',
          borderBottom: '1px solid #27272a',
          marginBottom: 6,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg,#ff5ec7,#ff80c5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, color: '#ff7db4' }}>ManualArch</div>
          <div style={{ fontSize: 10, color: '#52525b' }}>React Edition</div>
        </div>
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        let isActive = false;

        if (item.isDashboard && currentPath === '/') {
          isActive = true;
        } else if (item.path && item.path !== '/' && currentPath.startsWith(item.path)) {
          isActive = true;
        }

        let color = '#a1a1aa';
        let bg = 'transparent';
        let borderLeft = '3px solid transparent';

        if (isActive) {
          color = '#ff2d78';
          bg = 'rgba(255,45,120,0.05)';
          borderLeft = '3px solid #ff2d78';
        }

        return (
          <div
            key={item.label}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              color,
              background: bg,
              borderLeft,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Footer & User Profile */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 2px 6px rgba(0, 210, 255, 0.3)',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#f4f4f5',
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 9.5, color: '#71717a' }}>{user?.role || 'Editor'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Keluar dari aplikasi"
          style={{
            background: 'rgba(255, 45, 120, 0.1)',
            border: '1px solid rgba(255, 45, 120, 0.3)',
            borderRadius: '5px',
            color: '#ff7db4',
            padding: '4px 8px',
            fontSize: '10.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
