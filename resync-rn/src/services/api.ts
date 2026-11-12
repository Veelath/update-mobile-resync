import axios, { AxiosRequestConfig } from 'axios';
import type { BackendScanResult } from '../data/scans';
import type { Session } from '@supabase/supabase-js';
import { sha256 } from '@noble/hashes/sha256';
import { Linking } from 'react-native';
import { config } from '../config';
import { AUTH_REDIRECT_URL, supabase } from './supabase';
import { saveSession } from './session';

export const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function authenticatedRequest<T>(request: AxiosRequestConfig) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Unable to read your session. Please sign in again.');
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in to continue.');
  return apiClient.request<T>({
    ...request,
    headers: { ...request.headers, Authorization: `Bearer ${token}` },
  });
}

export interface ScanRunRequest {
  document_url?: string;
  manuscript_title?: string;
  file?: { uri: string; name: string; type: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status?: number,
    message = 'Request failed.',
    public readonly scanFailure?: 'interrupted' | 'busy',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ScanJobResponse {
  status: 'queued' | 'processing';
  analysis_run_id: string;
  queue_position?: number;
  estimated_wait_seconds?: number;
  status_message?: string;
  status_message_level?: string;
  elapsed_seconds?: number;
}
interface ScanStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  analysis_run_id: string;
  error?: string;
  result?: BackendScanResult;
  failure_kind?: string;
  queue_position?: number;
  estimated_wait_seconds?: number;
  status_message?: string;
  status_message_level?: string;
  elapsed_seconds?: number;
}

interface UnlockResponse { unlocked: true; charged: boolean; credits_remaining: number | null; }

const POLL_INTERVAL_MS = 5000;
export const POLL_SAFETY_TIMEOUT_MS = 60 * 60 * 1000;
// Status checks that fail this many times in a row mean the scan can't be followed, so stop instead of spinning for an hour
const MAX_POLL_FAILURES = 6;
export const LONG_PROCESSING_THRESHOLD_MS = 2 * 60 * 1000;

export type ScanProgress = {
  state: 'processing' | 'taking-longer';
  message: string;
};

export const scanProgressFromStatus = (
  response: Pick<ScanStatusResponse, 'status' | 'elapsed_seconds'>,
  clientElapsedMs = 0,
): ScanProgress => {
  // Scans run side by side, so a scan the backend still lists as queued is shown as analyzing
  if ((response.elapsed_seconds ?? 0) * 1000 >= LONG_PROCESSING_THRESHOLD_MS || clientElapsedMs >= LONG_PROCESSING_THRESHOLD_MS) {
    return { state: 'taking-longer', message: 'This is taking longer than usual. Your scan is still running.' };
  }
  return { state: 'processing', message: 'Analyzing your manuscript' };
};

export const scanFailureFromError = (error: unknown): 'interrupted' | 'busy' | null => {
  if (!(error instanceof ApiError)) return null;
  if (error.scanFailure) return error.scanFailure;
  return error.status === 503 ? 'busy' : null;
};

const errorMessage = (detail: unknown, fallback: string) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((item: any) => item?.msg || String(item)).join(' | ');
  if (detail && typeof detail === 'object' && typeof (detail as any).message === 'string') return (detail as any).message;
  return fallback;
};

const asApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    return new ApiError(error.response?.status, errorMessage(error.response?.data?.detail, error.message));
  }
  return new ApiError(undefined, error instanceof Error ? error.message : 'Unable to reach the backend.');
};

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  name: string;
  email: string;
  school: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  school?: string;
}

export function validateGoogleDocsUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes('demo')) return true;
  return url.includes('docs.google.com');
}

async function sessionUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ApiError(undefined, 'Unable to read your session. Please sign in again.');
  if (!data.session?.user.id) throw new ApiError(undefined, 'Please sign in to continue.');
  return data.session.user.id;
}

