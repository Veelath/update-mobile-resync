import { ManuscriptBlock } from '../data/report';

export type GoogleDoc = {
  blocks: ManuscriptBlock[];
  sections: { title: string; words: number }[];
  words: number;
};

export type GoogleDocResult =
  | { status: 'ok'; doc: GoogleDoc }
  | { status: 'invalid' | 'private' | 'missing' | 'unreachable' };

const DOC_URL = /^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([\w-]{20,})/i;
const CHAPTER = /^chapter\s+([ivxlc]+|\d+)\b[\s.:·-]*(.*)$/i;
// Google can take over 20 seconds to export a long manuscript
const TIMEOUT_MS = 60000;
const FORMATTED_TIMEOUT_MS = 90000;
// A long manuscript is thousands of paragraphs; the preview only shows its first pages
const PREVIEW_PARAGRAPHS = 400;
const PREVIEW_HTML_CHARS = 900000;

export const googleDocId = (url: string): string | null => DOC_URL.exec(url.trim())?.[1] ?? null;

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Short lines with no closing punctuation read as headings ("Rationale of the Study", "SCOPE AND LIMITATIONS")
const looksLikeHeading = (line: string) => {
  const words = countWords(line);
  return words > 0 && words <= 10 && line.length <= 80 && !/[.,;:!?]$/.test(line) && /^[A-Z0-9]/.test(line);
};

/** Splits a plain-text export into preview blocks and the sections between its headings. */
export const parseDocText = (raw: string): GoogleDoc => {
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const blocks: ManuscriptBlock[] = [];
  const sections: GoogleDoc['sections'] = [];
  let words = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const chapter = CHAPTER.exec(line);
    if (chapter) {
      // "CHAPTER I" is often followed by its title on the next line
      let title = chapter[2].trim();
      if (!title && lines[i + 1] && looksLikeHeading(lines[i + 1])) title = lines[++i];
      const label = `CHAPTER ${chapter[1].toUpperCase()}${title ? ` · ${title.toUpperCase()}` : ''}`;
      blocks.push({ kind: 'chapter', text: label });
      sections.push({ title: title || label, words: 0 });
    } else if (looksLikeHeading(line)) {
      blocks.push({ kind: 'heading', text: line });
      sections.push({ title: line, words: 0 });
    } else {
      const n = countWords(line);
      blocks.push({ kind: 'text', text: line });
      words += n;
      if (sections.length) sections[sections.length - 1].words += n;
    }
  }
  // Title-page lines and headings with nothing under them aren't sections of the paper
  return { blocks, sections: sections.filter((s) => s.words > 0), words };
};

const HTML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

const decodeHtml = (text: string) =>
  text.replace(/&#(x[0-9a-f]+|\d+);|&([a-z]+);/gi, (match, code, named) => {
    if (code) return String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code));
    return HTML_ENTITIES[named.toLowerCase()] ?? match;
  });

