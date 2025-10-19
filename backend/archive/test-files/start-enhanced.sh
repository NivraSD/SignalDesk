#!/bin/bash

# SignalDesk Enhanced Platform Startup Script
# Starts all required services for the enhanced infrastructure

echo "╔════════════════════════════════════════════════════╗"
echo "║     SignalDesk Enhanced Platform Startup          ║"
echo "║                                                    ║"
echo "║     Starting all services...                      ║"
echo "╚════════════════════════════════════════════════════╝"

# Function to check if a service is running
check_service() {
    if pgrep -f "$1" > /dev/null; then
        echo "✅ $2 is already running"
        return 0
    else
        echo "⚠️  $2 is not running"
        return 1
    fi
}

# Function to start Redis if not running
start_redis() {
    # Check if Redis is already running using redis-cli
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is already running"
        return 0
    fi
    
    echo "🚀 Starting Redis..."
    if command -v redis-server &> /dev/null; then
        # Try using brew services first
        if command -v brew &> /dev/null; then
            brew services start redis > /dev/null 2>&1
            sleep 2
        else
            redis-server --daemonize yes
            sleep 2
        fi
        
        if redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis started successfully"
        else
            echo "❌ Failed to start Redis"
            echo "   Please ensure Redis is properly installed"
            return 1
        fi
    else
        echo "❌ Redis not installed"
        echo "   Please install Redis: brew install redis"
        return 1
    fi
}

# Function to check PostgreSQL
check_postgres() {
    echo "🔍 Checking PostgreSQL connection..."
    PGPASSWORD=your_postgres_password_here psql -U postgres -h localhost -d signaldesk -c "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL is accessible"
        return 0
    else
        echo "❌ PostgreSQL is not accessible"
        echo "   Please ensure PostgreSQL is running and the signaldesk database exists"
        return 1
    fi
}

# Start services
echo ""
echo "1️⃣  Checking PostgreSQL..."
if ! check_postgres; then
    echo "   Attempting to start PostgreSQL..."
    if command -v pg_ctl &> /dev/null; then
        pg_ctl start -D /usr/local/var/postgres 2>/dev/null || true
        sleep 3
        check_postgres
    fi
fi

echo ""
echo "2️⃣  Starting Redis (for caching and pub/sub)..."
start_redis

echo ""
echo "3️⃣  Starting Backend Server (Enhanced)..."
echo "   Port: 3001"
echo "   Features: WebSocket, MemoryVault, AI Assistant, Monitoring"

# Kill any existing backend process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend in background
cd /Users/jonathanliebowitz/Desktop/SignalDesk
npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/api/health/enhanced > /dev/null; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend may not be fully started. Check backend.log for details"
fi

echo ""
echo "4️⃣  Starting Frontend..."
echo "   Port: 3000"

# Kill any existing frontend process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start frontend in background
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║     SignalDesk Enhanced Platform Ready!           ║"
echo "║                                                    ║"
echo "║     Backend:  http://localhost:3001               ║"
echo "║     Frontend: http://localhost:3000               ║"
echo "║                                                    ║"
echo "║     Enhanced Features:                            ║"
echo "║     • MemoryVault with Versioning                ║"
echo "║     • Semantic Search                            ║"
echo "║     • Adaptive AI Assistant                      ║"
echo "║     • Real-time WebSocket Updates                ║"
echo "║     • Railway UI System                          ║"
echo "║                                                    ║"
echo "║     Try the enhanced Campaign Intelligence:       ║"
echo "║     /projects/:id/campaign-intelligence-enhanced  ║"
echo "║                                                    ║"
echo "║     Logs:                                         ║"
echo "║     • Backend:  tail -f backend.log              ║"
echo "║     • Frontend: tail -f frontend.log             ║"
echo "║                                                    ║"
echo "║     To stop all services:                        ║"
echo "║     ./stop-enhanced.sh                           ║"
echo "╚════════════════════════════════════════════════════╝"

# Save PIDs to file for stop script
echo "BACKEND_PID=$BACKEND_PID" > .enhanced-pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .enhanced-pids

# Keep script running and show logs
echo ""
echo "Press Ctrl+C to stop all services..."
tail -f backend.log frontend.log