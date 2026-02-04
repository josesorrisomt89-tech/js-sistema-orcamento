import { createClient } from '@supabase/supabase-js';

// Função ultra-segura para ler variáveis de ambiente sem quebrar o parser do navegador
const safeGetEnv = (key: string): string => {
  try {
    // Tenta ler do process.env global (injetado via polyfill ou build)
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key];
    }
    // Fallback para process local se existir
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    console.warn(`Erro ao ler env var ${key}:`, e);
  }
  return '';
};

const supabaseUrl = safeGetEnv('SUPABASE_URL');
const supabaseAnonKey = safeGetEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl.length > 10 &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder');

// Fallback silencioso para evitar que a aplicação trave na inicialização
const finalUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
