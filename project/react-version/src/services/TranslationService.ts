import type { LanguageCode } from '../types/manual.types';
import type { AiGenerateResult } from './ParserService';

/**
 * TranslationService — translates an already-generated (and saved) AI manual book
 * into another language on demand. The backend caches each project/language pair as
 * projects/<id>/data_<lang>.json, so repeat switches to a previously-generated
 * language are instant and do not call the LLM again.
 *
 * Fresh translations run as a background job on the server (they can take 20+ minutes,
 * far beyond any proxy timeout), so this service polls /api/translate-status until the
 * job finishes, then fetches the cached result.
 */
export class TranslationService {
  private static readonly POLL_INTERVAL_MS = 4000;
  private static readonly MAX_WAIT_MS = 65 * 60 * 1000;

  static async translateProject(projectId: string, language: LanguageCode, documentPayload?: any, force: boolean = false): Promise<AiGenerateResult> {
    const res = await fetch('/api/translate-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: projectId, language, document: documentPayload, force }),
    });

    if (!res.ok && res.status !== 202) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    // 200 — cache hit or base language: the document itself.
    if (res.status !== 202) {
      return (await res.json()) as AiGenerateResult;
    }

    // 202 — translation job started/running: poll until it completes.
    const deadline = Date.now() + this.MAX_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, this.POLL_INTERVAL_MS));

      const statusRes = await fetch(
        `/api/translate-status?id=${encodeURIComponent(projectId)}&language=${encodeURIComponent(language)}`,
      );
      if (!statusRes.ok) continue; // transient network/server hiccup — keep polling

      const status = await statusRes.json();
      if (status.status === 'done') {
        // Re-request without force: the file is cached now, so this returns instantly.
        return this.translateProject(projectId, language, documentPayload, false);
      }
      if (status.status === 'error') {
        throw new Error(status.error || 'Translation failed on server');
      }
      if (status.status === 'none') {
        throw new Error('Translation job was lost (server restarted?). Silakan coba lagi.');
      }
    }

    throw new Error('Translation timed out. Silakan coba lagi.');
  }
}
