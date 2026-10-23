import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/colors';

export interface EyebrowProps {
  text: string;
  accentBarColor?: string;
  textColor?: string;
  variant?: 'sans' | 'mono';
  style?: ViewStyle;
}

export const Eyebrow: React.FC<EyebrowProps> = ({
  text,
  accentBarColor,
  textColor,
  variant = 'sans',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {accentBarColor && (
        <View style={[styles.bar, { backgroundColor: accentBarColor }]} />
      )}
      <Text
        style={[
          styles.text,
          {
            fontFamily: variant === 'mono' ? fonts.mono[500] : fonts.sans[700],
            color: textColor || (variant === 'mono' ? colors.primary : colors.muted),
            letterSpacing: variant === 'mono' ? 1.2 : 1.1,
            fontSize: variant === 'mono' ? 11 : 10.5,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 18,
    height: 2.5,
    borderRadius: 1.5,
  },
  text: {
    textTransform: 'uppercase',
  },
});
