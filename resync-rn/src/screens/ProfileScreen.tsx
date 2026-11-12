import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, Pressable, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as SvgModule from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { clearSession, getSession, saveSession, UserSession } from '../services/session';
import { useCreditBalance } from '../services/credits';
import { getAllScans } from '../services/scanRepository';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { Rise } from '../components/Rise';
import { BackgroundScanProgress } from '../components/scan/BackgroundScanProgress';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, LinearGradient: SvgLinearGradient, Stop, Rect, Path, Ellipse, Circle } = SvgModule;

type EditableKey = 'userName' | 'contactNumber' | 'userInstitution' | 'program' | 'yearLevel' | 'researchTitle';

const FIELD_META: Record<EditableKey, { label: string; icon: LineIconName; placeholder: string }> = {
  userName: { label: 'Full name', icon: 'user', placeholder: 'Add full name' },
  contactNumber: { label: 'Contact number', icon: 'phone', placeholder: 'Add contact number' },
  userInstitution: { label: 'University', icon: 'cap', placeholder: 'Add university' },
  program: { label: 'Program', icon: 'book', placeholder: 'Add program' },
  yearLevel: { label: 'Year level', icon: 'calendar', placeholder: 'Add year level' },
  researchTitle: { label: 'Research title', icon: 'page', placeholder: 'Add research title' },
};

const ACADEMIC_FIELDS: EditableKey[] = ['userInstitution', 'program', 'yearLevel', 'researchTitle'];
const ALL_FIELDS: EditableKey[] = ['userName', 'contactNumber', ...ACADEMIC_FIELDS];

// Fields that count toward "Profile completeness", with the wording used in the hint
const COMPLETENESS: { key: keyof UserSession; noun: string }[] = [
  { key: 'userName', noun: 'name' },
  { key: 'userEmail', noun: 'email' },
  { key: 'contactNumber', noun: 'contact number' },
  { key: 'userInstitution', noun: 'university' },
  { key: 'program', noun: 'program' },
  { key: 'yearLevel', noun: 'year level' },
  { key: 'researchTitle', noun: 'research title' },
];

const joinNouns = (nouns: string[]) =>
  nouns.length <= 1 ? nouns.join('') : `${nouns.slice(0, -1).join(', ')} and ${nouns[nouns.length - 1]}`;

const formatMonth = (iso: string) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/** Illustrated placeholder portrait from the mockup. */
const AvatarArt: React.FC = () => (
  <Svg width={88} height={88} viewBox="0 0 120 120">
    <Defs>
      <SvgLinearGradient id="ab" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#DAD8FF" />
        <Stop offset="1" stopColor="#B9B6FF" />
      </SvgLinearGradient>
    </Defs>
    <Rect width={120} height={120} fill="url(#ab)" />
    <Path d="M14 120c2-26 20-38 46-38s44 12 46 38z" fill={brand.primary} />
    <Path d="M48 84l12 14 12-14" fill="#FFFFFF" opacity={0.9} />
    <Rect x={52} y={64} width={16} height={20} rx={7} fill="#E8B48C" />
    <Ellipse cx={60} cy={50} rx={19} ry={21} fill="#F2C9A5" />
    <Path d="M40 48c-2-18 10-27 22-26 12 1 20 10 17 26-4-8-8-11-16-11-9 0-18 2-23 11z" fill="#1B1650" />
    <Circle cx={53} cy={52} r={2} fill="#1B1650" />
    <Circle cx={67} cy={52} r={2} fill="#1B1650" />
    <Path d="M54 61c3 3 9 3 12 0" stroke="#B8704F" strokeWidth={2} strokeLinecap="round" fill="none" />
  </Svg>
);

const SecurityRow: React.FC<{ icon: LineIconName; tint: string; color: string; title: string; sub: string; onPress: () => void }> = ({
  icon,
  tint,
  color,
  title,
  sub,
  onPress,
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.securityRow, pressed && { backgroundColor: brand.soft }]}>
    <View style={[styles.rowIcon, { backgroundColor: tint }]}>
      <LineIcon name={icon} size={19} color={color} />
    </View>
    <View style={styles.flex1}>
      <Text style={styles.securityTitle}>{title}</Text>
      <Text style={styles.securitySub}>{sub}</Text>
    </View>
    <LineIcon name="chevronRight" size={18} color="#8B89AD" />
  </Pressable>
);

const FieldRow: React.FC<{
  icon: LineIconName;
  label: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  onChange?: (text: string) => void;
}> = ({ icon, label, value, placeholder, readOnly, keyboardType, onChange }) => (
  <View style={styles.fieldRow}>
    <View style={styles.rowIcon}>
      <LineIcon name={icon} size={19} color={brand.primary} />
    </View>
    <View style={styles.flex1}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9A98B8"
        keyboardType={keyboardType}
        style={[styles.fieldInput, readOnly && styles.fieldInputReadOnly]}
      />
    </View>
  </View>
);

