import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, StatusBar, Image } from 'react-native';
import * as SvgModule from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { getSession, creditsAvailable } from '../services/session';
import { initialsOf } from '../components/AppHeader';
import { IssueTag, useBobClock } from '../components/IssueTag';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { Rise } from '../components/Rise';
import { PressableScale } from '../components/PressableScale';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, Pattern, Circle, Rect, RadialGradient, LinearGradient: SvgLinearGradient, Stop, Mask } = SvgModule;

// A5 mockup palette
const C = {
  ink: '#0B0A2E',
  sub: '#5A5778',
  brand: '#2B25C8',
  brandTint: '#EEEDFF',
  border: '#DAD8F2',
  line: '#E6E5F7',
  page: '#F5F5FE',
  muted: '#8B89AD',
  numeral: '#CFCDFB',
};

const SAMPLE_BARS = [
  { w: '92%', c: C.line },
  { w: '78%', c: C.line },
  { w: '96%', c: '#FFE3A8' },
  { w: '64%', c: C.line },
  { w: '88%', c: C.line },
  { w: '84%', c: '#FFC9D4' },
  { w: '70%', c: C.line },
  { w: '94%', c: C.numeral },
] as const;

const FEATURES: { icon: LineIconName; label: string }[] = [
  { icon: 'link', label: 'Section coherence' },
  { icon: 'chat', label: 'Citation checks' },
  { icon: 'sparkle', label: 'AI-text indicator' },
  { icon: 'doc', label: 'Word & Docs link' },
];

type Step = { n: string; icon: LineIconName; title: string; desc: string };

// Two staggered columns: 01/03 on the left, 02/04 dropped lower on the right
const STEP_COLUMNS: Step[][] = [
  [
    { n: '01', icon: 'template', title: 'Chapter template', desc: 'Optional. Attach or reuse saved headings.' },
    { n: '03', icon: 'scanCheck', title: 'Coherence scan', desc: 'AI checks logic gaps, citations and more.' },
  ],
  [
    { n: '02', icon: 'upload', title: 'Upload & confirm', desc: 'Word file or Google Docs link, then confirm.' },
    { n: '04', icon: 'download', title: 'Export report', desc: 'Download the annotated PDF with fixes.' },
  ],
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

/** Dark hero backdrop: indigo glow, dot grid fading in toward the bottom, and two outline rings. */
const HeroBackdrop: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <RadialGradient id="heroGlow" cx="85%" cy="62%" rx="70%" ry="45%" fx="85%" fy="62%">
          <Stop offset="0" stopColor="#3A33E6" stopOpacity={1} />
          <Stop offset="0.45" stopColor="#3A33E6" stopOpacity={0.35} />
          <Stop offset="0.75" stopColor="#0B0A2E" stopOpacity={0} />
        </RadialGradient>
        <Pattern id="heroDots" width={28} height={28} patternUnits="userSpaceOnUse">
          <Circle cx={14} cy={14} r={1.2} fill="#FFFFFF" fillOpacity={0.14} />
        </Pattern>
        <SvgLinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.2" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
        </SvgLinearGradient>
        <Mask id="heroMask">
          <Rect width="100%" height="100%" fill="url(#heroFade)" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#heroGlow)" />
      <Rect width="100%" height="100%" fill="url(#heroDots)" mask="url(#heroMask)" />
    </Svg>
    <View style={[styles.ring, { right: -150, top: -170, width: 420, height: 420, borderColor: 'rgba(255,255,255,0.12)' }]} />
    <View style={[styles.ring, { right: -70, top: -90, width: 260, height: 260, borderColor: 'rgba(255,255,255,0.1)' }]} />
  </View>
);

