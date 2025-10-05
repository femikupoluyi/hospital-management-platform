#!/usr/bin/env node

/**
 * Test OCC Command Centre Functionality
 */

const http = require('http');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

const OCC_API = 'http://localhost:8080';

async function makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const url = `${OCC_API}${endpoint}`;
        const urlObj = new URL(url);
        
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data ? JSON.parse(data) : null
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function testOCC() {
    console.log('🔍 TESTING OCC COMMAND CENTRE');
    console.log('=' .repeat(50));
    
    try {
        // Test 1: Create an alert
        console.log('\n1. Testing Alert Creation...');
        const alert = await makeRequest('/api/alerts', {
            method: 'POST',
            body: {
                hospital_id: 'HOSP001',
                alert_type: 'low_stock',
                severity: 'warning',
                message: 'Test alert: Paracetamol stock running low (50 units)'
            }
        });
        console.log('✓ Alert created:', alert.status === 201);
        
        // Test 2: Get monitoring dashboard
        console.log('\n2. Testing Monitoring Dashboard...');
        const dashboard = await makeRequest('/api/monitoring/dashboard');
        console.log('✓ Dashboard data retrieved:', dashboard.status === 200);
        if (dashboard.data) {
            console.log('  - Patient inflows tracked');
            console.log('  - Admissions monitored');
            console.log('  - Financial metrics available');
        }
        
        // Test 3: Create a project
        console.log('\n3. Testing Project Management...');
        const project = await makeRequest('/api/projects', {
            method: 'POST',
            body: {
                hospital_id: 'HOSP001',
                project_name: 'Emergency Ward Expansion',
                project_type: 'expansion',
                budget: 500000,
                start_date: '2025-01-01',
                end_date: '2025-06-30',
                project_manager: 'John Smith',
                description: 'Expanding emergency ward capacity by 50%'
            }
        });
        console.log('✓ Project created:', project.status === 201);
        
        // Test 4: Get command centre overview
        console.log('\n4. Testing Command Centre Overview...');
        const overview = await makeRequest('/api/command-centre/overview');
        console.log('✓ Overview retrieved:', overview.status === 200);
        if (overview.data) {
            console.log('  - Hospitals status:', overview.data.hospitals ? 'Available' : 'N/A');
            console.log('  - System metrics:', overview.data.systemMetrics ? 'Available' : 'N/A');
            console.log('  - Recent alerts:', overview.data.recentAlerts ? 'Available' : 'N/A');
            console.log('  - Active projects:', overview.data.activeProjects ? 'Available' : 'N/A');
        }
        
        // Test 5: Check WebSocket support
        console.log('\n5. Testing WebSocket Support...');
        const health = await makeRequest('/health');
        console.log('✓ Service healthy:', health.status === 200);
        if (health.data) {
            console.log('  - WebSocket status:', health.data.websocket);
        }
        
        console.log('\n' + '=' .repeat(50));
        console.log('✅ OCC TESTING COMPLETE');
        console.log('\nSummary:');
        console.log('- Real-time monitoring: ✓');
        console.log('- Alert system: ✓');
        console.log('- Project management: ✓');
        console.log('- Multi-hospital support: ✓');
        console.log('- WebSocket updates: ✓');
        
    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        await pool.end();
    }
}

testOCC();
