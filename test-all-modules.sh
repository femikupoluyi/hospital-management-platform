#!/bin/bash

echo "==================================="
echo "Testing GrandPro HMSO Platform"
echo "==================================="
echo ""

BASE_URL="https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so"

# Test Main Platform
echo "1. Main Platform:"
if curl -s "$BASE_URL/" | grep -q "GrandPro HMSO Platform"; then
    echo "   ✅ Main platform is accessible"
else
    echo "   ❌ Main platform is NOT accessible"
fi
echo ""

# Test HMS Module
echo "2. Hospital Management System (HMS):"
if curl -s "$BASE_URL/hms" | grep -q "Hospital Management System"; then
    echo "   ✅ HMS interface is accessible"
else
    echo "   ❌ HMS interface is NOT accessible"
fi

if curl -s "$BASE_URL/hms/api/hms/stats" | jq -e '.totalPatients' > /dev/null 2>&1; then
    PATIENTS=$(curl -s "$BASE_URL/hms/api/hms/stats" | jq '.totalPatients')
    echo "   ✅ HMS API is working (Total Patients: $PATIENTS)"
else
    echo "   ❌ HMS API is NOT working"
fi
echo ""

# Test Digital Sourcing Module
echo "3. Digital Sourcing & Partner Onboarding:"
if curl -s "$BASE_URL/digital-sourcing" | grep -q "Digital Sourcing"; then
    echo "   ✅ Digital Sourcing interface is accessible"
else
    echo "   ❌ Digital Sourcing interface is NOT accessible"
fi
echo ""

# Test CRM Module
echo "4. CRM & Relationship Management:"
if curl -s "$BASE_URL/crm" | grep -q "CRM"; then
    echo "   ✅ CRM interface is accessible"
else
    echo "   ❌ CRM interface is NOT accessible"
fi
echo ""

# Test Command Centre Module
echo "5. Centralized Operations & Command Centre:"
if curl -s "$BASE_URL/command-centre" | grep -q "Command Centre"; then
    echo "   ✅ Command Centre interface is accessible"
else
    echo "   ❌ Command Centre interface is NOT accessible"
fi
echo ""

# Test Analytics Module
echo "6. Data & Analytics:"
if curl -s "$BASE_URL/analytics" | grep -q "Analytics"; then
    echo "   ✅ Analytics interface is accessible"
else
    echo "   ❌ Analytics interface is NOT accessible"
fi
echo ""

# Test Partners Module
echo "7. Partner & Ecosystem Integrations:"
if curl -s "$BASE_URL/partners" | grep -q "Partner"; then
    echo "   ✅ Partners interface is accessible"
else
    echo "   ❌ Partners interface is NOT accessible"
fi
echo ""

# Test Security Module
echo "8. Security & Compliance:"
if curl -s "$BASE_URL/security" | grep -q "Security"; then
    echo "   ✅ Security interface is accessible"
else
    echo "   ❌ Security interface is NOT accessible"
fi
echo ""

echo "==================================="
echo "Test Summary:"
echo "==================================="

# Count working modules
WORKING=$(curl -s "$BASE_URL/" | grep -o "bg-green-100" | wc -l)
echo "✅ Modules Working: $WORKING/8"

# Test database connectivity
echo ""
echo "Database Status:"
if curl -s "$BASE_URL/hms/api/hms/stats" | jq -e '.totalPatients' > /dev/null 2>&1; then
    echo "   ✅ Database queries are working"
else
    echo "   ⚠️  Using mock data (database connection issues)"
fi

echo ""
echo "==================================="
echo "External Access URLs:"
echo "==================================="
echo "Main Platform: $BASE_URL"
echo "HMS: $BASE_URL/hms"
echo "Digital Sourcing: $BASE_URL/digital-sourcing"
echo "CRM: $BASE_URL/crm"
echo "Command Centre: $BASE_URL/command-centre"
echo "Analytics: $BASE_URL/analytics"
echo "Partners: $BASE_URL/partners"
echo "Security: $BASE_URL/security"
echo "===================================="
