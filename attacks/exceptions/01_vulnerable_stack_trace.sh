#!/bin/bash
echo "=== Exceptions Vulnerable: Sin auth + stack traces ==="
curl -s http://localhost:8080/api/exceptions/vulnerable/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — config admin expuesta sin autenticación"
