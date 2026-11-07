import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendScanResult, ScanItem } from '../data/scans';
import {
  ScanRunRequest,
  ScanProgress,
  startScanApi,
  unlockScanApi,
} from './api';

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
  return [];
}

export async function saveNewScan(newScan: ScanItem): Promise<ScanItem[]> {
  const current = await getAllScans();
  const updated = [newScan, ...current];
  await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function unlockScan(id: string): Promise<ScanItem> {
  const { result, unlock } = await unlockScanApi(id);
  const current = await getAllScans();
  const updatedScan = scanFromBackend(result);
  const updated = current.map((s) => (s.id === id ? { ...s, ...updatedScan, creditsRemaining: unlock.credits_remaining } : s));
  await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated));
  return updated.find((s) => s.id === id)!;
}

export { loginApi as loginUser, registerApi as registerUser } from './api';

export async function executeScan(req: ScanRunRequest, options?: { onStatus?: (progress: ScanProgress) => void }): Promise<BackendScanResult> {
  return startScanApi(req, options);
}

export function scanFromBackend(result: BackendScanResult): ScanItem {
  return {
    id: result.analysis_run_id,
    title: result.manuscript_title || 'Untitled manuscript',
    status: result.score_breakdown?.band || 'Completed',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    score: result.overall_coherence_score,
    url: result.analysis_run_id,
    unlocked: result.access?.unlocked,
    creditsRemaining: result.credits_remaining,
    result,
  };
}
