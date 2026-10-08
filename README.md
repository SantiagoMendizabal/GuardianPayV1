# GuardianPay - Billetera Digital & Motor Antifraude con IA

Billetera digital móvil y web con motor de inferencia de Machine Learning (**Random Forest**) para detección y prevención de fraude en tiempo real, conectada a base de datos relacional **MySQL 8.0**.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:
1. **Node.js** (v18 o superior) - [Descargar Node.js](https://nodejs.org/)
2. **Python** (v3.10 o superior) - [Descargar Python](https://www.python.org/)
3. **MySQL Server 8.0** y opcionalmente **MySQL Workbench** - [Descargar MySQL](https://dev.mysql.com/downloads/workbench/)

---

## 🚀 Puesta en Marcha Rápida (Local)

### Paso 1: Configurar variables de entorno (`.env`)
En la carpeta raíz o dentro de `backend/`, copia el archivo `.env.example` y renómbralo a `.env`:
```ini
DB_USER=root
DB_PASSWORD=tu_contraseña_de_mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=guardianpay_db
```
> **Nota:** Solo necesitas colocar en `DB_PASSWORD` la contraseña con la que instalaste tu MySQL local (por ejemplo `root`, `admin123`, `123456`, etc.).

---

### Paso 2: Crear la Base de Datos en MySQL

Tienes **dos formas sencillas** de hacerlo:

#### Opción A (Recomendada - En 1 Clic con el `.bat`):
1. Haz doble clic en el archivo **`crear_db.bat`** (ubicado en la raíz del proyecto).
2. El script conectará a tu MySQL y creará automáticamente la base de datos `guardianpay_db`, sus 4 tablas y todos los datos iniciales.

#### Opción B (Directamente desde MySQL Workbench):
1. Abre **MySQL Workbench** e ingresa a tu conexión local (`localhost:3306`).
2. Ve al menú **File > Open SQL Script...** (o pulsa `Ctrl + Shift + O`).
3. Selecciona el archivo **`guardianpay_db.sql`** ubicado en la raíz del proyecto.
4. Haz clic en el ícono del **Rayo Amarillo** (⚡ *Execute*).
5. En el panel izquierdo *Navigator > Schemas*, haz clic derecho y selecciona **Refresh All**. ¡Listo! Verás el esquema `guardianpay_db` con las tablas:
   - `usuarios`
   - `transferencias`
   - `auditoria_ia`
   - `contactos_frecuentes`

---

### Paso 3: Iniciar la Aplicación

Puedes iniciar todo con un solo clic o mediante dos ventanas separadas:

- **Todo en uno:** Doble clic en **`iniciar_guardianpay.bat`**
- **O por separado:**
  1. Doble clic en **`iniciar_backend.bat`** (Inicia FastAPI en `http://localhost:8000`)
  2. Doble clic en **`iniciar_frontend.bat`** (Inicia React/Vite en `http://localhost:3000`)

---

## 👥 Usuarios y Cuentas de Prueba

La base de datos viene precargada con usuarios listos para interactuar:

| Nombre | Celular | PIN Seguro | DNI | Saldo Inicial |
| :--- | :--- | :--- | :--- | :--- |
| **Anthony Luque** | `987654321` | `123456` | `72849102` | S/ 1,240.00 |
| **Lucía Gómez** | `981234567` | `123456` | `71982341` | S/ 1,015.00 |
| **Carlos Mendoza** | `971889922` | `123456` | `70819234` | S/ 750.00 |
| **Santiago Mendizabal** | `993441122` | `123456` | `73910284` | S/ 2,100.00 |
| **María Quispe (Mamá)** | `976543210` | `123456` | `40918273` | S/ 1,350.00 |

> En la pantalla de login también dispones del botón **"Entrar con Anthony Luque"** para auto-completar los datos en 1 clic.

---

## 💾 Copias de Seguridad (Backups)

El proyecto incluye herramientas automatizadas de respaldo transaccional:
- **`crear_backup.bat`**: Genera un volcado SQL íntegro con estructura y datos en `backend/backup/` y actualiza `guardianpay_db.sql`.
- **`restaurar_backup.bat`**: Restaura el último estado oficial de la base de datos de manera atómica.
