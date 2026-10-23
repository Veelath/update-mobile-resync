import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';

export type TxtVariant =
  | 'eyebrowMono'
  | 'eyebrow'
  | 'h2'
  | 'stepTitle'
  | 'body'
  | 'small'
  | 'caption'
  | 'meta';

export interface TxtProps extends TextProps {
  variant?: TxtVariant;
  color?: string;
  weight?: 400 | 500 | 600 | 700 | 800;
  children?: React.ReactNode;
}

export const Txt: React.FC<TxtProps> = ({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}) => {
  const baseStyle = typography[variant] || typography.body;
  const customColor = color ? { color } : null;

  return (
    <Text style={[baseStyle, customColor, style]} {...rest}>
      {children}
    </Text>
  );
};
