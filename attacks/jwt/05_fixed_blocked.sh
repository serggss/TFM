#!/bin/bash
echo "=== JWT Fixed: Token forjado rechazado ==="
FORGED=$(curl -s http://localhost:8080/api/auth/forge-none/2 | python -c "import sys,json; print(json.load(sys.stdin)['forgedToken'])")

echo "Token forjado: ${FORGED:0:50}..."
echo ""
curl -s -H "X-Auth-Token: $FORGED" \
  http://localhost:8080/api/jwt/fixed/profile | python -m json.tool

echo ""
echo "Resultado esperado: 403 ATTACK_BLOCKED (fixed rechaza alg=none)"
