#!/bin/bash

# Development starter script
# Runs both frontend and backend in parallel

set -e

echo "Starting Student Review App in development mode..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
npm start &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "Development servers started!"
echo "=================================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================="
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
