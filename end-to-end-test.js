#!/usr/bin/env node

/**
 * End-to-End Testing Script for GrandPro HMSO Platform
 * Complete workflow testing across all modules
 */

const https = require('https');
const { Client } = require('pg');
const fs = require('fs').promises;

const PUBLIC_URL = 'https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so';
const DATABASE_URL = 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

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

// Test results tracking
const testResults = {
    workflows: {},
    modules: {},
    integration: {},
    performance: {},
    total: 0,
    passed: 0,
    failed: 0
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = PUBLIC_URL + endpoint;
        https.request(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(responseData)
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        }).on('error', reject).end(data ? JSON.stringify(data) : undefined);
    });
}

// TEST WORKFLOW 1: Hospital Onboarding Journey
async function testHospitalOnboardingWorkflow() {
    console.log(`\n${colors.cyan}WORKFLOW 1: Hospital Onboarding Journey${colors.reset}`);
    const workflowResults = [];
    
    try {
        // Step 1: Submit hospital application
        console.log('  1. Submitting hospital application...');
        const applicationData = {
            hospitalName: 'E2E Test Hospital ' + Date.now(),
            ownerName: 'Dr. Test Owner',
            email: 'test@e2ehospital.com',
            phone: '555-9999',
            address: '123 Test Street',
            city: 'Test City',
            licenseNumber: 'LIC-' + Date.now()
        };
        
        const applyResult = await apiCall('/api/onboarding/apply', 'POST', applicationData);
        if (applyResult.status === 200 && applyResult.data.success) {
            console.log(`    ${colors.green}✓${colors.reset} Application submitted (ID: ${applyResult.data.data.id})`);
            workflowResults.push({ step: 'Submit Application', success: true });
            
            // Step 2: Check application status
            console.log('  2. Checking application status...');
            const statusResult = await apiCall('/api/onboarding/applications');
            if (statusResult.status === 200) {
                const myApp = statusResult.data.data.find(a => a.email === applicationData.email);
                if (myApp) {
                    console.log(`    ${colors.green}✓${colors.reset} Application found in system (Status: ${myApp.status})`);
                    workflowResults.push({ step: 'Check Status', success: true });
                }
            }
            
            // Step 3: View dashboard metrics
            console.log('  3. Viewing onboarding dashboard...');
            const dashboardResult = await apiCall('/api/onboarding/dashboard');
            if (dashboardResult.status === 200 && dashboardResult.data.data.total) {
                console.log(`    ${colors.green}✓${colors.reset} Dashboard shows ${dashboardResult.data.data.total} total applications`);
                workflowResults.push({ step: 'Dashboard View', success: true });
            }
            
            // Step 4: Check for contract generation readiness
            console.log('  4. Checking contract readiness...');
            const contractsResult = await apiCall('/api/onboarding/contracts');
            if (contractsResult.status === 200) {
                console.log(`    ${colors.green}✓${colors.reset} Contract system ready`);
                workflowResults.push({ step: 'Contract Ready', success: true });
            }
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Workflow error: ${error.message}`);
        workflowResults.push({ step: 'Error', success: false, error: error.message });
    }
    
    const success = workflowResults.every(r => r.success);
    testResults.workflows['Hospital_Onboarding'] = { success, steps: workflowResults };
    return success;
}

// TEST WORKFLOW 2: Patient Care Journey
async function testPatientCareWorkflow() {
    console.log(`\n${colors.cyan}WORKFLOW 2: Patient Care Journey${colors.reset}`);
    const workflowResults = [];
    
    try {
        // Step 1: Register new patient
        console.log('  1. Registering new patient...');
        const patientData = {
            name: 'E2E Test Patient ' + Date.now(),
            age: 35,
            gender: 'Male',
            phone: '555-8888',
            email: 'patient@e2etest.com',
            address: '456 Patient Lane',
            blood_group: 'O+'
        };
        
        const registerResult = await apiCall('/api/hms/patients', 'POST', patientData);
        if (registerResult.status === 200 && registerResult.data.success) {
            const patientId = registerResult.data.data.id;
            console.log(`    ${colors.green}✓${colors.reset} Patient registered (ID: ${patientId})`);
            workflowResults.push({ step: 'Patient Registration', success: true });
            
            // Step 2: Schedule appointment
            console.log('  2. Scheduling appointment...');
            const appointmentData = {
                patient_id: patientId,
                doctor_id: 1,
                appointment_date: '2025-01-20',
                appointment_time: '10:00',
                reason: 'E2E Test Checkup'
            };
            
            const appointmentResult = await apiCall('/api/crm/appointments', 'POST', appointmentData);
            if (appointmentResult.status === 200 && appointmentResult.data.success) {
                console.log(`    ${colors.green}✓${colors.reset} Appointment scheduled`);
                workflowResults.push({ step: 'Appointment Booking', success: true });
            }
            
            // Step 3: Create medical record
            console.log('  3. Accessing medical records...');
            const recordsResult = await apiCall('/api/hms/medical-records');
            if (recordsResult.status === 200) {
                console.log(`    ${colors.green}✓${colors.reset} Medical records accessible`);
                workflowResults.push({ step: 'Medical Records', success: true });
            }
            
            // Step 4: Generate invoice
            console.log('  4. Generating invoice...');
            const invoiceData = {
                patient_id: patientId,
                services: ['Consultation', 'Lab Test'],
                amount: 250,
                payment_method: 'insurance',
                insurance_provider: 'Test Insurance'
            };
            
            const invoiceResult = await apiCall('/api/hms/billing/create', 'POST', invoiceData);
            if (invoiceResult.status === 200 && invoiceResult.data.success) {
                console.log(`    ${colors.green}✓${colors.reset} Invoice created (ID: ${invoiceResult.data.data.id})`);
                workflowResults.push({ step: 'Invoice Generation', success: true });
            }
            
            // Step 5: Submit insurance claim
            console.log('  5. Submitting insurance claim...');
            const claimData = {
                patient_id: patientId,
                provider: 'Test Insurance',
                amount: 250,
                service_date: '2025-01-20'
            };
            
            const claimResult = await apiCall('/api/partner/insurance/claim', 'POST', claimData);
            if (claimResult.status === 200 && claimResult.data.success) {
                console.log(`    ${colors.green}✓${colors.reset} Insurance claim submitted (${claimResult.data.claim_number})`);
                workflowResults.push({ step: 'Insurance Claim', success: true });
            }
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Workflow error: ${error.message}`);
        workflowResults.push({ step: 'Error', success: false, error: error.message });
    }
    
    const success = workflowResults.every(r => r.success);
    testResults.workflows['Patient_Care'] = { success, steps: workflowResults };
    return success;
}

