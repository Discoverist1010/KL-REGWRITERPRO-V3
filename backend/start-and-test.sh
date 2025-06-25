#!/bin/bash

echo "🚀 Starting backend server..."
npm run dev &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

echo "🧪 Running queue test..."
node test-queue-simple.js

echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo "✅ Done"