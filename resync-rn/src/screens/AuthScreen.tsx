import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
} from 'react-native';
import * as SvgModule from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { loginUser, registerUser } from '../services/scanRepository';
import { saveSession } from '../services/session';
import { BrandBackdrop } from '../components/BrandBackdrop';
import { IssueTag, useBobClock } from '../components/IssueTag';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { Rise } from '../components/Rise';
import { PressableScale } from '../components/PressableScale';
import { PasswordRules, meetsPasswordRules } from '../components/PasswordRules';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// A3/A4 mockup palette
const C = {
  ink: '#0B0A2E',
  sub: '#5A5778',
  label: '#4C4A6B',
  brand: '#2B25C8',
  border: '#DAD8F2',
  line: '#E6E5F7',
  icon: '#8B89AD',
  placeholder: '#9A98B8',
  or: '#7D7B9E',
  box: '#C4C2E6',
  error: '#D6264A',
};

const GoogleIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

/** Rounded pill input (the mockups' .pi) with optional leading icon and password eye toggle. */
const PillField: React.FC<
  TextInputProps & { icon?: LineIconName; height?: number; secure?: boolean; error?: string; flex?: boolean }
> = ({ icon, height = 50, secure, error, flex, ...input }) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={flex && styles.flex1}>
      <View
        style={[
          styles.pill,
          { height, paddingHorizontal: icon ? 18 : 16 },
          focused && styles.pillFocused,
          !!error && { borderColor: C.error },
        ]}
      >
        {icon && <LineIcon name={icon} color={C.icon} />}
        <TextInput
          {...input}
          style={styles.pillInput}
          placeholderTextColor={C.placeholder}
          secureTextEntry={secure && hidden}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <LineIcon name={hidden ? 'eye' : 'eyeOff'} color={C.icon} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const CheckBox: React.FC<{ checked: boolean; onToggle: () => void; children: React.ReactNode; center?: boolean }> = ({
  checked,
  onToggle,
  children,
  center,
}) => (
  <Pressable onPress={onToggle} style={[styles.chkRow, center && { alignItems: 'center' }]} hitSlop={6}>
    <View style={[styles.chkBox, checked && styles.chkBoxOn]}>
      {checked && <LineIcon name="check" size={14} color="#FFFFFF" />}
    </View>
    {children}
  </Pressable>
);

