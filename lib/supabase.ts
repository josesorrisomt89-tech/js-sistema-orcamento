import { createClient } from '@supabase/supabase-js';

// No ambiente local ou build, as variáveis são injetadas pelo Vite define
const supabaseUrl = typeof process !== 'undefined' ? process.env.SUPABASE_URL : '';
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '';

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl !== 'undefined';

// URL segura para fallback caso não esteja configurado
const fallbackUrl = 'https://placeholder-project.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl, 
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
