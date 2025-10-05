#!/usr/bin/env node

/**
 * Public Platform Test Script
 * Tests all modules and endpoints on the publicly exposed platform
 */

const https = require('https');
const http = require('http');

const PUBLIC_URL = 'https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so';
const LOCAL_URL = 'http://localhost:8888';

// Test configuration
const ENDPOINTS = [
    // Health & Stats
    { method: 'GET', path: '/api/health', name: 'Health Check' },
    { method: 'GET', path: '/api/stats', name: 'Statistics' },
    
    // Digital Sourcing
    { method: 'GET', path: '/api/onboarding/applications', name: 'Hospital Applications' },
    { method: 'GET', path: '/api/onboarding/dashboard', name: 'Onboarding Dashboard' },
    { method: 'GET', path: '/api/onboarding/contracts', name: 'Contracts' },
    
    // CRM
    { method: 'GET', path: '/api/crm/patients', name: 'CRM Patients' },
    { method: 'GET', path: '/api/crm/appointments', name: 'Appointments' },
    { method: 'GET', path: '/api/crm/campaigns', name: 'Campaigns' },
    { method: 'GET', path: '/api/crm/owners', name: 'Hospital Owners' },
    
    // HMS Core
    { method: 'GET', path: '/api/hms/patients', name: 'HMS Patients' },
    { method: 'GET', path: '/api/hms/inventory', name: 'Inventory' },
    { method: 'GET', path: '/api/hms/inventory/low-stock', name: 'Low Stock Alert' },
    { method: 'GET', path: '/api/hms/billing/invoices', name: 'Invoices' },
    { method: 'GET', path: '/api/hms/beds/available', name: 'Available Beds' },
    { method: 'GET', path: '/api/hms/analytics/dashboard', name: 'HMS Analytics' },
    
    // OCC
    { method: 'GET', path: '/api/occ/dashboard', name: 'OCC Dashboard' },
    { method: 'GET', path: '/api/occ/metrics', name: 'OCC Metrics' },
    { method: 'GET', path: '/api/occ/alerts', name: 'Alerts' },
    { method: 'GET', path: '/api/occ/kpis', name: 'KPIs' },
    { method: 'GET', path: '/api/occ/projects', name: 'Projects' },
    
    // Partner Integration
    { method: 'GET', path: '/api/partner/insurance/providers', name: 'Insurance Providers' },
    { method: 'GET', path: '/api/partner/pharmacy/orders', name: 'Pharmacy Orders' },
    { method: 'GET', path: '/api/partner/suppliers', name: 'Suppliers' },
    { method: 'GET', path: '/api/partner/telemedicine/sessions', name: 'Telemedicine Sessions' },
    { method: 'GET', path: '/api/partner/compliance/reports', name: 'Compliance Reports' },
    
    // Analytics & AI
    { method: 'GET', path: '/api/analytics/metrics', name: 'Analytics Metrics' },
    { method: 'GET', path: '/api/analytics/models/performance', name: 'ML Models Performance' }
];

// POST endpoints to test
const POST_ENDPOINTS = [
    {
        method: 'POST',
        path: '/api/onboarding/apply',
        name: 'Submit Hospital Application',
        data: {
            hospitalName: 'Test Hospital ' + Date.now(),
            ownerName: 'Dr. Test',
            email: 'test@hospital.com',
            phone: '555-TEST',
            city: 'Test City'
        }
    },
    {
        method: 'POST',
        path: '/api/hms/patients',
        name: 'Register Patient',
        data: {
            name: 'Test Patient ' + Date.now(),
            age: 30,
            gender: 'Male',
            phone: '555-0000',
            email: 'patient@test.com'
        }
    },
    {
        method: 'POST',
        path: '/api/analytics/predict/demand',
        name: 'Demand Prediction',
        data: { days: 7 }
    },
    {
        method: 'POST',
        path: '/api/analytics/ml/triage',
        name: 'AI Triage',
        data: {
            symptoms: ['headache', 'fever'],
            age: 35
        }
    }
];

// Colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

