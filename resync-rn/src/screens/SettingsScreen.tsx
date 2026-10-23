import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { Segmented } from '../components/Segmented';
import {
  clearSession,
  getSession,
  saveSession,
  UserSession,
} from '../services/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('light');
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setTheme(s.themePreference);
      setPushNotifs(s.pushNotifications);
      setEmailAlerts(s.emailAlerts);
    });
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme as any);
    await saveSession({ themePreference: newTheme as any });
  };

  const handlePushToggle = async (val: boolean) => {
    setPushNotifs(val);
    await saveSession({ pushNotifications: val });
  };

  const handleEmailToggle = async (val: boolean) => {
    setEmailAlerts(val);
    await saveSession({ emailAlerts: val });
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Resync?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth', params: { mode: 'login' } }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.topBarTitle}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {/* SECTION 1: APPEARANCE */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>APPEARANCE</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>Theme</Text>
                <Text style={styles.rowSub}>Select interface appearance</Text>
              </View>
            </View>
            <Segmented
              items={[
                { id: 'system', label: 'System' },
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ]}
              selectedId={theme}
              onSelect={handleThemeChange}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>

        {/* SECTION 2: NOTIFICATIONS */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            {/* Push Notifications */}
            <View style={styles.switchRow}>
              <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>Push notifications</Text>
                <Text style={styles.rowSub}>Alert when scans finish</Text>
              </View>
              <Switch
                value={pushNotifs}
                onValueChange={handlePushToggle}
                thumbColor={colors.white}
                trackColor={{ false: colors.track, true: colors.primary }}
              />
            </View>

            <View style={styles.cardDivider} />

            {/* Email alerts */}
            <View style={styles.switchRow}>
              <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>Email alerts</Text>
                <Text style={styles.rowSub}>Summary reports delivered to inbox</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={handleEmailToggle}
                thumbColor={colors.white}
                trackColor={{ false: colors.track, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: ACCOUNT */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>ACCOUNT</Text>
          <View style={styles.card}>
            {/* Edit Profile */}
            <Pressable
              onPress={() => {
                navigation.navigate('Main', { screen: 'Profile' } as any);
              }}
              style={({ pressed }) => [
                styles.actionRow,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={styles.rowLabelCol}>
                <Text style={styles.rowLabel}>Edit profile</Text>
                <Text style={styles.rowSub}>Credentials and research bio</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.hint} />
            </Pressable>

            <View style={styles.cardDivider} />

            {/* Log Out */}
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.actionRow,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={styles.logoutRow}>
                <MaterialIcons name="logout" size={20} color={colors.danger} />
                <Text style={styles.logoutText}>Log out</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Footer Caption */}
        <Text style={styles.footerCaption}>Resync v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 16,
    color: colors.ink,
  },
  scrollContent: {
    padding: 16,
    gap: 22,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionEyebrow: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  themeRow: {
    marginBottom: 4,
  },
  switchRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fonts.sans[500],
    fontSize: 14.5,
    color: colors.ink,
  },
  rowSub: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    color: colors.danger,
  },
  footerCaption: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
    textAlign: 'center',
    marginTop: 10,
  },
});
