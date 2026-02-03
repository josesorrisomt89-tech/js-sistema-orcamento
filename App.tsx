
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteType, Supplier, ReportRecord, ReportListItem } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import { Layout, Notebook, Settings, Bell, Search, History, Menu, X, LogOut, Loader2, AlertTriangle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]); 
  const [reportListItems, setReportListItems] = useState<ReportListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      if (session) fetchData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      const savedQuotes = localStorage.getItem('demo_quotes_v2');
      const savedSuppliers = localStorage.getItem('demo_suppliers');
      const savedReports = localStorage.getItem('demo_reports_v2');
      const savedListItems = localStorage.getItem('demo_report_lists');
      
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
      if (savedReports) setReportRecords(JSON.parse(savedReports));
      if (savedListItems) setReportListItems(JSON.parse(savedListItems));
      else {
        // Default options for report delivery
        const defaults: ReportListItem[] = [
          { id: 'd1', category: 'entrega', value: 'SIM-ENTREGUE' },
          { id: 'd2', category: 'entrega', value: 'NAO' },
          { id: 'd3', category: 'entrega', value: 'RECEBIDO' },
        ];
        setReportListItems(defaults);
      }
      setLoading(false);
    }
  }, [isDemoMode]);

  const fetchData = async () => {
    if (!isSupabaseConfigured || isDemoMode) return;
    setLoading(true);
    try {
      const [quotesRes, suppliersRes, reportsRes, listsRes] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('report_records').select('*').order('created_at', { ascending: false }),
        supabase.from('report_list_items').select('*')
      ]);

      if (quotesRes.data) {
        setQuotes((quotesRes.data as any[]).map(q => ({
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
        })));
      }

      if (suppliersRes.data) setSuppliers(suppliersRes.data as Supplier[]);
      
      if (reportsRes.data) {
        setReportRecords((reportsRes.data as any[]).map(r => ({
          ...r,
          id: r.id,
          createdAt: new Date(r.created_at).getTime()
        })));
      }

      if (listsRes.data) {
        setReportListItems(listsRes.data as ReportListItem[]);
      } else {
        // Se a tabela não existir ou estiver vazia em um novo projeto, podemos deixar vazio
        // ou adicionar os defaults se for a primeira vez.
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
    const { error } = await supabase.from('quotes').insert(quotesToInsert);
    if (!error) fetchData();
  };

  const handleSaveReportRecord = async (newRecord: Omit<ReportRecord, 'id' | 'createdAt'>) => {
    if (isDemoMode) {
      const record: ReportRecord = { ...newRecord, id: crypto.randomUUID(), createdAt: Date.now() };
      const updated = [record, ...reportRecords];
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { error } = await supabase.from('report_records').insert({
      user_id: session.user.id,
      ...newRecord
    });
    if (!error) fetchData();
  };

  const handleUpdateReportListItems = async (items: ReportListItem[]) => {
    if (isDemoMode) {
      setReportListItems(items);
      localStorage.setItem('demo_report_lists', JSON.stringify(items));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    
    // Simplificando: Deletamos todos e inserimos novamente para este usuário
    await supabase.from('report_list_items').delete().eq('user_id', session.user.id);
    const { error } = await supabase.from('report_list_items').insert(
      items.map(i => ({ user_id: session.user.id, category: i.category, value: i.value }))
    );
    if (!error) fetchData();
  };

  const handleDeleteReportRecord = async (id: string) => {
    if (confirm("Remover este registro da planilha permanentemente?")) {
      if (isDemoMode) {
        const updated = reportRecords.filter(r => r.id !== id);
        setReportRecords(updated);
        localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
        return;
      }
      const { error } = await supabase.from('report_records').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm("Remover do histórico de mensagens permanentemente?")) {
      if (isDemoMode) {
        const updated = quotes.filter(q => q.id !== id);
        setQuotes(updated);
        localStorage.setItem('demo_quotes_v2', JSON.stringify(updated));
        return;
      }
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
    const { error } = await supabase.from('quotes').update({
      type: updatedQuote.type,
      observations: updatedQuote.observations
    }).eq('id', updatedQuote.id);
    if (!error) setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  };

  const handleLogout = async () => {
    if (isDemoMode) setIsDemoMode(false);
    else if (isSupabaseConfigured) await supabase.auth.signOut();
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
          <button onClick={() => setIsDemoMode(true)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs">Entrar em Modo Teste Local</button>
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

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Notebook className="text-white" size={24} /></div>
              <h1 className="text-white font-bold text-xl leading-none italic tracking-tighter">QuoteFlow</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1">
            <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} />
            <NavItem icon={<History size={20} />} label="Histórico" active={activeView === 'history'} onClick={() => { setActiveView('history'); setIsSidebarOpen(false); }} />
            <NavItem icon={<FileSpreadsheet size={20} />} label="Relatórios" active={activeView === 'reports'} onClick={() => { setActiveView('reports'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Settings size={20} />} label="Fornecedores" active={activeView === 'settings'} onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} />
          </nav>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 font-black uppercase text-[10px] tracking-widest mt-auto"><LogOut size={16} /> Sair do Sistema</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="flex items-center gap-3 px-4">
             <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-[11px] font-black text-white uppercase tracking-tighter shadow-xl">{isDemoMode ? 'ADM' : session?.user.email?.charAt(0)}</div>
          </div>
        </header>

        <div className={`p-4 md:p-6 w-full ${activeView === 'reports' ? '' : 'max-w-7xl mx-auto'} space-y-8 transition-all duration-500`}>
          {activeView === 'dashboard' ? (
            <>
              <section ref={formRef}>
                <div className="mb-6">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase italic">Envio WhatsApp</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Fluxo Rápido para Fornecedores</p>
                </div>
                <QuoteForm onSave={handleSaveQuotes} suppliers={suppliers} />
              </section>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 uppercase italic">Último Orçamento Enviado</h3>
                  {quotes.length > 1 && (
                    <button onClick={() => setActiveView('history')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline">Ver Histórico <ArrowRight size={14} /></button>
                  )}
                </div>
                <QuoteList quotes={quotes.slice(0, 1)} onDelete={handleDeleteQuote} />
              </section>
            </>
          ) : activeView === 'history' ? (
            <div className="max-w-7xl mx-auto"><HistoryView quotes={quotes} onDelete={handleDeleteQuote} onUpdateQuote={handleUpdateQuote} /></div>
          ) : activeView === 'reports' ? (
            <ReportsView 
              records={reportRecords} 
              listItems={reportListItems}
              onSaveRecord={handleSaveReportRecord} 
              onDeleteRecord={handleDeleteReportRecord} 
              onUpdateListItems={handleUpdateReportListItems}
            />
          ) : activeView === 'settings' ? (
            <div className="max-w-7xl mx-auto"><SettingsView suppliers={suppliers} onAddSupplier={async s => {}} onUpdateSupplier={async s => {}} onDeleteSupplier={async id => {}} /></div>
          ) : (
             <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Aguardando dados...</div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
