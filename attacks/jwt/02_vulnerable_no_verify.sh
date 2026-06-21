#!/bin/bash
echo "=== JWT Vulnerable: Token aceptado sin verificar firma ==="
echo "Primero obtenemos un token legítimo:"
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"roberto","password":"password456"}' \
  http://localhost:8080/api/auth/login | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:50}..."
echo ""
echo "Enviando al estado vulnerable:"
curl -s -H "X-Auth-Token: $TOKEN" \
  http://localhost:8080/api/jwt/vulnerable/profile | python -m json.tool

echo ""
echo "Resultado esperado: LEGITIMATE_ACCESS (el token es válido, pero el servidor ni lo verifica)"
