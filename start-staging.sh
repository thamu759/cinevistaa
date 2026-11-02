#!/bin/bash
echo "========================================================"
echo "  ThiraiPedia - Starting STAGING Environment"
echo "========================================================"
echo "Backend:  http://localhost:5001/api (db.staging.json)"
echo "Frontend: http://localhost:5174"
echo "========================================================"

(cd server && npm run staging) &
SERVER_PID=$!

(cd client && npm run dev:staging) &
CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID; exit" SIGINT SIGTERM
wait

