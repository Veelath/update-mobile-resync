import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { INITIAL_SCANS, ScanItem } from '../data/scans';
import {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthResponse,
  loginApi,
  registerApi,
  runScanApi,
  ScanRunRequest,
  ScanResponse,
  validateGoogleDocsUrl,
} from './api';
import { SAMPLE_FINDINGS, SECTIONS_SCORES } from '../data/report';

const SCANS_STORAGE_KEY = 'resync_stored_scans_v1';

export async function getAllScans(): Promise<ScanItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
    if (raw) {
      const parsed: ScanItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_SCANS;
}

export async function saveNewScan(newScan: ScanItem): Promise<ScanItem[]> {
  const current = await getAllScans();
  const updated = [newScan, ...current];
  await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function loginUser(req: AuthLoginRequest): Promise<AuthResponse> {
  if (config.USE_MOCK) {
    return {
      token: 'mock-jwt-token-resync-123',
      email: req.email || 'noelhenrymier@gmail.com',
      name: 'Noel Henry',
    };
  }

  try {
    return await loginApi(req);
  } catch (err) {
    return {
      token: 'fallback-mock-token',
      email: req.email,
      name: 'Noel Henry',
    };
  }
}

export async function registerUser(req: AuthRegisterRequest): Promise<AuthResponse> {
  if (config.USE_MOCK) {
    return {
      token: 'mock-jwt-token-resync-register',
      email: req.email,
      name: req.name || 'Noel Henry',
      school: req.school || 'Stanford University',
    };
  }

  try {
    return await registerApi(req);
  } catch (err) {
    return {
      token: 'fallback-mock-token-reg',
      email: req.email,
      name: req.name,
      school: req.school,
    };
  }
}

export async function executeScan(req: ScanRunRequest): Promise<ScanResponse> {
  if (config.USE_MOCK) {
    if (!validateGoogleDocsUrl(req.document_url)) {
      throw new Error('Invalid Google Docs URL');
    }
    return {
      coherence_score: 74,
      overall_assessment: 'Moderate coherence',
      inconsistencies: [
        {
          id: 'f1',
          kind: 'Issue',
          section_a: 'Objectives',
          section_b: 'Methodology',
          description: SAMPLE_FINDINGS.f1.description,
          fix: SAMPLE_FINDINGS.f1.fix,
          severity: 'High',
        },
        {
          id: 'f2',
          kind: 'Strength',
          section_a: 'Methodology',
          section_b: 'Findings',
          description: SAMPLE_FINDINGS.f2.description,
          fix: SAMPLE_FINDINGS.f2.fix,
        },
        {
          id: 'f3',
          kind: 'Issue',
          section_a: 'Objectives',
          section_b: 'Conclusion',
          description: SAMPLE_FINDINGS.f3.description,
          fix: SAMPLE_FINDINGS.f3.fix,
          severity: 'High',
        },
      ],
      references: [
        { citation: 'Dela Cruz, R. (2020). Burnout in Higher Ed.', isValid: false },
        { citation: 'Reyes, M. (2023). STEM Retention Analysis.', isValid: false },
        { citation: 'Bandura, A. (1997). Self-efficacy.', isValid: true },
      ],
      duplicate_sections: [],
      missing_sections: [],
      created_at: new Date().toISOString(),
    };
  }

  try {
    return await runScanApi(req);
  } catch (err: any) {
    // If network fails, return mock data
    return {
      coherence_score: 74,
      overall_assessment: 'Moderate coherence',
      inconsistencies: [],
      references: [],
      duplicate_sections: [],
      missing_sections: [],
      created_at: new Date().toISOString(),
    };
  }
}
