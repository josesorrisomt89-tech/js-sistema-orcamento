
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteType, Supplier, AttachedFile } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import { Layout, Notebook, Settings, Bell, Search, History, BarChart3, Menu, X, LogOut, Loader2, AlertTriangle, ExternalLink, Play, ArrowRight } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | QuoteType>('ALL');
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'reports' | 'settings'>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      const savedQuotes = localStorage.getItem('demo_quotes_v2');
      const savedSuppliers = localStorage.getItem('demo_suppliers');
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
      setLoading(false);
    }
  }, [isDemoMode]);

  const fetchData = async () => {
    if (!isSupabaseConfigured || isDemoMode) return;
    setLoading(true);
    try {
      const [quotesRes, suppliersRes] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name')
      ]);

      if (quotesRes.data) {
        const mappedQuotes: Quote[] = (quotesRes.data as any[]).map(q => ({
          id: q.id,
          type: q.type as QuoteType,
          supplierName: q.supplier_name,
          supplierPhone: q.supplier_phone,
          prefix: q.prefix,
          quoteNumberParts: q.quote_number_parts,
          quoteNumberServices: q.quote_number_services,
          photo: q.photo,
          files: q.files || [],
          observations: q.observations,
          createdAt: new Date(q.created_at).getTime()
        }));
        setQuotes(mappedQuotes);
      }

      if (suppliersRes.data) {
        setSuppliers(suppliersRes.data as Supplier[]);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuotes = async (newQuotes: Quote[]) => {
    if (isDemoMode) {
      const updated = [...newQuotes, ...quotes];
      setQuotes(updated);
      localStorage.setItem('demo_quotes_v2', JSON.stringify(updated));
      return;
    }

    if (!session?.user || !isSupabaseConfigured) return;

    const quotesToInsert = newQuotes.map(q => ({
      user_id: session.user.id,
      type: q.type,
      supplier_name: q.supplierName,
      supplier_phone: q.supplierPhone,
      prefix: q.prefix,
      quote_number_parts: q.quoteNumberParts,
      quote_number_services: q.quoteNumberServices,
      photo: q.photo,
      files: q.files,
      observations: q.observations
    }));

    const { data, error } = await supabase.from('quotes').insert(quotesToInsert).select();
    if (!error && data) fetchData();
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm("Remover do banco de dados permanentemente?")) {
      if (isDemoMode) {
        const updated = quotes.filter(q => q.id !== id);
        setQuotes(updated);
        localStorage.setItem('demo_quotes_v2', JSON.stringify(updated));
        return;
      }
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (!error) setQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleUpdateQuote = async (updatedQuote: Quote) => {
    if (isDemoMode) {
      const updated = quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q);
      setQuotes(updated);
      localStorage.setItem('demo_quotes_v2', JSON.stringify(updated));
      return;
    }
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('quotes').update({
      type: updatedQuote.type,
      observations: updatedQuote.observations
    }).eq('id', updatedQuote.id);
    if (!error) setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  };

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (isDemoMode) {
      const newSupplier = { ...supplier, id: crypto.randomUUID() };
      const updated = [...suppliers, newSupplier];
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: session.user.id,
      name: supplier.name,
      phone: supplier.phone
    }).select();
    if (!error && data) fetchData();
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    if (isDemoMode) {
      const updated = suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('suppliers').update({
      name: updatedSupplier.name,
      phone: updatedSupplier.phone
    }).eq('id', updatedSupplier.id);
    if (!error) fetchData();
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Remover fornecedor do sistema?")) {
      if (isDemoMode) {
        const updated = suppliers.filter(s => s.id !== id);
        setSuppliers(updated);
        localStorage.setItem('demo_suppliers', JSON.stringify(updated));
        return;
      }
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  if (!isSupabaseConfigured && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuração</h1>
          <p className="text-slate-500 font-medium">Configure o Supabase para ativar a Nuvem.</p>
          <button onClick={() => setIsDemoMode(true)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200">ENTRAR MODO TESTE</button>
        </div>
      </div>
    );
  }

  if (!session && !isDemoMode) return <Auth />;

  if (loading && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  const filteredQuotes = quotes.filter(quote => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = quote.supplierName.toLowerCase().includes(s) || quote.observations.toLowerCase().includes(s) || quote.supplierPhone.includes(s);
    const matchesFilter = filterType === 'ALL' || quote.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center"><Notebook className="text-white" size={24} /></div>
              <h1 className="text-white font-bold text-xl leading-none">QuoteFlow</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1">
            <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} />
            <NavItem icon={<History size={20} />} label="Histórico" active={activeView === 'history'} onClick={() => { setActiveView('history'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Settings size={20} />} label="Configurações" active={activeView === 'settings'} onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} />
          </nav>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 font-black uppercase text-xs tracking-widest"><LogOut size={16} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm w-64" />
          </div>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">{isDemoMode ? 'T' : session?.user.email?.charAt(0)}</div>
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-5xl mx-auto w-full space-y-8">
          {activeView === 'dashboard' ? (
            <>
              <section ref={formRef}>
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Novo Orçamento</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Preencha, anexe e envie no WhatsApp</p>
                </div>
                <QuoteForm onSave={handleSaveQuotes} suppliers={suppliers} />
              </section>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Último Orçamento Enviado</h3>
                  {quotes.length > 1 && (
                    <button 
                      onClick={() => setActiveView('history')}
                      className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      Ver Histórico Completo <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                <QuoteList quotes={filteredQuotes.slice(0, 1)} onDelete={handleDeleteQuote} />
              </section>
            </>
          ) : activeView === 'history' ? (
            <HistoryView quotes={quotes} onDelete={handleDeleteQuote} onUpdateQuote={handleUpdateQuote} />
          ) : activeView === 'settings' ? (
            <SettingsView suppliers={suppliers} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} />
          ) : (
             <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Em Breve</div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
