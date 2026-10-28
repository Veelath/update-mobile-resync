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
import {supabase} from '../services/supabase';
import { ResyncMonogram } from '../components/ResyncMonogram';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Phase 1: Smooth entrance (fade in + gentle scale up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Navigate after 2.4s
    const timer = setTimeout(async () => {
      const session = await getSession();
      const {data: {session: authSession}} = await supabase.auth.getSession();
      if (!session.hasCompletedOnboarding) {
        navigation.replace('Onboarding');
      } else if (!authSession) {
        navigation.replace('Auth', { mode: 'login' });
      } else {
        navigation.replace('Main');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <Animated.View
        style={[
          styles.brandLockup,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Stylized S-monogram */}
        <ResyncMonogram width={68} height={84} color="#0A2AB8" />

        {/* Re / Sync Stacked Typography */}
        <View style={styles.textStack}>
          <Text style={styles.reText}>Re</Text>
          <Text style={styles.syncText}>Sync</Text>
        </View>
      </Animated.View>
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
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  textStack: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  reText: {
    fontFamily: fonts.sans[800],
    fontSize: 44,
    color: '#0A2AB8',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  syncText: {
    fontFamily: fonts.sans[800],
    fontSize: 44,
    color: '#0A2AB8',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
});
