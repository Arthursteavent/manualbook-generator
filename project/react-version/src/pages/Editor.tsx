import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const EMPTY_SECTIONS: any[] = [];
import { Toolbar } from '../components/layout/Toolbar';
import { LeftSidebar } from '../components/layout/LeftSidebar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { PdfPageCanvas } from '../components/editor/PdfPageCanvas';
import { HtmlDocViewer } from '../components/editor/HtmlDocViewer';
import { useManualEditor } from '../hooks/useManualEditor';
import { usePdfExport } from '../hooks/usePdfExport';
import { ProjectService } from '../services/ProjectService';
import { TranslationService } from '../services/TranslationService';
import { useAuth } from '../context/AuthContext';
import type { AiGenerateResult } from '../services/ParserService';
import type { ContentBlock, LanguageCode } from '../types/manual.types';
import { LANGUAGE_LABELS } from '../types/manual.types';
import type { ColorThemeId } from '../utils/colorThemes';
import { DEFAULT_COLOR_THEME } from '../utils/colorThemes';

export function Editor() {
  const { id: projectId } = useParams<{ id?: string }>();
  const location = useLocation();

  const { user } = useAuth();
  const isViewer = user?.role === 'Viewer';
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Manual');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null);
  const [aiDoc, setAiDoc] = useState<AiGenerateResult | null>(null);
  const activeSections = useMemo(() => aiDoc?.sections || EMPTY_SECTIONS, [aiDoc?.sections]);
  const [language, setLanguage] = useState<LanguageCode>('id');
  const [colorTheme, setColorTheme] = useState<ColorThemeId>(DEFAULT_COLOR_THEME);
  const [customAccentColor, setCustomAccentColor] = useState<string | undefined>(undefined);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingTo, setTranslatingTo] = useState<LanguageCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isFirstPagesSyncRef = useRef<boolean>(true);
  // Revision stamp of the document copy this tab holds (from the server on
  // load/save). Sent back on save so a stale copy can't overwrite newer work.
  const docRevRef = useRef<number>(0);
  const isSavingOrSyncingRef = useRef<boolean>(false);
  const lastSaveTimestampRef = useRef<number>(0);

  const translatedDocsRef = useRef<Partial<Record<LanguageCode, AiGenerateResult>>>({});
  const addChapterFnRef = useRef<(() => void) | null>(null);
  const addSubheadFnRef = useRef<(() => void) | null>(null);
  const syncTocFnRef = useRef<(() => void) | null>(null);
  const autoSplitTocFnRef = useRef<(() => void) | null>(null);
  const reflowFnRef = useRef<(() => void) | null>(null);
  const syncDomFnRef = useRef<(() => any[]) | null>(null);

  const {
    document,
    isDirty,
    loadDocument,
    clearDirty,
    updateMeta,
    updateToc,
    updatePage,
    updateBlock,
    addBlock,
    removeBlock,
    removePage,
    addCoverPage,
  } = useManualEditor();

  const {
    isExporting,
    exportProgress,
    exportStatusText,
    exportPdf,
  } = usePdfExport();

  const markAsSaved = useCallback(() => {
    lastSaveTimestampRef.current = Date.now();
    setHasUnsavedChanges(false);
    clearDirty();
  }, [clearDirty]);

  // Warn on tab/page close if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isViewer && (hasUnsavedChanges || isDirty)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isDirty, isViewer]);

  // Global Keyboard Shortcut for manual save: Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isViewer) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [projectName, aiDoc, document, currentProjectId, user?.email, language, colorTheme, isViewer]);

  // Load project or AI doc if passed from Dashboard
  useEffect(() => {
    if (!isViewer && location.state && (location.state as any).openAiUpload) {
      setComponentsOpen(true);
    }
    if (location.state && (location.state as any).aiDoc) {
      const docData = (location.state as any).aiDoc as AiGenerateResult;
      translatedDocsRef.current = {};
      isFirstPagesSyncRef.current = true;
      setAiDoc(docData);
      const targetLang = docData.language || 'id';
      setLanguage(targetLang);
      const title = docData.docTitle || 'AI Generated Manual';
      setProjectName(title);
      const newProjId = (docData as any)._saved_folder || (location.state as any).projectId || projectId || `proj-${Date.now()}`;
      setCurrentProjectId(newProjId);
      const themeVal = (docData as any).colorTheme || colorTheme;
      if ((docData as any).colorTheme) {
        setColorTheme((docData as any).colorTheme);
      }
      if (!isViewer) {
        ProjectService.saveProject(title, docData as any, newProjId, user?.email, targetLang, themeVal);
      }
      markAsSaved();
      if (window.history.replaceState) {
        window.history.replaceState(null, '', `/editor/${newProjId}`);
      }
    } else if (projectId) {
      const searchParams = new URLSearchParams(location.search);
      const queryLang = (searchParams.get('lang') as LanguageCode) || undefined;

      ProjectService.loadProject(projectId, queryLang).then((project) => {
        if (project) {
          docRevRef.current = project.rev || 0;
          const doc: any = project.document;
          if (doc && typeof doc === 'object') {
            if (doc.colorTheme) {
              setColorTheme(doc.colorTheme);
            }
          }
          if (doc && typeof doc === 'object' && (doc.docTitle || (Array.isArray(doc.sections) && doc.sections.length > 0))) {
            translatedDocsRef.current = {};
            isFirstPagesSyncRef.current = true;
            const activeLang = doc.language || queryLang || 'id';
            doc.language = activeLang;
            setAiDoc(doc as AiGenerateResult);
            setLanguage(activeLang);
            if (doc.colorTheme) setColorTheme(doc.colorTheme);
            if (doc.customAccentColor) setCustomAccentColor(doc.customAccentColor);
            const projTitle = project.name || doc.docTitle || 'Untitled Manual';
            setProjectName(projTitle);
            setCurrentProjectId(project.id);
            markAsSaved();
            return;
          }
          setAiDoc(null);
          if (project.document && Array.isArray(project.document.pages)) {
            loadDocument(project.document);
            setProjectName(project.name);
            setCurrentProjectId(project.id);
            if ((project.document as any).customAccentColor) {
              setCustomAccentColor((project.document as any).customAccentColor);
            }
            if (project.document.pages.length > 0) {
              setActivePageId(project.document.pages[0].id);
            }
            markAsSaved();
          }
        } else {
          // Load failed/empty: show a blank editor but DO NOT auto-save it —
          // persisting a default document here could wipe a real project when
          // the load failure was transient (server restart, network blip).
          const fallbackTitle = (projectId || '').replace(/^proj[-_]/i, '').replace(/[-_]/g, ' ') || 'Untitled Manual';
          setProjectName(fallbackTitle);
          setCurrentProjectId(projectId);
          setAiDoc(null);
          markAsSaved();
        }
      });
    } else {
      const newProjId = `proj-${Date.now()}`;
      setCurrentProjectId(newProjId);
      if (window.history.replaceState) {
        window.history.replaceState(null, '', `/editor/${newProjId}`);
      }
      if (!isViewer) {
        ProjectService.saveProject(projectName, document, newProjId, user?.email, undefined, colorTheme);
      }
      markAsSaved();
    }
  }, [projectId, location.state, location.search, isViewer]);

  const handleSave = async () => {
    if (isViewer) return;
    isSavingOrSyncingRef.current = true;
    setIsSaving(true);
    try {
      // Force-blur so pending contenteditable edits sync via handleBlur
      if (window.document.activeElement instanceof HTMLElement) {
        window.document.activeElement.blur();
      }
      // Read the absolute latest HTML from every rendered page in the DOM
      const latestPages = syncDomFnRef.current?.();
      const docToSave = aiDoc
        ? { ...aiDoc, colorTheme, customAccentColor, ...(latestPages && latestPages.length > 0 ? { pages: latestPages } : {}) }
        : { ...document, colorTheme, customAccentColor };
      // Keep aiDoc state in sync for subsequent operations (language switch, etc.)
      if (aiDoc && latestPages && latestPages.length > 0) {
        setAiDoc((prev) => (prev ? { ...prev, colorTheme, customAccentColor, pages: latestPages } : prev));
      }
      const projId = currentProjectId || `proj-${Date.now()}`;
      const project = await ProjectService.saveProject(projectName, docToSave as any, projId, user?.email, aiDoc ? language : undefined, colorTheme);
      if (!project.saved) {
        throw new Error('Server menolak atau tidak menerima request save');
      }
      setCurrentProjectId(project.id);
      markAsSaved();
      if (window.history.replaceState) {
        window.history.replaceState(null, '', `/editor/${project.id}?lang=${language}`);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      window.alert('Gagal menyimpan project — perubahanmu masih ada di editor, coba tekan Save lagi.');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        isSavingOrSyncingRef.current = false;
        markAsSaved();
      }, 150);
    }
  };

  const handlePageClick = (pageId: string) => {
    setActivePageId(pageId);
    const el = window.document.getElementById(`page-${pageId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDropBlock = (pageId: string, block: ContentBlock) => {
    if (isViewer) return;
    addBlock(pageId, block);
    setActivePageId(pageId);
  };

  const handleAiDocumentLoaded = async (res: AiGenerateResult) => {
    if (isViewer) return;
    translatedDocsRef.current = {};
    isFirstPagesSyncRef.current = true;
    setAiDoc(res);
    setLanguage(res.language || 'id');
    const newTitle = res.docTitle || 'AI Generated Manual';
    setProjectName(newTitle);
    const newProjId = (res as any)._saved_folder || `proj-${Date.now()}`;
    setCurrentProjectId(newProjId);
    await ProjectService.saveProject(newTitle, (res as any) || document, newProjId, user?.email, res.language || 'id');
    if (window.history.replaceState) {
      window.history.replaceState(null, '', `/editor/${newProjId}`);
    }
  };

  // Keep the ?lang= URL param in sync with the active language, so a reload
  // re-opens the same language variant instead of whatever was last saved.
  const syncLangInUrl = (lang: LanguageCode) => {
    if (currentProjectId && window.history.replaceState) {
      window.history.replaceState(null, '', `/editor/${currentProjectId}?lang=${lang}`);
    }
  };

  const handleChangeLanguage = async (lang: LanguageCode) => {
    if (!aiDoc || lang === language || isTranslating) return;

    // Force-blur so pending contenteditable edits sync to React state
    if (window.document.activeElement instanceof HTMLElement) {
      window.document.activeElement.blur();
    }
    // Read the absolute latest page HTML straight from the DOM
    const latestPages = syncDomFnRef.current?.();
    const currentAiDoc = latestPages && latestPages.length > 0
      ? { ...aiDoc, pages: latestPages }
      : aiDoc;
    // Keep aiDoc in sync
    if (latestPages && latestPages.length > 0) {
      setAiDoc((prev) => (prev ? { ...prev, pages: latestPages } : prev));
    }

    // Already fetched this session — switch instantly without another request.
    const cached = translatedDocsRef.current[lang];
    if (cached) {
      // Cache current version (with edits) before switching away
      translatedDocsRef.current[language] = currentAiDoc;
      setAiDoc(cached);
      setLanguage(lang);
      syncLangInUrl(lang);
      return;
    }

    if (!currentProjectId) {
      alert('Tunggu dokumen selesai tersimpan sebelum mengganti bahasa.');
      return;
    }

    setIsTranslating(true);
    setTranslatingTo(lang);
    try {
      // Cache the current version (with latest edits) before switching
      translatedDocsRef.current[language] = currentAiDoc;

      const translated = await TranslationService.translateProject(currentProjectId, lang, currentAiDoc, false);
      translatedDocsRef.current[lang] = translated;
      setAiDoc(translated);
      setLanguage(lang);
      syncLangInUrl(lang);
    } catch (e) {
      console.error('Failed to translate project', e);
      alert(`Gagal menerjemahkan dokumen: ${(e as Error).message}`);
    } finally {
      setIsTranslating(false);
      setTranslatingTo(null);
    }
  };

  // Handle back with auto-save


  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', background: '#0f1117', position: 'relative' }}>
      {/* Floating Mini-bar (top-right) */}
      <Toolbar
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportStatusText={exportStatusText}
        isDirty={!isViewer && (hasUnsavedChanges || isDirty)}
        isSaving={isSaving}
        isViewer={isViewer}
        onExportPdf={() => exportPdf(document, projectName)}
        onSave={isViewer ? undefined : handleSave}
        language={language}
        onChangeLanguage={aiDoc ? handleChangeLanguage : undefined}
        isTranslating={isTranslating}
        componentsOpen={componentsOpen}
      />

      {/* Left Sidebar — Always visible */}
      <LeftSidebar
        document={document}
        aiPages={aiDoc?.pages}
        isViewer={isViewer}
        onPageClick={handlePageClick}
        onSyncToc={isViewer ? undefined : () => {
          if (syncTocFnRef.current) syncTocFnRef.current();
        }}
      />

      {/* Right Sidebar — Always visible */}
      <RightSidebar
        isOpen={componentsOpen}
        isViewer={isViewer}
        onOpen={() => setComponentsOpen(true)}
        onAddBlock={(block, pageId) => {
          if (!isViewer) addBlock(pageId, block);
        }}
        activePageId={activePageId}
        onAiDocumentLoaded={isViewer ? undefined : handleAiDocumentLoaded}
        projectId={currentProjectId || projectId}
        onRegenerateToc={isViewer ? undefined : () => {
          if (syncTocFnRef.current) syncTocFnRef.current();
        }}
        onAutoSplitToc={isViewer ? undefined : () => {
          if (autoSplitTocFnRef.current) autoSplitTocFnRef.current();
        }}
        onReflow={isViewer ? undefined : () => {
          if (reflowFnRef.current) reflowFnRef.current();
        }}
        colorTheme={colorTheme}
        onChangeColorTheme={isViewer ? undefined : (t) => {
          setColorTheme(t);
          setCustomAccentColor(undefined);
          setHasUnsavedChanges(true);
        }}
        customAccentColor={customAccentColor}
        onChangeCustomAccentColor={isViewer ? undefined : (hex) => {
          setCustomAccentColor(hex);
          setHasUnsavedChanges(true);
        }}
      />

      {/* Main Content Area — Canvas for scrolling PDF pages */}
      <div style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        transition: 'margin-right 0.3s ease',
        marginLeft: 260,
        marginRight: componentsOpen ? 260 : 0,
      }}>
        {aiDoc ? (
          <HtmlDocViewer
            docTitle={aiDoc.docTitle || projectName}
            sections={activeSections}
            techLegend={aiDoc.tech_legend}
            language={language}
            colorTheme={colorTheme}
            customAccentColor={customAccentColor}
            initialPages={aiDoc.pages}
            isViewer={isViewer}
            onTitleChange={isViewer ? undefined : (t) => {
              setAiDoc((prev) => (prev ? { ...prev, docTitle: t } : prev));
              setHasUnsavedChanges(true);
            }}
            onUserEdit={isViewer ? undefined : () => setHasUnsavedChanges(true)}
            onPagesChange={(updatedPages) => {
              if (isFirstPagesSyncRef.current) {
                isFirstPagesSyncRef.current = false;
                setAiDoc((prev) => (prev ? { ...prev, pages: updatedPages } : prev));
                return;
              }

              setAiDoc((prev) => {
                if (!prev) return prev;
                const isIdentical =
                  prev.pages &&
                  prev.pages.length === updatedPages.length &&
                  prev.pages.every((p, i) => p.id === updatedPages[i]?.id && p.html === updatedPages[i]?.html);

                if (isIdentical) {
                  return prev;
                }

                if (!isViewer && !isSavingOrSyncingRef.current && Date.now() - lastSaveTimestampRef.current > 1200) {
                  setHasUnsavedChanges(true);
                }

                return { ...prev, pages: updatedPages };
              });
            }}
            onRegisterAddChapter={(fn: () => void) => { addChapterFnRef.current = fn; }}
            onRegisterAddSubhead={(fn: () => void) => { addSubheadFnRef.current = fn; }}
            onRegisterSyncToc={(fn: () => void) => { syncTocFnRef.current = fn; }}
            onRegisterAutoSplitToc={(fn: () => void) => { autoSplitTocFnRef.current = fn; }}
            onRegisterReflow={(fn: () => void) => { reflowFnRef.current = fn; }}
            onRegisterSyncDom={(fn) => { syncDomFnRef.current = fn; }}
          />
        ) : (
          <PdfPageCanvas
            document={document}
            activePageId={activePageId}
            isViewer={isViewer}
            onSetActivePage={setActivePageId}
            onUpdateBlock={isViewer ? () => {} : updateBlock}
            onRemoveBlock={isViewer ? () => {} : removeBlock}
            onDropBlock={isViewer ? () => {} : handleDropBlock}
            onUpdatePage={isViewer ? () => {} : updatePage}
            onUpdateMeta={isViewer ? undefined : updateMeta}
            onUpdateToc={isViewer ? undefined : updateToc}
            onDeletePage={isViewer ? undefined : removePage}
            onAddCoverPage={isViewer ? undefined : addCoverPage}
          />
        )}
      </div>

      {isTranslating && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 17, 23, 0.75)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, gap: 16,
        }}>
          <svg className="animate-spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600 }}>
            Menerjemahkan dokumen ke {LANGUAGE_LABELS[translatingTo || language]}...
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, maxWidth: 320, textAlign: 'center' }}>
            Proses ini bisa memakan waktu beberapa menit tergantung panjang dokumen.
          </div>
        </div>
      )}
    </div>
  );
}
