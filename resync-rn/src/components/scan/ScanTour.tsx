import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable, useWindowDimensions } from 'react-native';
import * as SvgModule from 'react-native-svg';
import { fonts } from '../../theme/colors';
import { brand } from '../../theme/brand';
import { LineIcon } from '../LineIcon';
import { PressableScale } from '../PressableScale';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, Mask, Rect } = SvgModule;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type TourRect = { x: number; y: number; width: number; height: number };

export const TOUR_STEPS = [
  {
    title: 'Three quick steps',
    body: 'Pick your chapter headings (optional), upload your manuscript, then confirm it is the right document. Resync runs the scan after that.',
  },
  {
    title: 'Optional chapter template',
    body: 'Have a school template? Attach it so Resync uses your exact headings. Skip it and Resync detects the sections for you.',
  },
  {
    title: 'Add your manuscript',
    body: 'Drop a Word file (.doc/.docx, up to 25 MB) or paste a Google Docs link set to “Anyone with the link can view”.',
  },
  {
    title: 'Confirm your document',
    body: 'Check the file name, word count and preview. Wrong file? Choose a different one before any credit is used.',
  },
  {
    title: 'Run the scan',
    body: 'The scan and its preview are free. When it finishes, your report opens and one credit unlocks every finding.',
  },
];

const PAD = 6; // spotlight breathing room around the target
const TIP_HEIGHT = 250;
const GAP = 14;
const MOVE = { duration: 650, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false };

interface Props {
  step: number; // 0-based
  rect: TourRect | null;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const Dot: React.FC<{ active: boolean }> = ({ active }) => {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: active ? 1 : 0, duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [active, v]);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: v.interpolate({ inputRange: [0, 1], outputRange: [8, 28] }),
          backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['#D5D3FA', brand.primary] }),
        },
      ]}
    />
  );
};

/**
 * Coach-mark overlay for the scan flow: dims the screen except a rounded
 * spotlight that glides between targets, with a tip card above or below it.
 */
export const ScanTour: React.FC<Props> = ({ step, rect, onNext, onBack, onClose }) => {
  const { width: W, height: H } = useWindowDimensions();
  const overlay = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(10)).current;
  const y = useRef(new Animated.Value(H / 3)).current;
  const w = useRef(new Animated.Value(W - 20)).current;
  const h = useRef(new Animated.Value(120)).current;
  const tipTop = useRef(new Animated.Value(H / 2)).current;
  const content = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    Animated.timing(overlay, { toValue: 1, duration: 450, useNativeDriver: false }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [overlay, pulse]);

  useEffect(() => {
    if (!rect) return;
    const sx = rect.x - PAD;
    const sy = rect.y - PAD;
    const sw = rect.width + PAD * 2;
    const sh = rect.height + PAD * 2;
    const below = sy + sh + GAP;
    const nextTip = below + TIP_HEIGHT <= H - 16 ? below : Math.max(16, sy - GAP - TIP_HEIGHT);

    const targets: [Animated.Value, number][] = [
      [x, sx],
      [y, sy],
      [w, sw],
      [h, sh],
      [tipTop, nextTip],
    ];
    if (first.current) {
      targets.forEach(([v, to]) => v.setValue(to));
      first.current = false;
    } else {
      Animated.parallel(targets.map(([v, to]) => Animated.timing(v, { ...MOVE, toValue: to }))).start();
    }

    // Swap the tip text: fade out quickly, then ease the new step in
    content.setValue(0);
    Animated.timing(content, {
      toValue: 1,
      duration: 380,
      delay: 200,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [rect, x, y, w, h, tipTop, content, H]);

  const close = () =>
    Animated.timing(overlay, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => onClose());

  const last = step === TOUR_STEPS.length - 1;
  const s = TOUR_STEPS[step];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: overlay }]}>
      {/* Swallow taps on the dimmed area */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} />

      <Svg style={StyleSheet.absoluteFill} width={W} height={H} pointerEvents="none">
        <Defs>
          <Mask id="tourHole">
            <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
            <AnimatedRect x={x} y={y} width={w} height={h} rx={20} ry={20} fill="#000000" />
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="rgba(28,26,76,0.62)" mask="url(#tourHole)" />
      </Svg>

      {/* White + brand rings around the spotlight, the outer one breathing */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ringOuter, { left: x, top: y, width: w, height: h, borderWidth: pulse.interpolate({ inputRange: [0, 1], outputRange: [6, 10] }), margin: pulse.interpolate({ inputRange: [0, 1], outputRange: [-6, -10] }), opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }]}
      />
      <Animated.View pointerEvents="none" style={[styles.ringInner, { left: x, top: y, width: w, height: h }]} />

      <Animated.View style={[styles.tip, { top: tipTop }]}>
        <Animated.View
          style={[
            styles.tipContent,
            { opacity: content, transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
          ]}
        >
          <Text style={styles.kicker}>
            STEP {step + 1} OF {TOUR_STEPS.length}
          </Text>
          <Text style={styles.tipTitle}>{s.title}</Text>
          <Text style={styles.tipBody}>{s.body}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {TOUR_STEPS.map((_, i) => (
            <Dot key={i} active={i === step} />
          ))}
        </View>

        <View style={styles.actions}>
          {last ? (
            <Text style={styles.replay}>Replay anytime.</Text>
          ) : (
            <Pressable onPress={close} hitSlop={8} style={styles.skip}>
              <Text style={styles.skipText}>Skip tour</Text>
            </Pressable>
          )}
          {step > 0 && (
            <PressableScale onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>Back</Text>
            </PressableScale>
          )}
          <PressableScale onPress={last ? close : onNext} style={styles.nextBtn}>
            <Text style={styles.nextText}>{last ? 'Got it' : 'Next'}</Text>
            <LineIcon name="arrowRight" size={16} color="#FFFFFF" />
          </PressableScale>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    zIndex: 20,
    elevation: 20,
  },
  ringOuter: {
    position: 'absolute',
    borderRadius: 26,
    borderColor: brand.primary,
  },
  ringInner: {
    position: 'absolute',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    margin: -3,
  },
  tip: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TIP_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 24,
  },
  tipContent: {
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  kicker: {
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    letterSpacing: 1.68,
    color: brand.primary,
  },
  tipTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontFamily: fonts.sans[800],
    fontSize: 21,
    letterSpacing: -0.2,
    color: brand.ink,
  },
  tipBody: {
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 22.5,
    color: brand.label,
  },
  dots: {
    position: 'absolute',
    left: 18,
    bottom: 76,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skip: {
    marginRight: 'auto',
    paddingHorizontal: 6,
  },
  skipText: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.sub,
  },
  replay: {
    marginRight: 'auto',
    fontFamily: fonts.sans[600],
    fontSize: 13.5,
    color: brand.hint,
  },
  backBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D9D8F5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: brand.ink,
  },
  nextBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 13,
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 11,
    elevation: 6,
  },
  nextText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
