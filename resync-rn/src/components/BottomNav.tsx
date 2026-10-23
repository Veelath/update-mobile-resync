import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as SvgModule from 'react-native-svg';
const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme/colors';

// Document with arrow-up upload icon for the center button matching user's photo
const DocumentUploadIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Document sheet with folded top-right corner */}
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Corner fold flap */}
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Upward arrow shaft */}
    <Path
      d="M12 17.5V11"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Upward arrow arrowhead */}
    <Path
      d="M9.5 13.5L12 11L14.5 13.5"
      stroke={color}
      strokeWidth="2.2"
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
  const isUpload = currentRoute === 'Upload';
  const isProfile = currentRoute === 'Profile';

  const barHeight = 58 + bottomPad;
  const totalHeight = 78 + bottomPad;

  return (
    <View
      style={[
        styles.outerContainer,
        { height: totalHeight },
      ]}
      pointerEvents="box-none"
    >
      {/* 
        Solid white tab bar background layer.
        Separating this layer prevents Android ViewGroup from clipping the protruding circle above it!
      */}
      <View
        style={[
          styles.whiteBarBackground,
          { height: barHeight, paddingBottom: bottomPad },
        ]}
        pointerEvents="none"
      />

      {/* Interactive Tabs Row */}
      <View
        style={[
          styles.tabsRow,
          { height: totalHeight, paddingBottom: bottomPad },
        ]}
        pointerEvents="box-none"
      >
        {/* Home Tab */}
        <Pressable
          onPress={() => navigation.navigate('Home')}
          style={styles.tabItem}
          hitSlop={8}
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

        {/* Center Upload Button - Full Unclipped 360-degree Floating Circle */}
        <Pressable
          onPress={() => navigation.navigate('Upload')}
          style={styles.centerTabItem}
          hitSlop={8}
        >
          <View style={styles.centerUploadCircle}>
            <DocumentUploadIcon size={24} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.centerUploadLabel,
              isUpload && { color: '#0A2AB8', fontFamily: fonts.sans[700] },
            ]}
          >
            Upload
          </Text>
        </Pressable>

        {/* Profile Tab */}
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={styles.tabItem}
          hitSlop={8}
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
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    justifyContent: 'flex-end',
    width: '100%',
  },
  whiteBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    elevation: 8,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    height: 54,
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
    overflow: 'visible',
  },
  centerUploadCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0A2AB8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    elevation: 12,
    shadowColor: '#0A2AB8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
  },
  centerUploadLabel: {
    fontSize: 11,
    fontFamily: fonts.sans[600],
    color: '#64748B',
  },
});
