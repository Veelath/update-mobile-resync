import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far the button sinks while held (1 = no change). */
  pressedScale?: number;
};

/**
 * Pressable that eases down while held and springs back on release,
 * instead of snapping between two opacity states.
 */
export const PressableScale: React.FC<Props> = ({ style, pressedScale = 0.97, onPressIn, onPressOut, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, speed: 40, bounciness: toValue === 1 ? 6 : 0, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(e) => {
        animateTo(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        onPressOut?.(e);
      }}
    />
  );
};
