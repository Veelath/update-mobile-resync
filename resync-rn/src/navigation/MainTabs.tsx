import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BottomNav } from '../components/BottomNav';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
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
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
