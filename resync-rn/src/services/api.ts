import {config} from '../config';
import {supabase} from './supabase';

export interface ScanResponse {
  status: string;
  analysis_run_id: string;
  user_id: string;
  manuscript_id: string;
  doc_url: string;
  overall_coherence_score: number;
  sections_analyzed: string[];
  missing_sections: string[];
  inconsistencies: {
    inconsistency_id: string;
    section_a: string;
    section_b: string;
    coherence_score: number | null;
    explanation_what: string;
    explanation_why: string;
    suggested_fix: string;
    finding_status: string;
  }[];
  citations: {
    citation_raw_reference_text: string;
    citation_is_accessible: boolean;
    citation_status: string;
    citation_primary_link?: string | null;
  }[];
  score_breakdown?: {
    overall_score: number;
    band: string;
    v6_dimensions?: Record<string, Record<string, number | null>> | null;
  } | null;
}

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

export async function runScanApi(req: ScanRunRequest): Promise<ScanResponse> {
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
      return job.result as ScanResponse;
    }
  }
  throw new Error(`Scan timed out. It may still be running on the server (${id}).`);
}
