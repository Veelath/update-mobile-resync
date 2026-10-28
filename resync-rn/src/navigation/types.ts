import { NavigatorScreenParams } from '@react-navigation/native';
import type {ScanResult} from '../services/v7Result';

export type MainTabParamList = {
  Home: undefined;
  Upload: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: { mode?: 'signup' | 'login' } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Report: {scanId?: string; result?: ScanResult; sample?: boolean; heavy?: boolean; manuscriptTitle?: string} | undefined;
  Compare: { scanIds: string[] };
  Settings: undefined;
};
