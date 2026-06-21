#!/bin/bash
echo "=== CORS Fixed: Whitelist exacta ==="
echo ""
echo "--- Origin malicioso ---"
curl -s -H "Origin: https://localhost.evil.com" \
  http://localhost:8080/api/cors/fixed/data | python -m json.tool | grep -E "verdict|error"

echo ""
echo "--- Origin legítimo ---"
curl -s -H "Origin: http://localhost:5173" \
  http://localhost:8080/api/cors/fixed/data | python -m json.tool | grep -E "verdict"

echo ""
echo "Resultado esperado: malicioso BLOQUEADO, legítimo ACEPTADO"
