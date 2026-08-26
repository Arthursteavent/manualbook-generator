import type { ManualDocument, ProjectData, LanguageCode } from '../types/manual.types';
import { DEFAULT_COLOR_THEME } from '../utils/colorThemes';

export class ProjectService {
  static async saveProject(
    name: string,
    document: ManualDocument,
    id?: string,
    userEmail?: string,
    language?: LanguageCode,
    colorTheme?: string,
    baseRev?: number
  ): Promise<ProjectData & { saved: boolean; conflict?: boolean; rev?: number }> {
    const projectId = id || `proj-${Date.now()}`;
    const savedAt = new Date().toISOString();
    const activeTheme = colorTheme || (document as any)?.colorTheme || DEFAULT_COLOR_THEME;
    if (document && typeof document === 'object') {
      (document as any).colorTheme = activeTheme;
    }

    const project: ProjectData = {
      id: projectId,
      name,
      document,
      savedAt,
    };

    let saved = false;
    let conflict = false;
    let rev: number | undefined;
    try {
      const res = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          title: name,
          folder_name: projectId,
          data: document,
          user_email: userEmail || '',
          language: language || 'id',
          color_theme: activeTheme,
          base_rev: baseRev || 0,
        }),
      });
      if (res.status === 409) {
        conflict = true;
        console.error('Save rejected: document was modified elsewhere after this copy was loaded');
      } else {
        saved = res.ok;
        if (res.ok) {
          try {
            const body = await res.json();
            rev = body.rev;
          } catch (e) {}
        } else {
          console.error(`Save request rejected by server (HTTP ${res.status})`);
        }
      }
    } catch (e) {
      console.error('Failed to save project to DB', e);
    }

    return { ...project, saved, conflict, rev };
  }

  static async loadProject(id: string, lang?: LanguageCode): Promise<(ProjectData & { rev?: number }) | null> {
    try {
      const url = lang
        ? `/api/projects/get?id=${encodeURIComponent(id)}&lang=${encodeURIComponent(lang)}`
        : `/api/projects/get?id=${encodeURIComponent(id)}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.id && data.document) {
          const loadedTheme = data.color_theme || data.document.colorTheme || DEFAULT_COLOR_THEME;
          if (data.document && typeof data.document === 'object') {
            data.document.colorTheme = loadedTheme;
          }
          return {
            id: data.id,
            name: data.name || data.title || 'Untitled Project',
            document: data.document,
            savedAt: data.savedAt || new Date().toISOString(),
            rev: data.rev || 0,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load project from DB', e);
    }
    return null;
  }

  static async listProjects(userEmail?: string): Promise<ProjectData[]> {
    try {
      const url = userEmail
        ? `/api/projects/list?email=${encodeURIComponent(userEmail)}`
        : '/api/projects/list';
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          const list = data.projects.map((p: any) => ({
            id: p.id,
            name: p.name || p.title || 'Untitled Project',
            document: p.document || { meta: { title: p.title || 'Untitled Project' }, pages: [] },
            savedAt: p.savedAt || p.updated_at || new Date().toISOString(),
          }));
          list.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          return list;
        }
      }
    } catch (e) {
      console.error('Failed to list projects from DB', e);
    }
    return [];
  }

  static async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to delete project from DB', e);
      return false;
    }
  }

  static exportAsJson(document: ManualDocument, filename?: string): void {
    const json = JSON.stringify(document, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = (filename || 'manual') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
