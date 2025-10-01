module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: './backend/backend-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: 'unified-frontend',
      script: './frontend/unified/unified-frontend-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 12000
      }
    },
    {
      name: 'hms-module',
      script: './modules/hms/hms-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: 'occ-dashboard',
      script: './modules/occ/occ-enhanced-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: 'partner-integration',
      script: './modules/partner-integration/partner-api-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 9000,
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: 'analytics-ml',
      script: './modules/analytics/analytics-ml-standalone.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 11000,
        DATABASE_URL: process.env.DATABASE_URL
      }
    },
    {
      name: 'api-docs',
      script: './backend/api/api-docs.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'hospital-onboarding',
      script: 'npm',
      args: 'start',
      cwd: './hospital-onboarding',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'crm-system',
      script: './hospital-onboarding/src/server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 10001,
        DATABASE_URL: process.env.DATABASE_URL
      }
    }
  ]
};
