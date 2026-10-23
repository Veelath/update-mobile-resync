import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, scoreColor } from '../theme/colors';

export interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 76,
  strokeWidth = 7,
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (circumference * progress) / 100;
  const strokeColor = scoreColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          originX={center}
          originY={center}
          rotation="-90"
        />
      </Svg>
      <View style={styles.textOverlay}>
        <Text
          style={[
            styles.scoreText,
            { fontSize: size * 0.32, color: colors.ink },
          ]}
        >
          {score}
        </Text>
        <Text style={styles.hundredText}>/100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: fonts.display[700],
    includeFontPadding: false,
    lineHeight: 25,
  },
  hundredText: {
    fontFamily: fonts.sans[500],
    fontSize: 10,
    color: colors.hint,
    lineHeight: 12,
  },
});
