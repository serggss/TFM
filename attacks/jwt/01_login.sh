#!/bin/bash
echo "=== JWT: Login como Roberto ==="
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"roberto","password":"password456"}' \
  http://localhost:8080/api/auth/login | python -m json.tool

echo ""
echo "Guarda el token del campo 'token' para los siguientes scripts."
