import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { getSession, creditsAvailable, UserSession } from '../services/session';
import { getAllScans } from '../services/scanRepository';
import { ScanItem } from '../data/scans';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { Rise } from '../components/Rise';

const CREDITS_PER_SCAN = 1;

const comingSoon = () => Alert.alert('Top up credits', 'Buying more credits is coming soon.');

export const UsageScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [session, setSession] = useState<UserSession | null>(null);
  const [scans, setScans] = useState<ScanItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
      getAllScans().then(setScans);
    }, []),
  );

  const total = session?.creditsTotal ?? 0;
  const used = session?.scansCount ?? 0;
  const available = session ? creditsAvailable(session) : 0;
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <View style={styles.page}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AppHeader
        title="Usage & credits"
        initials={initialsOf(session?.userName ?? '')}
        onAvatarPress={() => tabNav.navigate('Profile')}
      />

      <ScrollView contentContainerStyle={styles.main} showsVerticalScrollIndicator={false}>
        <Rise delay={50}>
          <Text style={styles.eyebrow}>ACCOUNT USAGE</Text>
          <Text style={styles.h1}>Usage &amp; credits</Text>
        </Rise>

        {/* Balance */}
        <Rise delay={120}>
          <LinearGradient
            colors={[brand.deep, brand.bright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balance}
          >
            <View style={styles.balanceTop}>
              <View style={styles.balanceIcon}>
                <LineIcon name="star" size={17} color="#FFFFFF" />
              </View>
              <PressableScale onPress={comingSoon} style={styles.topUp}>
                <LineIcon name="plus" size={16} color={brand.primary} />
                <Text style={styles.topUpText}>Top up</Text>
              </PressableScale>
            </View>
            <View>
              <Text style={styles.balanceValue}>{available}</Text>
              <Text style={styles.balanceLabel}>Credits available</Text>
            </View>
            <View>
              <View style={styles.meterLabels}>
                <Text style={styles.meterText}>{used} used</Text>
                <Text style={styles.meterText}>{total} total</Text>
              </View>
              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${usedPct}%` }]} />
              </View>
            </View>
          </LinearGradient>
        </Rise>

        {/* Stat tiles */}
        <Rise delay={200} style={styles.statRow}>
          <View style={[cardStyle, styles.stat]}>
            <Text style={[styles.statValue, { color: '#0B9F6E' }]}>{used}</Text>
            <Text style={styles.statLabel}>Credits used</Text>
          </View>
          <View style={[cardStyle, styles.stat]}>
            <Text style={[styles.statValue, { color: '#C77A0B' }]}>{CREDITS_PER_SCAN}</Text>
            <Text style={styles.statLabel}>Credit per scan</Text>
          </View>
        </Rise>

        {/* Call to action */}
        <Rise delay={280} style={[cardStyle, styles.pad18]}>
          <Text style={styles.cardTitle}>Ready to review a manuscript?</Text>
          <Text style={styles.cardSub}>Each complete coherence scan uses one credit.</Text>
          <View style={styles.ctaRow}>
            <PressableScale onPress={comingSoon} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Buy credits</Text>
            </PressableScale>
            <PressableScale onPress={() => tabNav.navigate('Upload')} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Start a scan</Text>
            </PressableScale>
          </View>
        </Rise>

        {/* Recent scans */}
        <Rise delay={360} style={[cardStyle, styles.pad18]}>
          <View style={styles.recentHead}>
            <Text style={styles.recentTitle}>Recent scans</Text>
            <Text style={styles.pill}>{scans.length} so far</Text>
          </View>
          {scans.length === 0 ? (
            <Text style={styles.empty}>No scans yet. Activity appears here after your first scan.</Text>
          ) : (
            <View style={styles.recentList}>
              {scans.slice(0, 3).map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => rootNav.push('Report', { scanId: s.id, heavy: s.heavy })}
                  style={({ pressed }) => [styles.recentRow, pressed && { backgroundColor: brand.tint }]}
                >
                  <View style={styles.recentIcon}>
                    <LineIcon name="doc" size={17} color={brand.primary} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {s.date} · {CREDITS_PER_SCAN} credit
                    </Text>
                  </View>
                  <LineIcon name="arrowRight" size={16} color={brand.icon} />
                </Pressable>
              ))}
            </View>
          )}
        </Rise>
      </ScrollView>
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
  pad18: {
    padding: 18,
  },
  eyebrow: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    letterSpacing: 1.54,
    color: brand.primary,
  },
  h1: {
    marginTop: 6,
    fontFamily: fonts.sans[800],
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
    color: brand.ink,
  },
  balance: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  topUpText: {
    fontFamily: fonts.sans[800],
    fontSize: 13,
    color: brand.primary,
  },
  balanceValue: {
    fontFamily: fonts.sans[800],
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -0.96,
    color: '#FFFFFF',
  },
  balanceLabel: {
    marginTop: 6,
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: '#C9C7FF',
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  meterText: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#C9C7FF',
  },
  meterTrack: {
    height: 7,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  meterFill: {
    minWidth: 7,
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    padding: 16,
  },
  statValue: {
    fontFamily: fonts.sans[800],
    fontSize: 26,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.muted,
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 16,
    color: brand.ink,
  },
  cardSub: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19.5,
    color: brand.sub,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: brand.primary,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPrimaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  btnGhost: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
  },
  btnGhostText: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  recentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: brand.ink,
  },
  pill: {
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.tint,
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: brand.primary,
  },
  empty: {
    marginTop: 10,
    marginBottom: 2,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19.5,
    color: brand.hint,
    textAlign: 'center',
  },
  recentList: {
    marginTop: 12,
    gap: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: brand.soft,
    borderWidth: 1,
    borderColor: brand.softLine,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentName: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  recentMeta: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: brand.muted,
  },
});
