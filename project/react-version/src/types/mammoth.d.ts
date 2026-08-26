declare module 'mammoth/mammoth.browser' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}
