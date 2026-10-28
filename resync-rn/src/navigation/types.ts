import { NavigatorScreenParams } from '@react-navigation/native';
import type {ScanResponse} from '../services/api';

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
  Report: {scanId?: string; heavy?: boolean; result?: ScanResponse; manuscriptTitle?: string} | undefined;
  Compare: { scanIds: string[] };
  Settings: undefined;
};
