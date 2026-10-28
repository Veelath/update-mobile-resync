import {strToU8, zipSync} from 'fflate';
import {describe, it, expect} from '@jest/globals';
import {
  flattenTemplateToc,
  parseDocxTemplate,
  parseTemplateFile,
  parseTxtTemplate,
  UNSUPPORTED_MANUSCRIPT,
  validateManuscriptFile,
} from '../src/services/templateParser';

describe('optional templates', () => {
  it('parses .txt chapters and headings and names invalid line numbers', () => {
    expect(parseTxtTemplate('\nCHAPTER: "Introduction"\nHEADING: Context\n\nCHAPTER: Methods\nHEADING: Sampling')).toEqual([
      {id: 'c1', number: '01', title: 'Introduction', headings: ['Context']},
      {id: 'c2', number: '02', title: 'Methods', headings: ['Sampling']},
    ]);
    expect(() => parseTxtTemplate('HEADING: Orphan')).toThrow('line 1');
    expect(() => parseTxtTemplate('CHAPTER: Start\nOther')).toThrow('line 2');
    expect(() => parseTxtTemplate('CHAPTER: ')).toThrow('line 1');
  });

  it('reads Heading1, Heading2 and chapter-looking paragraphs from a DOCX zip', () => {
    const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>"Introduction"</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Study &amp; Scope</w:t></w:r></w:p>
      <w:p><w:r><w:t>CHAPTER 2 Methods</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Sampling</w:t></w:r></w:p>
      <w:p><w:r><w:t>3. Findings</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Evidence</w:t></w:r></w:p>
    </w:body></w:document>`;
    const zip = zipSync({'word/document.xml': strToU8(xml)});
    const bytes = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength);
    expect(parseDocxTemplate(bytes)).toEqual([
      {id: 'c1', number: '01', title: 'Introduction', headings: ['Study & Scope']},
      {id: 'c2', number: '02', title: 'CHAPTER 2 Methods', headings: ['Sampling']},
      {id: 'c3', number: '03', title: '3. Findings', headings: ['Evidence']},
    ]);
    expect(() => parseTemplateFile('old.doc', bytes)).toThrow('save this template as .docx');
  });

  it('sends headings only and adds References once', () => {
    const chapters = parseTxtTemplate('CHAPTER: Introduction\nHEADING: Context\nCHAPTER: Methods\nHEADING: Sampling');
    expect(flattenTemplateToc(chapters)).toEqual(['Context', 'Sampling', 'References']);
    chapters[1].headings.push('Bibliography and Sources');
    expect(flattenTemplateToc(chapters)).toEqual(['Context', 'Sampling', 'Bibliography and Sources']);
    expect(flattenTemplateToc([])).toBeUndefined();
    expect(flattenTemplateToc(parseTxtTemplate('CHAPTER: Introduction'))).toBeUndefined();
  });
});

describe('manuscript validation', () => {
  it('rejects PDF even when a picker returns it', () => {
    expect(validateManuscriptFile({name: 'paper.pdf', type: 'application/pdf', size: 100})).toBe(UNSUPPORTED_MANUSCRIPT);
    expect(validateManuscriptFile({name: 'paper.docx', type: 'application/pdf', size: 100})).toBe(UNSUPPORTED_MANUSCRIPT);
    expect(validateManuscriptFile({name: 'paper.doc', type: 'application/msword', size: 100})).toBeNull();
    expect(validateManuscriptFile({name: 'paper.docx', type: null, size: 26 * 1024 * 1024})).toContain('25 MB');
  });
});
