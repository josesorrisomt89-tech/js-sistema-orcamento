
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, Trash2, Loader2, Plus, Users, User, Image as ImageIcon, CheckCircle, FileText, Paperclip, X } from 'lucide-react';
import { QuoteType, Quote, BatchItem, Supplier, AttachedFile } from '../types';
import CameraModal from './CameraModal';
import { formatQuoteMessage } from '../services/geminiService';

interface QuoteFormProps {
  onSave: (quotes: Quote[]) => void;
  suppliers?: Supplier[];
}

const DRAFT_KEY = 'quoteflow_draft_v2';

const QuoteForm: React.FC<QuoteFormProps> = ({ onSave, suppliers = [] }) => {
  const [type, setType] = useState<QuoteType>(QuoteType.REQUEST);
  const [isMultiMode, setIsMultiMode] = useState(false);
  
  const [singleSupplier, setSingleSupplier] = useState({ 
    name: '', phone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' 
  });
  
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { id: crypto.randomUUID(), supplierName: '', supplierPhone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' }
  ]);

  const [photo, setPhoto] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [observations, setObservations] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSingleSupplier(parsed.singleSupplier || singleSupplier);
        setObservations(parsed.observations || '');
        setPhoto(parsed.photo || null);
        setAttachedFiles(parsed.attachedFiles || []);
        setIsMultiMode(parsed.isMultiMode || false);
      } catch (e) { console.error("Erro ao carregar rascunho", e); }
    }
  }, []);

  useEffect(() => {
    const draft = { singleSupplier, observations, photo, attachedFiles, isMultiMode };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setShowDraftSaved(true);
    const timer = setTimeout(() => setShowDraftSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [singleSupplier, observations, photo, attachedFiles, isMultiMode]);

  const addBatchItem = () => {
    setBatchItems([...batchItems, { id: crypto.randomUUID(), supplierName: '', supplierPhone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' }]);
  };

  const removeBatchItem = (id: string) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter(item => item.id !== id));
    }
  };

  const updateBatchItem = (id: string, field: keyof BatchItem, value: string) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSelectSupplierSingle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const supplier = suppliers.find(s => s.id === selectedId);
    if (supplier) {
      setSingleSupplier(prev => ({ ...prev, name: supplier.name, phone: supplier.phone }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly type 'file' as File to resolve 'unknown' property access errors reported on lines 97, 99, 102
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            data: reader.result as string,
            type: file.type
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToProcess = isMultiMode ? batchItems : [
      { 
        id: 'single', 
        supplierName: singleSupplier.name, 
        supplierPhone: singleSupplier.phone, 
        prefix: singleSupplier.prefix,
        quoteNumberParts: singleSupplier.quoteNumberParts,
        quoteNumberServices: singleSupplier.quoteNumberServices
      }
    ];
    
    if (itemsToProcess.some(i => !i.supplierName || !i.supplierPhone) || !observations || (!photo && attachedFiles.length === 0)) {
      alert("⚠️ Preencha os dados e anexe pelo menos uma FOTO ou um ARQUIVO.");
      return;
    }

    setIsProcessing(true);
    const generatedQuotes: Quote[] = [];
    try {
      for (const item of itemsToProcess) {
        const polishedMessage = await formatQuoteMessage(type, observations, item.supplierName, item.prefix, item.quoteNumberParts, item.quoteNumberServices);
        generatedQuotes.push({
          id: crypto.randomUUID(), type, supplierName: item.supplierName, supplierPhone: item.supplierPhone,
          prefix: item.prefix, quoteNumberParts: item.quoteNumberParts, quoteNumberServices: item.quoteNumberServices,
          photo, files: attachedFiles, observations: polishedMessage, createdAt: Date.now()
        });
      }
      
      onSave(generatedQuotes);
      
      if (generatedQuotes.length > 0) {
        const q = generatedQuotes[0];
        const cleanPhone = q.supplierPhone.replace(/\D/g, '');
        const encodedText = encodeURIComponent(q.observations);
        
        if (isMobile() && (navigator as any).share) {
          const filesToShare: File[] = [];
          if (q.photo) filesToShare.push(base64ToFile(q.photo, 'foto-peca.jpg', 'image/jpeg'));
          q.files?.forEach(f => filesToShare.push(base64ToFile(f.data, f.name, f.type)));

          const shareData: any = { text: q.observations, files: filesToShare };
          
          if ((navigator as any).canShare && (navigator as any).canShare(shareData)) {
            try {
              await (navigator as any).share(shareData);
            } catch (err) {
              window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
            }
          } else {
            window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
          }
        } else {
          window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
        }
      }

      setSingleSupplier({ name: '', phone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' });
      setPhoto(null);
      setAttachedFiles([]);
      setObservations('');
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao processar.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-4 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="flex justify-end -mb-4">
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-opacity ${showDraftSaved ? 'opacity-100 text-emerald-500' : 'opacity-0'}`}>
            <CheckCircle size={10} /> Rascunho Atualizado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ação</label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setType(QuoteType.REQUEST)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${type === QuoteType.REQUEST ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>PEDIDO</button>
              <button type="button" onClick={() => setType(QuoteType.APPROVAL)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${type === QuoteType.APPROVAL ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>APROVAÇÃO</button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Modo</label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setIsMultiMode(false)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${!isMultiMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><User size={14} /> ÚNICO</button>
              <button type="button" onClick={() => setIsMultiMode(true)} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${isMultiMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Users size={14} /> LOTE</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">FORNECEDOR</h3>
            {suppliers.length > 0 && (
              <select onChange={handleSelectSupplierSingle} className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500">
                <option value="" disabled selected>Contatos Salvos...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          
          {!isMultiMode ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input type="text" placeholder="Nome Empresa" value={singleSupplier.name} onChange={e => setSingleSupplier({...singleSupplier, name: e.target.value})} className="px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm" />
              <input type="tel" placeholder="WhatsApp" value={singleSupplier.phone} onChange={e => setSingleSupplier({...singleSupplier, phone: e.target.value})} className="px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm" />
              <input type="text" placeholder="Prefixo" value={singleSupplier.prefix} onChange={e => setSingleSupplier({...singleSupplier, prefix: e.target.value})} className="px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm" />
              <input type="text" placeholder="Nº Peças" value={singleSupplier.quoteNumberParts} onChange={e => setSingleSupplier({...singleSupplier, quoteNumberParts: e.target.value})} className="px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm" />
              <input type="text" placeholder="Nº Serviços" value={singleSupplier.quoteNumberServices} onChange={e => setSingleSupplier({...singleSupplier, quoteNumberServices: e.target.value})} className="px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 text-sm" />
            </div>
          ) : (
            <div className="space-y-4">
              {batchItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                  <input type="text" placeholder="Nome" value={item.supplierName} onChange={e => updateBatchItem(item.id, 'supplierName', e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <input type="tel" placeholder="WhatsApp" value={item.supplierPhone} onChange={e => updateBatchItem(item.id, 'supplierPhone', e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" placeholder="Pref" value={item.prefix} onChange={e => updateBatchItem(item.id, 'prefix', e.target.value)} className="px-4 py-3 text-sm rounded-xl border border-slate-300 font-bold" />
                    <input type="text" placeholder="Peças" value={item.quoteNumberParts} onChange={e => updateBatchItem(item.id, 'quoteNumberParts', e.target.value)} className="px-4 py-3 text-sm rounded-xl border border-slate-300 font-bold" />
                    <input type="text" placeholder="Serv" value={item.quoteNumberServices} onChange={e => updateBatchItem(item.id, 'quoteNumberServices', e.target.value)} className="px-4 py-3 text-sm rounded-xl border border-slate-300 font-bold" />
                  </div>
                  <button type="button" onClick={() => removeBatchItem(item.id)} className="absolute top-2 right-2 p-2 text-rose-400"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={addBatchItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest"><Plus size={16} /> ADICIONAR AO LOTE</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">FOTO DA PEÇA</label>
              <div className="relative aspect-video">
                {photo ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                    <img src={photo} alt="Doc" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhoto(null)} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2 font-black uppercase text-xs tracking-widest opacity-0 hover:opacity-100 transition-opacity">
                      <Trash2 size={32} /> Remover Foto
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-around bg-slate-50 p-4">
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center"><Camera size={28} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">CÂMERA</span>
                      </button>
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center"><ImageIcon size={28} /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">GALERIA</span>
                      </button>
                  </div>
                )}
                <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" capture="environment" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">ARQUIVOS / PDF (OPCIONAL)</label>
              <div className="space-y-2">
                <button type="button" onClick={() => docInputRef.current?.click()} className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 transition-all">
                  <Paperclip size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">ANEXAR PDF / DOC</span>
                </button>
                <input type="file" ref={docInputRef} onChange={handleDocChange} className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" />
                
                <div className="grid grid-cols-1 gap-2">
                  {attachedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={18} className="text-indigo-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-indigo-900 truncate">{f.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="p-1 text-indigo-300 hover:text-rose-500"><X size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">OBSERVAÇÕES DO ORÇAMENTO</label>
            <textarea required rows={10} placeholder="Detalhe as peças solicitadas or o diagnóstico..." value={observations} onChange={e => setObservations(e.target.value)} className="flex-1 w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner font-black uppercase text-xs leading-relaxed text-slate-700" />
          </div>
        </div>

        <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-5 px-6 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-lg uppercase tracking-widest">
          {isProcessing ? <><Loader2 className="animate-spin" size={24} /><span>GERANDO...</span></> : <><Send size={24} /><span>ENVIAR TUDO NO WHATSAPP</span></>}
        </button>
      </form>
      {isCameraOpen && <CameraModal onCapture={img => { setPhoto(img); setIsCameraOpen(false); }} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};

export default QuoteForm;
