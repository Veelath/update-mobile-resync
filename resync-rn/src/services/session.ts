import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  authToken: string | null;
  userEmail: string;
  userName: string;
  isLoggedIn: boolean;
  scansCount: number;
  hasCompletedOnboarding: boolean;
  themePreference: 'system' | 'light' | 'dark';
  pushNotifications: boolean;
  emailAlerts: boolean;
  userInstitution: string;
  userRole: string;
  userBio: string;
}

const DEFAULT_SESSION: UserSession = {
  authToken: null,
  userEmail: 'noelhenrymier@gmail.com',
  userName: 'Noel Henry',
  isLoggedIn: false,
  scansCount: 3,
  hasCompletedOnboarding: false,
  themePreference: 'light',
  pushNotifications: true,
  emailAlerts: true,
  userInstitution: 'Stanford University',
  userRole: 'Principal Investigator',
  userBio: 'Specializing in distributed systems coherence and academic reference validation systems.',
};

const KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_EMAIL: 'user_email',
  USER_NAME: 'user_name',
  IS_LOGGED_IN: 'is_logged_in',
  SCANS_COUNT: 'scans_count',
  HAS_COMPLETED_ONBOARDING: 'has_completed_onboarding',
  THEME_PREFERENCE: 'theme_preference',
  PUSH_NOTIFICATIONS: 'push_notifications',
  EMAIL_ALERTS: 'email_alerts',
  USER_INSTITUTION: 'user_institution',
  USER_ROLE: 'user_role',
  USER_BIO: 'user_bio',
};

export async function getSession(): Promise<UserSession> {
  try {
    const [
      authToken,
      userEmail,
      userName,
      isLoggedIn,
      scansCount,
      hasCompletedOnboarding,
      themePreference,
      pushNotifications,
      emailAlerts,
      userInstitution,
      userRole,
      userBio,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.AUTH_TOKEN),
      AsyncStorage.getItem(KEYS.USER_EMAIL),
      AsyncStorage.getItem(KEYS.USER_NAME),
      AsyncStorage.getItem(KEYS.IS_LOGGED_IN),
      AsyncStorage.getItem(KEYS.SCANS_COUNT),
      AsyncStorage.getItem(KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.getItem(KEYS.THEME_PREFERENCE),
      AsyncStorage.getItem(KEYS.PUSH_NOTIFICATIONS),
      AsyncStorage.getItem(KEYS.EMAIL_ALERTS),
      AsyncStorage.getItem(KEYS.USER_INSTITUTION),
      AsyncStorage.getItem(KEYS.USER_ROLE),
      AsyncStorage.getItem(KEYS.USER_BIO),
    ]);

    return {
      authToken: authToken || DEFAULT_SESSION.authToken,
      userEmail: userEmail || DEFAULT_SESSION.userEmail,
      userName: userName || DEFAULT_SESSION.userName,
      isLoggedIn: isLoggedIn === 'true',
      scansCount: scansCount ? parseInt(scansCount, 10) : DEFAULT_SESSION.scansCount,
      hasCompletedOnboarding: hasCompletedOnboarding === 'true',
      themePreference: (themePreference as any) || DEFAULT_SESSION.themePreference,
      pushNotifications: pushNotifications !== 'false',
      emailAlerts: emailAlerts !== 'false',
      userInstitution: userInstitution || DEFAULT_SESSION.userInstitution,
      userRole: userRole || DEFAULT_SESSION.userRole,
      userBio: userBio || DEFAULT_SESSION.userBio,
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

export async function saveSession(updates: Partial<UserSession>): Promise<void> {
  const promises: Promise<void>[] = [];

  if (updates.authToken !== undefined) promises.push(AsyncStorage.setItem(KEYS.AUTH_TOKEN, updates.authToken || ''));
  if (updates.userEmail !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_EMAIL, updates.userEmail));
  if (updates.userName !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_NAME, updates.userName));
  if (updates.isLoggedIn !== undefined) promises.push(AsyncStorage.setItem(KEYS.IS_LOGGED_IN, updates.isLoggedIn ? 'true' : 'false'));
  if (updates.scansCount !== undefined) promises.push(AsyncStorage.setItem(KEYS.SCANS_COUNT, String(updates.scansCount)));
  if (updates.hasCompletedOnboarding !== undefined) promises.push(AsyncStorage.setItem(KEYS.HAS_COMPLETED_ONBOARDING, updates.hasCompletedOnboarding ? 'true' : 'false'));
  if (updates.themePreference !== undefined) promises.push(AsyncStorage.setItem(KEYS.THEME_PREFERENCE, updates.themePreference));
  if (updates.pushNotifications !== undefined) promises.push(AsyncStorage.setItem(KEYS.PUSH_NOTIFICATIONS, updates.pushNotifications ? 'true' : 'false'));
  if (updates.emailAlerts !== undefined) promises.push(AsyncStorage.setItem(KEYS.EMAIL_ALERTS, updates.emailAlerts ? 'true' : 'false'));
  if (updates.userInstitution !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_INSTITUTION, updates.userInstitution));
  if (updates.userRole !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_ROLE, updates.userRole));
  if (updates.userBio !== undefined) promises.push(AsyncStorage.setItem(KEYS.USER_BIO, updates.userBio));

  await Promise.all(promises);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.AUTH_TOKEN),
    AsyncStorage.removeItem(KEYS.IS_LOGGED_IN),
  ]);
}

export async function incrementScansCount(): Promise<number> {
  const session = await getSession();
  const nextCount = session.scansCount + 1;
  await AsyncStorage.setItem(KEYS.SCANS_COUNT, String(nextCount));
  return nextCount;
}

export async function setOnboardingCompleted(completed = true): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_COMPLETED_ONBOARDING, completed ? 'true' : 'false');
}
