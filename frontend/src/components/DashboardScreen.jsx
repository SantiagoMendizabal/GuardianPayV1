import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Send, 
  QrCode, 
  Receipt, 
  Smartphone, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  Cpu, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function DashboardScreen({
  user,
  transactions,
  onNavigateTransfer,
  onLogout,
  isInspectorOpen,
  onToggleInspector
}) {
  // En Yape el saldo inicia oculto por defecto para mayor privacidad
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 text-slate-800 animate-fade-in overflow-y-auto">
      
      {/* Top App Bar - Solid Yape Purple */}
      <div className="bg-yape-700 text-white px-5 pt-5 sm:pt-3 pb-6 rounded-b-[32px] shadow-sm">
        
        {/* User Info Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mint text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white/20">
              {user.avatar || "AL"}
            </div>
            <div>
              <div className="text-[11px] text-yape-200 font-medium">
                Hola, bienvenido
              </div>
              <h2 className="text-base font-bold tracking-tight text-white">{user.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mint" />
            </div>
          </div>
        </div>

        {/* Balance Card - Estilo Yape con saldo oculto por defecto */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-yape-100 tracking-wide uppercase">Saldo Disponible</span>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center gap-1.5 text-xs text-mint font-bold hover:text-white transition-colors cursor-pointer bg-black/20 px-2.5 py-1 rounded-full border border-white/10"
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showBalance ? "Ocultar" : "Mostrar saldo"}</span>
            </button>
          </div>

          <div className="flex items-baseline gap-2 py-1">
            <span className="text-sm font-extrabold text-mint">S/</span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {showBalance 
                ? Number(user.balance).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "••••••"
              }
            </span>
          </div>

          {/* AI Security Shield Badge */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-mint">
              <ShieldCheck className="w-3.5 h-3.5 text-mint" />
              <span className="font-semibold">Protección Antifraude Activa</span>
            </div>
            <span className="text-[10px] text-yape-200 font-mono">IA Local v3.4</span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="px-5 py-4 space-y-4 flex-1">
        
        {/* Main CTA: Transferir Dinero - Solid Yape Brand Button */}
        <button
          onClick={onNavigateTransfer}
          className="w-full py-4 px-5 rounded-2xl bg-yape-700 hover:bg-yape-800 active:scale-[0.99] text-white font-bold shadow-md flex items-center justify-between group transition-all cursor-pointer border border-yape-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-mint text-slate-950 flex items-center justify-center">
              <Send className="w-5 h-5 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold tracking-tight">Transferir Dinero</div>
              <div className="text-xs text-yape-200 font-normal">Envío inmediato con análisis de riesgo</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-mint">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* Quick Secondary Actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-yape-50 text-yape-700 flex items-center justify-center mb-1">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Cobrar QR</span>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Servicios</span>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-1">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Recargas</span>
          </div>
        </div>

        {/* Recent Transactions List (Last 3) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Últimos Movimientos</h3>
            <span className="text-[11px] font-semibold text-yape-700 cursor-pointer hover:underline">Ver todos</span>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 3).map((tx) => {
              const isIncome = tx.amount > 0 || tx.type === "ingreso";
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  {/* Left: Contact / Commerce and Date (No symbols) */}
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{tx.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{tx.date}</div>
                  </div>

                  {/* Right: Amount with + (green) or - (red) */}
                  <div className="text-right">
                    <div className={`text-xs font-black font-mono tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {isIncome ? "+ " : "- "}S/ {Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      Riesgo {tx.riskScore}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* AI Inspector Switch Bar - Static Solid Styling */}
      <div className="px-5 pb-4 pt-1">
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-mint border border-slate-700 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-mint" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Modo Inspector IA</span>
                <span className="w-2 h-2 rounded-full bg-mint" />
              </div>
              <div className="text-[10px] text-slate-400">Auditar cálculos del modelo</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isInspectorOpen}
              onChange={onToggleInspector}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint"></div>
          </label>
        </div>
      </div>

    </div>
  );
}
