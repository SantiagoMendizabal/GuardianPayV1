import sys
import os
import json
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from database import SessionLocal
from main import (
    EnrollBiometricsRequest, 
    VerifyBiometricsRequest, 
    enroll_facial_biometrics, 
    verify_facial_biometrics, 
    get_biometric_status
)

def test_biometric_flow_direct():
    print("=" * 70)
    print("  TEST AUTOMATIZADO DE BIOMETRÍA FACIAL 3D (GOOGLE MEDIAPIPE EMBEDDINGS)")
    print("=" * 70)

    db = SessionLocal()
    test_phone = "987654321"  # Anthony Luque (Usuario demo)

    try:
        # 1. Generar vector base representativo de 128 dimensiones (normalizado)
        np.random.seed(42)
        base_vector = np.random.randn(128)
        base_vector = base_vector / np.linalg.norm(base_vector)  # Vector unitario L2
        base_list = [float(x) for x in base_vector]

        # 2. Enrolar rostro en MySQL
        print("\n[*] 1. Probando función de Enrolamiento (enroll_facial_biometrics)...")
        enroll_payload = EnrollBiometricsRequest(
            phone=test_phone,
            embedding=base_list,
            source="GOOGLE_MEDIAPIPE_3D_TEST"
        )
        res_enroll = enroll_facial_biometrics(enroll_payload, db=db)
        print(f"    Respuesta: {res_enroll}")
        assert res_enroll["success"] is True
        assert res_enroll["dimensions"] == 128

        # 3. Consultar estado en MySQL
        print("\n[*] 2. Consultando estado biométrico en MySQL (get_biometric_status)...")
        res_status = get_biometric_status(phone=test_phone, db=db)
        print(f"    Respuesta: {res_status}")
        assert res_status["has_biometrics"] is True

        # 4. Probar verificación con el rostro legítimo (con leve variación natural de luz/ángulo)
        print("\n[*] 3. Probando verificación legítima (mismo usuario con ruido natural de cámara)...")
        noise = np.random.normal(0, 0.05, 128)
        live_legit = base_vector + noise
        live_legit = live_legit / np.linalg.norm(live_legit)
        
        verify_payload_legit = VerifyBiometricsRequest(
            phone=test_phone,
            embedding=[float(x) for x in live_legit],
            threshold=0.85
        )
        res_verify = verify_facial_biometrics(verify_payload_legit, db=db)
        print(f"    Similitud calculada: {res_verify['similarity_pct']}% | Umbral: {res_verify['threshold']}%")
        print(f"    Resultado: {'APROBADO' if res_verify['verified'] else 'RECHAZADO'} | Calidad: {res_verify['match_quality']}")
        assert res_verify["verified"] is True
        assert res_verify["similarity_pct"] >= 85.0

        # 5. Probar verificación con un impostor (rostro ajeno completamente diferente)
        print("\n[*] 4. Probando verificación con IMPOSTOR (vector facial ajeno)...")
        impostor_vector = np.random.randn(128)
        impostor_vector = impostor_vector / np.linalg.norm(impostor_vector)

        verify_payload_impostor = VerifyBiometricsRequest(
            phone=test_phone,
            embedding=[float(x) for x in impostor_vector],
            threshold=0.85
        )
        res_impostor = verify_facial_biometrics(verify_payload_impostor, db=db)
        print(f"    Similitud calculada: {res_impostor['similarity_pct']}% | Umbral: {res_impostor['threshold']}%")
        print(f"    Resultado: {'APROBADO' if res_impostor['verified'] else 'RECHAZADO'} | Calidad: {res_impostor['match_quality']}")
        assert res_impostor["verified"] is False
        assert res_impostor["match_quality"] == "RECHAZADA_NO_COINCIDE"

        print("\n" + "=" * 70)
        print("  [ÉXITO TOTAL] TODOS LOS TESTS PASARON CON 100% DE EFECTIVIDAD")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    test_biometric_flow_direct()
