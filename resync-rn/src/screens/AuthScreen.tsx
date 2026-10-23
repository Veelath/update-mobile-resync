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

        <View style={styles.spacer} />
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

        {/* Social Row */}
        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialBtn}
            onPress={() => Alert.alert('Google Sign-In', 'Google sign-in demo')}
          >
            <View style={styles.gTile}>
              <Text style={styles.gText}>G</Text>
            </View>
            <Text style={styles.socialBtnText}>Google</Text>
          </Pressable>

          <Pressable
            style={styles.socialBtn}
            onPress={() => Alert.alert('Facebook Sign-In', 'Facebook sign-in demo')}
          >
            <View style={styles.fbTile}>
              <Text style={styles.fbText}>f</Text>
            </View>
            <Text style={styles.socialBtnText}>Facebook</Text>
          </Pressable>
        </View>

        {/* Divider with text */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            {isLogin ? 'or continue with email' : 'or fill in the form'}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {!isLogin && (
            <TextField
              label="Full name"
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
            label="Email"
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
              label="School / University"
              placeholder="e.g. University of the Philippines"
              value={school}
              onChangeText={setSchool}
            />
          )}

          <TextField
            label="Password"
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
    backgroundColor: colors.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(226,232,240,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTile: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandR: {
    fontFamily: fonts.display[800],
    fontSize: 15,
    color: colors.white,
    includeFontPadding: false,
  },
  brandTitle: {
    fontFamily: fonts.display[800],
    fontSize: 16,
    color: colors.ink,
  },
  spacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 18,
  },
  titleSection: {
    gap: 4,
  },
  titleText: {
    fontFamily: fonts.display[700],
    fontSize: 26,
    color: colors.ink,
  },
  subtitleText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.muted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnText: {
    fontFamily: fonts.sans[600],
    fontSize: 13.5,
    color: colors.ink,
  },
  gTile: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: {
    fontFamily: fonts.sans[700],
    fontSize: 16,
    color: '#EA4335',
  },
  fbTile: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
  },
  form: {
    gap: 14,
  },
  forgotText: {
    fontFamily: fonts.sans[700],
    fontSize: 11.5,
    color: colors.action,
  },
  agreementWrapper: {
    gap: 4,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  agreementText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 18,
    color: colors.body,
  },
  agreeError: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 30,
  },
  submitBtn: {
    backgroundColor: colors.action,
    height: 50,
    borderRadius: 12,
    marginTop: 8,
  },
  switchRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.body,
  },
  switchHighlight: {
    fontFamily: fonts.sans[700],
    color: colors.action,
  },
});
