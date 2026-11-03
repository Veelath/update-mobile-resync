import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as SvgModule from 'react-native-svg';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Defs, Pattern, Circle, Rect, RadialGradient, Stop } = SvgModule;

const DOT_GAP = 28;

export interface Glow {
  size: number;
  color: string;
  opacity: number;
  position: ViewStyle;
  delay?: number;
}

interface Props {
  angle?: number; // 165 on splash, 170 on welcome hero
  glows?: Glow[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Deep-blue brand backdrop: diagonal gradient, slowly drifting dot grid,
 * and soft blurred glows (approximated with radial gradients).
 */
export const BrandBackdrop: React.FC<Props> = ({ angle = 165, glows = [], style, children }) => {
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(dots, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);

  // CSS angle → start/end points (0deg = bottom-to-top)
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;

  const dotShift = dots.interpolate({ inputRange: [0, 1], outputRange: [0, DOT_GAP] });

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['#06115F', '#1229B8', '#2A52F0']}
        locations={[0, angle >= 170 ? 0.55 : 0.52, 1]}
        start={{ x: 0.5 - dx, y: 0.5 - dy }}
        end={{ x: 0.5 + dx, y: 0.5 + dy }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.dotLayer,
          { transform: [{ translateX: dotShift }, { translateY: dotShift }] },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="dots" width={DOT_GAP} height={DOT_GAP} patternUnits="userSpaceOnUse">
              <Circle cx={DOT_GAP / 2} cy={DOT_GAP / 2} r={1.2} fill="#FFFFFF" fillOpacity={0.14} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#dots)" />
        </Svg>
      </Animated.View>

      {glows.map((g, i) => (
        <GlowOrb key={i} {...g} id={`glow${i}`} />
      ))}

      {children}
    </View>
  );
};

const GlowOrb: React.FC<Glow & { id: string }> = ({ size, color, opacity, position, delay = 0, id }) => {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [drift, delay]);

  // Pad the orb so the radial falloff stands in for the CSS blur(40px)
  const full = size + 80;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: full, height: full, margin: -40, opacity },
        position,
        {
          transform: [
            { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -0.06 * size] }) },
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 0.07 * size] }) },
            { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
          ],
        },
      ]}
    >
      <Svg width={full} height={full}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.85} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={full / 2} cy={full / 2} r={full / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  dotLayer: {
    position: 'absolute',
    top: -DOT_GAP,
    left: -DOT_GAP,
    right: 0,
    bottom: 0,
  },
});
