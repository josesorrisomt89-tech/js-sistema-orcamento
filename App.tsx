import React, { useState, useEffect, useRef } from 'react';
import { Quote, QuoteType, Supplier, ReportRecord, ReportListItem, SystemSettings, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Auth } from './components/Auth';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import SettingsView from './components/SettingsView';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import SystemSettingsView from './components/SystemSettingsView';
import ProtocolView from './components/ProtocolView';
import { 
  Layout, Settings, Menu, X, LogOut, Loader2, AlertTriangle, 
  ArrowRight, FileSpreadsheet, Monitor, ClipboardCheck, History, 
  Wrench, Tv, Notebook
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';

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
    ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregueRelatorio?.toUpperCase())
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

  useEffect(() => {
    const savedBrand = localStorage.getItem('system_brand_v1');
    if (savedBrand) {
      try { setSystemSettings(JSON.parse(savedBrand)); } catch (e) {}
    }
    if (isDemoMode) {
      const savedQuotes = localStorage.getItem('demo_quotes_v2');
      const savedReports = localStorage.getItem('demo_reports_v2');
      const savedLists = localStorage.getItem('demo_lists_v2');
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
      if (savedReports) setReportRecords(JSON.parse(savedReports));
      if (savedLists) setReportListItems(JSON.parse(savedLists));
      setLoading(false);
    }
  }, [isDemoMode]);

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
      
      if (quotesRes.data) setQuotes(quotesRes.data as any);
      if (suppliersRes.data) setSuppliers(suppliersRes.data as any);
      if (reportsRes.data) setReportRecords(reportsRes.data as any);
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

  const handleSaveReportRecord = async (newRecord: Omit<ReportRecord, 'id' | 'createdAt'>) => {
    const recordWithMeta = {
      ...newRecord,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };

    if (isDemoMode) {
      const updated = [...reportRecords, recordWithMeta];
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase.from('report_records').insert(recordWithMeta);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Save Record Error:", err);
      alert("Erro ao salvar registro no servidor.");
    }
  };

  const handleUpdateReportRecord = async (id: string, updatedFields: Partial<ReportRecord>) => {
    if (isDemoMode) {
      const updated = reportRecords.map(r => r.id === id ? { ...r, ...updatedFields } : r);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
      return;
    }
    try {
      const { error } = await supabase.from('report_records').update(updatedFields).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Update Record Error:", err);
      alert("Erro ao atualizar registro.");
    }
  };

  const handleDeleteReportRecord = async (id: string) => {
    if (!confirm("Excluir este lançamento permanentemente?")) return;

    if (isDemoMode) {
      const updated = reportRecords.filter(r => r.id !== id);
      setReportRecords(updated);
      localStorage.setItem('demo_reports_v2', JSON.stringify(updated));
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
      localStorage.setItem('demo_lists_v2', JSON.stringify(items));
      return true;
    }

    try {
      // No Supabase, deletamos os antigos e inserimos os novos para sincronizar
      // Nota: Em um sistema maior, usaríamos upsert ou sync individual
      await supabase.from('report_list_items').delete().neq('id', '000'); // Limpa
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
    localStorage.setItem('system_brand_v1', JSON.stringify(newSettings));
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
    const hasEnvUrl = typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL;
    if (!isSupabaseConfigured && !hasEnvUrl) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto text-amber-600"><AlertTriangle size={40} /></div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Configuração Necessária</h1>
            <p className="text-slate-500 font-medium text-sm">As variáveis de ambiente do Supabase não foram encontradas. Adicione SUPABASE_URL e SUPABASE_ANON_KEY nas configurações.</p>
            <div className="space-y-3">
               <button onClick={() => window.location.reload()} className="w-full bg-slate-100 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Recarregar Página</button>
               <button onClick={() => setIsDemoMode(true)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest">Entrar em Modo Teste Local</button>
            </div>
          </div>
        </div>
      );
    }
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
              <NavItem 
                icon={<ClipboardCheck size={20} />} 
                label="Protocolo" 
                active={activeView === 'protocol'} 
                color={systemSettings.primaryColor} 
                badge={protocolPendingCount > 0 ? protocolPendingCount : undefined}
                onClick={() => setActiveView('protocol')} 
              />
            )}

            {canSee(['ADMIN', 'OFICINA']) && (
              <NavItem icon={<Wrench size={20} />} label="Serviços Oficina" active={activeView === 'oficina_cadastro'} color={systemSettings.primaryColor} onClick={() => setActiveView('oficina_cadastro')} />
            )}

            {canSee(['ADMIN', 'TV']) && (
              <NavItem icon={<Tv size={20} />} label="Painel Smart TV" active={activeView === 'tv_view'} color={systemSettings.primaryColor} onClick={() => setActiveView('tv_view')} />
            )}

            {canSee(['ADMIN']) && (
              <>
                <NavItem icon={<Settings size={20} />} label="Fornecedores" active={activeView === 'settings'} color={systemSettings.primaryColor} onClick={() => setActiveView('settings')} />
                <NavItem icon={<Monitor size={20} />} label="Sistema / Acessos" active={activeView === 'system'} color={systemSettings.primaryColor} onClick={() => setActiveView('system')} />
              </>
            )}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Perfil: {currentUserRole}</p>
              <p className="text-[10px] font-bold text-slate-300 truncate">{isDemoMode ? 'MODO TESTE' : session?.user.email}</p>
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
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{systemSettings.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentUserRole}</p>
             </div>
             <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shadow-xl">
               {currentUserRole.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 w-full">
          {activeView === 'dashboard' && <><QuoteForm onSave={() => fetchData()} suppliers={suppliers} /><QuoteList quotes={quotes.slice(0, 1)} onDelete={() => {}} /></>}
          {activeView === 'history' && <HistoryView quotes={quotes} onDelete={() => {}} onUpdateQuote={() => {}} />}
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
          {activeView === 'protocol' && <ProtocolView records={reportRecords} onConfirm={(id) => handleUpdateReportRecord(id, { entregueRelatorio: 'RECEBIDO - PROTOCOLADO' })} onUpdateRecord={handleUpdateReportRecord} />}
          {activeView === 'system' && <SystemSettingsView settings={systemSettings} onSave={handleUpdateSystemSettings} />}
          {activeView === 'oficina_cadastro' && <PlaceholderView title="Cadastro de Serviços Oficina" icon={<Wrench size={48}/>} subtitle="Em breve: Gestão completa de ordens de serviço interna." />}
          {activeView === 'tv_view' && <PlaceholderView title="Painel Smart TV" icon={<Tv size={48}/>} subtitle="Em breve: Tela de acompanhamento em tempo real para clientes." />}
        </div>
      </main>
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
  <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm animate-in zoom-in duration-500">
    <div className="text-slate-200 mb-6 flex justify-center">{icon}</div>
    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{title}</h2>
    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">{subtitle}</p>
    <div className="mt-10 inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">Módulo em Desenvolvimento</div>
  </div>
);

export default App;
