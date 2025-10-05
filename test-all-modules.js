#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so';

const modules = [
    { name: 'Main Platform', path: '/', expectedContent: 'GrandPro HMSO Platform' },
    { name: 'Digital Sourcing', path: '/digital-sourcing', expectedContent: 'Digital Sourcing' },
    { name: 'CRM', path: '/crm', expectedContent: 'CRM System' },
    { name: 'HMS', path: '/hms', expectedContent: 'Hospital Management System' },
    { name: 'Command Centre', path: '/command-centre', expectedContent: 'Operations Command' },
    { name: 'Analytics', path: '/analytics', expectedContent: 'Data & Analytics' },
    { name: 'Partners', path: '/partners', expectedContent: 'Partner & Ecosystem' }
];

const apiEndpoints = [
    { name: 'HMS Stats', path: '/hms/api/hms/stats', method: 'GET' },
    { name: 'CRM Patients', path: '/crm/api/crm/patients', method: 'GET' },
    { name: 'Sourcing Applications', path: '/digital-sourcing/api/sourcing/applications', method: 'GET' },
    { name: 'Command Metrics', path: '/command-centre/api/command/metrics', method: 'GET' },
    { name: 'Analytics Metrics', path: '/analytics/api/analytics/metrics', method: 'GET' },
    { name: 'Partners Status', path: '/partners/api/partners/status', method: 'GET' }
];

function testUrl(url, expectedContent = null) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const success = res.statusCode === 200;
                const hasContent = expectedContent ? data.includes(expectedContent) : true;
                
                resolve({
                    url,
                    statusCode: res.statusCode,
                    success,
                    hasExpectedContent: hasContent,
                    contentLength: data.length
                });
            });
        }).on('error', (err) => {
            resolve({
                url,
                statusCode: 0,
                success: false,
                error: err.message
            });
        });
    });
}

async function runTests() {
    console.log('\\n🏥 GrandPro HMSO Platform - Comprehensive Module Test');
    console.log('=' . repeat(60));
    
    // Test main modules
    console.log('\\n📊 Testing Main Modules:');
    console.log('-' . repeat(40));
    
    for (const module of modules) {
        const result = await testUrl(BASE_URL + module.path, module.expectedContent);
        const status = result.success && result.hasExpectedContent ? '✅' : '❌';
        console.log(`${status} ${module.name.padEnd(20)} - Status: ${result.statusCode} - Content: ${result.hasExpectedContent ? 'Valid' : 'Invalid'}`);
    }
    
    // Test API endpoints
    console.log('\\n🔌 Testing API Endpoints:');
    console.log('-' . repeat(40));
    
    for (const endpoint of apiEndpoints) {
        const result = await testUrl(BASE_URL + endpoint.path);
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${endpoint.name.padEnd(20)} - Status: ${result.statusCode}`);
    }
    
    // Test forms functionality
    console.log('\\n📝 Testing Interactive Features:');
    console.log('-' . repeat(40));
    
    const interactiveTests = [
        { name: 'HMS Patient Form', url: BASE_URL + '/hms', check: 'newPatientModal' },
        { name: 'CRM Campaign Form', url: BASE_URL + '/crm', check: 'createCampaign' },
        { name: 'Sourcing Application', url: BASE_URL + '/digital-sourcing', check: 'applicationForm' },
        { name: 'Command Alerts', url: BASE_URL + '/command-centre', check: 'alertsContainer' }
    ];
    
    for (const test of interactiveTests) {
        const result = await testUrl(test.url, test.check);
        const status = result.success && result.hasExpectedContent ? '✅' : '❌';
        console.log(`${status} ${test.name.padEnd(20)} - ${result.hasExpectedContent ? 'Form Present' : 'Form Missing'}`);
    }
    
    // Summary
    console.log('\\n' + '=' . repeat(60));
    console.log('📋 Test Summary:');
    console.log(`   - Main Modules: ${modules.length} tested`);
    console.log(`   - API Endpoints: ${apiEndpoints.length} tested`);
    console.log(`   - Interactive Features: ${interactiveTests.length} tested`);
    console.log('\\n✨ Platform URL: ' + BASE_URL);
    console.log('=' . repeat(60) + '\\n');
}

// Run the tests
runTests().catch(console.error);
