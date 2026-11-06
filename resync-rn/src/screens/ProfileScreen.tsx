import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as SvgModule from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { getSession, saveSession, creditsAvailable, UserSession } from '../services/session';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { BottomSheet } from '../components/BottomSheet';
import { Rise } from '../components/Rise';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, LinearGradient: SvgLinearGradient, Stop, Rect, Path, Ellipse, Circle } = SvgModule;

type EditableKey = 'userName' | 'contactNumber' | 'userInstitution' | 'program' | 'yearLevel' | 'researchTitle';
type Section = 'personal' | 'academic' | 'all';

const FIELD_META: Record<EditableKey, { label: string; icon: LineIconName; placeholder: string }> = {
  userName: { label: 'Full name', icon: 'user', placeholder: 'Your full name' },
  contactNumber: { label: 'Contact number', icon: 'phone', placeholder: 'e.g. 0917 123 4567' },
  userInstitution: { label: 'University', icon: 'cap', placeholder: 'e.g. University of the Philippines' },
  program: { label: 'Program', icon: 'book', placeholder: 'e.g. BS Information Technology' },
  yearLevel: { label: 'Year level', icon: 'calendar', placeholder: 'e.g. 4th year' },
  researchTitle: { label: 'Research title', icon: 'page', placeholder: 'Working title of your manuscript' },
};

const SECTION_FIELDS: Record<Section, EditableKey[]> = {
  personal: ['userName', 'contactNumber'],
  academic: ['userInstitution', 'program', 'yearLevel', 'researchTitle'],
  all: ['userName', 'contactNumber', 'userInstitution', 'program', 'yearLevel', 'researchTitle'],
};

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

const InfoRow: React.FC<{ icon: LineIconName; label: string; value: string; onAdd?: () => void }> = ({
  icon,
  label,
  value,
  onAdd,
}) => {
  const empty = !value.trim();
  return (
    <View style={[styles.infoRow, empty && styles.infoRowEmpty]}>
      <View style={styles.infoIcon}>
        <LineIcon name={icon} size={19} color={brand.primary} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
        {empty ? (
          <Text style={styles.infoValue}>
            <Text style={styles.notAdded}>Not added</Text>
            {onAdd && (
              <>
                <Text style={styles.notAdded}> · </Text>
                <Text style={styles.addLink} onPress={onAdd}>
                  Add
                </Text>
              </>
            )}
          </Text>
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<UserSession | null>(null);
  const [editing, setEditing] = useState<Section | null>(null);
  const [draft, setDraft] = useState<Partial<Record<EditableKey, string>>>({});

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
    }, []),
  );

  const openEditor = (section: Section) => {
    if (!session) return;
    setDraft(Object.fromEntries(SECTION_FIELDS[section].map((k) => [k, session[k]])));
    setEditing(section);
  };

  const saveDraft = async () => {
    const updates = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, (v ?? '').trim()]));
    // Never blank out the display name
    if (updates.userName === '') delete updates.userName;
    await saveSession(updates);
    setSession(await getSession());
    setEditing(null);
  };

  const name = session?.userName ?? '';
  const filled = session ? COMPLETENESS.filter((f) => String(session[f.key] ?? '').trim()) : [];
  const missing = session ? COMPLETENESS.filter((f) => !String(session[f.key] ?? '').trim()) : [];
  const pct = Math.round((filled.length / COMPLETENESS.length) * 100);

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
                { value: session ? String(creditsAvailable(session)) : '–', label: 'Credits' },
                { value: String(session?.scansCount ?? '–'), label: 'Scans run' },
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

            <PressableScale onPress={() => openEditor('all')} style={styles.editProfileBtn}>
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
              ? `Add your ${joinNouns(missing.map((m) => m.noun))} to finish setting up.`
              : 'Your profile is complete.'}
          </Text>
        </Rise>

        {/* Personal details */}
        <Rise delay={210} style={[cardStyle, styles.section]}>
          <SectionHead title="Personal details" sub="How you appear in reports" onEdit={() => openEditor('personal')} />
          <InfoRow icon="user" label="Full name" value={name} />
          <InfoRow icon="mail" label="Email address" value={session?.userEmail ?? ''} />
          <InfoRow
            icon="phone"
            label="Contact number"
            value={session?.contactNumber ?? ''}
            onAdd={() => openEditor('personal')}
          />
        </Rise>

        {/* Academic information */}
        <Rise delay={290} style={[cardStyle, styles.section]}>
          <SectionHead title="Academic information" sub="Used on your reports" onEdit={() => openEditor('academic')} />
          {SECTION_FIELDS.academic.map((k) => (
            <InfoRow
              key={k}
              icon={FIELD_META[k].icon}
              label={FIELD_META[k].label}
              value={session?.[k] ?? ''}
              onAdd={() => openEditor('academic')}
            />
          ))}
        </Rise>

        {/* Password shortcut */}
        <Rise delay={370}>
          <Pressable
            onPress={() => tabNav.navigate('Settings')}
            style={({ pressed }) => [cardStyle, styles.passwordCard, pressed && { backgroundColor: brand.soft }]}
          >
            <View style={[styles.infoIcon, { backgroundColor: '#FFF3DB' }]}>
              <LineIcon name="lock" size={19} color="#C77A0B" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.passwordTitle}>Change your password</Text>
              <Text style={styles.passwordSub}>Managed under Settings</Text>
            </View>
            <View style={styles.squareBtn}>
              <LineIcon name="arrowRight" size={16} color={brand.ink} />
            </View>
          </Pressable>
        </Rise>
      </ScrollView>

      <BottomSheet visible={editing !== null} onClose={() => setEditing(null)}>
        <Text style={styles.sheetTitle}>
          {editing === 'personal' ? 'Personal details' : editing === 'academic' ? 'Academic information' : 'Edit profile'}
        </Text>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetFields}
          keyboardShouldPersistTaps="handled"
        >
          {editing &&
            SECTION_FIELDS[editing].map((k) => (
              <View key={k} style={styles.fld}>
                <Text style={styles.fldLabel}>{FIELD_META[k].label.toUpperCase()}</Text>
                <View style={styles.inp}>
                  <LineIcon name={FIELD_META[k].icon} size={18} color={brand.icon} />
                  <TextInput
                    value={draft[k] ?? ''}
                    onChangeText={(t) => setDraft((d) => ({ ...d, [k]: t }))}
                    placeholder={FIELD_META[k].placeholder}
                    placeholderTextColor={brand.placeholder}
                    keyboardType={k === 'contactNumber' ? 'phone-pad' : 'default'}
                    style={styles.inpText}
                  />
                </View>
              </View>
            ))}
        </ScrollView>
        <View style={[styles.sheetActions, { marginBottom: insets.bottom }]}>
          <PressableScale onPress={() => setEditing(null)} style={[styles.sheetBtn, styles.sheetBtnGhost]}>
            <Text style={styles.sheetBtnGhostText}>Cancel</Text>
          </PressableScale>
          <PressableScale onPress={saveDraft} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
            <Text style={styles.sheetBtnPrimaryText}>Save changes</Text>
          </PressableScale>
        </View>
      </BottomSheet>
    </View>
  );
};

