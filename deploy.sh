#!/usr/bin/env bash
# script to run the project locally
# backend = fastapi on port 8000, frontend = next.js on port 3000
# need ollama installed with dolphin3:8b

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

# set up python venv
if [ ! -d ".venv" ]; then
  echo "making python venv"
  python3 -m venv .venv
fi
# venv layout differs: bin/ on macOS+Linux, Scripts/ on Windows
if [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
else
  source .venv/Scripts/activate
fi
echo "installing python packages"
pip install -q -r requirements.txt

# pull the ollama model if we dont have it
if ! ollama list | grep -q "dolphin3:8b"; then
  echo "downloading ollama model (this is big)"
  ollama pull dolphin3:8b
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

# start the backend
echo "starting backend on http://localhost:8000"
uvicorn AI_Response:app --host 0.0.0.0 --port 8000 --reload > .logs/backend.log 2>&1 &
BACKEND_PID=$!

# start the frontend
echo "starting frontend on http://localhost:3000"
npm run dev > .logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "both servers running."
tail -f .logs/backend.log .logs/frontend.log &
TAIL_PID=$!
wait $BACKEND_PID $FRONTEND_PID
kill $TAIL_PID 2>/dev/null
