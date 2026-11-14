/**
 * Servicio de Biometría Facial 3D con Google MediaPipe FaceMesh
 * Extrae vectores invariantes a escala, rotación y distancia (128 dimensiones normalizadas L2).
 * Incluye estimación de pose en tiempo real (roll, yaw, pitch, centrado y distancia).
 */

// 38 puntos anatómicos característicos para capturar la estructura ósea y rasgos únicos
const KEY_38_LANDMARKS = [
  // Línea media y puente nasal (8 puntos)
  10, 151, 9, 8, 168, 6, 197, 1,
  // Ojo izquierdo: esquinas, párpados y contorno (7 puntos)
  33, 160, 158, 133, 153, 144, 468,
  // Ojo derecho: esquinas, párpados y contorno (7 puntos)
  263, 387, 385, 362, 373, 380, 473,
  // Cejas (6 puntos)
  70, 105, 66, 300, 334, 296,
  // Labios: comisuras y vértices centrales (6 puntos)
  61, 37, 0, 267, 291, 17,
  // Mandíbula, mentón y pómulos (4 puntos)
  234, 454, 152, 172
]; // 38 puntos x 3 coordenadas (X, Y, Z) = 114 valores

/**
 * Espera a que los scripts de MediaPipe estén cargados en window
 */
export async function waitForMediaPipe(maxWaitMs = 6000) {
  const start = Date.now();
  while (!window.FaceMesh && Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 100));
  }
  return !!window.FaceMesh;
}

/**
 * Inicializa la instancia de Google MediaPipe FaceMesh
 */
export async function createFaceMeshInstance(onResultsCallback) {
  const isAvailable = await waitForMediaPipe();
  if (!isAvailable || !window.FaceMesh) {
    console.warn("[MediaPipe] FaceMesh no disponible en window.");
    return null;
  }

  const faceMesh = new window.FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResultsCallback);
  await faceMesh.initialize();
  return faceMesh;
}

/**
 * Analiza la pose de la cabeza (orientación, centrado y distancia)
 * Detecta si la cabeza está recta o si se debe indicar al usuario corregirla.
 */
export function analyzeFacePose(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return {
      hasFace: false,
      isStraight: false,
      message: "Ubica tu rostro dentro del círculo",
      status: "NO_FACE",
      rollDeg: 0,
      yawRatio: 1.0,
      pitchRatio: 0.6,
      faceWidth: 0
    };
  }

  const pBridge = landmarks[168] || landmarks[6] || landmarks[1];
  const pNoseTip = landmarks[1] || landmarks[4];
  const pLeftEye = landmarks[133] || landmarks[33];
  const pRightEye = landmarks[362] || landmarks[263];
  const pChin = landmarks[152];
  const pForehead = landmarks[10];
  const pLeftCheek = landmarks[234];
  const pRightCheek = landmarks[454];

  // 1. Roll: Ángulo lateral de inclinación (en grados)
  // En coordenadas de imagen, invertido si la cámara tiene espejo
  const dx = pRightEye.x - pLeftEye.x;
  const dy = pRightEye.y - pLeftEye.y;
  const rollRad = Math.atan2(dy, dx);
  const rollDeg = (rollRad * 180) / Math.PI;

  // 2. Yaw: Giro izquierda/derecha
  const distToLeft = Math.abs(pNoseTip.x - pLeftEye.x);
  const distToRight = Math.abs(pRightEye.x - pNoseTip.x);
  const yawRatio = distToRight > 0.001 ? distToLeft / distToRight : 1.0;

  // 3. Pitch: Inclinación arriba/abajo
  const totalH = Math.abs(pChin.y - pForehead.y);
  const noseH = Math.abs(pNoseTip.y - pForehead.y);
  const pitchRatio = totalH > 0.001 ? noseH / totalH : 0.6;

  // 4. Tamaño y distancia
  const faceWidth = Math.abs(pRightCheek.x - pLeftCheek.x);
  const centerX = pBridge.x;
  const centerY = pBridge.y;

  // Criterios de cabeza recta:
  // Roll: tolerancia de +- 8.5 grados
  const isRollStraight = Math.abs(rollDeg) <= 8.5;
  // Yaw: ratio simétrico entre 0.65 y 1.55
  const isYawStraight = yawRatio >= 0.65 && yawRatio <= 1.55;
  // Pitch: entre 0.48 y 0.74
  const isPitchStraight = pitchRatio >= 0.48 && pitchRatio <= 0.74;
  // Distancia óptima
  const isTooFar = faceWidth < 0.20;
  const isTooClose = faceWidth > 0.75;
  // Centrado dentro del marco
  const isCentered = centerX >= 0.28 && centerX <= 0.72 && centerY >= 0.22 && centerY <= 0.78;

  let message = "¡Excelente! Mantén el rostro recto";
  let status = "PERFECT";
  let isStraight = false;

  if (isTooFar) {
    message = "Acércate un poco a la cámara";
    status = "TOO_FAR";
  } else if (isTooClose) {
    message = "Aléjate un poco de la cámara";
    status = "TOO_CLOSE";
  } else if (!isCentered) {
    message = "Centra tu rostro dentro del círculo";
    status = "NOT_CENTERED";
  } else if (!isRollStraight) {
    message = rollDeg > 0 ? "Pon recto el rostro (inclina a la izquierda)" : "Pon recto el rostro (inclina a la derecha)";
    status = "TILTED";
  } else if (!isYawStraight) {
    message = "Mira de frente a la cámara";
    status = "TURNED";
  } else if (!isPitchStraight) {
    message = pitchRatio < 0.48 ? "Baja ligeramente el mentón" : "Mira de frente a la cámara";
    status = "PITCHED";
  } else {
    isStraight = true;
  }

  return {
    hasFace: true,
    isStraight,
    message,
    status,
    rollDeg: Number(rollDeg.toFixed(1)),
    yawRatio: Number(yawRatio.toFixed(2)),
    pitchRatio: Number(pitchRatio.toFixed(2)),
    faceWidth: Number(faceWidth.toFixed(2)),
    center: { x: centerX, y: centerY }
  };
}

