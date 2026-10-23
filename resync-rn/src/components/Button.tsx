import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, fonts } from '../theme/colors';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'white';

export interface ButtonProps {
  title?: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg'; // sm=46, lg=52
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  rightBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'sm',
  icon,
  iconPosition = 'left',
  iconSize = 18,
  iconColor,
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  rightBadge,
  children,
}) => {
  const height = size === 'lg' ? 52 : 46;
  const radius = size === 'lg' ? 14 : 12;

  const getContainerStyle = (): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor: colors.track,
        borderColor: 'transparent',
      };
    }

    switch (variant) {
      case 'dark':
        return {
          backgroundColor: colors.ink,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
        };
      case 'white':
        return {
          backgroundColor: colors.white,
          borderColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: 'transparent',
          elevation: 6,
          shadowColor: '#0A2AB8',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.hint;
    switch (variant) {
      case 'dark':
      case 'primary':
        return colors.white;
      case 'outline':
      case 'white':
        return colors.ink;
      default:
        return colors.white;
    }
  };

  const textColor = getTextColor();
  const fontFam = variant === 'outline' ? fonts.sans[600] : fonts.sans[700];
  const finalIconColor = iconColor || textColor;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          borderRadius: radius,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        getContainerStyle(),
        rightBadge ? styles.spaceContent : styles.centerContent,
        style,
      ]}
      android_ripple={!disabled ? { color: 'rgba(0,0,0,0.08)' } : undefined}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          <View style={styles.innerRow}>
            {icon && iconPosition === 'left' && (
              <MaterialIcons
                name={icon}
                size={iconSize}
                color={finalIconColor}
                style={styles.leftIcon}
              />
            )}
            {title ? (
              <Text
                style={[
                  styles.title,
                  { color: textColor, fontFamily: fontFam },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            ) : null}
            {children}
            {icon && iconPosition === 'right' && (
              <MaterialIcons
                name={icon}
                size={iconSize}
                color={finalIconColor}
                style={styles.rightIcon}
              />
            )}
          </View>
          {rightBadge ? <View>{rightBadge}</View> : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
  },
  spaceContent: {
    justifyContent: 'space-between',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  title: {
    fontSize: 14.5,
  },
});
