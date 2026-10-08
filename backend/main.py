import os
import json
import re
import random
from datetime import datetime
from typing import Optional, Union, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
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

# Importar configuración de Base de Datos y Modelos
from database import engine, Base, SessionLocal, get_db
from models import User, Transaction, AuditoriaIA, ContactoFrecuente, Usuario, Transferencia
from init_db import init_db
import hashlib

def hash_pin(pin: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt.encode(), 100000).hex()
    return f"pbkdf2:{salt}:{hashed}"

def verify_pin(plain_pin: str, stored_pin: str) -> bool:
    if not stored_pin.startswith("pbkdf2:"):
        return plain_pin == stored_pin
    try:
        _, salt, hashed = stored_pin.split(":")
        calc = hashlib.pbkdf2_hmac('sha256', plain_pin.encode(), salt.encode(), 100000).hex()
        return calc == hashed
    except Exception:
        return False

# Inicializar tablas y usuarios si no existen
try:
    init_db()
except Exception as err:
    print(f"[WARN] Error inicializando DB: {err}")

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "random_forest_fraud.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model", "model_metadata.json")

# Inicialización de FastAPI
app = FastAPI(
    title="GuardianPay AI - Core Banking & Fraud Detection Microservice",
    description="Microservicio bancario transaccional con inferencia predictiva en tiempo real con Random Forest y persistencia en MySQL.",
    version="3.0.0"
)

# Configuración de CORS para aceptar peticiones desde React (Vercel y Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


class RegisterRequest(BaseModel):
    dni: str = Field(..., min_length=8, max_length=8, description="DNI peruano de 8 dígitos", example="72849102")
    name: str = Field(..., min_length=3, description="Nombre completo", example="Anthony Luque")
    phone: str = Field(..., min_length=9, max_length=9, description="Teléfono celular de 9 dígitos", example="987654321")
    pin: str = Field("123456", min_length=6, max_length=6, description="PIN numérico de 6 dígitos")
    birth_date: Optional[str] = Field("1999-05-15", description="Fecha de nacimiento AAAA-MM-DD")
    email: Optional[str] = Field(None, description="Correo electrónico")
    initial_balance: Optional[float] = Field(500.0, description="Saldo inicial promocional")


class LoginRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=9, example="987654321")
    pin: str = Field("123456", min_length=6, max_length=6, example="123456")


class TransferExecutionRequest(BaseModel):
    sender_phone: str = Field(..., example="987654321")
    recipient_phone: str = Field(..., example="981234567")
    amount: float = Field(..., gt=0, example=50.0)
    hora: str = Field("14:30", example="14:30")
    location: str = Field("Arequipa", example="Arequipa")
    force_approve: Optional[bool] = Field(False, description="Aprobación forzada tras escaneo biométrico exitoso")


# ---------------------------------------------------------------------------
# Funciones Auxiliares de Inferencia
# ---------------------------------------------------------------------------
def parse_hour(hora_val: Union[int, str]) -> int:
    if isinstance(hora_val, int):
        return max(0, min(23, hora_val))
    if isinstance(hora_val, str):
        match = re.search(r"(\d{1,2}):?", hora_val)
        if match:
            h = int(match.group(1))
            return max(0, min(23, h))
    return 14


def compute_ai_risk(
    monto_val: float,
    hour_int: int,
    es_madrugada: int,
    es_contacto: int,
    es_ubicacion: int,
    saldo_val: float = 1500.0,
    intentos_val: int = 0
) -> PredictionResponse:
    start_time = datetime.now()

    if rf_model is None:
        raise HTTPException(status_code=503, detail="Modelo Random Forest no cargado.")

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

    prob_array = rf_model.predict_proba(input_data)[0]
    prob_fraud = float(prob_array[1])

    score = round(prob_fraud * 100, 1)
    is_blocked = score >= 70.0

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

    # Registro en consola para verificación en vivo
    print(f"\n" + "="*60)
    print(f"🤖 [GUARDIANPAY AI] Inferencia Random Forest en Tiempo Real")
    print(f"   • Parámetros: Monto=S/{monto_val:.2f} | Hora={hour_int:02d}:00 | Madrugada={es_madrugada}")
    print(f"   • Contexto: ContactoNuevo={es_contacto} | UbicacionInusual={es_ubicacion}")
    print(f"   • Resultado ML: Probabilidad={prob_fraud:.4f} -> Score={score}/100")
    print(f"   • Veredicto: {risk_level} ({decision}) | Inferencia en {elapsed_ms} ms")
    print("="*60 + "\n")

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


