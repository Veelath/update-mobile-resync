import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as SvgModule from 'react-native-svg';
const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;
const Circle = SvgModule.Circle;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { loginUser, registerUser } from '../services/scanRepository';
import { saveSession } from '../services/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// Authentic Google Multicolor 'G' Icon
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

// Authentic Facebook Icon
const FacebookIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="12" fill="#1877F2" />
    <Path
      d="M15.12 12.35h-2.12v7.65h-3.16v-7.65H8.35v-2.7h1.49V7.78c0-2.06 1.23-3.18 3.09-3.18.89 0 1.83.16 1.83.16v2.01h-1.03c-1.02 0-1.34.63-1.34 1.28v1.6h2.27l-.36 2.7z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const AuthScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialMode = route.params?.mode || 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const insets = useSafeAreaInsets();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (mode === 'signup' && !name.trim()) {
      newErrors.name = 'Please enter your full name';
    }
    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'signup' && !agree) {
      newErrors.agree = 'You must agree to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser({ email, password });
        await saveSession({
          authToken: res.token,
          userEmail: res.email,
          userName: res.name,
          isLoggedIn: true,
        });
      } else {
        const res = await registerUser({ name, email, school, password });
        await saveSession({
          authToken: res.token,
          userEmail: res.email,
          userName: res.name,
          userInstitution: res.school || school || 'Stanford University',
          isLoggedIn: true,
        });
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color="#334155" />
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.brandTile}>
            <Text style={styles.brandR}>R</Text>
          </View>
          <Text style={styles.brandTitle}>Resync</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
      >
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.subtitleText}>
            {isLogin
              ? 'Sign in to access your scans and results.'
              : 'Free forever. No credit card needed.'}
          </Text>
        </View>

        {/* Social Row: Google and Facebook */}
        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialBtn}
            onPress={async () => {
              await saveSession({
                isLoggedIn: true,
                userEmail: 'veronica@stanford.edu',
                userName: 'Veronica May',
                userInstitution: 'Stanford University',
              });
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <GoogleIcon size={18} />
            <Text style={styles.socialBtnText}>Google</Text>
          </Pressable>

          <Pressable
            style={styles.socialBtn}
            onPress={async () => {
              await saveSession({
                isLoggedIn: true,
                userEmail: 'veronica@stanford.edu',
                userName: 'Veronica May',
                userInstitution: 'Stanford University',
              });
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          >
            <FacebookIcon size={20} />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </Pressable>
        </View>

        {/* Divider with text */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            {isLogin ? 'or continue with\nemail' : 'or fill in the\nform'}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {!isLogin && (
            <TextField
              label="FULL NAME"
              placeholder="Juan Dela Cruz"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
            />
          )}

          <TextField
            label="EMAIL"
            placeholder="you@university.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            error={errors.email}
          />

          {!isLogin && (
            <TextField
              label="SCHOOL / UNIVERSITY"
              placeholder="e.g. University of the Philippines"
              value={school}
              onChangeText={setSchool}
            />
          )}

          <TextField
            label="PASSWORD"
            placeholder="••••••••"
            isPassword
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={errors.password}
            labelRight={
              isLogin ? (
                <Pressable onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              ) : undefined
            }
          />

          {!isLogin && (
            <View style={styles.agreementWrapper}>
              <View style={styles.agreementRow}>
                <Checkbox
                  checked={agree}
                  onToggle={(c) => {
                    setAgree(c);
                    if (errors.agree) setErrors({ ...errors, agree: '' });
                  }}
                />
                <Text style={styles.agreementText}>
                  I agree to the Terms of Service and Privacy Policy. I understand
                  Resync is a decision-support tool.
                </Text>
              </View>
              {errors.agree ? (
                <Text style={styles.agreeError}>{errors.agree}</Text>
              ) : null}
            </View>
          )}

          {/* Primary Submit Button */}
          <Button
            title={isLogin ? 'Sign In' : 'Create My Account'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        {/* Switch Link */}
        <Pressable
          onPress={() => {
            setMode(isLogin ? 'signup' : 'login');
            setErrors({});
          }}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchHighlight}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTile: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandR: {
    fontFamily: fonts.sans[800],
    fontSize: 16,
    color: colors.white,
    lineHeight: 18,
  },
  brandTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleText: {
    fontFamily: fonts.sans[800],
    fontSize: 28,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnText: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: '#0F172A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontFamily: fonts.sans[500],
    fontSize: 11,
    color: '#94A3B8',
    paddingHorizontal: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
  form: {
    gap: 14,
    marginTop: 8,
  },
  forgotText: {
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: '#2563EB',
  },
  agreementWrapper: {
    marginTop: 2,
    marginBottom: 4,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  agreementText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  agreeError: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    marginTop: 6,
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  switchRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 4,
  },
  switchText: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: '#64748B',
  },
  switchHighlight: {
    fontFamily: fonts.sans[700],
    color: '#2563EB',
  },
});
