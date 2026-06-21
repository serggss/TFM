#!/bin/bash
echo "=== CORS Vulnerable: Origin malicioso reflejado ==="
curl -s -v -H "Origin: https://evil.com" \
  http://localhost:8080/api/cors/vulnerable/data 2>&1 | grep -E "Access-Control|ATTACK|oracle"

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — Access-Control-Allow-Origin: https://evil.com"
