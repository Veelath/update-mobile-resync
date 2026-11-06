import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing, Image, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as SvgModule from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../theme/colors';
import { brand } from '../../theme/brand';
import { LineIcon } from '../LineIcon';
import { PressableScale } from '../PressableScale';
import { Rise } from '../Rise';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, Pattern, Circle, Rect, RadialGradient, Stop, Mask } = SvgModule;

const CHECKS = [
  { title: 'Reading your manuscript', sub: 'Extracting chapters and sections', status: 'Reading your manuscript…' },
  { title: 'Checking section links', sub: 'Finding weak links or conflicts', status: 'Checking section links…' },
  { title: 'Verifying citation access', sub: 'Checking that references are reachable', status: 'Verifying citations…' },
  {
    title: 'Generating AI Recommendations',
    sub: 'The AI is reviewing each pair of sections. This can take a little longer.',
    status: 'Generating AI Recommendations…',
  },
];

const TOTAL_MS = 14000;
const QUARTER = 100 / CHECKS.length;
// A check shows its green tick for the last slice of its quarter before the next one slides in
const DONE_AT = QUARTER - 4;

const useLoop = (duration: number, { delay = 0, easing = Easing.linear } = {}) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }));
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, duration, delay, easing]);
  return v;
};

const Spinner: React.FC = () => {
  const spin = useLoop(900);
  return (
    <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
        <Circle cx={15} cy={15} r={13.5} stroke="#E4E2FF" strokeWidth={3} />
        <Circle cx={15} cy={15} r={13.5} stroke={brand.primary} strokeWidth={3} strokeDasharray="21 64" />
      </Svg>
    </Animated.View>
  );
};

/** One check row; slides up into place, and out again when the next check takes over. */
const CheckRow: React.FC<{ index: number; done: boolean; leaving: boolean }> = ({ index, done, leaving }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: leaving ? 2 : 1,
      duration: 320,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [leaving, v]);

  const check = CHECKS[index];
  return (
    <Animated.View
      style={[
        styles.row,
        done && styles.rowDone,
        {
          opacity: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1, 2], outputRange: [16, 0, -16] }) }],
        },
      ]}
    >
      <View style={styles.flex1}>
        <Text style={[styles.rowTitle, done && styles.rowTitleDone]}>{check.title}</Text>
        <Text style={styles.rowSub}>{check.sub}</Text>
      </View>
      {done ? (
        <View style={styles.tick}>
          <LineIcon name="check" size={17} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      ) : (
        <Spinner />
      )}
    </Animated.View>
  );
};

