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
  Smartphone,
  Eye,
  EyeOff,
  ChevronDown,
  CreditCard,
  Database,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Activity
} from 'lucide-react';
import { FREQUENT_CONTACTS } from '../data/mockData';
import { calcularRiesgoIA, buscarDestinatarioAPI } from '../services/aiFraudEngine';

export default function TransferScreen({
  user,
  onBack,
  onConfirmTransfer,
  onInputChange
}) {
  const [recipientPhone, setRecipientPhone] = useState('981234567');
  const [amount, setAmount] = useState('25.00');

  // Consulta en tiempo real contra MySQL (Estilo Yape / BCP)
  const [recipientData, setRecipientData] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Saldo visible u oculto
  const [showBalance, setShowBalance] = useState(false);

  // Panel de pruebas para demostración (colapsado por defecto para vista 100% real)
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('14:30'); // '14:30' | '03:45 AM'
  const [selectedLocation, setSelectedLocation] = useState('Arequipa'); // 'Arequipa' | 'Inusual / IP Extranjera'
  
  const [errorMsg, setErrorMsg] = useState('');

  // Efecto: Cuando el celular tiene 9 dígitos, consultar MySQL automáticamente
  useEffect(() => {
    let isMounted = true;
    const cleanPhone = recipientPhone.trim();

    if (cleanPhone.length === 9) {
      if (user && cleanPhone === user.phone) {
        setRecipientData(null);
        setLookupError('No puedes transferirte dinero a tu propia cuenta.');
        return;
      }

      setIsLookingUp(true);
      setLookupError('');

      buscarDestinatarioAPI(cleanPhone).then((res) => {
        if (!isMounted) return;
        setIsLookingUp(false);
        if (res && res.exists) {
          setRecipientData(res.user);
          setLookupError('');
        } else {
          setRecipientData(null);
          setLookupError(res?.message || 'El número no se encuentra afiliado a GuardianPay.');
        }
      }).catch((err) => {
        if (!isMounted) return;
        setIsLookingUp(false);
        setRecipientData(null);
        setLookupError('No pudimos validar el número. Intenta nuevamente.');
      });
    } else {
      setRecipientData(null);
      setLookupError('');
      setIsLookingUp(false);
    }

    return () => {
      isMounted = false;
    };
  }, [recipientPhone, user]);

  const isFrequentContact = Boolean(recipientData);

  // Sync with parent for live desktop telemetry
  useEffect(() => {
    if (onInputChange) {
      onInputChange({
        monto: parseFloat(amount) || 0,
        selectedTime,
        isFrequentContact,
        selectedLocation
      });
    }
  }, [amount, selectedTime, isFrequentContact, selectedLocation, onInputChange]);

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
    setRecipientPhone('981234567'); // Lucía Gómez (registrada en agenda)
    setSelectedTime('14:30');
    setSelectedLocation('Arequipa');
    setErrorMsg('');
  };

  // Atajo: Cargar Escenario de Fraude
  const handleLoadFraudScenario = () => {
    setAmount('480.00');
    setRecipientPhone('970203193'); // Número no registrado (nuevo contacto)
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
    if (user && recipientPhone === user.phone) {
      setErrorMsg('No puedes transferirte dinero a tu propia cuenta.');
      return;
    }
    if (!recipientData) {
      setErrorMsg(lookupError || 'El destinatario no se encuentra registrado en GuardianPay.');
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
      recipientName: recipientData.name,
      amount: numAmount,
      isFrequentContact,
      selectedTime,
      selectedLocation,
      riskResult: currentRisk
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 lg:bg-transparent text-slate-800 animate-fade-in overflow-y-auto">
      
      {/* 1. Header SOLO Móvil (< 1024px) */}
      <div className="lg:hidden bg-yape-700 text-white px-5 pt-5 sm:pt-2 pb-4 flex items-center justify-between shadow-md">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold tracking-tight">Transferir Dinero</h2>
        <div className="w-8 h-8" />
      </div>

      {/* 2. Top Bar SOLO Escritorio (>= 1024px) */}
      <div className="hidden lg:flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-yape-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Mis Productos</span>
          </button>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>Operaciones</span>
            <span>&gt;</span>
            <span className="text-yape-700 font-bold">Transferencias Inmediatas</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Canal de Transferencia Seguro (Cifrado Bancario TLS 1.3)</span>
        </div>
      </div>

      {/* 3. Título de Sección SOLO Escritorio */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transferencia Inmediata</h1>
        <p className="text-xs text-slate-500 mt-1">Transfiere dinero al instante entre cuentas registradas con verificación biométrica y supervisión antifraude.</p>
      </div>

      {/* 4. Grid Principal: 1 Columna en móvil, 2 Columnas en desktop */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Formulario de Transferencia (7 cols en desktop) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Tarjeta de Cuenta Origen (Visible en escritorio) */}
          <div className="hidden lg:flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-yape-700 text-white flex items-center justify-center font-bold shadow-xs">
                <CreditCard className="w-5 h-5 text-mint" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuenta de Origen</div>
                <div className="text-xs font-bold text-slate-800">Cuenta de Ahorros Soles • **** {user.accountNumber ? user.accountNumber.slice(-4) : "9941"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Disponible</div>
              <div className="text-sm font-black text-slate-900 font-sans">
                {showBalance ? `S/ ${user.balance.toFixed(2)}` : "S/ ••••••"}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-5 lg:px-6 py-4 lg:py-6 space-y-4 bg-white rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm">
            
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center animate-slide-up">
                {errorMsg}
              </div>
            )}

            {/* Live Risk Floating Pill SOLO en móvil */}
            <div className="lg:hidden flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-yape-700" />
                <span>Riesgo IA:</span>
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

            {/* Campo 1: Número de Destino */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Número de Celular Destino
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 focus-within:border-yape-700 focus-within:ring-2 focus-within:ring-yape-700/15 focus-within:bg-white transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 text-slate-700 border-r border-slate-200 shrink-0 select-none">
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
                  className="w-full px-3.5 py-3 text-sm font-bold tracking-wider bg-transparent outline-none text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Botones de Contactos Frecuentes */}
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">Frecuentes:</span>
                {FREQUENT_CONTACTS.map((c) => (
                  <button
                    key={c.phone}
                    type="button"
                    onClick={() => setRecipientPhone(c.phone)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-all cursor-pointer ${
                      recipientPhone === c.phone
                        ? 'bg-yape-700 text-white border-yape-700 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Verificación en Vivo de Destinatario */}
              {recipientPhone.length === 9 && (
                <div className="mt-2.5 p-2.5 rounded-xl border flex items-center justify-between text-xs animate-fade-in bg-slate-50 border-slate-200">
                  {isLookingUp ? (
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-ping" />
                      <span>Verificando titular de la cuenta...</span>
                    </div>
                  ) : recipientData ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Titular: <strong className="text-slate-900">{recipientData.name}</strong> <span className="text-slate-500 font-normal">(DNI: {recipientData.dni})</span></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{lookupError || 'Destinatario no registrado en GuardianPay'}</span>
                    </div>
                  )}

                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isLookingUp
                      ? 'bg-slate-200 text-slate-700'
                      : recipientData
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isLookingUp ? 'Buscando' : recipientData ? 'Verificado' : 'No Afiliado'}
                  </span>
                </div>
              )}
            </div>

            {/* Campo 2: Monto a Transferir */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Monto a Transferir
                </label>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-yape-700 transition-colors cursor-pointer bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200"
                >
                  <span>Saldo:</span>
                  <b className="text-slate-800 font-sans">
                    {showBalance ? `S/ ${user.balance.toFixed(2)}` : "S/ ••••••"}
                  </b>
                  {showBalance ? <EyeOff className="w-3 h-3 text-slate-500" /> : <Eye className="w-3 h-3 text-slate-500" />}
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xl font-black text-yape-700">S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-12 pr-4 py-3 text-2xl font-black rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-yape-700 focus:ring-2 focus:ring-yape-700/15 outline-none transition-all text-slate-900 font-sans"
                />
              </div>

              {/* Quick Chips */}
              <div className="mt-2.5 flex items-center gap-2">
                {['10.00', '25.00', '50.00', '100.00', '480.00'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAmount(chip)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      amount === chip
                        ? 'bg-yape-50 border-yape-600 text-yape-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {chip === '480.00' ? '⚠️ S/ 480' : `S/ ${parseInt(chip)}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulador de Escenarios SOLO para Móvil (< 1024px) */}
            <div className="lg:hidden space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDemoPanelOpen(!isDemoPanelOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-yape-700" />
                  <span className="text-xs font-bold">Simulador de Escenarios IA</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDemoPanelOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDemoPanelOpen && (
                <div className="bg-slate-900 text-white p-3 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTime('14:30')}
                      className={`p-2 rounded-lg font-bold border text-[11px] ${selectedTime === '14:30' ? 'bg-yape-700 border-mint text-white' : 'bg-white/5 border-white/10'}`}
                    >
                      ☀️ Día (14:30)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTime('03:45 AM')}
                      className={`p-2 rounded-lg font-bold border text-[11px] ${selectedTime === '03:45 AM' ? 'bg-red-900 border-red-500 text-red-200' : 'bg-white/5 border-white/10'}`}
                    >
                      🌙 Madrugada (03:45 AM)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLocation('Arequipa')}
                      className={`p-2 rounded-lg font-bold border text-[11px] ${selectedLocation === 'Arequipa' ? 'bg-yape-700 border-mint text-white' : 'bg-white/5 border-white/10'}`}
                    >
                      📍 Arequipa
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLocation('Inusual / IP Extranjera')}
                      className={`p-2 rounded-lg font-bold border text-[11px] ${selectedLocation === 'Inusual / IP Extranjera' ? 'bg-red-900 border-red-500 text-red-200' : 'bg-white/5 border-white/10'}`}
                    >
                      🌐 IP Extranjera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Principal de Confirmación */}
            <button
              type="submit"
              disabled={!recipientData || isLookingUp}
              className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !recipientData || isLookingUp
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                  : 'bg-yape-700 hover:bg-yape-800 active:scale-[0.98] text-white shadow-yape-700/25'
              }`}
            >
              <Send className="w-4 h-4 text-mint" />
              <span>
                {isLookingUp 
                  ? 'Verificando destinatario...' 
                  : !recipientData 
                    ? 'Destinatario no afiliado' 
                    : 'Confirmar Transferencia'}
              </span>
            </button>

          </form>

        </div>

        {/* COLUMNA DERECHA (Solo Desktop, Cols 8 a 12): Telemetría IA & Demo Tester */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          
          {/* Card 1: Supervisión de Machine Learning en Vivo */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yape-50 text-yape-700 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-yape-700" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Random Forest Classifier
                  </h3>
                  <div className="text-[10px] text-slate-400 font-medium">GuardianShield-v2.0-RF • random_forest_fraud.pkl</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Modelo Activo
              </span>
            </div>

            {/* Medidor de Score Dinámico */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Puntaje de Riesgo Estimado:</span>
                <span className={`px-2.5 py-0.5 rounded-lg font-black text-xs font-mono ${
                  currentRisk.score >= 70 ? 'bg-red-500 text-white' : currentRisk.score >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentRisk.score}% ({currentRisk.riskLevel})
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    currentRisk.score >= 70 ? 'bg-red-500' : currentRisk.score >= 35 ? 'bg-amber-400' : 'bg-mint'
                  }`}
                  style={{ width: `${Math.min(currentRisk.score, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% Seguro</span>
                <span className="text-amber-600 font-bold">Umbral de Bloqueo (70%)</span>
                <span>100% Crítico</span>
              </div>
            </div>

            {/* Desglose de Factores Evaluados */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Factores Ponderados:</div>
              <div className="space-y-1.5 text-xs">
                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  parseFloat(amount) > 200 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <span>Monto {parseFloat(amount) > 200 ? '> S/ 200.00 (Inusual)' : '<= S/ 200.00 (Ordinario)'}</span>
                  <b className="font-mono">{parseFloat(amount) > 200 ? '+32.8%' : '0%'}</b>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  selectedTime === '03:45 AM' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <span>Horario {selectedTime === '03:45 AM' ? 'Madrugada (03:45 AM)' : 'Diurno habitual (14:30)'}</span>
                  <b className="font-mono">{selectedTime === '03:45 AM' ? '+35.0%' : '0%'}</b>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  !isFrequentContact ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <span>Historial con el destinatario</span>
                  <b className="font-mono">{!isFrequentContact ? '+32.8% (Nuevo)' : '0% (Frecuente)'}</b>
                </div>
                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  selectedLocation !== 'Arequipa' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <span>Geolocalización / IP</span>
                  <b className="font-mono">{selectedLocation !== 'Arequipa' ? '+25.0%' : '0%'}</b>
                </div>
              </div>
            </div>

          </div>

          {/* Card 2: Consola de Simulación (Para Sustentación) */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-mint" />
                <span className="text-xs font-black uppercase tracking-wider text-mint">
                  Consola de Pruebas (Demo Tester)
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">Para Sustentación</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-300 font-semibold block mb-1.5">Simular Horario:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTime('14:30')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedTime === '14:30' ? 'bg-yape-700 border-mint text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    ☀️ Día (14:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTime('03:45 AM')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedTime === '03:45 AM' ? 'bg-red-900/80 border-red-500 text-red-200' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    🌙 Madrugada (03:45 AM)
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-300 font-semibold block mb-1.5">Simular Ubicación / IP:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLocation('Arequipa')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedLocation === 'Arequipa' ? 'bg-yape-700 border-mint text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    📍 Arequipa (Habitual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation('Inusual / IP Extranjera')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedLocation === 'Inusual / IP Extranjera' ? 'bg-red-900/80 border-red-500 text-red-200' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    🌐 IP Extranjera
                  </button>
                </div>
              </div>

              {/* Atajos Rápidos */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleLoadNormalScenario}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-mint" />
                  <span>Escenario Normal</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadFraudScenario}
                  className="py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Escenario Fraude</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

