
import React, { useState, useMemo } from 'react';
import { ReportRecord } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Search, 
  X, 
  Save, 
  Trash2,
  Filter,
  ArrowRight
} from 'lucide-react';

interface ReportsViewProps {
  records: ReportRecord[];
  onSaveRecord: (record: Omit<ReportRecord, 'id' | 'createdAt'>) => void;
  onDeleteRecord: (id: string) => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ records, onSaveRecord, onDeleteRecord }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do Formulário Independente
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
    status: 'EM ANDAMENTO',
    entregueRelatorio: 'NÃO',
    observacao: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecord(formData);
    setIsModalOpen(false);
    // Limpar formulário
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
      status: 'EM ANDAMENTO',
      entregueRelatorio: 'NÃO',
      observacao: ''
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.secretaria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.numOrcAprovado.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header com Botão de Cadastro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Relatório de Compras</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestão de Peças e Terceirizadas (Independente)</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10"
          >
            <Download size={16} /> Exportar Planilha
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} /> Cadastrar Novo Registro
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por Fornecedor, Prefixo, Secretaria ou Nº Orçamento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {filteredRecords.length} Registros na Planilha
        </div>
      </div>

      {/* Tabela Planilha com 18 Colunas */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[3200px]">
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
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border-r border-slate-800 text-center font-white text-white">Nº Orç. Aprovado</th>
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
                    <button onClick={() => onDeleteRecord(r.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
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
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${r.status === 'CONCLUÍDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
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
        {filteredRecords.length === 0 && (
          <div className="py-32 text-center space-y-4">
            <FileSpreadsheet size={64} className="mx-auto text-slate-200" />
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Planilha de relatórios vazia. Clique em "Cadastrar Novo Registro".</p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro Independente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Novo Lançamento na Planilha</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preencha os 18 campos de controle empresarial</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
              {/* Grupo 1: Básico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Data Recebido" type="date" value={formData.dataRecebido} onChange={v => setFormData({...formData, dataRecebido: v})} />
                <Field label="Prefixo" value={formData.prefixo} onChange={v => setFormData({...formData, prefixo: v})} />
                <Field label="Secretaria" value={formData.secretaria} onChange={v => setFormData({...formData, secretaria: v})} />
              </div>

              {/* Grupo 2: Descrição */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição Peças e Serviços</label>
                <textarea 
                  rows={2}
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
                  placeholder="Ex: TROCA DE ÓLEO, FILTROS E MANUTENÇÃO DE FREIOS"
                  value={formData.descricao}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                />
              </div>

              {/* Grupo 3: Oficina */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Pedido Oficina" value={formData.numPedidoOficina} onChange={v => setFormData({...formData, numPedidoOficina: v})} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Oficina</label>
                  <select 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                    value={formData.oficinaTipo}
                    onChange={e => setFormData({...formData, oficinaTipo: e.target.value as any})}
                  >
                    <option value="TERCERIZADA">TERCEIRIZADA</option>
                    <option value="PROPRIA">PRÓPRIA</option>
                  </select>
                </div>
                <Field label="Data Lançamento Volus" type="date" value={formData.dataLancamentoVolus} onChange={v => setFormData({...formData, dataLancamentoVolus: v})} />
              </div>

              {/* Grupo 4: Agrupadores Volus */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <Field label="Nº Orç. Volus Peças (Agrupador)" value={formData.numOrcVolusPecas} onChange={v => setFormData({...formData, numOrcVolusPecas: v})} />
                <Field label="Nº Orç. Volus Serv (Agrupador)" value={formData.numOrcVolusServ} onChange={v => setFormData({...formData, numOrcVolusServ: v})} />
                <Field label="Data Aprovação Volus" type="date" value={formData.dataAprovacaoVolus} onChange={v => setFormData({...formData, dataAprovacaoVolus: v})} />
              </div>

              {/* Grupo 5: Aprovação e NF */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Nº Orç. Aprovado Final" value={formData.numOrcAprovado} onChange={v => setFormData({...formData, numOrcAprovado: v})} />
                <Field label="Valor Total Aprovado (R$)" placeholder="0.000,00" value={formData.valorTotal} onChange={v => setFormData({...formData, valorTotal: v})} />
                <Field label="Nota Fiscal" value={formData.notaFiscal} onChange={v => setFormData({...formData, notaFiscal: v})} />
              </div>

              {/* Grupo 6: Fornecedor e Responsável */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Fornecedor Aprovado / Orçamento" value={formData.fornecedor} onChange={v => setFormData({...formData, fornecedor: v})} />
                <Field label="Responsável Lançamento Aprovação" value={formData.responsavel} onChange={v => setFormData({...formData, responsavel: v})} />
              </div>

              {/* Grupo 7: Status e Relatório */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status Atual" value={formData.status} onChange={v => setFormData({...formData, status: v})} />
                <Field label="Entregue Relatório" value={formData.entregueRelatorio} onChange={v => setFormData({...formData, entregueRelatorio: v})} />
              </div>

              {/* Grupo 8: Observação */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observação Adicional</label>
                <textarea 
                  rows={2}
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
                  value={formData.observacao}
                  onChange={e => setFormData({...formData, observacao: e.target.value})}
                />
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black transition-all">
                  <Save size={24} /> Salvar Registro na Planilha Independente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, type = "text", value, onChange, placeholder = "" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default ReportsView;
