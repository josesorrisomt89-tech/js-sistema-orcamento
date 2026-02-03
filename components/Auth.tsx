
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Loader2, Notebook, ShieldCheck, ExternalLink } from 'lucide-react';
import { SystemSettings } from '../types';

interface AuthProps {
  branding: SystemSettings;
}

export const Auth = (props: AuthProps) => {
  const { branding } = props;
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
          text: 'CADASTRO REALIZADO! Verifique seu e-mail (inclusive SPAM).' 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Confirme seu e-mail para acessar o painel.');
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 bg-${branding.primaryColor}`}></div>
      
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-24 h-24 object-contain mx-auto" />
            ) : (
              <div className={`w-20 h-20 bg-${branding.primaryColor} rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 rotate-3`}>
                <Notebook className="text-white -rotate-3" size={40} />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg shadow-lg">
              <ShieldCheck className="text-indigo-600" size={16} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
            {branding.name}
          </h1>
          <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mt-3">
            {branding.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="flex bg-slate-50 border-b border-slate-100 p-1 mx-4 mt-4 rounded-2xl">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setMessage(null); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${!isSignUp ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}
            >
              Acessar
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setMessage(null); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl ${isSignUp ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">E-mail</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Senha</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? <UserPlus size={20} /> : <ExternalLink size={20} />)}
              {isSignUp ? 'Finalizar Cadastro' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