/**
 * Extrae vector biométrico de exactamente 128 dimensiones normalizado L2
 * Invariante a escala (distancia a cámara) y alineado respecto al ángulo de los ojos.
 * 114 coordenadas normalizadas 3D + 14 ratios antropométricos = 128D
 */
export function extractBiometric128Vector(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  // Centro de referencia: puente nasal (entre ojos)
  const pCenter = landmarks[168] || landmarks[1];
  // Puntos para distancia interpupilar y alineación de ángulo
  const pLeftEye = landmarks[468] || landmarks[133] || landmarks[33];
  const pRightEye = landmarks[473] || landmarks[362] || landmarks[263];

  const dx = pRightEye.x - pLeftEye.x;
  const dy = pRightEye.y - pLeftEye.y;
  const dz = (pRightEye.z || 0) - (pLeftEye.z || 0);

  const eyeDist = Math.hypot(dx, dy, dz) || 0.15;
  const rollAngle = Math.atan2(dy, dx);
  const cosRoll = Math.cos(-rollAngle);
  const sinRoll = Math.sin(-rollAngle);

  const rawFeatures = [];

  // Coordenadas relativas normalizadas y rotadas para 38 puntos (114 valores)
  for (const idx of KEY_38_LANDMARKS) {
    const pt = landmarks[idx] || pCenter;
    const rx = (pt.x - pCenter.x) / eyeDist;
    const ry = (pt.y - pCenter.y) / eyeDist;
    const rz = ((pt.z || 0) - (pCenter.z || 0)) / eyeDist;

    // Rotación 2D para alinear ojos canónicamente en el eje horizontal
    const rotX = rx * cosRoll - ry * sinRoll;
    const rotY = rx * sinRoll + ry * cosRoll;

    rawFeatures.push(rotX, rotY, rz);
  }

  // 14 Ratios morfológicos antropométricos distintivos
  const pChin = landmarks[152] || pCenter;
  const pForehead = landmarks[10] || pCenter;
  const pJawL = landmarks[234] || pLeftEye;
  const pJawR = landmarks[454] || pRightEye;
  const pNoseTip = landmarks[1] || pCenter;
  const pNoseBase = landmarks[2] || pCenter;
  const pLipTop = landmarks[0] || pCenter;
  const pLipBottom = landmarks[17] || pCenter;
  const pMouthL = landmarks[61] || pCenter;
  const pMouthR = landmarks[291] || pCenter;
  const pLeftBrow = landmarks[105] || pLeftEye;
  const pRightBrow = landmarks[334] || pRightEye;

  // 1. Ratio altura facial total / distancia ocular
  const r1 = Math.abs(pChin.y - pForehead.y) / eyeDist;
  // 2. Ratio ancho facial de pómulos / distancia ocular
  const r2 = Math.abs(pJawR.x - pJawL.x) / eyeDist;
  // 3. Proporción altura/ancho de rostro
  const r3 = r2 > 0.001 ? r1 / r2 : 1.35;
  // 4. Ancho de la boca / ancho facial
  const r4 = Math.abs(pMouthR.x - pMouthL.x) / eyeDist;
  // 5. Altura nariz-mentón / altura facial
  const r5 = Math.abs(pChin.y - pNoseTip.y) / (Math.abs(pChin.y - pForehead.y) || 1.0);
  // 6. Distancia nariz a labio superior
  const r6 = Math.abs(pLipTop.y - pNoseBase.y) / eyeDist;
  // 7. Distancia labio inferior a mentón
  const r7 = Math.abs(pChin.y - pLipBottom.y) / eyeDist;
  // 8. Espacio intercantal interno vs distancia ocular externa
  const r8 = Math.abs((landmarks[362]?.x || 0) - (landmarks[133]?.x || 0)) / eyeDist;
  // 9. Altura de ceja izquierda a ojo
  const r9 = Math.abs(pLeftBrow.y - pLeftEye.y) / eyeDist;
  // 10. Altura de ceja derecha a ojo
  const r10 = Math.abs(pRightBrow.y - pRightEye.y) / eyeDist;
  // 11. Relación de apertura labial
  const r11 = Math.abs(pLipBottom.y - pLipTop.y) / eyeDist;
  // 12. Distancia mandibular inferior
  const r12 = Math.abs((landmarks[172]?.x || 0) - (landmarks[397]?.x || 0)) / eyeDist;
  // 13. Prominencia nasal en eje Z
  const r13 = Math.abs((pNoseTip.z || 0) - (pCenter.z || 0)) / eyeDist;
  // 14. Relación de profundidad ocular en eje Z
  const r14 = Math.abs((pLeftEye.z || 0) - (pNoseTip.z || 0)) / eyeDist;

  rawFeatures.push(r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14);

  // Exactamente 114 + 14 = 128 dimensiones
  const final128 = rawFeatures.slice(0, 128);

  // Normalización L2 (Vector unitario euclidiano)
  const norm = Math.hypot(...final128) || 1.0;
  return final128.map(val => Number((val / norm).toFixed(6)));
}

