import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  QrCode, 
  Receipt, 
  Smartphone, 
  Clock, 
  MapPin, 
  Sliders, 
  Cpu, 
  Eye, 
  EyeOff, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ChevronRight, 
  Zap, 
  ShieldAlert,
  HelpCircle,
  Home,
  Activity,
  UserCheck
} from 'lucide-react';

export default function ResponsiveLayout({
  currentScreen,
  user,
  transactions,
  onNavigate,
  onLogout,
  currentRisk,
  liveInputs,
  onUpdateInput,
  children
}) {
  const [showDesktopBalance, setShowDesktopBalance] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ========================================================================= */}
      {/* 1. MODO CELULAR (< 1024px): Billetera Móvil 100% Pantalla Completa estilo Yape */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full min-h-[100dvh] bg-white text-slate-900 flex flex-col">
        {children}
      </div>

      {/* ========================================================================= */}
      {/* 2. MODO PC / ESCRITORIO (>= 1024px): Portal de Banca por Internet Completa */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-h-screen bg-slate-950">
        
        {/* Barra Superior Global (Header Bancario) */}
        <header className="w-full bg-slate-900 border-b border-slate-800 px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
          
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yape-700 flex items-center justify-center shadow-md shadow-yape-700/40 border border-white/10">
              <ShieldCheck className="w-6 h-6 text-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">Guardian<span className="text-mint">Pay</span></span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-yape-700/80 text-yape-200 border border-yape-500/40">
                  Banca por Internet
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-mint/10 text-mint border border-mint/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                  Random Forest v3.4
                </span>
              </div>
              <p className="text-xs text-slate-400">Plataforma de Operaciones y Detección Predictiva de Fraudes</p>
            </div>
          </div>

          {/* Navegación y Perfil */}
          <div className="flex items-center gap-5">
            {currentScreen !== 'LOGIN' && (
              <>
                <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
                  <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      currentScreen === 'DASHBOARD'
                        ? 'bg-yape-700 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Inicio
                  </button>
                  <button
                    onClick={() => onNavigate('TRANSFER')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentScreen === 'TRANSFER'
                        ? 'bg-yape-700 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-mint" />
                    <span>Transferir</span>
                  </button>
                </nav>

                {/* Perfil de Usuario */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-mint text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                    {user.avatar || "AL"}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Cta: {user.accountNumber}</div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Cerrar sesión"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 flex items-center justify-center transition-all cursor-pointer ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {currentScreen === 'LOGIN' && (
              <span className="text-xs text-slate-400 font-mono">Acceso Seguro SSL • TLS 1.3</span>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* Contenido Principal en Escritorio: Distribución Panorámica de 3 Columnas */}
        {/* ========================================================================= */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 lg:p-8">
          
          {currentScreen === 'LOGIN' ? (
            /* Vista de Login Expandida en PC */
            <div className="w-full max-w-4xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex items-center justify-between gap-8">
              <div className="w-1/2 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-yape-700 flex items-center justify-center text-mint shadow-lg shadow-yape-700/30">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  Bienvenido a <span className="text-yape-400">Guardian</span><span className="text-mint">Pay</span>
                </h1>
                <p className="text-sm text-slate-400">
                  Banca por Internet con motor de Inteligencia Artificial para la detección predictiva de fraudes financieros en tiempo real.
                </p>

                <div className="space-y-2 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    <span>Algoritmo de clasificación <b>Random Forest</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    <span>Intercepción preventiva con score $\ge 70\%$</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    <span>Validación biométrica facial de contingencia</span>
                  </div>
                </div>
              </div>

              <div className="w-1/2 bg-white text-slate-900 p-6 rounded-2xl shadow-xl">
                {children}
              </div>
            </div>
          ) : (
            /* Portal Bancario Expandido (3 Columnas) */
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* COLUMNA 1 (Izquierda): Sidebar Bancario, Perfil y Saldo (Cols 1-3) */}
              <aside className="col-span-3 space-y-4">
                
                {/* Tarjeta de Saldo Yape */}
                <div className="bg-yape-700 text-white rounded-3xl p-5 shadow-lg border border-yape-600 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-yape-200 uppercase tracking-wider">Saldo Disponible</span>
                    <button
                      type="button"
                      onClick={() => setShowDesktopBalance(!showDesktopBalance)}
                      className="flex items-center gap-1 text-xs text-mint font-bold hover:text-white transition-colors bg-black/20 px-2.5 py-1 rounded-full border border-white/10 cursor-pointer"
                    >
                      {showDesktopBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showDesktopBalance ? "Ocultar" : "Mostrar"}</span>
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 py-1 mb-2">
                    <span className="text-base font-extrabold text-mint">S/</span>
                    <span className="text-3xl font-black tracking-tight text-white font-mono">
                      {showDesktopBalance 
                        ? Number(user.balance).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "••••••"
                      }
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-yape-200">
                    <span>Titular: <b>{user.name}</b></span>
                    <span className="font-mono">PEN</span>
                  </div>
                </div>

                {/* Accesos Rápidos de Navegación */}
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-2">
                    Menú Principal
                  </span>
                  
                  <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentScreen === 'DASHBOARD'
                        ? 'bg-yape-700 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="w-4 h-4 text-mint" />
                      <span>Panel de Control</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => onNavigate('TRANSFER')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentScreen === 'TRANSFER'
                        ? 'bg-yape-700 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-mint" />
                      <span>Transferir Dinero</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Datos de Seguridad y Cumplimiento */}
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <Lock className="w-4 h-4 text-mint" />
                    <span>Seguridad de Nivel Bancario</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Todas las transacciones son supervisadas en tiempo real por el clasificador inteligente Random Forest.
                  </p>
                </div>

              </aside>

              {/* COLUMNA 2 (Centro): Pantalla Activa de Trabajo (Cols 4-8) */}
              <div className="col-span-5 bg-white text-slate-900 rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[680px] flex flex-col">
                {children}
              </div>

              {/* COLUMNA 3 (Derecha): Panel del Inspector IA en Vivo & Pruebas (Cols 9-12) */}
              <aside className="col-span-4 space-y-4">
                
                {/* WIDGET INSPECTOR IA EN VIVO */}
                <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
                  
                  {/* Encabezado del Widget */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-mint border border-slate-700 flex items-center justify-center font-bold">
                        <Cpu className="w-4 h-4 text-mint" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black tracking-tight text-white">Inspector IA (En Vivo)</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-mint/20 text-mint border border-mint/30">RF v3.4</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Supervisión continua de inferencia</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-mint flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-mint" />
                      Activo
                    </span>
                  </div>

                  {/* Probabilidad de Riesgo */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">Probabilidad de Fraude:</span>
                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                        currentRisk.score >= 70 ? 'bg-red-500 text-white' : 'bg-mint text-slate-950'
                      }`}>
                        {currentRisk.score}% {currentRisk.score >= 70 ? '⛔ [BLOQUEO]' : '✅ [SEGURO]'}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          currentRisk.score >= 70 ? 'bg-red-500' : 'bg-mint'
                        }`}
                        style={{ width: `${Math.min(currentRisk.score, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>0% Seguro</span>
                      <span className="text-amber-400 font-bold">Umbral Crítico $\ge$ 70%</span>
                      <span>100% Crítico</span>
                    </div>
                  </div>

                  {/* Factores Ponderados del Algoritmo */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Pesos de las Variables Activas:
                    </span>

                    <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl text-xs border border-slate-800">
                      <span className="text-slate-300">Riesgo Base Estadístico</span>
                      <span className="font-mono font-bold text-mint">+5%</span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      parseFloat(liveInputs.monto) > 200 
                        ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>
                      <div>
                        <span className="font-medium">Monto &gt; S/ 200.00</span>
                        <span className="text-[10px] block opacity-70">Actual: S/ {parseFloat(liveInputs.monto) || 0}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {parseFloat(liveInputs.monto) > 200 ? '+30%' : '+0%'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      liveInputs.selectedTime.includes('03:45') || liveInputs.selectedTime.includes('Madrugada')
                        ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>
                      <div>
                        <span className="font-medium">Horario Madrugada (00:00 - 05:00)</span>
                        <span className="text-[10px] block opacity-70">Hora: {liveInputs.selectedTime}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {liveInputs.selectedTime.includes('03:45') || liveInputs.selectedTime.includes('Madrugada') ? '+35%' : '+0%'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      !liveInputs.isFrequentContact 
                        ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>
                      <div>
                        <span className="font-medium">Contacto Nuevo (No frecuente)</span>
                        <span className="text-[10px] block opacity-70">{liveInputs.isFrequentContact ? "Frecuente" : "Nuevo"}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {!liveInputs.isFrequentContact ? '+15%' : '+0%'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      liveInputs.selectedLocation !== 'Arequipa' 
                        ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}>
                      <div>
                        <span className="font-medium">Geolocalización o IP Remota</span>
                        <span className="text-[10px] block opacity-70">{liveInputs.selectedLocation}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {liveInputs.selectedLocation !== 'Arequipa' ? '+25%' : '+0%'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* ÚLTIMOS MOVIMIENTOS EN PC */}
                <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Historial Reciente
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Últimos movimientos</span>
                  </div>

                  <div className="space-y-2.5">
                    {transactions.slice(0, 3).map((tx) => {
                      const isIncome = tx.amount > 0 || tx.type === "ingreso";
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                          <div>
                            <div className="text-xs font-bold text-white line-clamp-1">{tx.title}</div>
                            <div className="text-[10px] text-slate-400">{tx.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-black font-mono ${
                              isIncome ? 'text-emerald-500' : 'text-red-400'
                            }`}>
                              {isIncome ? "+ " : "- "}S/ {Math.abs(tx.amount).toFixed(2)}
                            </div>
                            <div className="text-[9px] text-slate-400">Riesgo {tx.riskScore}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </aside>

            </div>
          )}

        </main>

        {/* Footer del Portal Web */}
        <footer className="w-full bg-slate-950 border-t border-slate-800/80 px-8 py-4 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>GuardianPay © 2026 • Plataforma de Billetera Digital & Prevención de Fraudes</span>
          <span className="font-mono text-[11px] text-slate-400">Tecnología: React + Tailwind CSS + Python (FastAPI & Random Forest)</span>
        </footer>

      </div>

    </div>
  );
}
