import type { ManualDocument } from '../types/manual.types';

/**
 * JsonParser — validates and loads a JSON file directly as ManualDocument.
 * If the JSON does not match the expected shape, it throws a descriptive error.
 */
export class JsonParser {
  static async parse(file: File): Promise<ManualDocument> {
    const text = await file.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file: unable to parse.');
    }

    return JsonParser.validate(json);
  }

  static validate(json: unknown): ManualDocument {
    if (typeof json !== 'object' || json === null) {
      throw new Error('JSON must be an object.');
    }

    const obj = json as Record<string, unknown>;

    if (!obj.meta || typeof obj.meta !== 'object') {
      throw new Error('JSON missing required "meta" field.');
    }

    const meta = obj.meta as Record<string, unknown>;
    if (typeof meta.title !== 'string') {
      throw new Error('JSON meta.title must be a string.');
    }

    if (!Array.isArray(obj.toc)) {
      throw new Error('JSON missing required "toc" array.');
    }

    if (!Array.isArray(obj.pages)) {
      throw new Error('JSON missing required "pages" array.');
    }

    // Return as ManualDocument (cast is safe after structural validation)
    return obj as unknown as ManualDocument;
  }
}
