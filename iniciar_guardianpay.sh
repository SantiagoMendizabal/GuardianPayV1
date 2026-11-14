#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$DIR"

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"

echo "=========================================================="
echo "          INICIANDO SISTEMA GUARDIANPAY (LINUX)           "
echo "=========================================================="

# Matar procesos previos en puertos si existieran
fuser -k "$BACKEND_PORT/tcp" 2>/dev/null
fuser -k "$FRONTEND_PORT/tcp" 2>/dev/null

# Iniciar Backend en segundo plano
DATABASE_URL="${DATABASE_URL:-sqlite:///guardianpay.db}" python3 -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port "$BACKEND_PORT" &
BACKEND_PID=$!
echo "[+] Backend iniciado en http://127.0.0.1:$BACKEND_PORT (PID: $BACKEND_PID)"

# Esperar 2 segundos
sleep 2

# Iniciar Frontend
cd "$DIR/frontend"
echo "[+] Iniciando Frontend en http://localhost:$FRONTEND_PORT ..."
PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" npm run dev &
FRONTEND_PID=$!

echo "=========================================================="
echo "  Backend API:  http://127.0.0.1:$BACKEND_PORT            "
echo "  Swagger Docs: http://127.0.0.1:$BACKEND_PORT/docs       "
echo "  Frontend App: http://localhost:$FRONTEND_PORT           "
echo "=========================================================="
echo "Presiona Ctrl+C para detener ambos servicios."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
