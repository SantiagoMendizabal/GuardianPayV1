# GuardianPay - Billetera Digital & Detección de Fraude con IA

Proyecto modularizado listo para el desarrollo de la Billetera Digital Fintech y su posterior integración con el modelo de Machine Learning (**Random Forest**).

---

## 📁 Estructura del Proyecto

```text
INNOVACION/
├── frontend/             <-- Aplicación Web Mobile-First (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/   <-- Pantallas (Login, Dashboard, Transfer, Voucher, Alerta, Biometría)
│   │   ├── services/     <-- Motor local simulado (aiFraudEngine.js)
│   │   └── data/         <-- Datos de prueba (mockData.js)
│   ├── package.json
│   └── vite.config.js
│
└── backend/              <-- (Reservado) Próximo servicio de Python (FastAPI + Random Forest)
    └── README.md
```

---

## 🚀 Cómo correr el Frontend

Para iniciar la aplicación móvil en tu navegador:

1. **Abre tu terminal en la carpeta del proyecto:**
   ```powershell
   cd e:\INNOVACION\frontend
   ```

2. **Inicia el servidor de desarrollo:**
   ```powershell
   npm run dev
   ```

3. **Abre el navegador en:**
   👉 **`http://localhost:3000`**

---

## 🧠 Próxima Fase: Backend con Random Forest

En la siguiente etapa, se configurará en la carpeta `/backend` un microservicio con:
- Python (`scikit-learn`, `fastapi`, `uvicorn`)
- Modelo Random Forest (`.pkl`) entrenado con patrones de transacciones.
- Endpoint REST para predecir la probabilidad de fraude en tiempo real desde el frontend.
