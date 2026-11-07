import 'react-native-url-polyfill/auto';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import {
  apiClient, authenticatedRequest, completeAuthRedirect,
  loginApi, loginWithGoogle, registerApi,
} from '../src/services/api';
import { supabase, AUTH_REDIRECT_URL } from '../src/services/supabase';
import { saveSession } from '../src/services/session';

jest.mock('../src/config.local', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
}), { virtual: true });
jest.mock('../src/services/supabase', () => ({
  AUTH_REDIRECT_URL: 'com.resync.app://auth/callback',
  supabase: { auth: {
    getSession: jest.fn(), signInWithPassword: jest.fn(), signUp: jest.fn(),
    signInWithOAuth: jest.fn(), exchangeCodeForSession: jest.fn(),
  } },
}));
jest.mock('../src/services/session', () => ({ saveSession: jest.fn() }));

const auth = jest.mocked(supabase.auth);
const session: Session = {
  access_token: 'test-access-token', refresh_token: 'test-refresh-token',
  expires_in: 3600, token_type: 'bearer',
  user: {
    id: 'test-user', email: 'reader@example.com',
    app_metadata: {}, user_metadata: { full_name: 'Test Reader', school: 'Test School' },
    aud: 'authenticated', created_at: '2026-01-01T00:00:00Z',
  },
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();
});

describe('authenticated requests', () => {
  it('adds the current Bearer token, preserves other headers, and rejects a missing session before sending', async () => {
    const request = jest.spyOn(apiClient, 'request').mockResolvedValue({ data: { ok: true } });
    auth.getSession.mockResolvedValue({ data: { session }, error: null });
    await authenticatedRequest({ url: 'api/example', headers: { 'X-Test': 'kept', Authorization: 'old' } });
    const headers = request.mock.calls[0][0].headers;
    expect(headers).toMatchObject({ Authorization: 'Bearer test-access-token', 'X-Test': 'kept' });

    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(authenticatedRequest({ url: 'api/example' })).rejects.toThrow('Please sign in to continue.');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('fails clearly if the stored session cannot be read', async () => {
    const request = jest.spyOn(apiClient, 'request');
    auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('storage unavailable') as any });
    await expect(authenticatedRequest({ url: 'api/example' })).rejects.toThrow('Unable to read your session');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('email auth', () => {
  it('signs in through Supabase and maps its session into the existing app fields', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session, user: session.user }, error: null });
    await expect(loginApi({ email: ' Reader@Example.com ', password: 'password' })).resolves.toMatchObject({ token: session.access_token });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'reader@example.com', password: 'password' });
    expect(saveSession).toHaveBeenCalledWith({
      authToken: session.access_token, userEmail: session.user.email, userName: 'Test Reader',
      userInstitution: 'Test School', isLoggedIn: true,
    });
  });

  it('propagates login errors without saving a fake session', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error: new Error('Invalid login credentials') as any });
    await expect(loginApi({ email: 'reader@example.com', password: 'wrong' })).rejects.toThrow('Invalid login credentials');
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('leaves confirmation-required signup signed out', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: session.user }, error: null });
    await expect(registerApi({ name: ' Test Reader ', email: ' Reader@Example.com ', password: 'password', school: '' })).resolves.toBeNull();
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'reader@example.com', password: 'password', options: { data: { full_name: 'Test Reader', school: '' } },
    });
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('maps signup immediately when Supabase returns a session', async () => {
    auth.signUp.mockResolvedValue({ data: { session, user: session.user }, error: null });
    await expect(registerApi({ name: 'Test Reader', email: 'reader@example.com', password: 'password', school: '' })).resolves.toMatchObject({ token: session.access_token });
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it('reports signup errors and already-registered email without saving a session', async () => {
    const input = { name: 'Test Reader', email: 'reader@example.com', password: 'password', school: '' };
    auth.signUp.mockResolvedValue({ data: { session: null, user: null }, error: new Error('Signup unavailable') as any });
    await expect(registerApi(input)).rejects.toThrow('Signup unavailable');
    auth.signUp.mockResolvedValue({ data: { session: null, user: { ...session.user, identities: [] } }, error: null });
    await expect(registerApi(input)).rejects.toThrow('already registered');
    expect(saveSession).not.toHaveBeenCalled();
  });
});

describe('Google OAuth', () => {
  it('opens Supabase OAuth in the browser with the native redirect and waits for the callback', async () => {
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://example.supabase.co/auth/v1/authorize' }, error: null });
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await loginWithGoogle();
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google', options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
    });
    expect(open).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/authorize');
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('reports a browser launch failure without signing in', async () => {
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://example.supabase.co/auth/v1/authorize' }, error: null });
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No browser'));
    await expect(loginWithGoogle()).rejects.toThrow('Unable to open Google sign-in');
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('uses an S256 challenge on Hermes, verified against the RFC 7636 example', async () => {
    const url = 'https://example.supabase.co/auth/v1/authorize?code_challenge_method=plain&code_challenge=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    auth.signInWithOAuth.mockResolvedValue({ data: { provider: 'google', url }, error: null });
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await loginWithGoogle();
    const opened = new URL(open.mock.calls[0][0]);
    expect(opened.searchParams.get('code_challenge_method')).toBe('s256');
    expect(opened.searchParams.get('code_challenge')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('exchanges a PKCE code and maps the real session', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { session, user: session.user }, error: null } as any);
    await expect(completeAuthRedirect(`${AUTH_REDIRECT_URL}?code=test-code`)).resolves.toBe(true);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated links and rejects missing codes and provider errors', async () => {
    await expect(completeAuthRedirect('https://example.com/?code=test')).resolves.toBe(false);
    await expect(completeAuthRedirect('com.resync.app://auth/other?code=test')).resolves.toBe(false);
    await expect(completeAuthRedirect(AUTH_REDIRECT_URL)).rejects.toThrow('did not return a code');
    await expect(completeAuthRedirect(`${AUTH_REDIRECT_URL}?error=access_denied`)).rejects.toThrow('cancelled');
    await expect(completeAuthRedirect(`${AUTH_REDIRECT_URL}#error=access_denied`)).rejects.toThrow('cancelled');
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('does not save a session when the code exchange fails', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null, user: null }, error: new Error('Code expired') as any } as any);
    await expect(completeAuthRedirect(`${AUTH_REDIRECT_URL}?code=expired`)).rejects.toThrow('Code expired');
    expect(saveSession).not.toHaveBeenCalled();
  });
});
