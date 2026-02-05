import React, { useState, useEffect } from 'react';
import { Quote, QuoteType, Supplier, ReportRecord, ReportListItem, SystemSettings, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import SystemSettingsView from './components/SystemSettingsView';
import ProtocolView from './components/ProtocolView';
import { 
  Layout, Settings, Menu, LogOut, Loader2, 
  FileSpreadsheet, Monitor, ClipboardCheck, History, 
  Wrench, Tv, Notebook
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const toSnakeCase = (obj: any) => {
  const snake: any = {};
  for (const key in obj) {
    if (key === 'createdAt') snake['created_at'] = obj[key];
    else if (key === 'userId') snake['user_id'] = obj[key];
    else snake[key] = obj[key];
  }
  return snake;
};

const toCamelCase = (obj: any): any => {
  const camel: any = {};
  for (const key in obj) {
    if (key === 'created_at') camel['createdAt'] = obj[key];
    else if (key === 'user_id') camel['userId'] = obj[key];
    else camel[key] = obj[key];
  }
  return camel;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]); 
  const [reportListItems, setReportListItems] = useState<ReportListItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    name: "MECÂNICA VOLUS",
    subtitle: "SISTEMA INTEGRADO DE ORÇAMENTOS",
    logoUrl: null,
    primaryColor: "indigo-600",
    users: []
  });

  const currentUserRole: UserRole = (() => {
    if (isDemoMode) return 'ADMIN';
    if (!session?.user?.email) return 'ADMIN';
    const email = session.user.email.toLowerCase().trim();
    const userMatch = systemSettings.users?.find(u => u.email.toLowerCase() === email);
    return userMatch ? userMatch.role : 'ADMIN'; 
  })();

  useEffect(() => {
    if (currentUserRole === 'PROTOCOLO' && activeView !== 'protocol') setActiveView('protocol');
    if (currentUserRole === 'TV' && activeView !== 'tv_view') setActiveView('tv_view');
    if (currentUserRole === 'OFICINA' && !['oficina_cadastro', 'protocol'].includes(activeView)) setActiveView('oficina_cadastro');
  }, [currentUserRole, activeView]);

  const protocolPendingCount = reportRecords.filter(r => 
    ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregue_relatorio?.toUpperCase())
  ).length;

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession);
        if (currentSession) fetchData();
        else setLoading(false);
      } catch (err: any) {
        console.error("Erro Supabase:", err);
        setLoading(false);
      }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (isDemoMode) return;
    if (!isSupabaseConfigured) return;
    
    setLoading(true);
    try {
      const [quotesRes, suppliersRes, reportsRes, listsRes, settingsRes] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('report_records').select('*').order('created_at', { ascending: false }),
        supabase.from('report_list_items').select('*').order('value'),
        supabase.from('system_settings').select('*').limit(1).maybeSingle()
      ]);
      
      if (quotesRes.data) setQuotes(quotesRes.data.map(q => toCamelCase(q)) as any);
      if (suppliersRes.data) setSuppliers(suppliersRes.data as any);
      if (reportsRes.data) setReportRecords(reportsRes.data.map(r => toCamelCase(r)) as any);
      if (listsRes.data) setReportListItems(listsRes.data as any);
      if (settingsRes.data) {
        setSystemSettings(settingsRes.data as SystemSettings);
        localStorage.setItem('system_brand_v1', JSON.stringify(settingsRes.data));
      }
    } catch (e) { 
      console.error("Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSaveQuotes = async (newQuotes: Quote[]) => {
    const quotesWithUser = newQuotes.map(q => ({
      ...q,
      userId: session?.user?.id
    }));

    if (isDemoMode) {
      const updated = [...quotes, ...quotesWithUser];
      setQuotes(updated);
      return;
    }

    try {
      const { error } = await supabase.from('quotes').insert(quotesWithUser.map(q => toSnakeCase(q)));
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Save Quotes Error:", err);
      alert("Erro ao salvar orçamentos no histórico.");
    }
  };

  const handleSaveReportRecord = async (newRecord: Omit<ReportRecord, 'id' | 'createdAt'>) => {
    const recordWithMeta = {
      ...newRecord,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      userId: session?.user?.id
    };

    if (isDemoMode) {
      setReportRecords([...reportRecords, recordWithMeta as any]);
      return;
    }

    try {
      const { error } = await supabase.from('report_records').insert(toSnakeCase(recordWithMeta));
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error("Save Record Error:", err);
      alert(`Erro ao salvar no servidor: ${err.message}. Verifique as colunas no banco de dados.`);
    }
  };

  const handleUpdateReportRecord = async (id: string, updatedFields: Partial<ReportRecord>) => {
    if (isDemoMode) {
      setReportRecords(reportRecords.map(r => r.id === id ? { ...r, ...updatedFields } : r));
      return;
    }
    try {
      const { error } = await supabase.from('report_records').update(toSnakeCase(updatedFields)).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error("Update Record Error:", err);
      alert(`Erro ao atualizar: ${err.message}`);
    }
  };

  const handleDeleteReportRecord = async (id: string) => {
    if (!confirm("Excluir este lançamento permanentemente?")) return;
    if (isDemoMode) {
      setReportRecords(reportRecords.filter(r => r.id !== id));
      return;
    }
    try {
      const { error } = await supabase.from('report_records').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Delete Record Error:", err);
    }
  };

  const handleUpdateListItems = async (items: ReportListItem[]) => {
    if (isDemoMode) {
      setReportListItems(items);
      return true;
    }
    try {
      await supabase.from('report_list_items').delete().neq('id', '000'); 
      const { error } = await supabase.from('report_list_items').insert(items);
      if (error) throw error;
      fetchData();
      return true;
    } catch (err) {
      console.error("Update Lists Error:", err);
      return false;
    }
  };

  const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    if (isSupabaseConfigured && session?.user && !isDemoMode) {
      try {
        const { data: existing } = await supabase.from('system_settings').select('id').limit(1).maybeSingle();
        if (existing) await supabase.from('system_settings').update(newSettings).eq('id', existing.id);
        else await supabase.from('system_settings').insert({ ...newSettings, user_id: session.user.id });
      } catch (err) {
        console.error("Settings Error:", err);
      }
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) setIsDemoMode(false);
    else if (isSupabaseConfigured) await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-50">Sincronizando Nuvem...</p>
      </div>
    </div>
  );

  if (!session && !isDemoMode) {
    return <Auth branding={systemSettings} />;
  }

  const canSee = (roles: UserRole[]) => roles.includes(currentUserRole);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
            <div className={`w-10 h-10 bg-${systemSettings.primaryColor} rounded-xl flex items-center justify-center shadow-lg`}>
              <Notebook className="text-white" size={24} />
            </div>
            <h1 className="text-white font-black text-lg uppercase tracking-tighter italic truncate">{systemSettings.name}</h1>
          </div>
          <nav className="flex-1 space-y-1">
            {canSee(['ADMIN']) && (
              <>
                <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} color={systemSettings.primaryColor} onClick={() => setActiveView('dashboard')} />
                <NavItem icon={<History size={20} />} label="Histórico" active={activeView === 'history'} color={systemSettings.primaryColor} onClick={() => setActiveView('history')} />
                <NavItem icon={<FileSpreadsheet size={20} />} label="Relatórios" active={activeView === 'reports'} color={systemSettings.primaryColor} onClick={() => setActiveView('reports')} />
              </>
            )}
            {canSee(['ADMIN', 'PROTOCOLO', 'OFICINA']) && (
              <NavItem icon={<ClipboardCheck size={20} />} label="Protocolo" active={activeView === 'protocol'} color={systemSettings.primaryColor} badge={protocolPendingCount > 0 ? protocolPendingCount : undefined} onClick={() => setActiveView('protocol')} />
            )}
            {canSee(['ADMIN', 'OFICINA']) && (
              <NavItem icon={<Wrench size={20} />} label="Serviços Oficina" active={activeView === 'oficina_cadastro'} color={systemSettings.primaryColor} onClick={() => setActiveView('oficina_cadastro')} />
            )}
            {canSee(['ADMIN', 'TV']) && (
              <NavItem icon={<Tv size={20} />} label="Painel Smart TV" active={activeView === 'tv_view'} color={systemSettings.primaryColor} onClick={() => setActiveView('tv_view')} />
            )}
            {canSee(['ADMIN']) && (
              <>
                <NavItem icon={<Settings size={20} />} label="Sistema / Acessos" active={activeView === 'system'} color={systemSettings.primaryColor} onClick={() => setActiveView('system')} />
              </>
            )}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Perfil: {currentUserRole}</p>
              <p className="text-[10px] font-bold text-slate-300 truncate">{isDemoMode ? 'MODO TESTE' : session?.user?.email}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-rose-400 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 rounded-xl transition-all"><LogOut size={16} /> Sair</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={24} /></button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shadow-xl">
               {currentUserRole.charAt(0)}
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8 w-full">
          {activeView === 'dashboard' && <><QuoteForm onSave={handleSaveQuotes} suppliers={suppliers} /><QuoteList quotes={quotes.slice(0, 5)} onDelete={() => fetchData()} /></>}
          {activeView === 'history' && <HistoryView quotes={quotes} onDelete={() => fetchData()} onUpdateQuote={() => fetchData()} />}
          {activeView === 'reports' && (
            <ReportsView 
              records={reportRecords} 
              listItems={reportListItems} 
              onSaveRecord={handleSaveReportRecord} 
              onUpdateRecord={handleUpdateReportRecord} 
              onDeleteRecord={handleDeleteReportRecord} 
              onUpdateListItems={handleUpdateListItems} 
            />
          )}
          {activeView === 'protocol' && <ProtocolView records={reportRecords} onConfirm={(id) => handleUpdateReportRecord(id, { entregue_relatorio: 'RECEBIDO - PROTOCOLADO' })} onUpdateRecord={handleUpdateReportRecord} />}
          {activeView === 'system' && <SystemSettingsView settings={systemSettings} onSave={handleUpdateSystemSettings} />}
          {activeView === 'oficina_cadastro' && <PlaceholderView title="Cadastro de Serviços Oficina" icon={<Wrench size={48}/>} subtitle="Módulo em breve." />}
          {activeView === 'tv_view' && <PlaceholderView title="Painel Smart TV" icon={<Tv size={48}/>} subtitle="Painel de acompanhamento." />}
        </div>
      </main>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, color, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${active ? `bg-${color} text-white shadow-xl shadow-${color}/30 translate-x-1` : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="flex-1 text-left">{label}</span>
    {badge && <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const PlaceholderView = ({ title, icon, subtitle }: any) => (
  <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
    <div className="text-slate-200 mb-6 flex justify-center">{icon}</div>
    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{title}</h2>
    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">{subtitle}</p>
  </div>
);

export default App;
