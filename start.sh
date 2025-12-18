#!/bin/bash

# Start Backend in background
echo "Starting Backend..."
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm run dev

# Cleanup on exit
kill $BACKEND_PID