export const AuthScreen: React.FC<Props> = ({ navigation, route }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(route.params?.mode || 'login');
  const insets = useSafeAreaInsets();
  const bob = useBobClock();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const clearError = (key: string) => {
    if (errors[key]) setErrors({ ...errors, [key]: '' });
  };

  const passwordOk = meetsPasswordRules(password);
  const showRules = password.length > 0;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!isLogin && !firstName.trim()) next.firstName = 'Enter your first name';
    if (!isLogin && !lastName.trim()) next.lastName = 'Enter your last name';
    if (!email || !email.includes('@')) next.email = 'Please enter a valid email address';
    if (isLogin) {
      if (!password || password.length < 6) next.password = 'Password must be at least 6 characters';
    } else {
      if (!passwordOk) next.password = 'Password does not meet all the requirements';
      if (!confirmPassword) next.confirmPassword = 'Confirm your password';
      else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    }
    if (!isLogin && !agree) next.agree = 'You must agree to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToApp = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser({ email, password });
        await saveSession({
          authToken: res.token,
          userEmail: res.email,
          userName: res.name,
          isLoggedIn: true,
        });
      } else {
        const name = [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean).join(' ');
        const res = await registerUser({ name, email, school: '', password });
        await saveSession({
          authToken: res.token,
          userEmail: res.email,
          userName: res.name,
          ...(res.school ? { userInstitution: res.school } : {}),
          isLoggedIn: true,
        });
      }
      goToApp();
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await saveSession({
      isLoggedIn: true,
      userEmail: 'veronica@stanford.edu',
      userName: 'Veronica May',
      userInstitution: 'Stanford University',
    });
    goToApp();
  };

  const switchMode = () => {
    // Ease the header height change and cross-fade the form instead of hard-cutting
    LayoutAnimation.configureNext(LayoutAnimation.create(320, 'easeInEaseOut', 'opacity'));
    setMode(isLogin ? 'signup' : 'login');
    setErrors({});
  };

  const googleButton = (height: number) => (
    <PressableScale onPress={handleGoogle} style={[styles.googleBtn, { height }]}>
      <GoogleIcon />
      <Text style={styles.googleText}>Continue with Google</Text>
    </PressableScale>
  );

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <BrandBackdrop
        angle={165}
        mid={0.62}
        style={{ height: (isLogin ? 190 : 150) + insets.top }}
        glows={[{ size: 220, color: '#4C7DFF', opacity: 0.5, position: { right: -70, top: -40 } }]}
      >
        <View style={[styles.headerRow, { paddingTop: insets.top + 18 }]}>
          <Pressable
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Welcome'))}
            style={styles.backBtn}
            hitSlop={6}
          >
            <LineIcon name="back" color="#FFFFFF" />
          </Pressable>
          <Image
            source={require('../assets/images/resync_logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerSpacer} />
        </View>

        <IssueTag
          clock={bob}
          phase={0}
          scale={0.9}
          dot="#F5A524"
          label="Logic gap between sections"
          style={{ left: 22, bottom: 34, transformOrigin: 'left' }}
        />
        <IssueTag
          clock={bob}
          phase={1 / 3}
          scale={0.9}
          dot={C.brand}
          label="AI-text indicator"
          style={{ right: 20, bottom: 62, transformOrigin: 'right' }}
        />
      </BrandBackdrop>

      <View style={styles.sheet}>
        <ScrollView
          key={mode}
          contentContainerStyle={[styles.sheetContent, { paddingBottom: 22 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Rise delay={50}>
            <Text style={styles.eyebrow}>{isLogin ? 'ACADEMIC PORTAL' : 'NEW ACCOUNT'}</Text>
            <Text style={[styles.title, !isLogin && styles.titleSignup]}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>
          </Rise>
          <Rise delay={180}>
            <Text style={[styles.sub, !isLogin && styles.subSignup]}>
              {isLogin
                ? 'Sign in to review your manuscript and coherence reports.'
                : 'Free to use — no credit card required.'}
            </Text>
          </Rise>

          {isLogin ? (
            <>
              <Rise delay={300} style={styles.loginFields}>
                <PillField
                  icon="mail"
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    clearError('email');
                  }}
                  error={errors.email}
                />
                <PillField
                  icon="lock"
                  placeholder="Enter your password"
                  secure
                  autoComplete="password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearError('password');
                  }}
                  error={errors.password}
                />
                <View style={styles.rememberRow}>
                  <CheckBox checked={remember} onToggle={() => setRemember((r) => !r)} center>
                    <Text style={styles.chkText}>Remember me</Text>
                  </CheckBox>
                  <Pressable
                    onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent')}
                    hitSlop={8}
                  >
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                </View>
              </Rise>

              <Rise delay={420}>
                <PrimaryButton title="Sign in" loading={loading} onPress={handleSubmit} style={{ marginTop: 18 }} />
                <OrDivider label="OR" style={{ marginTop: 18, marginBottom: 14 }} />
                {googleButton(50)}
              </Rise>
            </>
          ) : (
            <>
              <Rise delay={300} style={styles.signupFields}>
                {googleButton(48)}
                <OrDivider label="OR REGISTER WITH EMAIL" />
                <View style={styles.nameRow}>
                  <PillField
                    flex
                    height={48}
                    placeholder="First name"
                    autoComplete="given-name"
                    value={firstName}
                    onChangeText={(t) => {
                      setFirstName(t);
                      clearError('firstName');
                    }}
                    error={errors.firstName}
                  />
                  <PillField
                    flex
                    height={48}
                    placeholder="Middle (optional)"
                    autoComplete="name-middle"
                    value={middleName}
                    onChangeText={setMiddleName}
                  />
                </View>
                <PillField
                  height={48}
                  placeholder="Last name"
                  autoComplete="family-name"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    clearError('lastName');
                  }}
                  error={errors.lastName}
                />
                <PillField
                  height={48}
                  icon="mail"
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    clearError('email');
                  }}
                  error={errors.email}
                />
                <PillField
                  height={48}
                  icon="lock"
                  placeholder="Password"
                  secure
                  autoComplete="new-password"
                  value={password}
                  onChangeText={(t) => {
                    // Slide the checklist in on the first character, out when cleared
                    if (!t !== !password) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setPassword(t);
                    clearError('password');
                  }}
                  error={errors.password}
                />
                {showRules && <PasswordRules password={password} style={styles.rulesBox} />}
                <PillField
                  height={48}
                  icon="lock"
                  placeholder="Confirm password"
                  secure
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    clearError('confirmPassword');
                  }}
                  error={
                    errors.confirmPassword ||
                    (confirmPassword.length >= password.length && confirmPassword && confirmPassword !== password
                      ? 'Passwords do not match'
                      : undefined)
                  }
                />
                <View>
                  <CheckBox
                    checked={agree}
                    onToggle={() => {
                      setAgree((a) => !a);
                      clearError('agree');
                    }}
                  >
                    <Text style={[styles.chkText, styles.flex1]}>
                      I agree to the <Text style={styles.inlineLink}>Terms of Service</Text> and{' '}
                      <Text style={styles.inlineLink}>Privacy Policy</Text>
                    </Text>
                  </CheckBox>
                  {!!errors.agree && <Text style={styles.errorText}>{errors.agree}</Text>}
                </View>
              </Rise>

              <Rise delay={420}>
                <PrimaryButton title="Create account" loading={loading} onPress={handleSubmit} style={{ marginTop: 16 }} />
              </Rise>
            </>
          )}

          <Rise delay={420} style={[styles.footer, { paddingTop: isLogin ? 18 : 14 }]}>
            <Text style={styles.footerText}>
              {isLogin ? 'New to Resync? ' : 'Have an account? '}
              <Text style={styles.footerLink} onPress={switchMode}>
                {isLogin ? 'Create account' : 'Sign in'}
              </Text>
            </Text>
          </Rise>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const PrimaryButton: React.FC<{ title: string; loading: boolean; onPress: () => void; style?: object }> = ({
  title,
  loading,
  onPress,
  style,
}) => (
  <PressableScale onPress={onPress} disabled={loading} style={[styles.primaryBtn, style]}>
    {loading ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <>
        <Text style={styles.primaryText}>{title}</Text>
        <LineIcon name="arrowRight" size={16} color="#FFFFFF" />
      </>
    )}
  </PressableScale>
);

