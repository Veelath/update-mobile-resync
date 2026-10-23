import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { getSession } from '../services/session';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const markScale = useRef(new Animated.Value(0.72)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const markTranslateX = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateX = useRef(new Animated.Value(-60)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Mark pops in (scale 0.72 -> 1, opacity 0 -> 1, 600ms, slight spring overshoot)
    Animated.parallel([
      Animated.spring(markScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(markOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: At 900ms, mark slides from center to left, wordmark slides from -60 to 0 and fades in (850ms)
    const timeoutSlide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(markTranslateX, {
          toValue: -75,
          duration: 850,
          easing: Easing.bezier(0.18, 1, 0.22, 1),
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslateX, {
          toValue: 20,
          duration: 850,
          easing: Easing.bezier(0.18, 1, 0.22, 1),
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 850,
          easing: Easing.bezier(0.18, 1, 0.22, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }, 900);

    // Phase 3: At 2600ms navigate
    const timeoutNav = setTimeout(async () => {
      const session = await getSession();
      if (!session.hasCompletedOnboarding) {
        navigation.replace('Onboarding');
      } else if (!session.isLoggedIn) {
        navigation.replace('Auth', { mode: 'login' });
      } else {
        navigation.replace('Main');
      }
    }, 2600);

    return () => {
      clearTimeout(timeoutSlide);
      clearTimeout(timeoutNav);
    };
  }, [
    navigation,
    markScale,
    markOpacity,
    markTranslateX,
    wordmarkTranslateX,
    wordmarkOpacity,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.contentBox}>
        {/* Animated Mark */}
        <Animated.View
          style={[
            styles.mark,
            {
              opacity: markOpacity,
              transform: [
                { translateX: markTranslateX },
                { scale: markScale },
              ],
            },
          ]}
        >
          <Text style={styles.markText}>R</Text>
        </Animated.View>

        {/* Animated Wordmark */}
        <Animated.View
          style={[
            styles.wordmarkWrapper,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateX: wordmarkTranslateX }],
            },
          ]}
        >
          <Text style={styles.wordmark}>Resync</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBox: {
    width: 260,
    height: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0A2AB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  markText: {
    fontFamily: fonts.display[800],
    fontSize: 76,
    color: colors.white,
    includeFontPadding: false,
    lineHeight: 88,
  },
  wordmarkWrapper: {
    position: 'absolute',
    left: '50%',
  },
  wordmark: {
    fontFamily: fonts.display[800],
    fontSize: 52,
    color: colors.ink,
    letterSpacing: -1,
  },
});
