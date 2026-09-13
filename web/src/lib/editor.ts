// Editor.js integration contract (WP-12).
// v1 toolset (allowlist — anything else is stripped on save AND on render):
export const EDITOR_TOOL_ALLOWLIST = [
  'paragraph',
  'header',
  'nested-list',
  'quote',
  'image', // custom R2 uploader ONLY
  'delimiter',
] as const;

export const EDITOR_INLINE_ALLOWLIST = ['bold', 'italic', 'link', 'marker'] as const;

export interface EditorBlock {
  id?: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface EditorDocument {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}

// M1 implements: thin framework wrapper (~50 lines), R2 upload hook,
// and allowlisted per-block parsers (editorjs-html style) for ISR render.
export function renderBlocksNotImplemented(_doc: EditorDocument): never {
  throw new Error('not implemented — WP-12 (Editor.js parsers)');
}
