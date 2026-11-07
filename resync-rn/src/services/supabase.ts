import 'fast-text-encoding';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { config } from '../config';

export const AUTH_REDIRECT_URL = 'com.resync.app://auth/callback';

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    lock: processLock,
  },
});

const updateAutoRefresh = (state: string | null) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};

updateAutoRefresh(AppState.currentState);
// Register once for this singleton, rather than once per screen.
AppState.addEventListener('change', updateAutoRefresh);
