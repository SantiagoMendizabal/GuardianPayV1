import React, { useState, useRef } from 'react';
import ResponsiveLayout from './components/ResponsiveLayout';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import TransferScreen from './components/TransferScreen';
import EvaluatingOverlay from './components/EvaluatingOverlay';
import VoucherScreen from './components/VoucherScreen';
import FraudAlertScreen from './components/FraudAlertScreen';
import BiometricModal from './components/BiometricModal';
import BiometricEnrollModal from './components/BiometricEnrollModal';
import AiInspectorDrawer from './components/AiInspectorDrawer';
import DashboardAuditoria from './components/DashboardAuditoria';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from './data/mockData';
import { calcularRiesgoIA, evaluarFraudeAPI, ejecutarTransferenciaAPI, desbloquearCuentaAPI } from './services/aiFraudEngine';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // 'LOGIN' | 'DASHBOARD' | 'TRANSFER' | 'VOUCHER' | 'FRAUD_ALERT' | 'AUDITORIA'
  
  // User and Transactions State
  const [user, setUser] = useState(INITIAL_USER);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Inspector IA Mode State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Processing & Simulation Overlays
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isBiometricScanOpen, setIsBiometricScanOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  // Current Transaction Payload & AI Result
  const [pendingTx, setPendingTx] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const pendingTxRef = useRef(null);
  const riskResultRef = useRef(null);

  // State for Inspector Live Preview (inputs tracked during transfer)
  const [liveInputs, setLiveInputs] = useState({
    monto: 25,
    selectedTime: '14:30',
    isFrequentContact: true,
    selectedLocation: 'Arequipa'
  });

  // Calculate live risk for inspector when available
  const currentInspectorRisk = calcularRiesgoIA({
    monto: liveInputs.monto,
    hora: liveInputs.selectedTime,
    esContactoNuevo: !liveInputs.isFrequentContact,
    esUbicacionInusual: liveInputs.selectedLocation !== 'Arequipa',
    userAvgMonto: user?.avg_monto || 80.0
  });

  // Login handler
  const handleLogin = (userData) => {
    const fallbackAvg = userData.phone === '971889922' ? 30.0 : (userData.phone === '987654321' ? 118.04 : 80.0);
    setUser({
      name: userData.name || "Usuario",
      phone: userData.phone || "",
      balance: typeof userData.balance === 'number' ? userData.balance : 500.0,
      accountNumber: userData.accountNumber || userData.account_number || "193-000000-0-00",
      avatar: userData.avatar || "AL",
      id: userData.id,
      avg_monto: typeof userData.avg_monto === 'number' ? userData.avg_monto : fallbackAvg,
      cuentaBloqueada: Boolean(userData.cuentaBloqueada),
      bloqueadaHasta: userData.bloqueadaHasta || null,
      bloqueosConsecutivos: userData.bloqueosConsecutivos || 0,
      intentosFallidosBiometria: userData.intentosFallidosBiometria || 0,
      hasBiometrics: Boolean(userData.hasBiometrics || userData.biometriaActiva),
      biometriaActiva: Boolean(userData.biometriaActiva)
    });
    // Si la cuenta es nueva o no tiene transacciones, su historial debe ser una lista vacía []
    setTransactions(Array.isArray(userData.transactions) ? userData.transactions : []);
    // Reiniciar residuos de riesgo de sesiones pasadas a un baseline limpio
    setRiskResult(null);
    setPendingTx(null);
    setLiveInputs({
      monto: 25,
      selectedTime: '14:30',
      isFrequentContact: true,
      selectedLocation: 'Arequipa'
    });
    setCurrentScreen('DASHBOARD');
  };

  // Logout handler
  const handleLogout = () => {
    // Limpieza total del estado de sesión en memoria
    setUser(INITIAL_USER);
    setTransactions([]);
    setRiskResult(null);
    setPendingTx(null);
    setLiveInputs({
      monto: 25,
      selectedTime: '14:30',
      isFrequentContact: true,
      selectedLocation: 'Arequipa'
    });
    setCurrentScreen('LOGIN');
  };

  // Trigger transfer confirmation against MySQL & AI Engine
  const handleConfirmTransfer = async (txPayload) => {
    if (user?.cuentaBloqueada) {
      alert("🚨 CUENTA CONGELADA POR 24 HORAS\n\nTu cuenta se encuentra temporalmente congelada por acumular 3 transacciones con fallos biométricos.\n\nPara continuar tus pruebas, presiona el botón 'Desbloquear Cuenta' en el encabezado.");
      return;
    }

    const {
      amount, selectedTime, isFrequentContact, selectedLocation,
      recipientPhone, recipientName,
      latitude, longitude, clientIp, isGps
    } = txPayload;

    setLiveInputs({
      monto: amount,
      selectedTime,
      isFrequentContact,
      selectedLocation
    });

    // Activar animación de radar de evaluación
    setIsEvaluating(true);

    try {
      // FIX: Se elimina el Promise.all con setTimeout(1100) que creaba race condition.
      // Ahora esperamos directamente la respuesta real del backend.
      // El EvaluatingOverlay ya NO cierra solo — App.jsx cierra cuando llega backendRes.
      const backendRes = await ejecutarTransferenciaAPI({
        senderPhone: user.phone,
        recipientPhone,
        amount,
        hora: selectedTime,
        location: selectedLocation,
        forceApprove: false,
        latitude,
        longitude,
        clientIp,
        isGps
      });

      if (backendRes.is_blocked) {
        // Interceptado por alta probabilidad de fraude (>= 70%) -> Exigir desafío biométrico
        const travelData = backendRes.impossible_travel_data || null;
        const enhancedRisk = { ...backendRes.risk_result, impossibleTravelData: travelData };
        const pending = {
          id: `tx-pending-${Date.now()}`,
          title: `Transferencia a ${recipientName || 'Destinatario'}`,
          category: "Transferencia",
          amount: -amount,
          recipient: recipientName || "Destinatario",
          recipientPhone,
          operationCode: "OP-INTERCEPTADA",
          date: `Hoy, ${selectedTime.replace(' AM', '')}`,
          riskScore: backendRes.risk_result?.score || 75.0,
          status: "bloqueado",
          type: "egreso",
          impossibleTravelData: travelData,
          payloadForApproval: {
            senderPhone: user.phone,
            recipientPhone,
            amount,
            hora: selectedTime,
            location: selectedLocation,
            forceApprove: true,
            latitude,
            longitude,
            clientIp,
            isGps
          }
        };

        pendingTxRef.current = pending;
        riskResultRef.current = enhancedRisk;
        setPendingTx(pending);
        setRiskResult(enhancedRisk);
        setIsEvaluating(false);
        setCurrentScreen('FRAUD_ALERT');
        return;
      }

      if (backendRes.success) {
        // Transferencia completada atómicamente en MySQL
        const travelData = backendRes.impossible_travel_data || null;
        const completedTx = { ...backendRes.transaction, impossibleTravelData: travelData };
        const enhancedRisk = { ...backendRes.risk_result, impossibleTravelData: travelData };
        pendingTxRef.current = completedTx;
        riskResultRef.current = enhancedRisk;
        setPendingTx(completedTx);
        setRiskResult(enhancedRisk);
        setIsEvaluating(false);

        // Actualizar saldo emisor en tiempo real desde MySQL
        setUser(prev => ({ ...prev, balance: backendRes.sender_new_balance }));
        // Insertar en historial local
        setTransactions(prev => [completedTx, ...prev]);

        setCurrentScreen('VOUCHER');
        return;
      }

      if (backendRes.error) {
        setIsEvaluating(false);
        alert(backendRes.error);
        return;
      }
    } catch (err) {
      console.warn('Backend no disponible, ejecutando en modo de contingencia local:', err);
      setIsEvaluating(false);

      // Evaluación de contingencia usando el motor local de IA
      const fallbackRisk = calcularRiesgoIA({
        monto: amount,
        hora: selectedTime,
        esContactoNuevo: !isFrequentContact,
        esUbicacionInusual: selectedLocation !== 'Arequipa'
      });

      if (fallbackRisk.isBlocked) {
        const pending = {
          id: `tx-fallback-${Date.now()}`,
          title: `Transferencia a ${recipientName || 'Destinatario'}`,
          category: "Transferencia",
          amount: -amount,
          recipient: recipientName || "Destinatario",
          recipientPhone,
          operationCode: "OP-INTERCEPTADA",
          date: `Hoy, ${selectedTime.replace(' AM', '')}`,
          riskScore: fallbackRisk.score,
          status: "bloqueado",
          type: "egreso",
          payloadForApproval: {
            senderPhone: user.phone,
            recipientPhone,
            amount,
            hora: selectedTime,
            location: selectedLocation,
            forceApprove: true
          }
        };
        pendingTxRef.current = pending;
        riskResultRef.current = fallbackRisk;
        setPendingTx(pending);
        setRiskResult(fallbackRisk);
        setCurrentScreen('FRAUD_ALERT');
        return;
      } else {
        const fallbackTx = {
          id: `tx-${Date.now()}`,
          operationCode: `OP-${Math.floor(10000000 + Math.random() * 90000000)}`,
          amount: -amount,
          title: `Transferencia a ${recipientName || 'Destinatario'}`,
          category: "Transferencia",
          recipient: recipientName || "Destinatario",
          recipientPhone,
          date: `Hoy, ${selectedTime.replace(' AM', '')}`,
          riskScore: fallbackRisk.score,
          riskLevel: fallbackRisk.riskLevel,
          status: "completado",
          type: "egreso"
        };
        pendingTxRef.current = fallbackTx;
        riskResultRef.current = fallbackRisk;
        setPendingTx(fallbackTx);
        setRiskResult(fallbackRisk);
        setUser(prev => ({ ...prev, balance: prev.balance - amount }));
        setTransactions(prev => [fallbackTx, ...prev]);
        setCurrentScreen('VOUCHER');
        return;
      }
    }
  };

  // Callback para finalizar overlay de radar
  const handleEvaluationComplete = () => {
    setIsEvaluating(false);
  };

  // Start Biometric Scan from Fraud Alert screen
  const handleStartBiometricScan = () => {
    setIsBiometricScanOpen(true);
  };

  // After 2-second Biometric Scan completes -> Ejecutar en MySQL con force_approve = True
  const handleBiometricComplete = async () => {
    setIsBiometricScanOpen(false);
    setIsEvaluating(true);

    try {
      const pending = pendingTxRef.current;
      if (pending && pending.payloadForApproval) {
        const backendRes = await ejecutarTransferenciaAPI(pending.payloadForApproval);
        setIsEvaluating(false);

        if (backendRes.success) {
          const completedTx = backendRes.transaction;
          pendingTxRef.current = completedTx;
          setPendingTx(completedTx);
          setUser(prev => ({ ...prev, balance: backendRes.sender_new_balance }));
          setTransactions(prev => [completedTx, ...prev]);
          setCurrentScreen('VOUCHER');
          return;
        } else {
          alert(backendRes.error || 'No se pudo autorizar la transacción.');
          setCurrentScreen('DASHBOARD');
          return;
        }
      }
    } catch (e) {
      console.error('Error en aprobación biométrica:', e);
      setIsEvaluating(false);
      alert('Error al procesar la biometría en el servidor.');
      setCurrentScreen('DASHBOARD');
    }
  };

  // Cancel and protect account
  const handleCancelAndProtect = () => {
    setPendingTx(null);
    setRiskResult(null);
    setCurrentScreen('DASHBOARD');
  };

  // Manejo de bloqueo de transacción tras 3 intentos fallidos de biometría
  const handleTransactionBlocked = (res) => {
    setIsBiometricScanOpen(false);
    setPendingTx(null);
    setRiskResult(null);
    setCurrentScreen('DASHBOARD');

    const isFrozen = Boolean(res?.account_frozen);
    setUser(prev => ({
      ...prev,
      cuentaBloqueada: isFrozen,
      bloqueadaHasta: res?.frozen_until || prev.bloqueadaHasta,
      bloqueosConsecutivos: res?.consecutive_blocked_txs || prev.bloqueosConsecutivos,
      intentosFallidosBiometria: 0
    }));

    if (isFrozen) {
      alert("🚨 CUENTA CONGELADA POR 24 HORAS\n\nSe han registrado 3 transacciones consecutivas con fallas biométricas.\nPor seguridad bancaria de tus fondos la cuenta ha sido congelada temporalmente.\n\n(Para continuar tus pruebas, presiona el botón 'Desbloquear Cuenta' en el encabezado).");
    } else {
      alert(`🛑 TRANSACCIÓN BLOQUEADA\n\nHas alcanzado el límite de 3 intentos biométricos fallidos.\nLa transacción fue cancelada y se ha devuelto a la pantalla de inicio por seguridad.\n(Bloqueos acumulados: ${res?.consecutive_blocked_txs || 1}/3).`);
    }
  };

  // Desbloqueo y reseteo de cuenta para pruebas académicas
  const handleUnblockAccount = async () => {
    try {
      const res = await desbloquearCuentaAPI(user?.phone || '987654321');
      if (res.success && res.user) {
        setUser(prev => ({
          ...prev,
          cuentaBloqueada: false,
          bloqueadaHasta: null,
          bloqueosConsecutivos: 0,
          intentosFallidosBiometria: 0
        }));
        alert("🔓 ¡Cuenta desbloqueada con éxito!\n\nSe han restablecido a 0 todos los intentos biométricos fallidos y se levantó el congelamiento de 24 horas para continuar tus pruebas.");
      } else {
        alert(res.error || "No se pudo desbloquear la cuenta.");
      }
    } catch (e) {
      alert("Error al conectar con el servidor para desbloquear la cuenta.");
    }
  };

  // Return to Dashboard from Voucher
  const handleReturnHome = () => {
    setPendingTx(null);
    setRiskResult(null);
    setCurrentScreen('DASHBOARD');
  };

  return (
    <>
      <ResponsiveLayout
        currentScreen={currentScreen}
        user={user}
        transactions={transactions}
        onNavigate={(screen) => {
          if (screen === 'DASHBOARD') {
            setRiskResult(null);
            setPendingTx(null);
          }
          setCurrentScreen(screen);
        }}
        onLogout={handleLogout}
        currentRisk={riskResult || currentInspectorRisk}
        liveInputs={liveInputs}
        onUpdateInput={(key, val) => setLiveInputs(prev => ({ ...prev, [key]: val }))}
        onOpenBiometricEnroll={() => setIsEnrollOpen(true)}
        onUnblockAccount={handleUnblockAccount}
      >
        {/* 1. Login Screen */}
        {currentScreen === 'LOGIN' && (
          <LoginScreen onLoginSuccess={handleLogin} />
        )}

        {/* 2. Dashboard Screen */}
        {currentScreen === 'DASHBOARD' && (
          <DashboardScreen
            user={user}
            transactions={transactions}
            onNavigateTransfer={() => setCurrentScreen('TRANSFER')}
            onNavigateAuditoria={() => setCurrentScreen('AUDITORIA')}
            onLogout={handleLogout}
            isInspectorOpen={isInspectorOpen}
            onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
            onOpenBiometricEnroll={() => setIsEnrollOpen(true)}
            onUnblockAccount={handleUnblockAccount}
          />
        )}

        {/* 2.1 Dashboard de Auditoría IA (Sprint 3 - Actividad 1 de Santiago) */}
        {currentScreen === 'AUDITORIA' && (
          <DashboardAuditoria
            onBack={() => setCurrentScreen('DASHBOARD')}
            onNavigateTransfer={() => setCurrentScreen('TRANSFER')}
          />
        )}

        {/* 3. Transfer Form Screen */}
        {currentScreen === 'TRANSFER' && (
          <TransferScreen
            user={user}
            onBack={() => setCurrentScreen('DASHBOARD')}
            onConfirmTransfer={handleConfirmTransfer}
            onInputChange={(inputs) => setLiveInputs(inputs)}
          />
        )}

        {/* 4. Voucher Exitoso Screen (Risk < 70% or Validated) */}
        {currentScreen === 'VOUCHER' && (
          <VoucherScreen
            transaction={pendingTx}
            user={user}
            onReturnHome={handleReturnHome}
            onNewTransfer={() => setCurrentScreen('TRANSFER')}
          />
        )}

        {/* 5. Fraud Alert Screen (Risk >= 70%) */}
        {currentScreen === 'FRAUD_ALERT' && (
          <FraudAlertScreen
            transaction={pendingTx}
            riskResult={riskResult}
            onStartBiometricScan={handleStartBiometricScan}
            onCancelAndProtect={handleCancelAndProtect}
          />
        )}
      </ResponsiveLayout>

      {/* Evaluating with AI Overlay (1s Simulation) */}
      {isEvaluating && (
        <EvaluatingOverlay
          currentRisk={riskResult}
          onFinished={handleEvaluationComplete}
        />
      )}

      {/* Biometric Enroll Modal (Google MediaPipe 3D) */}
      {isEnrollOpen && (
        <BiometricEnrollModal
          user={user}
          onClose={() => setIsEnrollOpen(false)}
          onEnrolled={(res) => {
            setUser(prev => ({ ...prev, hasBiometrics: true, biometriaActiva: true }));
          }}
        />
      )}

      {/* Biometric Face Scan Modal (2s Simulation) */}
      {isBiometricScanOpen && (
        <BiometricModal 
          user={user} 
          onComplete={handleBiometricComplete} 
          onCancel={() => setIsBiometricScanOpen(false)}
          onTransactionBlocked={handleTransactionBlocked}
          onUnblockAccount={handleUnblockAccount}
          onOpenEnroll={() => {
            setIsBiometricScanOpen(false);
            setIsEnrollOpen(true);
          }}
        />
      )}

      {/* AI Inspector Drawer (Solo en móvil cuando se activa el toggle) */}
      <AiInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentRisk={riskResult || currentInspectorRisk}
        currentInputs={liveInputs}
      />
    </>
  );
}
