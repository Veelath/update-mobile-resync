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
import {supabase} from '../services/supabase';
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
        const {error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
        if (error) throw error;
      } else {
        const fullName = name.trim();
        const parts = fullName.split(/\s+/);
        const {data, error} = await supabase.auth.signUp({
          email: email.trim(), password,
          options: {data: {first_name: parts[0], middle_name: parts.slice(1, -1).join(' '),
            last_name: parts.length > 1 ? parts[parts.length - 1] : '', full_name: fullName,
            institution: school.trim()}},
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert('Check your email', 'Confirm your email address, then sign in.');
          setMode('login');
          return;
        }
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
                <Pressable onPress={async () => {
                  if (!email.trim()) {
                    Alert.alert('Reset Password', 'Enter your email address first.');
                    return;
                  }
                  const {error} = await supabase.auth.resetPasswordForEmail(email.trim());
                  Alert.alert('Reset Password', error?.message || 'Check your email for password reset instructions.');
                }}>
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
