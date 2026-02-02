
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
      // Importante: Focar a janela antes de tentar acessar o clipboard
      window.focus();

      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error("Clipboard API não suportada");
      }

      // Para evitar o erro de "Write permission denied", usamos o padrão de passar uma Promise
      // para o ClipboardItem. Isso mantém o vínculo com o clique do usuário ativo.
      const clipboardPromise = (async () => {
        const img = new Image();
        img.src = base64;
        await img.decode(); // Mais rápido que o onload tradicional

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Falha ao criar contexto do canvas");
        
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });

        if (!blob) throw new Error("Falha ao gerar Blob da imagem");
        return blob;
      })();

      const item = new ClipboardItem({
        'image/png': clipboardPromise
      });

      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.error("Erro detalhado do clipboard:", err);
      // Se falhar por permissão, tentamos avisar o usuário de forma clara
      return false;
    }
  };

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSend = async (quote: Quote) => {
    const cleanPhone = quote.supplierPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(quote.observations);
    setStatusId(quote.id);

    // No MOBILE usamos a API de Compartilhamento
    if (isMobile() && navigator.share && quote.photo) {
      try {
        setStatusMsg('Anexando...');
        const imageFile = base64ToFile(quote.photo, `volus-${Date.now()}.jpg`);
        
        await navigator.share({
          files: [imageFile],
          text: quote.observations,
        });
        
        setStatusMsg('Sucesso!');
        setTimeout(() => setStatusId(null), 2000);
        return;
      } catch (err) {
        console.log("Share API cancelada ou falhou.");
      }
    }

    // No DESKTOP usamos Copiar + Colar
    let clipboardSuccess = false;
    if (quote.photo) {
      setStatusMsg('Copiando...');
      clipboardSuccess = await copyPhotoToClipboard(quote.photo);
      
      if (!isMobile()) {
        if (clipboardSuccess) {
          alert("📸 FOTO COPIADA COM SUCESSO!\n\n1. O WhatsApp vai abrir agora.\n2. Clique no chat do fornecedor.\n3. Aperte CTRL + V para enviar a FOTO + TEXTO juntos.");
        } else {
          alert("⚠️ AVISO: Não conseguimos copiar a foto automaticamente devido às permissões do seu navegador.\n\nO WhatsApp abrirá apenas com o texto. Você precisará anexar a foto manualmente se desejar.");
        }
      }
    }

    setStatusMsg('Abrindo WhatsApp...');
    const waUrl = `https://wa.me/55${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');

    setStatusMsg(clipboardSuccess ? 'Cole com CTRL+V' : 'Enviado');
    setTimeout(() => {
      setStatusId(null);
      setStatusMsg('');
    }, 6000);
  };

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Nenhum histórico</h3>
        <p className="text-slate-500">Inicie um novo orçamento para vê-lo aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {quotes.sort((a, b) => b.createdAt - a.createdAt).map((quote) => (
        <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-md hover:border-indigo-200">
          {quote.photo && (
            <div className="w-full md:w-52 h-52 md:h-auto overflow-hidden bg-slate-100 border-r border-slate-100 relative">
              <img src={quote.photo} alt="Quote" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute top-2 left-2 bg-indigo-600 text-white p-1 rounded shadow-sm">
                <ImageIcon size={14} />
              </div>
            </div>
          )}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                    quote.type === QuoteType.REQUEST 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {quote.type === QuoteType.REQUEST ? 'SOLICITADO' : 'APROVADO'}
                  </span>
                  {quote.prefix && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold">
                      <Info size={10} /> {quote.prefix}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                  <Clock size={12} />
                  {new Date(quote.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900 leading-none uppercase">{quote.supplierName}</h4>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                  <Phone size={14} className="text-emerald-500" />
                  <span className="font-medium">{quote.supplierPhone}</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                <pre className="text-slate-900 text-[11px] font-sans whitespace-pre-wrap font-black uppercase leading-tight">
                  {quote.observations}
                </pre>
              </div>
            </div>
            
            <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
              <button
                onClick={() => onDelete(quote.id)}
                className="text-xs font-bold text-slate-300 hover:text-rose-500 transition-colors"
              >
                Excluir
              </button>
              
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => handleSend(quote)}
                  disabled={statusId === quote.id}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 min-w-[280px] justify-center ${
                    statusId === quote.id 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {statusId === quote.id ? (
                    <>
                      <span className="animate-pulse uppercase">{statusMsg}</span>
                      <Check size={16} />
                    </>
                  ) : (
                    <>
                      ENVIAR FOTO + TEXTO
                      <Share2 size={16} />
                    </>
                  )}
                </button>
                <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 uppercase tracking-tighter mt-1">
                  <AlertCircle size={12} /> FOTO ESSENCIAL PARA O ORÇAMENTO
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuoteList;
