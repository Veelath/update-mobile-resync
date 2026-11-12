import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fetchGoogleDoc, googleDocId, parseDocHtmlPreview, parseDocText, startAtDocText } from '../src/services/googleDocs';

const ID = '195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE';

const mockFetch = (res: { status?: number; type?: string; url?: string; body?: string }) => {
  const fn = jest.fn(async () => ({
    status: res.status ?? 200,
    ok: (res.status ?? 200) < 300,
    url: res.url ?? 'https://doc-0g-docstext.googleusercontent.com/export',
    headers: { get: () => res.type ?? 'text/plain; charset=utf-8' },
    text: async () => res.body ?? '',
  }));
  global.fetch = fn as unknown as typeof fetch;
  return fn;
};

afterEach(() => jest.restoreAllMocks());

describe('googleDocId', () => {
  it('reads the id from edit, account and view links', () => {
    expect(googleDocId(`https://docs.google.com/document/d/${ID}/edit`)).toBe(ID);
    expect(googleDocId(`https://docs.google.com/document/u/1/d/${ID}/view?usp=sharing`)).toBe(ID);
  });

  it('rejects other hosts and Google files', () => {
    expect(googleDocId(`https://docs.google.com.evil.test/document/d/${ID}/edit`)).toBeNull();
    expect(googleDocId(`https://docs.google.com/spreadsheets/d/${ID}/edit`)).toBeNull();
    expect(googleDocId('docs.google.com/document')).toBeNull();
  });
});

describe('parseDocText', () => {
  it('turns chapters and headings into sections with word counts', () => {
    const doc = parseDocText([
      '﻿UNIHUB: A CAMPUS MARKETPLACE',
      'CHAPTER I',
      'INTRODUCTION',
      'Students trade used books on campus.',
      'Rationale of the Study',
      'A marketplace reduces waste.',
      'CHAPTER II: REVIEW OF RELATED LITERATURE',
      'Online marketplaces have grown.',
    ].join('\r\n'));

    expect(doc.blocks.slice(0, 3)).toEqual([
      { kind: 'heading', text: 'UNIHUB: A CAMPUS MARKETPLACE' },
      { kind: 'chapter', text: 'CHAPTER I · INTRODUCTION' },
      { kind: 'text', text: 'Students trade used books on campus.' },
    ]);
    expect(doc.sections).toEqual([
      { title: 'INTRODUCTION', words: 6 },
      { title: 'Rationale of the Study', words: 4 },
      { title: 'REVIEW OF RELATED LITERATURE', words: 4 },
    ]);
    expect(doc.words).toBe(14);
  });
});

describe('fetchGoogleDoc', () => {
  it('downloads the plain-text export of a shared doc', async () => {
    const fetchMock = mockFetch({ body: 'Introduction\nA sentence here.' });
    const result = await fetchGoogleDoc(`https://docs.google.com/document/d/${ID}/edit`);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://docs.google.com/document/d/${ID}/export?format=txt`);
    expect(result).toEqual({
      status: 'ok',
      doc: { blocks: expect.any(Array), sections: [{ title: 'Introduction', words: 3 }], words: 3 },
    });
  });

  it('maps sign-in redirects, missing docs and network failures', async () => {
    const url = `https://docs.google.com/document/d/${ID}/edit`;
    mockFetch({ type: 'text/html', url: 'https://accounts.google.com/ServiceLogin' });
    expect(await fetchGoogleDoc(url)).toEqual({ status: 'private' });
    mockFetch({ status: 404, type: 'text/html' });
    expect(await fetchGoogleDoc(url)).toEqual({ status: 'missing' });
    global.fetch = jest.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await fetchGoogleDoc(url)).toEqual({ status: 'unreachable' });
  });

  it('does not fetch links that are not Google Docs', async () => {
    const fetchMock = mockFetch({});
    expect(await fetchGoogleDoc('https://example.com/doc')).toEqual({ status: 'invalid' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('parseDocHtmlPreview', () => {
  const para = (text: string, align: string, style = '') =>
    `<p style="text-align:${align}"><span style="font-size:12pt;${style}">${text}</span></p>`;

  it('keeps the alignment, bold and spacing of the first pages', () => {
    const html = `<body><div class="doc-content">${para('A TITLE', 'center', 'font-weight:700')}<p style="text-align:left"><span></span></p>${para('Tom &amp; Ana<sup><a id="cmnt_ref1">[a]</a></sup>', 'left')}</div></body>`;
    expect(parseDocHtmlPreview(html)).toEqual([
      { kind: 'text', text: 'A TITLE', align: 'center', bold: true, size: 12 },
      { kind: 'text', text: 'Tom & Ana', size: 12, gap: true },
    ]);
  });

  it('returns null when the page has no styling to show', () => {
    expect(parseDocHtmlPreview(`<div class="doc-content">${para('Plain', 'left')}</div>`)).toBeNull();
    expect(parseDocHtmlPreview('<html></html>')).toBeNull();
  });
});

describe('startAtDocText', () => {
  const block = (text: string) => ({ kind: 'text' as const, text, align: 'center' as const });

  it('drops the title Google adds above the text', () => {
    const formatted = [block('UPDATED MANUSCRIPT'), block('RESYNC: A  SYSTEM'), block('By')];
    expect(startAtDocText(formatted, [{ kind: 'text', text: 'RESYNC: A SYSTEM' }]).map((b) => b.text)).toEqual(['RESYNC: A  SYSTEM', 'By']);
  });

  it('keeps a title that is part of the text, and falls back to the plain blocks', () => {
    const formatted = [block('My Title'), block('Intro')];
    expect(startAtDocText(formatted, [{ kind: 'text', text: 'My Title' }])).toBe(formatted);
    const plain = [{ kind: 'text' as const, text: 'x' }];
    expect(startAtDocText(null, plain)).toBe(plain);
  });
});
