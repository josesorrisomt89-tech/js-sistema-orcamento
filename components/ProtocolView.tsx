
import React, { useState, useMemo } from 'react';
import { ReportRecord } from '../types';
import { Search, ClipboardCheck, CheckCircle, FileText, Building2, Truck, Loader2, CheckSquare, Square, ListChecks } from 'lucide-react';

interface ProtocolViewProps {
  records: ReportRecord[];
  onConfirm: (id: string) => Promise<void>;
  onConfirmBatch?: (ids: string[]) => Promise<void>;
}

const ProtocolView: React.FC<ProtocolViewProps> = ({ records, onConfirm, onConfirmBatch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Filtra apenas registros que aguardam protocolo
  const pendingRecords = useMemo(() => {
    return records.filter(r => 
      ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregueRelatorio?.toUpperCase())
    ).filter(r => 
      r.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.createdAt - b.createdAt);
  }, [records, searchTerm]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRecords.map(r => r.id)));
    }
  };

  const handleProtocolAction = async (id: string) => {
    setProcessingId(id);
    await onConfirm(id);
    setProcessingId(null);
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
  };

  const handleBatchProtocol = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Deseja protocolar ${selectedIds.size} itens de uma vez?`)) return;

    setIsBatchProcessing(true);
    if (onConfirmBatch) {
      await onConfirmBatch(Array.from(selectedIds));
    } else {
      // Fallback para loop se o batch não estiver implementado
      for (const id of Array.from(selectedIds)) {
        await onConfirm(id);
      }
    }
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase italic flex items-center gap-3">
            <ClipboardCheck className="text-indigo-600" size={32} />
            Fila de Protocolo
          </h2>
          <p className="text-slate-500 font-medium">Confirme o recebimento dos relatórios físicos para protocolar no sistema.</p>
        </div>

        {selectedIds.size > 0 && (
          <button 
            onClick={handleBatchProtocol}
            disabled={isBatchProcessing}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-200 transition-all active:scale-95"
          >
            {isBatchProcessing ? <Loader2 className="animate-spin" size={18} /> : <ListChecks size={18} />}
            Protocolar {selectedIds.size} Selecionados
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por prefixo ou fornecedor..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={toggleSelectAll}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all"
          >
            {selectedIds.size === pendingRecords.length ? <CheckSquare size={16} /> : <Square size={16} />}
            {selectedIds.size === pendingRecords.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <div className="px-4 py-3 bg-slate-900 rounded-xl text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
            {pendingRecords.length} PENDENTES
          </div>
        </div>
      </div>

      {pendingRecords.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
           </div>
           <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Tudo em Dia!</h3>
           <p className="text-slate-400 font-medium text-xs mt-1">Nenhum relatório aguardando protocolo no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRecords.map((record) => (
            <div 
              key={record.id} 
              onClick={() => toggleSelect(record.id)}
              className={`bg-white rounded-[2.5rem] border-2 p-6 shadow-sm transition-all group overflow-hidden relative cursor-pointer ${selectedIds.has(record.id) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200'}`}
            >
               <div className="absolute top-6 right-6">
                  {selectedIds.has(record.id) ? (
                    <div className="bg-indigo-600 text-white rounded-full p-1"><CheckSquare size={20} /></div>
                  ) : (
                    <div className="text-slate-200 group-hover:text-slate-300"><Square size={20} /></div>
                  )}
               </div>

               <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ${selectedIds.has(record.id) ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Prefixo</p>
                    <h4 className="text-xl font-black text-slate-900 uppercase italic">{record.prefixo}</h4>
                  </div>
               </div>

               <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                     <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
                     <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Empresa</p>
                        <p className="text-xs font-bold text-slate-700 uppercase truncate pr-8">{record.fornecedor}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Status de Entrega</p>
                        <p className="text-xs font-black text-indigo-600 uppercase italic">{record.entregueRelatorio}</p>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor do Serviço</p>
                     <p className="text-lg font-black text-slate-900">R$ {record.valorTotal}</p>
                  </div>
               </div>

               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProtocolAction(record.id);
                  }}
                  disabled={processingId === record.id}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg group-hover:bg-indigo-600 group-hover:shadow-indigo-500/20"
               >
                  {processingId === record.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <ClipboardCheck size={18} />
                  )}
                  {processingId === record.id ? 'PROTOCOLANDO...' : 'CONFIRMAR PROTOCOLO'}
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProtocolView;