export const DashboardScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const bob = useBobClock();
  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState('');

  useFocusEffect(
    useCallback(() => {
      getSession().then((s) => {
        setCredits(creditsAvailable(s));
        setUserName(s.userName);
      });
    }, []),
  );

  const parts = userName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const initials = initialsOf(userName);

  return (
    <View style={styles.page}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <Image source={require('../assets/images/resync_logo_color.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.topRight}>
          <Pressable onPress={() => tabNav.navigate('Credits')} style={styles.creditsChip} hitSlop={4}>
            <LineIcon name="star" size={17} color={C.brand} />
            <Text style={styles.creditsText}>Credits: {credits}</Text>
          </Pressable>
          <View style={styles.bell}>
            <LineIcon name="bell" size={18} color={C.sub} />
            <View style={styles.bellDot} />
          </View>
          <Pressable onPress={() => tabNav.navigate('Profile')} style={styles.avatar} hitSlop={4}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <HeroBackdrop />

          <Rise delay={50} style={styles.greetPill}>
            <View style={styles.greetDot} />
            <Text style={styles.greetText}>
              {greeting()}
              {firstName ? `, ${firstName}` : ''}
            </Text>
          </Rise>
          <Rise delay={50}>
            <Text style={styles.heroTitle}>
              Your manuscript, <Text style={{ color: '#B9B6FF' }}>checked end-to-end.</Text>
            </Text>
          </Rise>
          <Rise delay={180}>
            <Text style={styles.heroBody}>
              Check logical links between consecutive sections, citations, and the AI-text indicator in one report.
            </Text>
          </Rise>

          <Rise delay={300} style={styles.ctaRow}>
            <PressableScale onPress={() => tabNav.navigate('Upload')} style={styles.ctaPrimary}>
              <LineIcon name="upload" size={22} color={C.brand} />
              <Text style={styles.ctaPrimaryText}>Start a Scan</Text>
            </PressableScale>
            <PressableScale onPress={() => rootNav.push('Report', { heavy: false })} style={styles.ctaGhost}>
              <Text style={styles.ctaGhostText}>Preview sample</Text>
              <LineIcon name="arrowRight" size={16} color="#FFFFFF" />
            </PressableScale>
          </Rise>

          <Rise delay={420} style={styles.cardArea}>
            <View style={styles.cardWrap}>
              <View style={styles.cardShadowTile} />
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <LineIcon name="doc" size={18} color={C.brand} />
                  </View>
                  <Text style={styles.cardTitle}>Coherence report</Text>
                  <Text style={styles.samplePill}>SAMPLE</Text>
                </View>
                {SAMPLE_BARS.map((b, i) => (
                  <View key={i} style={[styles.bar, { width: b.w, backgroundColor: b.c }]} />
                ))}
              </View>
              <IssueTag clock={bob} phase={0} dot="#F5A524" label="Logic gap between sections" style={{ right: -22, top: 62 }} />
              <IssueTag clock={bob} phase={1 / 3} dot="#F43F5E" label="Citation not accessible" style={{ left: -22, top: 132 }} />
              <IssueTag clock={bob} phase={2 / 3} dot={C.brand} label="Highlighted suggestion" style={{ right: -14, bottom: -14 }} />
            </View>
          </Rise>

          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureChip}>
                <View style={styles.featureIcon}>
                  <LineIcon name={f.icon} size={16} color={C.numeral} />
                </View>
                <Text style={styles.featureText} numberOfLines={2}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.process}>
          <Text style={styles.eyebrow}>PROCESS</Text>
          <Text style={styles.processTitle}>How It Works</Text>
          <Text style={styles.processSub}>Four simple steps from manuscript to coherence report.</Text>

          <View style={styles.stepGrid}>
            {STEP_COLUMNS.map((col, ci) => (
              <View key={ci} style={[styles.stepCol, ci === 1 && { paddingTop: 40 }]}>
                {col.map((s) => (
                  <View key={s.n} style={styles.stepWrap}>
                    <View style={styles.stepCard}>
                      <View style={styles.stepIcon}>
                        <LineIcon name={s.icon} size={22} color="#FFFFFF" />
                      </View>
                      <Text style={styles.stepLabel}>STEP {Number(s.n)}</Text>
                      <Text style={styles.stepTitle}>{s.title}</Text>
                      <Text style={styles.stepDesc}>{s.desc}</Text>
                    </View>
                    <Text style={styles.stepNumeral}>{s.n}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.page,
  },
  scroll: {
    paddingBottom: 40,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    zIndex: 3,
  },
  logo: {
    width: 69,
    height: 34,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.brandTint,
    borderWidth: 1,
    borderColor: C.border,
  },
  creditsText: {
    fontFamily: fonts.sans[800],
    fontSize: 12.5,
    color: C.brand,
  },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Hero
  hero: {
    overflow: 'hidden',
    backgroundColor: C.ink,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  greetPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  greetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  greetText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: '#FFFFFF',
  },
  heroTitle: {
    marginTop: 18,
    fontFamily: fonts.sans[800],
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
    color: '#FFFFFF',
  },
  heroBody: {
    marginTop: 14,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    lineHeight: 24,
    color: '#D3D1F5',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  ctaPrimary: {
    flex: 1.1,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  ctaPrimaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: C.brand,
  },
  ctaGhost: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  ctaGhostText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },

  // Sample card
  cardArea: {
    marginTop: 52,
    marginBottom: 34,
    alignItems: 'center',
  },
  cardWrap: {
    width: 272,
  },
  cardShadowTile: {
    position: 'absolute',
    left: 14,
    right: -14,
    top: 18,
    height: 226,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '5deg' }],
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 22,
    gap: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 36 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 6,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: C.ink,
  },
  samplePill: {
    marginLeft: 'auto',
    fontFamily: fonts.sans[800],
    fontSize: 10,
    letterSpacing: 0.8,
    color: C.brand,
    backgroundColor: C.brandTint,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bar: {
    height: 9,
    borderRadius: 6,
  },

  // Feature chips
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.sans[600],
    fontSize: 12,
    lineHeight: 15,
    color: '#E4E3FF',
  },

  // How it works
  process: {
    zIndex: 2,
    marginTop: -38,
    marginHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 6,
  },
  eyebrow: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    letterSpacing: 2.2,
    color: C.brand,
  },
  processTitle: {
    marginTop: 6,
    marginBottom: 4,
    fontFamily: fonts.sans[800],
    fontSize: 27,
    letterSpacing: -0.7,
    color: C.ink,
  },
  processSub: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    lineHeight: 20,
    color: C.sub,
    textAlign: 'center',
  },
  stepGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  stepCol: {
    flex: 1,
    minWidth: 0,
  },
  stepWrap: {
    marginTop: 52,
  },
  stepNumeral: {
    position: 'absolute',
    left: 4,
    top: -40,
    fontFamily: fonts.sans[800],
    fontSize: 68,
    lineHeight: 68,
    letterSpacing: -3.4,
    color: C.numeral,
    zIndex: 2,
    elevation: 7,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    paddingTop: 34,
    paddingHorizontal: 14,
    paddingBottom: 18,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.18,
    shadowRadius: 17,
    elevation: 5,
  },
  stepIcon: {
    position: 'absolute',
    right: 14,
    top: -22,
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  stepLabel: {
    marginTop: 18,
    fontFamily: fonts.mono[700],
    fontSize: 10,
    letterSpacing: 1.8,
    color: C.brand,
  },
  stepTitle: {
    marginTop: 5,
    marginBottom: 6,
    fontFamily: fonts.sans[700],
    fontSize: 15.5,
    lineHeight: 19,
    letterSpacing: -0.15,
    color: C.ink,
  },
  stepDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 19,
    color: C.sub,
  },
});