const pause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function pollScan(
  analysisRunId: string,
  options: { intervalMs?: number; timeoutMs?: number; onStatus?: (progress: ScanProgress) => void } = {},
): Promise<BackendScanResult> {
  const startedAt = Date.now();
  const deadline = startedAt + (options.timeoutMs ?? POLL_SAFETY_TIMEOUT_MS);
  const intervalMs = options.intervalMs ?? POLL_INTERVAL_MS;
  let failures = 0;
  while (Date.now() <= deadline) {
    if (intervalMs) await pause(intervalMs);
    try {
      const response = await authenticatedRequest<ScanStatusResponse>({ method: 'GET', url: `api/scans/${analysisRunId}` });
      if (response.data.status === 'completed' && response.data.result) return response.data.result;
      if (response.data.status === 'failed') {
        throw new ApiError(
          undefined,
          response.data.error || 'The scan failed on the server.',
          response.data.failure_kind === 'interrupted' ? 'interrupted' : undefined,
        );
      }
      failures = 0;
      options.onStatus?.(scanProgressFromStatus(response.data, Date.now() - startedAt));
    } catch (error) {
      const apiError = asApiError(error);
      if (apiError.status === 402 || apiError.status === 422 || apiError.status === 503) throw apiError;
      if (error instanceof ApiError && error.status === undefined) throw error;
      if (apiError.status === 401 || apiError.status === 403) throw new ApiError(apiError.status, 'Your session expired. Please sign in again.');
      if (apiError.status === 404) throw new ApiError(404, 'We could not find this scan. Please start it again.');
      if (++failures >= MAX_POLL_FAILURES) throw new ApiError(apiError.status, 'We could not check on your scan. Check your connection and try again.');
    }
  }
  throw new ApiError(undefined, 'We could not confirm the scan status after an hour. Please try again.');
}

export async function startScanApi(
  req: ScanRunRequest,
  options?: { intervalMs?: number; timeoutMs?: number; onStatus?: (progress: ScanProgress) => void; onStarted?: (analysisRunId: string) => void },
): Promise<BackendScanResult> {
  try {
    const userId = await sessionUserId();
    let response;
    if (req.file) {
      const form = new FormData();
      form.append('file', req.file as any);
      form.append('user_id', userId);
      if (req.manuscript_title) form.append('manuscript_title', req.manuscript_title);
      response = await authenticatedRequest<ScanJobResponse>({
        method: 'POST', url: 'api/scans/upload', data: form, headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      if (!req.document_url || !validateGoogleDocsUrl(req.document_url)) throw new ApiError(422, 'Invalid Google Docs URL');
      response = await authenticatedRequest<ScanJobResponse>({
        method: 'POST', url: 'api/scans/start',
        data: { user_id: userId, doc_url: req.document_url, manuscript_title: req.manuscript_title },
      });
    }
    if (!response.data.analysis_run_id) throw new ApiError(undefined, 'Backend accepted the scan but returned no analysis_run_id.');
    options?.onStarted?.(response.data.analysis_run_id);
    options?.onStatus?.(scanProgressFromStatus(response.data));
    return pollScan(response.data.analysis_run_id, options);
  } catch (error) {
    throw asApiError(error);
  }
}

export async function getScanApi(analysisRunId: string): Promise<BackendScanResult> {
  try {
    const response = await authenticatedRequest<ScanStatusResponse>({ method: 'GET', url: `api/scans/${analysisRunId}` });
    if (response.data.status !== 'completed' || !response.data.result) throw new ApiError(undefined, 'The full report is not ready. Refresh and try again.');
    return response.data.result;
  } catch (error) {
    throw asApiError(error);
  }
}

export async function unlockScanApi(analysisRunId: string): Promise<{ result: BackendScanResult; unlock: UnlockResponse }> {
  try {
    const response = await authenticatedRequest<UnlockResponse>({ method: 'POST', url: `api/scans/${analysisRunId}/unlock` });
    if (!response.data.unlocked) throw new ApiError(undefined, 'The report could not be unlocked.');
    return { unlock: response.data, result: await getScanApi(analysisRunId) };
  } catch (error) {
    throw asApiError(error);
  }
}

export interface CreditLedgerEntry { delta: number; balance_after: number; kind: string; created_at: string; }

export type PaymentMethod = 'card' | 'gcash' | 'bank_transfer';

export interface PurchaseProof {
  reference_number: string;
  payer_name?: string;
  file_name: string;
  content_type: string;
  proof_data: string; // base64
}

async function creditsRequest<T>(request: AxiosRequestConfig) {
  try {
    const userId = await sessionUserId();
    const response = await authenticatedRequest<T>({ ...request, headers: { ...request.headers, 'X-User-Id': userId } });
    return response.data;
  } catch (error) {
    throw asApiError(error);
  }
}

export const getCreditBalanceApi = async (): Promise<number> =>
  (await creditsRequest<{ balance: number }>({ method: 'GET', url: 'api/credits/balance' })).balance;

export const getCreditHistoryApi = async (): Promise<CreditLedgerEntry[]> =>
  (await creditsRequest<{ entries: CreditLedgerEntry[] }>({ method: 'GET', url: 'api/credits/history', params: { limit: 200 } })).entries;

/** Adds credits to the wallet. The backend sets the price and takes no real payment yet. */
export const purchaseCreditsApi = (creditAmount: number, method: PaymentMethod, proof: PurchaseProof | null) =>
  creditsRequest<{ amount: number; credit_amount: number; balance: number }>({
    method: 'POST',
    url: 'api/credits/purchase',
    data: { credit_amount: creditAmount, method, proof },
  });

export async function loginApi(req: AuthLoginRequest): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.email.trim().toLowerCase(),
    password: req.password,
  });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Sign-in did not return a session. Please try again.');
  return saveAuthSession(data.session);
}

