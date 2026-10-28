import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {config} from '../config';

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
  auth: {storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
});
