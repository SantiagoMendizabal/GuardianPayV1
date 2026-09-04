import React, { useState, useEffect } from 'react';
import { ScanFace, CheckCircle2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export default function BiometricModal({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isMatched, setIsMatched] = useState(false);

  useEffect(() => {
    // 2-second simulation timer
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMatched(true);
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 text-white text-center animate-fade-in">
      
      {/* Top Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/20 border border-mint/40 text-mint text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Biometría Bancaria 3D</span>
        </div>
        <h3 className="text-base font-bold tracking-tight">Escaneo Facial en Vivo</h3>
      </div>

      {/* Face Scanner Holographic Viewport */}
      <div className="relative w-56 h-64 my-auto flex items-center justify-center">
        
        {/* Outer Corner Frame Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-mint rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-mint rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-mint rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-mint rounded-br-2xl" />

        {/* Laser Scanning Line */}
        {!isMatched && (
          <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-mint to-transparent shadow-[0_0_15px_#00D69E] animate-scan z-20" />
        )}

        {/* Silhouette / Face Target */}
        <div className="relative w-40 h-48 rounded-[38px] border-2 border-dashed border-mint/40 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-mint/5 to-yape-900/40">
          
          {isMatched ? (
            <div className="flex flex-col items-center animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-mint text-slate-950 flex items-center justify-center shadow-lg shadow-mint/50 mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-black text-mint uppercase tracking-wider">Identidad Verificada</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ScanFace className="w-20 h-20 text-mint/80 animate-pulse" />
              
              {/* Simulated Feature Points */}
              <div className="absolute top-16 left-12 w-1.5 h-1.5 rounded-full bg-mint animate-ping" />
              <div className="absolute top-16 right-12 w-1.5 h-1.5 rounded-full bg-mint animate-ping" />
              <div className="absolute bottom-16 w-2 h-2 rounded-full bg-mint animate-pulse" />
            </div>
          )}

          {/* Hologram Overlay Mesh Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#00D69E_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
        </div>

      </div>

      {/* Progress & Verification Feedback */}
      <div className="w-full max-w-xs space-y-3 pb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {isMatched ? "Coincidencia biométrica: 99.8%" : "Extrayendo rasgos faciales..."}
          </span>
          <span className="font-mono font-bold text-mint">{progress}%</span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-mint transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-400">
          Sensor de liveness activo • Encriptación tokenizada FIDO2
        </p>
      </div>

    </div>
  );
}
