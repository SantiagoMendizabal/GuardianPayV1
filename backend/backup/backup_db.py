import os
import sys
from datetime import datetime
import pymysql

# Cargar variables de entorno
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

# Agregar backend al path para reutilizar database.py
sys.path.append(BACKEND_DIR)
from database import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME

def create_backup():
    print(f"[INFO] Iniciando respaldo de la base de datos MySQL '{DB_NAME}'...")
    backup_dir = os.path.join(BACKEND_DIR, "backup")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file_main = os.path.join(backup_dir, "guardianpay_backup.sql")
    backup_file_dated = os.path.join(backup_dir, f"backup_{DB_NAME}_{timestamp}.sql")

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MySQL para el respaldo: {e}")
        return False

    sql_statements = []
    sql_statements.append("-- =============================================================================")
    sql_statements.append(f"-- RESPALDO DE BASE DE DATOS: {DB_NAME}")
    sql_statements.append(f"-- FECHA DE GENERACIÓN: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_statements.append(f"-- SERVIDOR: {DB_HOST}:{DB_PORT} | USUARIO: {DB_USER}")
    sql_statements.append("-- =============================================================================\n")
    sql_statements.append(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    sql_statements.append(f"USE `{DB_NAME}`;\n")
    sql_statements.append("SET FOREIGN_KEY_CHECKS = 0;\n")

    tables = ["usuarios", "transferencias", "auditoria_ia", "contactos_frecuentes"]

    with conn.cursor() as cursor:
        for table in tables:
            # 1. Obtener DDL de creación de la tabla
            cursor.execute(f"SHOW CREATE TABLE `{table}`;")
            create_res = cursor.fetchone()
            if create_res:
                create_sql = create_res["Create Table"]
                sql_statements.append(f"-- Estructura de tabla para `{table}`")
                sql_statements.append(f"DROP TABLE IF EXISTS `{table}`;")
                sql_statements.append(f"{create_sql};\n")

            # 2. Obtener datos de la tabla
            cursor.execute(f"SELECT * FROM `{table}`;")
            rows = cursor.fetchall()
            if rows:
                sql_statements.append(f"-- Volcado de datos para la tabla `{table}` ({len(rows)} registros)")
                cols = list(rows[0].keys())
                col_names = ", ".join([f"`{c}`" for c in cols])

                for row in rows:
                    val_list = []
                    for c in cols:
                        v = row[c]
                        if v is None:
                            val_list.append("NULL")
                        elif isinstance(v, (int, float)):
                            val_list.append(str(v))
                        elif isinstance(v, bool):
                            val_list.append("1" if v else "0")
                        elif isinstance(v, datetime):
                            val_list.append(f"'{v.strftime('%Y-%m-%d %H:%M:%S')}'")
                        else:
                            clean_str = str(v).replace("\\", "\\\\").replace("'", "\\'")
                            val_list.append(f"'{clean_str}'")
                    values_str = ", ".join(val_list)
                    sql_statements.append(f"INSERT INTO `{table}` ({col_names}) VALUES ({values_str});")
                sql_statements.append("\n")

    sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;\n")
    sql_statements.append("-- Fin del respaldo")

    full_sql = "\n".join(sql_statements)

    # Guardar en archivo principal, en raíz del proyecto y con fecha
    root_sql_file = os.path.join(ROOT_DIR, "guardianpay_db.sql")
    with open(backup_file_main, "w", encoding="utf-8") as f:
        f.write(full_sql)

    with open(root_sql_file, "w", encoding="utf-8") as f:
        f.write(full_sql)

    with open(backup_file_dated, "w", encoding="utf-8") as f:
        f.write(full_sql)

    conn.close()
    print(f"[ÉXITO] Respaldo generado correctamente:")
    print(f"   -> {backup_file_main}")
    print(f"   -> {root_sql_file}")
    print(f"   -> {backup_file_dated}")
    return True

if __name__ == "__main__":
    create_backup()
