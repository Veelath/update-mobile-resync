import { strFromU8, strToU8, unzipSync } from 'fflate';
import type { ManuscriptBlock } from '../data/report';
import { GoogleDoc, parseDocText } from './googleDocs';

const DOCUMENT_XML = 'word/document.xml';
const SPACE_RUN = '<w:t> </w:t>';
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const decodeXml = (text: string) =>
  text.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (match, code, named) => {
    if (code) return String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code));
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[named.toLowerCase()] ?? match;
  });

/** Joins the <w:t> runs of one paragraph. Plain string searches, as regexes hang on this much XML in Hermes. */
const paragraphText = (paragraph: string) => {
  let text = '';
  for (let at = paragraph.indexOf('<w:t'); at !== -1; at = paragraph.indexOf('<w:t', at + 4)) {
    // Also matches <w:tbl>, <w:tc> and friends
    const next = paragraph[at + 4];
    if (next !== '>' && next !== ' ') continue;
    const open = paragraph.indexOf('>', at);
    if (paragraph[open - 1] === '/') continue;
    const close = paragraph.indexOf('</w:t>', open);
    if (close === -1) break;
    text += paragraph.slice(open + 1, close);
  }
  return decodeXml(strFromU8(strToU8(text, true)));
};

const ALIGN: Record<string, 'center' | 'right' | 'justify'> = { center: 'center', right: 'right', both: 'justify', distribute: 'justify' };

/** Reads one attribute of the first matching tag, such as w:val of <w:jc>. */
const attr = (xml: string, tag: string, name: string) => {
  const at = xml.indexOf(tag);
  if (at === -1) return null;
  const end = xml.indexOf('>', at);
  const from = xml.indexOf(`${name}="`, at);
  if (from === -1 || from > end) return null;
  const start = from + name.length + 2;
  return xml.slice(start, xml.indexOf('"', start));
};

/** True for <w:b/> and <w:b w:val="1"/> but not <w:b w:val="0"/>. */
const flag = (props: string, tag: string) => {
  const at = props.indexOf(tag);
  if (at === -1) return false;
  const next = props[at + tag.length];
  if (next !== '/' && next !== ' ') return false;
  const value = attr(props, tag, 'w:val');
  return value !== '0' && value !== 'false';
};

/** Reads the look of one paragraph: its alignment, whether all its text is bold or italic, and the text size. */
const paragraphFormat = (paragraph: string): Omit<ManuscriptBlock, 'kind' | 'text' | 'gap'> => {
  const format: Omit<ManuscriptBlock, 'kind' | 'text' | 'gap'> = {};
  const pEnd = paragraph.indexOf('</w:pPr>');
  const align = attr(pEnd === -1 ? '' : paragraph.slice(0, pEnd), '<w:jc', 'w:val');
  if (align && ALIGN[align]) format.align = ALIGN[align];
  let bold = true;
  let italic = true;
  let size = 0;
  let any = false;
  for (const run of paragraph.split(/<w:r[ >]/).slice(1)) {
    const text = run.indexOf('<w:t');
    if (text === -1 || !/^<w:t[ >]/.test(run.slice(text, text + 5))) continue;
    const content = run.slice(run.indexOf('>', text) + 1, run.indexOf('</w:t>', text));
    if (!content.trim()) continue;
    const rEnd = run.indexOf('</w:rPr>');
    const props = rEnd === -1 ? '' : run.slice(0, rEnd);
    any = true;
    if (!flag(props, '<w:b')) bold = false;
    if (!flag(props, '<w:i')) italic = false;
    if (!size) size = Number(attr(props, '<w:sz ', 'w:val')) / 2 || 0;
  }
  if (any && bold) format.bold = true;
  if (any && italic) format.italic = true;
  if (size) format.size = size;
  return format;
};

// A long manuscript is thousands of paragraphs; the preview only shows its first pages
const PREVIEW_PARAGRAPHS = 400;

/** The paragraphs of a .docx, which is a zip with the text in word/document.xml. */
const readParagraphs = (bytes: Uint8Array): string[] => {
  const file = unzipSync(bytes, { filter: (f) => f.name === DOCUMENT_XML })[DOCUMENT_XML];
  if (!file) throw new Error('Not a Word document.');
  // Decoding megabytes of UTF-8 freezes Hermes, so the XML stays as raw bytes and only paragraph text is decoded
  return strFromU8(file, true).split('</w:p>');
};

// Tabs and line breaks read as spaces
const spaced = (paragraph: string) => paragraph.split('<w:tab/>').join(SPACE_RUN).split('<w:br/>').join(SPACE_RUN);

/** The first pages with the look they have in the document. Null when the document has no styling worth showing. */
const formattedBlocks = (paragraphs: string[]): ManuscriptBlock[] | null => {
  const blocks: ManuscriptBlock[] = [];
  let gap = false;
  let styled = false;
  for (let i = 0; i < paragraphs.length && blocks.length < PREVIEW_PARAGRAPHS; i++) {
    const paragraph = spaced(paragraphs[i]);
    const text = paragraphText(paragraph).trim();
    if (!text) {
      if (blocks.length) gap = true;
      continue;
    }
    const format = paragraphFormat(paragraph);
    if (format.align || format.bold || format.italic) styled = true;
    blocks.push({ kind: 'text', text, ...format, ...(gap ? { gap: true } : {}) });
    gap = false;
  }
  return styled ? blocks : null;
};

/** Pulls the paragraphs out of a .docx. */
export const parseDocx = (bytes: Uint8Array): GoogleDoc => {
  const paragraphs = readParagraphs(bytes);
  const plain = parseDocText(paragraphs.map((p) => paragraphText(spaced(p))).join('\n'));
  // Keep the page's look only when the document has some; a plain one reads the same either way
  const blocks = formattedBlocks(paragraphs);
  return blocks ? { ...plain, blocks } : plain;
};



export const base64ToBytes = (base64: string): Uint8Array => {
  const clean = base64.replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  const lookup = new Uint8Array(128);
  for (let i = 0; i < BASE64.length; i++) lookup[BASE64.charCodeAt(i)] = i;
  let bits = 0;
  let buffer = 0;
  let out = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = ((buffer << 6) | lookup[clean.charCodeAt(i)]) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
};

// fetch() throws on local files because they report status 0, so this goes through XHR directly
const readBlob = (uri: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri);
    xhr.responseType = 'blob';
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Could not read the file.'));
    xhr.send();
  });

// React Native can only read content:// URIs as blobs, and FileReader only hands blobs back as data URLs
export const readBase64 = async (uri: string): Promise<string> => {
  const blob = await readBlob(uri);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });
};

/** Reads a picked Word file for the preview. Null when it can't be read here, such as an old .doc. */
export const readWordFile = async (file: { name: string; uri: string }): Promise<GoogleDoc | null> => {
  if (!/\.docx$/i.test(file.name)) return null;
  try {
    const doc = parseDocx(base64ToBytes(await readBase64(file.uri)));
    return doc.blocks.length ? doc : null;
  } catch {
    return null;
  }
};
