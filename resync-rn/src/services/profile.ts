import AsyncStorage from '@react-native-async-storage/async-storage';
import type {User} from '@supabase/supabase-js';

// Profile edits and the photo stay on this phone, like the web (owner decision).
export type ProfileFields = {fullName: string; email: string; contactNumber: string};

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const profileKey = (userId?: string) => `resync_profile_v1:${userId || 'guest'}`;
const avatarKey = (userId?: string) => `resync_avatar_v1:${userId || 'guest'}`;

export function profileFromUser(user: User | null): ProfileFields {
  const meta = user?.user_metadata || {};
  const fallback = user?.email?.split('@')[0] || 'User';
  return {fullName: meta.full_name || [meta.first_name, meta.middle_name, meta.last_name].filter(Boolean).join(' ') || fallback,
    email: user?.email || '', contactNumber: ''};
}

export async function loadProfile(user: User | null): Promise<ProfileFields> {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(profileKey(user?.id))) || 'null');
    return saved ? {...profileFromUser(user), ...saved} : profileFromUser(user);
  } catch {
    return profileFromUser(user);
  }
}

export async function saveProfile(userId: string | undefined, profile: ProfileFields): Promise<void> {
  await AsyncStorage.setItem(profileKey(userId), JSON.stringify(profile));
}

// Same checks and wording as the web's avatar upload.
export function avatarError(file: {type?: string | null; size?: number | null}): string {
  if (file.type !== 'image/jpeg' && file.type !== 'image/png') return 'Please choose a JPEG or PNG image.';
  if (file.size != null && file.size > AVATAR_MAX_BYTES) return 'That image is larger than 5 MB. Please choose a smaller one.';
  return '';
}

export async function loadAvatar(userId?: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(avatarKey(userId));
  } catch {
    return null;
  }
}

export async function saveAvatar(userId: string | undefined, uri: string | null): Promise<void> {
  if (uri) await AsyncStorage.setItem(avatarKey(userId), uri);
  else await AsyncStorage.removeItem(avatarKey(userId));
}
