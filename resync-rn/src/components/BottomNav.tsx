import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme/colors';

export const BottomNav: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const currentRoute = state.routes[state.index].name;

  // Upload hides the tab bar
  if (currentRoute === 'Upload') {
    return null;
  }

  const items = [
    { route: 'Home', label: 'Home', icon: 'home' },
    { route: 'Upload', label: 'Upload', icon: 'upload-file' },
    { route: 'History', label: 'History', icon: 'history' },
    { route: 'Profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const routeIndex = state.routes.findIndex((r) => r.name === item.route);
        const isFocused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[routeIndex]?.key || item.route,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(item.route);
          }
        };

        const activeColor = isFocused ? colors.primary : colors.hint;

        return (
          <Pressable
            key={item.route}
            onPress={onPress}
            style={styles.tabItem}
            android_ripple={{ color: 'rgba(10,42,184,0.08)', borderless: true }}
          >
            {/* Top Indicator Pill */}
            <View
              style={[
                styles.topIndicator,
                { backgroundColor: isFocused ? colors.primary : 'transparent' },
              ]}
            />
            <MaterialIcons name={item.icon} size={22} color={activeColor} />
            <Text
              style={[
                styles.label,
                {
                  color: activeColor,
                  fontFamily: fonts.sans[500],
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 3,
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11.5,
    lineHeight: 14,
  },
});
