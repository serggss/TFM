#!/bin/bash
echo "=== Exceptions Partial: Fail-open con X-User-Id no numérico ==="
echo "Enviando X-User-Id: abc (provoca NumberFormatException):"
echo ""
curl -s -H "X-User-Id: abc" \
  http://localhost:8080/api/exceptions/partial/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — isAuthorized defaulted to true, excepción no corregida"
echo ""
echo "=== Comparar con un usuario normal (debería bloquear) ==="
curl -s -H "X-User-Id: 2" \
  http://localhost:8080/api/exceptions/partial/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: 403 ATTACK_BLOCKED (Roberto no es admin)"
