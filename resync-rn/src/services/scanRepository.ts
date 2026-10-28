// Scan history is hidden until the backend history flow is integrated.
export {runScanApi as executeScan} from './api';
export type {ScanResponse, ScanRunRequest} from './api';

export async function getAllScans(): Promise<never> {
  throw new Error('Scan history is temporarily unavailable.');
}