export const AnalyzingView: React.FC<{ onDone: () => void; onBackground: () => void }> = ({ onDone, onBackground }) => {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);
  const [prevPhase, setPrevPhase] = useState<number | null>(null);

  const pulseA = useLoop(2800, { easing: Easing.out(Easing.ease) });
  const pulseB = useLoop(2800, { delay: 1400, easing: Easing.out(Easing.ease) });
  const orbit = useLoop(38000);
  const shine = useLoop(1800, { easing: Easing.inOut(Easing.ease) });

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPct(Math.floor(value)));
    Animated.timing(progress, { toValue: 100, duration: TOTAL_MS, easing: Easing.linear, useNativeDriver: false }).start(
      ({ finished }) => {
        if (finished) setTimeout(onDone, 500);
      },
    );
    return () => {
      progress.removeListener(id);
      progress.stopAnimation();
    };
  }, [progress, onDone]);

  const phase = Math.min(CHECKS.length - 1, Math.floor(pct / QUARTER));
  const done = pct >= 100 || pct - phase * QUARTER >= DONE_AT;

  // Keep the previous row on screen briefly so it can slide out
  const lastPhase = useRef(phase);
  useEffect(() => {
    if (phase !== lastPhase.current) {
      setPrevPhase(lastPhase.current);
      lastPhase.current = phase;
      const t = setTimeout(() => setPrevPhase(null), 340);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const pulseStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.22] }) }],
  });

  return (
    <View style={styles.page}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <LinearGradient colors={['#EEEDFF', '#FAFAFF', '#FFFFFF']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />

      {/* Dot grid fading out from the orb, plus a soft top glow */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id="aDots" width={30} height={30} patternUnits="userSpaceOnUse">
            <Circle cx={15} cy={15} r={1.2} fill={brand.primary} fillOpacity={0.13} />
          </Pattern>
          <RadialGradient id="aFade" cx="50%" cy="30%" rx="70%" ry="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <Mask id="aMask">
            <Rect width="100%" height="100%" fill="url(#aFade)" />
          </Mask>
          <RadialGradient id="aGlow" cx="50%" cy="0%" rx="80%" ry="40%">
            <Stop offset="0" stopColor={brand.primary} stopOpacity={0.18} />
            <Stop offset="0.65" stopColor={brand.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#aGlow)" />
        <Rect width="100%" height="100%" fill="url(#aDots)" mask="url(#aMask)" />
      </Svg>

      <ScrollView
        contentContainerStyle={[styles.main, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Rise delay={100} style={styles.orb}>
          <Animated.View style={[styles.pulse, pulseStyle(pulseA)]} />
          <Animated.View style={[styles.pulse, styles.pulseSoft, pulseStyle(pulseB)]} />
          <Animated.View
            style={[styles.orbitLayer, { transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }] }]}
          >
            <Svg width={176} height={176} viewBox="0 0 100 100" fill="none">
              <Circle cx={50} cy={50} r={48} stroke={brand.primary} strokeWidth={3} strokeLinecap="round" strokeDasharray="64 238" opacity={0.85} />
            </Svg>
          </Animated.View>
          <View style={styles.core}>
            <Image source={require('../../assets/images/resync_logo_color.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </Rise>

        <Rise delay={250} style={styles.center}>
          <Text style={styles.title}>Analyzing your manuscript</Text>
          <Text style={styles.sub}>Running {CHECKS.length} checks as a holistic manuscript analysis</Text>
        </Rise>

        <Rise delay={400} style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{CHECKS[phase].status}</Text>
            </View>
            <Text style={styles.pct}>{pct}%</Text>
          </View>

          <View style={styles.track}>
            <Animated.View
              style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
            >
              <LinearGradient colors={['#4A44E0', brand.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <Animated.View
                style={[
                  styles.shine,
                  { transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-120, 340] }) }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.rowSlot}>
            {prevPhase !== null && <CheckRow key={`out-${prevPhase}`} index={prevPhase} done leaving />}
            <CheckRow key={phase} index={phase} done={done} leaving={false} />
          </View>
        </Rise>

        <Rise delay={400} style={styles.footer}>
          <LineIcon name="clock" size={15} color={brand.muted} />
          <Text style={styles.footerText}>This can take a moment. You can leave this page; we will tell you when your report is ready.</Text>
        </Rise>

        <Rise delay={400}>
          <PressableScale onPress={onBackground} style={styles.backgroundBtn}>
            <Text style={styles.backgroundText}>Continue in background</Text>
          </PressableScale>
        </Rise>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  main: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  orb: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    top: 32,
    left: 32,
    right: 32,
    bottom: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(43,37,200,0.16)',
  },
  pulseSoft: {
    backgroundColor: 'rgba(43,37,200,0.12)',
  },
  orbitLayer: {
    position: 'absolute',
    top: 22,
    left: 22,
  },
  core: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  logo: {
    width: 86,
    height: 43,
  },
  center: {
    alignItems: 'center',
  },
  title: {
    marginTop: 28,
    fontFamily: fonts.sans[800],
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -1,
    color: brand.ink,
    textAlign: 'center',
  },
  sub: {
    marginTop: 12,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    lineHeight: 22,
    color: brand.sub,
    textAlign: 'center',
  },
  card: {
    marginTop: 28,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.line,
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#8F8BF0',
  },
  statusText: {
    fontFamily: fonts.mono[500],
    fontSize: 12,
    color: brand.primary,
  },
  pct: {
    fontFamily: fonts.mono[700],
    fontSize: 13,
    color: brand.primary,
  },
  track: {
    marginTop: 14,
    marginBottom: 22,
    marginHorizontal: 4,
    height: 10,
    borderRadius: 999,
    backgroundColor: brand.softLine,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
  },
  rowSlot: {
    height: 74,
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8F8BF0',
    backgroundColor: '#FFFFFF',
  },
  rowDone: {
    backgroundColor: '#F1FAF5',
    borderColor: '#CDEBD9',
  },
  rowTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  rowTitleDone: {
    color: '#1F7A4A',
  },
  rowSub: {
    marginTop: 3,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.hint,
  },
  tick: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#34C16F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 22,
    maxWidth: 330,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  footerText: {
    flexShrink: 1,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: brand.muted,
  },
  backgroundBtn: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFCDF3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: brand.primary,
  },
});
