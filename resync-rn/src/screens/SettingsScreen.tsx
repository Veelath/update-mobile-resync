import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  StatusBar,
  Animated,
  LayoutAnimation,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { clearSession, getSession, saveSession, UserSession } from '../services/session';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { PasswordRules, meetsPasswordRules } from '../components/PasswordRules';
import { Rise } from '../components/Rise';

/** Pill switch from the mockup; the knob slides rather than jumping. */
const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => {
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: value ? 1 : 0, speed: 22, bounciness: 6, useNativeDriver: false }).start();
  }, [value, v]);
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View
        style={[
          styles.toggle,
          { backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['#CFCDE6', brand.primary] }) },
        ]}
      >
        <Animated.View
          style={[styles.knob, { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}
        />
      </Animated.View>
    </Pressable>
  );
};

const CardHead: React.FC<{ icon: LineIconName; title: string; sub: string }> = ({ icon, title, sub }) => (
  <View style={styles.cardHead}>
    <View style={styles.headIcon}>
      <LineIcon name={icon} size={19} color={brand.primary} />
    </View>
    <View style={styles.flex1}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  </View>
);

const PasswordInput: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
}> = ({ label, placeholder, value, onChangeText, error }) => {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fld}>
      <Text style={styles.fldLabel}>{label.toUpperCase()}</Text>
      <View style={[styles.inp, focused && styles.inpFocused, !!error && { borderColor: brand.danger }]}>
        <LineIcon name="lock" size={19} color={brand.icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand.placeholder}
          secureTextEntry={hidden}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.inpText}
        />
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <LineIcon name={hidden ? 'eye' : 'eyeOff'} size={19} color={brand.icon} />
        </Pressable>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export const SettingsScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [session, setSession] = useState<UserSession | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});

  useFocusEffect(
    useCallback(() => {
      getSession().then((s) => {
        setSession(s);
        setEmailAlerts(s.emailAlerts);
      });
    }, []),
  );

  const handleEmailToggle = async (val: boolean) => {
    setEmailAlerts(val);
    await saveSession({ emailAlerts: val });
  };

  const handleUpdatePassword = () => {
    const next: typeof errors = {};
    if (!currentPw) next.current = 'Enter your current password';
    if (!meetsPasswordRules(newPw)) next.next = 'New password does not meet all the requirements';
    else if (newPw === currentPw) next.next = 'Choose a password different from your current one';
    setErrors(next);
    if (Object.keys(next).length) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentPw('');
    setNewPw('');
    Alert.alert('Password updated', 'Your password has been changed.');
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

  const name = session?.userName ?? '';

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AppHeader
        title="Settings"
        initials={initialsOf(name)}
        onBack={() => tabNav.navigate('Profile')}
        onAvatarPress={() => tabNav.navigate('Profile')}
      />

      <ScrollView contentContainerStyle={styles.main} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Rise delay={50}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.h1}>Settings</Text>
          <Text style={styles.sub}>Manage your credentials, security and preferences.</Text>
        </Rise>

        {/* Profile information */}
        <Rise delay={120} style={[cardStyle, styles.card]}>
          <CardHead icon="user" title="Profile information" sub="Your contact details and display name." />
          <Pressable
            onPress={() => tabNav.navigate('Profile')}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: brand.tint }]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{initialsOf(name)}</Text>
              </View>
              <Text style={styles.rowText} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <View style={styles.smallBtn}>
              <LineIcon name="arrowRight" size={16} color={brand.ink} />
            </View>
          </Pressable>
        </Rise>

        {/* Notifications */}
        <Rise delay={190} style={[cardStyle, styles.card]}>
          <CardHead icon="bell" title="Notifications" sub="Scan alerts sent to your email." />
          <View style={styles.row}>
            <Text style={[styles.rowText, styles.flex1]}>Scan completion emails</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.status, emailAlerts ? styles.statusOn : styles.statusOff]}>
                {emailAlerts ? 'Enabled' : 'Disabled'}
              </Text>
              <Toggle value={emailAlerts} onChange={handleEmailToggle} />
            </View>
          </View>
        </Rise>

        {/* Change password */}
        <Rise delay={260} style={[cardStyle, styles.card]}>
          <CardHead icon="lock" title="Change password" sub="Keep your workspace secure." />
          <View style={styles.fields}>
            <PasswordInput
              label="Current password"
              placeholder="Enter current password"
              value={currentPw}
              onChangeText={(t) => {
                setCurrentPw(t);
                if (errors.current) setErrors((e) => ({ ...e, current: undefined }));
              }}
              error={errors.current}
            />
            <PasswordInput
              label="New password"
              placeholder="New password"
              value={newPw}
              onChangeText={(t) => {
                if (!t !== !newPw) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setNewPw(t);
                if (errors.next) setErrors((e) => ({ ...e, next: undefined }));
              }}
              error={errors.next}
            />
            {newPw.length > 0 && <PasswordRules password={newPw} style={styles.rules} />}
          </View>
          <PressableScale onPress={handleUpdatePassword} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Update password</Text>
          </PressableScale>
        </Rise>

        {/* Log out */}
        <Rise delay={330}>
          <PressableScale onPress={handleLogout} style={styles.logoutBtn}>
            <LineIcon name="logout" size={18} color={brand.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </PressableScale>
        </Rise>
      </ScrollView>
    </KeyboardAvoidingView>
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
  eyebrow: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    letterSpacing: 1.54,
    color: brand.primary,
  },
  h1: {
    marginTop: 6,
    marginBottom: 6,
    fontFamily: fonts.sans[800],
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
    color: brand.ink,
  },
  sub: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: brand.sub,
  },
  card: {
    padding: 18,
    gap: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: brand.softLine,
  },
  headIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 16.5,
    color: brand.ink,
  },
  cardSub: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 18,
    color: brand.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: brand.soft,
    borderWidth: 1,
    borderColor: brand.softLine,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: '#FFFFFF',
  },
  rowText: {
    flexShrink: 1,
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: brand.ink,
  },
  smallBtn: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    minWidth: 74,
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
    fontFamily: fonts.sans[800],
    fontSize: 12,
  },
  statusOn: {
    backgroundColor: brand.successTint,
    color: brand.success,
  },
  statusOff: {
    backgroundColor: '#F1F1F8',
    color: brand.hint,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fields: {
    gap: 16,
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
  inpFocused: {
    borderColor: brand.primary,
  },
  inpText: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    color: brand.ink,
  },
  error: {
    marginLeft: 4,
    fontFamily: fonts.sans[500],
    fontSize: 12,
    color: brand.danger,
  },
  rules: {
    marginTop: -6,
  },
  primaryBtn: {
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
  primaryBtnText: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  logoutBtn: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.dangerBorder,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: brand.danger,
  },
});
