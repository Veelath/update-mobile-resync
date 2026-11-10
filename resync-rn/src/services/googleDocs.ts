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
    const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, { signal: controller.signal });
    if (res.status === 404) return { status: 'missing' };
    if (res.status === 401 || res.status === 403) return { status: 'private' };
    if (!res.ok) return { status: 'unreachable' };
    const type = res.headers.get('content-type') || '';
    if (res.url.includes('accounts.google.com') || !type.includes('text/plain')) return { status: 'private' };
    return { status: 'ok', doc: parseDocText(await res.text()) };
  } catch {
    return { status: 'unreachable' };
  } finally {
    clearTimeout(timeout);
  }
};
