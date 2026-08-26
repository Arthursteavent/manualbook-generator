import { useState, useCallback } from 'react';
import type { ManualDocument, ManualPage, ContentBlock, TocItem } from '../types/manual.types';

export const DEFAULT_DOCUMENT: ManualDocument = {
  meta: {
    title: 'Manual Book',
    subtitle: '',
    company: 'Company Name',
    coverStyle: 'premium',
    coverGlowEnabled: true,
    coverGlowSize: 140,
    coverGlowColor: '#00d2ff',
    footerBrand: 'Company Name',
  },
  toc: [
    { id: 'toc-1', number: '1', title: 'Introduction', pageNumber: '03', style: 'white' },
    { id: 'toc-2', number: '2', title: 'Getting Started', pageNumber: '04', style: 'transparent' },
  ],
  pages: [
    {
      id: 'p1',
      type: 'cover',
      blocks: [],
      footerPage: '01',
    },
    {
      id: 'p2',
      type: 'toc',
      blocks: [],
      footerBrand: 'Company Name',
      footerPage: '02',
    },
    {
      id: 'p3',
      type: 'content',
      chapterNumber: '1',
      chapterLabel: 'Chapter 1',
      chapterName: 'Introduction',
      footerBrand: 'Company Name',
      footerPage: '03',
      blocks: [
        {
          kind: 'section-title',
          text: 'Welcome',
          accentColor: '#00d2ff',
        },
        {
          kind: 'paragraph',
          html: 'This is the introduction section. Click any text to edit it.',
        },
        {
          kind: 'image',
          size: 'large',
          caption: 'Figure 1',
        },
      ],
    },
  ],
};

export function useManualEditor(initialDocument?: ManualDocument) {
  const [document, setDocument] = useState<ManualDocument>(
    initialDocument || DEFAULT_DOCUMENT
  );
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const loadDocument = useCallback((doc: ManualDocument) => {
    setDocument(doc);
    setIsDirty(false);
  }, []);

  const updateMeta = useCallback(
    (updates: Partial<ManualDocument['meta']>) => {
      setDocument((prev) => ({
        ...prev,
        meta: { ...prev.meta, ...updates },
      }));
      markDirty();
    },
    [markDirty]
  );

  const updateToc = useCallback(
    (toc: TocItem[]) => {
      setDocument((prev) => ({ ...prev, toc }));
      markDirty();
    },
    [markDirty]
  );

  const updatePage = useCallback(
    (pageId: string, updates: Partial<ManualPage>) => {
      setDocument((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
      }));
      markDirty();
    },
    [markDirty]
  );

  const updateBlock = useCallback(
    (pageId: string, blockIndex: number, block: ContentBlock) => {
      setDocument((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = [...p.blocks];
          blocks[blockIndex] = block;
          return { ...p, blocks };
        }),
      }));
      markDirty();
    },
    [markDirty]
  );

  const addBlock = useCallback(
    (pageId: string, block: ContentBlock, afterIndex?: number) => {
      setDocument((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = [...p.blocks];
          const idx = afterIndex !== undefined ? afterIndex + 1 : blocks.length;
          blocks.splice(idx, 0, block);
          return { ...p, blocks };
        }),
      }));
      markDirty();
    },
    [markDirty]
  );

  const removeBlock = useCallback(
    (pageId: string, blockIndex: number) => {
      setDocument((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          const blocks = p.blocks.filter((_, i) => i !== blockIndex);
          return { ...p, blocks };
        }),
      }));
      markDirty();
    },
    [markDirty]
  );

  const addPage = useCallback(() => {
    setDocument((prev) => {
      const pageNum = prev.pages.length + 1;
      const newPage: ManualPage = {
        id: `p${pageNum}-${Date.now()}`,
        type: 'content',
        chapterNumber: String(pageNum - 2),
        chapterLabel: `Chapter ${pageNum - 2}`,
        chapterName: 'New Chapter',
        footerBrand: prev.meta.footerBrand || prev.meta.company || '',
        footerPage: String(pageNum).padStart(2, '0'),
        blocks: [
          { kind: 'paragraph', html: 'New page content. Click to edit.' },
        ],
      };
      return { ...prev, pages: [...prev.pages, newPage] };
    });
    markDirty();
  }, [markDirty]);

  const removePage = useCallback(
    (pageId: string) => {
      setDocument((prev) => ({
        ...prev,
        pages: prev.pages.filter((p) => p.id !== pageId),
      }));
      markDirty();
    },
    [markDirty]
  );

  const addCoverPage = useCallback(() => {
    setDocument((prev) => {
      if (prev.pages.some((p) => p.type === 'cover')) return prev;
      const coverPage: ManualPage = {
        id: `cover-${Date.now()}`,
        type: 'cover',
        blocks: [],
        footerPage: '01',
      };
      return { ...prev, pages: [coverPage, ...prev.pages] };
    });
    markDirty();
  }, [markDirty]);

  const clearDirty = useCallback(() => setIsDirty(false), []);

  return {
    document,
    isDirty,
    loadDocument,
    updateMeta,
    updateToc,
    updatePage,
    updateBlock,
    addBlock,
    removeBlock,
    addPage,
    removePage,
    addCoverPage,
    clearDirty,
  };
}
