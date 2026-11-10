import { describe, expect, it } from '@jest/globals';
import { strToU8, zipSync } from 'fflate';
import { base64ToBytes, parseDocx, readWordFile } from '../src/services/wordDoc';

const para = (text: string) => `<w:p w:rsidR="1"><w:pPr><w:tabs><w:tab w:val="left"/></w:tabs></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const docx = (body: string) => zipSync({ 'word/document.xml': strToU8(`<w:document><w:body>${body}</w:body></w:document>`), 'word/media/a.png': new Uint8Array(8) });

describe('parseDocx', () => {
  it('reads paragraphs, sections and escaped characters from the document', () => {
    const doc = parseDocx(docx([para('CHAPTER I'), para('INTRODUCTION'), '<w:p w:rsidR="2"/>', para('Tom &amp; Ana study resale.')].join('')));
    expect(doc.blocks).toEqual([
      { kind: 'chapter', text: 'CHAPTER I · INTRODUCTION' },
      { kind: 'text', text: 'Tom & Ana study resale.' },
    ]);
    expect(doc.sections).toEqual([{ title: 'INTRODUCTION', words: 5 }]);
    expect(doc.words).toBe(5);
  });

  it('joins runs in a paragraph and keeps tabs as spaces', () => {
    const doc = parseDocx(docx('<w:p><w:r><w:t>One two.</w:t></w:r><w:r><w:tab/><w:t>Three.</w:t></w:r></w:p>'));
    expect(doc.blocks).toEqual([{ kind: 'text', text: 'One two. Three.' }]);
  });

  it('rejects a zip that is not a Word document', () => {
    expect(() => parseDocx(zipSync({ 'a.txt': strToU8('x') }))).toThrow();
  });
});

describe('base64ToBytes', () => {
  it('decodes with and without padding', () => {
    expect(Array.from(base64ToBytes('TWFu'))).toEqual([77, 97, 110]);
    expect(Array.from(base64ToBytes('TWE='))).toEqual([77, 97]);
    expect(Array.from(base64ToBytes('TQ=='))).toEqual([77]);
  });

  it('round-trips a real zip', () => {
    const zip = docx(para('A sentence in the paper.'));
    const base64 = Buffer.from(zip).toString('base64');
    expect(parseDocx(base64ToBytes(base64)).words).toBe(5);
  });
});

describe('readWordFile', () => {
  it('does not try to read old .doc files', async () => {
    expect(await readWordFile({ name: 'paper.doc', uri: 'content://x' })).toBeNull();
  });
});
