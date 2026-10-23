import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/colors';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.white,
          borderColor: selected ? colors.primary : colors.line,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
    >
      <Text
        style={[
          styles.text,
          {
            color: selected ? colors.white : colors.body,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
  },
});
