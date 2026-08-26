import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../../services/ProjectService';
import type { ProjectData } from '../../types/manual.types';
import { Sidebar } from '../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';

import { DEFAULT_DOCUMENT } from '../../hooks/useManualEditor';

import { ConfirmModal } from '../ui/ConfirmModal';
import { ProjectCoverPreview } from '../common/ProjectCoverPreview';
import { CoverPreviewModal } from '../common/CoverPreviewModal';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = user?.role === 'Viewer';
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cover Preview Modal State
  const [previewTarget, setPreviewTarget] = useState<ProjectData | null>(null);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Pagination State (5 items per page for Dashboard)
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = projects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handleOpenProject = (project: ProjectData) => {
    navigate(`/editor/${project.id}`);
  };

  const handleDeleteProjectClick = (e: React.MouseEvent, project: ProjectData) => {
    e.stopPropagation();
    if (isViewer) return;
    setDeleteTarget({ id: project.id, title: project.name || 'Proyek' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isViewer) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await ProjectService.deleteProject(targetId);
    const updated = await ProjectService.listProjects(user?.email);
    setProjects(updated);
    if ((currentPage - 1) * ITEMS_PER_PAGE >= updated.length && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAiGeneratorClick = () => {
    if (isViewer) return;
    navigate('/editor', { state: { openAiUpload: true } });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#f2f4f6', display: 'flex' }}>
      {/* Left Sidebar */}
      <Sidebar onAiGeneratorClick={isViewer ? undefined : handleAiGeneratorClick} />

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {/* Hero */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ff5ec7', fontWeight: 700 }}>Dashboard</div>
            {isViewer && (
              <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                👁️ Viewer Mode (Hanya Baca)
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5, color: '#fff', marginBottom: 10 }}>
            Build Beautiful{' '}
            <span style={{ background: 'linear-gradient(135deg,#ff5ec7,#00d2ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Manual Books
            </span>
          </h1>
          <p style={{ fontSize: 13, color: '#71717a', maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
            Create professional documentation with AI Pipeline auto-generation, drag-and-drop components, live rich text editing, and A4 PDF templates.
          </p>
        </div>

        {/* Projects */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#52525b' }}>
              Your Projects ({projects.length})
            </div>
            {!isViewer && (
              <button onClick={handleOpenNewProjectModal} style={{ padding: '6px 16px', background: 'linear-gradient(135deg,#ff5ec7,#ff80c5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + New Project
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#71717a' }}>
              Loading projects from database...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #27272a', borderRadius: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
              <div style={{ fontSize: 14, color: '#71717a' }}>No projects yet. Create one or upload a document to get started.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {paginatedProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleOpenProject(project)}
                    style={{
                      padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #27272a',
                      cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff5ec7'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#27272a'; }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <ProjectCoverPreview
                        project={project}
                        onOpenPreviewModal={(p) => setPreviewTarget(p)}
                        height={120}
                      />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                      {project.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {project.savedAt
                        ? `📅 ${new Date(project.savedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(project.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                        : 'Draft'}
                    </div>
                    {!isViewer && (
                      <button
                        onClick={(e) => handleDeleteProjectClick(e, project)}
                        style={{
                          position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.15)', border: 'none',
                          borderRadius: 6, color: '#ef4444', fontSize: 10, padding: '2px 6px', cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls for Dashboard */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #27272a' }}>
                  <div style={{ fontSize: 12, color: '#71717a' }}>
                    Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, projects.length)} dari {projects.length} proyek
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: '6px 12px',
                        background: '#090d16',
                        border: '1px solid #27272a',
                        borderRadius: 6,
                        color: currentPage === 1 ? '#52525b' : '#f8fafc',
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
                          background: currentPage === page ? 'linear-gradient(135deg, #ff5ec7, #ff80c5)' : '#090d16',
                          border: currentPage === page ? 'none' : '1px solid #27272a',
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
                        border: '1px solid #27272a',
                        borderRadius: 6,
                        color: currentPage === totalPages ? '#52525b' : '#f8fafc',
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
          )}
        </div>
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
