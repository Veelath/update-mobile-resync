import {jest, it, expect} from '@jest/globals';

jest.mock('../src/services/supabase', () => ({supabase: {}}));

import {validateGoogleDocsUrl} from '../src/services/api';

it('accepts only HTTPS Google document links', () => {
  expect(validateGoogleDocsUrl('https://docs.google.com/document/d/example/edit')).toBe(true);
  expect(validateGoogleDocsUrl('https://docs.google.com.evil.test/document/d/example/edit')).toBe(false);
  expect(validateGoogleDocsUrl('http://docs.google.com/document/d/example/edit')).toBe(false);
  expect(validateGoogleDocsUrl('https://docs.google.com/spreadsheets/d/example/edit')).toBe(false);
});
