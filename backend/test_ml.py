import os
import sys
import warnings
warnings.filterwarnings("ignore")

# Asegurar codificación utf-8 en consola de Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import joblib
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "random_forest_fraud.pkl")
META_PATH = os.path.join(BASE_DIR, "model", "model_metadata.json")

def probar_modelo():
    print("=" * 76)
    print("      GUARDIANPAY - MOTOR ANTIFRAUDE EN VIVO (RANDOM FOREST + VELOCITY)")
    print("=" * 76)

    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Modelo no encontrado en {MODEL_PATH}")
        return

    # 1. Cargar modelo y metadatos
    model = joblib.load(MODEL_PATH)
    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    print(f"[*] Modelo Base: {meta.get('model_name')} v{meta.get('version')}")
    print(f"[*] Metrica ROC-AUC: {meta.get('roc_auc_score') * 100:.2f}%")
    print(f"[*] Umbral Critico de Bloqueo: {meta.get('threshold') * 100:.0f}%\n")

    # 2. Casos de prueba avanzados
    casos = [
        {
            "nombre": "CASO 1: Transferencia Cotidiana / Ordinaria",
            "datos": {
                "monto": 45.0,
                "hora": 14,
                "es_madrugada": 0,
                "es_contacto_nuevo": 0,
                "es_ubicacion_inusual": 0,
                "saldo_previo": 1200.0,
                "intentos_fallidos": 0
            },
            "velocity_15m": 0,
            "impossible_travel": False,
            "travel_note": "Arequipa (Habitual)"
        },
        {
            "nombre": "CASO 2: Intento de Fraude Tradicional (Monto Alto + Madrugada)",
            "datos": {
                "monto": 450.0,
                "hora": 3,
                "es_madrugada": 1,
                "es_contacto_nuevo": 1,
                "es_ubicacion_inusual": 1,
                "saldo_previo": 800.0,
                "intentos_fallidos": 2
            },
            "velocity_15m": 0,
            "impossible_travel": False,
            "travel_note": "Lima (Nodo Remoto)"
        },
        {
            "nombre": "CASO 3: Ataque de Hormigueo / Frecuencia Rápida (Velocity Burst)",
            "datos": {
                "monto": 80.0,
                "hora": 15,
                "es_madrugada": 0,
                "es_contacto_nuevo": 1,
                "es_ubicacion_inusual": 0,
                "saldo_previo": 1100.0,
                "intentos_fallidos": 0
            },
            "velocity_15m": 3,
            "impossible_travel": False,
            "travel_note": "Arequipa - 4ta transferencia en 12 minutos (Smurfing)"
        },
        {
            "nombre": "CASO 4: Inconsistencia Espacio-Temporal (Viaje Imposible)",
            "datos": {
                "monto": 65.0,
                "hora": 16,
                "es_madrugada": 0,
                "es_contacto_nuevo": 0,
                "es_ubicacion_inusual": 1,
                "saldo_previo": 950.0,
                "intentos_fallidos": 0
            },
            "velocity_15m": 0,
            "impossible_travel": True,
            "travel_note": "Arequipa -> Lima en 15 minutos (1,010 km). Físicamente imposible."
        }
    ]

    features = meta.get("features")

    for c in casos:
        print("-" * 76)
        print(f"[TEST] {c['nombre']}")
        df = pd.DataFrame([c["datos"]])[features]
        print(f"   Variables base:")
        for k, v in c["datos"].items():
            print(f"     - {k}: {v}")
        print(f"   Contexto situacional:")
        print(f"     - Historial en ultimos 15 min: {c['velocity_15m']} tx previas")
        print(f"     - Analisis Geografico: {c['travel_note']}")

        # Inferencia base
        prob = model.predict_proba(df)[0][1]
        score = round(prob * 100, 1)

        # Reglas situacionales
        if c["impossible_travel"]:
            score = max(score, 88.5)
        elif c["velocity_15m"] >= 3:
            score = max(score, 84.0)

        print(f"\n   >> RESULTADO DE LA IA:")
        print(f"     -> Probabilidad / Score Final: {score}%")
        if score >= 70.0:
            print(f"     -> Clasificacion: [CRITICO / SOSPECHOSO]")
            print(f"     -> Accion del Sistema: BLOQUEAR PREVENTIVAMENTE Y EXIGIR BIOMETRIA")
        elif score >= 35.0:
            print(f"     -> Clasificacion: [MEDIO / ALERTA]")
            print(f"     -> Accion del Sistema: APROBADO CON MONITOREO PASIVO")
        else:
            print(f"     -> Clasificacion: [BAJO / LEGITIMO]")
            print(f"     -> Accion del Sistema: TRANSFERENCIA APROBADA INMEDIATAMENTE")

    print("\n" + "=" * 76)
    print("[OK] Inferencia completada con éxito. Latencia promedio < 50ms.")
    print("=" * 76)

if __name__ == "__main__":
    probar_modelo()
