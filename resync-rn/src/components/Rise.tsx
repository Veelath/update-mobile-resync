import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

const riseEase = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Staggered fade-up entrance (the mockup's .rs1–.rs4). */
export const Rise: React.FC<{ delay: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({ delay, style, children }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 700, delay, easing: riseEase, useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
