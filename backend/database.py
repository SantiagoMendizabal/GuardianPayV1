import os
import pymysql
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Cargar variables de entorno desde .env (en backend/ o raíz)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_backend = os.path.join(BASE_DIR, ".env")
env_root = os.path.join(os.path.dirname(BASE_DIR), ".env")

if os.path.exists(env_backend):
    load_dotenv(env_backend)
elif os.path.exists(env_root):
    load_dotenv(env_root)
else:
    load_dotenv()

# 2. Parámetros individuales de conexión MySQL
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin123")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "guardianpay_db")

# 3. URL de conexión construida o personalizada
DEFAULT_DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Si viene de Render / Supabase PostgreSQL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Auto-creación de la base de datos MySQL si no existe en el servidor
def ensure_database_exists():
    """Crea automáticamente la base de datos en MySQL si el usuario no la ha creado."""
    if "mysql" in DATABASE_URL and DB_NAME:
        try:
            # Conexión al servidor MySQL sin seleccionar base de datos
            conn = pymysql.connect(
                host=DB_HOST,
                port=int(DB_PORT),
                user=DB_USER,
                password=DB_PASSWORD,
                charset='utf8mb4'
            )
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.commit()
            conn.close()
            # print(f"[OK] Base de datos '{DB_NAME}' verificada/creada exitosamente en MySQL.")
        except Exception as e:
            print(f"[WARN] No se pudo auto-crear la base de datos '{DB_NAME}' (verifique credenciales): {e}")

ensure_database_exists()

# 5. Configurar motor SQLAlchemy
engine_kwargs = {}
if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Generador de sesión de base de datos para endpoints de FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
