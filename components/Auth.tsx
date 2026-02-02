import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Notebook, Mail, AlertCircle, ExternalLink } from 'lucide-react';

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
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setMessage({ 
          type: 'success', 
          text: 'CADASTRO REALIZADO! Verifique sua caixa de entrada e SPAM. Se não chegar em 5 minutos, veja o aviso abaixo.' 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('E-mail ainda não confirmado! Verifique seu e-mail ou desative a confirmação no painel do Supabase.');
          }
          throw error;
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro na autenticação' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <Notebook className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight italic">QuoteFlow SaaS</h1>
          <p className="text-slate-400 font-medium mt-2">Gestão profissional de orçamentos Volus</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-700/10">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => { setIsSignUp(false); setMessage(null); }}
              className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${!isSignUp ? 'text-indigo-600 bg-slate-50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600 bg-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setMessage(null); }}
              className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] transition-all ${isSignUp ? 'text-indigo-600 bg-slate-50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600 bg-white'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest leading-relaxed text-center ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">E-MAIL CORPORATIVO</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="exemplo@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SENHA DE ACESSO</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
              {isSignUp ? 'Criar Minha Conta' : 'Acessar Meu Painel'}
            </button>
          </form>
        </div>
        
        {/* Seção de Ajuda para E-mail */}
        <div className="mt-8 bg-indigo-900/40 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="flex items-center gap-2 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-3">
            <Mail size={14} /> E-mail não chegou?
          </h3>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
            O Supabase limita o envio de e-mails gratuitos. Para entrar agora sem confirmar e-mail:
          </p>
          <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <p className="text-[10px] text-white/70 flex gap-2">
              <span className="text-indigo-400 font-black">1.</span> Vá em <span className="text-white font-bold">Authentication → Providers → Email</span> no Supabase.
            </p>
            <p className="text-[10px] text-white/70 flex gap-2">
              <span className="text-indigo-400 font-black">2.</span> Desative o interruptor <span className="text-white font-bold">"Confirm email"</span> e salve.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-8 opacity-50">
          © 2025 QuoteFlow System • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
