#!/bin/bash

# Start Spotifake Hybrid Services (Linux/macOS)
#
# This script starts both the Essentia.js Node service and Python FastAPI backend
# Requirements: Node.js and Python must be installed

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "========================================"
echo " Spotifake Hybrid Architecture Launcher"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python is not installed or not in PATH"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

# Check directories
echo "[1/4] Checking Essentia Service directory..."
if [ ! -d "$SCRIPT_DIR/EssentiaService" ]; then
    echo "[ERROR] EssentiaService directory not found"
    exit 1
fi

echo "[2/4] Checking BackendAI directory..."
if [ ! -d "$SCRIPT_DIR/BackendAI" ]; then
    echo "[ERROR] BackendAI directory not found"
    exit 1
fi

echo ""
echo "========================================"
echo " Starting Services..."
echo "========================================"
echo ""

# Start Essentia Service
echo "[3/4] Starting Essentia.js Service (Node.js)..."
echo "      Port: 3000"
(
    cd "$SCRIPT_DIR/EssentiaService"
    npm install --silent 2>/dev/null || true
    npm start
) &
ESSENTIA_PID=$!

# Wait for Essentia service to start
sleep 5

# Start Python Backend
echo "[4/4] Starting Python FastAPI Backend..."
echo "      Port: 8000"
(
    cd "$SCRIPT_DIR/BackendAI"
    python3 -m pip install -q -r requirements.txt 2>/dev/null || true
    python3 start_backend.py
) &
BACKEND_PID=$!

echo ""
echo "========================================"
echo " Services Launched!"
echo "========================================"
echo ""
echo "[INFO] Services running in background:"
echo "  - Essentia.js Service (PID: $ESSENTIA_PID) on http://localhost:3000"
echo "  - FastAPI Backend (PID: $BACKEND_PID) on http://localhost:8000"
echo ""
echo "[NEXT] Open another terminal to test:"
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:8000/health"
echo ""
echo "[API DOCS] Once running, visit:"
echo "  FastAPI Docs: http://localhost:8000/docs"
echo "  Essentia API: http://localhost:3000/"
echo ""
echo "[LOGS] View logs for each service:"
echo "  tail -f /tmp/essentia.log"
echo "  tail -f /tmp/backend.log"
echo ""
echo "[STOP] To stop services:"
echo "  kill $ESSENTIA_PID $BACKEND_PID"
echo ""

# Wait for both processes
wait $ESSENTIA_PID $BACKEND_PID
