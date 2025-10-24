#!/usr/bin/env bash

echo "🧪 Running k6 load test..."
echo "Target: http://localhost:3001"
echo ""

docker run --rm -i --network=host \
  -e BASE_URL=http://localhost:3001 \
  -v "$PWD":/tests \
  grafana/k6:latest run /tests/quest-claim.js

echo ""
echo "✅ Load test complete!"
