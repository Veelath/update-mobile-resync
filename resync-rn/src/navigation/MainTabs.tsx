import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { UsageScreen } from '../screens/UsageScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BottomNav } from '../components/BottomNav';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="History" component={ArchiveScreen} />
      <Tab.Screen name="Credits" component={UsageScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
