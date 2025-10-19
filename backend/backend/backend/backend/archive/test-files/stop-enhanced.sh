#!/bin/bash

# SignalDesk Enhanced Platform Stop Script
# Stops all enhanced platform services

echo "╔════════════════════════════════════════════════════╗"
echo "║     Stopping SignalDesk Enhanced Platform         ║"
echo "╚════════════════════════════════════════════════════╝"

# Read PIDs from file if it exists
if [ -f .enhanced-pids ]; then
    source .enhanced-pids
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "🛑 Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🛑 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    rm .enhanced-pids
else
    echo "⚠️  No PID file found. Attempting to stop services by port..."
fi

# Stop any processes on the ports
echo "🛑 Stopping any services on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "🛑 Stopping any services on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Optional: Stop Redis (commented out by default to preserve cache)
# echo "🛑 Stopping Redis..."
# redis-cli shutdown 2>/dev/null || true

echo ""
echo "✅ All services stopped"
echo ""
echo "To restart, run: ./start-enhanced.sh"