import axios from 'axios';
import { config } from '../config';

export const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ScanRunRequest {
  document_url: string;
  chapter_category?: string;
  research_theme?: string;
  research_type?: string;
}

export interface InconsistencyItem {
  id: string;
  kind: 'Issue' | 'Strength';
  section_a: string;
  section_b: string;
  description: string;
  fix: string;
  severity?: 'High' | 'Medium' | 'Low';
}

export interface ReferenceItem {
  citation: string;
  url?: string;
  doi?: string;
  isValid: boolean;
}

export interface ScanResponse {
  coherence_score: number;
  overall_assessment: string;
  inconsistencies: InconsistencyItem[];
  references: ReferenceItem[];
  duplicate_sections: string[];
  missing_sections: string[];
  created_at: string;
  manuscript_text?: string;
}

export interface AuthLoginRequest {
  email: string;
  password?: string;
}

export interface AuthRegisterRequest {
  name: string;
  email: string;
  school: string;
  password?: string;
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

export async function runScanApi(req: ScanRunRequest): Promise<ScanResponse> {
  if (!validateGoogleDocsUrl(req.document_url)) {
    throw new Error('Invalid Google Docs URL');
  }
  const response = await apiClient.post<ScanResponse>('api/scans/run', {
    chapter_category: 'Full Manuscript',
    ...req,
  });
  return response.data;
}

export async function loginApi(req: AuthLoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('api/auth/login', req);
  return response.data;
}

export async function registerApi(req: AuthRegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('api/auth/register', req);
  return response.data;
}
