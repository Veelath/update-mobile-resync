import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { getSession, UserSession } from '../services/session';
import { CreditLedgerEntry, getCreditHistoryApi } from '../services/api';
import { useCreditBalance } from '../services/credits';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { Rise } from '../components/Rise';
import { BuyCreditsSheet } from '../components/credits/BuyCreditsSheet';

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const UsageScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [session, setSession] = useState<UserSession | null>(null);
  const [available, setAvailable] = useCreditBalance();
  const [history, setHistory] = useState<CreditLedgerEntry[] | null>(null);
  const [buying, setBuying] = useState(false);

  const loadHistory = useCallback(() => {
    getCreditHistoryApi()
      .then(setHistory)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
      loadHistory();
    }, [loadHistory]),
  );

  const used = history ? history.reduce((sum, e) => (e.delta < 0 ? sum - e.delta : sum), 0) : null;
  const total = available !== null && used !== null ? available + used : null;
  const usedPct = total ? Math.min(100, ((used ?? 0) / total) * 100) : 0;
  const purchases = (history ?? []).filter((e) => e.delta > 0);

  const onPurchased = (balance: number, added: number) => {
    setBuying(false);
    setAvailable(balance);
    loadHistory();
    Alert.alert('Credits added', `${added} ${added === 1 ? 'credit was' : 'credits were'} added. You now have ${balance}.`);
  };

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
          <Text style={styles.intro}>View your available credits and current usage.</Text>
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
                <LineIcon name="coin" size={20} color="#FFFFFF" />
              </View>
              {available !== null && (
                <Text style={styles.leftPill}>
                  {available} {available === 1 ? 'report' : 'reports'} left
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.balanceValue}>{available ?? '–'}</Text>
              <Text style={styles.balanceLabel}>Credits available</Text>
            </View>
            <View>
              <View style={styles.meterLabels}>
                <Text style={styles.meterText}>{used ?? '–'} used</Text>
                <Text style={styles.meterText}>{total ?? '–'} total</Text>
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
            <View style={[styles.statIcon, { backgroundColor: '#E3F7EE' }]}>
              <LineIcon name="check" size={18} color="#0B9F6E" />
            </View>
            <Text style={[styles.statValue, { color: '#0B9F6E' }]}>{used ?? '–'}</Text>
            <Text style={styles.statLabel}>Credits used</Text>
          </View>
          <View style={[cardStyle, styles.stat]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3DB' }]}>
              <LineIcon name="bolt" size={18} color="#C77A0B" />
            </View>
            <Text style={[styles.statValue, { color: '#C77A0B' }]}>1 credit</Text>
            <Text style={styles.statLabel}>Cost per report</Text>
          </View>
        </Rise>

        {/* Call to action */}
        <Rise delay={280} style={[cardStyle, styles.pad18]}>
          <Text style={styles.cardTitle}>Ready to review a manuscript?</Text>
          <Text style={styles.cardSub}>
            Scan previews are free. Unlocking a full report uses one credit.
            {available ? ` You can unlock up to ${available} ${available === 1 ? 'report' : 'reports'}.` : ''}
          </Text>
          <View style={styles.ctaRow}>
            <PressableScale onPress={() => setBuying(true)} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Buy credits</Text>
            </PressableScale>
          </View>
        </Rise>

        {/* Purchase history */}
        <Rise delay={360} style={[cardStyle, styles.history]}>
          <View style={styles.historyHead}>
            <Text style={styles.historyTitle}>Purchase history</Text>
            <Text style={styles.pill}>
              {purchases.length} {purchases.length === 1 ? 'purchase' : 'purchases'}
            </Text>
          </View>
          {purchases.length === 0 && <Text style={styles.empty}>{history ? 'No purchases yet.' : 'Loading your purchases…'}</Text>}
          {purchases.map((p, i) => (
            <View key={`${p.created_at}-${i}`} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyName}>Bought credits</Text>
                <Text style={styles.historyWhen}>{formatWhen(p.created_at)}</Text>
              </View>
              <Text style={styles.historyDelta}>
                +{p.delta} {p.delta === 1 ? 'credit' : 'credits'} · {p.balance_after} total
              </Text>
            </View>
          ))}
        </Rise>
      </ScrollView>

      <BuyCreditsSheet visible={buying} userName={session?.userName ?? ''} onClose={() => setBuying(false)} onPurchased={onPurchased} />
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
    marginBottom: 2,
    fontFamily: fonts.sans[800],
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
    color: brand.ink,
  },
  intro: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19.5,
    color: brand.sub,
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
  leftPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: '#FFFFFF',
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
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    marginTop: 10,
    fontFamily: fonts.sans[800],
    fontSize: 26,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: '#6B6890',
  },
  cardTitle: {
    fontFamily: fonts.sans[800],
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
  history: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 15,
    color: brand.ink,
  },
  pill: {
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 13,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.tint,
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: brand.primary,
  },
  empty: {
    paddingTop: 2,
    paddingBottom: 12,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: brand.hint,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#EEEDF8',
  },
  historyLeft: {
    flexShrink: 1,
  },
  historyName: {
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: brand.ink,
  },
  historyWhen: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: '#7D7B9E',
  },
  historyDelta: {
    marginTop: 2,
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: '#0B9F6E',
  },
});
