import React, { useState } from 'react';
import PhoneMockup from './components/PhoneMockup';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import TransferScreen from './components/TransferScreen';
import EvaluatingOverlay from './components/EvaluatingOverlay';
import VoucherScreen from './components/VoucherScreen';
import FraudAlertScreen from './components/FraudAlertScreen';
import BiometricModal from './components/BiometricModal';
import AiInspectorDrawer from './components/AiInspectorDrawer';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from './data/mockData';
import { calcularRiesgoIA } from './services/aiFraudEngine';

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
      balance: user.balance // keep current balance
    });
    setCurrentScreen('DASHBOARD');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentScreen('LOGIN');
  };

  // Trigger transfer confirmation
  const handleConfirmTransfer = (txPayload) => {
    const { amount, selectedTime, isFrequentContact, selectedLocation, recipientPhone, riskResult: preCalculatedRisk } = txPayload;

    setLiveInputs({
      monto: amount,
      selectedTime,
      isFrequentContact,
      selectedLocation
    });

    const evaluatedRisk = preCalculatedRisk || calcularRiesgoIA({
      monto: amount,
      hora: selectedTime,
      esContactoNuevo: !isFrequentContact,
      esUbicacionInusual: selectedLocation !== 'Arequipa'
    });

    const randomOpCode = `OP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const fullTx = {
      id: `tx-${Date.now()}`,
      title: isFrequentContact ? "Transferencia a Contacto" : "Transferencia a Cuenta Nueva",
      category: "Transferencia",
      amount: -amount,
      recipient: isFrequentContact ? "Lucía Gómez" : "Destinatario Celular",
      recipientPhone,
      operationCode: randomOpCode,
      date: `Hoy, ${selectedTime.replace(' AM', '')}`,
      riskScore: evaluatedRisk.score,
      status: "procesando",
      type: "egreso"
    };

    setPendingTx(fullTx);
    setRiskResult(evaluatedRisk);

    // 1 second AI evaluation spinner simulation
    setIsEvaluating(true);
  };

  // After 1-second AI evaluation finishes:
  const handleEvaluationComplete = () => {
    setIsEvaluating(false);

    if (riskResult && riskResult.score >= 70) {
      // Risk is high -> Intercept with Fraud Alert Screen
      setCurrentScreen('FRAUD_ALERT');
    } else {
      // Low/Normal risk -> Deduct balance, add to history and show Voucher
      executeTransferSuccess();
    }
  };

  // Helper to complete the transfer (deduct balance & record transaction)
  const executeTransferSuccess = () => {
    if (!pendingTx) return;

    // Deduct balance
    const newBalance = user.balance - Math.abs(pendingTx.amount);
    setUser(prev => ({ ...prev, balance: newBalance }));

    // Add to transactions history
    const completedTx = { ...pendingTx, status: "completado" };
    setTransactions(prev => [completedTx, ...prev]);

    setCurrentScreen('VOUCHER');
  };

  // Start Biometric Scan from Fraud Alert screen
  const handleStartBiometricScan = () => {
    setIsBiometricScanOpen(true);
  };

  // After 2-second Biometric Scan completes
  const handleBiometricComplete = () => {
    setIsBiometricScanOpen(false);
    // Verified successfully -> proceed to voucher!
    executeTransferSuccess();
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
    <PhoneMockup
      isInspectorOpen={isInspectorOpen}
      onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
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
        />
      )}

      {/* 4. Voucher Exitoso Screen (Risk < 70% or Validated) */}
      {currentScreen === 'VOUCHER' && (
        <VoucherScreen
          transaction={pendingTx}
          onReturnHome={handleReturnHome}
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

      {/* AI Inspector Drawer (Bottom Sheet) */}
      <AiInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentRisk={riskResult || currentInspectorRisk}
        currentInputs={liveInputs}
      />
    </PhoneMockup>
  );
}