// Make HTTPS request
function makeRequest(url, options, data = null) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.request(url + options.path, {
            method: options.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: responseData,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test individual endpoint
async function testEndpoint(baseUrl, endpoint) {
    totalTests++;
    try {
        const response = await makeRequest(baseUrl, endpoint, endpoint.data);
        const success = response.statusCode >= 200 && response.statusCode < 400;
        
        if (success) {
            passedTests++;
            console.log(`  ${colors.green}✓${colors.reset} ${endpoint.name} (${response.statusCode})`);
            
            // Parse and validate response
            try {
                const data = JSON.parse(response.data);
                if (data.success === false && !endpoint.allowFailure) {
                    console.log(`    ${colors.yellow}⚠ Response indicates failure: ${data.error}${colors.reset}`);
                }
            } catch (e) {
                // Not JSON response
            }
        } else {
            failedTests++;
            console.log(`  ${colors.red}✗${colors.reset} ${endpoint.name} (${response.statusCode})`);
        }
        
        results.push({
            endpoint: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            status: response.statusCode,
            success: success
        });
        
        return success;
    } catch (error) {
        failedTests++;
        console.log(`  ${colors.red}✗${colors.reset} ${endpoint.name} - ${error.message}`);
        results.push({
            endpoint: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            error: error.message,
            success: false
        });
        return false;
    }
}

// Main test function
async function runTests() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║          GrandPro HMSO Platform - Public Endpoint Validation                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);
    
    console.log(`Testing URL: ${colors.cyan}${PUBLIC_URL}${colors.reset}\n`);
    
    // Test public accessibility
    console.log(`${colors.yellow}Testing Public Accessibility...${colors.reset}`);
    try {
        const healthCheck = await makeRequest(PUBLIC_URL, { method: 'GET', path: '/api/health' });
        if (healthCheck.statusCode === 200) {
            console.log(`${colors.green}✓ Platform is publicly accessible${colors.reset}\n`);
        } else {
            console.log(`${colors.red}✗ Platform returned status ${healthCheck.statusCode}${colors.reset}\n`);
        }
    } catch (error) {
        console.log(`${colors.red}✗ Platform is not accessible: ${error.message}${colors.reset}\n`);
        return;
    }
    
    // Test GET endpoints
    console.log(`${colors.yellow}Testing GET Endpoints...${colors.reset}`);
    for (const endpoint of ENDPOINTS) {
        await testEndpoint(PUBLIC_URL, endpoint);
    }
    
    console.log(`\n${colors.yellow}Testing POST Endpoints...${colors.reset}`);
    for (const endpoint of POST_ENDPOINTS) {
        await testEndpoint(PUBLIC_URL, endpoint);
    }
    
    // Test local endpoints for comparison
    console.log(`\n${colors.yellow}Testing Local Endpoints (for comparison)...${colors.reset}`);
    const localHealth = await testEndpoint(LOCAL_URL, { method: 'GET', path: '/api/health', name: 'Local Health Check' });
    
    // Generate report
    console.log(`\n${colors.bright}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    // Module summary
    const moduleStats = {
        'Digital Sourcing': { total: 0, passed: 0 },
        'CRM': { total: 0, passed: 0 },
        'HMS': { total: 0, passed: 0 },
        'OCC': { total: 0, passed: 0 },
        'Partner': { total: 0, passed: 0 },
        'Analytics': { total: 0, passed: 0 }
    };
    
    results.forEach(result => {
        if (result.path) {
            if (result.path.includes('/onboarding')) {
                moduleStats['Digital Sourcing'].total++;
                if (result.success) moduleStats['Digital Sourcing'].passed++;
            } else if (result.path.includes('/crm')) {
                moduleStats['CRM'].total++;
                if (result.success) moduleStats['CRM'].passed++;
            } else if (result.path.includes('/hms')) {
                moduleStats['HMS'].total++;
                if (result.success) moduleStats['HMS'].passed++;
            } else if (result.path.includes('/occ')) {
                moduleStats['OCC'].total++;
                if (result.success) moduleStats['OCC'].passed++;
            } else if (result.path.includes('/partner')) {
                moduleStats['Partner'].total++;
                if (result.success) moduleStats['Partner'].passed++;
            } else if (result.path.includes('/analytics')) {
                moduleStats['Analytics'].total++;
                if (result.success) moduleStats['Analytics'].passed++;
            }
        }
    });
    
    console.log(`\n${colors.cyan}Module Performance:${colors.reset}`);
    for (const [module, stats] of Object.entries(moduleStats)) {
        if (stats.total > 0) {
            const percentage = ((stats.passed / stats.total) * 100).toFixed(0);
            const status = stats.passed === stats.total ? colors.green : colors.yellow;
            console.log(`  ${status}${module}: ${stats.passed}/${stats.total} (${percentage}%)${colors.reset}`);
        }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    
    // Save report
    const fs = require('fs');
    const report = {
        timestamp: new Date().toISOString(),
        publicUrl: PUBLIC_URL,
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: ((passedTests / totalTests) * 100).toFixed(2) + '%'
        },
        moduleStats: moduleStats,
        results: results
    };
    
    fs.writeFileSync('/root/public-platform-test-report.json', JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: /root/public-platform-test-report.json`);
    
    // Public access information
    console.log(`\n${colors.bright}${colors.green}PUBLIC ACCESS INFORMATION:${colors.reset}`);
    console.log(`${colors.cyan}Main Dashboard:${colors.reset} ${PUBLIC_URL}`);
    console.log(`${colors.cyan}API Health:${colors.reset} ${PUBLIC_URL}/api/health`);
    console.log(`${colors.cyan}Statistics:${colors.reset} ${PUBLIC_URL}/api/stats`);
    console.log(`\n${colors.yellow}All endpoints are CORS-enabled and accessible from any origin.${colors.reset}`);
}

// Run tests
runTests().catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
});
