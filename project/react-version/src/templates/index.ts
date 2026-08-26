import { createRoot } from 'react-dom/client';
import type { ManualDocument } from '../types/manual.types';
import type { PdfTemplate, TemplateId } from '../types/template.types';
import { DefaultTemplate } from './DefaultTemplate';
import { ModernTemplate } from './ModernTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { CorporateTemplate } from './CorporateTemplate';
import { CrimsonTemplate } from './CrimsonTemplate';

const templates: Record<TemplateId, PdfTemplate> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Original design — dark cover with cyan & pink accents',
    render: (doc: ManualDocument, container: HTMLElement) => {
      const root = createRoot(container);
      root.render(DefaultTemplate({ doc }));
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean white pages with bold typography and minimal decoration',
    render: (doc: ManualDocument, container: HTMLElement) => {
      const root = createRoot(container);
      root.render(ModernTemplate({ doc }));
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Black-and-white, print-optimised, no gradients',
    render: (doc: ManualDocument, container: HTMLElement) => {
      const root = createRoot(container);
      root.render(MinimalTemplate({ doc }));
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Formal navy-blue cover with structured layout',
    render: (doc: ManualDocument, container: HTMLElement) => {
      const root = createRoot(container);
      root.render(CorporateTemplate({ doc }));
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Red',
    description: 'Warm crimson red cover with elegant serif headers',
    render: (doc: ManualDocument, container: HTMLElement) => {
      const root = createRoot(container);
      root.render(CrimsonTemplate({ doc }));
    },
  },
};

export function getTemplate(id: TemplateId): PdfTemplate {
  return templates[id] || templates.default;
}

export function getAllTemplates(): PdfTemplate[] {
  return Object.values(templates);
}

export { templates };
