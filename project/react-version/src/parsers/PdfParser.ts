import type { ManualDocument, ManualPage, ContentBlock, TocItem } from '../types/manual.types';

/**
 * PdfParser — extracts text from a PDF using pdfjs-dist and converts to
 * ManualDocument using the same heuristic as DocxParser.
 */
export class PdfParser {
  static async parse(file: File): Promise<ManualDocument> {
    const pdfjsLib = await import('pdfjs-dist');

    // Set the worker source — use CDN for simplicity
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageText);
    }

    const fullText = pageTexts.join('\n');
    return PdfParser.textToManual(fullText, file.name);
  }

  private static textToManual(text: string, filename: string): ManualDocument {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const title = lines[0] || filename.replace(/\.pdf$/i, '');
    const company = lines[1] || '';
    const subtitle = lines[2] || '';

    const toc: TocItem[] = [];
    const contentLines: string[] = [];
    let tocIndex = 0;

    lines.slice(3).forEach((line) => {
      const numbered = line.match(/^(\d+)\.\s+(.+)/);
      if (numbered && line.length < 80) {
        tocIndex++;
        toc.push({
          id: `toc-${tocIndex}`,
          number: String(tocIndex),
          title: numbered[2],
          pageNumber: String(tocIndex + 2).padStart(2, '0'),
          style: tocIndex % 2 === 0 ? 'transparent' : 'white',
        });
      } else {
        contentLines.push(line);
      }
    });

    const parseLinesToBlocks = (linesChunk: string[]): ContentBlock[] => {
      const blocks: ContentBlock[] = [];
      let bulletItems: string[] = [];
      let numberedItems: string[] = [];

      const flushLists = () => {
        if (bulletItems.length > 0) {
          const lisHtml = bulletItems.map(item => `<li contenteditable="true" style="margin-bottom:6px; outline:none; cursor:text;">${item}</li>`).join('');
          blocks.push({
            kind: 'bullet-list',
            items: [...bulletItems],
            html: lisHtml
          });
          bulletItems = [];
        }
        if (numberedItems.length > 0) {
          const lisHtml = numberedItems.map(item => `<li contenteditable="true" style="margin-bottom:6px; outline:none; cursor:text;">${item}</li>`).join('');
          blocks.push({
            kind: 'numbered-list',
            items: [...numberedItems],
            html: lisHtml
          });
          numberedItems = [];
        }
      };

      for (const line of linesChunk) {
        const stepMatch = line.match(/^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))[\:\.\-]?\s*(.*)/i);
        if (stepMatch && !line.match(/^(gambar|figure|fig\.)\s+\d/i)) {
          if (bulletItems.length > 0) flushLists();
          const cleanStepText = stepMatch[1].trim() || line;
          numberedItems.push(cleanStepText);
          continue;
        }

        const bulletMatch = line.match(/^(?:\[BULLET\]|•|\-|\*|▪|▫|◦|⁃|–|—|\u2022|\u25cf|\u25cb|\u25aa|\u25ab|\u2013|\u2014|\u2023|\u25b6|\u25c0)\s*(.*)/);
        if (bulletMatch) {
          if (numberedItems.length > 0) flushLists();
          const cleanItem = bulletMatch[1].trim();
          if (cleanItem) {
            bulletItems.push(cleanItem);
            continue;
          }
        }

        flushLists();

        if (line.match(/^#+\s+(.+)/) || line.match(/^(sub\s*bab|bab)\s*\d+/i)) {
          blocks.push({
            kind: 'subtitle',
            text: line.replace(/^#+\s+/, '')
          });
        } else {
          blocks.push({
            kind: 'paragraph',
            html: line
          });
        }
      }

      flushLists();
      return blocks;
    };

    const pages: ManualPage[] = [];

    pages.push({ id: 'p1', type: 'cover', blocks: [], footerPage: '01' });
    pages.push({
      id: 'p2',
      type: 'toc',
      blocks: [],
      footerBrand: company || title,
      footerPage: '02',
    });

    const LINES_PER_PAGE = 12;
    let pageIndex = 3;
    for (let i = 0; i < contentLines.length; i += LINES_PER_PAGE) {
      const chunk = contentLines.slice(i, i + LINES_PER_PAGE);
      const blocks: ContentBlock[] = parseLinesToBlocks(chunk);
      pages.push({
        id: `p${pageIndex}`,
        type: 'content',
        chapterNumber: String(pageIndex - 2),
        chapterLabel: `Chapter ${pageIndex - 2}`,
        chapterName: toc[pageIndex - 3]?.title || '',
        footerBrand: company || title,
        footerPage: String(pageIndex).padStart(2, '0'),
        blocks,
      });
      pageIndex++;
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
