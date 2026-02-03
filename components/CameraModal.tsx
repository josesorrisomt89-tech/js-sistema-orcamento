
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
      setError("❌ Seu navegador não suporta acesso à câmera ou a conexão não é segura (HTTPS).");
      setIsInitializing(false);
      return;
    }

    // Lista de tentativas em ordem decrescente de exigência
    const attempts = [
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let mediaStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err) {
        lastError = err;
        console.warn("Tentativa falhou:", constraints, err);
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Tenta dar play explicitamente para garantir que o vídeo comece
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro ao dar play no vídeo:", playErr);
        }
      }
      setIsInitializing(false);
    } else {
      let errorMsg = "❌ Não foi possível acessar a câmera.";
      
      if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        errorMsg = "❌ Nenhuma câmera detectada. Certifique-se de que o dispositivo possui uma câmera funcional e conectada.";
      } else if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        errorMsg = "❌ Permissão de câmera negada. Autorize o uso da câmera nas configurações do navegador para continuar.";
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        errorMsg = "❌ A câmera está sendo usada por outro aplicativo ou falhou ao iniciar.";
      } else if (lastError?.name === 'OverconstrainedError') {
        errorMsg = "❌ As configurações da câmera não são compatíveis com este dispositivo.";
      }
      
      setError(errorMsg);
      setIsInitializing(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup cleanup tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Run once on mount

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopStream();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setError(null);
        stopStream();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-xl text-white z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <Camera size={18} className="text-white" />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Captura Inteligente</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isInitializing && !error && (
          <div className="flex flex-col items-center gap-4 text-white">
            <RefreshCw className="animate-spin text-indigo-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando Hardware...</p>
          </div>
        )}

        {error ? (
          <div className="text-white text-center p-8 max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-rose-400">Falha na Câmera</h4>
              <p className="text-xs font-bold leading-relaxed text-slate-400">{error}</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-100 transition-all"
              >
                <Upload size={18} /> Selecionar da Galeria
              </button>
              <button 
                onClick={startCamera} 
                className="w-full bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={16} /> Tentar Novamente
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain animate-in zoom-in duration-300" />
        ) : (
          <div className="w-full h-full relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Guia Visual de Enquadramento */}
            <div className="absolute inset-0 border-[4rem] border-black/40 pointer-events-none flex items-center justify-center">
              <div className="w-full h-full border-2 border-dashed border-white/20 rounded-[2.5rem] relative">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl -mt-1 -ml-1"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl -mt-1 -mr-1"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl -mb-1 -ml-1"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl -mb-1 -mr-1"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 flex items-center justify-center gap-8 bg-black/90 backdrop-blur-2xl border-t border-white/10">
        {capturedImage ? (
          <>
            <button 
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-all">
                <RefreshCw size={28} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Refazer</span>
            </button>
            <button 
              onClick={handleConfirm}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/40 active:scale-95 transition-all">
                <Check size={40} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Confirmar</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-12">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-white/50 hover:text-white transition-all"
            >
              <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center">
                <ImageIcon size={24} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Galeria</span>
            </button>
            
            <button 
              onClick={capturePhoto}
              className={`group flex flex-col items-center gap-2 text-white ${error || isInitializing ? 'opacity-20 grayscale pointer-events-none' : ''}`}
              disabled={!!error || isInitializing}
            >
              <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center group-active:scale-90 transition-all p-2 shadow-2xl">
                <div className="w-full h-full rounded-full bg-white shadow-xl hover:bg-slate-100 transition-colors flex items-center justify-center">
                   <div className="w-1/2 h-1/2 border-2 border-slate-200 rounded-full"></div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capturar</span>
            </button>

            <div className="w-14"></div> {/* Spacer for symmetry */}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
