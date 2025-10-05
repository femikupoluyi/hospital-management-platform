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
