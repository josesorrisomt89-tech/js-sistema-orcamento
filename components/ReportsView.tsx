import React, { useState, useMemo, useEffect } from 'react';
import { ReportRecord, ReportListItem } from '../types';
import { 
  FileSpreadsheet, Download, Plus, Search, X, Trash2, Settings, Loader2, CheckCircle2, Edit2, DollarSign, Clock, CheckCircle, ClipboardList, Info, Save
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
      (r.secretaria?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.nota_fiscal?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.num_orc_aprovado?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, searchTerm]);

  const exportToCSV = () => {
    const headers = [
      'Data Recebido', 'Prefixo', 'Secretaria', 'Descrição', 'Nº Pedido Oficina', 
      'Oficina', 'Lanç. Volus', 'Orç Peças', 'Orç Serv', 'Aprov. Volus', 
      'Nº Aprovado', 'Valor Total', 'Nota Fiscal', 'Fornecedor', 
      'Responsável', 'Status', 'Entrega', 'Observação'
    ];
    const rows = filteredRecords.map(r => [
      r.data_recebido, r.prefixo, r.secretaria, r.descricao.replace(/;/g, ','), r.num_pedido_oficina,
      r.oficina_tipo, r.data_lancamento, r.num_orc_pecas, r.num_orc_serv, r.data_aprovacao,
      r.num_orc_aprovado, r.valor_total, r.nota_fiscal, r.fornecedor,
      r.responsavel, r.status, r.entregue_relatorio, r.observacao.replace(/;/g, ',')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Relatório de Compras</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestão de Peças e Serviços</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsConfigModalOpen(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 border border-white/5 transition-all"><Settings size={20} /></button>
          <button onClick={exportToCSV} className="px-6 py-3 bg-white/10 rounded-xl font-black text-[10px] uppercase border border-white/5 hover:bg-white/20 transition-all flex items-center gap-2">
            <Download size={16} /> Exportar Completo
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-4 bg-indigo-500 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all flex items-center gap-2">
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 px-2">
        <StatCard icon={<DollarSign size={24} />} label="Total Investido" value={`R$ ${stats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="bg-slate-900" />
        <StatCard icon={<Clock size={24} />} label="Aguardando Orç." value={stats.aguardandoOrc.toString()} color="bg-amber-500" />
        <StatCard icon={<CheckCircle2 size={24} />} label="Aprovados" value={stats.aprovados.toString()} color="bg-blue-600" />
        <StatCard icon={<ClipboardList size={24} />} label="Fila Protocolo" value={stats.aguardandoProtocolo.toString()} color="bg-purple-600" />
        <StatCard icon={<CheckCircle size={24} />} label="Concluídos" value={stats.concluidos.toString()} color="bg-emerald-600" />
      </div>

      <div className="bg-white p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 mx-2 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Pesquisar por fornecedor, prefixo, secretaria ou nota fiscal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {filteredRecords.length} REGISTROS ENCONTRADOS
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
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Descrição Peças/Serv</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Nº Pedido Oficina</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Oficina</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Lanç. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Orç Peças</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Orç Serv</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Aprov. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center text-white">Nº Orç Aprovado</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Valor Total</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Nota Fiscal</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Fornecedor</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800">Responsável</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase border-r border-slate-800 text-center">Entrega</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                      <button onClick={() => handleEditClick(r)} className="text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteRecord(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-500 border-r">{r.data_recebido}</td>
                  <td className="px-4 py-4 text-[11px] font-black uppercase text-indigo-600 border-r">{r.prefixo}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-bold text-slate-700 border-r">{r.secretaria}</td>
                  <td className="px-4 py-4 text-[11px] uppercase text-slate-500 border-r max-w-xs truncate">{r.descricao}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-center border-r">{r.num_pedido_oficina}</td>
                  <td className="px-4 py-4 text-[10px] font-black text-center border-r">
                    <span className={`px-2 py-0.5 rounded uppercase ${r.oficina_tipo === 'PROPRIA' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                      {r.oficina_tipo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[11px] text-center text-slate-400 border-r">{r.data_lancamento || '---'}</td>
                  <td className="px-4 py-4 text-[11px] text-center font-bold border-r">{r.num_orc_pecas || '---'}</td>
                  <td className="px-4 py-4 text-[11px] text-center font-bold border-r">{r.num_orc_serv || '---'}</td>
                  <td className="px-4 py-4 text-[11px] text-center text-slate-400 border-r">{r.data_aprovacao || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-emerald-600 text-center border-r uppercase">{r.num_orc_aprovado || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-slate-900 text-center border-r">R$ {r.valor_total || '0,00'}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-center border-r uppercase">{r.nota_fiscal || '---'}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-black text-slate-900 border-r">{r.fornecedor}</td>
                  <td className="px-4 py-4 text-[11px] uppercase font-bold text-slate-500 border-r">{r.responsavel}</td>
                  <td className="px-4 py-4 text-center border-r">
                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${r.status?.toUpperCase().includes('APROVADO') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-center uppercase border-r">{r.entregue_relatorio}</td>
                  <td className="px-4 py-4 text-[10px] font-medium text-slate-400 uppercase max-w-xs truncate italic">{r.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileSpreadsheet size={24} /></div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{editingRecordId ? 'Editar' : 'Novo'} Lançamento</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 md:p-10 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Data Recebido" type="date" value={formData.data_recebido} onChange={v => setFormData({...formData, data_recebido: v})} />
                <Field label="Prefixo Veículo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" type="select" options={listItems.filter(i => i.category === 'secretaria').map(i => i.value)} value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Detalhada das Peças/Serviços</label>
                <textarea rows={2} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Pedido Oficina" value={formData.num_pedido_oficina} onChange={v => setFormData({...formData, num_pedido_oficina: v})} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Oficina</label>
                  <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs" value={formData.oficina_tipo} onChange={e => setFormData({...formData, oficina_tipo: e.target.value as any})}>
                    <option value="TERCERIZADA">TERCEIRIZADA</option>
                    <option value="PROPRIA">PRÓPRIA</option>
                  </select>
                </div>
                <Field label="Data Lançamento Volus" type="date" value={formData.data_lancamento} onChange={v => setFormData({...formData, data_lancamento: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                <Field label="Agrup. Peças Volus" value={formData.num_orc_pecas} onChange={v => setFormData({...formData, num_orc_pecas: v})} />
                <Field label="Agrup. Serviços Volus" value={formData.num_orc_serv} onChange={v => setFormData({...formData, num_orc_serv: v})} />
                <Field label="Data Aprovação Volus" type="date" value={formData.data_aprovacao} onChange={v => setFormData({...formData, data_aprovacao: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Orçamento Aprovado" value={formData.num_orc_aprovado} onChange={v => setFormData({...formData, num_orc_aprovado: v})} />
                <Field label="Valor Total (Ex: 1.250,00)" value={formData.valor_total} onChange={v => setFormData({...formData, valor_total: v})} />
                <Field label="Nota Fiscal" value={formData.nota_fiscal} onChange={v => setFormData({...formData, nota_fiscal: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Fornecedor / Empresa" type="select" options={listItems.filter(i => i.category === 'fornecedor').map(i => i.value)} value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
                <Field label="Responsável Lançamento" value={formData.responsavel} onChange={v => setFormData({...formData, responsavel: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status Operacional" type="select" options={listItems.filter(i => i.category === 'status').map(i => i.value)} value={formData.status} onChange={v => setFormData({...formData, status: v})} />
                <Field label="Controle de Entrega" type="select" options={listItems.filter(i => i.category === 'entrega').map(i => i.value)} value={formData.entregue_relatorio} onChange={v => setFormData({...formData, entregue_relatorio: v})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações / Inconsistências</label>
                <textarea rows={2} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                <Save size={20} /> {editingRecordId ? 'Salvar Alterações' : 'Finalizar e Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 flex flex-col gap-6 shadow-2xl">
             <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">Configurar Listas</h3>
               <button onClick={() => setIsConfigModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-xl"><X size={24}/></button>
             </div>
             <div className="flex bg-slate-100 p-1 rounded-xl border">
               {(['secretaria', 'fornecedor', 'status', 'entrega'] as const).map(c => (
                 <button key={c} onClick={() => setActiveConfigCategory(c)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeConfigCategory === c ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                   {c === 'entrega' ? 'Protocolo' : c}
                 </button>
               ))}
             </div>
             <div className="flex gap-2">
                <input type="text" value={newItemValue} onChange={e => setNewItemValue(e.target.value)} placeholder="Novo item..." className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold uppercase focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => { if(newItemValue) { setLocalListItems([...localListItems, {id: crypto.randomUUID(), category: activeConfigCategory, value: newItemValue.toUpperCase()}]); setNewItemValue(''); } }} className="px-6 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Add</button>
             </div>
             <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {localListItems.filter(i => i.category === activeConfigCategory).map(item => (
                  <div key={item.id} className="flex justify-between p-4 bg-slate-50 rounded-xl border group hover:border-indigo-200 transition-all">
                    <span className="text-xs font-bold uppercase text-slate-700">{item.value}</span>
                    <Trash2 size={16} className="cursor-pointer text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" onClick={() => setLocalListItems(localListItems.filter(i => i.id !== item.id))}/>
                  </div>
                ))}
                {localListItems.filter(i => i.category === activeConfigCategory).length === 0 && (
                  <div className="py-10 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Nenhum item cadastrado</p></div>
                )}
             </div>
             <button onClick={async () => { setIsSaving(true); if(await onUpdateListItems(localListItems)) { setSaveSuccess(true); setTimeout(() => setIsConfigModalOpen(false), 500); } setIsSaving(false); }} className={`w-full py-5 text-white font-black rounded-3xl uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all ${saveSuccess ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-black'}`}>
               {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : saveSuccess ? 'LISTAS ATUALIZADAS!' : 'SALVAR ALTERAÇÕES'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`p-6 rounded-[2rem] ${color} text-white flex items-center gap-5 shadow-xl transition-transform hover:scale-[1.02]`}>
    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest truncate">{label}</p>
      <h3 className="text-xl font-black truncate leading-none mt-1 tracking-tighter">{value}</h3>
    </div>
  </div>
);

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
