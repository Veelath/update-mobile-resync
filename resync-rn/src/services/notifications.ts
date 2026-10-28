import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {AndroidForegroundServiceType, AndroidImportance, EventType, type Event} from '@notifee/react-native';
import {supabase} from './supabase';
import {getSession} from './session';
import {navigationRef} from '../navigation/navigationRef';

// Mirrors the web's scan notifications (src/components/ScanNotifications.tsx), kept per user on the phone.
export type AppNotification = {id: string; kind: 'success' | 'error'; title: string; message: string; at: number; read: boolean; scanId?: string};

const MAX = 20;
const RESULT_CHANNEL = 'scan-results';
const PROGRESS_CHANNEL = 'scan-progress';
const RUNNING_ID = 'scan-running';
const listeners = new Set<(items: AppNotification[]) => void>();

async function storageKey(): Promise<string> {
  const {data} = await supabase.auth.getSession();
  return `resync_notifications_v1:${data.session?.user.id ?? 'signed-out'}`;
}

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(await storageKey())) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

async function save(items: AppNotification[]): Promise<AppNotification[]> {
  const next = items.slice(0, MAX);
  await AsyncStorage.setItem(await storageKey(), JSON.stringify(next));
  listeners.forEach(listener => listener(next));
  return next;
}

export async function addNotification(item: Omit<AppNotification, 'id' | 'at' | 'read'>): Promise<AppNotification[]> {
  const entry: AppNotification = {...item, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), read: false};
  return save([entry, ...(await loadNotifications())]);
}

export async function markNotificationsRead(): Promise<AppNotification[]> {
  return save((await loadNotifications()).map(item => ({...item, read: true})));
}

export function subscribeNotifications(listener: (items: AppNotification[]) => void): () => void {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
}

export function timeAgo(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : `${Math.round(hrs / 24)} d ago`;
}

// Opening a report from a notification. Before the app is past Splash/Auth the id waits for the Dashboard.
let pendingScanId: string | null = null;

export function openScanReport(scanId: string) {
  const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
  if (route?.name === 'Report' && (route.params as any)?.result?.analysis_run_id === scanId) return;
  if (route && !['Splash', 'Onboarding', 'Auth'].includes(route.name)) {
    navigationRef.navigate('Report', {scanId});
  } else {
    pendingScanId = scanId;
  }
}

export function takePendingScanId(): string | null {
  const id = pendingScanId;
  pendingScanId = null;
  return id;
}

export async function handleNotificationEvent({type, detail}: Event) {
  const scanId = detail.notification?.data?.scanId;
  if (type === EventType.PRESS && typeof scanId === 'string') openScanReport(scanId);
}

// The foreground service keeps the app process (and the scan's polling loop) alive while it is in the background.
let finishService: (() => void) | null = null;

export function registerNotificationHandlers() {
  notifee.registerForegroundService(() => new Promise<void>(resolve => {finishService = resolve;}));
  notifee.onBackgroundEvent(handleNotificationEvent);
  notifee.onForegroundEvent(handleNotificationEvent);
  notifee.getInitialNotification().then(initial => {
    const scanId = initial?.notification.data?.scanId;
    if (typeof scanId === 'string') openScanReport(scanId);
  }).catch(() => {});
}

async function channels() {
  await notifee.createChannel({id: RESULT_CHANNEL, name: 'Scan results', importance: AndroidImportance.HIGH, sound: 'default'});
  await notifee.createChannel({id: PROGRESS_CHANNEL, name: 'Scan in progress', importance: AndroidImportance.LOW});
}

let settled = false;

async function finish(kind: AppNotification['kind'], title: string, message: string, scanId: string | undefined, notify: boolean) {
  if (settled) return;
  settled = true;
  finishService?.();
  finishService = null;
  await notifee.stopForegroundService().catch(() => {});
  await addNotification({kind, title, message, ...(scanId ? {scanId} : {})}).catch(() => {});
  if (notify) {
    // Android also shows this while the app is open, with the channel's sound: that is the in-app completion sound.
    await notifee.displayNotification({title, body: message, data: scanId ? {scanId} : {},
      android: {channelId: RESULT_CHANNEL, pressAction: {id: 'default'}}}).catch(() => {});
  }
}

// Wraps one scan: progress notification while it runs, one outcome notification + history entry when it ends.
export async function trackScan<T extends {analysis_run_id?: string}>(title: string, run: () => Promise<T>): Promise<T> {
  settled = false;
  const notify = (await getSession()).pushNotifications;
  try {
    if (notify) await notifee.requestPermission();
    await channels();
    await notifee.displayNotification({id: RUNNING_ID, title: 'Analyzing your manuscript', body: title,
      android: {channelId: PROGRESS_CHANNEL, asForegroundService: true, ongoing: true, progress: {indeterminate: true},
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC], pressAction: {id: 'default'}}});
  } catch {
    // Denied permission or a blocked service must not stop the scan itself.
  }
  try {
    const result = await run();
    await finish('success', 'Scan complete', 'Your coherence report is ready to review.', result.analysis_run_id, notify);
    return result;
  } catch (error) {
    await finish('error', 'Scan did not finish', error instanceof Error ? error.message : String(error), undefined, notify);
    throw error;
  }
}
