import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert, StatusBar} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../navigation/types';
import {colors, fonts} from '../theme/colors';
import {getSession, saveSession} from '../services/session';
import {supabase} from '../services/supabase';
import {loadProfile} from '../services/profile';
import {TextField} from '../components/TextField';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// Web's change-password rules and messages; unlike the web demo, this really updates the password.
export function passwordError(current: string, next: string, confirm: string): string {
  if (!current) return 'Please enter your current password.';
  if (next.length < 8) return 'New password must be at least 8 characters long.';
  if (next !== confirm) return 'New passwords do not match.';
  return '';
}

// Layout follows the web Settings page: profile card, notifications card, change password.
export const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [fullName, setFullName] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    getSession().then(s => setPushNotifs(s.pushNotifications));
    supabase.auth.getUser().then(async ({data}) => setFullName((await loadProfile(data.user)).fullName));
  }, []);

  const handlePushToggle = async (val: boolean) => {
    setPushNotifs(val);
    await saveSession({pushNotifications: val});
  };

  const updatePassword = async () => {
    setPwError('');
    setPwSuccess('');
    const invalid = passwordError(currentPw, newPw, confirmPw);
    if (invalid) return setPwError(invalid);
    setPwLoading(true);
    try {
      const {data} = await supabase.auth.getUser();
      const {error: signInError} = await supabase.auth.signInWithPassword({email: data.user?.email || '', password: currentPw});
      if (signInError) return setPwError('Your current password is incorrect.');
      const {error} = await supabase.auth.updateUser({password: newPw});
      if (error) return setPwError(error.message);
      setPwSuccess('Your password has been updated successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Resync?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log Out', style: 'destructive', onPress: async () => {
        const {error} = await supabase.auth.signOut();
        if (error) {
          Alert.alert('Logout failed', error.message);
          return;
        }
        navigation.reset({index: 0, routes: [{name: 'Auth', params: {mode: 'login'}}]});
      }},
    ]);
  };

  const cardHeader = (icon: string, title: string, sub: string) => <View style={styles.cardHeader}>
    <View style={styles.cardIcon}><MaterialIcons name={icon} size={20} color={colors.primary} /></View>
    <View style={styles.flex}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  </View>;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 24) + 16}]}>
        <View>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.cardSub}>Manage your account credentials, security, and preferences.</Text>
        </View>

        <View style={styles.card}>
          {cardHeader('person-outline', 'Profile information', 'Update your personal contact details and display name.')}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.flex]} numberOfLines={1}>{fullName}</Text>
            <Pressable onPress={() => navigation.navigate('Main', {screen: 'Profile'})} style={styles.outlineBtn}>
              <Text style={styles.outlineText}>Open Profile →</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          {cardHeader('notifications-none', 'Notifications', 'Scan completion alerts are sent to this phone and to your account email.')}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.flex]}>Scan completion notifications</Text>
            <Switch value={pushNotifs} onValueChange={handlePushToggle} trackColor={{false: colors.track, true: colors.primary}} thumbColor={colors.white} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.flex]}>Scan completion emails</Text>
            <Text style={styles.enabled}>Enabled</Text>
          </View>
        </View>

        <View style={styles.card}>
          {cardHeader('lock-outline', 'Change password', 'Update your account password to maintain academic workspace security.')}
          {!!pwSuccess && <Text style={styles.success}>{pwSuccess}</Text>}
          {!!pwError && <Text accessibilityRole="alert" style={styles.error}>{pwError}</Text>}
          <TextField label="Current Password" isPassword value={currentPw} onChangeText={setCurrentPw} placeholder="Enter current password" />
          <TextField label="New Password" isPassword value={newPw} onChangeText={setNewPw} placeholder="Minimum 8 characters" />
          <Text style={styles.cardSub}>Must be at least 8 characters long.</Text>
          <TextField label="Confirm New Password" isPassword value={confirmPw} onChangeText={setConfirmPw} placeholder="Re-enter new password" />
          <Pressable onPress={updatePassword} disabled={pwLoading} style={[styles.primaryBtn, pwLoading && {opacity: 0.6}]}>
            <Text style={styles.primaryText}>{pwLoading ? 'Updating…' : 'Change password'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogout} style={styles.logoutRow}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Text style={styles.footerCaption}>Resync v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.soft},
  topBar: {height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12},
  backBtn: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  scrollContent: {paddingHorizontal: 20, gap: 16},
  flex: {flex: 1},
  eyebrow: {fontFamily: fonts.mono[700], fontSize: 10, color: colors.primary, letterSpacing: 1.2},
  title: {fontFamily: fonts.display[700], fontSize: 26, color: colors.ink, marginBottom: 4},
  card: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18, gap: 14},
  cardHeader: {flexDirection: 'row', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line},
  cardIcon: {width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center'},
  cardTitle: {fontFamily: fonts.sans[700], fontSize: 15, color: colors.ink},
  cardSub: {fontFamily: fonts.sans[400], fontSize: 13, color: colors.muted, lineHeight: 19},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line},
  rowLabel: {fontFamily: fonts.sans[600], fontSize: 13, color: colors.body},
  outlineBtn: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line},
  outlineText: {fontFamily: fonts.sans[700], fontSize: 12, color: colors.primary},
  enabled: {fontFamily: fonts.sans[700], fontSize: 11, color: colors.successText, backgroundColor: colors.successTint, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden'},
  primaryBtn: {alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: colors.primary},
  primaryText: {fontFamily: fonts.sans[700], fontSize: 14, color: colors.white},
  success: {fontFamily: fonts.sans[600], fontSize: 13, color: colors.successText},
  error: {fontFamily: fonts.sans[600], fontSize: 13, color: colors.errorText},
  logoutRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white},
  logoutText: {fontFamily: fonts.sans[700], fontSize: 14, color: colors.error},
  footerCaption: {fontFamily: fonts.sans[400], fontSize: 12, color: colors.hint, textAlign: 'center'},
});
