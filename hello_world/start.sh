#!/bin/bash

echo "Запуск MongoDB"
docker compose up -d

echo "Запуск Backend"
python3 main.py &
BACKEND_PID=$!

echo "Запуск Frontend"
cd client && npm run preview &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID; docker compose down; exit" SIGINT

wait
