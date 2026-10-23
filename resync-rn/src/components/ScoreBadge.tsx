import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, scoreColor } from '../theme/colors';

export interface ScoreBadgeProps {
  score: number;
  size?: number;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 44 }) => {
  const getBackgroundColor = (s: number) => {
    if (s >= 80) return colors.successTint;
    if (s >= 60) return colors.warningTint;
    return colors.errorTint;
  };

  const textColor = scoreColor(score);
  const bgColor = getBackgroundColor(score);

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.scoreText, { color: textColor }]}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: fonts.mono[700],
    fontSize: 15,
  },
});
