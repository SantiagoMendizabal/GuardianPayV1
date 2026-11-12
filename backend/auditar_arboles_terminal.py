import os
import sys
import json
import warnings
warnings.filterwarnings('ignore')

import joblib
import pandas as pd
from sklearn.tree import export_text

# Configurar consola Windows para caracteres legibles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "random_forest_fraud.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model", "model_metadata.json")

def print_banner():
    print("=" * 75)
    print("    GUARDIANPAY AI - AUDITORIA DE MACHINE LEARNING EN TERMINAL")
    print("         (Scikit-Learn Ensemble: 120 Arboles de Decision)")
    print("=" * 75)

def format_bar(pct, width=28):
    filled = int(round((pct / 100.0) * width))
    bar = "#" * filled + "-" * (width - filled)
    return f"[{bar}] {pct:5.1f}%"

def evaluate_transaction(model, features_list, monto, hora, es_madrugada, es_contacto, es_ubicacion, saldo=1500.0, intentos=0, titulo=""):
    print("\n" + "-" * 75)
    print(f"[*] CASO DE PRUEBA: {titulo}")
    print(f"    Parametros: Monto=S/{monto:.2f} | Hora={hora:02d}:00 | Madrugada={es_madrugada} | ContactoNuevo={es_contacto}")
    print("-" * 75)

    input_df = pd.DataFrame([{
        "monto": float(monto),
        "hora": int(hora),
        "es_madrugada": int(es_madrugada),
        "es_contacto_nuevo": int(es_contacto),
        "es_ubicacion_inusual": int(es_ubicacion),
        "saldo_previo": float(saldo),
        "intentos_fallidos": int(intentos)
    }])[features_list]

    # Inferencia de consenso
    prob_array = model.predict_proba(input_df)[0]
    prob_fraud = float(prob_array[1])
    score = round(prob_fraud * 100, 1)

    # Conteo individual de cada uno de los 120 estimadores
    votes = [int(est.predict(input_df.values)[0]) for est in model.estimators_]
    fraud_votes = sum(votes)
    legit_votes = len(votes) - fraud_votes
    pct_fraud = (fraud_votes / len(votes)) * 100.0
    pct_legit = 100.0 - pct_fraud

    print("  RESULTADO DE LA VOTACION DE LOS 120 ARBOLES:")
    print(f"    [1] Votos de FRAUDE:    {fraud_votes:3d} / 120  {format_bar(pct_fraud)}")
    print(f"    [0] Votos de LEGITIMO:  {legit_votes:3d} / 120  {format_bar(pct_legit)}")
    print(f"\n  FORMULA MATEMATICA: P(Fraude) = {fraud_votes} / 120 = {pct_fraud:.1f}%")

    if score >= 70.0:
        veredicto = "CRITICO -> INTERCEPTADO (DESAFIO BIOMETRICO)"
    elif score >= 35.0:
        veredicto = "MEDIO   -> APROBADO CON ALERTA PREVENTIVA"
    else:
        veredicto = "BAJO    -> APROBADO INMEDIATO (SEGURO)"
    print(f"  VEREDICTO FINAL:    {score}/100 -> {veredicto}")

    # Mostrar la ruta real del Arbol #1 para evidencia
    tree_rules = export_text(model.estimators_[0], feature_names=features_list, max_depth=3)
    first_rules = "\n".join(["      " + line for line in tree_rules.splitlines()[:8]])
    print("\n  EVIDENCIA ESTRUCTURAL: Nodos de Decision del Arbol #1:")
    print(first_rules)
    print("      ...")

