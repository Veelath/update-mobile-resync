import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Path } from 'react-native-svg';
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
  const currentRoute = state.routes[state.index].name;

  if (currentRoute === 'UploadScreenModal') {
    return null;
  }

  const isHome = currentRoute === 'Home';
  const isProfile = currentRoute === 'Profile';

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <Pressable
        onPress={() => navigation.navigate('Home')}
        style={styles.tabItem}
      >
        <MaterialIcons
          name="home"
          size={24}
          color={isHome ? '#1D4ED8' : '#94A3B8'}
        />
        <Text
          style={[
            styles.label,
            { color: isHome ? '#1D4ED8' : '#94A3B8' },
          ]}
        >
          Home
        </Text>
      </Pressable>

      {/* Center Upload Button */}
      <Pressable
        onPress={() => navigation.navigate('Upload')}
        style={styles.centerUploadWrapper}
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
          color={isProfile ? '#1D4ED8' : '#94A3B8'}
        />
        <Text
          style={[
            styles.label,
            { color: isProfile ? '#1D4ED8' : '#94A3B8' },
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
    height: 68,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.sans[700],
  },
  centerUploadWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
    gap: 3,
  },
  centerUploadCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  centerUploadLabel: {
    fontSize: 12,
    fontFamily: fonts.sans[700],
    color: '#64748B',
  },
});
