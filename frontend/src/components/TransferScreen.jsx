import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  MapPin, 
  UserCheck, 
  UserX, 
  Zap, 
  AlertTriangle, 
  ShieldAlert, 
  Sliders, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { FREQUENT_CONTACTS } from '../data/mockData';
import { calcularRiesgoIA } from '../services/aiFraudEngine';

export default function TransferScreen({
  user,
  onBack,
  onConfirmTransfer
}) {
  const [recipientPhone, setRecipientPhone] = useState('981234567');
  const [amount, setAmount] = useState('25.00');
  const [isFrequentContact, setIsFrequentContact] = useState(true);
  
  // Panel de pruebas para demostración
  const [selectedTime, setSelectedTime] = useState('14:30'); // '14:30' | '03:45 AM'
  const [selectedLocation, setSelectedLocation] = useState('Arequipa'); // 'Arequipa' | 'Inusual / IP Extranjera'
  
  const [errorMsg, setErrorMsg] = useState('');

  // Live Risk Calculation Preview
  const currentRisk = calcularRiesgoIA({
    monto: parseFloat(amount) || 0,
    hora: selectedTime,
    esContactoNuevo: !isFrequentContact,
    esUbicacionInusual: selectedLocation !== 'Arequipa'
  });

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setRecipientPhone(val);
    if (errorMsg) setErrorMsg('');
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(val);
    if (errorMsg) setErrorMsg('');
  };

  // Atajo: Cargar Escenario Normal
  const handleLoadNormalScenario = () => {
    setAmount('25.00');
    setRecipientPhone('981234567'); // Lucía Gómez
    setIsFrequentContact(true);
    setSelectedTime('14:30');
    setSelectedLocation('Arequipa');
    setErrorMsg('');
  };

  // Atajo: Cargar Escenario de Fraude
  const handleLoadFraudScenario = () => {
    setAmount('480.00');
    setRecipientPhone('993441122'); // Contacto nuevo
    setIsFrequentContact(false);
    setSelectedTime('03:45 AM');
    setSelectedLocation('Inusual / IP Extranjera');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!recipientPhone || recipientPhone.length < 9) {
      setErrorMsg('Ingresa un número celular válido de 9 dígitos.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a S/ 0.00');
      return;
    }
    if (numAmount > user.balance) {
      setErrorMsg(`Saldo insuficiente. Tu saldo es S/ ${user.balance.toFixed(2)}`);
      return;
    }

    // Pass data to execution flow
    onConfirmTransfer({
      recipientPhone,
      amount: numAmount,
      isFrequentContact,
      selectedTime,
      selectedLocation,
      riskResult: currentRisk
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 text-slate-800 animate-fade-in overflow-y-auto">
      
      {/* Header */}
      <div className="bg-yape-700 text-white px-5 pt-5 sm:pt-2 pb-4 flex items-center justify-between shadow-md">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold tracking-tight">Transferir Dinero</h2>
        <div className="w-8 h-8" /> {/* spacer */}
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 flex-1">
        
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center animate-slide-up">
            {errorMsg}
          </div>
        )}

        {/* Live Risk Floating Pill */}
        <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-yape-700" />
            <span>Predicción de Riesgo IA:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
              currentRisk.score >= 70 
                ? 'bg-red-500 text-white' 
                : currentRisk.score >= 35 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentRisk.score}% ({currentRisk.riskLevel})
            </span>
          </div>
        </div>

        {/* Recipient Phone */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Número de Destino
          </label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 focus-within:border-yape-700 focus-within:ring-2 focus-within:ring-yape-700/15 focus-within:bg-white transition-all overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/90 text-slate-700 border-r border-slate-200 shrink-0 select-none">
              <Smartphone className="w-4 h-4 text-yape-700" />
              <span className="text-xs font-extrabold text-slate-800">+51</span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="987 654 321"
              value={recipientPhone}
              onChange={handlePhoneChange}
              maxLength={9}
              className="w-full px-3 py-2 text-sm font-bold tracking-wider bg-transparent outline-none text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Quick Frequent Contacts Avatars */}
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">Frecuentes:</span>
            {FREQUENT_CONTACTS.map((c) => (
              <button
                key={c.phone}
                type="button"
                onClick={() => {
                  setRecipientPhone(c.phone);
                  setIsFrequentContact(true);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-all cursor-pointer ${
                  recipientPhone === c.phone
                    ? 'bg-yape-700 text-white border-yape-700 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Field */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Monto a Transferir
            </label>
            <span className="text-[11px] text-slate-400">
              Saldo: <b className="text-slate-700">S/ {user.balance.toFixed(2)}</b>
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-lg font-black text-yape-700">S/</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              className="w-full pl-10 pr-3 py-2 text-xl font-black rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-yape-700 focus:ring-2 focus:ring-yape-700/15 outline-none transition-all text-slate-900"
            />
          </div>

          {/* Amount Quick Chips */}
          <div className="mt-2 flex items-center gap-1.5">
            {['10.00', '25.00', '50.00', '100.00', '480.00'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setAmount(chip)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  amount === chip
                    ? 'bg-yape-50 border-yape-600 text-yape-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {chip === '480.00' ? '⚠️ 480' : `S/ ${parseInt(chip)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Contacto Frecuente */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isFrequentContact ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {isFrequentContact ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">¿Contacto frecuente?</div>
              <div className="text-[10px] text-slate-400">
                {isFrequentContact ? "Registrado previamente (+0%)" : "Nuevo destinatario (+15%)"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsFrequentContact(true)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                isFrequentContact ? 'bg-yape-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setIsFrequentContact(false)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                !isFrequentContact ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* PANEL DE PRUEBAS PARA DEMOSTRACIÓN - Solid Static Colors */}
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-mint" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-mint">
                Panel de Pruebas (Demo)
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">IA Tester</span>
          </div>

          {/* Selector de Hora */}
          <div className="mb-2.5">
            <div className="text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-yape-300" />
              <span>Simulación de Hora:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTime('14:30')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedTime === '14:30'
                    ? 'bg-yape-700 border-mint text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                ☀️ Día (14:30)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTime('03:45 AM')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedTime === '03:45 AM'
                    ? 'bg-red-900/80 border-red-500 text-red-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌙 Madrugada (03:45 AM)
              </button>
            </div>
          </div>

          {/* Selector de Ubicación */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-yape-300" />
              <span>Ubicación / IP:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedLocation('Arequipa')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedLocation === 'Arequipa'
                    ? 'bg-yape-700 border-mint text-white shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                📍 Arequipa (Habitual)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocation('Inusual / IP Extranjera')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                  selectedLocation === 'Inusual / IP Extranjera'
                    ? 'bg-red-900/80 border-red-500 text-red-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                🌐 Inusual (IP Remota)
              </button>
            </div>
          </div>

          {/* Atajos Rápidos de Escenarios */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleLoadNormalScenario}
              className="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-mint" />
              <span>Escenario Normal</span>
            </button>
            <button
              type="button"
              onClick={handleLoadFraudScenario}
              className="py-2 px-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>Escenario Fraude</span>
            </button>
          </div>
        </div>

        {/* Botón Confirmar Transferencia */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-yape-700 hover:bg-yape-800 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-yape-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 text-mint" />
          <span>Confirmar Transferencia</span>
        </button>

      </form>
    </div>
  );
}
