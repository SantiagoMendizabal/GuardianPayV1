#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$DIR/frontend"

if [ -z "$PORT" ]; then
  if ss -tulpn | grep -q ":3000 "; then
    PORT=3001
  else
    PORT=3000
  fi
fi

if [ -z "$BACKEND_PORT" ]; then
  if ss -tulpn | grep -q ":8000 "; then
    BACKEND_PORT=8001
  else
    BACKEND_PORT=8000
  fi
fi

PORT="$PORT" BACKEND_PORT="$BACKEND_PORT" npm run dev