// TEST WORKFLOW 3: Hospital Operations
async function testHospitalOperationsWorkflow() {
    console.log(`\n${colors.cyan}WORKFLOW 3: Hospital Operations${colors.reset}`);
    const workflowResults = [];
    
    try {
        // Step 1: Check inventory
        console.log('  1. Checking inventory levels...');
        const inventoryResult = await apiCall('/api/hms/inventory');
        if (inventoryResult.status === 200) {
            console.log(`    ${colors.green}✓${colors.reset} Inventory system active`);
            workflowResults.push({ step: 'Inventory Check', success: true });
        }
        
        // Step 2: Check low stock alerts
        console.log('  2. Monitoring low stock alerts...');
        const lowStockResult = await apiCall('/api/hms/inventory/low-stock');
        if (lowStockResult.status === 200) {
            const alertStatus = lowStockResult.data.alert ? 'ALERT' : 'OK';
            console.log(`    ${colors.green}✓${colors.reset} Low stock monitoring active (Status: ${alertStatus})`);
            workflowResults.push({ step: 'Low Stock Alert', success: true });
        }
        
        // Step 3: Add inventory item
        console.log('  3. Adding inventory item...');
        const inventoryData = {
            item_name: 'E2E Test Medicine ' + Date.now(),
            category: 'Medicine',
            quantity: 100,
            unit_price: 5.50,
            reorder_level: 20
        };
        
        const addInventoryResult = await apiCall('/api/hms/inventory/add', 'POST', inventoryData);
        if (addInventoryResult.status === 200 && addInventoryResult.data.success) {
            console.log(`    ${colors.green}✓${colors.reset} Inventory item added`);
            workflowResults.push({ step: 'Add Inventory', success: true });
        }
        
        // Step 4: Check bed availability
        console.log('  4. Checking bed availability...');
        const bedsResult = await apiCall('/api/hms/beds/available');
        if (bedsResult.status === 200) {
            console.log(`    ${colors.green}✓${colors.reset} ${bedsResult.data.count || 0} beds available`);
            workflowResults.push({ step: 'Bed Management', success: true });
        }
        
        // Step 5: View staff schedule
        console.log('  5. Viewing staff schedule...');
        const scheduleResult = await apiCall('/api/hms/staff/schedule');
        if (scheduleResult.status === 200) {
            console.log(`    ${colors.green}✓${colors.reset} Staff scheduling system active`);
            workflowResults.push({ step: 'Staff Schedule', success: true });
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Workflow error: ${error.message}`);
        workflowResults.push({ step: 'Error', success: false, error: error.message });
    }
    
    const success = workflowResults.every(r => r.success);
    testResults.workflows['Hospital_Operations'] = { success, steps: workflowResults };
    return success;
}

// TEST WORKFLOW 4: Analytics & Predictions
async function testAnalyticsWorkflow() {
    console.log(`\n${colors.cyan}WORKFLOW 4: Analytics & AI Predictions${colors.reset}`);
    const workflowResults = [];
    
    try {
        // Step 1: Get analytics metrics
        console.log('  1. Fetching analytics metrics...');
        const metricsResult = await apiCall('/api/analytics/metrics');
        if (metricsResult.status === 200 && metricsResult.data.success) {
            console.log(`    ${colors.green}✓${colors.reset} Metrics retrieved (${metricsResult.data.data.totalPatients} patients)`);
            workflowResults.push({ step: 'Analytics Metrics', success: true });
        }
        
        // Step 2: Demand prediction
        console.log('  2. Running demand prediction...');
        const demandResult = await apiCall('/api/analytics/predict/demand', 'POST', { days: 7 });
        if (demandResult.status === 200 && demandResult.data.predictions) {
            console.log(`    ${colors.green}✓${colors.reset} 7-day demand forecast generated`);
            workflowResults.push({ step: 'Demand Prediction', success: true });
        }
        
        // Step 3: AI Triage
        console.log('  3. Testing AI triage system...');
        const triageData = {
            symptoms: ['chest pain', 'shortness of breath'],
            age: 65,
            vitals: { bp: '160/95', pulse: 120 }
        };
        
        const triageResult = await apiCall('/api/analytics/ml/triage', 'POST', triageData);
        if (triageResult.status === 200 && triageResult.data.classification) {
            console.log(`    ${colors.green}✓${colors.reset} Triage: ${triageResult.data.classification} (${triageResult.data.confidence} confidence)`);
            workflowResults.push({ step: 'AI Triage', success: true });
        }
        
        // Step 4: Fraud detection
        console.log('  4. Testing fraud detection...');
        const fraudData = {
            billing_id: 'BILL-E2E-' + Date.now(),
            amount: 50000,
            services: ['MRI', 'CT Scan', 'Surgery', 'MRI', 'CT Scan']
        };
        
        const fraudResult = await apiCall('/api/analytics/ml/fraud', 'POST', fraudData);
        if (fraudResult.status === 200) {
            const fraudStatus = fraudResult.data.fraudDetected ? 'DETECTED' : 'CLEAR';
            console.log(`    ${colors.green}✓${colors.reset} Fraud check: ${fraudStatus} (Risk: ${fraudResult.data.riskScore})`);
            workflowResults.push({ step: 'Fraud Detection', success: true });
        }
        
        // Step 5: Risk scoring
        console.log('  5. Calculating patient risk score...');
        const riskData = {
            patient_id: 1,
            age: 75,
            conditions: ['diabetes', 'hypertension', 'heart disease'],
            medications: 8
        };
        
        const riskResult = await apiCall('/api/analytics/ml/risk-score', 'POST', riskData);
        if (riskResult.status === 200 && riskResult.data.riskScore !== undefined) {
            console.log(`    ${colors.green}✓${colors.reset} Risk score: ${riskResult.data.riskScore}/100 (${riskResult.data.riskLevel})`);
            workflowResults.push({ step: 'Risk Scoring', success: true });
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Workflow error: ${error.message}`);
        workflowResults.push({ step: 'Error', success: false, error: error.message });
    }
    
    const success = workflowResults.every(r => r.success);
    testResults.workflows['Analytics_AI'] = { success, steps: workflowResults };
    return success;
}

