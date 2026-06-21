#!/bin/bash
echo "=== Exceptions Fixed: Fail-closed ==="
echo "Enviando X-User-Id: abc (misma excepción, pero ahora falla cerrado):"
echo ""
curl -s -H "X-User-Id: abc" \
  http://localhost:8080/api/exceptions/fixed/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: 403 ATTACK_BLOCKED — isAuthorized defaulted to false"
echo ""
echo "=== Solo admin (id=4) tiene acceso ==="
curl -s -H "X-User-Id: 4" \
  http://localhost:8080/api/exceptions/fixed/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: LEGITIMATE_ACCESS"
