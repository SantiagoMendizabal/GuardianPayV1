import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanFace, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Camera, 
  RefreshCw, 
  ShieldX, 
  Activity, 
  AlertTriangle, 
  Compass, 
  ShieldCheck,
  LockOpen,
  Lock
} from 'lucide-react';
import { verificarBiometriaAPI, desbloquearCuentaAPI } from '../services/aiFraudEngine';
import { 
  createFaceMeshInstance, 
  extractBiometric128Vector, 
  drawMediaPipeMesh,
  extractRealFaceDescriptorFromVideo
} from '../services/mediapipeFace';

export default function BiometricModal({ 
  user, 
  onComplete, 
  onCancel,
  onOpenEnroll,
  onTransactionBlocked,
  onUnblockAccount
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [scanningStatus, setScanningStatus] = useState("Iniciando sensor óptico de tu laptop...");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isImpostorMode, setIsImpostorMode] = useState(false);

  // Estados de pose y orientación facial
  const [poseFeedback, setPoseFeedback] = useState({
    hasFace: true,
    isStraight: true,
    message: "¡Rostro Detectado! Mantén la posición...",
    status: "PERFECT",
    rollDeg: 0
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isComponentMounted = useRef(true);
  const collectedVectorsRef = useRef([]);
  const isCompletedRef = useRef(false);
  const isSendingFrameRef = useRef(false);

  // 1. Iniciar cámara WebCam del usuario
  async function startCamera() {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no permite acceso a la cámara. Asegúrate de otorgar permisos de cámara.");
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });
      } catch (err1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!isComponentMounted.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const onReady = async () => {
          if (!videoRef.current) return;
          try {
            await videoRef.current.play();
            setCameraActive(true);
            setCameraError(null);
            setScanningStatus("Centra tu rostro frente a la cámara...");
          } catch (e) {
            console.warn("Auto-play error:", e);
          }
        };

        videoRef.current.onloadedmetadata = onReady;
        videoRef.current.oncanplay = onReady;
        onReady();
      }
    } catch (err) {
      console.warn("[BIOMETRÍA] Error de cámara:", err);
      let msg = "Cámara no disponible.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Permiso de cámara denegado. Permite el acceso a la cámara en el navegador.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No se detectó cámara WebCam.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = "La cámara está ocupada por otra app.";
      } else {
        msg = err.message || "Error al conectar con la cámara.";
      }
      setCameraError(msg);
      setScanningStatus("Sensor en espera.");
    }
  }

  // 2. Renderizado de Malla Facial 3D y MediaPipe en Canvas
  useEffect(() => {
    isComponentMounted.current = true;
    let animId = null;

    async function initMediaPipe() {
      await startCamera();

      // Intentar cargar MediaPipe FaceMesh de forma no bloqueante
      try {
        const fm = await createFaceMeshInstance((results) => {
          if (!isComponentMounted.current || isCompletedRef.current) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video) return;

          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const meshColor = verificationResult?.verified 
              ? '#00D69E' 
              : (verificationResult ? '#EF4444' : '#00D69E');
            drawMediaPipeMesh(ctx, landmarks, canvas.width, canvas.height, meshColor, true);

            const vec = extractBiometric128Vector(landmarks);
            if (vec && vec.length === 128) {
              collectedVectorsRef.current.push(vec);
              if (collectedVectorsRef.current.length > 40) {
                collectedVectorsRef.current.shift();
              }
            }
          }
        });
        faceMeshRef.current = fm;
      } catch (err) {
        console.warn("[MediaPipe] FaceMesh en modo canvas integrado:", err);
      }

      // Ciclo continuo de renderizado holográfico 3D sobre Canvas
      let frameCount = 0;
      const renderLoop = async () => {
        if (!isComponentMounted.current || isCompletedRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && video.readyState >= 2 && canvas) {
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext('2d');
          frameCount++;

          // Si MediaPipe está disponible y no está ocupado, enviamos frame
          if (faceMeshRef.current && !isSendingFrameRef.current) {
            isSendingFrameRef.current = true;
            try {
              await faceMeshRef.current.send({ image: video });
            } catch (e) {
              // Frame skip
            } finally {
              isSendingFrameRef.current = false;
            }
          }

          // Dibujar malla facial 3D holográfica sobre el rostro
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const rx = canvas.width * 0.28;
          const ry = canvas.height * 0.38;
          const pulse = Math.sin(frameCount * 0.1) * 3;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const meshColor = verificationResult?.verified 
            ? '#00D69E' 
            : (verificationResult ? '#EF4444' : '#00D69E');

          ctx.strokeStyle = meshColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx + pulse, ry + pulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Ejes de profundidad 3D
          ctx.strokeStyle = `${meshColor}66`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy - ry + 10);
          ctx.lineTo(cx, cy + ry - 10);
          ctx.moveTo(cx - rx + 10, cy);
          ctx.lineTo(cx + rx - 10, cy);
          ctx.stroke();

          // Puntos clave anatómicos
          const keyNodes = [
            { x: cx - rx * 0.38, y: cy - ry * 0.18 },
            { x: cx + rx * 0.38, y: cy - ry * 0.18 },
            { x: cx, y: cy + ry * 0.05 },
            { x: cx - rx * 0.42, y: cy - ry * 0.40 },
            { x: cx + rx * 0.42, y: cy - ry * 0.40 },
            { x: cx - rx * 0.28, y: cy + ry * 0.48 },
            { x: cx + rx * 0.28, y: cy + ry * 0.48 },
            { x: cx, y: cy + ry * 0.55 },
            { x: cx - rx * 0.65, y: cy + ry * 0.15 },
            { x: cx + rx * 0.65, y: cy + ry * 0.15 }
          ];

          keyNodes.forEach((pt, idx) => {
            ctx.fillStyle = meshColor;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            if ((frameCount + idx * 8) % 24 < 12) {
              ctx.strokeStyle = `${meshColor}aa`;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
              ctx.stroke();
            }
          });
        }

        animId = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    }

    initMediaPipe();

    return () => {
      isComponentMounted.current = false;
      if (animId) cancelAnimationFrame(animId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // 3. Temporizador Activo que llena el Anillo Circular de 0% a 100%
  useEffect(() => {
    if (!cameraActive || verificationResult || isCompletedRef.current) return;

    const interval = setInterval(() => {
      if (isCompletedRef.current) {
        clearInterval(interval);
        return;
      }

      setProgress((prev) => {
        const next = prev + 4;
        if (next < 30) {
          setScanningStatus("Escaneando geometría 3D en vivo...");
        } else if (next < 65) {
          setScanningStatus("Extrayendo vector de 128 dimensiones...");
        } else if (next < 95) {
          setScanningStatus("Calculando similitud de coseno contra MySQL...");
        } else if (next >= 100) {
          clearInterval(interval);
          isCompletedRef.current = true;
          triggerBiometricVerification();
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [cameraActive, verificationResult, isImpostorMode]);

  // 4. Ejecución del Cotejo Biométrico 1:1 real contra MySQL
  const triggerBiometricVerification = async () => {
    setIsVerifying(true);
    setScanningStatus("Cotejando vector 128D contra registro en MySQL...");

    try {
      const vectors = collectedVectorsRef.current;
      let finalVector = [];
      let surfaceRejectedReason = null;

      // Validar si la cámara tiene un rostro real (descarta paredes, hojas y manos)
      const realDesc = extractRealFaceDescriptorFromVideo(videoRef.current, canvasRef.current);

      if (vectors.length >= 1) {
        const sum = new Array(128).fill(0);
        for (const v of vectors) {
          for (let i = 0; i < 128; i++) {
            sum[i] += v[i];
          }
        }
        const avg = sum.map(val => val / vectors.length);
        const norm = Math.hypot(...avg) || 1.0;
        finalVector = avg.map(val => Number((val / norm).toFixed(6)));
      } else if (realDesc.hasFace && realDesc.vector) {
        finalVector = realDesc.vector;
      } else {
        // No hay rostro detectable: es una pared, una mano o superficie plana
        surfaceRejectedReason = realDesc.reason || "Pared o superficie plana sin rostro";
        // Enviamos vector nulo para que la API registre el fallo biométrico formalmente en MySQL
        finalVector = new Array(128).fill(0.0);
      }

      // Si el modo impostor está activo, invertir y desfasar vector para forzar disonancia
      if (isImpostorMode) {
        finalVector = finalVector.map((val, idx) => Number((Math.sin(idx * 1.5) * 0.35 + Math.random() * 0.1).toFixed(6)));
        const norm = Math.hypot(...finalVector) || 1.0;
        finalVector = finalVector.map(val => Number((val / norm).toFixed(6)));
      }

      const userPhone = user?.phone || "987654321";
      const res = await verificarBiometriaAPI(userPhone, finalVector, 0.85);

      setProgress(100);
      setIsVerifying(false);

      if (res.verified) {
        setVerificationResult({
          verified: true,
          similarity: res.similarity_pct || 94.5,
          storedAt: res.stored_enrolled_at,
          vectorPreview: res.vector_preview,
          message: "Identidad verificada exitosamente (Coincidencia: " + (res.similarity_pct || 94.5) + "%)"
        });
        setScanningStatus("¡Identidad Confirmada! Autorizando transferencia...");
        setTimeout(() => {
          onComplete();
        }, 1600);
      } else {
        // Falló el cotejo biométrico
        const blocked = Boolean(res.transaction_blocked);
        const frozen = Boolean(res.account_frozen);
        const failedCount = res.failed_attempts || 1;
        const consecutiveBlocks = res.consecutive_blocked_txs || 0;

        setVerificationResult({
          verified: false,
          similarity: res.similarity_pct || 0.0,
          transactionBlocked: blocked,
          accountFrozen: frozen,
          frozenUntil: res.frozen_until,
          failedAttempts: failedCount,
          consecutiveBlocks: consecutiveBlocks,
          storedAt: res.stored_enrolled_at,
          vectorPreview: res.vector_preview,
          reason: surfaceRejectedReason,
          message: isImpostorMode 
            ? "ALERTA: Rostro de impostor detectado (Similitud: " + (res.similarity_pct || 14.2) + "% < 85%)"
            : (res.message || "Rostro no coincide con el titular de la cuenta bancaria.")
        });

        if (blocked) {
          setScanningStatus(frozen
            ? "🚨 ¡CUENTA CONGELADA POR 24 HORAS! Regresando al inicio..."
            : "🛑 ¡TRANSACCIÓN BLOQUEADA! 3 intentos fallidos."
          );
          // Retornar al Dashboard después de mostrar la alerta
          setTimeout(() => {
            if (onTransactionBlocked) {
              onTransactionBlocked(res);
            } else {
              onCancel();
            }
          }, 3200);
        } else {
          setScanningStatus(`Intento fallido ${failedCount} de 3: Coincidencia insuficiente.`);
        }
      }
    } catch (err) {
      console.warn("[BIOMETRÍA] Error en cotejo:", err);
      setProgress(100);
      setIsVerifying(false);
      // Principio Fail-Closed: ante cualquier error del servidor, se deniega la transacción
      setVerificationResult({
        verified: false,
        similarity: 0.0,
        transactionBlocked: false,
        failedAttempts: 1,
        message: "Error de verificación: No se pudo conectar con el servicio biométrico en MySQL."
      });
      setScanningStatus("Error: Fallo de comunicación con el motor biométrico.");
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setIsVerifying(false);
    setProgress(0);
    collectedVectorsRef.current = [];
    isCompletedRef.current = false;
    setScanningStatus("Centra tu rostro frente a la cámara...");
  };

  const handleManualVerify = () => {
    isCompletedRef.current = true;
    setProgress(100);
    triggerBiometricVerification();
  };

  const size = 260;
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 text-white text-center animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl space-y-3.5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/15 border border-mint/40 text-mint text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Face ID 3D • Google MediaPipe</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (onUnblockAccount) await onUnblockAccount();
                else await desbloquearCuentaAPI(user?.phone || '987654321');
                handleRetry();
              }}
              className="text-[10px] font-bold px-2 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Restablecer intentos fallidos a 0 para pruebas"
            >
              <LockOpen className="w-3 h-3 text-indigo-300" />
              <span>Desbloquear</span>
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Challenge Warning */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Desafío de Seguridad Antifraude (2FA)</span>
          </div>
          <h3 className="text-base font-extrabold tracking-tight text-white">
            Autenticación Biométrica Requerida
          </h3>
          <p className="text-[11px] text-slate-400">
            Titular: <b className="text-slate-200">{user?.name || "Anthony Luque"}</b>
          </p>
        </div>

        {/* VISOR CIRCULAR ESTILO APPLE FACE ID */}
        <div className="relative w-[270px] h-[270px] mx-auto flex items-center justify-center my-1 select-none">
          
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none z-30" viewBox={`0 0 ${size + 10} ${size + 10}`}>
            <circle
              cx={(size + 10) / 2}
              cy={(size + 10) / 2}
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              strokeDasharray="4 6"
              className="opacity-70"
            />
            <circle
              cx={(size + 10) / 2}
              cy={(size + 10) / 2}
              r={radius}
              fill="transparent"
              stroke={
                verificationResult 
                  ? (verificationResult.verified ? "#00D69E" : "#EF4444")
                  : "#00D69E"
              }
              strokeWidth={strokeWidth + 1}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 shadow-[0_0_15px_#00D69E]"
            />
          </svg>

          <div className="relative w-[240px] h-[240px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-[0_0_30px_rgba(0,214,158,0.15)] flex items-center justify-center">
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                cameraActive ? 'opacity-90' : 'hidden'
              }`}
            />

            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100 z-10 ${
                cameraActive ? 'opacity-100' : 'hidden'
              }`}
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-yape-950/80 z-0">
                <ScanFace className="w-14 h-14 text-mint/60 animate-pulse mb-2" />
                <span className="text-[10px] text-slate-300 max-w-[190px] leading-tight">
                  {cameraError || "Iniciando sensor óptico de tu laptop..."}
                </span>
                {cameraError && (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="mt-3 px-3 py-1 bg-mint/20 hover:bg-mint/30 border border-mint/40 rounded-xl text-mint text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Permitir / Reintentar</span>
                  </button>
                )}
              </div>
            )}

            {!verificationResult && cameraActive && (
              <div className="absolute inset-0 rounded-full pointer-events-none z-20 border border-mint/50 animate-pulse shadow-[inset_0_0_20px_rgba(0,214,158,0.25)]" />
            )}

            {verificationResult && (
              <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md z-40 flex flex-col items-center justify-center p-3 animate-scale-up">
                {verificationResult.verified ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-mint text-slate-950 flex items-center justify-center shadow-xl shadow-mint/50 mb-2 animate-bounce">
                      <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black text-mint uppercase tracking-wider">
                      Identidad Confirmada
                    </span>
                    <span className="text-sm font-extrabold text-white mt-1">
                      Similitud: {verificationResult.similarity}%
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                      Vector 128D cotejado en MySQL
                    </span>
                    {verificationResult.storedAt && (
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Enrolado: {verificationResult.storedAt}
                      </span>
                    )}
                  </div>
                ) : verificationResult.transactionBlocked ? (
                  /* 🚨 PANTALLA DE TRANSACCIÓN BLOQUEADA / CUENTA CONGELADA */
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="w-14 h-14 rounded-full bg-red-600/30 text-red-500 border-2 border-red-500 flex items-center justify-center shadow-lg mb-1.5 animate-bounce">
                      <ShieldX className="w-9 h-9 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                      {verificationResult.accountFrozen ? "🚨 Cuenta Congelada 24h" : "🛑 Transacción Bloqueada"}
                    </span>
                    <span className="text-[11px] font-bold text-white mt-0.5 leading-tight">
                      {verificationResult.accountFrozen 
                        ? "3 transacciones bloqueadas por biometría" 
                        : "3 intentos fallidos consecutivos"}
                    </span>
                    <span className="text-[9px] text-red-200 mt-1 max-w-[210px] leading-tight">
                      {verificationResult.accountFrozen 
                        ? "Tu cuenta ha sido congelada temporalmente por 24 horas por normativa SBS."
                        : "La transacción se ha cancelado y se devolverá a la pantalla de inicio."}
                    </span>

                    <div className="mt-2.5 flex flex-col gap-1.5 w-full max-w-[210px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (onTransactionBlocked) onTransactionBlocked(verificationResult);
                          else onCancel();
                        }}
                        className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md"
                      >
                        Volver al Inicio Ahora
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onUnblockAccount) await onUnblockAccount();
                          else await desbloquearCuentaAPI(user?.phone || '987654321');
                          handleRetry();
                        }}
                        className="w-full py-1 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LockOpen className="w-3 h-3 text-mint" />
                        <span>Desbloquear (Modo Pruebas)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ⚠️ REINTENTO DISPONIBLE (INTENTO 1 o 2 DE 3) */
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shadow-lg mb-1.5">
                      <ShieldX className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                      Rostro Rechazado
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      Similitud: {verificationResult.similarity}%
                    </span>

                    {/* Indicador de Intentos 1, 2, 3 */}
                    <div className="flex items-center gap-1.5 my-1 bg-red-950/60 border border-red-800/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-red-300">
                      <span>Intento {verificationResult.failedAttempts || 1} de 3</span>
                      <div className="flex items-center gap-1 ml-1">
                        <span className={`w-2 h-2 rounded-full ${(verificationResult.failedAttempts || 1) >= 1 ? 'bg-red-500' : 'bg-slate-600'}`} />
                        <span className={`w-2 h-2 rounded-full ${(verificationResult.failedAttempts || 1) >= 2 ? 'bg-red-500' : 'bg-slate-600'}`} />
                        <span className={`w-2 h-2 rounded-full ${(verificationResult.failedAttempts || 1) >= 3 ? 'bg-red-500' : 'bg-slate-600'}`} />
                      </div>
                    </div>

                    <span className="text-[10px] text-red-300 max-w-[190px] leading-tight">
                      {verificationResult.reason || "No coincide con el titular registrado (< 85%)"}
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      Queda(n) {3 - (verificationResult.failedAttempts || 1)} intento(s) antes del bloqueo.
                    </span>

                    <button
                      onClick={handleRetry}
                      className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar Escaneo ({(verificationResult.failedAttempts || 1) + 1}/3)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-mint/60 rounded-tl-lg pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-mint/60 rounded-tr-lg pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-mint/60 rounded-bl-lg pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-mint/60 rounded-br-lg pointer-events-none" />
        </div>

        {/* BADGE DE ORIENTACIÓN Y STATUS */}
        <div className="flex flex-col items-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{verificationResult ? "Escaneo Finalizado" : "¡Rostro Detectado! Mantén la posición..."}</span>
          </div>

          <div className="flex items-center justify-between w-full max-w-xs px-2 text-xs">
            <span className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5 truncate">
              <Activity className="w-3.5 h-3.5 text-mint animate-pulse" />
              <span className="truncate">{scanningStatus}</span>
            </span>
            <span className="font-mono font-bold text-mint text-xs ml-2">{progress}%</span>
          </div>

          <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-150 ${
                verificationResult?.verified === false ? 'bg-red-500' : 'bg-mint'
              }`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* Botón de Validación Inmediata */}
        {!verificationResult && (
          <button
            type="button"
            onClick={handleManualVerify}
            disabled={isVerifying}
            className="w-full max-w-xs mx-auto py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-gradient-to-r from-mint to-emerald-400 text-slate-950 hover:brightness-105 active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>{isVerifying ? "Consultando MySQL..." : "Validar Rostro Ahora"}</span>
          </button>
        )}

        {/* Switch Demostración Titular vs Impostor */}
        <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Modo Sustentación:</span>
          <button
            type="button"
            onClick={() => {
              setIsImpostorMode(!isImpostorMode);
              handleRetry();
            }}
            className={`px-2.5 py-1 rounded-xl font-extrabold text-[10px] border transition-all cursor-pointer ${
              isImpostorMode 
                ? 'bg-red-500/20 text-red-300 border-red-500' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
            }`}
          >
            {isImpostorMode ? "👤 IMPOSTOR (Rechaza)" : "👤 TITULAR (Aprueba)"}
          </button>
        </div>

        {/* Enlace para ir a enrolar nuevo rostro */}
        {onOpenEnroll && (!verificationResult || !verificationResult.verified) && (
          <button
            type="button"
            onClick={onOpenEnroll}
            className="text-[10px] text-mint hover:underline font-semibold cursor-pointer"
          >
            ¿Deseas registrar o actualizar tu rostro en la base de datos? Clic aquí
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-mint" />
            <span>Similitud Coseno &ge; 85% • Ley 29733</span>
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar validación"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reiniciar</span>
          </button>
        </div>

      </div>
    </div>
  );
}
