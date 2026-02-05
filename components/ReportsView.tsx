import React, { useState, useMemo, useEffect } from 'react';
import { ReportRecord, ReportListItem } from '../types';
import { 
  FileSpreadsheet, Download, Plus, Search, X, Trash2, Settings, Loader2, CheckCircle2, Edit2, DollarSign, Clock, CheckCircle, ClipboardList, Save
} from 'lucide-react';

export interface ReportsViewProps {
  records: ReportRecord[];
  listItems: ReportListItem[];
  onSaveRecord: (record: Omit<ReportRecord, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateRecord: (id: string, record: Omit<ReportRecord, 'id' | 'createdAt'>) => Promise<void> | void;
  onDeleteRecord: (id: string) => void;
  onUpdateListItems: (items: ReportListItem[]) => Promise<any>;
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
  records, listItems, onSaveRecord, onUpdateRecord, onDeleteRecord, onUpdateListItems 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<ReportRecord, 'id' | 'createdAt'>>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecordId) {
      await onUpdateRecord(editingRecordId, formData);
    } else {
      await onSaveRecord(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

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

  const handleEditClick = (record: ReportRecord) => {
    setEditingRecordId(record.id);
    setFormData({
      dataRecebido: record.dataRecebido,
      prefixo: record.prefixo,
      secretaria: record.secretaria,
      descricao: record.descricao,
      numPedidoOficina: record.numPedidoOficina,
      oficinaTipo: record.oficinaTipo,
      dataLancamentoVolus: record.dataLancamentoVolus,
      numOrcVolusPecas: record.numOrcVolusPecas,
      numOrcVolusServ: record.numOrcVolusServ,
      dataAprovacaoVolus: record.dataAprovacaoVolus,
      numOrcAprovado: record.numOrcAprovado,
      valorTotal: record.valorTotal,
      notaFiscal: record.notaFiscal,
      fornecedor: record.fornecedor,
      responsavel: record.responsavel,
      status: record.status,
      entregueRelatorio: record.entregueRelatorio,
      observacao: record.observacao
    });
    setIsModalOpen(true);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      (r.fornecedor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.prefixo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Relatório de Compras</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestão de Peças e Serviços</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-4 bg-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-400 shadow-lg shadow-indigo-500/20">
          <Plus size={18} /> Novo Registro
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border flex items-center gap-4">
        <Search className="text-slate-400" size={18} />
        <input type="text" placeholder="Filtrar por prefixo ou fornecedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold uppercase" />
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[2000px]">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-400">
                <th className="p-4 text-[9px] font-black uppercase sticky left-0 bg-slate-50 border-r">Ações</th>
                <th className="p-4 text-[9px] font-black uppercase">Recebido</th>
                <th className="p-4 text-[9px] font-black uppercase">Prefixo</th>
                <th className="p-4 text-[9px] font-black uppercase">Secretaria</th>
                <th className="p-4 text-[9px] font-black uppercase">Nº Aprovado</th>
                <th className="p-4 text-[9px] font-black uppercase">Valor Total</th>
                <th className="p-4 text-[9px] font-black uppercase">Fornecedor</th>
                <th className="p-4 text-[9px] font-black uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 group">
                  <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 border-r">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(r)} className="text-slate-300 hover:text-indigo-600"><Edit2 size={16} /></button>
                    </div>
                  </td>
                  <td className="p-4 text-[11px] font-bold">{r.dataRecebido}</td>
                  <td className="p-4 text-[11px] font-black text-indigo-600 uppercase">{r.prefixo}</td>
                  <td className="p-4 text-[11px] font-bold uppercase">{r.secretaria}</td>
                  <td className="p-4 text-[11px] font-black text-emerald-600 uppercase">{r.numOrcAprovado}</td>
                  <td className="p-4 text-[11px] font-black">R$ {r.valorTotal}</td>
                  <td className="p-4 text-[11px] font-black uppercase">{r.fornecedor}</td>
                  <td className="p-4">
                    <span className="text-[9px] font-black px-2 py-1 bg-slate-100 rounded-lg uppercase">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{editingRecordId ? 'Editar' : 'Novo'} Registro</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all"><X size={28} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Data Recebido" type="date" value={formData.dataRecebido} onChange={v => setFormData({...formData, dataRecebido: v})} />
                <Field label="Prefixo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" type="select" options={listItems.filter(i => i.category === 'secretaria').map(i => i.value)} value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Nº Orçamento Aprovado" value={formData.numOrcAprovado} onChange={v => setFormData({...formData, numOrcAprovado: v})} />
                <Field label="Valor Total" value={formData.valorTotal} onChange={v => setFormData({...formData, valorTotal: v})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Fornecedor" type="select" options={listItems.filter(i => i.category === 'fornecedor').map(i => i.value)} value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
                <Field label="Status" type="select" options={listItems.filter(i => i.category === 'status').map(i => i.value)} value={formData.status} onChange={v => setFormData({...formData, status: v})} />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase text-xs tracking-widest shadow-2xl hover:bg-black flex items-center justify-center gap-3">
                <Save size={20} /> Salvar Alterações
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
      <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase focus:ring-2 focus:ring-indigo-500" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">SELECIONE...</option>
        {options.map((o:any) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase focus:ring-2 focus:ring-indigo-500" value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

export default ReportsView;
