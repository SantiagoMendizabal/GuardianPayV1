from database import engine, Base, SessionLocal
from models import User, Transaction
from sqlalchemy import text

def init_db():
    print("[INFO] Creando tablas en MySQL guardianpay_db...")
    Base.metadata.create_all(bind=engine)
    
    # Migración segura de columnas geográficas (Incremento 3)
    try:
        with engine.connect() as conn:
            # Comprobar columnas existentes en transferencias
            result = conn.execute(text("SHOW COLUMNS FROM transferencias"))
            columns = [row[0] for row in result.fetchall()]
            
            if "latitude" not in columns:
                conn.execute(text("ALTER TABLE transferencias ADD COLUMN latitude FLOAT NULL DEFAULT -16.409047;"))
                print("[INFO] Columna 'latitude' agregada a tabla 'transferencias'.")
            if "longitude" not in columns:
                conn.execute(text("ALTER TABLE transferencias ADD COLUMN longitude FLOAT NULL DEFAULT -71.537451;"))
                print("[INFO] Columna 'longitude' agregada a tabla 'transferencias'.")
            if "ip_address" not in columns:
                conn.execute(text("ALTER TABLE transferencias ADD COLUMN ip_address VARCHAR(45) NULL DEFAULT '127.0.0.1';"))
                print("[INFO] Columna 'ip_address' agregada a tabla 'transferencias'.")
            conn.commit()
    except Exception as col_err:
        print(f"[WARN] Verificación de columnas geográficas en transferencias: {col_err}")
    
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[INFO] Poblando usuarios iniciales de prueba...")
            initial_users = [
                User(
                    dni="72849102",
                    name="Anthony Luque",
                    phone="987654321",
                    birth_date="1999-08-24",
                    email="anthony.luque@guardianpay.pe",
                    pin="123456",
                    balance=1450.0,
                    account_number="193-482910-0-21",
                    avatar="AL"
                ),
                User(
                    dni="71982341",
                    name="Lucía Gómez",
                    phone="981234567",
                    birth_date="2000-03-12",
                    email="lucia.gomez@gmail.com",
                    pin="123456",
                    balance=820.0,
                    account_number="193-774912-0-88",
                    avatar="LG"
                ),
                User(
                    dni="70819234",
                    name="Carlos Mendoza",
                    phone="971889922",
                    birth_date="1998-11-05",
                    email="carlos.mendoza@gmail.com",
                    pin="123456",
                    balance=540.0,
                    account_number="193-559102-0-34",
                    avatar="CM"
                ),
                User(
                    dni="73910284",
                    name="Santiago Mendizabal",
                    phone="993441122",
                    birth_date="1999-01-18",
                    email="santiago.m@guardianpay.pe",
                    pin="123456",
                    balance=2100.0,
                    account_number="193-882190-0-99",
                    avatar="SM"
                ),
                User(
                    dni="40918273",
                    name="María Quispe (Mamá)",
                    phone="976543210",
                    birth_date="1975-06-30",
                    email="maria.quispe@gmail.com",
                    pin="123456",
                    balance=1200.0,
                    account_number="193-339182-0-12",
                    avatar="MQ"
                )
            ]
            db.add_all(initial_users)
            db.commit()
            print("[OK] 5 usuarios iniciales creados exitosamente en MySQL guardianpay_db!")
        else:
            print("[OK] La base de datos ya contiene usuarios.")
    except Exception as e:
        print(f"[ERROR] Error al inicializar DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
