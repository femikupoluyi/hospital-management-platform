#!/bin/bash

echo "Testing Analytics Platform External Access"
echo "=========================================="

URL="https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so/analytics"

echo "Testing main analytics page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
echo "Main page status: $STATUS"

echo -e "\nTesting predictive analytics APIs..."
curl -s "$URL/api/analytics/predictions/patient-demand?hospitalId=HOSP001&days=3" | python3 -m json.tool | head -10

echo -e "\nTesting AI model APIs..."
curl -s -X POST "$URL/api/analytics/ai/triage" \
  -H "Content-Type: application/json" \
  -d '{"symptoms":"headache and fever","age":30,"gender":"Female"}' | python3 -m json.tool | head -10

echo -e "\nAnalytics platform is accessible at: $URL"
