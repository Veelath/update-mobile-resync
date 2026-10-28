import {config} from '../config';
import {supabase} from './supabase';
import {adaptScanResult, type ScanResult} from './v7Result';

export type ScanResponse = ScanResult;

export interface ScanRunRequest {
  manuscript_title: string;
  doc_url?: string;
  file?: {uri: string; name: string; type: string};
  template_toc?: string[];
  onProgress?: (elapsedMs: number) => void;
}

export function validateGoogleDocsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'docs.google.com' && url.pathname.startsWith('/document/d/');
  } catch {
    return false;
  }
}

async function checked(response: Response): Promise<any> {
  const body = await response.json().catch(() => ({}));
  if (response.status === 402) throw new Error('Insufficient credits to start this scan.');
  if (!response.ok) {
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || body) || `HTTP ${response.status}`);
  }
  return body;
}

async function scanHeaders(): Promise<Record<string, string>> {
  const {data: {session}} = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  return {Authorization: `Bearer ${session.access_token}`};
}

export async function getScanResult(id: string): Promise<ScanResult> {
  const job = await checked(await fetch(`${config.API_BASE_URL}/api/scans/${encodeURIComponent(id)}`, {headers: await scanHeaders()}));
  if (job.status === 'failed') throw new Error(job.error || `Scan ${id} failed.`);
  if (job.status !== 'completed' || !job.result) throw new Error(`Scan ${id} is not complete.`);
  return adaptScanResult(job.result);
}

export type ManuscriptText = {available: true; text: string; fetched_at?: string} |
  {available: false; reason: 'non_gdocs' | 'private' | 'unavailable'};

export async function getManuscriptText(id: string): Promise<ManuscriptText> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(`${config.API_BASE_URL}/api/scans/${encodeURIComponent(id)}/manuscript`,
        {headers: await scanHeaders(), signal: controller.signal});
    } finally {
      clearTimeout(timeout);
    }
    if (response.status === 400) return {available: false, reason: 'non_gdocs'};
    if (response.status === 401 || response.status === 403) return {available: false, reason: 'private'};
    if (!response.ok) return {available: false, reason: 'unavailable'};
    const body = await response.json();
    if (body.available && typeof body.text === 'string') return {available: true, text: body.text, fetched_at: body.fetched_at};
    return {available: false, reason: body.reason === 'private' ? 'private' : 'unavailable'};
  } catch {
    return {available: false, reason: 'unavailable'};
  }
}

export async function runScanApi(req: ScanRunRequest): Promise<ScanResult> {
  if (!req.file && !validateGoogleDocsUrl(req.doc_url || '')) throw new Error('Enter a valid Google Docs document URL.');
  const {data: {session}} = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  const headers: Record<string, string> = {Authorization: `Bearer ${session.access_token}`};
  let body: string | FormData;
  let endpoint: string;
  if (req.file) {
    const form = new FormData();
    form.append('file', req.file as any);
    form.append('user_id', session.user.id);
    form.append('manuscript_title', req.manuscript_title);
    if (req.template_toc?.length) form.append('template_toc', JSON.stringify(req.template_toc));
    body = form;
    endpoint = '/api/scans/upload';
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({user_id: session.user.id, manuscript_title: req.manuscript_title,
      doc_url: req.doc_url, ...(req.template_toc?.length ? {template_toc: req.template_toc} : {})});
    endpoint = '/api/scans/start';
  }
  const started = await checked(await fetch(`${config.API_BASE_URL}${endpoint}`, {method: 'POST', headers, body}));
  const id = started.analysis_run_id;
  if (!id) throw new Error('Backend accepted the scan without an analysis_run_id.');
  const startTime = Date.now();
  let failures = 0;
  while (Date.now() - startTime < 15 * 60 * 1000) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    req.onProgress?.(Date.now() - startTime);
    let job: any;
    try {
      job = await checked(await fetch(`${config.API_BASE_URL}/api/scans/${id}`, {headers}));
      failures = 0;
    } catch (error) {
      if (++failures >= 4) throw new Error(`Lost connection while scanning (${id}): ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (job.status === 'failed') throw new Error(job.error || `Scan ${id} failed.`);
    if (job.status === 'completed') {
      if (!job.result) throw new Error(`Scan ${id} completed without a result.`);
      return adaptScanResult(job.result);
    }
  }
  throw new Error(`Scan timed out. It may still be running on the server (${id}).`);
}
