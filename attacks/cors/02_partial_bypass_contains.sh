#!/bin/bash
echo "=== CORS Partial: Bypass con contains('localhost') ==="
echo ""
echo "--- Origin legítimo ---"
curl -s -H "Origin: http://localhost:5173" \
  http://localhost:8080/api/cors/partial/data | python -m json.tool | grep -E "verdict|Access-Control"

echo ""
echo "--- Origin con bypass (contiene 'localhost') ---"
curl -s -H "Origin: https://localhost.evil.com" \
  http://localhost:8080/api/cors/partial/data | python -m json.tool | grep -E "verdict|Access-Control"

echo ""
echo "Resultado esperado: ambos aceptados — 'localhost.evil.com' contiene 'localhost'"
