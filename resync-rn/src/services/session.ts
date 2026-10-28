import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  hasCompletedOnboarding: boolean;
  themePreference: 'system' | 'light' | 'dark';
  pushNotifications: boolean;
  emailAlerts: boolean;
  userRole: string;
  userBio: string;
}

const DEFAULT_SESSION: UserSession = {
  hasCompletedOnboarding: false,
  themePreference: 'light',
  pushNotifications: true,
  emailAlerts: true,
  userRole: '',
  userBio: '',
};

const KEYS = {
  HAS_COMPLETED_ONBOARDING: 'has_completed_onboarding',
  THEME_PREFERENCE: 'theme_preference',
  PUSH_NOTIFICATIONS: 'push_notifications',
  EMAIL_ALERTS: 'email_alerts',
  USER_ROLE: 'user_role',
  USER_BIO: 'user_bio',
};

export async function getSession(): Promise<UserSession> {
  try {
    const [
      hasCompletedOnboarding,
      themePreference,
      pushNotifications,
      emailAlerts,
      userRole,
      userBio,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.getItem(KEYS.THEME_PREFERENCE),
      AsyncStorage.getItem(KEYS.PUSH_NOTIFICATIONS),
      AsyncStorage.getItem(KEYS.EMAIL_ALERTS),
      AsyncStorage.getItem(KEYS.USER_ROLE),
      AsyncStorage.getItem(KEYS.USER_BIO),
    ]);

    return {
      hasCompletedOnboarding: hasCompletedOnboarding === 'true',
      themePreference: (themePreference as any) || DEFAULT_SESSION.themePreference,
      pushNotifications: pushNotifications !== 'false',
      emailAlerts: emailAlerts !== 'false',
      userRole: userRole || DEFAULT_SESSION.userRole,
      userBio: userBio || DEFAULT_SESSION.userBio,
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

export async function saveSession(updates: Partial<UserSession>): Promise<void> {
  const promises: Promise<void>[] = [];

  if (updates.hasCompletedOnboarding !== undefined) promises.push(AsyncStorage.setItem(KEYS.HAS_COMPLETED_ONBOARDING, updates.hasCompletedOnboarding ? 'true' : 'false'));
  if (updates.themePreference !== undefined) promises.push(AsyncStorage.setItem(KEYS.THEME_PREFERENCE, updates.themePreference));
  if (updates.pushNotifications !== undefined) promises.push(AsyncStorage.setItem(KEYS.PUSH_NOTIFICATIONS, updates.pushNotifications ? 'true' : 'false'));
  if (updates.emailAlerts !== undefined) promises.push(AsyncStorage.setItem(KEYS.EMAIL_ALERTS, updates.emailAlerts ? 'true' : 'false'));
  if (updates.userRole !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_ROLE, updates.userRole));
  if (updates.userBio !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_BIO, updates.userBio));

  await Promise.all(promises);
}

export async function setOnboardingCompleted(completed = true): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_COMPLETED_ONBOARDING, completed ? 'true' : 'false');
}
