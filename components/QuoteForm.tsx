
import React, { useState } from 'react';
import { Clock, Phone, FileText, Package, Wrench, Share2, Check, Image as ImageIcon, AlertCircle, Info } from 'lucide-react';
import { Quote, QuoteType } from '../types';

interface QuoteListProps {
  quotes: Quote[];
  onDelete: (id: string) => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ quotes, onDelete }) => {
  const [statusId, setStatusId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');

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

  const copyPhotoToClipboard = async (base64: string) => {
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
        if (!ctx) throw new Error("Canvas fail");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error("Blob fail");
        return blob;
      })();

      const item = new ClipboardItem({ 'image/png': clipboardPromise });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSend = async (quote: Quote) => {
    const cleanPhone = quote.supplierPhone.replace(/\D/g, '');
    const cleanText = quote.observations.replace(/[`*]/g, ''); // Limpeza extra preventiva
    const encodedText = encodeURIComponent(cleanText);
    setStatusId(quote.id);

    if (isMobile() && navigator.share && quote.photo) {
      try {
        setStatusMsg('Anexando...');
        const imageFile = base64ToFile(quote.photo, `volus-${Date.now()}.jpg`);
        await navigator.share({ files: [imageFile], text: cleanText });
        setStatusMsg('Enviado!');
        setTimeout(() => setStatusId(null), 2000);
        return;
      } catch (err) {}
    }

    let clipboardSuccess = false;
    if (quote.photo) {
      setStatusMsg('Copiando Foto...');
      clipboardSuccess = await copyPhotoToClipboard(quote.photo);
      if (!isMobile()) {
        if (clipboardSuccess) {
          alert("📸 FOTO COPIADA!\n\nO WhatsApp vai abrir.\nBasta dar CTRL + V no chat para enviar a FOTO + TEXTO.");
        } else {
          alert("⚠️ Não foi possível copiar a foto automaticamente.\nO WhatsApp abrirá com o texto, anexe a foto manualmente.");
        }
      }
    }

    setStatusMsg('Abrindo WhatsApp...');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');

    setStatusMsg(clipboardSuccess ? 'Cole com CTRL+V' : 'Enviado');
    setTimeout(() => {
      setStatusId(null);
      setStatusMsg('');
    }, 5000);
  };

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <FileText className="text-slate-400 mx-auto mb-4" size={32} />
        <h3 className="text-lg font-semibold">Nenhum histórico</h3>
        <p className="text-slate-500">Inicie um novo orçamento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {quotes.map((quote) => (
        <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-md hover:border-indigo-200">
          {quote.photo && (
            <div className="w-full md:w-52 h-52 md:h-auto overflow-hidden bg-slate-100 relative">
              <img src={quote.photo} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            </div>
          )}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${quote.type === QuoteType.REQUEST ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {quote.type === QuoteType.REQUEST ? 'SOLICITADO' : 'APROVADO'}
                </span>
                <span className="text-[10px] text-slate-400">{new Date(quote.createdAt).toLocaleString()}</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase">{quote.supplierName}</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <pre className="text-slate-900 text-[11px] font-black uppercase whitespace-pre-wrap leading-tight font-sans">
                  {quote.observations}
                </pre>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-50">
              <button onClick={() => onDelete(quote.id)} className="text-xs font-bold text-slate-300 hover:text-rose-500">Excluir</button>
              <button onClick={() => handleSend(quote)} disabled={statusId === quote.id} className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 min-w-[240px] justify-center ${statusId === quote.id ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                {statusId === quote.id ? statusMsg : <><Share2 size={16} /> ENVIAR FOTO + TEXTO</>}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuoteList;
