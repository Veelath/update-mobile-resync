import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 16,
  radius = 16,
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          borderRadius: radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
