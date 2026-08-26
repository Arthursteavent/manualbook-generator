import type { ManualDocument } from './manual.types';

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  render: (doc: ManualDocument, container: HTMLElement) => void;
}

export type TemplateId = 'default' | 'modern' | 'minimal' | 'corporate' | 'crimson';
