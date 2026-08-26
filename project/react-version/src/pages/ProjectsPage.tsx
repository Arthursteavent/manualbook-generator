import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../services/ProjectService';
import type { ProjectData } from '../types/manual.types';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';

import { DEFAULT_DOCUMENT } from '../hooks/useManualEditor';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ProjectCoverPreview } from '../components/common/ProjectCoverPreview';
import { CoverPreviewModal } from '../components/common/CoverPreviewModal';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (user?.role || '').trim().toLowerCase();
  const isViewer = userRole === 'viewer' || userRole === 'view' || userRole.includes('view') || userRole.includes('read');

  useEffect(() => {
    if (user && isViewer) {
      navigate('/');
    }
  }, [user, isViewer, navigate]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Cover Preview Modal State
  const [previewTarget, setPreviewTarget] = useState<ProjectData | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);





  // Pagination State (10 items per page for History/Projects page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ProjectService.listProjects(user?.email)
      .then((data) => {
        if (active) {
          setProjects(data);
          setCurrentPage(1);
        }
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.email]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const handleDeleteProjectClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (isViewer) return;
    setDeleteTarget({ id, title: name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isViewer) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await ProjectService.deleteProject(targetId);
    const updated = await ProjectService.listProjects(user?.email);
    setProjects(updated);
  };

  const handleOpenProject = (project: ProjectData) => {
    navigate(`/editor/${project.id}`);
  };

  const handleOpenNewProjectModal = async () => {
    if (isViewer) return;
    const title = 'Untitled Manual';
    const newProjId = `proj-${Date.now()}`;
    const initialDoc: ProjectData['document'] = {
      ...DEFAULT_DOCUMENT,
      meta: { ...DEFAULT_DOCUMENT.meta, title: title },
    };
    await ProjectService.saveProject(title, initialDoc, newProjId, user?.email);
    navigate(`/editor/${newProjId}`);
  };

  // Filtering & Sorting
  const filtered = projects.filter((p) => {
    const term = searchQuery.toLowerCase();
    const docTitle = p.document?.meta?.title || '';
    return p.name.toLowerCase().includes(term) || docTitle.toLowerCase().includes(term);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSorted = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: '#000', color: '#f2f4f6', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Reusable Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '24px 32px' }}>
        {/* Header Breadcrumbs & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#ff2d78', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              DASHBOARD / MY PROJECTS
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.5px' }}>
              My Projects ({sorted.length} Proyek)
            </h1>
            <p style={{ fontSize: 12.5, color: '#71717a', margin: '4px 0 0' }}>
              Kelola dan buka kembali seluruh dokumen manual book yang telah dibuat.
            </p>
          </div>

          {!isViewer && (
            <button
              onClick={handleOpenNewProjectModal}
              style={{
                background: 'linear-gradient(135deg, #ff2d78, #ff5ec7)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 45, 120, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <span>+</span> Buat Proyek Baru
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, background: '#090d16', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari judul proyek atau nama dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Terbaru (Newest)</option>
              <option value="oldest">Terlama (Oldest)</option>
              <option value="name">Nama (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#71717a' }}>
            Memuat proyek dari database...
          </div>
        ) : sorted.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
              {paginatedSorted.map((project) => {
                const pageCount = project.document?.pages?.length || 1;
                const title = project.name || project.document?.meta?.title || 'Untitled Manual';
                let d: Date | null = null;
                if (project.savedAt) {
                  let rawStr = String(project.savedAt).trim();
                  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(rawStr)) {
                    rawStr = rawStr.replace(' ', 'T') + 'Z';
                  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(rawStr) && !rawStr.endsWith('Z')) {
                    rawStr = rawStr + 'Z';
                  }
                  const parsed = new Date(rawStr);
                  if (!isNaN(parsed.getTime())) d = parsed;
                }
                const dateStr = d
                  ? `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                  : '';

                return (
                  <div
                    key={project.id}
                    onClick={() => handleOpenProject(project)}
                    style={{
                      background: '#090d16',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff2d78';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 45, 120, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1e293b';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Thumbnail / Cover Box */}
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <ProjectCoverPreview
                        project={project}
                        onOpenPreviewModal={(p) => setPreviewTarget(p)}
                        height={110}
                      />

                      {!isViewer && (
                        <button
                          onClick={(e) => handleDeleteProjectClick(e, project.id, title)}
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            zIndex: 15,
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                          title="Hapus Proyek"
                        >
                          🗑
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: '#f8fafc',
                          margin: '0 0 4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {title}
                      </h3>
                      <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📄 {pageCount} Halaman</span>
                        <span>📅 {dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for My Projects (History) */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, sorted.length)} dari {sorted.length} proyek
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{
                      padding: '6px 12px',
                      background: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: currentPage === 1 ? '#475569' : '#f8fafc',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ‹ Sebelum
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 32,
                        height: 32,
                        background: currentPage === page ? 'linear-gradient(135deg, #ff2d78, #ff5ec7)' : '#090d16',
                        border: currentPage === page ? 'none' : '1px solid #334155',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      padding: '6px 12px',
                      background: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: currentPage === totalPages ? '#475569' : '#f8fafc',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Sesudah ›
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '20px',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
              {searchQuery ? 'Tidak Ada Proyek Ditemukan' : 'Belum Ada Proyek Disimpan'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 420, margin: '0 auto 24px' }}>
              {searchQuery
                ? `Tidak ada proyek yang cocok dengan kata kunci "${searchQuery}".`
                : 'Mulai buat proyek manual book baru dengan AI Generator atau canvas kosong.'}
            </p>

            <button
              onClick={handleOpenNewProjectModal}
              style={{
                background: 'linear-gradient(135deg, #00d2ff, #6d5efc)',
                border: 'none',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 210, 255, 0.35)',
              }}
            >
              ✨ Buat Proyek Pertama
            </button>
          </div>
        )}
      </div>



      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Proyek?"
        message={`Apakah Anda yakin ingin menghapus proyek "${deleteTarget?.title}"? Data proyek akan dihapus secara permanen.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <CoverPreviewModal
        project={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}
