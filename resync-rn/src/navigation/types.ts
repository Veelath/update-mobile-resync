import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Upload: undefined;
  History: undefined;
  Credits: undefined;
  Profile: undefined;
  Settings: undefined; // hidden tab: keeps the tab bar visible, with Profile highlighted
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Auth: { mode?: 'signup' | 'login' } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Report: { scanId?: string; heavy?: boolean } | undefined;
  Compare: { scanIds: string[] };
};
