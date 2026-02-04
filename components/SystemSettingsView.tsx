import React, { useState, useRef } from 'react';
import { SystemSettings, SystemUser, UserRole } from '../types';
import { 
  Layout, Save, Palette, Check, Loader2, Upload, 
  Users, ShieldAlert, Trash2, Mail, Plus, UserCheck, 
  Link as LinkIcon, Copy, Shield
} from 'lucide-react';

interface SystemSettingsViewProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => Promise<void>;
}

const COLORS = [
  { name: 'Indigo', value: 'indigo-600', hex: '#4f46e5' },
  { name: 'Blue', value: 'blue-600', hex: '#2563eb' },
  { name: 'Emerald', value: 'emerald-600', hex: '#059669' },
  { name: 'Rose', value: 'rose-600', hex: '#e11d48' },
  { name: 'Slate', value: 'slate-900', hex: '#0f172a' },
  { name: 'Amber', value: 'amber-600', hex: '#d97706' },
];

const ROLES: { value: UserRole, label: string, desc: string }[] = [
  { value: 'ADMIN', label: 'Administrador', desc: 'Acesso total a todas as funções.' },
  { value: 'PROTOCOLO', label: 'Operador Protocolo', desc: 'Acesso exclusivo à aba de Protocolo.' },
  { value: 'OFICINA', label: 'Oficina / Mecânico', desc: 'Acesso à Oficina e Protocolo.' },
  { value: 'TV', label: 'Smart TV / Público', desc: 'Acesso apenas ao painel de acompanhamento.' },
];

const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SystemSettings>({ 
    ...settings, 
    users: settings.users || [] 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('PROTOCOLO');
  const [activeTab, setActiveTab] = useState<'visual' | 'access'>('visual');
  const [copyStatus, setCopyStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const addUser = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    const email = newEmail.toLowerCase().trim();
    if (formData.users?.find(u => u.email === email)) return;
    
    const newUser: SystemUser = {
      email,
      role: newRole,
      addedAt: Date.now()
    };
    
    setFormData(prev => ({
      ...prev,
      users: [...(prev.users || []), newUser]
    }));
    setNewEmail('');
  };

  const removeUser = (email: string) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users?.filter(u => u.email !== email) || []
    }));
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}`;
    navigator.clipboard.writeText(link);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase italic">Configuração do Sistema</h2>
        <p className="text-slate-500 font-medium">Personalize a identidade visual e controle quem pode acessar cada módulo.</p>
      </div>

      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button onClick={() => setActiveTab('visual')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'visual' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Identidade Visual</button>
        <button onClick={() => setActiveTab('access')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'access' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}>Acessos & Usuários</button>
      </div>

      {activeTab === 'visual' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Layout size={80} /></div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Preview</p>
               <div className="flex flex-col items-center text-center gap-4">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-20 h-20 object-contain rounded-2xl" /> : <div className={`w-20 h-20 bg-${formData.primaryColor} rounded-2xl flex items-center justify-center`}><Layout className="text-white" size={40} /></div>}
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">{formData.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{formData.subtitle}</p>
                  </div>
               </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cor do Sistema</h4>
               <div className="grid grid-cols-3 gap-3">
                  {COLORS.map(color => (
                    <button key={color.value} onClick={() => setFormData(prev => ({ ...prev, primaryColor: color.value }))} className={`h-10 rounded-xl transition-all border-2 ${formData.primaryColor === color.value ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: color.hex }} />
                  ))}
               </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <Input label="Nome da Empresa" value={formData.name} onChange={v => setFormData(p => ({...p, name: v}))} />
                <Input label="Subtítulo / Slogan" value={formData.subtitle} onChange={v => setFormData(p => ({...p, subtitle: v}))} />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logotipo URL</label>
                 <input type="text" value={formData.logoUrl || ''} onChange={e => setFormData(p => ({...p, logoUrl: e.target.value}))} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none" placeholder="https://..." />
              </div>
              <button onClick={handleSave} disabled={isSaving} className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} {isSaving ? 'SALVANDO...' : 'SALVAR IDENTIDADE'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
             <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                <LinkIcon className="mb-4" size={32} />
                <h4 className="text-xl font-black uppercase italic leading-none">Convidar Usuário</h4>
                <p className="text-[10px] font-bold leading-relaxed mt-4 uppercase opacity-80">
                  Envie este link para que o novo colaborador crie o login dele. Após o cadastro, o acesso será liberado automaticamente baseado no e-mail abaixo.
                </p>
                <button 
                  onClick={copyInviteLink}
                  className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  {copyStatus ? <Check size={16}/> : <Copy size={16}/>}
                  {copyStatus ? 'COPIADO!' : 'COPIAR LINK DE CADASTRO'}
                </button>
             </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> Adicionar Novo Usuário Manualmente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">E-mail do Usuário</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-bold" placeholder="colaborador@volus.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Perfil de Acesso</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-xs font-bold uppercase">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{ROLES.find(r => r.value === newRole)?.desc}</p>
                </div>
                <button onClick={addUser} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><UserCheck size={18}/> VINCULAR USUÁRIO AO SISTEMA</button>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuários Ativos ({formData.users?.length || 0})</h4>
                <div className="space-y-3">
                  {formData.users?.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl"><p className="text-slate-400 text-[10px] font-black uppercase">Nenhum usuário cadastrado</p></div>
                  ) : (
                    formData.users?.map(user => (
                      <div key={user.email} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Shield size={18}/></div>
                            <div>
                               <p className="text-xs font-black text-slate-900 uppercase">{user.email}</p>
                               <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">{user.role}</span>
                            </div>
                         </div>
                         <button onClick={() => removeUser(user.email)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={handleSave} disabled={isSaving} className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} SALVAR TODAS AS PERMISSÕES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold uppercase text-xs" />
  </div>
);

export default SystemSettingsView;
