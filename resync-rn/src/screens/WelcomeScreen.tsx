import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as SvgModule from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { setOnboardingCompleted } from '../services/session';
import { BrandBackdrop } from '../components/BrandBackdrop';
import { IssueTag, useBobClock } from '../components/IssueTag';
import { Rise } from '../components/Rise';
import { PressableScale } from '../components/PressableScale';
import { fonts } from '../theme/colors';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

// A2 mockup palette
const C = {
  ink: '#0B0A2E',
  sub: '#5A5778',
  brand: '#2B25C8',
  brandTint: '#EEEDFF',
  border: '#DAD8F2',
  hint: '#8B89AD',
  eyebrow: '#A9C0FF',
  bar: '#DDE0F5',
};

const SAMPLE_BARS = [
  { w: '96%', c: C.bar },
  { w: '78%', c: C.bar },
  { w: '100%', c: '#F6D88A' },
  { w: '70%', c: C.bar },
  { w: '92%', c: '#F8A9B8' },
  { w: '60%', c: C.bar },
  { w: '88%', c: '#B6C8F5' },
  { w: '50%', c: C.bar },
] as const;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const bob = useBobClock();

  const heroHeight = Math.min(496, Math.round(screenHeight * 0.56)) + insets.top;

  const openAuth = async (mode: 'signup' | 'login') => {
    await setOnboardingCompleted(true);
    navigation.navigate('Auth', { mode });
  };

  return (
    <View style={styles.page}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <BrandBackdrop
        angle={170}
        style={[styles.hero, { height: heroHeight }]}
        glows={[{ size: 280, color: '#2F6BFF', opacity: 0.65, position: { right: -90, top: 120 } }]}
      >
        <Rise delay={50} style={[styles.topRow, { paddingTop: insets.top + 14 }]}>
          <Image
            source={require('../assets/images/resync_logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.portal}>ACADEMIC PORTAL</Text>
        </Rise>

        <View style={styles.cardArea}>
          <Rise delay={180}>
            <View style={styles.cardWrap}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.brand} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      <Path d="M14 3v5h5" />
                      <Path d="M9 13h6M9 17h4" />
                    </Svg>
                  </View>
                  <Text style={styles.cardTitle}>Coherence report</Text>
                  <Text style={styles.samplePill}>SAMPLE</Text>
                </View>
                <View style={styles.bars}>
                  {SAMPLE_BARS.map((b, i) => (
                    <View key={i} style={[styles.bar, { width: b.w, backgroundColor: b.c }]} />
                  ))}
                </View>
              </View>

              <IssueTag clock={bob} phase={0} dot="#F5A524" label="Logic gap between sections" style={{ right: -34, top: 34 }} />
              <IssueTag clock={bob} phase={1 / 3} dot="#F43F5E" label="Citation not accessible" style={{ left: -30, top: 96 }} />
              <IssueTag clock={bob} phase={2 / 3} dot={C.brand} label="AI-text indicator" style={{ right: -18, bottom: -12 }} />
            </View>
          </Rise>
        </View>
      </BrandBackdrop>

      <View style={[styles.sheet, { paddingBottom: 26 + insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.sheetScroll} bounces={false} showsVerticalScrollIndicator={false}>
          <Rise delay={180}>
            <Text style={styles.title}>
              Your manuscript,{'\n'}
              <Text style={{ color: C.brand }}>checked end-to-end.</Text>
            </Text>
          </Rise>
          <Rise delay={300}>
            <Text style={styles.sub}>
              Check logic, citations and recommendations across every chapter, in one report.
            </Text>
          </Rise>

          <Rise delay={420} style={styles.actions}>
            <PressableScale onPress={() => openAuth('signup')} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Create free account</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </PressableScale>
            <PressableScale onPress={() => openAuth('login')} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>I already have an account</Text>
            </PressableScale>
            <Text style={styles.legal}>By continuing you agree to the Terms and Privacy Policy.</Text>
          </Rise>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 104,
    height: 51,
  },
  portal: {
    fontFamily: fonts.mono[400],
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: C.eyebrow,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  cardWrap: {
    width: 262,
    height: 200,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: C.ink,
  },
  samplePill: {
    marginLeft: 'auto',
    fontFamily: fonts.sans[800],
    fontSize: 9.5,
    letterSpacing: 0.76,
    color: C.brand,
    backgroundColor: C.brandTint,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bars: {
    gap: 11,
  },
  bar: {
    height: 8,
    borderRadius: 6,
  },
  sheet: {
    flex: 1,
    marginTop: -30,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 30,
    paddingHorizontal: 24,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: -24 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetScroll: {
    flexGrow: 1,
  },
  title: {
    fontFamily: fonts.sans[800],
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.9,
    color: C.ink,
  },
  sub: {
    marginTop: 12,
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 21.75,
    color: C.sub,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: 20,
    gap: 10,
  },
  btnPrimary: {
    height: 54,
    borderRadius: 15,
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
  btnPrimaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  btnGhost: {
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: C.ink,
  },
  legal: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: C.hint,
  },
});
