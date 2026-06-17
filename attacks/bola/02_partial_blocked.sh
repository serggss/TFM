#!/bin/bash
# Ataque BOLA — Estado PARTIAL — Acceso directo BLOQUEADO
# El endpoint individual está protegido

echo "=== BOLA Partial: Acceso directo (bloqueado) ==="
echo "Bob (user 2) intenta ver la cuenta #1 por ID directo:"
echo ""

curl -s -H "X-User-Id: 2" \
  http://localhost:8080/api/bola/partial/accounts/1 | python -m json.tool

echo ""
echo "Resultado esperado: 403 Forbidden / ATTACK_BLOCKED"
