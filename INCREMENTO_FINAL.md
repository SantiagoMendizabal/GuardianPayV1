# 🚀 Incremento Final: GuardianPay (Despliegue Cloud, Notificaciones y Ciberseguridad Visual)

Este documento detalla la arquitectura, los pasos de configuración y la implementación de los incrementos finales para la sustentación del proyecto **GuardianPay**:
1. **Conexión de Base de Datos Cloud en Supabase vinculada a Render.**
2. **Diagnóstico técnico de IP y Geolocalización (Realidad vs Simulación).**
3. **Implementación de Notificaciones Automáticas por Correo (Gmail SMTP).**
4. **Implementación del Mapa Interactivo de "Viaje Imposible" (*Impossible Travel Map*).**

---

## 1. Conexión de Supabase con Render (Paso a Paso)

Supabase aloja la base de datos **PostgreSQL en la nube** con cifrado SSL, permitiendo que tanto el backend en Render como el frontend en Vercel (o en celulares) compartan los mismos saldos, usuarios y biometría en tiempo real.

```mermaid
flowchart LR
    subgraph Cliente["Cliente Móvil / Web"]
        A["Celular Profesor (Vercel HTTPS)"]
    end
    subgraph Cloud["Nube Render"]
        B["FastAPI Backend (Render)"]
    end
    subgraph Data["Nube Supabase"]
        C["PostgreSQL (Supabase)"]
    end
    A -->|REST API HTTPS| B
    B -->|SQL SSL Port 5432 / 6543| C
```

### Paso 1.1: Crear el Proyecto en Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New Project"** y selecciona tu organización.
3. Completa los datos:
   * **Name:** `guardianpay-db`
   * **Database Password:** Define una contraseña alfanumérica segura (ej. `GuardianPay2026!`). **Guárdala, la necesitarás en el paso 1.2.**
   * **Region:** Selecciona `South America (São Paulo)` para menor latencia en Perú, o `US East (N. Virginia)`.
4. Haz clic en **"Create new project"** y espera ~60 segundos a que finalice el aprovisionamiento.

### Paso 1.2: Obtener la Cadena de Conexión (`DATABASE_URL`)
1. En el panel izquierdo de Supabase, haz clic en el ícono de tuerca (**Project Settings**).
2. Entra a **Database** y baja hasta la sección **Connection string**.
3. Selecciona la pestaña **URI** y modo **Session** (puerto `5432` o `6543`).
4. Verás una URL como esta:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxx.supabase.co:5432/postgres
   ```
5. Reemplaza `[YOUR-PASSWORD]` por la contraseña que creaste en el paso 1.1.

### Paso 1.3: Conectar la Base de Datos en Render.com
1. Ingresa a tu panel en [https://dashboard.render.com](https://dashboard.render.com).
2. Selecciona tu servicio backend (`guardianpay-api`).
3. Ve a la pestaña **Environment** (Variables de Entorno).
4. Agrega o edita la variable:
   * **Key:** `DATABASE_URL`
   * **Value:** Pega la URL completa de Supabase (`postgresql://postgres:...`).
5. Haz clic en **Save Changes**. Render se reiniciará automáticamente conectado a Supabase.

