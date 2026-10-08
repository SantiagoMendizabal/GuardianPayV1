import React, { useState, useRef } from 'react';
import ResponsiveLayout from './components/ResponsiveLayout';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import TransferScreen from './components/TransferScreen';
import EvaluatingOverlay from './components/EvaluatingOverlay';
import VoucherScreen from './components/VoucherScreen';
import FraudAlertScreen from './components/FraudAlertScreen';
import BiometricModal from './components/BiometricModal';
import AiInspectorDrawer from './components/AiInspectorDrawer';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from './data/mockData';
import { calcularRiesgoIA, evaluarFraudeAPI, ejecutarTransferenciaAPI } from './services/aiFraudEngine';

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // 'LOGIN' | 'DASHBOARD' | 'TRANSFER' | 'VOUCHER' | 'FRAUD_ALERT'
  
  // User and Transactions State
  const [user, setUser] = useState(INITIAL_USER);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Inspector IA Mode State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Processing & Simulation Overlays
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isBiometricScanOpen, setIsBiometricScanOpen] = useState(false);

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
    esUbicacionInusual: liveInputs.selectedLocation !== 'Arequipa'
  });

  // Login handler
  const handleLogin = (userData) => {
    setUser({
      ...user,
      ...userData,
      balance: typeof userData.balance === 'number' ? userData.balance : user.balance
    });
    if (userData.transactions && userData.transactions.length > 0) {
      setTransactions(userData.transactions);
    }
    setCurrentScreen('DASHBOARD');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentScreen('LOGIN');
  };

  // Trigger transfer confirmation against MySQL & AI Engine
  const handleConfirmTransfer = async (txPayload) => {
    const { amount, selectedTime, isFrequentContact, selectedLocation, recipientPhone, recipientName } = txPayload;

    setLiveInputs({
      monto: amount,
      selectedTime,
      isFrequentContact,
      selectedLocation
    });

    // Activar animación de radar de evaluación
    setIsEvaluating(true);

    try {
      // Llamada atómica al backend MySQL con Random Forest
      const [backendRes] = await Promise.all([
        ejecutarTransferenciaAPI({
          senderPhone: user.phone,
          recipientPhone,
          amount,
          hora: selectedTime,
          location: selectedLocation,
          forceApprove: false
        }),
        new Promise((resolve) => setTimeout(resolve, 1100))
      ]);

      if (backendRes.is_blocked) {
        // Interceptado por alta probabilidad de fraude (>= 70%) -> Exigir desafío biométrico
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
        riskResultRef.current = backendRes.risk_result;
        setPendingTx(pending);
        setRiskResult(backendRes.risk_result);
        setIsEvaluating(false);
        setCurrentScreen('FRAUD_ALERT');
        return;
      }

      if (backendRes.success) {
        // Transferencia completada atómicamente en MySQL
        const completedTx = backendRes.transaction;
        pendingTxRef.current = completedTx;
        riskResultRef.current = backendRes.risk_result;
        setPendingTx(completedTx);
        setRiskResult(backendRes.risk_result);
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

  // Return to Dashboard from Voucher
  const handleReturnHome = () => {
    setPendingTx(null);
    setRiskResult(null);
    setCurrentScreen('DASHBOARD');
  };

  return (
    <ResponsiveLayout
      currentScreen={currentScreen}
      user={user}
      transactions={transactions}
      onNavigate={(screen) => setCurrentScreen(screen)}
      onLogout={handleLogout}
      currentRisk={riskResult || currentInspectorRisk}
      liveInputs={liveInputs}
      onUpdateInput={(key, val) => setLiveInputs(prev => ({ ...prev, [key]: val }))}
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
          onLogout={handleLogout}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
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

      {/* Evaluating with AI Overlay (1s Simulation) */}
      {isEvaluating && (
        <EvaluatingOverlay
          currentRisk={riskResult}
          onFinished={handleEvaluationComplete}
        />
      )}

      {/* Biometric Face Scan Modal (2s Simulation) */}
      {isBiometricScanOpen && (
        <BiometricModal onComplete={handleBiometricComplete} />
      )}

      {/* AI Inspector Drawer (Solo en móvil cuando se activa el toggle) */}
      <AiInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentRisk={riskResult || currentInspectorRisk}
        currentInputs={liveInputs}
      />
    </ResponsiveLayout>
  );
}