const SectionHead: React.FC<{ title: string; sub: string; onEdit: () => void }> = ({ title, sub, onEdit }) => (
  <View style={styles.sectionHead}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{sub}</Text>
    </View>
    <PressableScale onPress={onEdit} style={styles.editBtn}>
      <LineIcon name="pencil" size={15} color={brand.ink} />
      <Text style={styles.editBtnText}>Edit</Text>
    </PressableScale>
  </View>
);

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
    color: brand.muted,
  },

  // Sections
  section: {
    padding: 16,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 16.5,
    color: brand.ink,
  },
  sectionSub: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.hint,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  editBtnText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.ink,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: brand.soft,
    borderWidth: 1,
    borderColor: brand.softLine,
  },
  infoRowEmpty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: brand.dashed,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    letterSpacing: 1.26,
    color: brand.hint,
  },
  infoValue: {
    marginTop: 3,
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  notAdded: {
    fontFamily: fonts.sans[600],
    color: brand.placeholder,
  },
  addLink: {
    fontFamily: fonts.sans[700],
    color: brand.primary,
  },

  // Password shortcut
  passwordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  passwordTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  passwordSub: {
    marginTop: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: brand.muted,
  },
  squareBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit sheet
  sheetTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 20,
    color: brand.ink,
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetFields: {
    gap: 14,
  },
  fld: {
    gap: 8,
  },
  fldLabel: {
    fontFamily: fonts.sans[800],
    fontSize: 11.5,
    letterSpacing: 1.04,
    color: brand.label,
  },
  inp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  inpText: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    color: brand.ink,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnGhost: {
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  sheetBtnGhostText: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  sheetBtnPrimary: {
    backgroundColor: brand.primary,
  },
  sheetBtnPrimaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
