// Editor.js integration: allowlist config + server-side renderers (WP-12).
// v1 toolset (anything else is stripped on save AND on render):
export const EDITOR_TOOL_ALLOWLIST = [
  'paragraph',
  'header',
  'nested-list',
  'quote',
  'image', // custom R2 uploader ONLY
  'delimiter',
] as const;

// NOTE: older exports used type "list"; normalize to nested-list on render.
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

// ---------- sanitized rendering (ISR-safe, no DOM needed) ----------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:\/\/|mailto:)/i.test(h)) return h;
  if (/^\/[\w\-./]*$/.test(h)) return h; // site-relative (e.g. /media/…)
  return null;
}

// Allowlist inline tags produced by Editor.js inline tools:
// <b>, <strong>, <i>, <em>, <u>, <mark>, <code>, <a href>. Everything else
// is unwrapped (inner text kept, escaped). Attributes other than a[href] dropped.
function sanitizeInline(html: string): string {
  const allowed = new Set(['b', 'strong', 'i', 'em', 'u', 'mark', 'code', 'a']);
  return String(html).replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    const closing = tag.startsWith('</');
    if (!allowed.has(name)) return '';
    if (name === 'a' && !closing) {
      const m = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = m ? (m[2] ?? m[3] ?? m[4] ?? '') : '';
      const safe = safeHref(href);
      if (!safe) return '';
      return `<a href="${escapeHtml(safe)}">`;
    }
    return closing ? `</${name}>` : `<${name}>`;
  });
}

function textOf(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

interface ListItem {
  content?: string;
  items?: ListItem[];
  // legacy flat shape
  [k: string]: unknown;
}

function renderListItems(items: ListItem[], ordered: boolean): string {
  const tag = ordered ? 'ol' : 'ul';
  const lis = items
    .map((it) => {
      if (typeof it === 'string') return `<li>${sanitizeInline(it)}</li>`;
      const content = sanitizeInline(textOf(it.content));
      const nested =
        Array.isArray(it.items) && it.items.length > 0 ? renderListItems(it.items as ListItem[], ordered) : '';
      return `<li>${content}${nested}</li>`;
    })
    .join('');
  return `<${tag}>${lis}</${tag}>`;
}

function renderImage(data: Record<string, unknown>): string {
  const file = (data.file ?? {}) as Record<string, unknown>;
  const url = typeof file.url === 'string' ? file.url : '';
  const safe = safeHref(url);
  if (!safe) return '';
  const caption = sanitizeInline(textOf(data.caption));
  const img = `<img src="${escapeHtml(safe)}" alt="${escapeHtml(caption.replace(/<[^>]*>/g, ''))}" loading="lazy" />`;
  return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : `<figure>${img}</figure>`;
}

export function renderBlock(block: EditorBlock): string {
  const data = block.data ?? {};
  switch (block.type) {
    case 'paragraph':
      return `<p>${sanitizeInline(textOf(data.text))}</p>`;
    case 'header': {
      const level = Math.min(6, Math.max(1, Number(data.level) || 2));
      return `<h${level}>${sanitizeInline(textOf(data.text))}</h${level}>`;
    }
    case 'list':
    case 'nested-list': {
      const style = data.style === 'ordered' ? 'ordered' : 'unordered';
      const items = (Array.isArray(data.items) ? data.items : []) as ListItem[];
      return renderListItems(items, style === 'ordered');
    }
    case 'quote': {
      const align =
        data.alignment === 'center' || data.alignment === 'right' ? ` class="align-${data.alignment}"` : '';
      const caption = textOf(data.caption);
      return `<blockquote${align}><p>${sanitizeInline(textOf(data.text))}</p>${
        caption ? `<cite>${escapeHtml(caption)}</cite>` : ''
      }</blockquote>`;
    }
    case 'image':
      return renderImage(data as Record<string, unknown>);
    case 'delimiter':
      return '<hr />';
    default:
      return ''; // unknown block types are dropped (structural sanitization)
  }
}

export interface RenderResult {
  html: string;
  dropped: number;
}

export function renderDocument(doc: EditorDocument): RenderResult {
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : [];
  let dropped = 0;
  const html = blocks
    .map((b) => {
      if (!b || typeof b.type !== 'string') {
        dropped++;
        return '';
      }
      const out = renderBlock(b);
      if (!out) dropped++;
      return out;
    })
    .join('\n');
  return { html, dropped };
}

export { escapeHtml, sanitizeInline };
