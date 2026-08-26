import { useState, useCallback, useRef } from 'react';
import type { ManualDocument } from '../types/manual.types';
import type { TemplateId } from '../types/template.types';

/**
 * HIGH-FIDELITY PDF EXPORT STRATEGY
 * =================================
 * Engine: html-to-image (toPng) with fallback to html2canvas & jsPDF.
 *
 * Why html-to-image?
 * 1) It renders DOM elements via native browser SVG <foreignObject>.
 * 2) It inlines all <img> tags, styles, and fonts as base64 data URIs.
 * 3) The browser's native rendering engine draws the result onto high-DPI Canvas.
 * 4) All images, flexbox layouts, text formatting, and borders are captured 100% pixel-perfect.
 */

interface UsePdfExportReturn {
  isExporting: boolean;
  exportProgress: number;
  exportStatusText: string;
  showTemplateSelector: boolean;
  selectedTemplate: TemplateId;
  setSelectedTemplate: (template: TemplateId) => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  exportPdf: (document: ManualDocument, filename?: string) => Promise<void>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface PreparedImgRef {
  img: HTMLImageElement;
  origSrc: string;
}

/**
 * Ensures all <img> elements on the page are fully loaded, decoded, and converted to base64 Data URLs.
 * Tracks modified image src attributes so they can be restored after export to free RAM.
 */
async function preparePageImages(pageEl: HTMLElement, restoredRefs: PreparedImgRef[]): Promise<void> {
  const imgs = Array.from(pageEl.querySelectorAll('img'));

  await Promise.all(
    imgs.map(async (img) => {
      try {
        if (!img.complete) {
          await img.decode().catch(() => {});
        }

        const src = img.getAttribute('src') || '';
        if (!src) return;

        if (!src.startsWith('data:')) {
          try {
            const w = img.naturalWidth || img.clientWidth || 400;
            const h = img.naturalHeight || img.clientHeight || 300;
            const cvs = document.createElement('canvas');
            cvs.width = w;
            cvs.height = h;
            const ctx = cvs.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const dataUrl = cvs.toDataURL('image/jpeg', 0.85);
              restoredRefs.push({ img, origSrc: src });
              img.setAttribute('src', dataUrl);
            }
          } catch {
            try {
              const res = await fetch(src, { mode: 'cors' });
              if (res.ok) {
                const blob = await res.blob();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                restoredRefs.push({ img, origSrc: src });
                img.setAttribute('src', dataUrl);
              }
            } catch {}
          }
        }

        const isCoverImg = Boolean(
          img.closest('.page-cover') ||
          img.closest('[id*="cover"]') ||
          pageEl.classList.contains('page-cover') ||
          pageEl.getAttribute('id')?.includes('cover') ||
          (img.getAttribute('alt') || '').toLowerCase().includes('cover')
        );

        if (isCoverImg) {
          img.style.setProperty('width', '100%', 'important');
          img.style.setProperty('height', '100%', 'important');
          img.style.setProperty('max-width', '100%', 'important');
          img.style.setProperty('max-height', '100%', 'important');
          img.style.display = 'block';
          img.style.visibility = 'visible';
          img.style.opacity = '1';
          return;
        }

        if (!img.style.maxWidth || img.style.maxWidth === '100%' || img.style.maxWidth === '670px' || img.style.maxWidth === '540px' || img.style.maxWidth === '550px' || img.style.maxWidth === '500px' || img.style.maxWidth === '640px' || img.style.maxWidth === '580px') {
          img.style.maxWidth = '480px';
        }
        if (!img.style.maxHeight || img.style.maxHeight === '195px' || img.style.maxHeight === '420px' || img.style.maxHeight === '300px' || img.style.maxHeight === '270px' || img.style.maxHeight === '320px' || img.style.maxHeight === '480px' || img.style.maxHeight === '380px') {
          img.style.maxHeight = '260px';
        }
        img.style.setProperty('width', 'auto', 'important');
        img.style.setProperty('height', 'auto', 'important');
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
      } catch (err) {
        console.warn('[PDF Export] Failed processing image element:', err);
      }
    }),
  );
}

