import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { MainTabs } from './MainTabs';
import { ScreenPop } from '../components/ScreenPop';
import { ReportScreen } from '../screens/ReportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        // Cross-fade between screens; ScreenPop adds the zoom-in so it feels like a soft pop, not a slide
        animation: 'fade',
      }}
      screenLayout={({ route, children }) =>
        route.name === 'Splash' ? children : <ScreenPop key={route.key}>{children}</ScreenPop>
      }
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Report" component={ReportScreen} />
    </Stack.Navigator>
  );
};
