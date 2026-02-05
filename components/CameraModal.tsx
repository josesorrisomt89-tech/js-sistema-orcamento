
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Upload, Image as ImageIcon, RotateCw, Crop, Maximize, Loader2 } from 'lucide-react';

interface CameraModalProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0); 
  const [isSquare, setIsSquare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Câmera não suportada neste navegador.");
      setIsInitializing(false);
      return;
    }

    // Usando constraints básicos para máxima compatibilidade
    const attempts = [
      { video: { facingMode: 'environment' } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let lastError: any = null;
    for (const constraints of attempts) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
        setIsInitializing(false);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    setError("Erro ao acessar câmera: " + (lastError?.message || "Dispositivo não encontrado"));
    setIsInitializing(false);
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (ctx && video.videoWidth > 0) {
        // Captura o frame exatamente no tamanho que a câmera está enviando
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopStream();
      }
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const processFinalImage = () => {
    if (!capturedImage || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      // Define se a imagem final é vertical baseada na rotação
      const isVertical = rotation === 90 || rotation === 270;
      const rotatedW = isVertical ? img.height : img.width;
      const rotatedH = isVertical ? img.width : img.height;

      // Cálculo de dimensões para recorte quadrado ou normal
      let finalW = rotatedW;
      let finalH = rotatedH;
      if (isSquare) {
        const size = Math.min(rotatedW, rotatedH);
        finalW = size;
        finalH = size;
      }

      // Redimensiona canvas para o output final
      canvas.width = finalW;
      canvas.height = finalH;

      ctx.save();
      ctx.translate(finalW / 2, finalH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Desenha centralizado
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const finalBase64 = canvas.toDataURL('image/jpeg', 0.85);
      
      // Pequeno delay para garantir que o canvas exportou
      setTimeout(() => {
        if (finalBase64 && finalBase64.length > 100) {
          onCapture(finalBase64);
          onClose();
        } else {
          alert("Erro ao processar imagem. Tente novamente.");
          setIsProcessing(false);
        }
      }, 50);
    };
    img.src = capturedImage;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        stopStream();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 text-white z-20">
        <div className="flex items-center gap-3">
           <Camera size={18} className="text-indigo-400" />
           <span className="text-[10px] font-black uppercase tracking-widest">Captura de Documento</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
        {isInitializing && !error && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Iniciando Lente...</p>
          </div>
        )}

        {error ? (
          <div className="text-white text-center p-8 space-y-6">
            <AlertCircle className="mx-auto text-rose-500" size={48} />
            <p className="text-xs font-bold">{error}</p>
            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">
              Usar Foto da Galeria
            </button>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
             <div className={`relative transition-all duration-300 ${isSquare ? 'aspect-square w-full max-w-[85vw] overflow-hidden rounded-3xl border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20' : 'max-h-full max-w-full'}`}>
                <img 
                  src={capturedImage} 
                  alt="Preview" 
                  className="max-w-full max-h-[70vh] object-contain transition-transform duration-300" 
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
             </div>
             
             {/* Edit Tools */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                <button onClick={handleRotate} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg">
                  <RotateCw size={20} />
                </button>
                <button onClick={() => setIsSquare(!isSquare)} className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg ${isSquare ? 'bg-indigo-600 border-indigo-400' : 'bg-white/10'}`}>
                  {isSquare ? <Maximize size={20} /> : <Crop size={20} />}
                </button>
             </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] aspect-[4/3] border-2 border-white/20 rounded-3xl relative">
                   <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                   <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-8 pb-12 flex items-center justify-center gap-8 bg-slate-900/90 border-t border-white/5">
        {capturedImage ? (
          <>
            <button onClick={() => { setCapturedImage(null); startCamera(); }} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-all">
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <RefreshCw size={24} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Refazer</span>
            </button>
            <button 
              onClick={processFinalImage} 
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl active:scale-95 transition-all">
                {isProcessing ? <Loader2 className="animate-spin" size={32} /> : <Check size={40} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1">Concluir</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-12">
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-white/40 hover:text-white">
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
                <ImageIcon size={24} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Galeria</span>
            </button>
            
            <button 
              onClick={capturePhoto}
              className={`flex flex-col items-center gap-2 text-white ${error || isInitializing ? 'opacity-20 pointer-events-none' : ''}`}
              disabled={!!error || isInitializing}
            >
              <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center active:scale-90 transition-all shadow-2xl bg-white text-slate-900 p-1">
                <div className="w-full h-full rounded-full border-2 border-slate-900/10 flex items-center justify-center">
                  <Camera size={32} />
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto</span>
            </button>

            <div className="w-14"></div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
