#!/bin/bash

BASE_URL="https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so"

echo "🏥 Testing GrandPro HMSO Platform - All Modules"
echo "=============================================="

# Test main platform
echo -e "\n📊 Main Platform"
echo "Testing: $BASE_URL"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$STATUS" = "200" ]; then
    echo "✅ Main platform: OK (Status: $STATUS)"
else
    echo "❌ Main platform: Failed (Status: $STATUS)"
fi

# Test each module
declare -A modules=(
    ["Digital Sourcing"]="/digital-sourcing"
    ["CRM System"]="/crm"
    ["Hospital Management"]="/hms"
    ["Command Centre"]="/command-centre"
    ["Analytics"]="/analytics"
    ["Partners"]="/partners"
)

echo -e "\n📊 Testing Modules"
echo "==================="
for module in "${!modules[@]}"; do
    path="${modules[$module]}"
    url="${BASE_URL}${path}"
    echo -e "\nTesting $module: $url"
    
    # Test module main page
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ Module page: OK (Status: $STATUS)"
        
        # Get page content and check for key elements
        CONTENT=$(curl -s "$url")
        
        # Check if it's not just a loading page
        if echo "$CONTENT" | grep -q "Module Starting Up"; then
            echo "  ⚠️  Module is still initializing"
        else
            # Check for forms or interactive elements
            if echo "$CONTENT" | grep -q "<form"; then
                echo "  ✅ Forms detected"
            fi
            
            if echo "$CONTENT" | grep -q "<button"; then
                echo "  ✅ Interactive buttons detected"
            fi
            
            if echo "$CONTENT" | grep -q "onclick"; then
                echo "  ✅ JavaScript functionality detected"
            fi
        fi
    else
        echo "  ❌ Module page: Failed (Status: $STATUS)"
    fi
done

# Test API endpoints
echo -e "\n📊 Testing API Endpoints"
echo "========================"

# Health check
echo -e "\nHealth API: ${BASE_URL}/api/health"
HEALTH=$(curl -s "${BASE_URL}/api/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "  ✅ Health API: OK"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null | head -10 || echo "$HEALTH" | head -100
fi

# Test specific module APIs
echo -e "\n📊 Testing Module-Specific APIs"
echo "================================"

# Digital Sourcing API
echo -e "\nDigital Sourcing API:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/digital-sourcing/api/applications")
echo "  Applications endpoint: Status $API_STATUS"

# CRM API
echo -e "\nCRM API:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/crm/api/owners")
echo "  Owners endpoint: Status $API_STATUS"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/crm/api/patients")
echo "  Patients endpoint: Status $API_STATUS"

# HMS API
echo -e "\nHMS API:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/hms/api/patients")
echo "  Patients endpoint: Status $API_STATUS"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/hms/api/billing/invoices")
echo "  Billing endpoint: Status $API_STATUS"

# Command Centre API
echo -e "\nCommand Centre API:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/command-centre/api/command/stats")
echo "  Stats endpoint: Status $API_STATUS"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/command-centre/api/command/alerts")
echo "  Alerts endpoint: Status $API_STATUS"

echo -e "\n=============================================="
echo "Test completed!"
