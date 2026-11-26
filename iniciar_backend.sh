#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$DIR"

if [ -z "$BACKEND_PORT" ]; then
  if ss -tulpn | grep -q ":8000 "; then
    PORT=8001
  else
    PORT=8000
  fi
else
  PORT="$BACKEND_PORT"
fi

DATABASE_URL="${DATABASE_URL:-mysql+pymysql://root:admin123@localhost:3306/guardianpay_db}" python3 -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port "$PORT" --reload
