
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process explicitly from node:process to provide correct types for process.cwd()
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente (incluindo as sem prefixo VITE_)
  // Use process.cwd() to resolve the environment file path correctly during build
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Injeta as variáveis de ambiente diretamente para que funcionem no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env': JSON.stringify(env)
    },
    server: {
      port: 3000
    }
  };
});
