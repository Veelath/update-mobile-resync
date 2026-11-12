import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../src/config.local', () => ({
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
}), { virtual: true });
jest.mock('../src/services/supabase', () => ({
  AUTH_REDIRECT_URL: 'com.resync.app://auth/callback',
  supabase: { auth: { getSession: jest.fn() } },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(),
}));
jest.mock('../src/services/session', () => ({ saveSession: jest.fn() }));

import {
  apiClient,
  ApiError,
  getCreditBalanceApi,
  LONG_PROCESSING_THRESHOLD_MS,
  pollScan,
  scanFailureFromError,
  scanProgressFromStatus,
  unlockScanApi,
} from '../src/services/api';
import { scanFromBackend } from '../src/services/scanRepository';
import { supabase } from '../src/services/supabase';

const result = {
  analysis_run_id: 'scan-1',
  manuscript_title: 'Paper',
  overall_coherence_score: 82,
  sections_analyzed: ['Introduction', 'Methods'],
  access: { unlocked: false, unlock_cost: 1, locked_counts: { sections: 1, citations: 3, recommendations: 4 } },
  recommendations: [],
  citations: [],
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'token', user: { id: 'user-1' } } }, error: null,
  } as any);
});

describe('credits', () => {
  it('reads the balance for the signed-in user', async () => {
    const request = jest.spyOn(apiClient, 'request').mockResolvedValue({ data: { user_id: 'user-1', balance: 7 } } as any);
    await expect(getCreditBalanceApi()).resolves.toBe(7);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'api/credits/balance',
      headers: expect.objectContaining({ 'X-User-Id': 'user-1', Authorization: 'Bearer token' }),
    }));
  });

  it('does not invent a balance when the request fails', async () => {
    jest.spyOn(apiClient, 'request').mockRejectedValue(new Error('offline'));
    await expect(getCreditBalanceApi()).rejects.toThrow('offline');
  });
});

describe('scan polling', () => {
  it('finishes when the backend reports completed', async () => {
    jest.spyOn(apiClient, 'request')
      .mockResolvedValueOnce({ data: { status: 'processing', analysis_run_id: 'scan-1' } } as any)
      .mockResolvedValueOnce({ data: { status: 'completed', analysis_run_id: 'scan-1', result } } as any);

    await expect(pollScan('scan-1', { intervalMs: 0 })).resolves.toEqual(result);
  });

  it('fails when the backend reports failed', async () => {
    jest.spyOn(apiClient, 'request').mockResolvedValue({
      data: { status: 'failed', analysis_run_id: 'scan-1', error: 'Not a research paper.' },
    } as any);

    await expect(pollScan('scan-1', { intervalMs: 0 })).rejects.toThrow('Not a research paper.');
  });

  it('shows a queued scan as analyzing, since scans run side by side', () => {
    expect(scanProgressFromStatus({ status: 'queued' })).toMatchObject({ state: 'processing' });
  });

  it('keeps a long-running scan in progress with the taking-longer message', () => {
    const progress = scanProgressFromStatus({
      status: 'processing',
      elapsed_seconds: LONG_PROCESSING_THRESHOLD_MS / 1000,
    });

    expect(progress).toEqual({
      state: 'taking-longer',
      message: 'This is taking longer than usual. Your scan is still running.',
    });
  });

  it('maps an interrupted backend failure to the interrupted state', async () => {
    jest.spyOn(apiClient, 'request').mockResolvedValue({
      data: {
        status: 'failed',
        analysis_run_id: 'scan-1',
        error: 'This scan was interrupted because our server restarted. Nothing was charged. Please start it again.',
        failure_kind: 'interrupted',
      },
    } as any);

    const error = await pollScan('scan-1', { intervalMs: 0 }).catch((reason) => reason);
    expect(scanFailureFromError(error)).toBe('interrupted');
  });

  it('stops following a scan whose status checks keep failing', async () => {
    const request = jest.spyOn(apiClient, 'request').mockRejectedValue(new ApiError(500, 'boom'));

    await expect(pollScan('scan-1', { intervalMs: 0 })).rejects.toThrow('We could not check on your scan');
    expect(request).toHaveBeenCalledTimes(6);
  });

  it('stops right away when the session has expired', async () => {
    jest.spyOn(apiClient, 'request').mockRejectedValue(new ApiError(401, 'no'));

    await expect(pollScan('scan-1', { intervalMs: 0 })).rejects.toThrow('session expired');
  });

  it('maps a 503 response to the busy state', () => {
    expect(scanFailureFromError(new ApiError(503, 'busy'))).toBe('busy');
  });
});

it('maps a locked result without inventing locked counts', () => {
  const scan = scanFromBackend(result);
  expect(scan.unlocked).toBe(false);
  expect(scan.result?.access?.locked_counts).toEqual({ sections: 1, citations: 3, recommendations: 4 });
});

describe('unlock', () => {
  it('returns the refreshed unlocked result after successful unlock', async () => {
    jest.spyOn(apiClient, 'request')
      .mockResolvedValueOnce({ data: { unlocked: true, charged: true, credits_remaining: 2 } } as any)
      .mockResolvedValueOnce({ data: { status: 'completed', analysis_run_id: 'scan-1', result: { ...result, access: { ...result.access, unlocked: true } } } } as any);

    await expect(unlockScanApi('scan-1')).resolves.toMatchObject({
      unlock: { credits_remaining: 2 }, result: { access: { unlocked: true } },
    });
  });

  it('reports a 402 without treating the report as unlocked', async () => {
    const error = Object.assign(new Error('Request failed'), {
      isAxiosError: true, response: { status: 402, data: { detail: 'Not enough credits to unlock this report.' } },
    });
    jest.spyOn(apiClient, 'request').mockRejectedValue(error);

    await expect(unlockScanApi('scan-1')).rejects.toMatchObject({
      status: 402, message: 'Not enough credits to unlock this report.',
    });
  });
});