export function usePdfExport(): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('default');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const openTemplateSelector = useCallback(() => {
    setShowTemplateSelector(true);
  }, []);

  const closeTemplateSelector = useCallback(() => {
    setShowTemplateSelector(false);
  }, []);

  const exportPdf = useCallback(
    async (document: ManualDocument, filename?: string) => {
      setIsExporting(true);
      setExportProgress(5);
      setExportStatusText('Menyiapkan dokumen & font...');
      setShowTemplateSelector(false);

      const restoredImgs: PreparedImgRef[] = [];

      try {
        const { jsPDF } = await import('jspdf');
        const { toJpeg, getFontEmbedCSS } = await import('html-to-image');
        const html2canvas = (await import('html2canvas')).default;
        const { getTemplate } = await import('../templates/index');
        const template = getTemplate(selectedTemplate);

        let pages = Array.from(
          window.document.querySelectorAll<HTMLElement>('[data-inner-page="true"]'),
        );

        if (pages.length === 0) {
          pages = Array.from(
            window.document.querySelectorAll<HTMLElement>(
              '.pdf-pages > .page, .page-content-wrapper > .page, .page',
            ),
          );
        }

        let tempParent: HTMLDivElement | null = null;
        if (pages.length === 0) {
          tempParent = window.document.createElement('div');
          tempParent.style.cssText =
            'position:fixed;left:-99999px;top:0;width:794px;z-index:-1;background:#fff;';
          window.document.body.appendChild(tempParent);
          template.render(document, tempParent);
          pages = Array.from(
            tempParent.querySelectorAll<HTMLElement>('.pdf-page-unit, .page'),
          );
        }

        if (pages.length === 0) {
          throw new Error('No printable pages found in document.');
        }

        console.log(`[PDF Export] Starting low-memory export for ${pages.length} pages...`);

        try {
          await window.document.fonts.ready;
        } catch {}

        await new Promise((r) => setTimeout(r, 150));

        if (window.document.activeElement instanceof HTMLElement) {
          window.document.activeElement.blur();
        }
        const exportStyleEl = window.document.createElement('style');
        exportStyleEl.id = 'pdf-export-outline-reset';
        exportStyleEl.textContent = `
          .editable-text:not(.chapter-num), [contenteditable="true"]:not(.chapter-num),
          .editable-text:not(.chapter-num):hover, [contenteditable="true"]:not(.chapter-num):hover,
          .editable-text:not(.chapter-num):focus, [contenteditable="true"]:not(.chapter-num):focus {
            outline: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
          }
          .chapter-num {
            outline: none !important;
            box-shadow: none !important;
          }
          [data-inner-page="true"], .page, .page-content, .grid-page {
            border-radius: 0px !important;
            box-shadow: none !important;
            outline: none !important;
          }
          .legend-container table th[data-editor-ui],
          .legend-container table td:last-child,
          .document-table th[data-editor-ui],
          .document-table td[data-editor-ui],
          table th[data-editor-ui],
          table td[data-editor-ui] {
            display: none !important;
            width: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .legend-container {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .legend-container table {
            width: 100% !important;
            table-layout: fixed !important;
          }
          .document-table-container,
          .legend-container,
          .legend-container div,
          .table-frame,
          table,
          .document-table {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            max-height: none !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0px !important;
            height: 0px !important;
            background: transparent !important;
          }
          * {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `;
        window.document.head.appendChild(exportStyleEl);

        const hiddenUIElements: { el: HTMLElement; origDisplay: string }[] = [];
        window.document
          .querySelectorAll<HTMLElement>(
            '.floating-block-controls, .element-controls, .del-btn, .delete-page-btn, [data-editor-ui], .block-hover-controls, .toolbar, header, nav',
          )
          .forEach((el) => {
            hiddenUIElements.push({ el, origDisplay: el.style.display });
            el.style.display = 'none';
          });

        let pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Step 1: Pre-process images across all pages
        setExportProgress(12);
        setExportStatusText('Memproses gambar & aset dokumen...');
        await Promise.all(pages.map((pg) => preparePageImages(pg, restoredImgs)));
        await new Promise((r) => setTimeout(r, 40));

        // Step 2: Render pages in controlled batch size of 2 to keep memory usage low
        const A4_W = 794;
        const actualH = 1123;
        const BATCH_SIZE = 2;

        // Compute font-embed CSS once; without this, toJpeg re-scans all
        // stylesheets and re-inlines every web font on each page render.
        let cachedFontCSS: string | undefined;
        try {
          cachedFontCSS = await getFontEmbedCSS(pages[0]);
        } catch (fontErr) {
          console.warn('[PDF Export] getFontEmbedCSS failed, falling back to per-page embedding:', fontErr);
        }

        const renderSinglePage = async (pg: HTMLElement, pageIdx: number): Promise<string> => {
          const origRadius = pg.style.borderRadius;
          const origShadow = pg.style.boxShadow;
          pg.style.borderRadius = '0px';
          pg.style.boxShadow = 'none';

          let pageDataUrl = '';
          try {
            pageDataUrl = await toJpeg(pg, {
              quality: 0.90,
              pixelRatio: 1.6,
              fontEmbedCSS: cachedFontCSS,
              width: A4_W,
              height: actualH,
              backgroundColor: '#ffffff',
              filter: (node: HTMLElement) => {
                if (!node.classList) return true;
                const cl = node.classList;
                if (
                  cl.contains('floating-block-controls') ||
                  cl.contains('element-controls') ||
                  cl.contains('del-btn') ||
                  cl.contains('delete-page-btn') ||
                  node.hasAttribute('data-editor-ui') ||
                  (node.tagName === 'INPUT' && (node as HTMLInputElement).type === 'file')
                ) {
                  return false;
                }
                return true;
              },
            });
          } catch (err) {
            console.warn(`[PDF Export] Page ${pageIdx + 1} html-to-image failed, falling back to html2canvas:`, err);
            const canvas = await html2canvas(pg, {
              scale: 1.6,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff',
              width: A4_W,
              height: actualH,
              windowWidth: A4_W,
              scrollX: 0,
              scrollY: -window.scrollY,
            });
            pageDataUrl = canvas.toDataURL('image/jpeg', 0.90);
          } finally {
            pg.style.borderRadius = origRadius;
            pg.style.boxShadow = origShadow;
          }
          return pageDataUrl;
        };

        for (let i = 0; i < pages.length; i += BATCH_SIZE) {
          const batchPages = pages.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batchPages.map((pg, idxInBatch) => renderSinglePage(pg, i + idxInBatch)),
          );

          for (let b = 0; b < batchResults.length; b++) {
            const pageIdx = i + b;
            const dataUrl = batchResults[b];
            if (pageIdx > 0) {
              pdf.addPage('a4', 'portrait');
            }
            if (dataUrl) {
              const pdfW = pdf.internal.pageSize.getWidth();  // 210 mm
              const pdfH = pdf.internal.pageSize.getHeight(); // 297 mm
              pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
            }
          }
          batchResults.length = 0;

          const processed = Math.min(pages.length, i + batchPages.length);
          const pct = Math.round(15 + (processed / pages.length) * 75);
          setExportProgress(pct);
          setExportStatusText(`Merasterisasi halaman ${processed}/${pages.length} (${pct}%)...`);
          await new Promise((r) => setTimeout(r, 20));
        }

        // Step 3: Save PDF File
        setExportProgress(95);
        setExportStatusText('Mengunduh file PDF...');
        const safeName = (filename || document.meta.title || 'manual')
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9\-_]/g, '');

        const pdfFilename = `${safeName}.pdf`;
        pdf.save(pdfFilename);
        console.log(`[PDF Export] Export completed successfully: ${pdfFilename}`);
        setExportProgress(100);
        setExportStatusText('Export Selesai!');

        // Stream posting PDF to backend using chunked base64 to avoid memory spikes
        const savedFolder = (document as any)._saved_folder;
        if (savedFolder) {
          try {
            const pdfBlob = pdf.output('blob');
            const rawDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(pdfBlob);
            });
            // Normalize the prefix so the payload matches what /api/save-pdf expects
            const pdfBase64 =
              'data:application/pdf;base64,' + rawDataUrl.slice(rawDataUrl.indexOf(',') + 1);

            await fetch('/api/save-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                folder_name: savedFolder,
                pdf_base64: pdfBase64,
                filename: pdfFilename,
              }),
            });
          } catch (saveErr) {
            console.warn('[PDF Export] Failed posting PDF to server:', saveErr);
          }
        }

        // Restore UI
        hiddenUIElements.forEach(({ el, origDisplay }) => {
          el.style.display = origDisplay;
        });
        exportStyleEl.remove();

        if (tempParent) {
          window.document.body.removeChild(tempParent);
        }
      } catch (err) {
        console.error('[PDF Export] PDF export failed:', err);
        window.document
          .querySelectorAll<HTMLElement>(
            '.floating-block-controls, .element-controls, .del-btn, .delete-page-btn, [data-editor-ui], .block-hover-controls',
          )
          .forEach((el) => {
            el.style.display = '';
          });
        window.document.getElementById('pdf-export-outline-reset')?.remove();
      } finally {
        // Restore original image srcs to free RAM immediately
        restoredImgs.forEach(({ img, origSrc }) => {
          try {
            img.setAttribute('src', origSrc);
          } catch {}
        });
        restoredImgs.length = 0;

        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          setExportStatusText('');
        }, 300);
      }
    },
    [selectedTemplate],
  );

  return {
    isExporting,
    exportProgress,
    exportStatusText,
    showTemplateSelector,
    selectedTemplate,
    setSelectedTemplate,
    openTemplateSelector,
    closeTemplateSelector,
    exportPdf,
    containerRef,
  };
}

