
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Notebook } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro na autenticação' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Notebook className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">QuoteFlow SaaS</h1>
          <p className="text-slate-400 font-medium mt-2">Gestão profissional de orçamentos Volus</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${!isSignUp ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${isSignUp ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-5">
            {message && (
              <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="exemplo@empresa.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {isSignUp ? 'Criar Conta Grátis' : 'Acessar Painel'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-8">
          &copy; 2025 QuoteFlow System • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