const OrDivider: React.FC<{ label: string; style?: object }> = ({ label, style }) => (
  <View style={[styles.orRow, style]}>
    <View style={styles.orLine} />
    <Text style={styles.orText}>{label}</Text>
    <View style={styles.orLine} />
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 47,
  },
  headerSpacer: {
    width: 40,
  },
  sheet: {
    flex: 1,
    marginTop: -26,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 24,
    overflow: 'hidden',
  },
  sheetContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingHorizontal: 22,
  },
  eyebrow: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    letterSpacing: 1.54,
    color: C.brand,
  },
  title: {
    marginTop: 6,
    marginBottom: 6,
    fontFamily: fonts.sans[800],
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: C.ink,
  },
  titleSignup: {
    marginBottom: 4,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
  },
  sub: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: C.sub,
  },
  subSignup: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  loginFields: {
    marginTop: 20,
    gap: 12,
  },
  signupFields: {
    marginTop: 16,
    gap: 11,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  pillFocused: {
    borderColor: C.brand,
  },
  pillInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    color: C.ink,
  },
  errorText: {
    marginTop: 5,
    marginLeft: 16,
    fontFamily: fonts.sans[500],
    fontSize: 12,
    color: C.error,
  },
  rulesBox: {
    marginTop: -3,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  chkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.box,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chkBoxOn: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  chkText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: C.label,
  },
  link: {
    fontFamily: fonts.sans[700],
    fontSize: 13.5,
    color: C.brand,
  },
  inlineLink: {
    color: C.brand,
    fontFamily: fonts.sans[600],
  },
  primaryBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 13,
    elevation: 8,
  },
  primaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.line,
  },
  orText: {
    fontFamily: fonts.sans[700],
    fontSize: 11.5,
    letterSpacing: 1.15,
    color: C.or,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  googleText: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: C.ink,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    color: C.sub,
  },
  footerLink: {
    fontFamily: fonts.sans[800],
    color: C.brand,
  },
});
