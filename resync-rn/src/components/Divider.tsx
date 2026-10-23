import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export interface DividerProps {
  color?: string;
  marginVertical?: number;
  marginTop?: number;
  marginBottom?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  color = colors.line,
  marginVertical,
  marginTop,
  marginBottom,
  style,
}) => {
  return (
    <View
      style={[
        styles.line,
        {
          backgroundColor: color,
          marginVertical,
          marginTop,
          marginBottom,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  line: {
    height: 1,
    width: '100%',
  },
});
