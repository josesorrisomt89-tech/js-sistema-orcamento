
import React, { useState, useMemo } from 'react';
import { Quote, QuoteType } from '../types';
import { 
  Building2, ChevronDown, ChevronRight, Phone, Clock, 
  CheckCircle2, AlertCircle, Share2, Trash2, Image as ImageIcon,
  Loader2, Check, ArrowRightLeft, Edit3, X, Save
} from 'lucide-react';
import { formatQuoteMessage } from '../services/geminiService';

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

  const base64ToFile = (base64String: string, fileName: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type: mime });
  };

  const copyImageToClipboard = async (base64: string) => {
    try {
      window.focus();
      if (!navigator.clipboard || !window.ClipboardItem) return false;
      const clipboardPromise = (async () => {
        const img = new Image();
        img.src = base64;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas error");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error("Blob error");
        return blob;
      })();
      const item = new ClipboardItem({ 'image/png': clipboardPromise });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      return false;
    }
  };

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleResend = async (quote: Quote) => {
    setStatusId(quote.id);
    const cleanPhone = quote.supplierPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(quote.observations);

    if (isMobile() && navigator.share && quote.photo) {
      try {
        const imageFile = base64ToFile(quote.photo, `volus-resend-${Date.now()}.jpg`);
        await navigator.share({
          files: [imageFile],
          text: quote.observations,
        });
      } catch (err) {
        window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
      }
    } else {
      if (quote.photo && !isMobile()) {
        const copied = await copyImageToClipboard(quote.photo);
        if (copied) alert("📸 FOTO COPIADA! No WhatsApp, aperte CTRL+V.");
      }
      window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
    }
    setTimeout(() => setStatusId(null), 3000);
  };

  const startApproval = (quote: Quote) => {
    setApprovingQuoteId(quote.id);
    // Extraímos apenas as observações da mensagem original se possível, ou usamos como está
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
    // Montamos a mensagem no padrão solicitado
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
    
    // Dispara o reenvio imediatamente após aprovar
    handleResend(updatedQuote);
  };

  const addQuickText = (text: string) => {
    setEditObservations(prev => prev ? `${prev} - ${text}` : text);
  };

  if (quotes.length === 0) {
    return (
      <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="text-slate-300" size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sem histórico</h3>
        <p className="text-slate-500 font-medium">Os orçamentos agrupados por empresa aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">HISTÓRICO POR EMPRESA</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Gerenciamento inteligente de solicitações e aprovações</p>
        </div>
        <div className="bg-indigo-600 text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200">
          {groupedQuotes.length} Empresas Ativas
        </div>
      </div>

      <div className="space-y-6">
        {groupedQuotes.map(([supplierName, supplierQuotes]) => (
          <div key={supplierName} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
            {/* Accordion Header */}
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
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Phone size={10} className="text-emerald-500" /> {supplierQuotes[0].supplierPhone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex -space-x-3">
                  {supplierQuotes.slice(0, 3).map((q, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                      {q.photo ? <img src={q.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14}/></div>}
                    </div>
                  ))}
                  {supplierQuotes.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      +{supplierQuotes.length - 3}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  {expandedSuppliers[supplierName] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
            </button>

            {/* Accordion Content */}
            {expandedSuppliers[supplierName] && (
              <div className="p-8 pt-0 border-t border-slate-100 bg-white animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 gap-6 mt-8">
                  {supplierQuotes.sort((a, b) => b.createdAt - a.createdAt).map(quote => (
                    <div key={quote.id} className="relative bg-slate-50/50 rounded-3xl border border-slate-200 p-6 flex flex-col lg:flex-row gap-8 transition-all hover:bg-white hover:shadow-lg group">
                      {/* Photo Section */}
                      <div className="w-full lg:w-56 h-56 flex-shrink-0 relative rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                        {quote.photo ? (
                          <img src={quote.photo} alt="Budget" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <ImageIcon size={48} />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
                           {new Date(quote.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                quote.type === QuoteType.REQUEST 
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {quote.type === QuoteType.REQUEST ? 'Aguardando Aprovação' : 'Orçamento Aprovado'}
                              </span>
                              {quote.prefix && (
                                <span className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                  {quote.prefix}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => onDelete(quote.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          {/* Área de Edição para Aprovação */}
                          {approvingQuoteId === quote.id ? (
                            <div className="space-y-4 animate-in zoom-in-95 duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                  <Edit3 size={14} /> Editar OBS para Aprovação
                                </h5>
                                <button onClick={cancelApproval} className="text-slate-400 hover:text-rose-500"><X size={18}/></button>
                              </div>
                              <textarea
                                value={editObservations}
                                onChange={(e) => setEditObservations(e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 outline-none font-black text-sm uppercase resize-none h-32 shadow-inner"
                                placeholder="AUTORIZADO A REALIZAR O SERVIÇOS..."
                              />
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => addQuickText('AUTORIZADO A REALIZAR O SERVIÇOS')}
                                  className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                                >
                                  + Autorizar Serviços
                                </button>
                                <button 
                                  onClick={() => addQuickText('ANEXAR NOTAS FISCAIS NO SISTEMA VOLUS')}
                                  className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                                >
                                  + Anexar Notas Volus
                                </button>
                                <button 
                                  onClick={() => addQuickText('COMPRA AUTORIZADA')}
                                  className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                                >
                                  + Compra Autorizada
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-inner">
                               <pre className="text-[11px] font-black text-slate-900 whitespace-pre-wrap uppercase leading-tight font-sans tracking-tight">
                                 {quote.observations}
                               </pre>
                            </div>
                          )}
                        </div>

                        {/* Actions Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                          {quote.type === QuoteType.REQUEST ? (
                            approvingQuoteId === quote.id ? (
                              <button
                                onClick={() => confirmApproval(quote)}
                                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                              >
                                <Save size={18} />
                                Confirmar e Enviar Aprovado
                              </button>
                            ) : (
                              <button
                                onClick={() => startApproval(quote)}
                                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                              >
                                <CheckCircle2 size={18} />
                                Aprovar Orçamento
                              </button>
                            )
                          ) : (
                            <div className="w-full sm:flex-1 bg-emerald-50 text-emerald-600 font-black py-4 px-6 rounded-2xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 border border-emerald-100">
                              <CheckCircle2 size={18} />
                              Já Aprovado
                            </div>
                          )}

                          <button
                            onClick={() => handleResend(quote)}
                            className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-3 py-4 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                              statusId === quote.id 
                                ? 'bg-indigo-100 text-indigo-600' 
                                : 'bg-slate-900 text-white hover:bg-black'
                            }`}
                          >
                            {statusId === quote.id ? (
                               <><Check size={18} /> Enviando...</>
                            ) : (
                               <><Share2 size={18} /> Reenviar Whats</>
                            )}
                          </button>
                        </div>
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
