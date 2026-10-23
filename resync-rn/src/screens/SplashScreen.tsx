import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getSession } from '../services/session';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Symbol animations
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const symbolScale = useRef(new Animated.Value(0.88)).current;
  // Starts offset so the symbol is situated directly at the horizontal center of the screen
  const symbolTranslateX = useRef(new Animated.Value(61)).current;

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
        {/* Symbol: exact user photo, starts centered, then slides left */}
        <Animated.View
          style={{
            opacity: symbolOpacity,
            transform: [
              { translateX: symbolTranslateX },
              { scale: symbolScale },
            ],
          }}
        >
          <Image
            source={require('../assets/images/resync_symbol.png')}
            style={styles.symbolImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text: exact user photo, follows the symbol into place */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/resync_text.png')}
            style={styles.textImage}
            resizeMode="contain"
          />
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
    gap: 14,
  },
  symbolImage: {
    width: 74,
    height: 96,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textImage: {
    width: 108,
    height: 72,
  },
});
