import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as SvgModule from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand } from '../theme/brand';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Path, Rect, Circle } = SvgModule;

const ACTIVE = brand.primary;
const INACTIVE = '#8B89AD';
const ACTIVE_FILL = 'rgba(43,37,200,0.2)';

type TabRoute = 'Home' | 'Upload' | 'Credits' | 'Profile';

// Glyphs from the account mockups; shapes passed `fill` get tinted when the tab is active
const TabIcon: React.FC<{ route: TabRoute; color: string; fill: string }> = ({ route, color, fill }) => {
  const common = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" {...common}>
      {route === 'Home' && (
        <>
          <Path d="M3.5 10.6 12 3.6l8.5 7v8.4a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" fill={fill} />
          <Path d="M9.5 20.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" />
        </>
      )}
      {route === 'Upload' && (
        <>
          <Path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
          <Rect x={7.5} y={7.5} width={9} height={9} rx={2} fill={fill} />
          <Path d="M10 12h4" />
        </>
      )}
      {route === 'Credits' && (
        <>
          <Circle cx={12} cy={12} r={8.6} fill={fill} />
          <Path d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" />
        </>
      )}
      {route === 'Profile' && (
        <>
          <Circle cx={12} cy={8} r={3.7} fill={fill} />
          <Path d="M4.8 20.3c.5-3.7 3.4-5.8 7.2-5.8s6.7 2.1 7.2 5.8z" fill={fill} />
        </>
      )}
    </Svg>
  );
};

const TABS: { route: TabRoute; label: string }[] = [
  { route: 'Home', label: 'Home' },
  { route: 'Upload', label: 'Scan' },
  { route: 'Credits', label: 'Credits' },
  { route: 'Profile', label: 'Profile' },
];

// Hidden routes that should light up one of the visible tabs
const HIGHLIGHT_AS: Partial<Record<keyof MainTabParamList, TabRoute>> = {
  Settings: 'Profile',
};

const TabButton: React.FC<{ route: TabRoute; label: string; active: boolean; onPress: () => void }> = ({
  route,
  label,
  active,
  onPress,
}) => {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: active ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [active, v]);

  const color = active ? ACTIVE : INACTIVE;
  return (
    <Pressable onPress={onPress} style={styles.tab} hitSlop={4}>
      <View style={styles.iconSlot}>
        {/* Pill fades and grows in behind the active icon */}
        <Animated.View
          style={[
            styles.pill,
            { opacity: v, transform: [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
          ]}
        />
        <TabIcon route={route} color={color} fill={active ? ACTIVE_FILL : 'none'} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index].name as keyof MainTabParamList;
  const highlighted = HIGHLIGHT_AS[current] ?? current;

  // The scan flow has its own sticky action bar
  if (current === 'Upload') return null;

  return (
    <View style={[styles.bar, { paddingBottom: 14 + insets.bottom }]}>
      {TABS.map((tab) => (
        <TabButton
          key={tab.route}
          route={tab.route}
          label={tab.label}
          active={highlighted === tab.route}
          onPress={() => navigation.navigate(tab.route)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: brand.line,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  iconSlot: {
    width: 58,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
    backgroundColor: brand.tint,
  },
  label: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    letterSpacing: 0.11,
  },
});
