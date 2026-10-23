import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as SvgModule from 'react-native-svg';
const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme/colors';

// Document with arrow-up upload icon for the center button
const DocumentUploadIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18V12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 15L12 12L15 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BottomNav: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const currentRoute = state.routes[state.index].name;

  if (currentRoute === 'UploadScreenModal') {
    return null;
  }

  const isHome = currentRoute === 'Home';
  const isProfile = currentRoute === 'Profile';

  return (
    <View style={[styles.container, { paddingBottom: bottomPad, height: 62 + bottomPad }]}>
      {/* Home Tab */}
      <Pressable
        onPress={() => navigation.navigate('Home')}
        style={styles.tabItem}
      >
        <MaterialIcons
          name="home"
          size={24}
          color={isHome ? '#0A2AB8' : '#94A3B8'}
        />
        <Text
          style={[
            styles.label,
            { color: isHome ? '#0A2AB8' : '#94A3B8' },
          ]}
        >
          Home
        </Text>
      </Pressable>

      {/* Center Upload Button - Floating Circle */}
      <Pressable
        onPress={() => navigation.navigate('Upload')}
        style={styles.centerTabItem}
      >
        <View style={styles.centerUploadCircle}>
          <DocumentUploadIcon size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.centerUploadLabel}>Upload</Text>
      </Pressable>

      {/* Profile Tab */}
      <Pressable
        onPress={() => navigation.navigate('Profile')}
        style={styles.tabItem}
      >
        <MaterialIcons
          name="person"
          size={24}
          color={isProfile ? '#0A2AB8' : '#94A3B8'}
        />
        <Text
          style={[
            styles.label,
            { color: isProfile ? '#0A2AB8' : '#94A3B8' },
          ]}
        >
          Profile
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans[600],
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  centerUploadCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A2AB8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginTop: -22,
    elevation: 8,
    shadowColor: '#0A2AB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  centerUploadLabel: {
    fontSize: 11,
    fontFamily: fonts.sans[600],
    color: '#64748B',
  },
});