/** Reads one CSS property out of an inline style attribute. */
const cssValue = (tag: string, property: string) => {
  const at = tag.indexOf(`${property}:`);
  if (at === -1) return '';
  const end = tag.indexOf(';', at);
  return tag.slice(at + property.length + 1, end === -1 ? undefined : end).replace(/["']/g, '').trim();
};

const stripTags = (html: string) => {
  let text = '';
  for (let at = 0; at < html.length; ) {
    const open = html.indexOf('<', at);
    if (open === -1) return text + html.slice(at);
    text += html.slice(at, open);
    const close = html.indexOf('>', open);
    if (close === -1) break;
    at = close + 1;
  }
  return text;
};

// Plain string searches, as regexes hang on this much HTML in Hermes
const withoutCommentMarkers = (html: string) => {
  let out = '';
  let at = 0;
  for (let open = html.indexOf('<sup>'); open !== -1; open = html.indexOf('<sup>', at)) {
    const close = html.indexOf('</sup>', open);
    if (close === -1) break;
    out += html.slice(at, open);
    const marker = html.slice(open, close + 6);
    if (!marker.includes('cmnt')) out += marker;
    at = close + 6;
  }
  return out + html.slice(at);
};

/** Reads the look of the first pages from Google's mobile view, where every paragraph carries its style inline. Null when it has none. */
export const parseDocHtmlPreview = (html: string): ManuscriptBlock[] | null => {
  const start = html.indexOf('<div class="doc-content"');
  if (start === -1) return null;
  // Headings become paragraphs and comment markers ("[a]") are dropped, as the plain export leaves them out of the text too
  let page = html.slice(start, start + PREVIEW_HTML_CHARS);
  for (let n = 1; n <= 6; n++) page = page.split(`<h${n}`).join('<p').split(`</h${n}>`).join('</p>');
  page = withoutCommentMarkers(page);
  const blocks: ManuscriptBlock[] = [];
  let gap = false;
  let styled = false;
  const paragraphs = page.split('<p');
  for (let i = 1; i < paragraphs.length && blocks.length < PREVIEW_PARAGRAPHS; i++) {
    const paragraph = paragraphs[i];
    if (paragraph[0] !== ' ' && paragraph[0] !== '>') continue;
    const openEnd = paragraph.indexOf('>');
    const body = paragraph.slice(openEnd + 1, paragraph.indexOf('</p>'));
    const text = decodeHtml(stripTags(body)).replace(/\s+/g, ' ').trim();
    if (!text) {
      if (blocks.length) gap = true;
      continue;
    }
    const block: ManuscriptBlock = { kind: 'text', text };
    const align = cssValue(paragraph.slice(0, openEnd), 'text-align');
    if (align === 'center' || align === 'right') block.align = align;
    else if (align === 'justify') block.align = 'justify';
    let bold = true;
    let italic = true;
    let size = 0;
    for (const span of body.split('<span').slice(1)) {
      const tag = span.slice(0, span.indexOf('>'));
      if (!decodeHtml(stripTags(span.slice(span.indexOf('>') + 1))).trim()) continue;
      if (cssValue(tag, 'font-weight') !== '700') bold = false;
      if (cssValue(tag, 'font-style') !== 'italic') italic = false;
      if (!size) size = parseFloat(cssValue(tag, 'font-size')) || 0;
    }
    if (bold) block.bold = true;
    if (italic) block.italic = true;
    if (size) block.size = size;
    if (gap) block.gap = true;
    if (block.align || block.bold || block.italic) styled = true;
    blocks.push(block);
    gap = false;
  }
  return styled ? blocks : null;
};

/** Google's mobile view adds a title of its own above the text (the tab's name), which the plain export and the scan don't have. */
export const startAtDocText = (formatted: ManuscriptBlock[] | null, plain: ManuscriptBlock[]): ManuscriptBlock[] => {
  if (!formatted) return plain;
  const same = (a: string, b: string) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();
  const first = plain.find((b) => b.kind === 'text' || b.kind === 'heading')?.text;
  const at = first === undefined ? 0 : formatted.slice(0, 3).findIndex((b) => same(b.text, first));
  return at > 0 ? formatted.slice(at) : formatted;
};

/** Google's mobile view keeps the page's look (centered titles, bold, spacing) without the images the Word export carries. Null when it can't be read, so the plain text is used for the preview. */
const fetchFormattedBlocks = async (id: string): Promise<ManuscriptBlock[] | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FORMATTED_TIMEOUT_MS);
  try {
    const res = await fetch(`https://docs.google.com/document/d/${id}/mobilebasic`, { signal: controller.signal });
    if (!res.ok || res.url.includes('accounts.google.com')) return null;
    return parseDocHtmlPreview(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Downloads a Google Doc through its public plain-text export. This only works for docs shared as
 * "Anyone with the link can view"; private docs redirect to the Google sign-in page instead.
 */
export const fetchGoogleDoc = async (url: string): Promise<GoogleDocResult> => {
  const id = googleDocId(url);
  if (!id) return { status: 'invalid' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Both exports are slow to build, so they run side by side
    const plain = fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, { signal: controller.signal });
    const formatted = fetchFormattedBlocks(id);
    const res = await plain;
    if (res.status === 404) return { status: 'missing' };
    if (res.status === 401 || res.status === 403) return { status: 'private' };
    if (!res.ok) return { status: 'unreachable' };
    const type = res.headers.get('content-type') || '';
    if (res.url.includes('accounts.google.com') || !type.includes('text/plain')) return { status: 'private' };
    const doc = parseDocText(await res.text());
    return { status: 'ok', doc: { ...doc, blocks: startAtDocText(await formatted, doc.blocks) } };
  } catch {
    return { status: 'unreachable' };
  } finally {
    clearTimeout(timeout);
  }
};
