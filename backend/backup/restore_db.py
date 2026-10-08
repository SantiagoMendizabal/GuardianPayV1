import os
import sys
import pymysql

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

sys.path.append(BACKEND_DIR)
from database import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME

def restore_backup(sql_file_path=None):
    if not sql_file_path:
        sql_file_path = os.path.join(BACKEND_DIR, "backup", "guardianpay_backup.sql")

    if not os.path.exists(sql_file_path):
        print(f"[ERROR] No se encontró el archivo de respaldo: {sql_file_path}")
        return False

    print(f"[INFO] Restaurando base de datos '{DB_NAME}' desde {sql_file_path}...")

    try:
        # Conectar al servidor MySQL
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4',
            client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
        )
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MySQL: {e}")
        return False

    with open(sql_file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    try:
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
        conn.commit()
        conn.close()
        print(f"[ÉXITO] Base de datos '{DB_NAME}' restaurada exitosamente con todas sus tablas y registros.")
        return True
    except Exception as e:
        print(f"[ERROR] Error durante la restauración: {e}")
        conn.close()
        return False

if __name__ == "__main__":
    restore_backup()