# ---------------------------------------------------------------------------
# Endpoints de Salud y Metadatos
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "service": "GuardianPay AI Banking Microservice",
        "status": "online",
        "database": "MySQL (guardianpay_db)",
        "model_loaded": rf_model is not None,
        "docs_url": "/docs"
    }


@app.get("/health")
@app.get("/api/v1/health")
def health_check(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    tx_count = db.query(Transaction).count()
    return {
        "status": "healthy" if rf_model is not None else "degraded",
        "database": "connected",
        "total_users": user_count,
        "total_transactions": tx_count,
        "model_version": metadata.get("version", "2.0.0"),
        "roc_auc_score": metadata.get("roc_auc_score", 0.82),
        "timestamp": datetime.now().isoformat()
    }


# ---------------------------------------------------------------------------
# Endpoints de Autenticación y Usuarios (MySQL)
# ---------------------------------------------------------------------------
@app.post("/api/v1/auth/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión validando credenciales contra MySQL de forma segura."""
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado con ese teléfono.")
    if not verify_pin(payload.pin, user.pin):
        raise HTTPException(status_code=401, detail="PIN de seguridad incorrecto.")

    # Si el PIN estaba en texto plano, auto-migrarlo a PBKDF2 hash seguro
    if not user.pin.startswith("pbkdf2:"):
        user.pin = hash_pin(payload.pin)
        db.commit()

    # Obtener historial de transacciones (enviadas o recibidas) con signo según corresponda
    txs = db.query(Transaction).filter(
        (Transaction.sender_id == user.id) | (Transaction.receiver_id == user.id)
    ).order_by(Transaction.id.desc()).limit(20).all()

    # Obtener contactos frecuentes del usuario
    contacts = db.query(ContactoFrecuente).filter(ContactoFrecuente.user_id == user.id).all()

    return {
        "success": True,
        "user": user.to_dict(),
        "transactions": [t.to_dict(current_user_id=user.id) for t in txs],
        "frequent_contacts": [c.to_dict() for c in contacts]
    }


@app.post("/api/v1/auth/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Registra un nuevo usuario en MySQL con PIN cifrado."""
    # Verificar unicidad de DNI y teléfono
    if db.query(User).filter(User.dni == payload.dni).first():
        raise HTTPException(status_code=400, detail="Este DNI ya está registrado en GuardianPay.")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Este teléfono ya tiene una cuenta activa.")

    # Generar número de cuenta aleatorio
    account_num = f"193-{random.randint(100000, 999999)}-0-{random.randint(10, 99)}"
    
    # Iniciales para avatar
    parts = payload.name.strip().split()
    avatar = (parts[0][0] + (parts[1][0] if len(parts) > 1 else parts[0][1])).upper()

    new_user = User(
        dni=payload.dni,
        name=payload.name,
        phone=payload.phone,
        pin=hash_pin(payload.pin),
        birth_date=payload.birth_date,
        email=payload.email,
        balance=payload.initial_balance or 500.0,
        account_number=account_num,
        avatar=avatar
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Usuario registrado exitosamente.",
        "user": new_user.to_dict()
    }


@app.get("/api/v1/users/lookup")
@app.get("/api/v1/usuarios/lookup")
def lookup_recipient(phone: str = Query(..., min_length=9, max_length=9), db: Session = Depends(get_db)):
    """
    Búsqueda en tiempo real del titular por número de teléfono (estilo Yape).
    Si no existe en la base de datos, impide la transferencia.
    """
    recipient = db.query(User).filter(User.phone == phone.strip()).first()
    if not recipient:
        return {
            "exists": False,
            "message": "Destinatario no registrado en GuardianPay"
        }
    
    # Enmascarar DNI para privacidad
    masked_dni = f"{recipient.dni[:2]}***{recipient.dni[-2:]}" if len(recipient.dni) == 8 else recipient.dni

    return {
        "exists": True,
        "user": {
            "id": recipient.id,
            "name": recipient.name,
            "phone": recipient.phone,
            "dni": masked_dni,
            "avatar": recipient.avatar
        }
    }


# ---------------------------------------------------------------------------
# Endpoints de Transferencia y Machine Learning
# ---------------------------------------------------------------------------
@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_fraud_endpoint(tx: TransactionRequest):
    """Endpoint directo de inferencia predictiva independiente."""
    hour_int = parse_hour(tx.hora)
    es_madrugada = tx.es_madrugada if tx.es_madrugada is not None else (1 if 0 <= hour_int <= 5 else 0)
    
    return compute_ai_risk(
        monto_val=float(tx.monto),
        hour_int=hour_int,
        es_madrugada=es_madrugada,
        es_contacto=1 if int(tx.es_contacto_nuevo or 0) == 1 else 0,
        es_ubicacion=1 if int(tx.es_ubicacion_inusual or 0) == 1 else 0,
        saldo_val=float(tx.saldo_previo or 1500.0),
        intentos_val=int(tx.intentos_fallidos or 0)
    )


@app.post("/api/v1/transfer")
@app.post("/api/v1/transferir")
@app.post("/api/v1/transferencias")
def execute_transfer(payload: TransferExecutionRequest, db: Session = Depends(get_db)):
    """
    Transferencia bancaria atómica entre dos usuarios registrados en MySQL.
    1. Verifica existencia de emisor y receptor en MySQL.
    2. Consulta historial transaccional en la DB para determinar si es contacto frecuente.
    3. Evalúa el riesgo con el modelo Random Forest.
    4. Si hay riesgo crítico (>= 70%) y no se forzó aprobación, interrumpe y exige biometría.
    5. Si se aprueba, descuenta saldo del emisor y abona al receptor atómicamente en MySQL.
    """
    # 1. Buscar emisor
    sender = db.query(User).filter(User.phone == payload.sender_phone.strip()).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Cuenta emisora no encontrada.")

    # 2. Buscar receptor
    recipient = db.query(User).filter(User.phone == payload.recipient_phone.strip()).first()
    if not recipient:
        raise HTTPException(
            status_code=400,
            detail="El número de destino no está registrado en GuardianPay. No se puede transferir dinero a cuentas inexistentes."
        )

    if sender.id == recipient.id:
        raise HTTPException(status_code=400, detail="No puedes transferirte dinero a ti mismo.")

    # 3. Validar saldo suficiente
    if sender.balance < payload.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente. Saldo disponible: S/ {sender.balance:.2f}"
        )

    # 4. Consultar historial de transferencias y contactos frecuentes en MySQL
    previous_transfers_count = db.query(Transaction).filter(
        Transaction.sender_id == sender.id,
        Transaction.receiver_id == recipient.id,
        Transaction.status == "COMPLETADO"
    ).count()

    has_frequent_link = db.query(ContactoFrecuente).filter(
        ContactoFrecuente.user_id == sender.id,
        ContactoFrecuente.contact_user_id == recipient.id
    ).first()

    is_frequent = (previous_transfers_count >= 1) or (has_frequent_link is not None)
    hour_int = parse_hour(payload.hora)
    es_madrugada = 1 if (0 <= hour_int <= 5) else 0
    es_ubicacion = 1 if ("Inusual" in payload.location or "Extranjera" in payload.location) else 0

    # 5. Evaluación matemática con Random Forest
    risk_eval = compute_ai_risk(
        monto_val=payload.amount,
        hour_int=hour_int,
        es_madrugada=es_madrugada,
        es_contacto=0 if is_frequent else 1,
        es_ubicacion=es_ubicacion,
        saldo_val=sender.balance,
        intentos_val=0
    )

    # 6. Intercepción por fraude si es crítico y no viene con validación biométrica forzada
    if risk_eval.isBlocked and not payload.force_approve:
        # Registrar auditoría de bloqueo en MySQL
        try:
            blocked_audit = AuditoriaIA(
                user_id=sender.id,
                operation_code="BLOQUEADO-BIOMETRIA",
                monto_evaluado=payload.amount,
                hora_transaccion=payload.hora,
                es_madrugada=es_madrugada,
                es_contacto_nuevo=0 if is_frequent else 1,
                es_ubicacion_inusual=es_ubicacion,
                score_obtenido=risk_eval.score,
                nivel_riesgo=risk_eval.riskLevel,
                decision_ia=risk_eval.decision,
                tiempo_inferencia_ms=risk_eval.executionTimeMs
            )
            db.add(blocked_audit)
            db.commit()
        except Exception:
            db.rollback()

        return {
            "success": False,
            "is_blocked": True,
            "decision": "DESAFIO_BIOMETRICO",
            "message": "Operación interceptada por sospecha de fraude bancario.",
            "risk_result": risk_eval.dict(),
            "recipient": {
                "name": recipient.name,
                "phone": recipient.phone
            }
        }

    # 7. Ejecutar transferencia atómica en MySQL (Débito y Crédito)
    try:
        sender.balance -= payload.amount
        recipient.balance += payload.amount

        random_code = f"OP-{random.randint(10000000, 99999999)}"
        new_tx = Transaction(
            operation_code=random_code,
            sender_id=sender.id,
            receiver_id=recipient.id,
            amount=payload.amount,
            time_str=payload.hora,
            location_str=payload.location,
            is_frequent_contact=is_frequent,
            risk_score=risk_eval.score,
            risk_level=risk_eval.riskLevel,
            decision=risk_eval.decision,
            status="COMPLETADO"
        )

        db.add(new_tx)

        # 8. Registrar en tabla 'auditoria_ia'
        audit_entry = AuditoriaIA(
            user_id=sender.id,
            operation_code=random_code,
            monto_evaluado=payload.amount,
            hora_transaccion=payload.hora,
            es_madrugada=es_madrugada,
            es_contacto_nuevo=0 if is_frequent else 1,
            es_ubicacion_inusual=es_ubicacion,
            score_obtenido=risk_eval.score,
            nivel_riesgo=risk_eval.riskLevel,
            decision_ia=risk_eval.decision,
            tiempo_inferencia_ms=risk_eval.executionTimeMs
        )
        db.add(audit_entry)

        # 9. Actualizar o insertar en tabla 'contactos_frecuentes'
        cf = db.query(ContactoFrecuente).filter(
            ContactoFrecuente.user_id == sender.id,
            ContactoFrecuente.contact_user_id == recipient.id
        ).first()
        if cf:
            cf.contador_transferencias += 1
        else:
            db.add(ContactoFrecuente(
                user_id=sender.id,
                contact_user_id=recipient.id,
                alias=recipient.name,
                contador_transferencias=1,
                es_favorito=False
            ))

        db.commit()
        db.refresh(new_tx)
        db.refresh(sender)

        print(f"🏦 [MYSQL TRANSACTION] {random_code} registrada exitosamente en tabla 'transferencias':")
        print(f"   • Emisor: {sender.name} ({sender.phone}) | Nuevo saldo: S/ {sender.balance:.2f}")
        print(f"   • Receptor: {recipient.name} ({recipient.phone}) | Nuevo saldo: S/ {recipient.balance:.2f}")
        print(f"   • Registrado en 'auditoria_ia' y 'contactos_frecuentes' | Score: {risk_eval.score}/100\n")

        return {
            "success": True,
            "is_blocked": False,
            "message": "Transferencia realizada con éxito.",
            "transaction": new_tx.to_dict(current_user_id=sender.id),
            "sender_new_balance": round(sender.balance, 2),
            "risk_result": risk_eval.dict()
        }
    except Exception as err:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo procesar la transacción. Intente nuevamente.")


# ---------------------------------------------------------------------------
# Endpoints de Auditoría IA y Contactos Frecuentes (MySQL)
# ---------------------------------------------------------------------------
@app.get("/api/v1/auditoria")
def get_audit_logs(limit: int = 15, db: Session = Depends(get_db)):
    """Retorna los registros de auditoría de inferencia del modelo de Machine Learning."""
    logs = db.query(AuditoriaIA).order_by(AuditoriaIA.id.desc()).limit(limit).all()
    return {
        "total": len(logs),
        "logs": [l.to_dict() for l in logs]
    }


@app.get("/api/v1/contactos")
def get_user_contacts(phone: str, db: Session = Depends(get_db)):
    """Retorna la lista de contactos frecuentes para un usuario dado."""
    user = db.query(User).filter(User.phone == phone.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    contacts = db.query(ContactoFrecuente).filter(ContactoFrecuente.user_id == user.id).all()
    return {
        "user": user.name,
        "contacts": [c.to_dict() for c in contacts]
    }
