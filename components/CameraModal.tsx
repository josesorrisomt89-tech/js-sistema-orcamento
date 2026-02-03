
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Upload, Image as ImageIcon, RotateCw, Crop, Maximize, ZoomIn } from 'lucide-react';

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
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
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
      setError("❌ Seu navegador não suporta acesso à câmera ou a conexão não é segura (HTTPS).");
      setIsInitializing(false);
      return;
    }

    // Solicita a maior resolução possível do hardware
    const attempts = [
      { video: { facingMode: 'environment', width: { min: 1280, ideal: 3840 }, height: { min: 720, ideal: 2160 } } },
      { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } },
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
      }
    }

    if (mediaStream) {
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro ao dar play:", playErr);
        }
      }
      setIsInitializing(false);
    } else {
      let errorMsg = "❌ Não foi possível acessar a câmera.";
      if (lastError?.name === 'NotAllowedError') errorMsg = "❌ Permissão de câmera negada.";
      setError(errorMsg);
      setIsInitializing(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Captura na resolução nativa do vídeo (Alta Qualidade)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenha o frame original
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0); // Qualidade máxima
        setCapturedImage(dataUrl);
        setRotation(0);
        stopStream();
      }
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleToggleCrop = () => {
    setIsSquare(prev => !prev);
  };

  const processFinalImage = () => {
    if (!capturedImage || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      // Calcula dimensões baseadas na rotação
      const isVertical = rotation === 90 || rotation === 270;
      const targetWidth = isVertical ? img.height : img.width;
      const targetHeight = isVertical ? img.width : img.height;

      // Se for modo quadrado, calculamos o menor lado
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (isSquare) {
        const size = Math.min(targetWidth, targetHeight);
        finalWidth = size;
        finalHeight = size;
        offsetX = (targetWidth - size) / 2;
        offsetY = (targetHeight - size) / 2;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      ctx.save();
      
      // Aplica Rotação e Recorte
      if (isSquare) {
        ctx.translate(finalWidth / 2, finalHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Ajuste de offset após rotação
        if (rotation === 0) ctx.drawImage(img, -targetWidth/2, -targetHeight/2);
        else if (rotation === 90) ctx.drawImage(img, -targetHeight/2, -targetWidth/2);
        else if (rotation === 180) ctx.drawImage(img, -targetWidth/2, -targetHeight/2);
        else if (rotation === 270) ctx.drawImage(img, -targetHeight/2, -targetWidth/2);
      } else {
        ctx.translate(finalWidth / 2, finalHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }

      ctx.restore();

      const processedBase64 = canvas.toDataURL('image/jpeg', 0.95);
      onCapture(processedBase64);
      setIsProcessing(false);
      onClose();
    };
    img.src = capturedImage;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setRotation(0);
        setError(null);
        stopStream();
      };
      reader.readAsDataURL(file);
    }
  };

  // Add missing handleRetake function to discard captured image and restart camera
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl text-white z-20 border-b border-white/5">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
             <Camera size={16} className="text-white" />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Câmera Pro-Resolution</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Viewport Principal */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        {isInitializing && !error && (
          <div className="flex flex-col items-center gap-4 text-white">
            <RefreshCw className="animate-spin text-indigo-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sincronizando Sensor...</p>
          </div>
        )}

        {error ? (
          <div className="text-white text-center p-8 max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle size={40} />
            </div>
            <p className="text-xs font-bold leading-relaxed text-slate-400">{error}</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                <Upload size={18} /> Galeria do Celular
              </button>
              <button onClick={startCamera} className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                <RefreshCw size={16} /> Re-conectar
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
             {/* Preview de Edição */}
             <div 
               className={`relative transition-transform duration-300 ease-out shadow-2xl ${isSquare ? 'aspect-square max-h-full overflow-hidden rounded-3xl' : ''}`}
               style={{ transform: `rotate(${rotation}deg)`, maxHeight: '80vh' }}
             >
                <img src={capturedImage} alt="Review" className="max-w-full max-h-full object-contain" />
                {isSquare && (
                  <div className="absolute inset-0 border-4 border-indigo-500/50 pointer-events-none"></div>
                )}
             </div>

             {/* Ferramentas Flutuantes de Edição */}
             <div className="absolute top-6 right-6 flex flex-col gap-4">
                <button onClick={handleRotate} className="w-12 h-12 bg-white/10 hover:bg-indigo-600 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all">
                  <RotateCw size={20} />
                </button>
                <button onClick={handleToggleCrop} className={`w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all ${isSquare ? 'bg-indigo-600' : 'bg-white/10'}`}>
                  {isSquare ? <Maximize size={20} /> : <Crop size={20} />}
                </button>
             </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Máscara de Foco Profissional */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] aspect-[4/3] border-2 border-white/20 rounded-3xl relative">
                   <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                   <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                   <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                   <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] transform -rotate-90">Alinhamento Óptico</p>
                   </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Ação Inferiores */}
      <div className="p-10 flex items-center justify-center gap-10 bg-black/95 backdrop-blur-2xl border-t border-white/5">
        {capturedImage ? (
          <>
            <button onClick={handleRetake} className="flex flex-col items-center gap-2 text-white/40 hover:text-white transition-all group">
              <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10">
                <RefreshCw size={24} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Descartar</span>
            </button>
            <button 
              onClick={processFinalImage} 
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 text-white group"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 active:scale-90 transition-all">
                {isProcessing ? <RefreshCw className="animate-spin" size={32} /> : <Check size={40} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Salvar Foto</span>
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
              className={`group flex flex-col items-center gap-2 text-white ${error || isInitializing ? 'opacity-20 pointer-events-none' : ''}`}
              disabled={!!error || isInitializing}
            >
              <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center group-active:scale-90 transition-all p-2 shadow-2xl">
                <div className="w-full h-full rounded-full bg-white shadow-xl hover:bg-slate-100 flex items-center justify-center">
                   <div className="w-14 h-14 border-2 border-slate-200 rounded-full"></div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Capturar</span>
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