### Paso 1.4: Migrar los Datos Locales a Supabase (1 Clic)
El repositorio ya cuenta con el script automatizado [`backend/migrar_a_supabase.py`](file:///home/anthony/Proyectos/INNOVACION/backend/migrar_a_supabase.py). En tu terminal ejecuta:
```bash
python3 backend/migrar_a_supabase.py "postgresql://postgres:TU_PASSWORD@db.xxxxxxx.supabase.co:5432/postgres"
```
* **Qué hace este comando:**
  1. Crea automáticamente todas las tablas (`usuarios`, `transferencias`, `contactos_frecuentes`).
  2. Sube a **Anthony Luque** con su saldo de **S/ 999,520.00**, PIN `123456` y sus vectores faciales 128D.
  3. Sube a los destinatarios de prueba y contactos frecuentes.

---

## 2. Diagnóstico del Sistema de IPs y Geolocalización

> [!NOTE]
> **Respuesta a tu consulta:** Sí, confirmamos que actualmente la ubicación en el proyecto **no toma la IP física del dispositivo en tiempo real**, sino que está modelada con un selector de control en la interfaz.

### ¿Cómo funciona actualmente?
* En [`TransferScreen.jsx`](file:///home/anthony/Proyectos/INNOVACION/frontend/src/components/TransferScreen.jsx#L54), la pantalla tiene dos botones de prueba rápida:
  * `Arequipa (Habitual)` ➔ Envía `location = "Arequipa"` (Riesgo bajo, 0%).
  * `Inusual / IP Extranjera` ➔ Envía `location = "Inusual / IP Extranjera"` (Dispara +25% de riesgo).
* En el backend ([`backend/main.py#L645-L664`](file:///home/anthony/Proyectos/INNOVACION/backend/main.py#L645-L664)), existe la lógica de **Viaje Imposible**:
  * Compara la ciudad de la transacción actual contra la última transacción del usuario.
  * Si la última fue en Arequipa y 10 minutos después se intenta transferir desde Lima (1,010 km de distancia), la velocidad calculada supera los 800 km/h y el backend activa:
    ```python
    impossible_travel = True
    travel_detail = "Transacción previa en Arequipa hace 10 min y ahora en Lima (1010 km). Velocidad físicamente imposible."
    ```

### ¿Cómo evoluciona a nivel profesional?
Para la sustentación se mantendrá el selector para **fines demostrativos** (para que el profesor pueda forzar el ataque cuando quiera), pero se enriquece agregando:
1. **Detección de IP Real de respaldo:** Mediante el encabezado HTTP estándar `request.headers.get("x-forwarded-for")` en FastAPI.
2. **Visualización Gráfica:** El nuevo **Mapa de Viaje Imposible**.

---

## 3. Implementación de Notificaciones por Correo (Gmail SMTP)

Cumple con la **Circular SBS G-140** de la Superintendencia de Banca y Seguros sobre notificación inmediata al cliente por canales alternos.

### 3.1 Configuración de Cuenta Gmail (Sin costo)
Para que el servidor de FastAPI pueda enviar correos sin bloqueos de Google:
1. En tu cuenta de Google, entra a [Seguridad ➔ Verificación en 2 pasos](https://myaccount.google.com/security).
2. Al final de la página, busca **Contraseñas de aplicaciones** (*App Passwords*).
3. Escribe un nombre: `GuardianPay Backend` y presiona **Crear**.
4. Google te entregará una clave de 16 letras (ejemplo: `abcd efgh ijkl mnop`).
5. En Render (o en tu archivo `.env`), configuras:
   ```env
   SMTP_EMAIL=tu_correo@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

### 3.2 Servicio de Envío en Backend (`backend/services/mailer.py`)
Se utiliza la librería nativa de Python (`smtplib` + `email.mime`) en segundo plano (*BackgroundTasks* de FastAPI) para que el envío no demore la respuesta del servidor:

```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_EMAIL", "")
SMTP_PASS = os.getenv("SMTP_PASSWORD", "")

def enviar_correo_voucher(destinatario: str, nombre_usuario: str, monto: float, receptor: str, op_code: str, fecha: str):
    """Envía el comprobante digital bancario tras una transferencia exitosa."""
    if not SMTP_USER or not SMTP_PASS:
        print("[WARN] SMTP_EMAIL o SMTP_PASSWORD no configurados. Simulando envío.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"✅ Transferencia Exitosa S/ {monto:.2f} - GuardianPay"
    msg["From"] = f"GuardianPay Seguridad <{SMTP_USER}>"
    msg["To"] = destinatario

    html = f"""
    <div style="font-family: sans-serif; max-width: 520px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #742284; margin: 0;">Guardian<span style="color: #00D69E;">Pay</span></h2>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Comprobante Digital de Transferencia Inmediata</p>
        </div>
        <div style="background: #f8fafc; border-radius: 16px; padding: 18px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #475569; margin: 4px 0;">Titular Emisor: <b>{nombre_usuario}</b></p>
            <p style="font-size: 14px; color: #475569; margin: 4px 0;">Destinatario: <b>{receptor}</b></p>
            <p style="font-size: 22px; color: #0f172a; font-weight: bold; margin: 12px 0 6px 0;">Monto: <span style="color: #00A87A;">S/ {monto:.2f}</span></p>
            <p style="font-size: 11px; color: #64748b; margin: 0;">Código de Operación: <code>{op_code}</code> | {fecha}</p>
        </div>
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            Protegido con Inteligencia Artificial Random Forest y Biometría 3D MediaPipe.
        </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, destinatario, msg.as_string())
        print(f"[OK] Correo de voucher enviado exitosamente a {destinatario}")
        return True
    except Exception as e:
        print(f"[ERROR] Error enviando correo: {e}")
        return False
```

### 3.3 Alerta Crítica de Ciberseguridad (Intento de Fraude)
Cuando el score de riesgo supera el 70% o se acumulan 3 fallos biométricos, se dispara la plantilla de alerta urgente con botón de bloqueo preventivo:
> *"🚨 ALERTA GUARDIANPAY: Se ha detectado un intento de transferencia de S/ 480.00 en horario inusual (03:45 AM). Si no fuiste tú, tu cuenta ha sido protegida mediante congelamiento preventivo."*

---

## 4. Implementación del Mapa Interactivo de "Viaje Imposible"

### 4.1 Concepto de Ciberseguridad Bancaria
El **Viaje Imposible** (*Impossible Travel*) ocurre cuando dos operaciones bancarias son emitidas desde ubicaciones geográficas distintas en un intervalo de tiempo donde es humanamente imposible trasladarse en transporte comercial o vehículo terrestre:

$$\text{Velocidad Requerida} = \frac{\Delta \text{ Distancia (km)}}{\Delta \text{ Tiempo (horas)}} > 800 \text{ km/h}$$

Si la velocidad supera los 800 km/h sin vuelo registrado, el sistema concluye matemáticamente una **usurpación de credenciales / ataque por IP remota o VPN**.

```
  [Nodo Habitual: Arequipa] ──────── 1,010 km en 10 min ──────── [Nodo Anómalo: Lima]
                                (Velocidad: 6,060 km/h)
                                  🚨 VIAJE IMPOSIBLE
```

### 4.2 Integración en Frontend con Leaflet (OpenStreetMap)
Se utiliza la librería abierta **Leaflet** (`leaflet` y `react-leaflet`), la cual no requiere llaves de Google Maps ni tarjetas de crédito:

```bash
cd frontend && npm install leaflet react-leaflet
```

### 4.3 Componente `ImpossibleTravelMap.jsx`
Este componente se incrusta directamente dentro de la pantalla de **Alerta de Fraude** ([`FraudAlertScreen.jsx`](file:///home/anthony/Proyectos/INNOVACION/frontend/src/components/FraudAlertScreen.jsx)):

```jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Coordenadas bancarias de prueba (Arequipa vs Lima)
const LOCATIONS = {
  arequipa: { lat: -16.4090, lng: -71.5375, name: "Arequipa (Residencia Habitual)" },
  lima: { lat: -12.0464, lng: -77.0428, name: "Lima (Nodo Detectado en la Transacción)" },
  extranjera: { lat: 25.7617, lng: -80.1918, name: "Miami, USA (IP VPN / Proxy)" }
};

export default function ImpossibleTravelMap({ origin = "arequipa", target = "lima", timeMin = 12 }) {
  const p1 = LOCATIONS[origin] || LOCATIONS.arequipa;
  const p2 = LOCATIONS[target] || LOCATIONS.lima;
  const positions = [[p1.lat, p1.lng], [p2.lat, p2.lng]];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-red-500/40 shadow-xl bg-slate-950">
      <div className="bg-red-950/80 px-3.5 py-2 border-b border-red-500/30 flex items-center justify-between text-xs">
        <span className="text-red-300 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Telemetría de Geolocalización Anómala</span>
        </span>
        <span className="font-mono text-red-200 text-[10px]">Distancia: 1,010 km · Intervalo: {timeMin} min</span>
      </div>

      <div className="h-48 w-full">
        <MapContainer center={[-14.2, -74.3]} zoom={5} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[p1.lat, p1.lng]}>
            <Popup>{p1.name}</Popup>
          </Marker>
          <Marker position={[p2.lat, p2.lng]}>
            <Popup>{p2.name}</Popup>
          </Marker>
          <Polyline positions={positions} color="#EF4444" dashArray="6, 8" weight={3} />
        </MapContainer>
      </div>

      <div className="p-2.5 bg-slate-900/90 text-[11px] text-slate-300 flex items-center justify-between font-mono">
        <span>Velocidad Requerida: <b className="text-red-400">5,050 km/h</b></span>
        <span className="text-amber-400">Veredicto: Desvío Físico Imposible</span>
      </div>
    </div>
  );
}
```

---

## 5. Resumen del Plan de Implementación Final

```
  FASE 1: CONEXIÓN CLOUD
  ├── 1. Copiar Connection URI de Supabase
  ├── 2. Configurar DATABASE_URL en Render.com
  └── 3. Ejecutar python3 backend/migrar_a_supabase.py

  FASE 2: NOTIFICACIONES REALES (GMAIL)
  ├── 1. Generar App Password en Google
  ├── 2. Añadir variables SMTP en Render
  └── 3. Disparo automático de vouchers al correo de Anthony

  FASE 3: EXPERIENCIA VISUAL (MAPA IMPOSIBLE)
  ├── 1. Instalar Leaflet en Frontend
  ├── 2. Renderizar mapa interactivo en FraudAlertScreen
  └── 3. Explicar el concepto al profesor en la sustentación
```

Con estas 3 implementaciones el proyecto no solo estará 100% en la nube y accesible desde cualquier celular, sino que tendrá un valor de sustentación visual y normativo bancario de primer nivel.
