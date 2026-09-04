import React, { useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Share2, 
  ArrowLeft, 
  Download, 
  Home, 
  Sparkles,
  Smartphone,
  Calendar,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VoucherScreen({
  transaction,
  onReturnHome
}) {
  const {
    amount = 25,
    recipient = "Lucía Gómez",
    recipientPhone = "981234567",
    operationCode = "OP-84920194",
    date = "Hoy, 14:30",
    riskScore = 4
  } = transaction || {};

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00D69E', '#742284', '#ffffff', '#25efb9']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleShare = () => {
    alert("¡Comprobante copiado al portapapeles con éxito!");
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-yape-700 via-yape-800 to-yape-900 text-white animate-fade-in p-4 overflow-y-auto">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <button
          onClick={onReturnHome}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-yape-200">
          Comprobante de Envío
        </span>
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Receipt Card (Yape Voucher Style) */}
      <div className="relative bg-white text-slate-900 rounded-3xl p-5 shadow-2xl shadow-black/40 my-auto">
        
        {/* Green Check Bubble - Clean Static Banking Style */}
        <div className="flex flex-col items-center -mt-10 mb-3">
          <div className="w-16 h-16 rounded-full bg-mint text-slate-950 flex items-center justify-center shadow-md border-4 border-white">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-yape-700 mt-2">
            ¡Transferencia Exitosa!
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Dinero enviado a {recipient}
          </p>
        </div>

        {/* Big Amount - Clean without sign */}
        <div className="text-center py-2.5 bg-yape-50/70 rounded-2xl border border-yape-100 mb-4">
          <span className="text-xs font-bold text-slate-500 block mb-0.5">Monto Total</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm font-black text-yape-700">S/</span>
            <span className="text-3xl font-black tracking-tight text-yape-700 font-mono">
              {Math.abs(Number(amount)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* AI Security Badge */}
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-emerald-800">
                Operación verificada por IA
              </div>
              <div className="text-[10px] text-emerald-600">
                Score de Riesgo: <b>{riskScore}% (Seguro)</b>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
            Aprobada
          </span>
        </div>

        {/* Receipt Details Breakdown */}
        <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              Destinatario
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-800">{recipient}</span>
              <span className="block text-[10px] text-slate-500 font-mono">{recipientPhone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fecha y Hora
            </span>
            <span className="font-bold text-slate-800">{date}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              N° Operación
            </span>
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              {operationCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Canal de Pago</span>
            <span className="font-bold text-yape-700">GuardianPay Móvil</span>
          </div>

        </div>

        {/* Decorative Voucher Teeth (Notches) */}
        <div className="relative mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
          <p className="text-[10px] text-slate-400">
            Comprobante oficial válido de acuerdo a normativa Fintech
          </p>
        </div>

      </div>

      {/* Return Home Button */}
      <div className="pt-3 space-y-2">
        <button
          onClick={onReturnHome}
          className="w-full py-3.5 rounded-2xl bg-mint hover:bg-mint-dark active:scale-[0.98] text-slate-950 font-black text-sm shadow-xl shadow-mint/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>

        <button
          onClick={handleShare}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir Comprobante</span>
        </button>
      </div>

    </div>
  );
}
