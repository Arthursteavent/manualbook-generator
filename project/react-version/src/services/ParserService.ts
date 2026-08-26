import type { ManualDocument, LanguageCode } from '../types/manual.types';
import { DocxParser } from '../parsers/DocxParser';
import { PdfParser } from '../parsers/PdfParser';
import { JsonParser } from '../parsers/JsonParser';

export type SupportedFileType = 'docx' | 'pdf' | 'json';

function getFileType(file: File): SupportedFileType {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.json')) return 'json';
  // Fallback to MIME type
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('json')) return 'json';
  if (file.type.includes('word') || file.type.includes('document')) return 'docx';
  throw new Error(`Unsupported file type: ${file.name}. Please upload .docx, .pdf, or .json`);
}

export interface AiGenerateResult {
  docTitle: string;
  sections: any[];
  tech_legend?: any[];
  pages?: any[];
  _saved_folder?: string;
  language?: LanguageCode;
  sourceLanguage?: LanguageCode;
}

/**
 * ParserService — single entry point for parsing any supported file.
 * Always returns a ManualDocument regardless of the input format.
 */
export class ParserService {
  static async parseDocxViaAi(
    file: File,
    userEmailOrProgress?: string | ((msg: string) => void),
    onProgressOrProjId?: ((msg: string) => void) | string,
    projectIdArg?: string
  ): Promise<AiGenerateResult> {
    let email = '';
    let progressCb: ((msg: string) => void) | undefined;
    let targetProjectId = projectIdArg || '';

    if (typeof userEmailOrProgress === 'function') {
      progressCb = userEmailOrProgress;
    } else if (typeof userEmailOrProgress === 'string') {
      email = userEmailOrProgress;
    }

    if (typeof onProgressOrProjId === 'function') {
      progressCb = onProgressOrProjId;
    } else if (typeof onProgressOrProjId === 'string') {
      targetProjectId = onProgressOrProjId;
    }

    if (progressCb) progressCb('1/3 Mengirim file ke backend AI server...');
    const formData = new FormData();
    formData.append('file', file);

    const queryParams: string[] = [];
    if (email) queryParams.push(`email=${encodeURIComponent(email)}`);
    if (targetProjectId) queryParams.push(`projectId=${encodeURIComponent(targetProjectId)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = `/api/ai-generate${queryString}`;

    if (progressCb) progressCb('2/3 Memproses via 4-Stage AI Pipeline (Context, Topic, Writing, Legend)...');
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    if (progressCb) progressCb('3/3 Menyusun halaman Portrait A4...');
    const data: AiGenerateResult = await res.json();
    return data;
  }

  static async parse(file: File): Promise<ManualDocument> {
    const type = getFileType(file);
    switch (type) {
      case 'docx':
        return DocxParser.parse(file);
      case 'pdf':
        return PdfParser.parse(file);
      case 'json':
        return JsonParser.parse(file);
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  static isSupportedFile(file: File): boolean {
    try {
      getFileType(file);
      return true;
    } catch {
      return false;
    }
  }

  static getAcceptedExtensions(): string {
    return '.docx,.pdf,.json';
  }
}
