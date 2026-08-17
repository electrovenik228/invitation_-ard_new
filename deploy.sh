#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "Ошибка: создайте файл .env на основе .env.example"
  exit 1
fi

docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "Сайт доступен: http://147.45.185.185:6767"
docker compose ps
