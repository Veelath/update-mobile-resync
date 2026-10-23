import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { getSession, UserSession } from '../services/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ProfileScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<UserSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
    }, [])
  );

  const getInitials = (fullName: string) => {
    if (!fullName) return 'NH';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const name = session?.userName || 'Noel Henry';
  const email = session?.userEmail || 'noelhenrymier@gmail.com';
  const role = session?.userRole || 'Principal Investigator';
  const institution = session?.userInstitution || 'Stanford University';
  const bio =
    session?.userBio ||
    'Specializing in distributed systems coherence and academic reference validation systems.';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Bar h64 */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <Pressable
          onPress={() => rootNav.push('Settings')}
          style={styles.gearBtn}
        >
          <MaterialIcons name="settings" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar & Header info */}
        <View style={styles.headerInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileRole}>{role}</Text>
        </View>

        {/* User Credentials Card */}
        <View style={styles.credentialsCard}>
          <Text style={styles.cardHeaderTitle}>User Credentials</Text>

          {/* Field: Full Name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{name}</Text>
            </View>
          </View>

          {/* Field: Email Address */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{email}</Text>
            </View>
          </View>

          {/* Field: Academic Institution */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>ACADEMIC INSTITUTION</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{institution}</Text>
            </View>
          </View>

          {/* Field: Academic Role */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>ACADEMIC ROLE</Text>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{role}</Text>
            </View>
          </View>

          {/* Field: Brief Research Bio */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>BRIEF RESEARCH BIO</Text>
            <View style={[styles.valueBox, styles.bioBox]}>
              <Text style={styles.valueText}>{bio}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.soft,
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topBarTitle: {
    fontFamily: fonts.display[700],
    fontSize: 22,
    color: colors.ink,
  },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 24,
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(10,42,184,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(10,42,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: fonts.display[700],
    fontSize: 36,
    color: colors.primary,
    includeFontPadding: false,
  },
  profileName: {
    fontFamily: fonts.display[700],
    fontSize: 22,
    color: colors.ink,
    marginTop: 12,
  },
  profileRole: {
    fontFamily: fonts.sans[500],
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  credentialsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  cardHeaderTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: colors.ink,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  valueBox: {
    backgroundColor: colors.soft,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bioBox: {
    minHeight: 64,
  },
  valueText: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
});
