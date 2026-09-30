import os
import json
import re
from datetime import datetime
from typing import Optional, Union, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

import sys
import warnings
warnings.filterwarnings("ignore")

# Configurar stdout para evitar errores de codificación en Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "random_forest_fraud.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model", "model_metadata.json")

# Inicialización de FastAPI
app = FastAPI(
    title="GuardianPay AI - Fraud Detection Microservice",
    description="Microservicio de inferencia predictiva en tiempo real con Random Forest para billeteras digitales (Yape / Plin)",
    version="2.0.0"
)

# Configuración de CORS para aceptar peticiones desde React (Vercel y Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen (Vercel, localhost:3000, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar Modelo y Metadatos en Memoria
rf_model = None
metadata = {}
feature_importances_map = {}

try:
    if os.path.exists(MODEL_PATH):
        rf_model = joblib.load(MODEL_PATH)
        print(f"[OK] Modelo Random Forest cargado exitosamente desde {MODEL_PATH}")
    else:
        print(f"[WARN] No se encontro el modelo en {MODEL_PATH}")

    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        print(f"[OK] Metadatos cargados: {metadata.get('model_name')} v{metadata.get('version')}")
except Exception as e:
    print(f"[ERROR] Error al cargar modelo o metadatos: {e}")

# Mapeo de importancia de características
if rf_model is not None and hasattr(rf_model, "feature_importances_") and "features" in metadata:
    feature_importances_map = dict(zip(metadata["features"], rf_model.feature_importances_))


# ---------------------------------------------------------------------------
# Esquemas Pydantic
# ---------------------------------------------------------------------------
class TransactionRequest(BaseModel):
    monto: float = Field(..., description="Monto en Soles (S/)", example=250.0)
    hora: Union[int, str] = Field(..., description="Hora de la transacción (0-23 o string '03:45')", example="03:45")
    es_madrugada: Optional[int] = Field(None, description="1 si es madrugada (00:00-05:59), 0 si no", example=1)
    es_contacto_nuevo: Optional[int] = Field(0, description="1 si es contacto no frecuente, 0 si registrado", example=1)
    es_ubicacion_inusual: Optional[int] = Field(0, description="1 si la IP o ubicación es anómala, 0 habitual", example=1)
    saldo_previo: Optional[float] = Field(1500.0, description="Saldo disponible antes de transferir", example=1800.0)
    intentos_fallidos: Optional[int] = Field(0, description="Intentos de PIN erróneos", example=0)


class FactorItem(BaseModel):
    id: str
    name: str
    description: str
    weight: float
    applied: bool
    category: str
    severity: str


class PredictionResponse(BaseModel):
    rawScore: float
    score: float
    isBlocked: bool
    riskLevel: str
    decision: str
    badgeColor: str
    factors: List[FactorItem]
    activeAnomalies: List[FactorItem]
    evaluatedAt: str
    modelConfidence: str
    modelVersion: str
    executionTimeMs: float


# Memoria para auditoría de transacciones (Sprint 4: GP-403)
AUDIT_LOGS = []


# ---------------------------------------------------------------------------
# Funciones Auxiliares
# ---------------------------------------------------------------------------
def parse_hour(hora_val: Union[int, str]) -> int:
    """Extrae la hora entera (0 a 23) a partir de un entero o string."""
    if isinstance(hora_val, int):
        return max(0, min(23, hora_val))
    if isinstance(hora_val, str):
        match = re.search(r"(\d{1,2}):?", hora_val)
        if match:
            h = int(match.group(1))
            return max(0, min(23, h))
    return 14  # Default tarde diurna


