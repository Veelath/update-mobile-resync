import { ViewStyle } from 'react-native';

/** Palette of the A-series / account redesign mockups. */
export const brand = {
  ink: '#0B0A2E',
  sub: '#5A5778',
  muted: '#6B6890',
  hint: '#7D7B9E',
  label: '#4C4A6B',
  primary: '#2B25C8',
  tint: '#EEEDFF',
  border: '#DAD8F2',
  line: '#E6E5F7',
  softLine: '#EEEDFB',
  soft: '#F7F7FD',
  page: '#F5F5FE',
  icon: '#8B89AD',
  placeholder: '#9A98B8',
  dashed: '#CFCDE6',
  success: '#0B8F63',
  successTint: '#E3F8EF',
  danger: '#D6264A',
  dangerBorder: '#F6C6D0',
  deep: '#17136F',
  bright: '#3A33E6',
};

/** The mockups' .card: white, hairline border, soft indigo drop shadow. */
export const cardStyle: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: brand.line,
  borderRadius: 20,
  shadowColor: brand.primary,
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 2,
};
