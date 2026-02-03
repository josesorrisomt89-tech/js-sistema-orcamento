
import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteType, Supplier, ReportRecord, ReportListItem, SystemSettings } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import SystemSettingsView from './components/SystemSettingsView';
import ProtocolView from './components/ProtocolView';
import { Layout, Notebook, Settings, Menu, X, LogOut, Loader2, AlertTriangle, ArrowRight, FileSpreadsheet, Monitor, ClipboardCheck, History } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]); 
  const [reportListItems, setReportListItems] = useState<ReportListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'reports' | 'settings' | 'system' | 'protocol'>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    name: "MECÂNICA VOLUS",
    subtitle: "SISTEMA INTEGRADO DE ORÇAMENTOS",
    logoUrl: null,
    primaryColor: "indigo-600"
  });
  
  const formRef = useRef<HTMLDivElement>(null);

  const protocolPendingCount = reportRecords.filter(r => 
    ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregueRelatorio?.toUpperCase())
  ).length;

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
    const savedBrand = localStorage.getItem('system_brand_v1');
    if (savedBrand) {
      try {
        setSystemSettings(JSON.parse(savedBrand));
      } catch (e) {}
    }

    if (isDemoMode) {
      const savedQuotes = localStorage.getItem('demo_quotes_v2');
      const savedSuppliers = localStorage.getItem('demo_suppliers');
      const savedReports = localStorage.getItem('demo_reports_v2');
      const savedListItems = localStorage.getItem('demo_report_lists');
      
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
      if (savedReports) setReportRecords(JSON.parse(savedReports));
      
      if (savedListItems) {
        setReportListItems(JSON.parse(savedListItems));
      } else {
        const defaults: ReportListItem[] = [
          { id: 'd1', category: 'entrega', value: 'SIM - AGUARD. PROTOCOLO' },
          { id: 'd2', category: 'entrega', value: 'ENTREGUE PEÇAS PROTOCOLO' },
          { id: 'd3', category: 'entrega', value: 'ENTREGUE SERVIÇO PROTOCOLO' },
          { id: 'd4', category: 'entrega', value: 'RECEBIDO - PROTOCOLADO' },
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
      const [quotesRes, suppliersRes, reportsRes, listsRes, settingsRes] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('report_records').select('*').order('created_at', { ascending: false }),
        supabase.from('report_list_items').select('*').order('value'),
        supabase.from('system_settings').select('*').limit(1).single()
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

      if (listsRes.data && listsRes.data.length > 0) {
        setReportListItems(listsRes.data as ReportListItem[]);
      }

      if (settingsRes.data) {
        setSystemSettings(settingsRes.data as SystemSettings);
        localStorage.setItem('system_brand_v1', JSON.stringify(settingsRes.data));
      }
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('system_brand_v1', JSON.stringify(newSettings));
    
    if (isSupabaseConfigured && session?.user && !isDemoMode) {
      try {
        const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single();
        if (existing) {
          await supabase.from('system_settings').update(newSettings).eq('id', existing.id);
        } else {
          await supabase.from('system_settings').insert({ ...newSettings, user_id: session.user.id });
        }
      } catch (err) {
        console.error("Erro ao salvar no Supabase:", err);
      }
    }
  };

  const handleSaveQuotes = async (newQuotes: Quote[]) => {
    setQuotes(prev => [...newQuotes, ...prev]);
    if (isDemoMode) {
      localStorage.setItem('demo_quotes_v2', JSON.stringify([...newQuotes, ...quotes]));
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

  const handleAddSupplier = async (newSupplier: Omit<Supplier, 'id'>) => {
    if (isDemoMode) {
      const supplier: Supplier = { ...newSupplier, id: crypto.randomUUID() };
      const updated = [...suppliers, supplier];
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: session.user.id,
      name: newSupplier.name,
      phone: newSupplier.phone
    }).select().single();
    if (!error && data) setSuppliers(prev => [...prev, data as Supplier]);
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    if (isDemoMode) {
      const updated = suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }
    const { error } = await supabase.from('suppliers').update({
      name: updatedSupplier.name,
      phone: updatedSupplier.phone
    }).eq('id', updatedSupplier.id);
    if (!error) setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Remover este fornecedor permanentemente?")) return;
    if (isDemoMode) {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('demo_suppliers', JSON.stringify(updated));
      return;
    }
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) setSuppliers(prev => prev.filter(s => s.id !== id));
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

  const handleUpdateReportRecord = async (id: string, updatedFields: Omit<ReportRecord, 'id' | 'createdAt'>) => {
    if (isDemoMode) {
      const updated = reportRecords.map(r => r.id === id ? { ...r, ...updatedFields } : r);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { error } = await supabase.from('report_records').update(updatedFields).eq('id', id);
    if (!error) fetchData();
  };

  const handleConfirmProtocol = async (id: string) => {
    if (isDemoMode) {
      const updated = reportRecords.map(r => r.id === id ? { ...r, entregueRelatorio: 'RECEBIDO - PROTOCOLADO' } : r);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { error } = await supabase.from('report_records').update({ entregueRelatorio: 'RECEBIDO - PROTOCOLADO' }).eq('id', id);
    if (!error) fetchData();
  };

  const handleConfirmProtocolBatch = async (ids: string[]) => {
    if (isDemoMode) {
      const updated = reportRecords.map(r => ids.includes(r.id) ? { ...r, entregueRelatorio: 'RECEBIDO - PROTOCOLADO' } : r);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    if (!session?.user || !isSupabaseConfigured) return;
    const { error } = await supabase.from('report_records').update({ entregueRelatorio: 'RECEBIDO - PROTOCOLADO' }).in('id', ids);
    if (!error) fetchData();
  };

  const handleUpdateReportListItems = async (items: ReportListItem[]) => {
    if (isDemoMode) {
      setReportListItems(items);
      localStorage.setItem('demo_report_lists', JSON.stringify(items));
      return true;
    }
    if (!session?.user || !isSupabaseConfigured) return false;
    try {
      await supabase.from('report_list_items').delete().eq('user_id', session.user.id);
      if (items.length > 0) {
        await supabase.from('report_list_items').insert(
          items.map(i => ({ 
            user_id: session.user.id, 
            category: i.category, 
            value: i.value.toUpperCase().trim() 
          }))
        );
      }
      await fetchData();
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteReportRecord = async (id: string) => {
    if (!confirm("Remover este registro da planilha?")) return;
    if (isDemoMode) {
      const updated = reportRecords.filter(r => r.id !== id);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    const { error } = await supabase.from('report_records').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Remover do histórico?")) return;
    if (isDemoMode) {
      const updated = quotes.filter(q => q.id !== id);
      setQuotes(updated);
      localStorage.setItem('demo_quotes_v2', JSON.stringify(updated));
      return;
    }
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (!error) setQuotes(prev => prev.filter(q => q.id !== id));
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
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600"><AlertTriangle size={40} /></div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuração</h1>
          <p className="text-slate-500 font-medium">Configure o Supabase para ativar a Nuvem.</p>
          <button onClick={() => setIsDemoMode(true)} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs">Entrar em Modo Teste Local</button>
        </div>
      </div>
    );
  }

  if (!session && !isDemoMode) return <Auth branding={systemSettings} />;

  if (loading && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sincronizando Dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex flex-col items-center mb-10 pb-6 border-b border-white/5">
            <div className="flex items-center gap-3 w-full">
              {systemSettings.logoUrl ? (
                <img src={systemSettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              ) : (
                <div className={`w-10 h-10 bg-${systemSettings.primaryColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Notebook className="text-white" size={24} />
                </div>
              )}
              <h1 className="text-white font-black text-lg leading-tight uppercase tracking-tighter italic truncate">
                {systemSettings.name}
              </h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 text-slate-500"><X size={24} /></button>
          </div>
          
          <nav className="flex-1 space-y-1">
            <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} color={systemSettings.primaryColor} onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} />
            <NavItem icon={<History size={20} />} label="Histórico" active={activeView === 'history'} color={systemSettings.primaryColor} onClick={() => { setActiveView('history'); setIsSidebarOpen(false); }} />
            <NavItem icon={<FileSpreadsheet size={20} />} label="Relatórios" active={activeView === 'reports'} color={systemSettings.primaryColor} onClick={() => { setActiveView('reports'); setIsSidebarOpen(false); }} />
            <NavItem 
              icon={<ClipboardCheck size={20} />} 
              label="Protocolo" 
              active={activeView === 'protocol'} 
              color={systemSettings.primaryColor} 
              badge={protocolPendingCount > 0 ? protocolPendingCount : undefined}
              onClick={() => { setActiveView('protocol'); setIsSidebarOpen(false); }} 
            />
            <NavItem icon={<Settings size={20} />} label="Fornecedores" active={activeView === 'settings'} color={systemSettings.primaryColor} onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Monitor size={20} />} label="Sistema" active={activeView === 'system'} color={systemSettings.primaryColor} onClick={() => { setActiveView('system'); setIsSidebarOpen(false); }} />
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Logado como:</p>
              <p className="text-[10px] font-bold text-slate-300 truncate">{isDemoMode ? 'ADMINISTRADOR' : session?.user.email}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-rose-400 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 rounded-xl transition-all">
              <LogOut size={16} /> Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 flex items-center justify-between lg:justify-end">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="flex items-center gap-4 px-4">
             <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{systemSettings.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel Administrativo</span>
             </div>
             <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-[12px] font-black text-white uppercase tracking-tighter shadow-xl">
               {isDemoMode ? 'ADM' : session?.user.email?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <div className={`p-4 md:p-6 w-full ${activeView === 'reports' ? '' : 'max-w-7xl mx-auto'} space-y-8`}>
          {activeView === 'dashboard' ? (
            <>
              <section ref={formRef}>
                <div className="mb-6">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase italic">Novo Orçamento</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Envio Rápido via WhatsApp</p>
                </div>
                <QuoteForm onSave={handleSaveQuotes} suppliers={suppliers} />
              </section>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 uppercase italic">Último Processado</h3>
                  {quotes.length > 1 && (
                    <button onClick={() => setActiveView('history')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline">Histórico Completo <ArrowRight size={14} /></button>
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
              onUpdateRecord={handleUpdateReportRecord}
              onDeleteRecord={handleDeleteReportRecord} 
              onUpdateListItems={handleUpdateReportListItems}
            />
          ) : activeView === 'protocol' ? (
            <ProtocolView 
              records={reportRecords}
              onConfirm={handleConfirmProtocol}
              onConfirmBatch={handleConfirmProtocolBatch}
            />
          ) : activeView === 'settings' ? (
            <div className="max-w-7xl mx-auto">
              <SettingsView 
                suppliers={suppliers} 
                onAddSupplier={handleAddSupplier} 
                onUpdateSupplier={handleUpdateSupplier} 
                onDeleteSupplier={handleDeleteSupplier} 
              />
            </div>
          ) : activeView === 'system' ? (
            <SystemSettingsView 
              settings={systemSettings}
              onSave={handleUpdateSystemSettings}
            />
          ) : (
             <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Aguardando dados...</div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, color, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${active ? `bg-${color} text-white shadow-xl shadow-${color}/30 translate-x-1` : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} 
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
        {badge}
      </span>
    )}
  </button>
);

export default App;
