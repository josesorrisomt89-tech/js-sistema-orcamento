
import React, { useState, useMemo, useEffect } from 'react';
import { ReportRecord, ReportListItem } from '../types';
import { 
  FileSpreadsheet, Download, Plus, Search, X, Trash2, Settings, Loader2, CheckCircle2, Edit2, DollarSign, Clock, CheckCircle, ClipboardList, Save
} from 'lucide-react';

export interface ReportsViewProps {
  records: ReportRecord[];
  listItems: ReportListItem[];
  onSaveRecord: (record: Omit<ReportRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecord: (id: string, record: Omit<ReportRecord, 'id' | 'createdAt'>) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateListItems: (items: ReportListItem[]) => Promise<any>;
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
  records, listItems, onSaveRecord, onUpdateRecord, onDeleteRecord, onUpdateListItems 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [activeConfigCategory, setActiveConfigCategory] = useState<'secretaria' | 'fornecedor' | 'status' | 'entrega'>('secretaria');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [localListItems, setLocalListItems] = useState<ReportListItem[]>([]);

  useEffect(() => {
    if (isConfigModalOpen) {
      setLocalListItems(listItems);
      setSaveSuccess(false);
    }
  }, [isConfigModalOpen, listItems]);

  const [formData, setFormData] = useState<Omit<ReportRecord, 'id' | 'createdAt'>>({
    data_recebido: new Date().toISOString().split('T')[0],
    prefixo: '',
    secretaria: '',
    descricao: '',
    num_pedido_oficina: '',
    oficina_tipo: 'TERCERIZADA',
    data_lancamento_volus: '',
    num_orc_volus_pecas: '',
    num_orc_volus_serv: '',
    data_aprovacao_volus: '',
    num_orc_aprovado: '',
    valor_total: '',
    nota_fiscal: '',
    fornecedor: '',
    responsavel: '',
    status: '',
    entregue_relatorio: '',
    observacao: ''
  });

  const resetForm = () => {
    setFormData({
      data_recebido: new Date().toISOString().split('T')[0],
      prefixo: '',
      secretaria: '',
      descricao: '',
      num_pedido_oficina: '',
      oficina_tipo: 'TERCERIZADA',
      data_lancamento_volus: '',
      num_orc_volus_pecas: '',
      num_orc_volus_serv: '',
      data_aprovacao_volus: '',
      num_orc_aprovado: '',
      valor_total: '',
      nota_fiscal: '',
      fornecedor: '',
      responsavel: '',
      status: '',
      entregue_relatorio: '',
      observacao: ''
    });
    setEditingRecordId(null);
  };

  const handleEditClick = (record: ReportRecord) => {
    setEditingRecordId(record.id);
    setFormData({
      data_recebido: record.data_recebido || '',
      prefixo: record.prefixo || '',
      secretaria: record.secretaria || '',
      descricao: record.descricao || '',
      num_pedido_oficina: record.num_pedido_oficina || '',
      oficina_tipo: record.oficina_tipo || 'TERCERIZADA',
      data_lancamento_volus: record.data_lancamento_volus || '',
      num_orc_volus_pecas: record.num_orc_volus_pecas || '',
      num_orc_volus_serv: record.num_orc_volus_serv || '',
      data_aprovacao_volus: record.data_aprovacao_volus || '',
      num_orc_aprovado: record.num_orc_aprovado || '',
      valor_total: record.valor_total || '',
      nota_fiscal: record.nota_fiscal || '',
      fornecedor: record.fornecedor || '',
      responsavel: record.responsavel || '',
      status: record.status || '',
      entregue_relatorio: record.entregue_relatorio || '',
      observacao: record.observacao || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecordId) {
      onUpdateRecord(editingRecordId, formData);
    } else {
      onSaveRecord(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (r.fornecedor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.prefixo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.secretaria?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.nota_fiscal?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Relatório de Compras</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestão de Peças e Serviços</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsConfigModalOpen(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 border border-white/5 transition-all"><Settings size={20} /></button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-4 bg-indigo-500 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all flex items-center gap-2">
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 mx-2 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Pesquisar fornecedor, prefixo, secretaria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {filteredRecords.length} REGISTROS
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-xl overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[2800px]">
            <thead>
              <tr className="bg-slate-900 text-slate-400">
                <th className="px-4 py-4 text-[9px] font-black uppercase sticky left-0 bg-slate-900 z-10 border-r border-slate-800">Ações</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Recebido</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Prefixo</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Secretaria</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Descrição</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Nº Pedido</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Oficina</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Lanç. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Orç Peças</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Orç Serv</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Aprov. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Nº Aprovado</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Valor Total</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Nota Fiscal</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Fornecedor</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Responsável</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                      <button onClick={() => handleEditClick(r)} className="text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteRecord(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold border-r">{r.data_recebido}</td>
                  <td className="px-4 py-4 text-[11px] font-black uppercase text-indigo-600 border-r">{r.prefixo}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-bold border-r">{r.secretaria}</td>
                  <td className="px-4 py-4 text-[11px] uppercase border-r max-w-xs truncate">{r.descricao}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-center border-r">{r.num_pedido_oficina}</td>
                  <td className="px-4 py-4 text-[10px] font-black text-center border-r uppercase">{r.oficina_tipo}</td>
                  <td className="px-4 py-4 text-[11px] text-center border-r">{r.data_lancamento_volus}</td>
                  <td className="px-4 py-4 text-[11px] text-center font-bold border-r">{r.num_orc_volus_pecas}</td>
                  <td className="px-4 py-4 text-[11px] text-center font-bold border-r">{r.num_orc_volus_serv}</td>
                  <td className="px-4 py-4 text-[11px] text-center border-r">{r.data_aprovacao_volus}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-emerald-600 text-center border-r uppercase">{r.num_orc_aprovado}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-center border-r">R$ {r.valor_total}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-center border-r uppercase">{r.nota_fiscal}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-black border-r">{r.fornecedor}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-bold border-r">{r.responsavel}</td>
                  <td className="px-4 py-4 text-center border-r">
                    <span className="text-[9px] font-black px-2 py-1 bg-slate-100 rounded uppercase">{r.status}</span>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-center uppercase border-r">{r.entregue_relatorio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase">{editingRecordId ? 'Editar' : 'Novo'} Lançamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Data Recebido" type="date" value={formData.data_recebido} onChange={v => setFormData({...formData, data_recebido: v})} />
                <Field label="Prefixo Veículo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" type="select" options={listItems.filter(i => i.category === 'secretaria').map(i => i.value)} value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>
              <Field label="Descrição" value={formData.descricao} onChange={v => setFormData({...formData, descricao: v})} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Pedido Oficina" value={formData.num_pedido_oficina} onChange={v => setFormData({...formData, num_pedido_oficina: v})} />
                <Field label="Data Lançamento Volus" type="date" value={formData.data_lancamento_volus} onChange={v => setFormData({...formData, data_lancamento_volus: v})} />
                <Field label="Data Aprovação Volus" type="date" value={formData.data_aprovacao_volus} onChange={v => setFormData({...formData, data_aprovacao_volus: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Orç Peças Volus" value={formData.num_orc_volus_pecas} onChange={v => setFormData({...formData, num_orc_volus_pecas: v})} />
                <Field label="Orç Serv Volus" value={formData.num_orc_volus_serv} onChange={v => setFormData({...formData, num_orc_volus_serv: v})} />
                <Field label="Nº Orç Aprovado" value={formData.num_orc_aprovado} onChange={v => setFormData({...formData, num_orc_aprovado: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Valor Total" value={formData.valor_total} onChange={v => setFormData({...formData, valor_total: v})} />
                <Field label="Nota Fiscal" value={formData.nota_fiscal} onChange={v => setFormData({...formData, nota_fiscal: v})} />
                <Field label="Fornecedor" type="select" options={listItems.filter(i => i.category === 'fornecedor').map(i => i.value)} value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status" type="select" options={listItems.filter(i => i.category === 'status').map(i => i.value)} value={formData.status} onChange={v => setFormData({...formData, status: v})} />
                <Field label="Protocolo / Entrega" type="select" options={listItems.filter(i => i.category === 'entrega').map(i => i.value)} value={formData.entregue_relatorio} onChange={v => setFormData({...formData, entregue_relatorio: v})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                <Save size={20} /> Salvar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, type = "text", value, onChange, options = [] }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {type === 'select' ? (
      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase focus:ring-2 focus:ring-indigo-500 transition-all" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">SELECIONE...</option>
        {options.map((o:any) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase focus:ring-2 focus:ring-indigo-500 transition-all" value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

export default ReportsView;
