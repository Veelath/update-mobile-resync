import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts } from '../theme/colors';
import { brand } from '../theme/brand';
import { LineIcon } from './LineIcon';

export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least 1 lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'At least 1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least 1 number', test: (p) => /\d/.test(p) },
  { label: 'At least 1 symbol (e.g. ! @ # $)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export const meetsPasswordRules = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** One requirement row; the tick pops in when the rule flips to met. */
const RuleRow: React.FC<{ label: string; met: boolean }> = ({ label, met }) => {
  const v = useRef(new Animated.Value(met ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: met ? 1 : 0, speed: 24, bounciness: 10, useNativeDriver: true }).start();
  }, [met, v]);
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleCircle}>
        <Animated.View style={[styles.ruleTick, { opacity: v, transform: [{ scale: v }] }]}>
          <LineIcon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </View>
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
};

/** "New password must contain:" checklist shown under a new-password field. */
export const PasswordRules: React.FC<{ password: string; style?: StyleProp<ViewStyle> }> = ({ password, style }) => (
  <View style={[styles.rulesBox, style]}>
    <Text style={styles.rulesTitle}>New password must contain:</Text>
    {PASSWORD_RULES.map((r) => (
      <RuleRow key={r.label} label={r.label} met={r.test(password)} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  rulesBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 7,
    borderRadius: 14,
    backgroundColor: '#F7F6FF',
    borderWidth: 1,
    borderColor: brand.line,
  },
  rulesTitle: {
    marginBottom: 2,
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: brand.label,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  ruleCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C4C2E6',
    backgroundColor: '#FFFFFF',
  },
  ruleTick: {
    position: 'absolute',
    top: -1.5,
    left: -1.5,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.sub,
  },
  ruleTextMet: {
    color: brand.ink,
  },
});
