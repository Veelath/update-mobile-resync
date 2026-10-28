import {strFromU8, unzipSync} from 'fflate';
import type {ChapterTemplate} from '../data/templates';

const clean = (text: string) => text.replace(/^["'\s]+|["',\s]+$/g, '').trim();

function decodeXml(text: string): string {
  return text.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (match, code, named) => {
    if (code) return String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code));
    return ({amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"} as Record<string, string>)[named] || match;
  });
}

function chapter(title: string, index: number): ChapterTemplate {
  return {id: `c${index}`, number: String(index).padStart(2, '0'), title, headings: []};
}

export function parseTxtTemplate(text: string): ChapterTemplate[] {
  const chapters: ChapterTemplate[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    if (!raw.trim()) return;
    const match = /^\s*(CHAPTER|HEADING):\s*(.*?)\s*$/i.exec(raw);
    if (!match || !clean(match[2])) throw new Error(`Invalid template line ${index + 1}. Use CHAPTER: <title> or HEADING: <title>.`);
    const title = clean(match[2]);
    if (match[1].toUpperCase() === 'CHAPTER') chapters.push(chapter(title, chapters.length + 1));
    else if (!chapters.length) throw new Error(`Invalid template line ${index + 1}. Add a CHAPTER before any HEADING.`);
    else chapters[chapters.length - 1].headings.push(title);
  });
  return chapters;
}

export function parseDocxTemplate(bytes: ArrayBuffer): ChapterTemplate[] {
  const file = unzipSync(new Uint8Array(bytes))['word/document.xml'];
  if (!file) throw new Error('Could not parse the template file. No template will be sent.');
  const chapters: ChapterTemplate[] = [];
  const xml = strFromU8(file);
  for (const paragraph of xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) || []) {
    const text = clean(decodeXml(Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g), match => match[1]).join('')));
    if (!text) continue;
    const style = /<w:pStyle[^>]*w:val=["']([^"']+)["']/.exec(paragraph)?.[1] || '';
    if (/^Heading1$/i.test(style) || /^CHAPTER/i.test(text) || /^\d+\.\s/.test(text)) {
      chapters.push(chapter(text, chapters.length + 1));
    } else if (/^Heading[23]$/i.test(style) && chapters.length) {
      chapters[chapters.length - 1].headings.push(text);
    }
  }
  return chapters;
}

export function flattenTemplateToc(chapters: ChapterTemplate[]): string[] | undefined {
  const headings = chapters.flatMap(ch => ch.headings.map(clean).filter(Boolean));
  if (!headings.length) return undefined;
  return headings.some(heading => /^(references|bibliography)/i.test(heading)) ? headings : [...headings, 'References'];
}

export function parseTemplateFile(name: string, bytes: ArrayBuffer): ChapterTemplate[] {
  if (/\.doc$/i.test(name)) throw new Error('Old .doc templates cannot be read. Please save this template as .docx and try again.');
  if (/\.txt$/i.test(name)) return parseTxtTemplate(strFromU8(new Uint8Array(bytes)));
  if (/\.docx$/i.test(name)) return parseDocxTemplate(bytes);
  throw new Error('Unsupported template file. Please upload a .docx or .txt file.');
}

export const UNSUPPORTED_MANUSCRIPT = 'Unsupported file type. Please upload a Word document (.doc or .docx) or paste a Google Docs link.';

export function validateManuscriptFile(file: {name: string | null; type: string | null; size: number | null}): string | null {
  const mime = file.name?.toLowerCase().endsWith('.doc') ? 'application/msword' :
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (!file.name || !/\.docx?$/i.test(file.name) || (file.type && file.type !== mime)) return UNSUPPORTED_MANUSCRIPT;
  if (file.size === null) return 'Could not determine the file size. Please choose another Word document.';
  if (file.size === 0) return 'The uploaded document appears to be empty or contains no extractable text.';
  if (file.size > 25 * 1024 * 1024) return 'This file is larger than 25 MB. Please upload a smaller Word document.';
  return null;
}
