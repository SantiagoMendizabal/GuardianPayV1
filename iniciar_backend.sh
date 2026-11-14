#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$DIR"

PORT="${BACKEND_PORT:-8001}"
echo "Iniciando Backend GuardianPay en http://127.0.0.1:$PORT ..."
DATABASE_URL="${DATABASE_URL:-sqlite:///guardianpay.db}" python3 -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port "$PORT" --reload
