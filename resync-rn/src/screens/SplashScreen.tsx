import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StatusBar, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getSession } from '../services/session';
import { BrandBackdrop } from '../components/BrandBackdrop';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

// Timeline follows the A1 mockup keyframes, compressed to a 5s run (1% = 50ms)
const T = (pct: number) => pct * 50;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const LOGO_BLUE = '#0010AD';
const MARK_OFFSET = 62;
const WORDMARK_WIDTH = 125;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.82)).current;
  const markX = useRef(new Animated.Value(MARK_OFFSET)).current;

  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordX = useRef(new Animated.Value(-26)).current;
  const wordReveal = useRef(new Animated.Value(0)).current; // JS-driven clip width

  useEffect(() => {
    const timing = (v: Animated.Value, toValue: number, from: number, to: number, easing = easeOut, native = true) =>
      Animated.timing(v, { toValue, delay: T(from), duration: T(to - from), easing, useNativeDriver: native });

    // Mark: pops in centered, holds, then slides left to make room for the wordmark
    const anim = Animated.parallel([
      timing(markOpacity, 1, 0, 15),
      timing(markScale, 1, 0, 15),
      timing(markX, 0, 30, 52, easeInOut),
      // Wordmark: wipes in from the left while drifting into place
      timing(wordOpacity, 1, 32, 60),
      timing(wordX, 0, 32, 60),
    ]);
    const reveal = timing(wordReveal, WORDMARK_WIDTH, 32, 60, easeOut, false);
    anim.start();
    reveal.start();

    const navTimer = setTimeout(async () => {
      const session = await getSession();
      if (!session.hasCompletedOnboarding) {
        navigation.replace('Welcome');
      } else if (!session.isLoggedIn) {
        navigation.replace('Auth', { mode: 'login' });
      } else {
        navigation.replace('Main');
      }
    }, T(90));

    return () => {
      anim.stop();
      reveal.stop();
      clearTimeout(navTimer);
    };
  }, [navigation, markOpacity, markScale, markX, wordOpacity, wordX, wordReveal]);

  return (
    <BrandBackdrop
      light
      style={styles.container}
      glows={[
        { size: 300, color: '#C9CCFF', opacity: 0.45, position: { left: -90, top: -60 } },
        { size: 260, color: '#D9DBFF', opacity: 0.6, position: { right: -80, bottom: 90 }, delay: 5000 },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.lockup}>
          <Animated.View
            style={{
              opacity: markOpacity,
              transform: [{ translateX: markX }, { scale: markScale }],
            }}
          >
            <Image
              source={require('../assets/images/resync_symbol_white.png')}
              style={styles.mark}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[styles.wordmarkSlot, { opacity: wordOpacity, transform: [{ translateX: wordX }] }]}
          >
            <Animated.View style={[styles.wordmarkClip, { width: wordReveal }]}>
              <Image
                source={require('../assets/images/resync_text_white.png')}
                style={styles.wordmark}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </BrandBackdrop>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: -20,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    height: 96,
    width: 72,
    tintColor: LOGO_BLUE,
  },
  wordmarkSlot: {
    width: WORDMARK_WIDTH,
    height: 96,
  },
  wordmarkClip: {
    height: 96,
    overflow: 'hidden',
  },
  wordmark: {
    height: 96,
    width: 111,
    marginLeft: 14,
    tintColor: LOGO_BLUE,
  },
});
