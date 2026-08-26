import React, { useState } from 'react';
import { useAuth, type UserAccount } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function UserManagementModal({ isOpen, onClose }: Props) {
  const { user: currentUser, addUser, listUsers, deleteUser } = useAuth();
  const [usersList, setUsersList] = useState<UserAccount[]>(() => listUsers());

  // Form state for adding new user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const refreshUsers = () => {
    setUsersList(listUsers());
  };

  const isViewer = currentUser?.role === 'Viewer';

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
        setSuccessMsg(`Pengguna "${name}" (${email}) berhasil ditambahkan!`);
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

  const handleDelete = (emailToDelete: string) => {
    if (isViewer) {
      alert('Akun dengan role Viewer tidak memiliki izin untuk menghapus pengguna.');
      return;
    }
    if (emailToDelete === currentUser?.email) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (window.confirm(`Hapus pengguna ${emailToDelete}?`)) {
      deleteUser(emailToDelete);
      refreshUsers();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#0f172a',
        border: '1px solid rgba(0, 210, 255, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 210, 255, 0.2)',
        overflow: 'hidden',
        color: '#f8fafc',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Kelola & Tambah Pengguna</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Manajemen Akun Pengguna Aplikasi ManualArch</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Alerts */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#86efac',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* Form: Add User */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00d2ff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>➕</span> Tambah Pengguna Baru (Add User)
            </div>

            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="budi@manualarch.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Password Initial
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                    Role / Hak Akses
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 210, 255, 0.3)',
                }}
              >
                {isSubmitting ? 'Menambahkan...' : 'Simpan Pengguna Baru'}
              </button>
            </form>
          </div>

          {/* Section: Registered Users List */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Daftar Akun Terdaftar ({usersList.length})</span>
              <button
                onClick={refreshUsers}
                style={{ background: 'none', border: 'none', color: '#00d2ff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Refresh
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {usersList.map((acc) => {
                const isCurrent = acc.email === currentUser?.email;
                return (
                  <div
                    key={acc.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isCurrent ? 'rgba(0, 210, 255, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                      border: isCurrent ? '1px solid rgba(0, 210, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#fff',
                      }}>
                        {acc.name[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {acc.name}
                          {isCurrent && (
                            <span style={{ fontSize: 9, background: '#00d2ff', color: '#000', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                              Sesi Anda
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{acc.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: acc.role === 'Admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: acc.role === 'Admin' ? '#c084fc' : '#60a5fa',
                        fontWeight: 600,
                      }}>
                        {acc.role}
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={() => handleDelete(acc.email)}
                          title="Hapus pengguna ini"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
