
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
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchData = async () => {
    if (isDemoMode || !isSupabaseConfigured) return;
    setLoading(true);
    try {
      const [quotesRes, suppliersRes, reportsRes, listsRes, settingsRes] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('report_records').select('*').order('created_at', { ascending: false }),
        supabase.from('report_list_items').select('*').order('value'),
        supabase.from('system_settings').select('*').limit(1).maybeSingle()
      ]);
      
      if (quotesRes.data) setQuotes(quotesRes.data.map(q => toCamelCase(q)));
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
      if (reportsRes.data) setReportRecords(reportsRes.data.map(r => toCamelCase(r)));
      if (listsRes.data) setReportListItems(listsRes.data);
      if (settingsRes.data) setSystemSettings(settingsRes.data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      const payload = toSnakeCase(recordWithMeta);
      const { error } = await supabase.from('report_records').insert(payload);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Erro no banco: ${err.message}. Verifique se as colunas estão corretas.`);
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
      alert(`Erro ao atualizar: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (!session && !isDemoMode) return <Auth branding={systemSettings} />;

  const canSee = (roles: UserRole[]) => roles.includes(currentUserRole);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
            <Notebook className="text-white" />
            <h1 className="text-white font-black text-lg uppercase italic truncate">{systemSettings.name}</h1>
          </div>
          <nav className="flex-1 space-y-1">
             <NavItem icon={<Layout size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
             <NavItem icon={<FileSpreadsheet size={20} />} label="Relatórios" active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
             <NavItem icon={<ClipboardCheck size={20} />} label="Protocolo" active={activeView === 'protocol'} onClick={() => setActiveView('protocol')} />
             <NavItem icon={<Settings size={20} />} label="Sistema" active={activeView === 'system'} onClick={() => setActiveView('system')} />
          </nav>
          <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-3 py-3 text-rose-400 font-black uppercase text-[10px] tracking-widest"><LogOut size={16} /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full bg-slate-50/50">
        <header className="h-16 bg-white border-b sticky top-0 z-30 px-6 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden"><Menu /></button>
          <div className="text-[10px] font-black uppercase text-slate-400">{currentUserRole}</div>
        </header>
        <div className="p-4 md:p-8">
          {activeView === 'dashboard' && <><QuoteForm onSave={(q) => {}} suppliers={suppliers} /><QuoteList quotes={quotes.slice(0, 3)} onDelete={() => {}} /></>}
          {activeView === 'reports' && <ReportsView records={reportRecords} listItems={reportListItems} onSaveRecord={handleSaveReportRecord} onUpdateRecord={handleUpdateReportRecord} onDeleteRecord={(id) => {}} onUpdateListItems={async (i) => {}} />}
          {activeView === 'protocol' && <ProtocolView records={reportRecords} onConfirm={(id) => handleUpdateReportRecord(id, { entregue_relatorio: 'RECEBIDO - PROTOCOLADO' })} />}
          {activeView === 'system' && <SystemSettingsView settings={systemSettings} onSave={async (s) => fetchData()} />}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
