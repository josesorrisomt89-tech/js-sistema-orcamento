
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { Layout, Save, Image as ImageIcon, Type, Palette, Check, RefreshCw, Loader2, Upload } from 'lucide-react';

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

const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Configuração do Sistema</h2>
        <p className="text-slate-500 font-medium">Personalize a identidade visual e o nome da sua plataforma SaaS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Preview */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Layout size={80} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Preview da Marca</p>
             <div className="flex flex-col items-center text-center gap-4">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Preview" className="w-20 h-20 object-contain rounded-2xl" />
                ) : (
                  <div className={`w-20 h-20 bg-${formData.primaryColor} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <Layout className="text-white" size={40} />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">{formData.name || 'Sua Empresa'}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{formData.subtitle || 'Subtítulo'}</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Palette size={14} /> Cor do Sistema
             </h4>
             <div className="grid grid-cols-3 gap-3">
                {COLORS.map(color => (
                  <button 
                    key={color.value}
                    onClick={() => setFormData(prev => ({ ...prev, primaryColor: color.value }))}
                    className={`h-10 rounded-xl transition-all border-2 ${formData.primaryColor === color.value ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
             </div>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-8">
            {/* Nome e Subtítulo */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase text-xs"
                    placeholder="Ex: MECÂNICA VOLUS"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subtítulo / Slogan</label>
                <input 
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold uppercase text-[10px] tracking-widest"
                  placeholder="Ex: GESTÃO DE ORÇAMENTOS"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Logotipo Personalizado</label>
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text"
                      placeholder="Link da imagem (URL)..."
                      value={formData.logoUrl && !formData.logoUrl.startsWith('data:') ? formData.logoUrl : ''}
                      onChange={e => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-xs"
                    />
                    <p className="text-[9px] text-slate-400 italic">Ou use um link direto para a sua logo online.</p>
                  </div>
                  <div className="flex-shrink-0">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-full px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest border border-slate-200 transition-all"
                    >
                      <Upload size={18} /> Upload
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </div>
               </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-6 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : showSuccess ? <Check size={20} /> : <Save size={20} />}
              {isSaving ? 'SALVANDO...' : showSuccess ? 'CONFIGURAÇÕES SALVAS!' : 'APLICAR ALTERAÇÕES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsView;
