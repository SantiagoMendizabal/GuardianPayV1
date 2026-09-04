import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Sparkles, Activity } from 'lucide-react';

export default function EvaluatingOverlay({ onFinished, currentRisk }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Analizando telemetría del dispositivo...",
    "Correlacionando historial y patrones horarios...",
    "Ejecutando modelo neuronal de fraude..."
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 320);

    const timer = setTimeout(() => {
      onFinished();
    }, 1100);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(timer);
    };
  }, [onFinished]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      
      {/* Radar Pulse Animation */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-yape-600/30 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-mint/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-mint/60 animate-spin" style={{ animationDuration: '6s' }} />
        
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yape-800 to-yape-600 flex items-center justify-center text-mint shadow-xl shadow-yape-700/50 relative z-10 border border-white/20">
          <Cpu className="w-8 h-8 animate-bounce-soft" />
        </div>
      </div>

      {/* Title & Status */}
      <div className="space-y-2 max-w-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/10 border border-mint/30 text-mint text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evaluando con IA</span>
        </div>

        <h3 className="text-lg font-black text-white tracking-tight">
          Analizando Transacción
        </h3>
        
        <p className="text-xs text-slate-300 h-6 flex items-center justify-center gap-1.5 font-medium transition-all">
          <Activity className="w-3.5 h-3.5 text-mint animate-pulse" />
          <span>{steps[stepIndex]}</span>
        </p>
      </div>

      {/* Live Risk Meter Miniature */}
      <div className="mt-6 w-full max-w-[220px] bg-white/5 border border-white/10 rounded-xl p-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Inferencia Local</span>
          <span className="text-mint font-mono font-bold">98.7% Confianza</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-mint via-amber-400 to-red-500 transition-all duration-700" 
            style={{ width: `${currentRisk ? currentRisk.score : 50}%` }}
          />
        </div>
      </div>

    </div>
  );
}
