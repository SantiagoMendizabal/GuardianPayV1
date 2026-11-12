import os
import sys
import pymysql

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

sys.path.append(BACKEND_DIR)
from database import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME

def update_env_password(new_pass):
    env_file = os.path.join(BACKEND_DIR, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        with open(env_file, "w", encoding="utf-8") as f:
            for l in lines:
                if l.startswith("DB_PASSWORD="):
                    f.write(f"DB_PASSWORD={new_pass}\n")
                else:
                    f.write(l)

def restore_backup(sql_file_path=None):
    if not sql_file_path:
        candidates = [
            os.path.join(BACKEND_DIR, "backup", "guardianpay_backup.sql"),
            os.path.join(ROOT_DIR, "guardianpay_db.sql"),
            os.path.join(ROOT_DIR, "guardianpay_backup.sql")
        ]
        for c in candidates:
            if os.path.exists(c):
                sql_file_path = c
                break

    if not sql_file_path or not os.path.exists(sql_file_path):
        print(f"[ERROR] No se encontró el archivo de respaldo .sql en backup/ o raíz.")
        return False

    print("=" * 65)
    print("      GUARDIANPAY - RESTAURACIÓN DE BASE DE DATOS MYSQL")
    print(f"      • Servidor: {DB_HOST}:{DB_PORT}")
    print(f"      • Usuario:  {DB_USER}")
    print(f"      • Base:     {DB_NAME}")
    print(f"      • Archivo:  {os.path.basename(sql_file_path)}")
    print("=" * 65)

    current_pass = DB_PASSWORD
    conn = None

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=current_pass,
            charset='utf8mb4',
            client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
        )
    except Exception as e:
        print(f"\n[AVISO] No se pudo conectar con la contraseña predeterminada ({e}).")
        user_input = input(f"Ingresa la contraseña de tu MySQL local root [Enter para probar vacía]: ").strip()
        try:
            conn = pymysql.connect(
                host=DB_HOST,
                port=int(DB_PORT),
                user=DB_USER,
                password=user_input,
                charset='utf8mb4',
                client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
            )
            update_env_password(user_input)
            print("[OK] Contraseña válida. Guardada en backend/.env para próximas ejecuciones.")
        except Exception as e2:
            print(f"[ERROR] No se pudo conectar a MySQL: {e2}")
            print("Verifica que el servicio MySQL esté iniciado en tu máquina (XAMPP / MySQL Server).")
            return False

    print(f"\n[*] Ejecutando script de restauración...")

    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
        conn.commit()

        # Mostrar resumen de datos
        with conn.cursor() as cursor:
            cursor.execute(f"USE `{DB_NAME}`;")
            print("-" * 50)
            print("   RESUMEN DE DATOS RESTAURADOS:")
            print("-" * 50)
            for t in ['usuarios', 'contactos_frecuentes', 'transferencias', 'auditoria_ia']:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM `{t}`;")
                    cnt = cursor.fetchone()[0]
                    print(f"   [OK] Tabla '{t}': {cnt} registros cargados exitosamente")
                except Exception:
                    pass

        conn.close()
        print("-" * 50)
        print("[ÉXITO] ¡Base de datos 'guardianpay_db' restaurada exitosamente!")
        print("=" * 65)
        return True
    except Exception as e:
        print(f"[ERROR] Error durante la ejecución del script SQL: {e}")
        conn.close()
        return False

if __name__ == "__main__":
    restore_backup()
