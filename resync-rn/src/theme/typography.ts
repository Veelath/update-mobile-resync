import { TextStyle } from 'react-native';
import { colors, fonts } from './colors';

export const typography: Record<string, TextStyle> = {
  eyebrowMono: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  eyebrow: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: colors.muted,
  },
  h2: {
    fontFamily: fonts.display[700],
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  stepTitle: {
    fontFamily: fonts.display[700],
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
  small: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
  },
  caption: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  meta: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.hint,
  },
};
