import { beforeEach, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSession, getSession } from '../src/services/session';
import { supabase } from '../src/services/supabase';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../src/services/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(), signOut: jest.fn() } },
}));

const auth = jest.mocked(supabase.auth);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

it('ignores legacy mock tokens and logged-in flags without a Supabase session', async () => {
  await AsyncStorage.multiSet([['auth_token', 'legacy-fake-token'], ['is_logged_in', 'true']]);
  expect(await getSession()).toMatchObject({ authToken: null, isLoggedIn: false });
});

it('reads the current Supabase token after refresh while retaining local preferences', async () => {
  await AsyncStorage.setItem('theme_preference', 'dark');
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token', user: { email: 'reader@example.com' } } as any }, error: null });
  expect(await getSession()).toMatchObject({ authToken: 'fresh-token', isLoggedIn: true, userEmail: 'reader@example.com', themePreference: 'dark' });
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'refreshed-token', user: { email: 'reader@example.com' } } as any }, error: null });
  expect((await getSession()).authToken).toBe('refreshed-token');
});

it('signs out of Supabase locally and removes the legacy auth cache', async () => {
  auth.signOut.mockResolvedValue({ error: null });
  await AsyncStorage.multiSet([['auth_token', 'old-token'], ['is_logged_in', 'true']]);
  await clearSession();
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(await AsyncStorage.getItem('auth_token')).toBeNull();
  expect(await AsyncStorage.getItem('is_logged_in')).toBeNull();
});

it('reports a sign-out failure before discarding the local auth cache', async () => {
  auth.signOut.mockResolvedValue({ error: new Error('storage unavailable') as any });
  await AsyncStorage.setItem('auth_token', 'old-token');
  await expect(clearSession()).rejects.toThrow('Unable to sign out');
  expect(await AsyncStorage.getItem('auth_token')).toBe('old-token');
});
