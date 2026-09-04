import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, ArrowRight, Sparkles, Eye, EyeOff, UserCheck } from 'lucide-react';
import { INITIAL_USER } from '../data/mockData';

export default function LoginScreen({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.length < 9) {
      setErrorMsg('Ingresa un número celular válido de 9 dígitos.');
      return;
    }
    if (pin.length < 6) {
      setErrorMsg('El PIN de seguridad debe contener 6 dígitos.');
      return;
    }

    // Login successful
    onLoginSuccess({
      name: phone === INITIAL_USER.phone ? INITIAL_USER.name : "Usuario Personal",
      phone: phone,
      balance: INITIAL_USER.balance,
      accountNumber: INITIAL_USER.accountNumber,
      avatar: phone === INITIAL_USER.phone ? INITIAL_USER.avatar : "UP"
    });
  };

  const handleQuickDemo = () => {
    setPhone(INITIAL_USER.phone);
    setPin(INITIAL_USER.pin);
    setErrorMsg('');
    setTimeout(() => {
      onLoginSuccess(INITIAL_USER);
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-white via-yape-50/40 to-white text-slate-800 animate-fade-in">
      
      {/* Top Brand Hero */}
      <div className="pt-4 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yape-800 via-yape-700 to-yape-600 flex items-center justify-center shadow-xl shadow-yape-700/30 ring-4 ring-yape-100">
            <ShieldCheck className="w-11 h-11 text-mint" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-mint text-slate-950 p-1.5 rounded-xl shadow-md border-2 border-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-yape-700">
          Guardian<span className="text-mint">Pay</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          Billetera móvil segura con protección biométrica e inteligencia artificial
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 my-auto">
        
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium animate-slide-up">
            {errorMsg}
          </div>
        )}

        {/* Input Celular */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Número de Celular
          </label>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-yape-600 focus-within:ring-2 focus-within:ring-yape-600/20 overflow-hidden transition-all">
            <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-50 text-slate-700 border-r border-slate-200 shrink-0 select-none">
              <Smartphone className="w-4 h-4 text-yape-600" />
              <span className="text-xs font-bold text-slate-700">+51</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="987 654 321"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={9}
              className="w-full px-3.5 py-3 text-sm font-semibold bg-transparent outline-none text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Input PIN */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            PIN de Seguridad (6 dígitos)
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400">
              <Lock className="w-4 h-4 text-yape-600" />
            </div>
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              placeholder="••••••"
              value={pin}
              onChange={handlePinChange}
              maxLength={6}
              className="w-full pl-11 pr-11 py-3 text-sm font-bold tracking-widest rounded-2xl border border-slate-200 bg-white shadow-sm focus:border-yape-600 focus:ring-2 focus:ring-yape-600/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-yape-700 hover:bg-yape-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-yape-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Iniciar Sesión</span>
          <ArrowRight className="w-4 h-4 text-mint" />
        </button>
      </form>

      {/* Demo Fast Access Button */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center mb-3">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-[11px] font-semibold uppercase text-slate-400">Acceso Rápido</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full py-3 px-4 rounded-2xl border-2 border-mint/70 bg-gradient-to-r from-mint/10 via-mint/5 to-white hover:from-mint/20 hover:border-mint text-slate-900 font-bold text-xs flex items-center justify-between shadow-sm transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-mint text-slate-950 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900 leading-tight">Entrar con Usuario Demo</div>
              <div className="text-[10px] text-slate-500 font-normal">Anthony Luque • Saldo: S/ 1,450.00</div>
            </div>
          </div>
          <span className="text-[11px] font-bold text-mint-dark group-hover:translate-x-0.5 transition-transform">
            Auto-fill →
          </span>
        </button>
        
        <p className="text-center text-[10px] text-slate-400 mt-3">
          Simulador seguro 100% cliente • Sin conexión backend
        </p>
      </div>

    </div>
  );
}
