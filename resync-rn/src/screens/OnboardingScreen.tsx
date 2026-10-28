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
import * as SvgModule from 'react-native-svg';
const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Circle = SvgModule.Circle;
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts, gradients } from '../theme/colors';
import { Button } from '../components/Button';
import { setOnboardingCompleted } from '../services/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResyncMonogram } from '../components/ResyncMonogram';

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
    eyebrow: 'WHOLE-MANUSCRIPT REVIEW',
    accent: '#2563EB',
    title: 'See whether every chapter tells one clear story.',
    desc: 'Resync reads your manuscript end-to-end and traces how your objectives, methods, findings, and conclusions connect.',
  },
  {
    id: '2',
    eyebrow: 'ACTIONABLE ISSUE DETECTION',
    accent: '#2563EB',
    title: 'Find the gaps that are easy to miss.',
    desc: 'Weak links between consecutive sections are highlighted in your manuscript, with recommended revisions for each one.',
  },
  {
    id: '3',
    eyebrow: 'A CLEARER PATH TO REVISION',
    accent: '#10B981',
    title: 'Revise with evidence, not guesswork.',
    desc: 'Review recommended revisions, see which citations are public or private, and use your coherence score to focus your next editing session.',
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
            {/* Outer frosted container */}
            <View style={styles.cardP1Back} />
            {/* White document card */}
            <View style={styles.cardP1White}>
              <View style={styles.p1TitleBar} />
              <View style={styles.p1Line} />
              <View style={styles.p1HighlightBox}>
                <View style={styles.p1HighlightLine} />
              </View>
            </View>
            {/* Blue checkmark badge */}
            <View style={styles.p1CheckCircle}>
              <MaterialIcons name="check" size={24} color={colors.white} />
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
                <ResyncMonogram width={18} height={22} color="#FFFFFF" />
              </View>
              <Text style={styles.logoBrand}>Resync</Text>
            </View>

            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Skip intro</Text>
            </Pressable>
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
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBrand: {
    fontFamily: fonts.sans[800],
    fontSize: 18,
    color: colors.white,
    letterSpacing: -0.3,
  },
  skipText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: colors.white,
  },
  illSlide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illBox: {
    width: 250,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Page 1
  cardP1Back: {
    position: 'absolute',
    width: 236,
    height: 146,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  cardP1White: {
    position: 'absolute',
    width: 198,
    height: 114,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  p1TitleBar: {
    width: 68,
    height: 8,
    backgroundColor: '#2E3A59',
    borderRadius: 4,
    marginBottom: 12,
  },
  p1Line: {
    width: 166,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 10,
  },
  p1HighlightBox: {
    width: 166,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#C7D2FE',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  p1HighlightLine: {
    width: 146,
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  p1CheckCircle: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
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
    backgroundColor: colors.white,
    paddingTop: 26,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  sheetTopContent: {
    gap: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 20,
    height: 2,
    backgroundColor: '#2563EB',
    borderRadius: 1,
  },
  eyebrowText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#2563EB',
  },
  titleText: {
    fontFamily: fonts.sans[800],
    fontSize: 24,
    lineHeight: 30,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  descText: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
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
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#2563EB',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 50,
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  signInMuted: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: '#64748B',
  },
  signInHighlight: {
    fontFamily: fonts.sans[700],
    color: '#2563EB',
  },
});
