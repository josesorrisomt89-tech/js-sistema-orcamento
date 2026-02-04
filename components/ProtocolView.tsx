
import React, { useState, useMemo } from 'react';
import { ReportRecord } from '../types';
import { 
  Search, ClipboardCheck, CheckCircle, FileText, Building2, 
  Truck, Loader2, CheckSquare, Square, ListChecks, 
  AlertTriangle, User, Hash, DollarSign, Tag, Users, MessageSquare, X, Send
} from 'lucide-react';

interface ProtocolViewProps {
  records: ReportRecord[];
  onConfirm: (id: string) => Promise<void>;
  onConfirmBatch?: (ids: string[]) => Promise<void>;
  onUpdateRecord?: (id: string, record: Partial<ReportRecord>) => Promise<void>;
}

const ProtocolView: React.FC<ProtocolViewProps> = ({ records, onConfirm, onConfirmBatch, onUpdateRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  // Estados para Inconsistência
  const [inconsistencyId, setInconsistencyId] = useState<string | null>(null);
  const [inconsistencyNote, setInconsistencyNote] = useState('');
  const [isSavingInconsistency, setIsSavingInconsistency] = useState(false);

  // Filtra apenas registros que aguardam protocolo
  const pendingRecords = useMemo(() => {
    return records.filter(r => 
      ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregueRelatorio?.toUpperCase())
    ).filter(r => 
      r.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.secretaria?.toLowerCase().includes(searchTerm.toLowerCase())
      // Fix: Sort strings using Date comparison to avoid arithmetic errors on strings.
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [records, searchTerm]);

  const toggleSelect = (id: string) => {
    if (inconsistencyId) return; // Bloqueia seleção se estiver editando inconsistência
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
      for (const id of Array.from(selectedIds)) {
        await onConfirm(id);
      }
    }
    setSelectedIds(new Set());
    setIsBatchProcessing(false);
  };

  const handleSaveInconsistency = async (record: ReportRecord) => {
    if (!inconsistencyNote.trim() || !onUpdateRecord) return;
    
    setIsSavingInconsistency(true);
    try {
      // Atualiza a observação no registro original
      const newObservation = record.observacao 
        ? `${record.observacao} | INCONSISTÊNCIA: ${inconsistencyNote.toUpperCase()}`
        : `INCONSISTÊNCIA: ${inconsistencyNote.toUpperCase()}`;
      
      await onUpdateRecord(record.id, { observacao: newObservation });
      
      setInconsistencyId(null);
      setInconsistencyNote('');
    } catch (error) {
      alert("Erro ao salvar inconsistência.");
    } finally {
      setIsSavingInconsistency(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase italic flex items-center gap-3">
            <ClipboardCheck className="text-indigo-600" size={32} />
            Fila de Protocolo
          </h2>
          <p className="text-slate-500 font-medium">Confirme o recebimento dos relatórios físicos ou aponte erros.</p>
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
            placeholder="Pesquisar por prefixo, fornecedor ou secretaria..." 
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingRecords.map((record) => (
            <div 
              key={record.id} 
              onClick={() => toggleSelect(record.id)}
              className={`bg-white rounded-[2.5rem] border-2 shadow-sm transition-all group overflow-hidden relative cursor-pointer flex flex-col ${selectedIds.has(record.id) ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-200'}`}
            >
               {/* Checkbox Overlay */}
               <div className="absolute top-6 right-6 z-10">
                  {selectedIds.has(record.id) ? (
                    <div className="bg-indigo-600 text-white rounded-full p-1 shadow-lg"><CheckSquare size={20} /></div>
                  ) : (
                    <div className="text-slate-200 group-hover:text-slate-300"><Square size={20} /></div>
                  )}
               </div>

               {/* Card Header */}
               <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-colors ${selectedIds.has(record.id) ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                    <Truck size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-widest">Protocolo Pendente</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{record.prefixo}</h4>
                  </div>
               </div>

               {/* Card Content - GRID DE CAMPOS SOLICITADOS */}
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <DetailItem icon={<Users size={14} />} label="Secretaria" value={record.secretaria} />
                  <DetailItem icon={<Building2 size={14} />} label="Fornecedor" value={record.fornecedor} />
                  <DetailItem icon={<Hash size={14} />} label="Nº Orç. Aprovado" value={record.numOrcAprovado} highlight />
                  <DetailItem icon={<Tag size={14} />} label="Nota Fiscal" value={record.notaFiscal || 'NÃO INFORMADO'} />
                  <DetailItem icon={<DollarSign size={14} />} label="Valor Total" value={`R$ ${record.valorTotal}`} bold />
                  <DetailItem icon={<User size={14} />} label="Responsável Lanç." value={record.responsavel} />
                  
                  <div className="md:col-span-2 pt-2">
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição Peças/Serviços</p>
                        <p className="text-[11px] font-bold text-slate-600 leading-tight uppercase">{record.descricao}</p>
                      </div>
                    </div>
                  </div>

                  {record.observacao && (
                     <div className="md:col-span-2 mt-2">
                        <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <MessageSquare size={16} className="text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Observação / Alerta</p>
                            <p className="text-[11px] font-bold text-amber-900 leading-tight uppercase">{record.observacao}</p>
                          </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Card Actions */}
               <div className="p-6 pt-0 mt-auto">
                  {inconsistencyId === record.id ? (
                    <div className="bg-slate-900 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                       <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Descrever Inconsistência</p>
                          <button onClick={(e) => { e.stopPropagation(); setInconsistencyId(null); }} className="text-slate-500 hover:text-white"><X size={16}/></button>
                       </div>
                       <textarea 
                          autoFocus
                          value={inconsistencyNote}
                          onChange={e => setInconsistencyNote(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="EX: NF DIVERGENTE DO VALOR..."
                          rows={2}
                       />
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleSaveInconsistency(record); }}
                         disabled={isSavingInconsistency}
                         className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                       >
                         {isSavingInconsistency ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                         Salvar na Observação
                       </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                       <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setInconsistencyId(record.id);
                            setInconsistencyNote('');
                          }}
                          className="flex-1 py-4 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-700 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95"
                       >
                          <AlertTriangle size={18} />
                          Inconsistência
                       </button>

                       <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProtocolAction(record.id);
                          }}
                          disabled={processingId === record.id}
                          className="flex-[2] py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg group-hover:bg-indigo-600"
                       >
                          {processingId === record.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <ClipboardCheck size={18} />
                          )}
                          {processingId === record.id ? 'PROTOCOLANDO...' : 'Confirmar Protocolo'}
                       </button>
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-componente para detalhes do card
const DetailItem = ({ icon, label, value, highlight = false, bold = false }: any) => (
  <div className="min-w-0">
    <div className="flex items-center gap-1.5 mb-1">
       <span className="text-slate-400">{icon}</span>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
    </div>
    <p className={`text-xs uppercase truncate ${highlight ? 'text-indigo-600 font-black' : bold ? 'text-slate-900 font-black' : 'text-slate-700 font-bold'}`}>
      {value || '---'}
    </p>
  </div>
);

export default ProtocolView;
