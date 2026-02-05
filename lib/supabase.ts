
import { createClient } from '@supabase/supabase-js';

// No ambiente local, usamos placeholders. No Vercel, o process.env será injetado.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' && 
  !supabaseUrl.includes('placeholder');

// URL segura para fallback caso não esteja configurado
const fallbackUrl = 'https://placeholder-url.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl, 
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey
);
