
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteType, Supplier } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import { Layout, Notebook, Settings, Bell, Search, History, BarChart3, Menu, X, LogOut, Loader2, AlertTriangle, ExternalLink, Play } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | QuoteType>('ALL');
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'reports' | 'settings'>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);

  // Check Session and Configuration
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

  // Carregar dados do LocalStorage se for modo Demo
  useEffect(() => {
    if (isDemoMode) {
      const savedQuotes = localStorage.getItem('demo_quotes');
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
      localStorage.setItem('demo_quotes', JSON.stringify(updated));
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
      observations: q.observations
    }));

    const { data, error } = await supabase.from('quotes').insert(quotesToInsert).select();
    if (!error && data) fetchData();
  };

  const handleDeleteQuote = async (id: string) => {
    if (isDemoMode) {
      const updated = quotes.filter(q => q.id !== id);
      setQuotes(updated);
      localStorage.setItem('demo_quotes', JSON.stringify(updated));
      return;
    }

    if (!isSupabaseConfigured) return;
    if (confirm("Remover do banco de dados permanentemente?")) {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (!error) setQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleUpdateQuote = async (updatedQuote: Quote) => {
    if (isDemoMode) {
      const updated = quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q);
      setQuotes(updated);
      localStorage.setItem('demo_quotes', JSON.stringify(updated));
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
    if (isDemoMode) {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }

    if (!isSupabaseConfigured) return;
    if (confirm("Remover fornecedor do sistema?")) {
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

  // Setup Screen
  if (!isSupabaseConfigured && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuração Necessária</h1>
          <p className="text-slate-500 font-medium">
            Para ativar o modo SaaS (Nuvem), você precisa configurar o Supabase. 
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => setIsDemoMode(true)}
              className="flex items-center justify-center gap-3 w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest shadow-xl shadow-indigo-200"
            >
              <Play size={18} /> Entrar em Modo de Teste
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Ideal para ver o visual e as funções agora</p>
          </div>

          <div className="h-[1px] bg-slate-100 w-full my-4"></div>

          <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4 border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ativar Modo SaaS Real:</h3>
            <ul className="text-[11px] space-y-2 text-slate-600 font-medium">
              <li className="flex gap-2"><span>1.</span> Crie projeto em <span className="font-bold">supabase.com</span></li>
              <li className="flex gap-2"><span>2.</span> Execute o SQL do arquivo <span className="font-bold text-indigo-500">README.md</span></li>
              <li className="flex gap-2"><span>3.</span> Adicione <code className="bg-white px-1 font-bold">SUPABASE_URL</code> nos Segredos.</li>
            </ul>
          </div>
          
          <a 
            href="https://supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-slate-400 font-black py-2 hover:text-slate-900 transition-all uppercase text-[10px] tracking-widest"
          >
            Abrir Painel Supabase <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  if (!session && !isDemoMode) {
    return <Auth />;
  }

  if (loading && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  const filteredQuotes = quotes.filter(quote => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      quote.supplierName.toLowerCase().includes(s) ||
      quote.observations.toLowerCase().includes(s) ||
      (quote.quoteNumberParts && quote.quoteNumberParts.toLowerCase().includes(s)) ||
      (quote.quoteNumberServices && quote.quoteNumberServices.toLowerCase().includes(s)) ||
      quote.supplierPhone.includes(s);
    
    const matchesFilter = filterType === 'ALL' || quote.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Notebook className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl tracking-tight leading-none">QuoteFlow</h1>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{isDemoMode ? 'Modo Local' : 'Cloud SaaS'}</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <NavItem icon={<History size={20} />} label="Histórico" active={activeView === 'history'} onClick={() => setActiveView('history')} />
            <NavItem icon={<BarChart3 size={20} />} label="Relatórios" active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
            <NavItem icon={<Settings size={20} />} label="Configurações" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
          </nav>

          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {isDemoMode ? 'T' : session?.user.email?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{isDemoMode ? 'Usuário Teste' : session?.user.email}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Online</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-black text-rose-400 hover:bg-rose-500/10 transition-all uppercase tracking-widest"
            >
              <LogOut size={16} /> Sair {isDemoMode ? 'do Teste' : ''}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar orçamentos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-64"
              />
            </div>
          </div>
          {isDemoMode && (
            <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
              Modo Demonstração (Sem Nuvem)
            </div>
          )}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <button 
              onClick={() => { setActiveView('dashboard'); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Novo Orçamento
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
          {activeView === 'dashboard' ? (
            <>
              <section ref={formRef}>
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Solicitar Orçamentos</h2>
                  <p className="text-slate-500 font-medium">Preencha os dados abaixo para gerar a mensagem formatada.</p>
                </div>
                <QuoteForm onSave={handleSaveQuotes} suppliers={suppliers} />
              </section>

              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Histórico Recente</h3>
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterType === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Todos</button>
                    <button onClick={() => setFilterType(QuoteType.APPROVAL)} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterType === QuoteType.APPROVAL ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>Aprovações</button>
                    <button onClick={() => setFilterType(QuoteType.REQUEST)} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filterType === QuoteType.REQUEST ? 'bg-amber-500 text-white' : 'text-slate-500'}`}>Pedidos</button>
                  </div>
                </div>
                <QuoteList quotes={filteredQuotes} onDelete={handleDeleteQuote} />
              </section>
            </>
          ) : activeView === 'history' ? (
            <HistoryView quotes={quotes} onDelete={handleDeleteQuote} onUpdateQuote={handleUpdateQuote} />
          ) : activeView === 'settings' ? (
            <SettingsView suppliers={suppliers} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} />
          ) : (
            <div className="py-20 text-center">
              <BarChart3 size={64} className="mx-auto text-slate-200 mb-4" />
              <h2 className="text-2xl font-bold">Relatórios Avançados</h2>
              <p className="text-slate-500">Módulo exclusivo do plano Pro em desenvolvimento.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
