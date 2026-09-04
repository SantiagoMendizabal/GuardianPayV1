import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ScanFace, 
  ShieldX, 
  ArrowLeft, 
  Info, 
  Lock, 
  AlertOctagon,
  Clock,
  MapPin,
  UserX,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function FraudAlertScreen({
  transaction,
  riskResult,
  onStartBiometricScan,
  onCancelAndProtect
}) {
  const {
    amount = 480,
    recipientPhone = "993441122",
    selectedTime = "03:45 AM",
    selectedLocation = "Inusual / IP Extranjera"
  } = transaction || {};

  const {
    score = 92,
    activeAnomalies = []
  } = riskResult || {};

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-[#1f0606] to-slate-950 text-white animate-fade-in p-5 overflow-y-auto">
      
      {/* Top Threat Indicator Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-bold">
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          <span>ESCUDO DE SEGURIDAD BANCARIA</span>
        </div>
        <span className="text-[10px] font-mono text-red-300">PROTOCOLO #09-AI</span>
      </div>

      {/* Main Alert Card */}
      <div className="my-auto py-2 space-y-4 text-center">
        
        {/* Solid Alert Icon */}
        <div className="inline-flex items-center justify-center">
          <div className="w-18 h-18 rounded-3xl bg-red-600 flex items-center justify-center text-white shadow-lg border-2 border-white/20">
            <ShieldAlert className="w-10 h-10" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black tracking-tight text-red-400 uppercase">
            Transacción Interceptada
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Nuestro sistema de Inteligencia Artificial detectó un <span className="text-red-300 font-bold">patrón altamente sospechoso</span> en esta operación.
          </p>
        </div>

        {/* Risk Gauge Bar */}
        <div className="bg-red-950/60 border border-red-800/80 rounded-2xl p-3.5 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-slate-200">Nivel de Riesgo Calculado:</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-red-500 text-white font-black text-xs font-mono">
              {score}% (Crítico)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full"
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Umbral de bloqueo preventivo: &ge; 70%
          </span>
        </div>

        {/* Anomalies Detected Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-left space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Variables Anómalas Detectadas:</span>
          </div>

          <div className="space-y-1.5">
            {activeAnomalies.length > 0 ? (
              activeAnomalies.map((factor) => (
                <div key={factor.id} className="flex items-start gap-2 bg-red-950/40 border border-red-900/40 p-2 rounded-xl text-xs">
                  <span className="text-red-400 font-bold font-mono mt-0.5">{factor.points || "+25%"}</span>
                  <div>
                    <div className="font-bold text-slate-200 text-[11px]">{factor.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{factor.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-300">
                • Monto elevado (S/ {amount}) fuera de horario habitual (madrugada) a cuenta nueva no frecuente.
              </div>
            )}
          </div>
        </div>

        {/* Security Message */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[10px] flex items-center gap-2 text-left">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Para desbloquear y proceder con la operación, requerimos validar tu identidad biométrica en vivo.</span>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {/* Validar con Reconocimiento Facial */}
        <button
          onClick={onStartBiometricScan}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/20"
        >
          <ScanFace className="w-4 h-4 text-white" />
          <span>Validar con Reconocimiento Facial</span>
        </button>

        {/* Cancelar y Proteger Cuenta */}
        <button
          onClick={onCancelAndProtect}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
        >
          <ShieldX className="w-4 h-4 text-red-400" />
          <span>Cancelar y Proteger Cuenta</span>
        </button>
      </div>

    </div>
  );
}
