import os
import hashlib
from datetime import datetime
from database import engine, Base, SessionLocal
from models import User, Transaction, AuditoriaIA, ContactoFrecuente

def hash_pin(pin: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt.encode(), 100000).hex()
    return f"pbkdf2:{salt}:{hashed}"

def seed_database():
    print("[INFO] Creando todas las tablas en MySQL guardianpay_db...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Asegurar usuarios con PINs seguros y saldos equilibrados
        users = db.query(User).all()
        if not users:
            print("[INFO] Creando usuarios base...")
            users_data = [
                {"dni": "72849102", "name": "Anthony Luque", "phone": "987654321", "balance": 1240.0, "avatar": "AL", "acc": "193-482910-0-21"},
                {"dni": "71982341", "name": "Lucía Gómez", "phone": "981234567", "balance": 1015.0, "avatar": "LG", "acc": "193-774912-0-88"},
                {"dni": "70819234", "name": "Carlos Mendoza", "phone": "971889922", "balance": 750.0, "avatar": "CM", "acc": "193-559102-0-34"},
                {"dni": "73910284", "name": "Santiago Mendizabal", "phone": "993441122", "balance": 2100.0, "avatar": "SM", "acc": "193-882190-0-99"},
                {"dni": "40918273", "name": "María Quispe (Mamá)", "phone": "976543210", "balance": 1350.0, "avatar": "MQ", "acc": "193-339182-0-12"}
            ]
            for u in users_data:
                db.add(User(
                    dni=u["dni"],
                    name=u["name"],
                    phone=u["phone"],
                    pin=hash_pin("123456"),
                    balance=u["balance"],
                    account_number=u["acc"],
                    avatar=u["avatar"],
                    birth_date="1999-05-15"
                ))
            db.commit()
            users = db.query(User).all()

        user_map = {u.phone: u for u in users}

        # 2. Poblar Contactos Frecuentes si está vacío
        if db.query(ContactoFrecuente).count() == 0:
            print("[INFO] Creando contactos frecuentes de confianza...")
            contact_relations = [
                # Anthony tiene como frecuentes a Lucía y Carlos
                (user_map["987654321"].id, user_map["981234567"].id, "Lucía Amiga", 8, True),
                (user_map["987654321"].id, user_map["971889922"].id, "Carlos UTEC", 5, True),
                (user_map["987654321"].id, user_map["976543210"].id, "Mamá", 14, True),
                # Carlos tiene como frecuentes a Anthony y María
                (user_map["971889922"].id, user_map["987654321"].id, "Anthony Compañero", 4, True),
                (user_map["971889922"].id, user_map["981234567"].id, "Lucía Gómez", 2, False),
                # Lucía tiene como frecuentes a Anthony y Santiago
                (user_map["981234567"].id, user_map["987654321"].id, "Anthony Luque", 6, True),
                (user_map["981234567"].id, user_map["993441122"].id, "Santiago Profe", 3, False),
            ]
            for u_id, c_id, alias, count, is_fav in contact_relations:
                db.add(ContactoFrecuente(
                    user_id=u_id,
                    contact_user_id=c_id,
                    alias=alias,
                    contador_transferencias=count,
                    es_favorito=is_fav
                ))
            db.commit()
            print("[OK] Tabla 'contactos_frecuentes' poblada.")

        # 3. Poblar transacciones representativas para Carlos, Lucía y Santiago si hay pocas
        if db.query(Transaction).count() <= 6:
            print("[INFO] Creando transacciones de prueba distribuidas entre todos los usuarios...")
            tx_data = [
                # Carlos envía a Anthony
                {"op": "OP-11029384", "sender": "971889922", "rcv": "987654321", "amount": 35.0, "hora": "10:15", "loc": "Arequipa", "freq": True, "score": 2.1, "lvl": "BAJO", "dec": "APROBADO"},
                # Carlos envía a Lucía
                {"op": "OP-22938475", "sender": "971889922", "rcv": "981234567", "amount": 50.0, "hora": "12:40", "loc": "Arequipa", "freq": True, "score": 4.5, "lvl": "BAJO", "dec": "APROBADO"},
                # Lucía envía a Anthony
                {"op": "OP-33847566", "sender": "981234567", "rcv": "987654321", "amount": 80.0, "hora": "15:20", "loc": "Arequipa", "freq": True, "score": 3.8, "lvl": "BAJO", "dec": "APROBADO"},
                # Santiago envía a Carlos
                {"op": "OP-44758697", "sender": "993441122", "rcv": "971889922", "amount": 120.0, "hora": "17:05", "loc": "Lima", "freq": False, "score": 18.4, "lvl": "BAJO", "dec": "APROBADO"},
                # María envía a Anthony
                {"op": "OP-55667788", "sender": "976543210", "rcv": "987654321", "amount": 100.0, "hora": "09:30", "loc": "Arequipa", "freq": True, "score": 1.5, "lvl": "BAJO", "dec": "APROBADO"}
            ]
            for t in tx_data:
                db.add(Transaction(
                    operation_code=t["op"],
                    sender_id=user_map[t["sender"]].id,
                    receiver_id=user_map[t["rcv"]].id,
                    amount=t["amount"],
                    time_str=t["hora"],
                    location_str=t["loc"],
                    is_frequent_contact=t["freq"],
                    risk_score=t["score"],
                    risk_level=t["lvl"],
                    decision=t["dec"],
                    status="COMPLETADO"
                ))
            db.commit()
            print("[OK] Transacciones distribuidas creadas en tabla 'transferencias'.")

        # 4. Poblar auditoría inicial de IA
        if db.query(AuditoriaIA).count() == 0:
            print("[INFO] Poblando registros iniciales de auditoría en 'auditoria_ia'...")
            audit_records = [
                {"user": "987654321", "op": "OP-99056117", "monto": 20.0, "hora": "14:30", "madrugada": 0, "nuevo": 0, "loc_inu": 0, "score": 1.3, "lvl": "BAJO", "dec": "APROBADO", "ms": 41.37},
                {"user": "971889922", "op": "OP-11029384", "monto": 35.0, "hora": "10:15", "madrugada": 0, "nuevo": 0, "loc_inu": 0, "score": 2.1, "lvl": "BAJO", "dec": "APROBADO", "ms": 38.20},
                {"user": "987654321", "op": "OP-SIM-ALERT", "monto": 480.0, "hora": "03:45", "madrugada": 1, "nuevo": 1, "loc_inu": 1, "score": 78.3, "lvl": "CRÍTICO", "dec": "DESAFIO_BIOMETRICO", "ms": 83.46}
            ]
            for a in audit_records:
                db.add(AuditoriaIA(
                    user_id=user_map[a["user"]].id,
                    operation_code=a["op"],
                    monto_evaluado=a["monto"],
                    hora_transaccion=a["hora"],
                    es_madrugada=a["madrugada"],
                    es_contacto_nuevo=a["nuevo"],
                    es_ubicacion_inusual=a["loc_inu"],
                    score_obtenido=a["score"],
                    nivel_riesgo=a["lvl"],
                    decision_ia=a["dec"],
                    tiempo_inferencia_ms=a["ms"]
                ))
            db.commit()
            print("[OK] Registros de auditoría creados en tabla 'auditoria_ia'.")

        print("\n[ÉXITO] Base de datos MySQL guardianpay_db actualizada con las 4 tablas operativas!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error al poblar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
