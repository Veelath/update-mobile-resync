import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { navigationRef } from './navigation/navigationRef';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
