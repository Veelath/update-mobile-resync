import {jest, it, expect} from '@jest/globals';

jest.mock('../src/services/supabase', () => ({supabase: {auth: {getSession: async () => ({data: {session: {access_token: 'test-token'}}})}}}));

import {getManuscriptText, getScanResult, validateGoogleDocsUrl} from '../src/services/api';

it('accepts only HTTPS Google document links', () => {
  expect(validateGoogleDocsUrl('https://docs.google.com/document/d/example/edit')).toBe(true);
  expect(validateGoogleDocsUrl('https://docs.google.com.evil.test/document/d/example/edit')).toBe(false);
  expect(validateGoogleDocsUrl('http://docs.google.com/document/d/example/edit')).toBe(false);
  expect(validateGoogleDocsUrl('https://docs.google.com/spreadsheets/d/example/edit')).toBe(false);
});

it('fetches a saved result with a bearer token and gates its version', async () => {
  const fetchMock = jest.fn<() => Promise<any>>().mockResolvedValue({ok: true, json: async () =>
    ({status: 'completed', result: {result_version: 'v6', analysis_run_id: 'old'}})});
  global.fetch = fetchMock as typeof fetch;
  const result = await getScanResult('old');
  expect(result.result_version).toBe('v6');
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/scans/old'),
    {headers: {Authorization: 'Bearer test-token'}});
});

it('maps unsupported and private manuscript previews', async () => {
  const fetchMock = jest.fn<() => Promise<any>>()
    .mockResolvedValueOnce({status: 400})
    .mockResolvedValueOnce({ok: true, json: async () => ({available: false, reason: 'private'})});
  global.fetch = fetchMock as typeof fetch;
  expect(await getManuscriptText('scan')).toEqual({available: false, reason: 'non_gdocs'});
  expect(await getManuscriptText('scan')).toEqual({available: false, reason: 'private'});
});
