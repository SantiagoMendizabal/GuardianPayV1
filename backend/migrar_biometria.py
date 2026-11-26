import sys
import os

# Configurar path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from database import engine
from sqlalchemy import text

def ejecutar_migracion():
    print("=" * 70)
    print("  GUARDIANPAY - MIGRACIÓN BASE DE DATOS: BIOMETRÍA FACIAL 3D")
    print("=" * 70)

    columnas_a_verificar = [
        ("embedding_facial", "TEXT NULL COMMENT 'Vector biométrico 128D serializado en JSON'"),
        ("biometria_activa", "TINYINT(1) DEFAULT 0 NOT NULL COMMENT 'Flag 1 si tiene rostro registrado'"),
        ("fecha_enrolamiento", "DATETIME NULL COMMENT 'Fecha y hora en que se enroló el rostro'")
    ]

    with engine.connect() as conn:
        for nombre_col, definicion in columnas_a_verificar:
            # Verificar si la columna ya existe en MySQL
            query_check = text("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'usuarios' 
                  AND COLUMN_NAME = :col_name;
            """)
            existe = conn.execute(query_check, {"col_name": nombre_col}).scalar()

            if existe == 0:
                print(f"[*] Añadiendo columna '{nombre_col}' a tabla 'usuarios'...")
                sql_alter = text(f"ALTER TABLE `usuarios` ADD COLUMN `{nombre_col}` {definicion};")
                conn.execute(sql_alter)
                conn.commit()
                print(f"[+] Columna '{nombre_col}' creada exitosamente.")
            else:
                print(f"[OK] La columna '{nombre_col}' ya existe en 'usuarios'.")

        # Verificar estructura final
        res = conn.execute(text("DESCRIBE usuarios;")).fetchall()
        print("\n[+] Estructura actualizada de la tabla 'usuarios':")
        for col in res:
            if col[0] in ["id", "name", "phone", "embedding_facial", "biometria_activa", "fecha_enrolamiento"]:
                print(f"    - {col[0]:22} | Tipo: {str(col[1]):15} | Null: {col[2]}")

    print("\n[ÉXITO] Migración de biometría completada al 100%.")

if __name__ == "__main__":
    ejecutar_migracion()
