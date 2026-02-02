
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

interface CameraModalProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("❌ Não foi possível acessar a câmera. Verifique se deu permissão ao navegador.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Ajusta canvas para a resolução real do vídeo
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md text-white z-10">
        <h3 className="text-xs font-black uppercase tracking-widest">Capturar Peça/Doc</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-8 space-y-6">
            <p className="text-sm font-bold leading-relaxed">{error}</p>
            <button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest">Voltar</button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="p-8 flex items-center justify-center gap-8 bg-black/80 backdrop-blur-md border-t border-white/10">
        {capturedImage ? (
          <>
            <button 
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 text-white/70 hover:text-white"
            >
              <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/5">
                <RefreshCw size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Refazer</span>
            </button>
            <button 
              onClick={handleConfirm}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/20 active:scale-90 transition-transform">
                <Check size={32} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Confirmar</span>
            </button>
          </>
        ) : (
          <button 
            onClick={capturePhoto}
            className="group flex flex-col items-center gap-2 text-white"
          >
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center group-active:scale-90 transition-transform p-1.5">
              <div className="w-full h-full rounded-full bg-white shadow-xl"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