/**
 * Dibuja la malla 3D y los landmarks de MediaPipe sobre el canvas
 */
export function drawMediaPipeMesh(ctx, landmarks, width, height, statusColor = '#00D69E', isStraight = true) {
  ctx.clearRect(0, 0, width, height);
  if (!landmarks || landmarks.length === 0) return;

  const color = statusColor;

  // 1. Dibujar puntos faciales optimizados (cada 3 landmarks)
  ctx.fillStyle = color;
  for (let i = 0; i < landmarks.length; i += 3) {
    const pt = landmarks[i];
    const px = (1 - pt.x) * width; // Efecto espejo
    const py = pt.y * height;
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Dibujar contornos característicos
  const drawLoop = (indices, close = true, lineWidth = 1.3) => {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `${color}cc`;
    indices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (!pt) return;
      const px = (1 - pt.x) * width;
      const py = pt.y * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    if (close) ctx.closePath();
    ctx.stroke();
  };

  // Ojo izquierdo
  drawLoop([33, 160, 158, 133, 153, 144]);
  // Ojo derecho
  drawLoop([263, 387, 385, 362, 373, 380]);
  // Ceja izquierda
  drawLoop([70, 63, 105, 66, 107], false);
  // Ceja derecha
  drawLoop([300, 293, 334, 296, 336], false);
  // Labios exteriores
  drawLoop([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]);
  // Nariz y tabique
  drawLoop([168, 6, 197, 195, 5, 4, 1, 19, 94, 2], false);

  // Óvalo facial exterior
  const faceOval = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400,
    377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ];
  drawLoop(faceOval, true, 1.0);
}
