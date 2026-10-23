import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts, gradients } from '../theme/colors';
import { Button } from '../components/Button';
import { setOnboardingCompleted } from '../services/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

interface PageData {
  id: string;
  eyebrow: string;
  accent: string;
  title: string;
  desc: string;
}

const PAGES: PageData[] = [
  {
    id: '1',
    eyebrow: 'Whole-manuscript review',
    accent: '#93C5FD',
    title: 'See whether every chapter tells one clear story.',
    desc: 'Resync reads your manuscript end-to-end and traces how your objectives, methods, findings, and conclusions connect.',
  },
  {
    id: '2',
    eyebrow: 'Actionable issue detection',
    accent: '#93C5FD',
    title: 'Find the gaps that are easy to miss.',
    desc: 'Get precise, color-coded flags for logic gaps, contradictions, and repeated ideas, with the chapters involved clearly identified.',
  },
  {
    id: '3',
    eyebrow: 'A clearer path to revision',
    accent: '#A7F3D0',
    title: 'Revise with evidence, not guesswork.',
    desc: 'Review suggested fixes, verify accessible citations, and use your coherence score to focus your next editing session.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (activeIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      await setOnboardingCompleted(true);
      navigation.replace('Auth', { mode: 'signup' });
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({
      index: PAGES.length - 1,
      animated: true,
    });
    setActiveIndex(PAGES.length - 1);
  };

  const handleSignIn = async () => {
    await setOnboardingCompleted(true);
    navigation.replace('Auth', { mode: 'login' });
  };

  const renderIllustration = (index: number) => {
    switch (index) {
      case 0:
        return (
          <View style={styles.illBox}>
            {/* Translucent card */}
            <View style={[styles.cardP1Back, { left: 20, top: 10 }]} />
            {/* White card */}
            <View style={[styles.cardP1White, { left: 35, top: 25 }]}>
              <View style={styles.p1TitleBar} />
              <View style={styles.p1Line} />
              <View style={styles.p1HighlightBox}>
                <View style={styles.p1HighlightLine} />
              </View>
            </View>
            {/* Circle with check */}
            <View style={styles.p1CheckCircle}>
              <MaterialIcons name="check" size={28} color={colors.white} />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.illBox}>
            {/* Dashed vertical line */}
            <View style={styles.p2DashedLine} />
            {/* Row 1 */}
            <View style={[styles.p2Row, { top: 35 }]}>
              <View style={[styles.p2Circle, { backgroundColor: '#2563EB' }]}>
                <View style={styles.p2WhiteDot} />
              </View>
              <View style={styles.p2Card}>
                <View style={[styles.p2Bar, { backgroundColor: '#2563EB' }]} />
                <View style={styles.p2Line} />
              </View>
            </View>
            {/* Row 2 */}
            <View style={[styles.p2Row, { top: 80 }]}>
              <View style={[styles.p2Circle, { backgroundColor: '#EF4444' }]}>
                <View style={styles.p2WhiteDot} />
              </View>
              <View style={styles.p2Card}>
                <View style={[styles.p2Bar, { backgroundColor: '#EF4444' }]} />
                <View style={styles.p2Line} />
              </View>
            </View>
            {/* Row 3 */}
            <View style={[styles.p2Row, { top: 125 }]}>
              <View style={[styles.p2Circle, { backgroundColor: '#F59E0B' }]}>
                <View style={styles.p2WhiteDot} />
              </View>
              <View style={styles.p2Card}>
                <View style={[styles.p2Bar, { backgroundColor: '#F59E0B' }]} />
                <View style={styles.p2Line} />
              </View>
            </View>
          </View>
        );
      case 2:
      default:
        const circumference = 2 * Math.PI * 30; // ~188.5
        const arcLength = (220 / 360) * circumference;
        return (
          <View style={styles.illBox}>
            <View style={styles.p3Card}>
              {/* Gauge */}
              <View style={styles.p3GaugeWrapper}>
                <Svg width={74} height={74} viewBox="0 0 74 74">
                  <Circle
                    cx={37}
                    cy={37}
                    r={30}
                    stroke="#DBEAFE"
                    strokeWidth={7}
                    fill="none"
                  />
                  <Circle
                    cx={37}
                    cy={37}
                    r={30}
                    stroke="#2563EB"
                    strokeWidth={7}
                    fill="none"
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeLinecap="round"
                    originX={37}
                    originY={37}
                    rotation="135"
                  />
                </Svg>
              </View>

              {/* Three pills */}
              <View style={[styles.p3Pill, { top: 35, backgroundColor: '#DCFCE7' }]}>
                <View style={[styles.p3PillDot, { backgroundColor: '#10B981' }]} />
              </View>
              <View style={[styles.p3Pill, { top: 57, backgroundColor: '#FEF3C7' }]}>
                <View style={[styles.p3PillDot, { backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={[styles.p3Pill, { top: 79, backgroundColor: '#E0E7FF' }]}>
                <View style={[styles.p3PillDot, { backgroundColor: '#2563EB' }]} />
              </View>

              {/* Progress bar */}
              <View style={styles.p3ProgressTrack}>
                <View style={styles.p3ProgressFill} />
              </View>
            </View>
          </View>
        );
    }
  };

  const currentPage = PAGES[activeIndex];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Section with landing gradient */}
      <View style={styles.topContainer}>
        <LinearGradient
          colors={gradients.landing.colors}
          start={gradients.landing.start}
          end={gradients.landing.end}
          style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}
        >
          {/* Decorative circles */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          {/* Top Header */}
          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoTile}>
                <Text style={styles.logoR}>R</Text>
              </View>
              <Text style={styles.logoBrand}>Resync</Text>
            </View>

            {activeIndex < 2 && (
              <Pressable onPress={handleSkip}>
                <Text style={styles.skipText}>Skip intro</Text>
              </Pressable>
            )}
          </View>

          {/* Illustration FlatList */}
          <FlatList
            ref={flatListRef}
            data={PAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(idx);
            }}
            renderItem={({ index }) => (
              <View style={styles.illSlide}>{renderIllustration(index)}</View>
            )}
            keyExtractor={(item) => item.id}
          />
        </LinearGradient>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.sheetTopContent}>
          {/* Eyebrow */}
          <View style={styles.eyebrowRow}>
            <View
              style={[styles.accentBar, { backgroundColor: currentPage.accent }]}
            />
            <Text style={styles.eyebrowText}>{currentPage.eyebrow}</Text>
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{currentPage.title}</Text>

          {/* Desc */}
          <Text style={styles.descText}>{currentPage.desc}</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* PageDots */}
          <View style={styles.dotsRow}>
            {PAGES.map((p, idx) => (
              <View
                key={p.id}
                style={[
                  styles.dot,
                  idx === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Action button */}
          <Button
            title={activeIndex === 2 ? 'Start checking for free' : 'Continue'}
            icon="arrow-forward"
            iconPosition="right"
            size="lg"
            onPress={handleNext}
            style={styles.actionBtn}
          />

          {/* Sign In link */}
          <Pressable onPress={handleSignIn} style={styles.signInRow}>
            <Text style={styles.signInMuted}>
              Already have an account?{' '}
              <Text style={styles.signInHighlight}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.landingBg,
  },
  topContainer: {
    flex: 1.05,
    position: 'relative',
  },
  decoCircle1: {
    position: 'absolute',
    right: -165,
    top: -155,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decoCircle2: {
    position: 'absolute',
    left: -115,
    bottom: -135,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(96,165,250,0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoR: {
    fontFamily: fonts.display[800],
    fontSize: 20,
    color: colors.primary,
    includeFontPadding: false,
  },
  logoBrand: {
    fontFamily: fonts.display[800],
    fontSize: 16,
    color: colors.white,
  },
  skipText: {
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  illSlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illBox: {
    width: 240,
    height: 160,
    position: 'relative',
  },
  // Page 1
  cardP1Back: {
    position: 'absolute',
    width: 200,
    height: 140,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cardP1White: {
    position: 'absolute',
    width: 170,
    height: 110,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 14,
  },
  p1TitleBar: {
    width: 60,
    height: 7,
    backgroundColor: colors.navy,
    borderRadius: 3,
    marginBottom: 10,
  },
  p1Line: {
    width: 142,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 8,
  },
  p1HighlightBox: {
    width: 142,
    height: 16,
    borderRadius: 5,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  p1HighlightLine: {
    width: 122,
    height: 4,
    backgroundColor: 'rgba(10,42,184,0.6)',
    borderRadius: 2,
  },
  p1CheckCircle: {
    position: 'absolute',
    left: 191,
    top: 116,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  // Page 2
  p2DashedLine: {
    position: 'absolute',
    left: 34,
    top: 20,
    width: 2,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  p2Row: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  p2Circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  p2WhiteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  p2Card: {
    width: 165,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  p2Bar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  p2Line: {
    width: 90,
    height: 3,
    backgroundColor: '#CBD5E1',
    borderRadius: 1.5,
  },
  // Page 3
  p3Card: {
    width: 210,
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.white,
    position: 'relative',
    left: 15,
    top: 10,
  },
  p3GaugeWrapper: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  p3Pill: {
    position: 'absolute',
    left: 105,
    width: 90,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  p3PillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  p3ProgressTrack: {
    position: 'absolute',
    bottom: 16,
    left: 15,
    width: 180,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
  },
  p3ProgressFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 4.5,
  },
  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.landingBg,
    paddingTop: 26,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  sheetTopContent: {
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
  },
  eyebrowText: {
    fontFamily: fonts.sans[800],
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.action,
  },
  titleText: {
    fontFamily: fonts.display[700],
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
  },
  descText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  bottomControls: {
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.action,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  actionBtn: {
    backgroundColor: colors.action,
    borderRadius: 16,
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  signInMuted: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: colors.muted,
  },
  signInHighlight: {
    fontFamily: fonts.sans[700],
    color: colors.action,
  },
});
