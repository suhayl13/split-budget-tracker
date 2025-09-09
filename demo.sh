#!/usr/bin/env bash
set -e

echo "Reset…"
curl -s -X POST http://localhost:3000/reset -H "Content-Type: application/json" -d '{}' | jq

echo "Initial users…"
curl -s http://localhost:3000/users | jq

echo "A pays \$120 food…"
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"paidBy":"A","total":120,"category":"food","note":"Dinner"}' | jq

echo "Users after expense…"
curl -s http://localhost:3000/users | jq

echo "How much does B owe A? (check net)…"
curl -s http://localhost:3000/users | jq '.users[] | {id, netBetweenUsers}'

echo "B settles full…"
curl -s -X POST http://localhost:3000/settle \
  -H "Content-Type: application/json" \
  -d '{"from":"B","to":"A"}' | jq

echo "Users after settlement…"
curl -s http://localhost:3000/users | jq

echo "All journal transactions…"
curl -s http://localhost:3000/transactions | jq
