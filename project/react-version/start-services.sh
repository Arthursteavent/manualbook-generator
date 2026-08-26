#!/usr/bin/env bash
# Start Python AI Backend (port 3002) and Vite Preview Server (port 3001) together under manualarch-react.service

echo "[REACT-SERVICE] 🚀 Starting Node.js AI & Database Server (port 3002)..."
node --max-old-space-size=8192 /home/aio/manualbook-generator/project/react-version/server.js &
NODE_PID=$!

echo "[REACT-SERVICE] 🚀 Starting Vite React Preview Server (port 3001)..."
npm run preview -- --port 3001 --host &
VITE_PID=$!

trap "kill $NODE_PID $VITE_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

wait $NODE_PID $VITE_PID
