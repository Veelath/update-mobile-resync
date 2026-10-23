import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';

export interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  size?: number;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  size = 20,
  style,
}) => {
  return (
    <Pressable
      onPress={() => onToggle(!checked)}
      style={({ pressed }) => [
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: 6,
          borderColor: checked ? colors.primary : colors.borderStrong,
          backgroundColor: checked ? colors.primary : colors.white,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
    >
      {checked && <MaterialIcons name="check" size={size - 6} color={colors.white} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
