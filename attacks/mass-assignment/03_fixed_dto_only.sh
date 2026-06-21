#!/bin/bash
echo "=== Mass Assignment Fixed: Solo acepta name/email/bio ==="

# Resetear primero
curl -s -X POST http://localhost:8080/api/mass-assignment/fixed/profile/2/reset > /dev/null

echo "Enviando todos los campos (role, balance, discount, verified):"
echo ""
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Roberto Actualizado","email":"nuevo@email.com","bio":"Bio nueva","role":"admin","balance":999999,"discount":99.9,"verified":true}' \
  http://localhost:8080/api/mass-assignment/fixed/profile/2 | python -m json.tool

echo ""
echo "Resultado esperado: LEGITIMATE_ACCESS — solo name/email/bio cambian, role sigue 'user'"
