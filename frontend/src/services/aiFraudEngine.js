/**
 * Motor Simulado de Inteligencia Artificial para Detección de Fraude en Tiempo Real
 * GuardianPay ML Risk Engine (Edge / Client-Side)
 * 
 * Reglas de Scoring:
 * - Riesgo Base: 5%
 * - Monto > S/ 200: +30%
 * - Horario de Madrugada (00:00 - 05:00): +35%
 * - Contacto Nuevo (no frecuente): +15%
 * - Ubicación Inusual / IP extranjera: +25%
 * 
 * Umbral de Intervención:
 * - Score < 70%: Operación Aprobada (Riesgo Bajo / Medio)
 * - Score >= 70%: Intercepción por Fraude (Riesgo Crítico)
 */

export function isMadrugada(hora) {
  if (typeof hora === 'string') {
    const h = hora.toLowerCase();
    if (h.includes('madrugada') || h.includes('03:45') || h.includes('am')) {
      const match = h.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const hourNum = parseInt(match[1], 10);
        return (hourNum >= 0 && hourNum <= 5);
      }
      return h.includes('madrugada');
    }
    return false;
  }
  if (typeof hora === 'number') {
    return hora >= 0 && hora <= 5;
  }
  return false;
}

export function calcularRiesgoIA({
  monto = 0,
  hora = "14:30",
  esContactoNuevo = false,
  esUbicacionInusual = false
}) {
  const numericAmount = parseFloat(monto) || 0;
  let score = 5; // Riesgo Base
  
  const factors = [
    {
      id: "base",
      name: "Riesgo Estadístico Base",
      description: "Margen mínimo de incertidumbre del modelo predictivo",
      weight: 5,
      applied: true,
      category: "baseline"
    }
  ];

  // 1. Regla de Monto (> S/ 200)
  const isHighAmount = numericAmount > 200;
  if (isHighAmount) {
    score += 30;
    factors.push({
      id: "amount",
      name: "Monto Elevado Inusual",
      description: `S/ ${numericAmount.toFixed(2)} excede el límite típico sin confirmación previa (> S/ 200.00)`,
      weight: 30,
      applied: true,
      category: "amount",
      severity: "high"
    });
  } else {
    factors.push({
      id: "amount",
      name: "Monto en Rango Ordinario",
      description: `S/ ${numericAmount.toFixed(2)} dentro del comportamiento habitual (<= S/ 200.00)`,
      weight: 0,
      applied: false,
      category: "amount",
      severity: "low"
    });
  }

  // 2. Regla de Horario (Madrugada 00:00 - 05:00)
  const isNight = isMadrugada(hora);
  if (isNight) {
    score += 35;
    factors.push({
      id: "time",
      name: "Horario Nocturno Atípico",
      description: `Transacción emitida en horario de alto riesgo (${hora})`,
      weight: 35,
      applied: true,
      category: "time",
      severity: "critical"
    });
  } else {
    factors.push({
      id: "time",
      name: "Horario Diurno Convencional",
      description: `Operación realizada en ventana horaria normal (${hora})`,
      weight: 0,
      applied: false,
      category: "time",
      severity: "low"
    });
  }

  // 3. Regla de Contacto Nuevo
  if (esContactoNuevo) {
    score += 15;
    factors.push({
      id: "contact",
      name: "Destinatario No Registrado",
      description: "Primera interacción financiera con esta línea celular",
      weight: 15,
      applied: true,
      category: "contact",
      severity: "medium"
    });
  } else {
    factors.push({
      id: "contact",
      name: "Contacto Frecuente Verificado",
      description: "Destinatario registrado en la red de confianza del usuario",
      weight: 0,
      applied: false,
      category: "contact",
      severity: "low"
    });
  }

  // 4. Regla de Ubicación Inusual / IP
  if (esUbicacionInusual) {
    score += 25;
    factors.push({
      id: "location",
      name: "Geolocalización Inusual / IP Remota",
      description: "Conexión detectada fuera del nodo habitual o mediante proxy/VPN",
      weight: 25,
      applied: true,
      category: "location",
      severity: "high"
    });
  } else {
    factors.push({
      id: "location",
      name: "Geolocalización Habitual",
      description: "Nodo de conexión coincide con el patrón de residencia habitual",
      weight: 0,
      applied: false,
      category: "location",
      severity: "low"
    });
  }

  // Cap score at 100% for display fidelity, though raw score can be tracked
  const normalizedScore = Math.min(score, 100);
  const isBlocked = score >= 70;

  // Anomalías activas para la pantalla de alerta
  const activeAnomalies = factors.filter(f => f.applied && f.id !== "base");

  let riskLevel = "BAJO";
  let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

  if (score >= 70) {
    riskLevel = "CRÍTICO";
    badgeColor = "bg-red-500/10 text-red-600 border-red-500/20";
  } else if (score >= 35) {
    riskLevel = "MEDIO";
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }

  return {
    rawScore: score,
    score: normalizedScore,
    isBlocked,
    riskLevel,
    badgeColor,
    factors,
    activeAnomalies,
    evaluatedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    modelConfidence: "98.7%",
    modelVersion: "GuardianShield-v3.4-Light"
  };
}