export const ProfileScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<UserSession | null>(null);
  const [credits] = useCreditBalance();
  const [scansRun, setScansRun] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<EditableKey, string>>>({});

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
      getAllScans().then((scans) => setScansRun(scans.length));
    }, []),
  );

  const openEditor = () => {
    if (!session) return;
    setDraft(Object.fromEntries(ALL_FIELDS.map((k) => [k, session[k]])));
    setEditing(true);
  };

  const saveDraft = async () => {
    const updates = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, (v ?? '').trim()]));
    // Never blank out the display name
    if (updates.userName === '') delete updates.userName;
    await saveSession(updates);
    setSession(await getSession());
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Resync?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSession();
            tabNav.getParent()?.reset({ index: 0, routes: [{ name: 'Auth', params: { mode: 'login' } }] });
          } catch (err: any) {
            Alert.alert('Sign-out Error', err.message || 'Unable to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const showDevices = () => Alert.alert('Signed-in devices', 'You are signed in on this device. Managing other devices is coming soon.');

  const name = session?.userName ?? '';
  const filled = session ? COMPLETENESS.filter((f) => String(session[f.key] ?? '').trim()) : [];
  const missing = session ? COMPLETENESS.filter((f) => !String(session[f.key] ?? '').trim()) : [];
  const pct = Math.round((filled.length / COMPLETENESS.length) * 100);

  const renderField = (k: EditableKey) => (
    <FieldRow
      key={k}
      icon={FIELD_META[k].icon}
      label={FIELD_META[k].label}
      placeholder={FIELD_META[k].placeholder}
      value={draft[k] ?? ''}
      keyboardType={k === 'contactNumber' ? 'phone-pad' : 'default'}
      onChange={(t) => setDraft((d) => ({ ...d, [k]: t }))}
    />
  );

  return (
    <View style={styles.page}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AppHeader title="Profile" initials={initialsOf(name)} />

      <ScrollView contentContainerStyle={styles.main} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <Rise delay={50} style={[cardStyle, styles.identity]}>
          <LinearGradient colors={[brand.deep, brand.bright]} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={styles.cover}>
            <View style={styles.coverBubble} />
          </LinearGradient>
          <View style={styles.identityBody}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <AvatarArt />
              </View>
              <View style={styles.cameraBadge}>
                <LineIcon name="camera" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{session?.userEmail}</Text>
            <Text style={styles.activePill}>● Active</Text>

            <View style={styles.stats}>
              {[
                { value: credits === null ? '–' : String(credits), label: 'Credits' },
                { value: scansRun === null ? '–' : String(scansRun), label: 'Scans run' },
                { value: session ? formatMonth(session.memberSince) : '–', label: 'Member since' },
              ].map((s, i) => (
                <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {s.value}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <PressableScale onPress={openEditor} style={styles.editProfileBtn}>
              <LineIcon name="pencil" size={15} color="#FFFFFF" />
              <Text style={styles.editProfileText}>Edit profile</Text>
            </PressableScale>
          </View>
        </Rise>

        {/* Completeness */}
        <Rise delay={130} style={[cardStyle, styles.pad16]}>
          <View style={styles.completeHead}>
            <Text style={styles.completeTitle}>Profile completeness</Text>
            <Text style={styles.completePct}>{pct}%</Text>
          </View>
          <View style={styles.completeTrack}>
            <LinearGradient
              colors={[brand.primary, '#6C66F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.completeFill, { width: `${pct}%` }]}
            />
          </View>
          <Text style={styles.completeHint}>
            {missing.length
              ? `Add your ${joinNouns(missing.map((m) => m.noun))} in Edit profile to finish setting up.`
              : 'Your profile is complete.'}
          </Text>
        </Rise>

        {/* Account & security */}
        <Rise delay={210} style={[cardStyle, styles.security]}>
          <Text style={styles.securityHeading}>Account &amp; security</Text>
          <Text style={styles.securityIntro}>Keep your account protected</Text>
          <SecurityRow icon="lock" tint="#FFF3DB" color="#C77A0B" title="Change password" sub="Managed under Settings" onPress={() => tabNav.navigate('Settings')} />
          <SecurityRow icon="shield" tint={brand.tint} color={brand.primary} title="Signed-in devices" sub="This device" onPress={showDevices} />
        </Rise>

        {/* Log out */}
        <Rise delay={290}>
          <PressableScale onPress={handleLogout} style={styles.logout}>
            <LineIcon name="logout" size={18} color="#D92D4B" />
            <Text style={styles.logoutText}>Log out</Text>
          </PressableScale>
          <Text style={styles.signedIn}>Signed in as {session?.userEmail}</Text>
        </Rise>
      </ScrollView>

      {/* Edit profile page; a Modal so it also covers the tab bar, as in the mockup */}
      <Modal visible={editing} statusBarTranslucent animationType="slide" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView style={styles.page} behavior="height">
          <View style={[styles.editHeader, { paddingTop: insets.top, height: 64 + insets.top }]}>
            <Pressable onPress={() => setEditing(false)} style={styles.editBack} hitSlop={4} accessibilityLabel="Back">
              <LineIcon name="back" size={18} color={brand.primary} />
            </Pressable>
            <Text style={styles.editTitle}>Edit profile</Text>
          </View>
          <ScrollView contentContainerStyle={[styles.editMain, { paddingBottom: 16 + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[cardStyle, styles.editCard]}>
              <View>
                <Text style={styles.editCardTitle}>Personal details</Text>
                <Text style={styles.editCardSub}>These details show on your reports</Text>
              </View>
              {renderField('userName')}
              <FieldRow icon="mail" label="Email address" value={session?.userEmail ?? ''} readOnly />
              {renderField('contactNumber')}
            </View>
            <View style={[cardStyle, styles.editCard]}>
              <View>
                <Text style={styles.editCardTitle}>Academic information</Text>
                <Text style={styles.editCardSub}>Used on your reports</Text>
              </View>
              {ACADEMIC_FIELDS.map(renderField)}
            </View>
            <PressableScale onPress={saveDraft} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save changes</Text>
            </PressableScale>
            <PressableScale onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </PressableScale>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <BackgroundScanProgress />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brand.page,
  },
  main: {
    padding: 16,
    paddingBottom: 18,
    gap: 12,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  pad16: {
    padding: 16,
  },

  // Identity
  identity: {
    overflow: 'hidden',
  },
  cover: {
    height: 92,
    overflow: 'hidden',
  },
  coverBubble: {
    position: 'absolute',
    right: -30,
    top: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  identityBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    marginTop: -48,
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#DAD8FF',
    shadowColor: brand.deep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brand.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9,
  },
  name: {
    marginTop: 8,
    fontFamily: fonts.sans[700],
    fontSize: 20,
    color: brand.ink,
    textAlign: 'center',
  },
  email: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: brand.muted,
  },
  activePill: {
    marginTop: 4,
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.successTint,
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: brand.success,
  },
  stats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    marginTop: 12,
    borderWidth: 1,
    borderColor: brand.softLine,
    borderRadius: 16,
    backgroundColor: brand.soft,
  },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: brand.softLine,
  },
  statValue: {
    fontFamily: fonts.sans[800],
    fontSize: 15,
    color: brand.primary,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: brand.hint,
  },
  editProfileBtn: {
    alignSelf: 'stretch',
    marginTop: 14,
    height: 48,
    borderRadius: 15,
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  editProfileText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },

  // Completeness
  completeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completeTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.ink,
  },
  completePct: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.primary,
  },
  completeTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: brand.softLine,
    marginTop: 9,
    marginBottom: 10,
    overflow: 'hidden',
  },
  completeFill: {
    height: '100%',
    borderRadius: 8,
  },
  completeHint: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6B6890',
  },

  // Account & security
  security: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  securityHeading: {
    marginBottom: 4,
    fontFamily: fonts.sans[800],
    fontSize: 16,
    letterSpacing: -0.16,
    color: brand.ink,
  },
  securityIntro: {
    marginBottom: 6,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: '#6B6890',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEDF8',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: brand.ink,
  },
  securitySub: {
    marginTop: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#6B6890',
  },

  // Log out
  logout: {
    height: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F6C3CC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#D92D4B',
  },
  signedIn: {
    marginTop: 10,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#8B89AD',
    textAlign: 'center',
  },

  // Edit profile
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEDF8',
  },
  editBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E2F4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 16,
    color: brand.ink,
  },
  editMain: {
    padding: 16,
    gap: 12,
  },
  editCard: {
    padding: 16,
    gap: 14,
  },
  editCardTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 16.5,
    color: brand.ink,
  },
  editCardSub: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: '#7D7B9E',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCDAF2',
    backgroundColor: '#FFFFFF',
  },
  fieldLabel: {
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    letterSpacing: 1.26,
    color: '#7D7B9E',
  },
  fieldInput: {
    marginTop: 3,
    padding: 0,
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  fieldInputReadOnly: {
    color: '#6B6890',
  },
  saveBtn: {
    height: 50,
    borderRadius: 15,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  saveText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DCDAF2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: brand.primary,
  },
});
