import { useEffect, useState } from 'react';
import { ScanProgress } from './api';

export type ActiveScan = {
  title: string;
  progress: ScanProgress;
  /** When the scan left the queue; null while it is waiting in line. */
  runningSince: number | null;
};

let current: ActiveScan | null = null;
const listeners = new Set<(scan: ActiveScan | null) => void>();

const publish = (scan: ActiveScan | null) => {
  current = scan;
  listeners.forEach((listener) => listener(scan));
};

const runningSince = (progress: ScanProgress, previous: number | null) =>
  progress.state === 'queued' ? null : previous ?? Date.now();

export const startActiveScan = (title: string, progress: ScanProgress) =>
  publish({ title, progress, runningSince: runningSince(progress, null) });

export const updateActiveScan = (progress: ScanProgress) => {
  if (current) publish({ ...current, progress, runningSince: runningSince(progress, current.runningSince) });
};

export const clearActiveScan = () => publish(null);

/** The scan running right now, so screens other than Upload can show it. */
export const useActiveScan = (): ActiveScan | null => {
  const [scan, setScan] = useState(current);
  useEffect(() => {
    setScan(current);
    listeners.add(setScan);
    return () => {
      listeners.delete(setScan);
    };
  }, []);
  return scan;
};
