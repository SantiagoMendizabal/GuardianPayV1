import React from 'react';
import { 
  X, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function AiInspectorDrawer({
  isOpen,
  onClose,
  currentRisk,
  currentInputs
}) {
  if (!isOpen) return null;

  const {
    monto = 25,
    selectedTime = "14:30",
    isFrequentContact = true,
    selectedLocation = "Arequipa"
  } = currentInputs || {};

  const score = currentRisk ? currentRisk.score : 5;
  const isHighRisk = score >= 70;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl text-white rounded-t-[32px] border-t-2 border-mint/40 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] p-4 max-h-[85%] overflow-y-auto animate-slide-up">
      
      {/* Handle & Close */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-mint text-slate-950 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">Inspector de Algoritmo IA</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-mint/20 text-mint border border-mint/30">v3.4</span>
            </div>
            <p className="text-[10px] text-slate-400">Auditoría en vivo de pesos y decisiones</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Global Score Meter */}
      <div className="my-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-300">Score de Probabilidad de Fraude:</span>
          <span className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
            isHighRisk ? 'bg-red-500 text-white animate-pulse' : 'bg-mint text-slate-950'
          }`}>
            {score}% {isHighRisk ? '⛔ [BLOQUEO]' : '✅ [APROBADO]'}
          </span>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isHighRisk ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-mint'
            }`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
          <span>0% Seguro</span>
          <span className="text-amber-400 font-bold">Umbral Intervención (70%)</span>
          <span>100% Crítico</span>
        </div>
      </div>

      {/* Active Rules Breakdown Table */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Desglose de Factores Ponderados:
        </span>

        {/* Base */}
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-xs border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint" />
            <span className="text-slate-300">Riesgo Base Sistemático</span>
          </div>
          <span className="font-mono font-bold text-mint">+5%</span>
        </div>

        {/* Monto > 200 */}
        <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
          parseFloat(monto) > 200 
            ? 'bg-red-950/50 border-red-500/40 text-red-200' 
            : 'bg-white/5 border-white/5 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${parseFloat(monto) > 200 ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <span className="font-medium">Monto &gt; S/ 200.00</span>
              <span className="text-[10px] block opacity-70">Actual: S/ {parseFloat(monto) || 0}</span>
            </div>
          </div>
          <span className="font-mono font-bold">{parseFloat(monto) > 200 ? '+30%' : '+0%'}</span>
        </div>

        {/* Madrugada */}
        <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
          selectedTime.includes('03:45') || selectedTime.includes('Madrugada')
            ? 'bg-red-950/50 border-red-500/40 text-red-200' 
            : 'bg-white/5 border-white/5 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              selectedTime.includes('03:45') || selectedTime.includes('Madrugada') ? 'bg-red-400 animate-pulse' : 'bg-slate-600'
            }`} />
            <div>
              <span className="font-medium">Horario Madrugada (00:00 - 05:00)</span>
              <span className="text-[10px] block opacity-70">Hora: {selectedTime}</span>
            </div>
          </div>
          <span className="font-mono font-bold">
            {selectedTime.includes('03:45') || selectedTime.includes('Madrugada') ? '+35%' : '+0%'}
          </span>
        </div>

        {/* Contacto Nuevo */}
        <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
          !isFrequentContact 
            ? 'bg-red-950/50 border-red-500/40 text-red-200' 
            : 'bg-white/5 border-white/5 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${!isFrequentContact ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <span className="font-medium">Destinatario Nuevo (No frecuente)</span>
              <span className="text-[10px] block opacity-70">{isFrequentContact ? "Frecuente" : "Nuevo"}</span>
            </div>
          </div>
          <span className="font-mono font-bold">{!isFrequentContact ? '+15%' : '+0%'}</span>
        </div>

        {/* Ubicación Inusual */}
        <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
          selectedLocation !== 'Arequipa' 
            ? 'bg-red-950/50 border-red-500/40 text-red-200' 
            : 'bg-white/5 border-white/5 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${selectedLocation !== 'Arequipa' ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <span className="font-medium">Geolocalización Anómala / IP Remota</span>
              <span className="text-[10px] block opacity-70">Ubicación: {selectedLocation}</span>
            </div>
          </div>
          <span className="font-mono font-bold">{selectedLocation !== 'Arequipa' ? '+25%' : '+0%'}</span>
        </div>

      </div>

      {/* Decision Summary */}
      <div className="mt-3 p-2.5 rounded-xl bg-yape-950/80 border border-yape-700/60 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 text-mint font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Regla de Acción del Motor:</span>
        </div>
        <p>
          Si el score acumulado suma <b>&ge; 70%</b>, se congela el flujo y se exige reconocimiento facial biométrico. Si es <b>&lt; 70%</b>, se ejecuta la transferencia de forma inmediata.
        </p>
      </div>

    </div>
  );
}
