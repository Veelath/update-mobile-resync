import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../../theme/colors';
import { brand } from '../../theme/brand';
import { PressableScale } from '../PressableScale';
import { useActiveScan } from '../../services/activeScan';
import { CHECKS, FILL_MS, MAX_PCT, QUARTER } from './AnalyzingView';

const Spinner: React.FC<{ size: number; track: string; color: string }> = ({ size, track, color }) => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  return (
    <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10.5} stroke={track} strokeWidth={3} />
        <Circle cx={12} cy={12} r={10.5} stroke={color} strokeWidth={3} strokeDasharray="16 50" />
      </Svg>
    </Animated.View>
  );
};

/** Floating "View progress" button and popover for a scan sent to the background. */
export const BackgroundScanProgress: React.FC = () => {
  const scan = useActiveScan();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!scan) setOpen(false);
  }, [scan]);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  if (!scan) return null;

  const elapsed = Math.max(0, now - scan.runningSince);
  const pct = Math.floor(Math.min(elapsed / FILL_MS, 1) * MAX_PCT);
  const check = CHECKS[Math.min(CHECKS.length - 1, Math.floor(pct / QUARTER))];

  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={styles.button}>
        <Spinner size={16} track="rgba(255,255,255,0.35)" color="#FFFFFF" />
        <Text style={styles.buttonText}>View progress</Text>
      </PressableScale>

      {open && (
        <>
          <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <View style={styles.popover}>
            <View style={styles.head}>
              <Spinner size={24} track="#E4E2FF" color={brand.primary} />
              <View style={styles.flex1}>
                <Text style={styles.title}>Analyzing your manuscript</Text>
                <Text style={styles.docName} numberOfLines={1}>
                  {scan.title}
                </Text>
              </View>
              <Text style={styles.pct}>{pct}%</Text>
            </View>

            <View style={styles.track}>
              <LinearGradient colors={['#4A44E0', brand.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
            </View>

            <View style={styles.check}>
              <Text style={styles.checkTitle}>{check.title}</Text>
              <Text style={styles.checkSub}>{check.sub}</Text>
            </View>

            <Text style={styles.note}>You can keep using the app. We will notify you when your report is ready.</Text>

            <PressableScale onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
            </PressableScale>
          </View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    zIndex: 6,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: 'rgba(11,10,46,0.28)',
  },
  popover: {
    position: 'absolute',
    right: 16,
    bottom: 78,
    zIndex: 50,
    width: 320,
    maxWidth: '92%',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E5F7',
    backgroundColor: '#FFFFFF',
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: brand.ink,
  },
  docName: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#7D7B9E',
  },
  pct: {
    fontFamily: fonts.mono[700],
    fontSize: 14,
    color: brand.primary,
  },
  track: {
    height: 9,
    borderRadius: 99,
    backgroundColor: '#EEEDFB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  check: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#8F8BF0',
    borderRadius: 12,
  },
  checkTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 13.5,
    color: brand.ink,
  },
  checkSub: {
    marginTop: 3,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 17,
    color: '#7D7B9E',
  },
  note: {
    marginTop: 12,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 18,
    color: '#6B6890',
  },
  close: {
    height: 42,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DAD8F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: fonts.sans[700],
    fontSize: 13.5,
    color: brand.ink,
  },
});