def main():
    print_banner()

    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] No se encontro el archivo del modelo en: {MODEL_PATH}")
        input("\nPresiona ENTER para salir...")
        return

    print(f"[*] Cargando modelo binario: {os.path.basename(MODEL_PATH)}...")
    model = joblib.load(MODEL_PATH)
    n_trees = len(model.estimators_)
    print(f"[OK] Modelo Scikit-Learn cargado: {n_trees} Estimadores (Arboles de Decision)")

    features_list = getattr(model, "feature_names_in_", [
        "monto", "hora", "es_madrugada", "es_contacto_nuevo",
        "es_ubicacion_inusual", "saldo_previo", "intentos_fallidos"
    ])
    if hasattr(features_list, "tolist"):
        features_list = features_list.tolist()

    # Cargar metadatos
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        print(f"[OK] Metadatos del Modelo: {meta.get('model_name', 'GuardianShield')} v{meta.get('version', '2.0.0')}")
        print(f"     Algoritmo: {meta.get('algorithm', 'RandomForestClassifier')}")
        print(f"     Metrica AUC-ROC: {meta.get('roc_auc_score', 0.82) * 100:.1f}%")

    # Mostrar Importancia de Variables (Feature Importances)
    print("\n" + "-" * 75)
    print("  IMPORTANCIA DE VARIABLES (Calculada por Scikit-Learn en los 120 Arboles):")
    print("-" * 75)
    for feat, imp in sorted(zip(features_list, model.feature_importances_), key=lambda x: x[1], reverse=True):
        print(f"    • {feat:22s}: {imp * 100:5.1f}%  {format_bar(imp * 100, width=20)}")

    # ---------------------------------------------------------
    # Ejecutar 3 Casos Demostrativos Clave
    # ---------------------------------------------------------
    print("\n" + "=" * 75)
    print("  DEMOSTRACION EN VIVO CON CASOS REALES DE GUARDIANPAY:")
    print("=" * 75)

    # Caso 1: Anthony Luque enviando S/ 150 de dia (Habitual)
    evaluate_transaction(
        model, features_list,
        monto=150.0, hora=14, es_madrugada=0, es_contacto=0, es_ubicacion=0,
        titulo="Anthony Luque enviando S/ 150 (Comportamiento Habitual)"
    )

    # Caso 2: Carlos Mendoza enviando S/ 150 a contacto nuevo
    evaluate_transaction(
        model, features_list,
        monto=150.0, hora=14, es_madrugada=0, es_contacto=1, es_ubicacion=0,
        titulo="Carlos Mendoza enviando S/ 150 a Contacto No Registrado (Anomalo)"
    )

    # Caso 3: Ataque de Madrugada (03:45 AM, contacto nuevo)
    evaluate_transaction(
        model, features_list,
        monto=600.0, hora=3, es_madrugada=1, es_contacto=1, es_ubicacion=1,
        titulo="Ataque Critico de Madrugada (03:45 AM, S/ 600, Contacto Nuevo, IP Foranea)"
    )

    # ---------------------------------------------------------
    # Modo Interactivo para el Profesor
    # ---------------------------------------------------------
    print("\n" + "=" * 75)
    print("  MODO INTERACTIVO: Prueba con cualquier valor frente al profesor")
    print("=" * 75)

    while True:
        resp = input("\n¿Deseas probar una transaccion personalizada? (s/n): ").strip().lower()
        if resp != 's':
            break

        try:
            m_input = float(input("  -> Ingresa el monto en Soles (ej. 250): "))
            h_input = int(input("  -> Ingresa la hora del dia 0-23 (ej. 3 para madrugada, 14 para tarde): "))
            c_input = int(input("  -> ¿Es destinatario nuevo? (1 = Si, 0 = No): "))
            u_input = int(input("  -> ¿Ubicacion inusual o IP extranjera? (1 = Si, 0 = No): "))
            is_night = 1 if 0 <= h_input <= 5 else 0

            evaluate_transaction(
                model, features_list,
                monto=m_input, hora=h_input, es_madrugada=is_night,
                es_contacto=c_input, es_ubicacion=u_input,
                titulo=f"Prueba Personalizada: S/ {m_input:.2f} a las {h_input:02d}:00"
            )
        except Exception as e:
            print(f"  [AVISO] Entrada no valida: {e}")

    print("\n" + "=" * 75)
    print("  [OK] Auditoria de Machine Learning finalizada exitosamente.")
    print("=" * 75)
    try:
        input("\nPresiona ENTER para cerrar la terminal...")
    except Exception:
        pass

if __name__ == "__main__":
    main()
