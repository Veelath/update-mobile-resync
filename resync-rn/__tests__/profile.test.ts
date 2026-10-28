import {it, expect, jest} from '@jest/globals';
import {avatarError, loadAvatar, loadProfile, saveAvatar, saveProfile} from '../src/services/profile';

jest.mock('../src/services/supabase', () => ({supabase: {auth: {}}}));
jest.mock('../src/services/session', () => ({getSession: async () => ({}), saveSession: async () => {}}));
const {passwordError} = require('../src/screens/SettingsScreen');

it('accepts only JPEG/PNG photos up to 5 MB, with the web wording', () => {
  expect(avatarError({type: 'image/gif', size: 10})).toBe('Please choose a JPEG or PNG image.');
  expect(avatarError({type: 'image/png', size: 5 * 1024 * 1024 + 1})).toBe('That image is larger than 5 MB. Please choose a smaller one.');
  expect(avatarError({type: 'image/jpeg', size: 1000})).toBe('');
});

it('keeps profile edits and the photo per user on the phone', async () => {
  const user = {id: 'u1', email: 'ana@school.edu', user_metadata: {full_name: 'Ana Cruz'}} as any;
  expect(await loadProfile(user)).toEqual({fullName: 'Ana Cruz', email: 'ana@school.edu', contactNumber: ''});
  await saveProfile('u1', {fullName: 'Ana M. Cruz', email: 'ana@school.edu', contactNumber: '0917'});
  expect((await loadProfile(user)).contactNumber).toBe('0917');
  expect((await loadProfile({...user, id: 'u2'})).contactNumber).toBe('');
  await saveAvatar('u1', 'file:///photo.jpg');
  expect(await loadAvatar('u1')).toBe('file:///photo.jpg');
  await saveAvatar('u1', null);
  expect(await loadAvatar('u1')).toBeNull();
});

it('checks a password change like the web before calling Supabase', () => {
  expect(passwordError('', 'abcdefgh', 'abcdefgh')).toBe('Please enter your current password.');
  expect(passwordError('old', 'short', 'short')).toBe('New password must be at least 8 characters long.');
  expect(passwordError('old', 'abcdefgh', 'abcdefgx')).toBe('New passwords do not match.');
  expect(passwordError('old', 'abcdefgh', 'abcdefgh')).toBe('');
});
