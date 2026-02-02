
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
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
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative w-full h-full max-w-2xl bg-slate-900 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <h3 className="text-lg font-semibold">Capturar Foto</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {error ? (
            <div className="text-white text-center p-6">
              <p className="mb-4">{error}</p>
              <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-lg font-medium">Voltar</button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-8 flex items-center justify-center gap-6 bg-slate-900">
          {capturedImage ? (
            <>
              <button 
                onClick={handleRetake}
                className="flex flex-col items-center gap-2 text-white opacity-80 hover:opacity-100"
              >
                <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center">
                  <RefreshCw size={24} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider">Refazer</span>
              </button>
              <button 
                onClick={handleConfirm}
                className="flex flex-col items-center gap-2 text-white"
              >
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Check size={24} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider">Confirmar</span>
              </button>
            </>
          ) : (
            <button 
              onClick={capturePhoto}
              className="group flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group-active:scale-95 transition-transform p-1">
                <div className="w-full h-full rounded-full bg-white"></div>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Capturar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