# ---------------------------------------------------------------------------
# Endpoints de la API
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "GuardianPay AI Microservice",
        "status": "online",
        "framework": "FastAPI",
        "model_loaded": rf_model is not None,
        "docs_url": "/docs"
    }


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """HealthCheck para Render y monitoreo continuo."""
    return {
        "status": "healthy" if rf_model is not None else "degraded",
        "model_version": metadata.get("version", "2.0.0"),
        "roc_auc_score": metadata.get("roc_auc_score", 0.82),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_fraud(tx: TransactionRequest):
    """
    Endpoint principal de inferencia en tiempo real.
    Ejecuta el Random Forest (120 árboles) y retorna probabilidad y explicabilidad XAI.
    """
    start_time = datetime.now()

    if rf_model is None:
        raise HTTPException(
            status_code=503,
            detail="El modelo Random Forest no está cargado en el servidor."
        )

    # 1. Normalización de variables
    hour_int = parse_hour(tx.hora)
    es_madrugada = tx.es_madrugada
    if es_madrugada is None:
        es_madrugada = 1 if (0 <= hour_int <= 5) else 0

    es_contacto = 1 if int(tx.es_contacto_nuevo or 0) == 1 else 0
    es_ubicacion = 1 if int(tx.es_ubicacion_inusual or 0) == 1 else 0
    monto_val = float(tx.monto)
    saldo_val = float(tx.saldo_previo or 1500.0)
    intentos_val = int(tx.intentos_fallidos or 0)

    # 2. Construir DataFrame alineado al orden estricto de entrenamiento
    features_list = metadata.get("features", [
        "monto", "hora", "es_madrugada", "es_contacto_nuevo",
        "es_ubicacion_inusual", "saldo_previo", "intentos_fallidos"
    ])

    input_data = pd.DataFrame([{
        "monto": monto_val,
        "hora": hour_int,
        "es_madrugada": es_madrugada,
        "es_contacto_nuevo": es_contacto,
        "es_ubicacion_inusual": es_ubicacion,
        "saldo_previo": saldo_val,
        "intentos_fallidos": intentos_val
    }])[features_list]

    # 3. Inferencia probabilística con Random Forest
    try:
        # predict_proba retorna [[prob_clase_0, prob_clase_1]]
        prob_array = rf_model.predict_proba(input_data)[0]
        prob_fraud = float(prob_array[1])  # Probabilidad de fraude
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error en inferencia del modelo: {err}")

    # 4. Cálculo del Risk Score normalizado (0 a 100%)
    score = round(prob_fraud * 100, 1)
    is_blocked = score >= 70.0

    # 5. Determinación de Nivel de Riesgo y Decisión
    if score >= 70.0:
        risk_level = "CRÍTICO"
        decision = "DESAFIO_BIOMETRICO"
        badge_color = "bg-red-500/10 text-red-600 border-red-500/20"
    elif score >= 35.0:
        risk_level = "MEDIO"
        decision = "APROBADO_CON_ALERTA"
        badge_color = "bg-amber-500/10 text-amber-600 border-amber-500/20"
    else:
        risk_level = "BAJO"
        decision = "APROBADO"
        badge_color = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

    # 6. Explicabilidad Algorítmica (XAI - Factores de Riesgo)
    monto_imp = round(feature_importances_map.get("monto", 0.35) * 100, 1)
    madrugada_imp = round(feature_importances_map.get("es_madrugada", 0.30) * 100, 1)
    contacto_imp = round(feature_importances_map.get("es_contacto_nuevo", 0.20) * 100, 1)
    ubicacion_imp = round(feature_importances_map.get("es_ubicacion_inusual", 0.15) * 100, 1)

    factors = [
        FactorItem(
            id="base",
            name="Riesgo Estadístico Base",
            description="Margen mínimo de incertidumbre del modelo predictivo",
            weight=5.0,
            applied=True,
            category="baseline",
            severity="low"
        ),
        FactorItem(
            id="amount",
            name="Monto Elevado Inusual" if monto_val > 200 else "Monto en Rango Ordinario",
            description=f"S/ {monto_val:.2f} excede el límite típico sin confirmación previa (> S/ 200.00)" if monto_val > 200 else f"S/ {monto_val:.2f} dentro del comportamiento habitual",
            weight=monto_imp if monto_val > 200 else 0.0,
            applied=monto_val > 200,
            category="amount",
            severity="high" if monto_val > 200 else "low"
        ),
        FactorItem(
            id="time",
            name="Horario Nocturno Atípico" if es_madrugada == 1 else "Horario Diurno Convencional",
            description=f"Transacción emitida en horario de alto riesgo ({hour_int:02d}:00)" if es_madrugada == 1 else f"Operación en ventana diurna habitual ({hour_int:02d}:00)",
            weight=madrugada_imp if es_madrugada == 1 else 0.0,
            applied=es_madrugada == 1,
            category="time",
            severity="critical" if es_madrugada == 1 else "low"
        ),
        FactorItem(
            id="contact",
            name="Destinatario No Registrado" if es_contacto == 1 else "Contacto Frecuente Verificado",
            description="Primera interacción financiera con esta línea celular" if es_contacto == 1 else "Destinatario registrado en la red de confianza del usuario",
            weight=contacto_imp if es_contacto == 1 else 0.0,
            applied=es_contacto == 1,
            category="contact",
            severity="medium" if es_contacto == 1 else "low"
        ),
        FactorItem(
            id="location",
            name="Geolocalización Inusual / IP Remota" if es_ubicacion == 1 else "Geolocalización Habitual",
            description="Conexión detectada fuera del nodo habitual o mediante proxy/VPN" if es_ubicacion == 1 else "Nodo de conexión coincide con el patrón de residencia habitual",
            weight=ubicacion_imp if es_ubicacion == 1 else 0.0,
            applied=es_ubicacion == 1,
            category="location",
            severity="high" if es_ubicacion == 1 else "low"
        )
    ]

    active_anomalies = [f for f in factors if f.applied and f.id != "base"]
    elapsed_ms = round((datetime.now() - start_time).total_seconds() * 1000, 2)

    # 7. Registrar en auditoría (Sprint 4: GP-403)
    audit_entry = {
        "id": len(AUDIT_LOGS) + 1,
        "timestamp": datetime.now().isoformat(),
        "monto": monto_val,
        "score": score,
        "risk_level": risk_level,
        "is_blocked": is_blocked,
        "decision": decision
    }
    AUDIT_LOGS.append(audit_entry)

    return PredictionResponse(
        rawScore=score,
        score=score,
        isBlocked=is_blocked,
        riskLevel=risk_level,
        decision=decision,
        badgeColor=badge_color,
        factors=factors,
        activeAnomalies=active_anomalies,
        evaluatedAt=datetime.now().strftime("%I:%M:%S %p"),
        modelConfidence=f"{round(metadata.get('roc_auc_score', 0.82) * 100, 1)}%",
        modelVersion=f"GuardianShield-v{metadata.get('version', '2.0.0')}-RF",
        executionTimeMs=elapsed_ms
    )


@app.get("/api/v1/audit")
def get_audit_logs():
    """Retorna los últimos registros auditados para el Inspector de IA."""
    return {
        "total_records": len(AUDIT_LOGS),
        "logs": AUDIT_LOGS[-50:]  # Últimos 50 logs
    }
