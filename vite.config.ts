
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import specific functions from node:process to avoid typing issues with the default process object
import { cwd } from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente (incluindo as sem prefixo VITE_)
  // Use cwd() from node:process to resolve the environment file path correctly during build
  // This fix addresses the error where property 'cwd' was not found on the default process import
  const env = loadEnv(mode, cwd(), '');
  
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