export async function registerApi(req: AuthRegisterRequest): Promise<AuthResponse | null> {
  const { data, error } = await supabase.auth.signUp({
    email: req.email.trim().toLowerCase(),
    password: req.password,
    options: {
      data: { full_name: req.name.trim(), school: req.school.trim() },
    },
  });
  if (error) throw new Error(error.message);
  if (data.user?.identities?.length === 0) {
    throw new Error('This email is already registered. Try signing in instead.');
  }
  return data.session ? saveAuthSession(data.session) : null;
}

async function saveAuthSession(session: Session): Promise<AuthResponse> {
  const { user } = session;
  const response: AuthResponse = {
    token: session.access_token,
    email: user.email || '',
    name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || '',
    school: user.user_metadata.school || '',
  };
  await saveSession({
    authToken: response.token,
    userEmail: response.email,
    userName: response.name,
    userInstitution: response.school,
    isLoggedIn: true,
  });
  return response;
}

export async function loginWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  if (!data.url) throw new Error('Unable to start Google sign-in. Please try again.');
  const url = new URL(data.url);
  // Hermes lacks WebCrypto: upgrade Supabase's plain challenge while keeping its stored verifier.
  if (url.searchParams.get('code_challenge_method') === 'plain') {
    const verifier = url.searchParams.get('code_challenge');
    if (!verifier) throw new Error('Unable to start secure Google sign-in. Please try again.');
    const challenge = btoa(String.fromCharCode(...sha256(verifier)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 's256');
  }
  try {
    await Linking.openURL(url.toString());
  } catch {
    throw new Error('Unable to open Google sign-in. Please check your browser and try again.');
  }
}

export async function completeAuthRedirect(url: string): Promise<boolean> {
  const callback = new URL(url);
  const redirect = new URL(AUTH_REDIRECT_URL);
  if (callback.protocol !== redirect.protocol || callback.host !== redirect.host || callback.pathname !== redirect.pathname) {
    return false;
  }
  const params = callback.searchParams;
  const error = params.get('error') || new URLSearchParams(callback.hash.slice(1)).get('error');
  if (error) throw new Error('Google sign-in was cancelled or could not be completed. Please try again.');
  const code = params.get('code');
  if (!code) throw new Error('Google sign-in did not return a code. Please try again.');
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw new Error(exchangeError.message);
  if (!data.session) throw new Error('Google sign-in did not return a session. Please try again.');
  await saveAuthSession(data.session);
  return true;
}
