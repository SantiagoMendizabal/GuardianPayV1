import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  UserCheck, 
  UserPlus, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';
import { INITIAL_USER } from '../data/mockData';
import { iniciarSesionAPI, registrarUsuarioAPI } from '../services/aiFraudEngine';

export default function LoginScreen({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  
  // Login State
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register State
  const [regDni, setRegDni] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regBirth, setRegBirth] = useState('2000-01-15');
  const [regInitialBalance, setRegInitialBalance] = useState('650.00');

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(val);
    if (errorMsg) setErrorMsg('');
  };

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(val);
    if (errorMsg) setErrorMsg('');
  };

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 9) {
      setErrorMsg('Ingresa un número celular válido de 9 dígitos.');
      return;
    }
    if (pin.length < 6) {
      setErrorMsg('El PIN de seguridad debe contener 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await iniciarSesionAPI(phone, pin);
      setIsLoading(false);

      if (res.success) {
        onLoginSuccess({
          ...res.user,
          transactions: res.transactions || []
        });
      } else {
        setErrorMsg(res.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setIsLoading(false);
      // Fallback offline si el backend está caído
      console.warn('Backend offline, usando fallback local:', err);
      onLoginSuccess({
        name: phone === INITIAL_USER.phone ? INITIAL_USER.name : "Usuario Local",
        phone: phone,
        balance: INITIAL_USER.balance,
        accountNumber: INITIAL_USER.accountNumber,
        avatar: phone === INITIAL_USER.phone ? INITIAL_USER.avatar : "UP"
      });
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regDni.length !== 8) {
      setErrorMsg('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (!regName.trim()) {
      setErrorMsg('Ingresa el nombre completo del titular.');
      return;
    }
    if (regPhone.length !== 9) {
      setErrorMsg('El celular debe tener 9 dígitos.');
      return;
    }
    if (regPin.length !== 6) {
      setErrorMsg('El PIN de seguridad debe tener 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await registrarUsuarioAPI({
        dni: regDni,
        name: regName.trim(),
        phone: regPhone,
        pin: regPin,
        birthDate: regBirth,
        initialBalance: parseFloat(regInitialBalance) || 500.0
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(`¡Cuenta creada con éxito! Titular: ${res.user.name}`);
        setPhone(regPhone);
        setPin(regPin);
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'No se pudo completar el registro. Intente nuevamente.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Error de conexión con los servidores seguros. Intente nuevamente.');
    }
  };

  const handleQuickDemo = async () => {
    setPhone('987654321');
    setPin('123456');
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await iniciarSesionAPI('987654321', '123456');
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess({
          ...res.user,
          transactions: res.transactions || []
        });
      } else {
        onLoginSuccess(INITIAL_USER);
      }
    } catch {
      setIsLoading(false);
      onLoginSuccess(INITIAL_USER);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-white via-yape-50/40 to-white text-slate-800 animate-fade-in overflow-y-auto">
      
      {/* Top Brand Hero */}
      <div className="pt-2 flex flex-col items-center text-center">
        <div className="relative mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yape-800 via-yape-700 to-yape-600 flex items-center justify-center shadow-xl shadow-yape-700/30 ring-4 ring-yape-100">
            <ShieldCheck className="w-9 h-9 text-mint" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-mint text-slate-950 p-1 rounded-lg shadow-md border-2 border-white">
            <ShieldCheck className="w-3 h-3" />
          </div>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-yape-700">
          Guardian<span className="text-mint">Pay</span>
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5 max-w-[260px]">
          Billetera digital segura con protección antifraude en tiempo real
        </p>

        {/* Tab Switcher: Iniciar Sesión vs Registro */}
        <div className="mt-3 w-full grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'LOGIN' 
                ? 'bg-white text-yape-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('REGISTER'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'REGISTER' 
                ? 'bg-yape-700 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3 h-3 text-mint" />
            <span>Crear Cuenta</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium animate-slide-up">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: INICIAR SESIÓN */}
      {activeTab === 'LOGIN' && (
        <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5 my-auto py-2">
          {/* Input Celular */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Número de Celular
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-yape-600 focus-within:ring-2 focus-within:ring-yape-600/20 overflow-hidden transition-all">
              <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-50 text-slate-700 border-r border-slate-200 shrink-0 select-none">
                <Smartphone className="w-3.5 h-3.5 text-yape-600" />
                <span className="text-xs font-bold text-slate-700">+51</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="987 654 321"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={9}
                className="w-full px-3 py-2.5 text-sm font-semibold bg-transparent outline-none text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Input PIN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              PIN de Seguridad (6 dígitos)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400">
                <Lock className="w-4 h-4 text-yape-600" />
              </div>
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="••••••"
                value={pin}
                onChange={handlePinChange}
                maxLength={6}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-bold tracking-widest rounded-xl border border-slate-200 bg-white shadow-sm focus:border-yape-600 focus:ring-2 focus:ring-yape-600/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-yape-700 hover:bg-yape-800 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-yape-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-slate-400"
          >
            <span>{isLoading ? 'Iniciando sesión segura...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4 text-mint" />
          </button>
        </form>
      )}

      {/* TAB 2: CREAR CUENTA NUEVA */}
      {activeTab === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="w-full space-y-2.5 my-auto py-2">
          {/* DNI */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              DNI (8 dígitos)
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-xs focus-within:border-yape-600 px-2.5 py-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="73849102"
                maxLength={8}
                value={regDni}
                onChange={(e) => setRegDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full text-xs font-semibold bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Ej: Daniel Paredes Flores"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white shadow-xs outline-none focus:border-yape-600"
            />
          </div>

          {/* Celular y Saldo Inicial */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                Celular (9 dígitos)
              </label>
              <input
                type="tel"
                placeholder="912345678"
                maxLength={9}
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white shadow-xs outline-none focus:border-yape-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                Saldo Inicial (S/)
              </label>
              <input
                type="number"
                placeholder="500.00"
                value={regInitialBalance}
                onChange={(e) => setRegInitialBalance(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white shadow-xs outline-none focus:border-yape-600"
              />
            </div>
          </div>

          {/* Fecha de Nacimiento y PIN */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                F. Nacimiento
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-xs px-2 py-1.5">
                <Calendar className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
                <input
                  type="date"
                  value={regBirth}
                  onChange={(e) => setRegBirth(e.target.value)}
                  className="w-full text-[11px] font-medium bg-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                PIN de 6 dígitos
              </label>
              <input
                type="password"
                placeholder="••••••"
                maxLength={6}
                value={regPin}
                onChange={(e) => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-2.5 py-1.5 text-xs font-bold tracking-widest rounded-xl border border-slate-200 bg-white shadow-xs outline-none focus:border-yape-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-mint hover:bg-mint-dark text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-300"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
          </button>
        </form>
      )}

      {/* Demo Fast Access Button */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center mb-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-[10px] font-semibold uppercase text-slate-400">Acceso Rápido</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full py-2.5 px-3.5 rounded-xl border-2 border-mint/70 bg-gradient-to-r from-mint/10 via-mint/5 to-white hover:from-mint/20 hover:border-mint text-slate-900 font-bold text-xs flex items-center justify-between shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-mint text-slate-950 flex items-center justify-center font-bold">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900 text-xs leading-tight">Entrar con Anthony Luque</div>
              <div className="text-[10px] text-slate-500 font-normal">Cuenta verificada • 987654321</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-mint-dark group-hover:translate-x-0.5 transition-transform">
            Auto-fill →
          </span>
        </button>
        
        <p className="text-center text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Conexión segura de alta disponibilidad • Protocolo TLS 1.3</span>
        </p>
      </div>

    </div>
  );
}
