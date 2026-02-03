
import React, { useState, useMemo } from 'react';
import { ReportRecord } from '../types';
import { Search, ClipboardCheck, ArrowRight, Package, CheckCircle, FileText, Building2, Truck, Loader2 } from 'lucide-react';

interface ProtocolViewProps {
  records: ReportRecord[];
  onConfirm: (id: string) => Promise<void>;
}

const ProtocolView: React.FC<ProtocolViewProps> = ({ records, onConfirm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtra apenas registros que aguardam protocolo
  const pendingRecords = useMemo(() => {
    return records.filter(r => 
      ['SIM - AGUARD. PROTOCOLO', 'ENTREGUE PEÇAS PROTOCOLO', 'ENTREGUE SERVIÇO PROTOCOLO'].includes(r.entregueRelatorio?.toUpperCase())
    ).filter(r => 
      r.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.createdAt - b.createdAt);
  }, [records, searchTerm]);

  const handleProtocolAction = async (id: string) => {
    setProcessingId(id);
    await onConfirm(id);
    setProcessingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase italic flex items-center gap-3">
          <ClipboardCheck className="text-indigo-600" size={32} />
          Fila de Protocolo
        </h2>
        <p className="text-slate-500 font-medium">Confirme o recebimento dos relatórios físicos para protocolar no sistema.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por prefixo ou fornecedor..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {pendingRecords.length} PENDENTES
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
            <div key={record.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group overflow-hidden relative">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Truck size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Prefixo</p>
                        <h4 className="text-xl font-black text-slate-900 uppercase italic">{record.prefixo}</h4>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">NF</p>
                     <p className="font-bold text-slate-900">{record.notaFiscal || '---'}</p>
                  </div>
               </div>

               <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                     <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Empresa</p>
                        <p className="text-xs font-bold text-slate-700 uppercase">{record.fornecedor}</p>
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
                  onClick={() => handleProtocolAction(record.id)}
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
