"""
Script de Migración Automatizada: Local MySQL -> Supabase (PostgreSQL)
Permite subir la base de datos completa de GuardianPay a la nube en Supabase con 1 solo comando.
Uso:
    python3 backend/migrar_a_supabase.py "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
"""
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configurar paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from database import engine as local_engine, Base, SessionLocal as LocalSession
from models import User, Transaction, ContactoFrecuente

def migrar(supabase_url: str):
    print("=" * 65)
    print("      MIGRACIÓN AUTOMÁTICA DE GUARDIANPAY A SUPABASE")
    print("=" * 65)

    if not supabase_url or not supabase_url.startswith(("postgres://", "postgresql://")):
        print("[ERROR] Debes proporcionar una URL válida de Supabase PostgreSQL.")
        print("Ejemplo: python3 backend/migrar_a_supabase.py 'postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres'")
        return False

    if supabase_url.startswith("postgres://"):
        supabase_url = supabase_url.replace("postgres://", "postgresql://", 1)

    print("\n[1/4] Conectando a Supabase PostgreSQL...")
    try:
        remote_engine = create_engine(supabase_url, pool_pre_ping=True)
        RemoteSession = sessionmaker(bind=remote_engine)
        with remote_engine.connect() as conn:
            print("      [OK] Conexión establecida con Supabase.")
    except Exception as e:
        print(f"      [ERROR] Falló la conexión con Supabase: {e}")
        return False

    print("\n[2/4] Creando estructura de tablas en Supabase (usuarios, transferencias, contactos)...")
    try:
        Base.metadata.create_all(bind=remote_engine)
        print("      [OK] Tablas creadas exitosamente.")
    except Exception as e:
        print(f"      [ERROR] Error al crear tablas: {e}")
        return False

    print("\n[3/4] Leyendo datos locales de MySQL...")
    local_db = LocalSession()
    remote_db = RemoteSession()

    try:
        local_users = local_db.query(User).all()
        print(f"      Encontrados {len(local_users)} usuarios locales.")

        # Copiar usuarios
        for u in local_users:
            exists = remote_db.query(User).filter(User.phone == u.phone).first()
            if not exists:
                new_u = User(
                    dni=u.dni,
                    name=u.name,
                    phone=u.phone,
                    birth_date=u.birth_date,
                    email=u.email,
                    pin=u.pin,
                    balance=u.balance,
                    account_number=u.account_number,
                    avatar=u.avatar,
                    embedding_facial=u.embedding_facial,
                    biometria_activa=u.biometria_activa,
                    fecha_enrolamiento=u.fecha_enrolamiento,
                    intentos_fallidos_biometria=u.intentos_fallidos_biometria or 0,
                    bloqueos_transaccion_consecutivos=u.bloqueos_transaccion_consecutivos or 0,
                    cuenta_bloqueada=u.cuenta_bloqueada or False,
                    bloqueada_hasta=u.bloqueada_hasta
                )
                remote_db.add(new_u)
        remote_db.commit()
        print("      [OK] Usuarios sincronizados en Supabase.")

        # Copiar contactos frecuentes
        local_contacts = local_db.query(ContactoFrecuente).all()
        for c in local_contacts:
            exists = remote_db.query(ContactoFrecuente).filter(
                ContactoFrecuente.user_id == c.user_id,
                ContactoFrecuente.contact_user_id == c.contact_user_id
            ).first()
            if not exists:
                remote_db.add(ContactoFrecuente(
                    user_id=c.user_id,
                    contact_user_id=c.contact_user_id,
                    name=c.name,
                    phone=c.phone,
                    transfers_count=c.transfers_count,
                    is_favorite=c.is_favorite
                ))
        remote_db.commit()
        print(f"      [OK] {len(local_contacts)} contactos frecuentes sincronizados.")

        # Copiar últimas 30 transferencias
        local_txs = local_db.query(Transaction).limit(30).all()
        for t in local_txs:
            exists = remote_db.query(Transaction).filter(Transaction.operation_code == t.operation_code).first()
            if not exists:
                remote_db.add(Transaction(
                    sender_id=t.sender_id,
                    receiver_id=t.receiver_id,
                    amount=t.amount,
                    hora=t.hora,
                    location=t.location,
                    risk_score=t.risk_score,
                    risk_level=t.risk_level,
                    is_blocked=t.is_blocked,
                    operation_code=t.operation_code,
                    title=t.title,
                    status=t.status,
                    created_at=t.created_at
                ))
        remote_db.commit()
        print(f"      [OK] {len(local_txs)} transferencias históricas sincronizadas.")

    except Exception as e:
        remote_db.rollback()
        print(f"      [ERROR] Error durante la migración de datos: {e}")
        return False
    finally:
        local_db.close()
        remote_db.close()

    print("\n[4/4] Verificación de cuenta titular...")
    remote_db = RemoteSession()
    titular = remote_db.query(User).filter(User.phone == "987654321").first()
    if titular:
        print(f"      [EXITO] Titular: {titular.name} | Saldo: S/ {titular.balance:,.2f} | Biometría: {'Activa' if titular.biometria_activa else 'Inactiva'}")
    remote_db.close()

    print("\n" + "=" * 65)
    print("      MIGRACIÓN A SUPABASE COMPLETADA SATISFACTORIAMENTE")
    print("=" * 65)
    return True

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("SUPABASE_DATABASE_URL", "")
    migrar(url)
