import { strFromU8, strToU8, unzipSync } from 'fflate';
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

/** Pulls the paragraphs out of a .docx, which is a zip with the text in word/document.xml. */
export const parseDocx = (bytes: Uint8Array): GoogleDoc => {
  const file = unzipSync(bytes, { filter: (f) => f.name === DOCUMENT_XML })[DOCUMENT_XML];
  if (!file) throw new Error('Not a Word document.');
  // Decoding megabytes of UTF-8 freezes Hermes, so the XML stays as raw bytes and only paragraph text is decoded
  const paragraphs = strFromU8(file, true).split('<w:tab/>').join(SPACE_RUN).split('<w:br/>').join(SPACE_RUN).split('</w:p>');
  return parseDocText(paragraphs.map(paragraphText).join('\n'));
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
