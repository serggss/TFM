#!/bin/bash
# Ataque BOLA — Estado FIXED — Todos los vectores bloqueados

echo "=== BOLA Fixed: Acceso directo ==="
curl -s -H "X-User-Id: 2" \
  http://localhost:8080/api/bola/fixed/accounts/1 | python -m json.tool

echo ""
echo "=== BOLA Fixed: Intento de bypass via búsqueda ==="
curl -s -H "X-User-Id: 2" \
  "http://localhost:8080/api/bola/fixed/accounts?ownerId=1" | python -m json.tool

echo ""
echo "Resultado esperado: Ambos bloqueados. La búsqueda devuelve solo cuentas de Bob."
