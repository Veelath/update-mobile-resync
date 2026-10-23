import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';

export interface IconButtonProps {
  icon: string;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 38,
  iconSize = 20,
  color = colors.ink,
  backgroundColor = 'transparent',
  borderColor,
  borderWidth = 0,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor: borderColor || 'transparent',
          borderWidth: borderColor ? borderWidth || 1 : 0,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
    >
      <MaterialIcons name={icon} size={iconSize} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
