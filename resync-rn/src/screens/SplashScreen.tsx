import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { getSession } from '../services/session';
import { ResyncMonogram } from '../components/ResyncMonogram';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Symbol animations
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const symbolScale = useRef(new Animated.Value(0.88)).current;
  const symbolTranslateX = useRef(new Animated.Value(54)).current; // Starts offset so it's perfectly centered

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(-24)).current; // Follows the symbol from the left

  useEffect(() => {
    // Stage 1: Symbol appears centered
    Animated.parallel([
      Animated.timing(symbolOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(symbolScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Symbol slides to the left, and the text follows into place
    const slideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(symbolTranslateX, {
          toValue: 0,
          tension: 35,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(textTranslateX, {
              toValue: 0,
              tension: 35,
              friction: 7,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }, 550);

    // Stage 3: Navigate after full logo reveal
    const navTimer = setTimeout(async () => {
      const session = await getSession();
      if (!session.hasCompletedOnboarding) {
        navigation.replace('Onboarding');
      } else if (!session.isLoggedIn) {
        navigation.replace('Auth', { mode: 'login' });
      } else {
        navigation.replace('Main');
      }
    }, 3500);

    return () => {
      clearTimeout(slideTimer);
      clearTimeout(navTimer);
    };
  }, [navigation, symbolOpacity, symbolScale, symbolTranslateX, textOpacity, textTranslateX]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.brandLockup}>
        {/* Symbol: starts centered, then slides left */}
        <Animated.View
          style={{
            opacity: symbolOpacity,
            transform: [
              { translateX: symbolTranslateX },
              { scale: symbolScale },
            ],
          }}
        >
          <ResyncMonogram width={68} height={96} color="#0024D9" />
        </Animated.View>

        {/* Text: stacked "Re" and "Sync", follows the symbol */}
        <Animated.View
          style={[
            styles.textStack,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Text style={styles.reText}>Re</Text>
          <Text style={styles.syncText}>Sync</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  textStack: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  reText: {
    fontFamily: fonts.sans[500],
    fontSize: 46,
    color: '#0024D9',
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  syncText: {
    fontFamily: fonts.sans[800],
    fontSize: 46,
    color: '#0024D9',
    lineHeight: 46,
    letterSpacing: -0.6,
  },
});
