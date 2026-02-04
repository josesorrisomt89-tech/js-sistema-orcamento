
import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis definidas em 'define' são substituídas literalmente.
// Se não houver substituição, tentamos ler do process.env padrão.
const getEnv = (key: string): string => {
  try {
    // Tentativa de leitura direta (Vite substituirá isso)
    const val = process.env[key];
    if (val && val !== 'undefined' && val !== 'null' && !val.includes('placeholder')) {
      return val;
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl.startsWith('https://');

// URL segura para fallback caso não esteja configurado (evita erro de inicialização do cliente)
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
