import { expect, it, jest } from '@jest/globals';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

jest.mock('react-native-get-random-values', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../src/config.local', () => ({
  SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon-key',
}), { virtual: true });
jest.mock('@supabase/supabase-js', () => ({
  processLock: jest.fn(),
  createClient: jest.fn(() => ({ auth: { startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() } })),
}));

it('persists auth in AsyncStorage, uses PKCE, and ties refresh to foreground state', () => {
  const listener = jest.spyOn(AppState, 'addEventListener');
  const { supabase } = require('../src/services/supabase');
  expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'test-anon-key', {
    auth: {
      storage: AsyncStorage, autoRefreshToken: true, persistSession: true,
      detectSessionInUrl: false, flowType: 'pkce', lock: processLock,
    },
  });
  expect(listener).toHaveBeenCalledTimes(1);
  const change = listener.mock.calls[0][1];
  const starts = supabase.auth.startAutoRefresh.mock.calls.length;
  change('active');
  expect(supabase.auth.startAutoRefresh).toHaveBeenCalledTimes(starts + 1);
  change('background');
  expect(supabase.auth.stopAutoRefresh).toHaveBeenCalled();
});