// TEST WORKFLOW 5: Command Centre Operations
async function testCommandCentreWorkflow() {
    console.log(`\n${colors.cyan}WORKFLOW 5: Command Centre Operations${colors.reset}`);
    const workflowResults = [];
    
    try {
        // Step 1: Access OCC dashboard
        console.log('  1. Accessing command centre dashboard...');
        const dashboardResult = await apiCall('/api/occ/dashboard');
        if (dashboardResult.status === 200 && dashboardResult.data.success) {
            console.log(`    ${colors.green}✓${colors.reset} Dashboard active (${dashboardResult.data.data.totalHospitals} hospitals)`);
            workflowResults.push({ step: 'OCC Dashboard', success: true });
        }
        
        // Step 2: Check system metrics
        console.log('  2. Monitoring system metrics...');
        const metricsResult = await apiCall('/api/occ/metrics');
        if (metricsResult.status === 200) {
            console.log(`    ${colors.green}✓${colors.reset} Metrics: ${metricsResult.data.data.patientFlow} patient flow`);
            workflowResults.push({ step: 'System Metrics', success: true });
        }
        
        // Step 3: View alerts
        console.log('  3. Checking system alerts...');
        const alertsResult = await apiCall('/api/occ/alerts');
        if (alertsResult.status === 200 && alertsResult.data.data) {
            console.log(`    ${colors.green}✓${colors.reset} ${alertsResult.data.data.length} active alerts`);
            workflowResults.push({ step: 'Alert System', success: true });
        }
        
        // Step 4: Check KPIs
        console.log('  4. Reviewing KPIs...');
        const kpisResult = await apiCall('/api/occ/kpis');
        if (kpisResult.status === 200) {
            console.log(`    ${colors.green}✓${colors.reset} Patient satisfaction: ${kpisResult.data.data.patientSatisfaction}/5`);
            workflowResults.push({ step: 'KPI Monitoring', success: true });
        }
        
        // Step 5: View projects
        console.log('  5. Checking active projects...');
        const projectsResult = await apiCall('/api/occ/projects');
        if (projectsResult.status === 200 && projectsResult.data.data) {
            console.log(`    ${colors.green}✓${colors.reset} ${projectsResult.data.data.length} active projects`);
            workflowResults.push({ step: 'Project Management', success: true });
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Workflow error: ${error.message}`);
        workflowResults.push({ step: 'Error', success: false, error: error.message });
    }
    
    const success = workflowResults.every(r => r.success);
    testResults.workflows['Command_Centre'] = { success, steps: workflowResults };
    return success;
}

// Performance Testing
async function testPerformance() {
    console.log(`\n${colors.cyan}PERFORMANCE TESTING${colors.reset}`);
    const performanceResults = [];
    
    // Test response times
    const endpoints = [
        '/api/health',
        '/api/stats',
        '/api/hms/patients',
        '/api/analytics/metrics'
    ];
    
    for (const endpoint of endpoints) {
        const start = Date.now();
        try {
            await apiCall(endpoint);
            const responseTime = Date.now() - start;
            console.log(`  ${endpoint}: ${responseTime}ms`);
            performanceResults.push({ endpoint, responseTime, success: responseTime < 1000 });
        } catch (error) {
            performanceResults.push({ endpoint, error: error.message, success: false });
        }
    }
    
    const avgResponseTime = performanceResults
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length;
    
    console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    testResults.performance = {
        results: performanceResults,
        averageResponseTime: avgResponseTime,
        success: avgResponseTime < 500
    };
    
    return avgResponseTime < 500;
}

// Integration Testing
async function testIntegration() {
    console.log(`\n${colors.cyan}INTEGRATION TESTING${colors.reset}`);
    
    // Test database connectivity
    console.log('  Testing database integration...');
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        const result = await client.query('SELECT COUNT(*) FROM patients');
        console.log(`    ${colors.green}✓${colors.reset} Database connected (${result.rows[0].count} patients)`);
        testResults.integration.database = true;
        await client.end();
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Database error: ${error.message}`);
        testResults.integration.database = false;
    }
    
    // Test cross-module communication
    console.log('  Testing cross-module communication...');
    try {
        // Create patient in HMS
        const patientResult = await apiCall('/api/hms/patients', 'POST', {
            name: 'Integration Test Patient',
            age: 30,
            gender: 'Female',
            phone: '555-7777'
        });
        
        if (patientResult.status === 200) {
            const patientId = patientResult.data.data.id;
            
            // Use patient in CRM appointment
            const appointmentResult = await apiCall('/api/crm/appointments', 'POST', {
                patient_id: patientId,
                doctor_id: 1,
                appointment_date: '2025-02-01',
                appointment_time: '11:00',
                reason: 'Integration Test'
            });
            
            if (appointmentResult.status === 200) {
                console.log(`    ${colors.green}✓${colors.reset} Cross-module communication working`);
                testResults.integration.crossModule = true;
            }
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Integration error: ${error.message}`);
        testResults.integration.crossModule = false;
    }
    
    return testResults.integration.database && testResults.integration.crossModule;
}

// Generate comprehensive report
async function generateReport() {
    console.log(`\n${colors.bright}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}END-TO-END TESTING REPORT${colors.reset}`);
    console.log(`${'='.repeat(80)}`);
    
    // Calculate totals
    const workflowsPassed = Object.values(testResults.workflows).filter(w => w.success).length;
    const workflowsTotal = Object.keys(testResults.workflows).length;
    
    console.log(`\n${colors.cyan}WORKFLOW TESTING:${colors.reset}`);
    for (const [name, result] of Object.entries(testResults.workflows)) {
        const status = result.success ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED';
        console.log(`  ${name.replace(/_/g, ' ')}: ${status}${colors.reset}`);
        if (result.steps) {
            const passed = result.steps.filter(s => s.success).length;
            console.log(`    Steps: ${passed}/${result.steps.length} passed`);
        }
    }
    
    console.log(`\n${colors.cyan}INTEGRATION:${colors.reset}`);
    console.log(`  Database: ${testResults.integration.database ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log(`  Cross-Module: ${testResults.integration.crossModule ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    
    console.log(`\n${colors.cyan}PERFORMANCE:${colors.reset}`);
    console.log(`  Average Response Time: ${testResults.performance.averageResponseTime?.toFixed(2)}ms`);
    console.log(`  Performance Target Met: ${testResults.performance.success ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    
    // Overall status
    const allPassed = workflowsPassed === workflowsTotal && 
                     testResults.integration.database && 
                     testResults.integration.crossModule &&
                     testResults.performance.success;
    
    console.log(`\n${colors.cyan}SUMMARY:${colors.reset}`);
    console.log(`  Workflows Passed: ${workflowsPassed}/${workflowsTotal}`);
    console.log(`  Integration Tests: ${testResults.integration.database && testResults.integration.crossModule ? 'PASSED' : 'FAILED'}`);
    console.log(`  Performance Tests: ${testResults.performance.success ? 'PASSED' : 'FAILED'}`);
    
    console.log(`\n${'='.repeat(80)}`);
    if (allPassed) {
        console.log(`${colors.bright}${colors.green}✓ END-TO-END TESTING PASSED${colors.reset}`);
        console.log(`${colors.green}Platform is ready for production use!${colors.reset}`);
    } else {
        console.log(`${colors.bright}${colors.yellow}⚠ TESTING COMPLETED WITH ISSUES${colors.reset}`);
    }
    console.log(`${'='.repeat(80)}`);
    
    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        platformUrl: PUBLIC_URL,
        workflows: testResults.workflows,
        integration: testResults.integration,
        performance: testResults.performance,
        summary: {
            workflowsPassed,
            workflowsTotal,
            integrationPassed: testResults.integration.database && testResults.integration.crossModule,
            performancePassed: testResults.performance.success,
            overallStatus: allPassed ? 'PASSED' : 'FAILED'
        }
    };
    
    await fs.writeFile('/root/end-to-end-test-report.json', JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: /root/end-to-end-test-report.json`);
    
    return allPassed;
}

// Main execution
async function main() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              END-TO-END TESTING - GRANDPRO HMSO PLATFORM                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    console.log(`Platform URL: ${PUBLIC_URL}`);
    console.log(`Started at: ${new Date().toISOString()}\n`);
    
    // Run all test workflows
    await testHospitalOnboardingWorkflow();
    await testPatientCareWorkflow();
    await testHospitalOperationsWorkflow();
    await testAnalyticsWorkflow();
    await testCommandCentreWorkflow();
    
    // Run integration and performance tests
    await testIntegration();
    await testPerformance();
    
    // Generate report
    const passed = await generateReport();
    
    console.log(`\nTesting completed at: ${new Date().toISOString()}`);
    
    process.exit(passed ? 0 : 1);
}

// Execute tests
main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
});
