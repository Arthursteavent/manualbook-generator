import type { ManualDocument, ManualPage, ContentBlock, TocItem } from '../types/manual.types';

/**
 * DocxParser — converts a .docx file to ManualDocument using mammoth.
 * Mammoth converts the document to HTML so real structure survives:
 * Word Heading 1–5 styles arrive as <h1>–<h5>, native numbered lists as
 * <ol><li> (even when no number exists in the text), bullets as <ul>,
 * and images as inline <img> with data URIs.
 */

const LINES_PER_PAGE = 12;

const SUBHEAD_KIND_BY_LEVEL: Record<number, 'subtitle' | 'sub-subtitle' | 'sub-sub-subtitle' | 'sub-sub-sub-subtitle'> = {
  2: 'subtitle',
  3: 'sub-subtitle',
  4: 'sub-sub-subtitle',
  5: 'sub-sub-sub-subtitle',
};

const BULLET_PREFIX = /^(?:\[BULLET\]|•|\-|\*|▪|▫|◦|⁃|–|—|•|●|○|▪|▫|–|—|‣|▶|◀)\s*/;

export class DocxParser {
  static async parse(file: File): Promise<ManualDocument> {
    const mammoth = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value as string;

    return DocxParser.htmlToManual(html, file.name);
  }

  private static htmlToManual(html: string, filename: string): ManualDocument {
    const body = new DOMParser().parseFromString(html, 'text/html').body;
    const els = Array.from(body.children) as HTMLElement[];
    const textOf = (el: Element): string => (el.textContent || '').replace(/\s+/g, ' ').trim();

    // Cover meta: first three non-empty plain paragraphs — same as the first
    // three lines in the previous raw-text flow.
    const metaTexts: string[] = [];
    let cursor = 0;
    while (cursor < els.length && metaTexts.length < 3) {
      const el = els[cursor];
      if (el.tagName !== 'P' || el.querySelector('img')) break;
      const txt = textOf(el);
      cursor++;
      if (txt) metaTexts.push(txt);
    }

    const rest = els.slice(cursor);
    const hasHeadings = rest.some((el) => /^H[1-5]$/.test(el.tagName));
    const firstHeadingEl = hasHeadings ? rest.find((el) => /^H[1-5]$/.test(el.tagName)) : undefined;

    const title = metaTexts[0] || (firstHeadingEl ? textOf(firstHeadingEl) : '') || filename.replace(/\.docx$/i, '');
    const company = metaTexts[1] || '';
    const subtitle = metaTexts[2] || '';

    const toc: TocItem[] = [];
    const blockToToc = new Map<ContentBlock, number>();

    interface Chapter {
      title: string;
      tocIdx: number | null;
      blocks: ContentBlock[];
    }
    const chapters: Chapter[] = [];
    let current: Chapter | null = null;
    const ensureChapter = (): Chapter => {
      if (!current) {
        current = { title: '', tocIdx: null, blocks: [] };
        chapters.push(current);
      }
      return current;
    };

    // TOC entries from headings use hierarchical counters (1, 1.1, 1.1.1, …).
    const headingCounters = [0, 0, 0, 0, 0];
    const addTocEntry = (level: number, text: string): number => {
      headingCounters[level - 1] += 1;
      for (let i = level; i < headingCounters.length; i++) headingCounters[i] = 0;
      const number = headingCounters.slice(0, level).filter((n) => n > 0).join('.');
      toc.push({
        id: `toc-${toc.length + 1}`,
        number,
        title: text,
        pageNumber: '00',
        style: toc.length % 2 === 1 ? 'transparent' : 'white',
        level,
      });
      return toc.length - 1;
    };

    // <ol>/<ul> → steps / bullet-list blocks. Numbers come from a typed
    // "N." prefix when present, otherwise from the item's list position.
    const listToBlocks = (listEl: HTMLElement): ContentBlock[] => {
      const out: ContentBlock[] = [];
      const nested: HTMLElement[] = [];
      const lis = Array.from(listEl.children).filter((c) => c.tagName === 'LI') as HTMLElement[];
      const ownText = (li: HTMLElement): string => {
        const clone = li.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('ol, ul').forEach((n) => n.remove());
        Array.from(li.children).forEach((c) => {
          if (c.tagName === 'OL' || c.tagName === 'UL') nested.push(c as HTMLElement);
        });
        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
      };

      if (listEl.tagName === 'OL') {
        const start = parseInt(listEl.getAttribute('start') || '1', 10) || 1;
        const items: string[] = [];
        const numbers: string[] = [];
        lis.forEach((li, idx) => {
          let txt = ownText(li);
          const typed = txt.match(/^(\d+)[\.\)]\s*(.+)$/);
          if (typed) {
            numbers.push(typed[1]);
            txt = typed[2];
          } else {
            numbers.push(String(start + idx));
          }
          items.push(txt);
        });
        if (items.some(Boolean)) out.push({ kind: 'steps', items, numbers });
      } else {
        const items = lis
          .map((li) => ownText(li).replace(BULLET_PREFIX, ''))
          .filter(Boolean);
        if (items.length > 0) out.push({ kind: 'bullet-list', items });
      }

      nested.forEach((n) => out.push(...listToBlocks(n)));
      return out;
    };

