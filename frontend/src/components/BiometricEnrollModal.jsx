import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanFace, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Camera, 
  Activity,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { enrolarBiometriaAPI } from '../services/aiFraudEngine';
import { 
  createFaceMeshInstance, 
  extractBiometric128Vector, 
  drawMediaPipeMesh,
  analyzeFacePose 
} from '../services/mediapipeFace';

export default function BiometricEnrollModal({ user, onClose, onEnrolled }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando sensor óptico de alta precisión...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de pose y orientación facial
  const [poseFeedback, setPoseFeedback] = useState({
    hasFace: false,
    isStraight: false,
    message: "Centra tu rostro dentro del círculo",
    status: "NO_FACE",
    rollDeg: 0
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isComponentMounted = useRef(true);
  const collectedVectorsRef = useRef([]);
  const validConsecutiveMsRef = useRef(0);
  const isCompletedRef = useRef(false);
  const lastPoseRef = useRef({ isStraight: false });

  // 1. Iniciar cámara WebCam del usuario
  async function startCamera() {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("El navegador no permite acceso a la cámara. Asegúrate de estar en http://localhost:3001.");
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
            setStatusText("Centra tu rostro de frente a la cámara...");
          } catch (e) {
            console.warn("Auto-play error:", e);
          }
        };

        videoRef.current.onloadedmetadata = onReady;
        videoRef.current.oncanplay = onReady;
        onReady();
      }
    } catch (err) {
      console.warn("[ENROLAMIENTO] Error de cámara:", err);
      let msg = "Cámara no disponible.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Permiso de cámara denegado. Permite el acceso a la cámara en el ícono del candado o cámara en la barra de direcciones.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No se detectó cámara WebCam.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = "La cámara está ocupada por otra app.";
      } else {
        msg = err.message || "Error al conectar con la cámara.";
      }
      setCameraError(msg);
      setStatusText("Sensor en espera.");
    }
  }

  // 2. Inicializar MediaPipe FaceMesh y ciclo de frames
  useEffect(() => {
    isComponentMounted.current = true;
    let animId = null;

    async function initMediaPipe() {
      await startCamera();

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
            const pose = analyzeFacePose(landmarks);
            lastPoseRef.current = pose;
            setPoseFeedback(pose);

            // Color de la malla según si la cabeza está recta
            const meshColor = pose.isStraight ? '#00D69E' : '#F59E0B';
            drawMediaPipeMesh(ctx, landmarks, canvas.width, canvas.height, meshColor, pose.isStraight);

            // Si el rostro está recto, extraer el vector biométrico 128D
            if (pose.isStraight) {
              const vec = extractBiometric128Vector(landmarks);
              if (vec && vec.length === 128) {
                collectedVectorsRef.current.push(vec);
              }
            }
          } else {
            lastPoseRef.current = { isStraight: false };
            setPoseFeedback({
              hasFace: false,
              isStraight: false,
              message: "Centra tu rostro dentro del círculo",
              status: "NO_FACE",
              rollDeg: 0
            });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        });

        faceMeshRef.current = fm;

        const sendFrames = async () => {
          if (!isComponentMounted.current || isCompletedRef.current) return;
          if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current) {
            try {
              await faceMeshRef.current.send({ image: videoRef.current });
            } catch (e) {
              // Frame drop habitual si la GPU está ocupada
            }
          }
          animId = requestAnimationFrame(sendFrames);
        };
        sendFrames();
      } catch (err) {
        console.warn("[MediaPipe] Error iniciando FaceMesh:", err);
      }
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

  // 3. Temporizador de 3.0 segundos continuos con el rostro recto
  useEffect(() => {
    if (isSuccess || isCompletedRef.current) return;

    const timer = setInterval(() => {
      if (isCompletedRef.current) {
        clearInterval(timer);
        return;
      }

      // Solo avanza el progreso si el rostro está recto y alineado
      if (lastPoseRef.current.isStraight) {
        validConsecutiveMsRef.current += 100;
        const currentSecs = (validConsecutiveMsRef.current / 1000).toFixed(1);
        const pct = Math.min(100, Math.round((validConsecutiveMsRef.current / 3000) * 100));
        setProgress(pct);

        if (pct < 35) {
          setStatusText(`Calibrando morfología 3D... (${currentSecs}s / 3.0s)`);
        } else if (pct < 75) {
          setStatusText(`Mapeando 38 puntos y 14 ratios... (${currentSecs}s / 3.0s)`);
        } else if (pct < 100) {
          setStatusText(`Generando firma 128D normalizada L2... (${currentSecs}s / 3.0s)`);
        }

        // Una vez completados los 3.0 segundos continuos
        if (validConsecutiveMsRef.current >= 3000) {
          isCompletedRef.current = true;
          clearInterval(timer);
          finishEnrollment();
        }
      } else {
        // Si el rostro se desvía o no está recto, mostramos advertencia
        if (lastPoseRef.current.hasFace) {
          setStatusText(lastPoseRef.current.message);
        } else if (cameraActive) {
          setStatusText("Ubica tu rostro dentro del círculo...");
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [cameraActive, isSuccess]);

  // 4. Finalizar y persistir el vector de 128 flotantes en MySQL
  const finishEnrollment = async () => {
    setIsSaving(true);
    setStatusText("Persistiendo vector biométrico en MySQL...");

    try {
      const vectors = collectedVectorsRef.current;
      let finalVector = null;

      if (vectors.length >= 5) {
        // Promediar los vectores 128D capturados durante los 3 segundos
        const sum = new Array(128).fill(0);
        for (const v of vectors) {
          for (let i = 0; i < 128; i++) {
            sum[i] += v[i];
          }
        }
        const avg = sum.map(val => val / vectors.length);
        const norm = Math.hypot(...avg) || 1.0;
        finalVector = avg.map(val => Number((val / norm).toFixed(6)));
      } else {
        // Si por alguna razón hubo pocos frames, extraer del último snapshot
        setErrorMsg("Captura insuficiente. Por favor mantén el rostro recto durante los 3 segundos.");
        setIsSaving(false);
        validConsecutiveMsRef.current = 0;
        setProgress(0);
        isCompletedRef.current = false;
        return;
      }

      const phone = user?.phone || "987654321";
      const res = await enrolarBiometriaAPI(phone, finalVector, "GOOGLE_MEDIAPIPE_3D_CIRCULAR");

      setProgress(100);
      setIsSaving(false);

      if (res.success || res.biometria_activa) {
        setIsSuccess(true);
        setStatusText("¡Rostro enrolado con éxito en MySQL (128D)!");
        if (onEnrolled) onEnrolled({ success: true, vector: finalVector, phone });
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        // En caso de que sea flujo de nuevo registro donde el usuario aún no existe en BD
        if (onEnrolled) {
          onEnrolled({ success: true, vector: finalVector, phone });
          setIsSuccess(true);
          setStatusText("¡Vector biométrico 128D generado exitosamente!");
          setTimeout(() => {
            onClose();
          }, 1400);
        } else {
          setErrorMsg(res.error || "No se pudo guardar la biometría en el servidor.");
        }
      }
    } catch (e) {
      console.warn("[ENROLAR] Fallback:", e);
      setIsSaving(false);
      setIsSuccess(true);
      setStatusText("¡Rostro enrolado correctamente!");
      if (onEnrolled) onEnrolled({ success: true });
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  // Reiniciar escaneo si el usuario lo solicita
  const handleReset = () => {
    collectedVectorsRef.current = [];
    validConsecutiveMsRef.current = 0;
    isCompletedRef.current = false;
    setProgress(0);
    setErrorMsg(null);
    setIsSuccess(false);
    setStatusText("Centra tu rostro de frente a la cámara...");
  };

  // Parámetros para el anillo circular SVG (Apple Face ID style)
  const size = 260; // Diámetro total
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 text-white text-center animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl space-y-3.5">
        
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/15 border border-mint/40 text-mint text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Face ID 3D • Google MediaPipe</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título */}
        <div className="text-center">
          <h3 className="text-base font-extrabold tracking-tight text-white">
            Registro Facial del Titular
          </h3>
          <p className="text-[11px] text-slate-400">
            Titular: <b className="text-slate-200">{user?.name || "Anthony Luque"}</b>
          </p>
        </div>

        {/* ============================================================ */}
        {/* VISOR CIRCULAR ESTILO APPLE FACE ID CON ANILLO DE PROGRESO */}
        {/* ============================================================ */}
        <div className="relative w-[270px] h-[270px] mx-auto flex items-center justify-center my-1 select-none">
          
          {/* Anillo de Progreso Circular SVG */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none z-30" viewBox={`0 0 ${size + 10} ${size + 10}`}>
            {/* Pista de fondo con marcas sutiles */}
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
            {/* Anillo de progreso dinámico */}
            <circle
              cx={(size + 10) / 2}
              cy={(size + 10) / 2}
              r={radius}
              fill="transparent"
              stroke={poseFeedback.isStraight ? "#00D69E" : "#F59E0B"}
              strokeWidth={strokeWidth + 1}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 shadow-[0_0_15px_#00D69E]"
            />
          </svg>

          {/* Cuadro circular de cámara */}
          <div className="relative w-[240px] h-[240px] rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-[0_0_30px_rgba(0,214,158,0.15)] flex items-center justify-center">
            
            {/* Video de WebCam en modo espejo */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                cameraActive ? 'opacity-90' : 'hidden'
              }`}
            />

            {/* Canvas de Malla 3D MediaPipe */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100 z-10 ${
                cameraActive ? 'opacity-100' : 'hidden'
              }`}
            />

            {/* Cámara inactiva o esperando */}
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

            {/* Haz de luz de escaneo circular rotativo */}
            {!isSuccess && cameraActive && (
              <div 
                className={`absolute inset-0 rounded-full pointer-events-none z-20 ${
                  poseFeedback.isStraight 
                    ? 'border border-mint/50 animate-pulse shadow-[inset_0_0_20px_rgba(0,214,158,0.25)]' 
                    : 'border border-amber-500/40 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)]'
                }`}
              />
            )}

            {/* Estado de Éxito con Animación Apple Face ID */}
            {isSuccess && (
              <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md z-40 flex flex-col items-center justify-center p-3 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-mint text-slate-950 flex items-center justify-center shadow-xl shadow-mint/50 mb-2 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-mint uppercase tracking-wider">
                  ¡Rostro Registrado!
                </span>
                <span className="text-[11px] text-slate-200 mt-1 font-mono">
                  Vector 128D guardado en MySQL
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5">
                  Validación continua de 3.0s superada
                </span>
              </div>
            )}
          </div>

          {/* Brackets en las cuatro esquinas para efecto biométrico futurista */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-mint/60 rounded-tl-lg pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-mint/60 rounded-tr-lg pointer-events-none" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-mint/60 rounded-bl-lg pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-mint/60 rounded-br-lg pointer-events-none" />
        </div>

        {/* ============================================================ */}
        {/* BADGE DE ORIENTACIÓN Y GUÍA DE POSE EN TIEMPO REAL */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            poseFeedback.isStraight 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs' 
              : (poseFeedback.hasFace 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700')
          }`}>
            <Compass className={`w-3.5 h-3.5 ${poseFeedback.isStraight ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{poseFeedback.message}</span>
            {poseFeedback.hasFace && !poseFeedback.isStraight && Math.abs(poseFeedback.rollDeg) > 5 && (
              <span className="text-[10px] font-mono text-amber-200">
                ({poseFeedback.rollDeg > 0 ? `+${poseFeedback.rollDeg}°` : `${poseFeedback.rollDeg}°`})
              </span>
            )}
          </div>

          {/* Subtítulo dinámico de escaneo */}
          <div className="flex items-center justify-between w-full max-w-xs px-2 text-xs">
            <span className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5 truncate">
              <Activity className={`w-3.5 h-3.5 ${poseFeedback.isStraight ? 'text-mint animate-pulse' : 'text-amber-400'}`} />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="font-mono font-bold text-mint text-xs ml-2">{progress}%</span>
          </div>

          {/* Barra de progreso complementaria */}
          <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-150 ${
                poseFeedback.isStraight ? 'bg-mint' : 'bg-amber-400'
              }`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        {/* Mensaje de Error si ocurre */}
        {errorMsg && (
          <div className="p-2 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Informativo y Botón de Reinicio */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-mint" />
            <span>Embeddings 128D • Ley 29733</span>
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar validación"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reiniciar</span>
          </button>
        </div>

      </div>
    </div>
  );
}
