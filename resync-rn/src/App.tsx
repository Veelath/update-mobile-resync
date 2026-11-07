import React, { useEffect } from 'react';
import { Alert, Linking, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { RootStackParamList } from './navigation/types';
import { completeAuthRedirect } from './services/api';

export default function App() {
  const navigation = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    const handled = new Set<string>();
    const handleUrl = async (url: string | null) => {
      if (!url || handled.has(url)) return;
      handled.add(url);
      try {
        if (await completeAuthRedirect(url)) {
          if (navigation.isReady()) navigation.resetRoot({ index: 0, routes: [{ name: 'Main' }] });
        }
      } catch (err: any) {
        Alert.alert('Authentication Error', err.message || 'Unable to complete sign-in.');
      }
    };
    const subscription = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
    Linking.getInitialURL().then(handleUrl).catch(() => {
      Alert.alert('Authentication Error', 'Unable to read the sign-in link. Please try again.');
    });
    return () => subscription.remove();
  }, [navigation]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigation}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
