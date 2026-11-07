import { expect, it, jest } from '@jest/globals';

jest.mock('../src/config.local', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
}), { virtual: true });

import { config } from '../src/config';

it('uses the deployed backend, disables mocks, and loads only public Supabase configuration', () => {
  expect(config.API_BASE_URL).toBe('https://resync-backend-fh8s.onrender.com/');
  expect(config.USE_MOCK).toBe(false);
  expect(config.SUPABASE_URL).toBe('https://example.supabase.co');
  expect(config.SUPABASE_ANON_KEY).toBe('test-anon-key');
  expect(Object.keys(config).sort()).toEqual(['API_BASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_URL', 'USE_MOCK']);
});
