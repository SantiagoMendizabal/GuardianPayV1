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
  Home,
  UserCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Settings
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
    <div className="min-h-screen w-full font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      
      {/* ========================================================================= */}
      {/* 1. VISTA MÓVIL (< 1024px): Billetera Móvil 100% Pantalla Completa Yape     */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full min-h-[100dvh] bg-white text-slate-900 flex flex-col">
        {children}
      </div>

      {/* ========================================================================= */}
      {/* 2. VISTA ESCRITORIO (>= 1024px): Portal Banca por Internet (Estilo BCP)   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col min-h-screen bg-[#f4f6f9] text-slate-900">
        
        {/* CASO A: PANTALLA LOGIN EN ESCRITORIO (Split-Screen como Imagen 1 de BCP) */}
        {currentScreen === 'LOGIN' ? (
          <div className="flex-1 flex min-h-screen bg-white">
            
            {/* Lado Izquierdo: Banner de Marca y Seguridad */}
            <div className="w-1/2 bg-gradient-to-br from-yape-700 via-yape-800 to-[#3d0b48] text-white p-12 flex flex-col justify-between relative overflow-hidden">
              
              {/* Logo Superior */}
              <div className="flex items-center gap-2.5 z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-mint" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  Guardian<span className="text-mint">Pay</span>
                </span>
              </div>

              {/* Contenido Central con Ilustración / Gráfica Bancaria */}
              <div className="my-auto max-w-lg z-10 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-mint shadow-xl">
                  <Lock className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-mint block mb-2">
                    Banca por Internet Segura
                  </span>
                  <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                    Tu dinero protegido en tiempo real con Machine Learning.
                  </h1>
                  <p className="text-sm text-yape-200 mt-3 leading-relaxed">
                    GuardianPay incorpora algoritmos de clasificación <b>Random Forest</b> para identificar patrones de transferencias anómalas antes de que se ejecute el débito de tu cuenta.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                    <div className="text-mint font-bold text-xs flex items-center gap-1.5 mb-1">
                      <Cpu className="w-4 h-4" />
                      <span>Random Forest</span>
                    </div>
                    <p className="text-[11px] text-yape-200 leading-snug">
                      Clasificación predictiva de transacciones en &lt; 80 ms.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                    <div className="text-mint font-bold text-xs flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Intercepción Activa</span>
                    </div>
                    <p className="text-[11px] text-yape-200 leading-snug">
                      Bloqueo automático ante scores de riesgo &ge; 70%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pie de Marca */}
              <div className="text-xs text-yape-300 z-10 font-medium">
                Plataforma de Innovación Fintech • Ciclo 2026
              </div>

              {/* Círculo decorativo de fondo */}
              <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-mint/10 blur-3xl pointer-events-none" />
            </div>

            {/* Lado Derecho: Formulario de Login Limpio (Blanco) */}
            <div className="w-1/2 flex flex-col justify-between p-12 bg-white">
              <div className="flex justify-end text-xs text-slate-400 font-medium">
                Esta ventana es segura • Cifrado TLS 1.3
              </div>

              <div className="max-w-md w-full mx-auto my-auto space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Banca por Internet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Ingresa con tu número celular y clave de seguridad
                  </p>
                </div>

                {/* Contenedor del Formulario Real de Login */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  {children}
                </div>
              </div>

              <div className="text-center text-xs text-slate-400">
                GuardianPay • Todos los derechos reservados © 2026
              </div>
            </div>

          </div>
        ) : (
          /* CASO B: PORTAL BANCARIO CON SESIÓN INICIADA (Estructura BCP como Imagen 2) */
          <>
            {/* 1. Barra de Navegación Superior Limpia Blanca (Navbar BCP) */}
            <nav className="w-full bg-white text-slate-800 px-8 py-3.5 flex items-center justify-between border-b border-slate-200 shadow-xs z-20">
              
              {/* Logo con el característico chevron bancario */}
              <div className="flex items-center gap-8">
                <div 
                  onClick={() => onNavigate('DASHBOARD')}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <span className="text-yape-700 font-black text-2xl tracking-tighter">&gt;</span>
                  <span className="text-xl font-black tracking-tight text-slate-900">Guardian<span className="text-yape-700">Pay</span></span>
                </div>

                {/* Enlaces de Menú estilo BCP */}
                <div className="flex items-center gap-6 text-sm font-bold pl-8 border-l border-slate-200">
                  <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className={`transition-colors cursor-pointer ${
                      currentScreen === 'DASHBOARD' 
                        ? 'text-yape-700 font-extrabold border-b-2 border-yape-700 pb-1' 
                        : 'text-slate-600 hover:text-yape-700'
                    }`}
                  >
                    Inicio
                  </button>
                  <button
                    onClick={() => onNavigate('TRANSFER')}
                    className={`transition-colors cursor-pointer ${
                      currentScreen === 'TRANSFER' 
                        ? 'text-yape-700 font-extrabold border-b-2 border-yape-700 pb-1' 
                        : 'text-slate-600 hover:text-yape-700'
                    }`}
                  >
                    Operaciones
                  </button>
                  <span className="text-slate-400 font-medium cursor-default">Explora</span>
                </div>
              </div>

              {/* Usuario y Botón de Cerrar Sesión (Ubicado en el perfil como en BCP) */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-yape-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {user.avatar || "AL"}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Banca Activa</div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3.5 py-2 rounded-xl transition-all border border-slate-200 cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </nav>

            {/* 2. Hero Banner de Bienvenida (Solid Yape Purple estilo BCP en Imagen 2) */}
            <div className="w-full bg-[#742284] text-white px-8 py-8 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="text-xs text-yape-200 mb-1 font-medium tracking-wide">
                    Última sesión fue hoy a las 11:20 hrs
                  </div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Hola, <span className="font-black">{user.name}</span> 👋
                  </h1>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/15">
                  <ShieldCheck className="w-5 h-5 text-mint" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Protección Random Forest</div>
                    <div className="text-[10px] text-mint font-semibold">Inferencia de Fraude en Tiempo Real</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Contenedor Principal (Fondo Blanco/Gris Claro con separación limpia) */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-8 pt-8 pb-16">
              
              {currentScreen === 'DASHBOARD' ? (
                /* DASHBOARD ESTILO BCP: "¿Qué vamos a hacer hoy?" a la izquierda y "Mis productos" a la derecha */
                <div className="grid grid-cols-12 gap-8 items-start">
                  
                  {/* COLUMNA IZQUIERDA: ¿Qué vamos a hacer hoy? (Cols 1 a 5) */}
                  <div className="col-span-5 space-y-4">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">
                      ¿Qué vamos a hacer hoy?
                    </h2>

                    {/* Grid de 4 Acciones Principales estilo Tarjetas BCP */}
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* 1. Transferir Dinero (Destacado) */}
                      <div
                        onClick={() => onNavigate('TRANSFER')}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-yape-700 transition-all cursor-pointer flex flex-col items-center text-center group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-yape-50 text-yape-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Send className="w-6 h-6 text-yape-700" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-yape-700 transition-colors">
                          Transferir dinero
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">Envío inmediato con IA</span>
                      </div>

                      {/* 2. Cobrar QR */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center group">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          Cobrar QR
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">Genera código rápido</span>
                      </div>

                      {/* 3. Pagar Servicios */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center group">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          Pagar servicios
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">Luz, agua, telefonía</span>
                      </div>

                      {/* 4. Recargas Móviles */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center group">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          Recargas
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">Movistar, Claro, Entel</span>
                      </div>

                    </div>

                    {/* Resumen de Seguridad Activa */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-800">Protección Antifraude Activa</div>
                        <div className="text-[11px] text-slate-500 font-medium">Supervisado por Random Forest • Inferencia local</div>
                      </div>
                    </div>

                  </div>

                  {/* COLUMNA DERECHA: "Mis productos" y Telemetría (Cols 6 a 12) */}
                  <div className="col-span-7 space-y-6">
                    
                    {/* Sección "Mis productos" estilo BCP */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">
                          Mis productos
                        </h2>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowDesktopBalance(!showDesktopBalance)}
                            className="flex items-center gap-1.5 text-xs font-bold text-yape-700 hover:text-yape-800 transition-colors cursor-pointer bg-yape-50 px-3 py-1.5 rounded-xl border border-yape-100"
                          >
                            {showDesktopBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span>{showDesktopBalance ? "Ocultar saldos" : "Mostrar saldos"}</span>
                          </button>

                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                            <Settings className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Tarjeta de Cuenta de Ahorro estilo BCP */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-yape-700 text-white flex items-center justify-center font-black shadow-xs">
                            <CreditCard className="w-6 h-6 text-mint" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                              Cuenta de Ahorro en Soles
                            </div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5">
                              **** {user.accountNumber ? user.accountNumber.slice(-4) : "9941"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black font-sans tracking-tight text-slate-900">
                            {showDesktopBalance 
                              ? `S/ ${Number(user.balance).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "S/ ••••••"
                            }
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">Saldo disponible</div>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Últimos Movimientos */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Últimos Movimientos
                        </h3>
                        <span className="text-xs font-bold text-yape-700 cursor-pointer hover:underline">
                          Ver todos
                        </span>
                      </div>

                      <div className="space-y-3">
                        {transactions.slice(0, 3).map((tx) => {
                          const isIncome = tx.amount > 0 || tx.type === "ingreso";
                          return (
                            <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                              <div className="text-left">
                                <div className="text-xs font-bold text-slate-800">{tx.title}</div>
                                <div className="text-[11px] text-slate-400 font-medium">{tx.date}</div>
                              </div>

                              <div className="text-right">
                                <div className={`text-sm font-black font-sans tracking-tight ${
                                  isIncome ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                  {isIncome ? "+ " : "- "}S/ {Math.abs(tx.amount).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold">Riesgo {tx.riskScore}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Módulo de Telemetría IA y Control de Pruebas */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-yape-700" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                            Modelo Predictivo de Fraude (Random Forest)
                          </h3>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          Motor v3.4 Activo
                        </span>
                      </div>

                      {/* Score actual */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-slate-700">Puntaje de Riesgo Actual:</div>
                          <div className="text-[11px] text-slate-500 font-medium">Umbral de bloqueo preventivo: &ge; 70%</div>
                        </div>
                        <div className={`px-3.5 py-1.5 rounded-xl font-black font-sans text-xs ${
                          currentRisk.score >= 70 ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentRisk.score}% ({currentRisk.riskLevel})
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500 font-medium">¿Deseas probar una simulación?</span>
                        <button
                          onClick={() => onNavigate('TRANSFER')}
                          className="font-bold text-yape-700 hover:text-yape-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ir al Formulario de Transferencia</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                /* CASO FORMULARIO DE TRANSFERENCIA / VOUCHER / ALERTA EN ESCRITORIO */
                <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border border-slate-200 shadow-md relative">
                  <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className="flex items-center gap-1.5 text-xs font-bold text-yape-700 hover:text-yape-800 mb-4 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a Mis Productos</span>
                  </button>
                  {children}
                </div>
              )}

            </main>

            {/* 4. Footer Oficial Blanco / Claro */}
            <footer className="w-full bg-white border-t border-slate-200 px-8 py-5 text-center text-xs text-slate-400 flex items-center justify-between">
              <span>GuardianPay © 2026 • Plataforma de Billetera Digital & Prevención de Fraudes</span>
              <span className="text-xs font-medium">Sistema de Validación Experimental con Machine Learning</span>
            </footer>
          </>
        )}

      </div>

    </div>
  );
}
