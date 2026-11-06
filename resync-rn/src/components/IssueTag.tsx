import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts } from '../theme/colors';

/** One shared 6s clock per screen; each tag samples it at a phase offset so they bob out of step. */
export const useBobClock = () => {
  const clock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock]);
  return clock;
};

const BOB_STEPS = 12;
const bobRange = (phase: number) => {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= BOB_STEPS; i++) {
    const t = i / BOB_STEPS;
    inputRange.push(t);
    outputRange.push(-3.5 * (1 - Math.cos(2 * Math.PI * (t + phase))));
  }
  return { inputRange, outputRange };
};

interface Props {
  clock: Animated.Value;
  phase: number;
  dot: string;
  label: string;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

/** Floating white pill flagging an issue type (the mockups' .tag.bobb). */
export const IssueTag: React.FC<Props> = ({ clock, phase, dot, label, scale = 1, style }) => (
  <Animated.View
    style={[
      styles.tag,
      style,
      { transform: [{ translateY: clock.interpolate(bobRange(phase)) }, { scale }] },
    ]}
  >
    <View style={[styles.dot, { backgroundColor: dot }]} />
    <Text style={styles.text}>{label}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 13,
    elevation: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: '#0B0A2E',
  },
});
