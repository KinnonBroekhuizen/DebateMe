#!/usr/bin/env bash
# script to run the project locally
# backend = fastapi on port 8000, frontend = next.js on port 3000
# need ollama installed with llama3.1:8b
set -e
cd "$(dirname "$0")"
mkdir -p .logs
# kill both servers when you press ctrl+c
cleanup() {
  echo ""
  echo "stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
}
trap cleanup EXIT INT TERM
# set up python venv in the project directory
VENV_DIR="$(pwd)/.venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "making python venv at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/Scripts/activate"
echo "installing python packages"
pip install -q -r requirements.txt

# pull the ollama model if we dont have it
# must match the model askAI() uses in AI_Response.py (llama3.1:8b)
if ! ollama list | grep -q "llama3.1:8b"; then
  echo "downloading ollama model (this is big)"
  ollama pull llama3.1:8b
fi

# install frontend packages
if [ ! -d "node_modules" ]; then
  echo "running npm install"
  npm install
fi

# warn if env keys missing but dont stop (pipeline degrades gracefully)
if [ ! -f .env ]; then
  echo "warning: no .env (copy .env.example) - text-only, no audio/video"
else
  grep -q "^FISH_API_KEY=." .env || echo "warning: FISH_API_KEY missing - no TTS audio"
  grep -q "^SYNC_API_KEY=." .env || echo "warning: SYNC_API_KEY missing - no lip-sync video"
  grep -q "NEXT_PUBLIC_SUPABASE_URL=." .env || echo "warning: supabase keys not in .env"
fi

# free our ports first. orphaned servers from a previous run (e.g. a closed
# terminal that skipped the cleanup trap) keep squatting on these ports. when
# 3000 is taken, next.js silently drifts the frontend to :3001 — so you open
# :3000, hit the dead server, and get a confusing "Internal Server Error".
free_port() {
  local port=$1
  local pids
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "freeing port $port (stopping stale server: $pids)"
    kill -9 $pids 2>/dev/null || true
  fi
}
free_port 8000
free_port 3000

# start the backend
echo "starting backend on http://localhost:8000"
uvicorn AI_Response:app --host 127.0.0.1 --port 8000 --reload > .logs/backend.log 2>&1 &
BACKEND_PID=$!

# start the frontend. pin to :3000 so it fails loudly if the port is somehow
# still taken, instead of quietly drifting to another port.
echo "starting frontend on http://localhost:3000"
npm run dev -- --port 3000 > .logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "both servers running."
tail -f .logs/backend.log .logs/frontend.log &
TAIL_PID=$!
wait $BACKEND_PID $FRONTEND_PID
kill $TAIL_PID 2>/dev/null