    const tableToBlock = (tableEl: HTMLElement): ContentBlock | null => {
      const trs = Array.from(tableEl.querySelectorAll('tr'));
      if (trs.length === 0) return null;
      const rowTexts = trs.map((tr) => Array.from(tr.querySelectorAll('td, th')).map((c) => textOf(c)));
      const firstIsHeader = trs[0].querySelector('th') !== null;
      return {
        kind: 'table',
        headers: firstIsHeader ? rowTexts[0] : undefined,
        rows: firstIsHeader ? rowTexts.slice(1) : rowTexts,
      };
    };

    // Consecutive typed-number / bullet paragraphs merge into a single list
    // block (mirrors the old line-grouping behaviour).
    let stepItems: string[] = [];
    let stepNumbers: string[] = [];
    let bulletItems: string[] = [];
    const flushLists = () => {
      if (stepItems.length > 0) {
        ensureChapter().blocks.push({ kind: 'steps', items: stepItems, numbers: stepNumbers });
        stepItems = [];
        stepNumbers = [];
      }
      if (bulletItems.length > 0) {
        ensureChapter().blocks.push({ kind: 'bullet-list', items: bulletItems });
        bulletItems = [];
      }
    };

    for (const el of rest) {
      const tag = el.tagName;

      const hm = tag.match(/^H([1-6])$/);
      if (hm && hasHeadings) {
        flushLists();
        const level = Math.min(parseInt(hm[1], 10), 5);
        const text = textOf(el);
        if (!text) continue;
        if (level === 1) {
          current = { title: text, tocIdx: addTocEntry(1, text), blocks: [] };
          chapters.push(current);
        } else {
          const block: ContentBlock = { kind: SUBHEAD_KIND_BY_LEVEL[level], text };
          const tocIdx = addTocEntry(level, text);
          ensureChapter().blocks.push(block);
          blockToToc.set(block, tocIdx);
        }
        continue;
      }

      if (tag === 'OL' || tag === 'UL') {
        flushLists();
        ensureChapter().blocks.push(...listToBlocks(el));
        continue;
      }

      if (tag === 'TABLE') {
        flushLists();
        const tb = tableToBlock(el);
        if (tb) ensureChapter().blocks.push(tb);
        continue;
      }

      const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
      if (imgs.length > 0) {
        flushLists();
        imgs.forEach((img) => {
          const src = img.getAttribute('src') || '';
          if (src) ensureChapter().blocks.push({ kind: 'image', src, caption: img.getAttribute('alt') || '' });
        });
      }

      const line = textOf(el);
      if (!line) continue;

      // Legacy TOC heuristic — only for documents without Word heading styles,
      // and only on plain paragraphs (never list items).
      if (!hasHeadings) {
        const numbered = line.match(/^(\d+)\.\s+(.+)/);
        if (numbered && line.length < 80) {
          const idx = toc.length + 1;
          toc.push({
            id: `toc-${idx}`,
            number: String(idx),
            title: numbered[2],
            pageNumber: String(idx + 2).padStart(2, '0'),
            style: idx % 2 === 0 ? 'transparent' : 'white',
          });
          continue;
        }
      }

      const cleanLine = line.replace(BULLET_PREFIX, '');
      const stepMatch = cleanLine.match(/^(?:(\d+)[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))[\:\.\-]?\s*(.*)/i);
      if (stepMatch && !cleanLine.match(/^(gambar|figure|fig\.)\s+\d/i)) {
        if (bulletItems.length > 0) flushLists();
        stepNumbers.push(stepMatch[1] || stepMatch[2] || String(stepItems.length + 1));
        stepItems.push((stepMatch[3] || '').trim() || cleanLine);
        continue;
      }

      if (BULLET_PREFIX.test(line)) {
        if (stepItems.length > 0) flushLists();
        if (cleanLine) {
          bulletItems.push(cleanLine);
          continue;
        }
      }

      flushLists();

      if (line.match(/^#+\s+(.+)/) || line.match(/^(sub\s*bab|bab)\s*\d+/i)) {
        ensureChapter().blocks.push({ kind: 'subtitle', text: line.replace(/^#+\s+/, '') });
      } else {
        ensureChapter().blocks.push({ kind: 'paragraph', html: line });
      }
    }
    flushLists();

    // ─── Pagination ─────────────────────────────────────────────────────────
    const pages: ManualPage[] = [];

    pages.push({
      id: 'p1',
      type: 'cover',
      blocks: [],
      footerPage: '01',
    });

    pages.push({
      id: 'p2',
      type: 'toc',
      blocks: [],
      footerBrand: company || title,
      footerPage: '02',
    });

    let pageIndex = 3;
    if (hasHeadings) {
      // Each h1 chapter starts a new page; long chapters split per ~12 blocks.
      chapters.forEach((ch, ci) => {
        const chunks: ContentBlock[][] = [];
        for (let i = 0; i < ch.blocks.length; i += LINES_PER_PAGE) {
          chunks.push(ch.blocks.slice(i, i + LINES_PER_PAGE));
        }
        if (chunks.length === 0) chunks.push([]);

        chunks.forEach((chunk, chunkIdx) => {
          const footerPage = String(pageIndex).padStart(2, '0');
          if (chunkIdx === 0 && ch.tocIdx !== null) toc[ch.tocIdx].pageNumber = footerPage;
          chunk.forEach((b) => {
            const ti = blockToToc.get(b);
            if (ti !== undefined) toc[ti].pageNumber = footerPage;
          });
          pages.push({
            id: `p${pageIndex}`,
            type: 'content',
            chapterNumber: String(ci + 1),
            chapterLabel: `Chapter ${ci + 1}`,
            chapterName: ch.title,
            footerBrand: company || title,
            footerPage,
            blocks: chunk,
          });
          pageIndex++;
        });
      });
    } else {
      // Legacy behaviour: group all content into pages of ~12 blocks.
      const allBlocks = chapters.flatMap((c) => c.blocks);
      for (let i = 0; i < allBlocks.length; i += LINES_PER_PAGE) {
        pages.push({
          id: `p${pageIndex}`,
          type: 'content',
          chapterNumber: String(pageIndex - 2),
          chapterLabel: `Chapter ${pageIndex - 2}`,
          chapterName: toc[pageIndex - 3]?.title || '',
          footerBrand: company || title,
          footerPage: String(pageIndex).padStart(2, '0'),
          blocks: allBlocks.slice(i, i + LINES_PER_PAGE),
        });
        pageIndex++;
      }
    }

    return {
      meta: {
        title,
        subtitle,
        company,
        coverStyle: 'premium',
        coverGlowEnabled: true,
        footerBrand: company || title,
      },
      toc,
      pages,
    };
  }
}
