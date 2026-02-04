
import React, { useState, useMemo } from 'react';
import { Quote, QuoteType, AttachedFile } from '../types';
import { 
  Building2, ChevronDown, ChevronRight, Phone, Clock, 
  CheckCircle2, AlertCircle, Share2, Trash2, Image as ImageIcon,
  Loader2, Check, ArrowRightLeft, Edit3, X, Save, FileText
} from 'lucide-react';

interface HistoryViewProps {
  quotes: Quote[];
  onDelete: (id: string) => void;
  onUpdateQuote: (quote: Quote) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ quotes, onDelete, onUpdateQuote }) => {
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [statusId, setStatusId] = useState<string | null>(null);
  const [approvingQuoteId, setApprovingQuoteId] = useState<string | null>(null);
  const [editObservations, setEditObservations] = useState<string>('');

  const groupedQuotes = useMemo(() => {
    const groups: Record<string, Quote[]> = {};
    quotes.forEach(quote => {
      if (!groups[quote.supplierName]) {
        groups[quote.supplierName] = [];
      }
      groups[quote.supplierName].push(quote);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [quotes]);

  const toggleSupplier = (name: string) => {
    setExpandedSuppliers(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const base64ToFile = (base64String: string, fileName: string, type: string): File => {
    const arr = base64String.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type });
  };

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleResend = async (quote: Quote) => {
    setStatusId(quote.id);
    const cleanPhone = quote.supplierPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(quote.observations);

    if (isMobile() && navigator.canShare) {
      const filesToShare: File[] = [];
      if (quote.photo) filesToShare.push(base64ToFile(quote.photo, 'anexo.jpg', 'image/jpeg'));
      quote.files?.forEach(f => filesToShare.push(base64ToFile(f.data, f.name, f.type)));

      try {
        await navigator.share({
          files: filesToShare,
          text: quote.observations,
        });
      } catch (err) {
        window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
      }
    } else {
      window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
    }
    setTimeout(() => setStatusId(null), 3000);
  };

  const startApproval = (quote: Quote) => {
    setApprovingQuoteId(quote.id);
    const lines = quote.observations.split('\n');
    const obsLine = lines.find(l => l.startsWith('OBS:'));
    const obsContent = obsLine ? obsLine.replace('OBS:', '').replace(/\*/g, '').trim() : quote.observations;
    setEditObservations(obsContent);
  };

  const cancelApproval = () => {
    setApprovingQuoteId(null);
    setEditObservations('');
  };

  const confirmApproval = async (quote: Quote) => {
    const approvedMessage = `ORCAMENTO *VOLUS* APROVADO
EMPRESA: *${quote.supplierName.toUpperCase()}*

PREFIXO: *${quote.prefix || '---'}*
ORC. VOLUS PEÇAS: *${quote.quoteNumberParts || '---'}*
ORC. VOLUS SERVIÇOS: *${quote.quoteNumberServices || '---'}*

OBS: *${editObservations.toUpperCase()}*`;

    const updatedQuote: Quote = {
      ...quote,
      type: QuoteType.APPROVAL,
      observations: approvedMessage
    };

    onUpdateQuote(updatedQuote);
    setApprovingQuoteId(null);
    handleResend(updatedQuote);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">HISTÓRICO POR EMPRESA</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Gestão inteligente de solicitações e aprovações</p>
        </div>
      </div>

      <div className="space-y-6">
        {groupedQuotes.map(([supplierName, supplierQuotes]) => (
          <div key={supplierName} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            <button 
              onClick={() => toggleSupplier(supplierName)}
              className="w-full flex items-center justify-between p-8 bg-slate-50/30 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-lg">
                  <Building2 size={28} />
                </div>
                <div className="text-left">
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{supplierName}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                      {supplierQuotes.length} Orçamentos
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                {expandedSuppliers[supplierName] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </div>
            </button>

            {expandedSuppliers[supplierName] && (
              <div className="p-8 pt-0 border-t border-slate-100 bg-white">
                <div className="grid grid-cols-1 gap-6 mt-8">
                  {/* Fix: Sort by createdAt (string) by converting to Date object timestamps to resolve arithmetic errors on strings. */}
                  {supplierQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(quote => (
                    <div key={quote.id} className="bg-slate-50/50 rounded-3xl border border-slate-200 p-6 flex flex-col lg:flex-row gap-8 transition-all hover:bg-white hover:shadow-lg">
                      <div className="w-full lg:w-56 flex-shrink-0 space-y-3">
                        <div className="aspect-square relative rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                          {quote.photo ? (
                            <img src={quote.photo} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon size={48} />
                            </div>
                          )}
                        </div>
                        {quote.files && quote.files.length > 0 && (
                          <div className="space-y-1">
                            {quote.files.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                <FileText size={14} />
                                <span className="text-[10px] font-black truncate">{f.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                              quote.type === QuoteType.REQUEST ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {quote.type === QuoteType.REQUEST ? 'Pendente' : 'Aprovado'}
                            </span>
                            <button onClick={() => onDelete(quote.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={18} /></button>
                          </div>
                          
                          {approvingQuoteId === quote.id ? (
                            <div className="space-y-4">
                              <textarea
                                value={editObservations}
                                onChange={(e) => setEditObservations(e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-indigo-200 font-black text-sm uppercase resize-none h-32"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => confirmApproval(quote)} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                                  <Save size={16} /> Salvar e Enviar
                                </button>
                                <button onClick={cancelApproval} className="px-6 bg-slate-100 text-slate-400 font-black rounded-2xl">X</button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200">
                               <pre className="text-[11px] font-black text-slate-900 whitespace-pre-wrap uppercase leading-tight font-sans">
                                 {quote.observations}
                               </pre>
                            </div>
                          )}
                        </div>

                        {!approvingQuoteId && (
                          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                            {quote.type === QuoteType.REQUEST && (
                              <button onClick={() => startApproval(quote)} className="w-full sm:flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} /> Aprovar Orçamento
                              </button>
                            )}
                            <button onClick={() => handleResend(quote)} className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-3 py-4 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl ${statusId === quote.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                              <Share2 size={18} /> {statusId === quote.id ? 'Enviando...' : 'Reenviar WhatsApp'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;
