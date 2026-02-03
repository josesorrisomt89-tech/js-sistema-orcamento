
import React, { useState, useMemo, useEffect } from 'react';
import { ReportRecord, ReportListItem } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Search, 
  X, 
  Save, 
  Trash2,
  Settings,
  ListPlus,
  Loader2,
  CheckCircle2,
  Edit2,
  DollarSign,
  Clock,
  CheckCircle,
  ClipboardList,
  Activity
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
  records, 
  listItems, 
  onSaveRecord, 
  onUpdateRecord, 
  onDeleteRecord, 
  onUpdateListItems 
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

  const [formData, setFormData] = useState({
    dataRecebido: new Date().toISOString().split('T')[0],
    prefixo: '',
    secretaria: '',
    descricao: '',
    numPedidoOficina: '',
    oficinaTipo: 'TERCERIZADA' as 'PROPRIA' | 'TERCERIZADA',
    dataLancamentoVolus: '',
    numOrcVolusPecas: '',
    numOrcVolusServ: '',
    dataAprovacaoVolus: '',
    numOrcAprovado: '',
    valorTotal: '',
    notaFiscal: '',
    fornecedor: '',
    responsavel: '',
    status: '',
    entregueRelatorio: '',
    observacao: ''
  });

  // Métricas do Dashboard
  const stats = useMemo(() => {
    const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
    };

    return {
      totalValor: records.reduce((acc, r) => acc + parseCurrency(r.valorTotal), 0),
      aguardandoOrc: records.filter(r => r.status?.toUpperCase().includes('AGUARDANDO ORÇAMENTO') || r.status?.toUpperCase().includes('ORÇAMENTO')).length,
      aprovados: records.filter(r => r.status?.toUpperCase() === 'APROVADO' || r.status?.toUpperCase() === 'AUTORIZADO').length,
      aguardandoProtocolo: records.filter(r => r.status?.toUpperCase().includes('PROTOCOLO') || r.status?.toUpperCase().includes('AGUARDANDO PROTOCOLO')).length,
      concluidos: records.filter(r => r.status?.toUpperCase() === 'CONCLUÍDO' || r.status?.toUpperCase() === 'FINALIZADO' || r.status?.toUpperCase() === 'CONCLUIDO').length,
    };
  }, [records]);

  const resetForm = () => {
    setFormData({
      dataRecebido: new Date().toISOString().split('T')[0],
      prefixo: '',
      secretaria: '',
      descricao: '',
      numPedidoOficina: '',
      oficinaTipo: 'TERCERIZADA',
      dataLancamentoVolus: '',
      numOrcVolusPecas: '',
      numOrcVolusServ: '',
      dataAprovacaoVolus: '',
      numOrcAprovado: '',
      valorTotal: '',
      notaFiscal: '',
      fornecedor: '',
      responsavel: '',
      status: '',
      entregueRelatorio: '',
      observacao: ''
    });
    setEditingRecordId(null);
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

  const handleEditClick = (record: ReportRecord) => {
    setEditingRecordId(record.id);
    setFormData({
      dataRecebido: record.dataRecebido || '',
      prefixo: record.prefixo || '',
      secretaria: record.secretaria || '',
      descricao: record.descricao || '',
      numPedidoOficina: record.numPedidoOficina || '',
      oficinaTipo: record.oficinaTipo || 'TERCERIZADA',
      dataLancamentoVolus: record.dataLancamentoVolus || '',
      numOrcVolusPecas: record.numOrcVolusPecas || '',
      numOrcVolusServ: record.numOrcVolusServ || '',
      dataAprovacaoVolus: record.dataAprovacaoVolus || '',
      numOrcAprovado: record.numOrcAprovado || '',
      valorTotal: record.valorTotal || '',
      notaFiscal: record.notaFiscal || '',
      fornecedor: record.fornecedor || '',
      responsavel: record.responsavel || '',
      status: record.status || '',
      entregueRelatorio: record.entregueRelatorio || '',
      observacao: record.observacao || ''
    });
    setIsModalOpen(true);
  };

  const handleNewRecordClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (r.fornecedor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.prefixo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.secretaria?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.numOrcAprovado?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [records, searchTerm]);

  const exportToCSV = () => {
    const headers = [
      'Data Recebido', 'Prefixo', 'Secretaria', 'Descrição', 'Nº Pedido Oficina', 
      'Oficina Própria/Terceirizada', 'Data Lançamento Volus', 'Nº Orç Volus Peças', 'Nº Orç Volus Serv', 
      'Data Aprovação Volus', 'Nº Orç Aprovado', 'Valor Total', 'Nota Fiscal', 
      'Fornecedor', 'Responsável Lançamento', 'Status', 'Entregue Relatório', 'Observação'
    ];
    const rows = filteredRecords.map(r => [
      r.dataRecebido, r.prefixo, r.secretaria, r.descricao.replace(/;/g, ','), r.numPedidoOficina,
      r.oficinaTipo, r.dataLancamentoVolus, r.numOrcVolusPecas, r.numOrcVolusServ,
      r.dataAprovacaoVolus, r.numOrcAprovado, r.valorTotal, r.notaFiscal,
      r.fornecedor, r.responsavel, r.status, r.entregueRelatorio, r.observacao.replace(/;/g, ',')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio_compras_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleAddListItem = () => {
    if (!newItemValue.trim()) return;
    const newItem: ReportListItem = {
      id: crypto.randomUUID(),
      category: activeConfigCategory,
      value: newItemValue.trim().toUpperCase()
    };
    setLocalListItems([...localListItems, newItem]);
    setNewItemValue('');
  };

  const handleRemoveListItem = (id: string) => {
    setLocalListItems(localListItems.filter(i => i.id !== id));
  };

  const handleSaveAndClose = async () => {
    setIsSaving(true);
    const success = await onUpdateListItems(localListItems);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setIsConfigModalOpen(false), 800);
    } else {
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const getOptionsByCategory = (cat: string) => {
    return listItems.filter(i => i.category === cat).map(i => i.value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 mx-2">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Relatório de Compras</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Controle de Peças e Serviços Independentes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsConfigModalOpen(true)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 flex items-center gap-2"
            title="Configurar Listas"
          >
            <Settings size={24} />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Config</span>
          </button>
          <button 
            onClick={exportToCSV}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10"
          >
            <Download size={16} /> Exportar CSV
          </button>
          <button 
            onClick={handleNewRecordClick}
            className="px-6 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="mx-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Valor Total de Serviços" 
          value={`R$ ${stats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          color="bg-slate-900" 
        />
        <StatCard 
          icon={<Clock size={24} />} 
          label="Aguardando Orçamento" 
          value={stats.aguardandoOrc.toString()} 
          color="bg-amber-500" 
        />
        <StatCard 
          icon={<CheckCircle2 size={24} />} 
          label="Aprovados / Autorizados" 
          value={stats.aprovados.toString()} 
          color="bg-blue-600" 
        />
        <StatCard 
          icon={<ClipboardList size={24} />} 
          label="Aguardando Protocolo" 
          value={stats.aguardandoProtocolo.toString()} 
          color="bg-purple-600" 
        />
        <StatCard 
          icon={<CheckCircle size={24} />} 
          label="Concluídos e Fechados" 
          value={stats.concluidos.toString()} 
          color="bg-emerald-600" 
        />
      </div>

      {/* Pesquisa */}
      <div className="mx-2 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar planilha..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {filteredRecords.length} REGISTROS ENCONTRADOS
        </div>
      </div>

      {/* Planilha */}
      <div className="mx-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden max-w-full">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[2800px]">
            <thead>
              <tr className="bg-slate-900 text-slate-400">
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-slate-800">Ações</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Data Recebido</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Prefixo</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Secretaria</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Descrição Peças/Serv</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Nº Pedido Oficina</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Oficina Próp/Terc</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Data Lanç. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Nº Orç. Peças (Agrup)</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Nº Orç. Serv (Agrup)</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Data Aprov. Volus</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center text-white">Nº Orç. Aprovado</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Valor Total</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Nota Fiscal</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Fornecedor Aprov/Orc</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800">Responsável Lanc.</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Status</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center">Entregue Relat.</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEditClick(r)} className="text-slate-300 hover:text-indigo-500 transition-colors" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteRecord(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-500 border-r border-slate-100">{r.dataRecebido}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-indigo-600 border-r border-slate-100 uppercase">{r.prefixo}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700 border-r border-slate-100 uppercase">{r.secretaria}</td>
                  <td className="px-4 py-4 text-[11px] font-medium text-slate-500 border-r border-slate-100 max-w-xs truncate uppercase">{r.descricao}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-900 border-r border-slate-100 text-center">{r.numPedidoOficina}</td>
                  <td className="px-4 py-4 border-r border-slate-100 text-center">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${r.oficinaTipo === 'PROPRIA' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                      {r.oficinaTipo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-400 border-r border-slate-100 text-center">{r.dataLancamentoVolus || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700 border-r border-slate-100 text-center">{r.numOrcVolusPecas || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700 border-r border-slate-100 text-center">{r.numOrcVolusServ || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-400 border-r border-slate-100 text-center">{r.dataAprovacaoVolus || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-emerald-600 border-r border-slate-100 text-center uppercase">{r.numOrcAprovado || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-slate-900 border-r border-slate-100 text-center">R$ {r.valorTotal || '0,00'}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-700 border-r border-slate-100 text-center uppercase">{r.notaFiscal || '---'}</td>
                  <td className="px-4 py-4 text-[11px] font-black text-slate-900 border-r border-slate-100 uppercase">{r.fornecedor}</td>
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-500 border-r border-slate-100 uppercase">{r.responsavel}</td>
                  <td className="px-4 py-4 border-r border-slate-100 text-center">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${r.status?.toUpperCase() === 'CONCLUÍDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[11px] font-bold border-r border-slate-100 text-center uppercase">{r.entregueRelatorio}</td>
                  <td className="px-4 py-4 text-[11px] font-medium text-slate-400 uppercase max-w-xs truncate">{r.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                  {editingRecordId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Data Recebido" type="date" value={formData.dataRecebido} onChange={v => setFormData({...formData, dataRecebido: v})} />
                <Field label="Prefixo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" type="select" options={getOptionsByCategory('secretaria')} value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                <textarea rows={2} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Pedido Oficina" value={formData.numPedidoOficina} onChange={v => setFormData({...formData, numPedidoOficina: v})} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                  <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs" value={formData.oficinaTipo} onChange={e => setFormData({...formData, oficinaTipo: e.target.value as any})}>
                    <option value="TERCERIZADA">TERCEIRIZADA</option>
                    <option value="PROPRIA">PRÓPRIA</option>
                  </select>
                </div>
                <Field label="Lanç. Volus" type="date" value={formData.dataLancamentoVolus} onChange={v => setFormData({...formData, dataLancamentoVolus: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-indigo-50/50 rounded-3xl">
                <Field label="Agrup. Peças" value={formData.numOrcVolusPecas} onChange={v => setFormData({...formData, numOrcVolusPecas: v})} />
                <Field label="Agrup. Serv" value={formData.numOrcVolusServ} onChange={v => setFormData({...formData, numOrcVolusServ: v})} />
                <Field label="Aprov. Volus" type="date" value={formData.dataAprovacaoVolus} onChange={v => setFormData({...formData, dataAprovacaoVolus: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Aprovado" value={formData.numOrcAprovado} onChange={v => setFormData({...formData, numOrcAprovado: v})} />
                <Field label="Valor Total" value={formData.valorTotal} onChange={v => setFormData({...formData, valorTotal: v})} />
                <Field label="Nota Fiscal" value={formData.notaFiscal} onChange={v => setFormData({...formData, notaFiscal: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Fornecedor" type="select" options={getOptionsByCategory('fornecedor')} value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
                <Field label="Responsável" value={formData.responsavel} onChange={v => setFormData({...formData, responsavel: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status" type="select" options={getOptionsByCategory('status')} value={formData.status} onChange={v => setFormData({...formData, status: v})} />
                <Field label="Entregue" type="select" options={getOptionsByCategory('entrega')} value={formData.entregueRelatorio} onChange={v => setFormData({...formData, entregueRelatorio: v})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all">
                {editingRecordId ? 'Salvar Alterações' : 'Salvar Novo Registro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Config */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Configurar Listas</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personalize os dropdowns da planilha</p>
              </div>
              <button disabled={isSaving} onClick={() => setIsConfigModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex border-b border-slate-100 bg-slate-50">
              <ConfigTab active={activeConfigCategory === 'secretaria'} label="Secretarias" onClick={() => setActiveConfigCategory('secretaria')} />
              <ConfigTab active={activeConfigCategory === 'fornecedor'} label="Fornecedores" onClick={() => setActiveConfigCategory('fornecedor')} />
              <ConfigTab active={activeConfigCategory === 'status'} label="Status" onClick={() => setActiveConfigCategory('status')} />
              <ConfigTab active={activeConfigCategory === 'entrega'} label="Entrega" onClick={() => setActiveConfigCategory('entrega')} />
            </div>

            <div className="p-8 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={`Adicionar novo...`} 
                  className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddListItem()}
                />
                <button 
                  onClick={handleAddListItem}
                  className="px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {localListItems.filter(i => i.category === activeConfigCategory).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group">
                    <span className="text-xs font-black text-slate-700 uppercase">{item.value}</span>
                    <button onClick={() => handleRemoveListItem(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={handleSaveAndClose} 
                disabled={isSaving}
                className={`w-full text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${saveSuccess ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-black'}`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : saveSuccess ? <CheckCircle2 size={16} /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Interno: StatCard
const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`p-6 rounded-[2rem] ${color} text-white shadow-xl flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300`}>
    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
      {icon}
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">{label}</p>
      <h3 className="text-xl font-black tracking-tighter truncate leading-none mt-1">{value}</h3>
    </div>
  </div>
);

const Field = ({ label, type = "text", value, onChange, options = [] }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    {type === 'select' ? (
      <select 
        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">SELECIONE...</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input type={type} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase" value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

const ConfigTab = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
  >
    {label}
  </button>
);

export default ReportsView;
