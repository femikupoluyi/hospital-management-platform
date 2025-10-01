# Hospital Onboarding Portal - Deployment Guide

## Prerequisites
- Node.js v20 LTS or higher
- PostgreSQL database (Neon or self-hosted)
- npm or yarn package manager
- Git for version control

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hospital-onboarding
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file with the following variables:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Document Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# Digital Signature Integration
SIGNATURE_API_KEY=your_signature_api_key
SIGNATURE_API_SECRET=your_signature_api_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
FROM_EMAIL=noreply@grandpro-hmso.com

# Security
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
```

### 4. Database Setup
The application will automatically create tables on first run, but you can also run migrations manually:

```sql
-- Run the SQL scripts in the following order:
-- 1. Create schemas
-- 2. Create tables
-- 3. Insert evaluation criteria
```

### 5. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to access the application.

## Production Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Using Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t hospital-onboarding .
docker run -p 3000:3000 --env-file .env.local hospital-onboarding
```

## Database Connection

### Using Neon (Recommended)
1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update DATABASE_URL in .env.local

### Using Local PostgreSQL
1. Install PostgreSQL 15 or higher
2. Create a database:
```sql
CREATE DATABASE hospital_onboarding;
```
3. Update DATABASE_URL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/hospital_onboarding
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Authentication Headers (when implemented)
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Core Endpoints

#### Submit Application
```http
POST /api/applications
Content-Type: application/json

{
  "owner": {
    "owner_type": "company",
    "name": "Hospital Owner Name",
    "email": "owner@email.com",
    "phone": "+233244123456",
    "address": "123 Main St",
    "city": "Accra",
    "state": "Greater Accra",
    "country": "Ghana"
  },
  "hospital": {
    "name": "Hospital Name",
    "type": "general",
    "address": "456 Hospital Rd",
    "city": "Accra",
    "state": "Greater Accra",
    "phone": "+233244987654",
    "email": "hospital@email.com",
    "bed_capacity": 100,
    "staff_count": 50,
    "license_number": "GHS-2024-001"
  }
}
```

#### Score Application
```http
POST /api/applications/{id}/score
```

#### Generate Contract
```http
POST /api/contracts
Content-Type: application/json

{
  "application_id": "uuid-here"
}
```

#### Get Dashboard Metrics
```http
GET /api/dashboard
```

## Monitoring & Maintenance

### Health Check Endpoint
```http
GET /api/health
```

### Database Maintenance
```sql
-- Vacuum and analyze tables periodically
VACUUM ANALYZE onboarding.applications;
VACUUM ANALYZE onboarding.evaluation_scores;
VACUUM ANALYZE onboarding.contracts;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('organization', 'onboarding')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Log Monitoring
- Application logs: Check console output or log files
- Database logs: Monitor PostgreSQL logs for slow queries
- Error tracking: Implement Sentry or similar service

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Implement request validation
- [ ] Enable SQL injection protection
- [ ] Configure CSP headers
- [ ] Set up backup strategy
- [ ] Implement audit logging
- [ ] Configure firewall rules

## Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: Connection refused
Solution: Check DATABASE_URL and ensure PostgreSQL is running
```

#### Port Already in Use
```
Error: EADDRINUSE: address already in use
Solution: Kill the process using port 3000 or use a different port
```

#### Module Not Found
```
Error: Cannot find module
Solution: Delete node_modules and run npm install
```

## Performance Optimization

### Database Indexes
Already configured indexes:
- applications(status)
- applications(owner_id)
- documents(application_id)
- evaluation_scores(application_id)
- contracts(application_id)

### Caching Strategy
- Implement Redis for session management
- Cache dashboard metrics (5-minute TTL)
- Cache evaluation criteria (1-hour TTL)

### CDN Configuration
- Serve static assets from CDN
- Enable browser caching
- Compress responses with gzip

## Backup & Recovery

### Database Backup
```bash
# Backup
pg_dump -h localhost -U username -d hospital_onboarding > backup.sql

# Restore
psql -h localhost -U username -d hospital_onboarding < backup.sql
```

### Application Backup
- Use Git for code versioning
- Backup .env files separately
- Document storage backup (when implemented)

## Support & Resources

- Documentation: /ONBOARDING_MODULE.md
- Architecture: /ARCHITECTURE.md
- API Reference: /api-docs
- Issues: GitHub Issues
- Email: support@grandpro-hmso.com

## Version Information
- Current Version: 1.0.0
- Node.js: 20.x LTS
- Next.js: 15.5.4
- PostgreSQL: 15+
- Last Updated: September 2025
