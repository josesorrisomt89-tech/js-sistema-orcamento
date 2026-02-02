
import React, { useState, useRef } from 'react';
import { Camera, Send, Trash2, Loader2, Plus, Users, User, Wrench, Package, Image as ImageIcon, Info, Search, UserCheck } from 'lucide-react';
import { QuoteType, Quote, BatchItem, Supplier } from '../types';
import CameraModal from './CameraModal';
import { formatQuoteMessage } from '../services/geminiService';

interface QuoteFormProps {
  onSave: (quotes: Quote[]) => void;
  suppliers?: Supplier[];
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onSave, suppliers = [] }) => {
  const [type, setType] = useState<QuoteType>(QuoteType.REQUEST);
  const [isMultiMode, setIsMultiMode] = useState(false);
  
  const [singleSupplier, setSingleSupplier] = useState({ 
    name: '', 
    phone: '', 
    prefix: '',
    quoteNumberParts: '', 
    quoteNumberServices: '' 
  });
  
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { id: crypto.randomUUID(), supplierName: '', supplierPhone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' }
  ]);

  const [photo, setPhoto] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectSupplierBatch = (id: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const supplier = suppliers.find(s => s.id === selectedId);
    if (supplier) {
      updateBatchItem(id, 'supplierName', supplier.name);
      updateBatchItem(id, 'supplierPhone', supplier.phone);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const base64ToFile = (base64String: string, fileName: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
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
    if (itemsToProcess.some(i => !i.supplierName || !i.supplierPhone) || !observations || !photo) {
      alert("Preencha fornecedor, telefone, observações e anexe uma foto.");
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
          photo, observations: polishedMessage, createdAt: Date.now()
        });
      }
      onSave(generatedQuotes);
      if (generatedQuotes.length > 0) {
        const q = generatedQuotes[0];
        const cleanPhone = q.supplierPhone.replace(/\D/g, '');
        const encodedText = encodeURIComponent(q.observations);
        if (isMobile() && navigator.share && q.photo) {
          try {
            const imageFile = base64ToFile(q.photo, `volus-${Date.now()}.jpg`);
            await navigator.share({ files: [imageFile], text: q.observations });
          } catch (shareErr) {
            window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
          }
        } else {
          if (q.photo && !isMobile()) {
            const copied = await copyImageToClipboard(q.photo);
            if (copied) alert("📸 FOTO COPIADA! No WhatsApp, aperte CTRL+V.");
          }
          window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
        }
      }
      setSingleSupplier({ name: '', phone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' });
      setBatchItems([{ id: crypto.randomUUID(), supplierName: '', supplierPhone: '', prefix: '', quoteNumberParts: '', quoteNumberServices: '' }]);
      setPhoto(null);
      setObservations('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Tipo de Ação</label>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setType(QuoteType.REQUEST)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === QuoteType.REQUEST ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pedido</button>
              <button type="button" onClick={() => setType(QuoteType.APPROVAL)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === QuoteType.APPROVAL ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aprovação</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Modo de Trabalho</label>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button type="button" onClick={() => setIsMultiMode(false)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isMultiMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User size={16} /> Único</button>
              <button type="button" onClick={() => setIsMultiMode(true)} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isMultiMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={16} /> Em Lote</button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              {isMultiMode ? <Users size={14}/> : <User size={14}/>} 
              DADOS DO FORNECEDOR
            </h3>
            {suppliers.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1"><UserCheck size={12}/> Usar Salvo:</span>
                <select 
                  onChange={!isMultiMode ? handleSelectSupplierSingle : undefined}
                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
                  defaultValue=""
                >
                  <option value="" disabled>Escolher contato...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          
          {!isMultiMode ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input type="text" placeholder="Nome" value={singleSupplier.name} onChange={e => setSingleSupplier({...singleSupplier, name: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
              <input type="tel" placeholder="WhatsApp" value={singleSupplier.phone} onChange={e => setSingleSupplier({...singleSupplier, phone: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
              <input type="text" placeholder="Prefixo (Ex: V-145)" value={singleSupplier.prefix} onChange={e => setSingleSupplier({...singleSupplier, prefix: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
              <input type="text" placeholder="ORC. Peças" value={singleSupplier.quoteNumberParts} onChange={e => setSingleSupplier({...singleSupplier, quoteNumberParts: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
              <input type="text" placeholder="ORC. Serviços" value={singleSupplier.quoteNumberServices} onChange={e => setSingleSupplier({...singleSupplier, quoteNumberServices: e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
          ) : (
            <div className="space-y-4">
              {batchItems.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 group">
                  <div className="md:col-span-2 relative">
                    <input type="text" placeholder="Nome" value={item.supplierName} onChange={e => updateBatchItem(item.id, 'supplierName', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    {suppliers.length > 0 && (
                      <select onChange={e => handleSelectSupplierBatch(item.id, e)} className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold bg-white/80 border border-slate-200 rounded p-1 outline-none max-w-[60px]" defaultValue=""><option value="" disabled>Salvos</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    )}
                  </div>
                  <div className="md:col-span-2"><input type="tel" placeholder="Whats" value={item.supplierPhone} onChange={e => updateBatchItem(item.id, 'supplierPhone', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div className="md:col-span-2"><input type="text" placeholder="Prefixo" value={item.prefix} onChange={e => updateBatchItem(item.id, 'prefix', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div className="md:col-span-2"><input type="text" placeholder="Peças" value={item.quoteNumberParts} onChange={e => updateBatchItem(item.id, 'quoteNumberParts', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div className="md:col-span-3"><input type="text" placeholder="Serviços" value={item.quoteNumberServices} onChange={e => updateBatchItem(item.id, 'quoteNumberServices', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                  <div className="md:col-span-1 flex justify-center"><button type="button" disabled={batchItems.length === 1} onClick={() => removeBatchItem(item.id)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button></div>
                </div>
              ))}
              <button type="button" onClick={addBatchItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest"><Plus size={20} /> Adicionar Fornecedor ao Lote</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Anexar Documento / Peças</label>
            <div className="relative aspect-square">
              {photo ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 group shadow-md"><img src={photo} alt="Doc" className="w-full h-full object-cover" /><button type="button" onClick={() => setPhoto(null)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-sm text-white gap-2 font-bold"><Trash2 size={40} />Remover Foto</button></div>
              ) : (
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-6 bg-slate-50 transition-colors hover:bg-indigo-50/30 group">
                  <div className="flex flex-col items-center gap-3">
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all group p-4"><div className="p-5 bg-white rounded-full shadow-lg border border-slate-100 group-hover:scale-110 transition-transform"><Camera size={32} /></div><span className="text-[10px] font-black uppercase tracking-widest">Câmera</span></button>
                    <div className="w-16 h-[1px] bg-slate-200"></div>
                    <button type="button" onClick={triggerFilePicker} className="flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all group p-4"><div className="p-5 bg-white rounded-full shadow-lg border border-slate-100 group-hover:scale-110 transition-transform"><ImageIcon size={32} /></div><span className="text-[10px] font-black uppercase tracking-widest">Galeria</span></button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
          <div className="md:col-span-8 flex flex-col">
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">Observações Adicionais</label>
            <textarea required rows={10} placeholder="Liste as peças, defeitos ou detalhes técnicos aqui..." value={observations} onChange={e => setObservations(e.target.value)} className="flex-1 w-full px-6 py-5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner font-black uppercase text-sm leading-relaxed" />
          </div>
        </div>

        <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-black py-6 px-8 rounded-2xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] text-xl uppercase tracking-widest">
          {isProcessing ? <><Loader2 className="animate-spin" size={28} /><span>Processando IA...</span></> : <><Send size={28} /><span>Gerar e Enviar Agora</span></>}
        </button>
      </form>
      {isCameraOpen && <CameraModal onCapture={img => setPhoto(img)} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};

export default QuoteForm;
