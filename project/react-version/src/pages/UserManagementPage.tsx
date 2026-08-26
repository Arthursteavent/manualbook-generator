import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserAccount } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';

export function UserManagementPage() {
  const navigate = useNavigate();
  const { user: currentUser, addUser, listUsers, deleteUser } = useAuth();
  const [usersList, setUsersList] = useState<UserAccount[]>(() => listUsers());

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshUsers = () => {
    setUsersList(listUsers());
  };

  const userRole = (currentUser?.role || '').trim().toLowerCase();
  const isAdmin = userRole === 'admin';
  const isViewer = userRole === 'viewer' || userRole === 'view' || userRole.includes('view') || userRole.includes('read');

  React.useEffect(() => {
    if (currentUser && !isAdmin) {
      navigate('/');
    }
  }, [currentUser, isAdmin, navigate]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Akun dengan role Viewer tidak memiliki izin untuk menambahkan pengguna baru.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await addUser(name, email, password, role);
      if (res.success) {
        setSuccessMsg(`Pengguna "${name}" (${email}) berhasil ditambahkan ke database!`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('Editor');
        refreshUsers();
      } else {
        setErrorMsg(res.message || 'Gagal menambahkan pengguna.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat menambahkan pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (emailToDelete: string) => {
    if (isViewer) {
      alert('Akun dengan role Viewer tidak memiliki izin untuk menghapus pengguna.');
      return;
    }
    if (emailToDelete === currentUser?.email) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (window.confirm(`Hapus pengguna ${emailToDelete}?`)) {
      await deleteUser(emailToDelete);
      refreshUsers();
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const adminCount = usersList.filter((u) => u.role === 'Admin').length;
  const editorCount = usersList.filter((u) => u.role === 'Editor' || u.role === 'Viewer').length;

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#f2f4f6', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {/* Header Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#00d2ff', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              DASHBOARD / USER MANAGEMENT
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Manajemen & Tambah Pengguna
            </h1>
            <p style={{ fontSize: 12.5, color: '#71717a', margin: '4px 0 0' }}>
              Kelola akses sistem, registrasi akun baru, dan daftar pengguna terdaftar di aplikasi.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ← Kembali ke Dashboard
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 36 }}>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Terdaftar</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', marginTop: 8 }}>{usersList.length} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Akun</span></div>
          </div>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#c084fc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Users</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#c084fc', marginTop: 8 }}>{adminCount} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Admin</span></div>
          </div>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Editor / Viewer</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>{editorCount} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Pengguna</span></div>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13.5px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ⚠️ <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13.5px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            ✅ <span>{successMsg}</span>
          </div>
        )}

        {/* Grid: Left = Add User Form, Right = Users List Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'start' }}>
          {/* Add User Form Card */}
          <div style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#00d2ff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>➕</span> Tambah Pengguna Baru
            </div>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              Daftarkan pengguna baru ke database sistem. Pengguna ini dapat langsung login ke aplikasi.
            </p>

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Rizky"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ahmad@manualarch.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Password Awal
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Role / Hak Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Editor">Editor (Full Access Editor)</option>
                  <option value="Admin">Administrator (Full Admin Access)</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 210, 255, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna Baru'}
              </button>
            </form>
          </div>

          {/* Users List Table Card */}
          <div style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Daftar Pengguna Terdaftar
                </h2>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Menampilkan {filteredUsers.length} pengguna terdaftar
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    width: 200,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={refreshUsers}
                  style={{
                    background: 'rgba(0,210,255,0.1)',
                    border: '1px solid rgba(0,210,255,0.3)',
                    color: '#00d2ff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: 12 }}>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>PENGGUNA</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>EMAIL</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>ROLE</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((acc) => {
                    const isCurrent = acc.email === currentUser?.email;
                    return (
                      <tr key={acc.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isCurrent ? 'rgba(0,210,255,0.04)' : 'transparent' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#fff',
                            }}>
                              {acc.name[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {acc.name}
                                {isCurrent && (
                                  <span style={{ fontSize: 9, background: '#00d2ff', color: '#000', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                                    Aktif
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: '#cbd5e1' }}>{acc.email}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: acc.role === 'Admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: acc.role === 'Admin' ? '#c084fc' : '#60a5fa',
                            fontWeight: 600,
                          }}>
                            {acc.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          {!isCurrent ? (
                            <button
                              onClick={() => handleDelete(acc.email)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              🗑️ Hapus
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>Akun Anda</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                        Tidak ada pengguna ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
