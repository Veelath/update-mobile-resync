import {jest, it, expect, beforeEach} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import {addNotification, loadNotifications, markNotificationsRead, trackScan} from '../src/services/notifications';

let mockUserId = 'user-a';
jest.mock('../src/services/supabase', () => ({supabase: {auth: {getSession: async () => ({data: {session: {user: {id: mockUserId}}}})}}}));
jest.mock('../src/navigation/navigationRef', () => ({navigationRef: {isReady: () => false}}));

beforeEach(async () => {
  mockUserId = 'user-a';
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('keeps the 20 newest notifications per user and marks them read', async () => {
  for (let i = 0; i < 25; i++) await addNotification({kind: 'success', title: `t${i}`, message: 'm'});
  const items = await loadNotifications();
  expect(items).toHaveLength(20);
  expect(items[0].title).toBe('t24');
  expect((await markNotificationsRead()).every(item => item.read)).toBe(true);
  mockUserId = 'user-b';
  expect(await loadNotifications()).toEqual([]);
});

it('records one success with the scan id and stops the service', async () => {
  const result = await trackScan('Thesis', async () => ({analysis_run_id: 'run-1'}));
  expect(result.analysis_run_id).toBe('run-1');
  const [item] = await loadNotifications();
  expect(item).toMatchObject({kind: 'success', title: 'Scan complete', message: 'Your coherence report is ready to review.', scanId: 'run-1'});
  expect(notifee.stopForegroundService).toHaveBeenCalledTimes(1);
  expect(notifee.displayNotification).toHaveBeenLastCalledWith(expect.objectContaining({title: 'Scan complete', data: {scanId: 'run-1'}}));
});

it('records a failure and still rethrows it', async () => {
  await expect(trackScan('Thesis', async () => {throw new Error('Backend down');})).rejects.toThrow('Backend down');
  expect(await loadNotifications()).toMatchObject([{kind: 'error', title: 'Scan did not finish', message: 'Backend down'}]);
});

it('runs the scan even when notification permission fails', async () => {
  (notifee.requestPermission as jest.Mock<any>).mockRejectedValueOnce(new Error('denied'));
  await expect(trackScan('Thesis', async () => ({analysis_run_id: 'run-2'}))).resolves.toEqual({analysis_run_id: 'run-2'});
  expect(await loadNotifications()).toHaveLength(1);
});
