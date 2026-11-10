import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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
  contactNumber: string;
  program: string;
  yearLevel: string;
  researchTitle: string;
  memberSince: string; // ISO date, stamped the first time the session is read
  hasSeenScanTour: boolean;
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
  contactNumber: '',
  program: '',
  yearLevel: '',
  researchTitle: '',
  memberSince: '',
  hasSeenScanTour: false,
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
  CONTACT_NUMBER: 'contact_number',
  PROGRAM: 'program',
  YEAR_LEVEL: 'year_level',
  RESEARCH_TITLE: 'research_title',
  MEMBER_SINCE: 'member_since',
  HAS_SEEN_SCAN_TOUR: 'has_seen_scan_tour',
};

export async function getSession(): Promise<UserSession> {
  try {
    const [
      userEmail,
      userName,
      scansCount,
      hasCompletedOnboarding,
      themePreference,
      pushNotifications,
      emailAlerts,
      userInstitution,
      userRole,
      userBio,
      contactNumber,
      program,
      yearLevel,
      researchTitle,
      storedMemberSince,
      hasSeenScanTour,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.USER_EMAIL),
      AsyncStorage.getItem(KEYS.USER_NAME),
      AsyncStorage.getItem(KEYS.SCANS_COUNT),
      AsyncStorage.getItem(KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.getItem(KEYS.THEME_PREFERENCE),
      AsyncStorage.getItem(KEYS.PUSH_NOTIFICATIONS),
      AsyncStorage.getItem(KEYS.EMAIL_ALERTS),
      AsyncStorage.getItem(KEYS.USER_INSTITUTION),
      AsyncStorage.getItem(KEYS.USER_ROLE),
      AsyncStorage.getItem(KEYS.USER_BIO),
      AsyncStorage.getItem(KEYS.CONTACT_NUMBER),
      AsyncStorage.getItem(KEYS.PROGRAM),
      AsyncStorage.getItem(KEYS.YEAR_LEVEL),
      AsyncStorage.getItem(KEYS.RESEARCH_TITLE),
      AsyncStorage.getItem(KEYS.MEMBER_SINCE),
      AsyncStorage.getItem(KEYS.HAS_SEEN_SCAN_TOUR),
    ]);

    let memberSince = storedMemberSince;
    if (!memberSince) {
      memberSince = new Date().toISOString();
      await AsyncStorage.setItem(KEYS.MEMBER_SINCE, memberSince);
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const authSession = data.session;

    return {
      authToken: authSession?.access_token ?? null,
      userEmail: authSession?.user.email || userEmail || DEFAULT_SESSION.userEmail,
      userName: userName || DEFAULT_SESSION.userName,
      isLoggedIn: !!authSession,
      scansCount: scansCount ? parseInt(scansCount, 10) : DEFAULT_SESSION.scansCount,
      hasCompletedOnboarding: hasCompletedOnboarding === 'true',
      themePreference: (themePreference as any) || DEFAULT_SESSION.themePreference,
      pushNotifications: pushNotifications !== 'false',
      emailAlerts: emailAlerts !== 'false',
      // A cleared university is stored as '' and stays empty, so the profile can show "Not added"
      userInstitution: userInstitution ?? DEFAULT_SESSION.userInstitution,
      userRole: userRole || DEFAULT_SESSION.userRole,
      userBio: userBio || DEFAULT_SESSION.userBio,
      contactNumber: contactNumber ?? '',
      program: program ?? '',
      yearLevel: yearLevel ?? '',
      researchTitle: researchTitle ?? '',
      memberSince,
      hasSeenScanTour: hasSeenScanTour === 'true',
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
  if (updates.contactNumber !== undefined) promises.push(AsyncStorage.setItem(KEYS.CONTACT_NUMBER, updates.contactNumber));
  if (updates.program !== undefined) promises.push(AsyncStorage.setItem(KEYS.PROGRAM, updates.program));
  if (updates.yearLevel !== undefined) promises.push(AsyncStorage.setItem(KEYS.YEAR_LEVEL, updates.yearLevel));
  if (updates.researchTitle !== undefined) promises.push(AsyncStorage.setItem(KEYS.RESEARCH_TITLE, updates.researchTitle));
  if (updates.memberSince !== undefined) promises.push(AsyncStorage.setItem(KEYS.MEMBER_SINCE, updates.memberSince));
  if (updates.hasSeenScanTour !== undefined) promises.push(AsyncStorage.setItem(KEYS.HAS_SEEN_SCAN_TOUR, updates.hasSeenScanTour ? 'true' : 'false'));

  await Promise.all(promises);
}

export async function clearSession(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Unable to sign out. Please try again.');
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
