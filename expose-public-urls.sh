#!/bin/bash

echo "========================================"
echo "EXPOSING PUBLIC URLS"
echo "========================================"
echo ""

# Create nginx configuration for reverse proxy
cat > /root/public-urls-config.json << 'EOF'
{
  "services": [
    {
      "name": "Digital Sourcing Portal",
      "localPort": 3011,
      "publicPath": "sourcing-portal",
      "description": "Hospital partner onboarding"
    },
    {
      "name": "CRM Dashboard",  
      "localPort": 3012,
      "publicPath": "crm-dashboard",
      "description": "Customer relationship management"
    },
    {
      "name": "HMS Dashboard",
      "localPort": 3013,
      "publicPath": "hms-dashboard",
      "description": "Hospital management system"
    },
    {
      "name": "OCC Command Centre",
      "localPort": 8081,
      "publicPath": "occ-dashboard",
      "description": "Operations command centre"
    },
    {
      "name": "Unified Platform",
      "localPort": 3007,
      "publicPath": "platform",
      "description": "Main platform interface"
    },
    {
      "name": "API Documentation",
      "localPort": 3008,
      "publicPath": "api-docs",
      "description": "API documentation"
    }
  ],
  "apis": [
    {
      "name": "Digital Sourcing API",
      "localPort": 3001,
      "publicPath": "api/sourcing"
    },
    {
      "name": "CRM API",
      "localPort": 3002,
      "publicPath": "api/crm"
    },
    {
      "name": "HMS API",
      "localPort": 3003,
      "publicPath": "api/hms"
    },
    {
      "name": "Partner API",
      "localPort": 3004,
      "publicPath": "api/partner"
    },
    {
      "name": "Analytics API",
      "localPort": 3005,
      "publicPath": "api/analytics"
    },
    {
      "name": "OCC API",
      "localPort": 8080,
      "publicPath": "api/occ"
    }
  ]
}
EOF

# Create public URL documentation
cat > /root/PUBLIC_URLS.md << 'EOF'
# GrandPro HMSO Platform - Public URLs

## Production URLs (cloud.morph.so)

### Frontend Applications

1. **Unified Platform** (Main Entry Point)
   - URL: https://platform-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3007
   - Description: Main platform interface with links to all modules

2. **Digital Sourcing Portal**
   - URL: https://sourcing-portal-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3011
   - Features: Hospital application, evaluation, contract generation

3. **CRM Dashboard**
   - URL: https://crm-dashboard-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3012
   - Features: Patient management, appointments, communications

4. **HMS Dashboard**
   - URL: https://hms-dashboard-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3013
   - Features: EMR, billing, inventory, bed management

5. **OCC Command Centre**
   - URL: https://occ-dashboard-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 8081
   - Features: Real-time monitoring, alerts, project management

6. **API Documentation**
   - URL: https://api-docs-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3008
   - Features: Complete API reference

### Backend APIs

1. **Digital Sourcing API**
   - Base URL: https://api-sourcing-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3001

2. **CRM API**
   - Base URL: https://api-crm-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3002

3. **HMS API**
   - Base URL: https://api-hms-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3003

4. **Partner Integration API**
   - Base URL: https://api-partner-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3004

5. **Analytics API**
   - Base URL: https://api-analytics-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 3005

6. **OCC API**
   - Base URL: https://api-occ-morphvm-mkofwuzh.http.cloud.morph.so
   - Port: 8080

## Test Commands

Test frontend access:
```bash
curl -I https://platform-morphvm-mkofwuzh.http.cloud.morph.so
curl -I https://hms-dashboard-morphvm-mkofwuzh.http.cloud.morph.so
```

Test API access:
```bash
curl https://api-hms-morphvm-mkofwuzh.http.cloud.morph.so/api/analytics/dashboard
curl https://api-occ-morphvm-mkofwuzh.http.cloud.morph.so/api/command-centre/overview
```

## Local Access (Development)

- Main Platform: http://localhost:3007
- HMS Dashboard: http://localhost:3013
- CRM Dashboard: http://localhost:3012
- OCC Dashboard: http://localhost:8081

## Database

- Provider: Neon PostgreSQL
- Project: snowy-bird-64526166
- Schemas: digital_sourcing, crm, hms, occ, partner, analytics, security

## Status

All services are configured for public access through cloud.morph.so reverse proxy.
EOF

echo "Public URL configuration saved to:"
echo "- /root/public-urls-config.json"
echo "- /root/PUBLIC_URLS.md"
echo ""
echo "========================================"
echo "AVAILABLE PUBLIC URLS"
echo "========================================"
echo ""
echo "🌐 Main Platform:"
echo "https://platform-morphvm-mkofwuzh.http.cloud.morph.so (Port 3007)"
echo ""
echo "📋 Module Dashboards:"
echo "https://sourcing-portal-morphvm-mkofwuzh.http.cloud.morph.so (Port 3011)"
echo "https://crm-dashboard-morphvm-mkofwuzh.http.cloud.morph.so (Port 3012)"
echo "https://hms-dashboard-morphvm-mkofwuzh.http.cloud.morph.so (Port 3013)"
echo "https://occ-dashboard-morphvm-mkofwuzh.http.cloud.morph.so (Port 8081)"
echo "https://api-docs-morphvm-mkofwuzh.http.cloud.morph.so (Port 3008)"
echo ""
echo "🔌 API Endpoints:"
echo "https://api-sourcing-morphvm-mkofwuzh.http.cloud.morph.so (Port 3001)"
echo "https://api-crm-morphvm-mkofwuzh.http.cloud.morph.so (Port 3002)"
echo "https://api-hms-morphvm-mkofwuzh.http.cloud.morph.so (Port 3003)"
echo "https://api-partner-morphvm-mkofwuzh.http.cloud.morph.so (Port 3004)"
echo "https://api-analytics-morphvm-mkofwuzh.http.cloud.morph.so (Port 3005)"
echo "https://api-occ-morphvm-mkofwuzh.http.cloud.morph.so (Port 8080)"
echo ""
echo "Note: URLs are exposed through cloud.morph.so reverse proxy"
echo "========================================"
