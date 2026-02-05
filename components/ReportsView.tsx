
import React, { useState, useMemo, useEffect } from 'react';
import { ReportRecord, ReportListItem } from '../types';
import { 
  FileSpreadsheet, Download, Plus, Search, X, Trash2, Settings, Loader2, CheckCircle2, Edit2, DollarSign, Clock, CheckCircle, ClipboardList
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
    data_lancamento: '',
    num_orc_pecas: '',
    num_orc_serv: '',
    data_aprovacao: '',
    num_orc_aprovado: '',
    valor_total: '',
    nota_fiscal: '',
    fornecedor: '',
    responsavel: '',
    status: '',
    entregue_relatorio: '',
    observacao: ''
  });

  const stats = useMemo(() => {
    const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
    };
    return {
      totalValor: records.reduce((acc, r) => acc + parseCurrency(r.valor_total), 0),
      aguardandoOrc: records.filter(r => r.status?.toUpperCase().includes('AGUARDANDO ORÇAMENTO')).length,
      aprovados: records.filter(r => r.status?.toUpperCase() === 'APROVADO' || r.status?.toUpperCase() === 'AUTORIZADO').length,
      aguardandoProtocolo: records.filter(r => r.entregue_relatorio?.toUpperCase().includes('PROTOCOLO')).length,
      concluidos: records.filter(r => r.status?.toUpperCase() === 'CONCLUÍDO' || r.status?.toUpperCase() === 'FINALIZADO').length,
    };
  }, [records]);

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

  const resetForm = () => {
    setFormData({
      data_recebido: new Date().toISOString().split('T')[0],
      prefixo: '',
      secretaria: '',
      descricao: '',
      num_pedido_oficina: '',
      oficina_tipo: 'TERCERIZADA',
      data_lancamento: '',
      num_orc_pecas: '',
      num_orc_serv: '',
      data_aprovacao: '',
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
      data_lancamento: record.data_lancamento || '',
      num_orc_pecas: record.num_orc_pecas || '',
      num_orc_serv: record.num_orc_serv || '',
      data_aprovacao: record.data_aprovacao || '',
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

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (r.fornecedor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.prefixo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.secretaria?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, searchTerm]);

  const exportToCSV = () => {
    const headers = ['Data Recebido', 'Prefixo', 'Secretaria', 'Descrição', 'Nº Pedido Oficina', 'Oficina', 'Lanç. Volus', 'Orç Peças', 'Orç Serv', 'Aprov. Volus', 'Nº Aprovado', 'Valor Total', 'NF', 'Fornecedor', 'Responsável', 'Status', 'Entrega', 'Obs'];
    const rows = filteredRecords.map(r => [
      r.data_recebido, r.prefixo, r.secretaria, r.descricao.replace(/;/g, ','), r.num_pedido_oficina, r.oficina_tipo, r.data_lancamento, r.num_orc_pecas, r.num_orc_serv, r.data_aprovacao, r.num_orc_aprovado, r.valor_total, r.nota_fiscal, r.fornecedor, r.responsavel, r.status, r.entregue_relatorio, r.observacao.replace(/;/g, ',')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h2 className="text-3xl font-black italic uppercase">Relatório de Compras</h2></div>
        <div className="flex gap-3">
          <button onClick={() => setIsConfigModalOpen(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20"><Settings size={20} /></button>
          <button onClick={exportToCSV} className="px-6 py-3 bg-white/10 rounded-xl font-black text-[10px] uppercase">CSV</button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-4 bg-indigo-500 rounded-2xl font-black text-[11px] uppercase tracking-widest">Novo Lançamento</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard icon={<DollarSign size={24} />} label="Total" value={`R$ ${stats.totalValor.toLocaleString()}`} color="bg-slate-900" />
        <StatCard icon={<Clock size={24} />} label="Pendentes" value={stats.aguardandoOrc.toString()} color="bg-amber-500" />
        <StatCard icon={<CheckCircle2 size={24} />} label="Aprovados" value={stats.aprovados.toString()} color="bg-blue-600" />
        <StatCard icon={<ClipboardList size={24} />} label="Protocolo" value={stats.aguardandoProtocolo.toString()} color="bg-purple-600" />
        <StatCard icon={<CheckCircle size={24} />} label="Concluídos" value={stats.concluidos.toString()} color="bg-emerald-600" />
      </div>

      <div className="bg-white p-4 rounded-2xl border flex items-center gap-4">
        <Search className="text-slate-400" size={18} />
        <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none font-bold text-xs uppercase" />
      </div>

      <div className="bg-white rounded-[2rem] border shadow-xl overflow-x-auto">
        <table className="w-full text-left min-w-[2000px]">
          <thead>
            <tr className="bg-slate-900 text-slate-400">
              <th className="px-4 py-4 text-[9px] font-black uppercase sticky left-0 bg-slate-900">Ações</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Recebido</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Prefixo</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Secretaria</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Descrição</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Nº Pedido</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Oficina</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Orç Peças</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Orç Serv</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Nº Aprovado</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Valor</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Fornecedor</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRecords.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50"><div className="flex gap-2"><Edit2 size={16} onClick={() => handleEditClick(r)} className="cursor-pointer"/><Trash2 size={16} onClick={() => onDeleteRecord(r.id)} className="cursor-pointer text-rose-500"/></div></td>
                <td className="px-4 py-4 text-[11px] font-bold">{r.data_recebido}</td>
                <td className="px-4 py-4 text-[11px] font-black uppercase text-indigo-600">{r.prefixo}</td>
                <td className="px-4 py-4 text-[11px] uppercase">{r.secretaria}</td>
                <td className="px-4 py-4 text-[11px] uppercase max-w-xs truncate">{r.descricao}</td>
                <td className="px-4 py-4 text-[11px] font-bold">{r.num_pedido_oficina}</td>
                <td className="px-4 py-4 text-[11px] uppercase">{r.oficina_tipo}</td>
                <td className="px-4 py-4 text-[11px]">{r.num_orc_pecas}</td>
                <td className="px-4 py-4 text-[11px]">{r.num_orc_serv}</td>
                <td className="px-4 py-4 text-[11px] font-black text-emerald-600">{r.num_orc_aprovado}</td>
                <td className="px-4 py-4 text-[11px] font-black">R$ {r.valor_total}</td>
                <td className="px-4 py-4 text-[11px] uppercase">{r.fornecedor}</td>
                <td className="px-4 py-4 text-[11px] uppercase">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex items-center justify-between"><h3 className="text-2xl font-black uppercase">{editingRecordId ? 'Editar' : 'Novo'} Lançamento</h3><X className="cursor-pointer" onClick={() => setIsModalOpen(false)}/></div>
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Recebido" type="date" value={formData.data_recebido} onChange={v => setFormData({...formData, data_recebido: v})} />
                <Field label="Prefixo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" type="select" options={listItems.filter(i => i.category === 'secretaria').map(i => i.value)} value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>
              <Field label="Descrição" value={formData.descricao} onChange={v => setFormData({...formData, descricao: v})} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Lanç. Volus" type="date" value={formData.data_lancamento} onChange={v => setFormData({...formData, data_lancamento: v})} />
                <Field label="Orç Peças" value={formData.num_orc_pecas} onChange={v => setFormData({...formData, num_orc_pecas: v})} />
                <Field label="Orç Serv" value={formData.num_orc_serv} onChange={v => setFormData({...formData, num_orc_serv: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Aprovado" value={formData.num_orc_aprovado} onChange={v => setFormData({...formData, num_orc_aprovado: v})} />
                <Field label="Valor" value={formData.valor_total} onChange={v => setFormData({...formData, valor_total: v})} />
                <Field label="NF" value={formData.nota_fiscal} onChange={v => setFormData({...formData, nota_fiscal: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status" type="select" options={listItems.filter(i => i.category === 'status').map(i => i.value)} value={formData.status} onChange={v => setFormData({...formData, status: v})} />
                <Field label="Entrega" type="select" options={listItems.filter(i => i.category === 'entrega').map(i => i.value)} value={formData.entregue_relatorio} onChange={v => setFormData({...formData, entregue_relatorio: v})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase shadow-2xl">Salvar</button>
            </form>
          </div>
        </div>
      )}

      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 flex flex-col gap-6">
             <div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase">Configurar Listas</h3><X className="cursor-pointer" onClick={() => setIsConfigModalOpen(false)}/></div>
             <div className="flex bg-slate-100 p-1 rounded-xl">
               {(['secretaria', 'fornecedor', 'status', 'entrega'] as const).map(c => <button key={c} onClick={() => setActiveConfigCategory(c)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${activeConfigCategory === c ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>{c}</button>)}
             </div>
             <div className="flex gap-2">
                <input type="text" value={newItemValue} onChange={e => setNewItemValue(e.target.value)} className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold uppercase" />
                <button onClick={() => { if(newItemValue) { setLocalListItems([...localListItems, {id: crypto.randomUUID(), category: activeConfigCategory, value: newItemValue.toUpperCase()}]); setNewItemValue(''); } }} className="px-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Add</button>
             </div>
             <div className="max-h-60 overflow-y-auto space-y-2">
                {localListItems.filter(i => i.category === activeConfigCategory).map(item => (
                  <div key={item.id} className="flex justify-between p-3 bg-slate-50 rounded-xl border">
                    <span className="text-xs font-bold uppercase">{item.value}</span>
                    <Trash2 size={14} className="cursor-pointer text-slate-300 hover:text-rose-500" onClick={() => setLocalListItems(localListItems.filter(i => i.id !== item.id))}/>
                  </div>
                ))}
             </div>
             <button onClick={async () => { setIsSaving(true); if(await onUpdateListItems(localListItems)) { setSaveSuccess(true); setTimeout(() => setIsConfigModalOpen(false), 500); } setIsSaving(false); }} className={`w-full py-4 text-white font-black rounded-2xl uppercase text-[10px] ${saveSuccess ? 'bg-emerald-500' : 'bg-slate-900'}`}>{isSaving ? 'Salvando...' : 'Salvar Listas'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`p-6 rounded-[2rem] ${color} text-white flex items-center gap-4`}>
    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black uppercase opacity-60 truncate">{label}</p>
      <h3 className="text-lg font-black truncate">{value}</h3>
    </div>
  </div>
);

const Field = ({ label, type = "text", value, onChange, options = [] }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-500 uppercase">{label}</label>
    {type === 'select' ? (
      <select className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-xs uppercase" value={value} onChange={e => onChange(e.target.value)}><option value="">SELECIONE...</option>{options.map((o:any) => <option key={o} value={o}>{o}</option>)}</select>
    ) : (
      <input type={type} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-xs uppercase" value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

export default ReportsView;
