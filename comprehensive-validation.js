#!/usr/bin/env node

/**
 * Comprehensive Validation Script for GrandPro HMSO Hospital Management Platform
 * This script tests all modules, submodules, forms, and endpoints
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const SERVICES = {
  'Digital Sourcing': { port: 3001, endpoints: [
    { path: '/api/onboarding/apply', method: 'POST', data: {
      hospitalName: 'Test Hospital',
      ownerName: 'Test Owner',
      email: 'test@hospital.com',
      phone: '555-0100',
      address: '123 Test St',
      city: 'Test City'
    }},
    { path: '/api/onboarding/applications', method: 'GET' },
    { path: '/api/onboarding/contracts', method: 'GET' },
    { path: '/api/onboarding/dashboard', method: 'GET' }
  ]},
  
  'CRM System': { port: 3002, endpoints: [
    // Owner CRM
    { path: '/api/crm/owners', method: 'GET' },
    { path: '/api/crm/owners', method: 'POST', data: {
      name: 'Test Owner',
      email: 'owner@test.com',
      phone: '555-0101',
      hospital: 'Test Hospital',
      contract_status: 'active'
    }},
    { path: '/api/crm/contracts', method: 'GET' },
    { path: '/api/crm/payouts', method: 'GET' },
    
    // Patient CRM
    { path: '/api/crm/patients', method: 'GET' },
    { path: '/api/crm/appointments', method: 'GET' },
    { path: '/api/crm/appointments', method: 'POST', data: {
      patient_id: 1,
      doctor_id: 1,
      appointment_date: '2025-01-15',
      appointment_time: '10:00',
      reason: 'Checkup'
    }},
    { path: '/api/crm/reminders', method: 'GET' },
    { path: '/api/crm/campaigns', method: 'GET' }
  ]},
  
  'HMS Core': { port: 3003, endpoints: [
    // EMR
    { path: '/api/hms/patients', method: 'GET' },
    { path: '/api/hms/patients', method: 'POST', data: {
      name: 'Test Patient',
      age: 30,
      gender: 'Male',
      phone: '555-0102',
      email: 'patient@test.com'
    }},
    { path: '/api/hms/medical-records', method: 'GET' },
    
    // Billing
    { path: '/api/hms/billing/invoices', method: 'GET' },
    { path: '/api/hms/billing/create', method: 'POST', data: {
      patient_id: 1,
      services: ['Consultation'],
      amount: 100,
      payment_method: 'cash'
    }},
    { path: '/api/hms/billing/insurance-claims', method: 'GET' },
    
    // Inventory
    { path: '/api/hms/inventory', method: 'GET' },
    { path: '/api/hms/inventory/drugs', method: 'GET' },
    { path: '/api/hms/inventory/low-stock', method: 'GET' },
    { path: '/api/hms/inventory/add', method: 'POST', data: {
      item_name: 'Test Drug',
      category: 'Medicine',
      quantity: 100,
      unit_price: 10,
      reorder_level: 20
    }},
    
    // Staff Management
    { path: '/api/hms/staff', method: 'GET' },
    { path: '/api/hms/staff/schedule', method: 'GET' },
    { path: '/api/hms/staff/roster', method: 'POST', data: {
      staff_id: 1,
      date: '2025-01-15',
      shift: 'Morning',
      department: 'Emergency'
    }},
    
    // Bed Management
    { path: '/api/hms/beds', method: 'GET' },
    { path: '/api/hms/beds/available', method: 'GET' },
    { path: '/api/hms/admissions', method: 'GET' },
    
    // Analytics
    { path: '/api/hms/analytics/dashboard', method: 'GET' },
    { path: '/api/hms/analytics/occupancy', method: 'GET' },
    { path: '/api/hms/analytics/revenue', method: 'GET' }
  ]},
  
  'OCC Command Centre': { port: 8080, endpoints: [
    { path: '/api/occ/dashboard', method: 'GET' },
    { path: '/api/occ/metrics', method: 'GET' },
    { path: '/api/occ/hospitals', method: 'GET' },
    { path: '/api/occ/alerts', method: 'GET' },
    { path: '/api/occ/alerts/create', method: 'POST', data: {
      type: 'low_stock',
      severity: 'warning',
      message: 'Test alert',
      hospital_id: 1
    }},
    { path: '/api/occ/kpis', method: 'GET' },
    { path: '/api/occ/projects', method: 'GET' },
    { path: '/api/occ/projects', method: 'POST', data: {
      name: 'Test Expansion',
      type: 'expansion',
      status: 'planning',
      budget: 100000,
      hospital_id: 1
    }}
  ]},
  
  'Partner Integration': { port: 3004, endpoints: [
    { path: '/api/partner/insurance/providers', method: 'GET' },
    { path: '/api/partner/insurance/claim', method: 'POST', data: {
      patient_id: 1,
      provider: 'Test Insurance',
      amount: 500,
      service_date: '2025-01-15'
    }},
    { path: '/api/partner/pharmacy/orders', method: 'GET' },
    { path: '/api/partner/suppliers', method: 'GET' },
    { path: '/api/partner/telemedicine/sessions', method: 'GET' },
    { path: '/api/partner/telemedicine/schedule', method: 'POST', data: {
      patient_id: 1,
      doctor_id: 1,
      date: '2025-01-15',
      time: '14:00'
    }},
    { path: '/api/partner/compliance/reports', method: 'GET' },
    { path: '/api/partner/government/export', method: 'GET' }
  ]},
  
  'Analytics & ML': { port: 3005, endpoints: [
    { path: '/api/analytics/metrics', method: 'GET' },
    { path: '/api/analytics/data-lake/export', method: 'POST', data: {
      modules: ['all'],
      format: 'json'
    }},
    { path: '/api/analytics/predict/demand', method: 'POST', data: {
      days: 7
    }},
    { path: '/api/analytics/predict/drug-usage', method: 'POST', data: {
      drug_id: 'AMOX250',
      days: 14
    }},
    { path: '/api/analytics/predict/occupancy', method: 'POST', data: {
      days: 7,
      department: 'general'
    }},
    { path: '/api/analytics/ml/triage', method: 'POST', data: {
      symptoms: ['chest pain', 'shortness of breath'],
      age: 55,
      vitals: { bp: '150/95', pulse: 110 }
    }},
    { path: '/api/analytics/ml/fraud', method: 'POST', data: {
      billing_id: 'BILL123',
      amount: 25000,
      services: ['MRI', 'CT Scan', 'MRI']
    }},
    { path: '/api/analytics/ml/risk-score', method: 'POST', data: {
      patient_id: 1,
      age: 75,
      conditions: ['diabetes', 'hypertension'],
      medications: 8
    }}
  ]}
};

// Frontend URLs to test
const FRONTEND_URLS = [
  { name: 'Unified Platform', port: 4000, path: '/' },
  { name: 'Digital Sourcing Frontend', port: 5001, path: '/' },
  { name: 'HMS Frontend', port: 5002, path: '/' },
  { name: 'CRM Frontend', port: 5003, path: '/' },
  { name: 'OCC Frontend', port: 5004, path: '/' },
  { name: 'API Documentation', port: 5005, path: '/' }
];

// Test results storage
const testResults = {
  services: {},
  frontends: {},
  forms: {},
  database: {},
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Color codes for console output
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

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
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
async function testEndpoint(serviceName, port, endpoint) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: endpoint.path,
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, endpoint.data);
    const success = response.statusCode >= 200 && response.statusCode < 400;
    
    return {
      service: serviceName,
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: response.statusCode,
      success: success,
      responseSize: response.data.length
    };
  } catch (error) {
    return {
      service: serviceName,
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

// Test service endpoints
async function testService(serviceName, config) {
  console.log(`${colors.cyan}Testing ${serviceName}...${colors.reset}`);
  const results = [];
  
  for (const endpoint of config.endpoints) {
    const result = await testEndpoint(serviceName, config.port, endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`  ${colors.green}✓${colors.reset} ${result.endpoint}`);
      testResults.passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${result.endpoint} (${result.status})`);
      testResults.failed++;
      if (result.error) {
        testResults.errors.push(`${serviceName} - ${result.endpoint}: ${result.error}`);
      }
    }
    testResults.total++;
  }
  
  testResults.services[serviceName] = results;
  return results;
}

// Test frontend accessibility
async function testFrontend(frontend) {
  const options = {
    hostname: 'localhost',
    port: frontend.port,
    path: frontend.path,
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    const success = response.statusCode === 200;
    
    return {
      name: frontend.name,
      url: `http://localhost:${frontend.port}${frontend.path}`,
      status: response.statusCode,
      success: success,
      contentType: response.headers['content-type']
    };
  } catch (error) {
    return {
      name: frontend.name,
      url: `http://localhost:${frontend.port}${frontend.path}`,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

// Test all frontends
async function testFrontends() {
  console.log(`\n${colors.magenta}Testing Frontend Applications...${colors.reset}`);
  
  for (const frontend of FRONTEND_URLS) {
    const result = await testFrontend(frontend);
    testResults.frontends[frontend.name] = result;
    
    if (result.success) {
      console.log(`  ${colors.green}✓${colors.reset} ${frontend.name} (${frontend.port})`);
      testResults.passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${frontend.name} (${frontend.port}) - ${result.error || result.status}`);
      testResults.failed++;
    }
    testResults.total++;
  }
}

// Test database connectivity
async function testDatabase() {
  console.log(`\n${colors.blue}Testing Database Connectivity...${colors.reset}`);
  
  try {
    // Test connection to HMS which uses the database
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/hms/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    const success = response.statusCode === 200;
    
    if (success) {
      console.log(`  ${colors.green}✓${colors.reset} Database connection successful`);
      testResults.passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Database connection failed`);
      testResults.failed++;
    }
    testResults.total++;
    
    testResults.database = {
      connected: success,
      status: response.statusCode
    };
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Database connection error: ${error.message}`);
    testResults.database = {
      connected: false,
      error: error.message
    };
    testResults.failed++;
    testResults.total++;
  }
}

// Test form functionality
async function testForms() {
  console.log(`\n${colors.yellow}Testing Form Functionality...${colors.reset}`);
  
  const forms = [
    {
      name: 'Hospital Application Form',
      service: 'Digital Sourcing',
      port: 3001,
      endpoint: '/api/onboarding/apply',
      data: {
        hospitalName: `Test Hospital ${Date.now()}`,
        ownerName: 'Form Test Owner',
        email: `test${Date.now()}@hospital.com`,
        phone: '555-9999',
        address: '999 Test Ave',
        city: 'Test City',
        licenseNumber: 'LIC-' + Date.now()
      }
    },
    {
      name: 'Patient Registration Form',
      service: 'HMS Core',
      port: 3003,
      endpoint: '/api/hms/patients',
      data: {
        name: `Test Patient ${Date.now()}`,
        age: 25,
        gender: 'Female',
        phone: '555-8888',
        email: `patient${Date.now()}@test.com`,
        address: '888 Patient St'
      }
    },
    {
      name: 'Appointment Booking Form',
      service: 'CRM System',
      port: 3002,
      endpoint: '/api/crm/appointments',
      data: {
        patient_id: 1,
        doctor_id: 1,
        appointment_date: '2025-02-01',
        appointment_time: '14:30',
        reason: 'Form Test Appointment'
      }
    },
    {
      name: 'Invoice Creation Form',
      service: 'HMS Core',
      port: 3003,
      endpoint: '/api/hms/billing/create',
      data: {
        patient_id: 1,
        services: ['Consultation', 'Lab Test'],
        amount: 250,
        payment_method: 'insurance',
        insurance_provider: 'Test Insurance'
      }
    },
    {
      name: 'Insurance Claim Form',
      service: 'Partner Integration',
      port: 3004,
      endpoint: '/api/partner/insurance/claim',
      data: {
        patient_id: 1,
        provider: 'Test Insurance Co',
        amount: 1000,
        service_date: '2025-01-20',
        diagnosis: 'Test Diagnosis',
        procedure_codes: ['99213', '80053']
      }
    }
  ];
  
  for (const form of forms) {
    const options = {
      hostname: 'localhost',
      port: form.port,
      path: form.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    try {
      const response = await makeRequest(options, form.data);
      const success = response.statusCode >= 200 && response.statusCode < 400;
      
      testResults.forms[form.name] = {
        success: success,
        status: response.statusCode,
        service: form.service
      };
      
      if (success) {
        console.log(`  ${colors.green}✓${colors.reset} ${form.name}`);
        testResults.passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${form.name} (${response.statusCode})`);
        testResults.failed++;
      }
      testResults.total++;
      
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${form.name} - ${error.message}`);
      testResults.forms[form.name] = {
        success: false,
        error: error.message,
        service: form.service
      };
      testResults.failed++;
      testResults.total++;
    }
  }
}

// Generate validation report
function generateReport() {
  console.log(`\n${colors.bright}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}VALIDATION REPORT${colors.reset}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`  Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  // Service summary
  console.log(`\n${colors.cyan}Service Endpoints:${colors.reset}`);
  for (const [service, results] of Object.entries(testResults.services)) {
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const status = passed === total ? colors.green : colors.yellow;
    console.log(`  ${status}${service}: ${passed}/${total} endpoints working${colors.reset}`);
  }
  
  // Frontend summary
  console.log(`\n${colors.cyan}Frontend Applications:${colors.reset}`);
  for (const [name, result] of Object.entries(testResults.frontends)) {
    const status = result.success ? colors.green + '✓' : colors.red + '✗';
    console.log(`  ${status} ${name}${colors.reset}`);
  }
  
  // Forms summary
  console.log(`\n${colors.cyan}Form Functionality:${colors.reset}`);
  for (const [name, result] of Object.entries(testResults.forms)) {
    const status = result.success ? colors.green + '✓' : colors.red + '✗';
    console.log(`  ${status} ${name}${colors.reset}`);
  }
  
  // Database status
  console.log(`\n${colors.cyan}Database Status:${colors.reset}`);
  const dbStatus = testResults.database.connected ? colors.green + 'Connected' : colors.red + 'Disconnected';
  console.log(`  ${dbStatus}${colors.reset}`);
  
  // Errors
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n${'='.repeat(80)}`);
}

// Save report to file
async function saveReport() {
  const fs = require('fs').promises;
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    services: testResults.services,
    frontends: testResults.frontends,
    forms: testResults.forms,
    database: testResults.database,
    errors: testResults.errors
  };
  
  try {
    await fs.writeFile('/root/validation-report.json', JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: /root/validation-report.json`);
  } catch (error) {
    console.log(`\n${colors.red}Failed to save report: ${error.message}${colors.reset}`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║     GrandPro HMSO Hospital Management Platform - Comprehensive Validation     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // Test database connectivity first
  await testDatabase();
  
  // Test all service endpoints
  for (const [serviceName, config] of Object.entries(SERVICES)) {
    await testService(serviceName, config);
    // Small delay between services
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test frontends
  await testFrontends();
  
  // Test forms
  await testForms();
  
  // Generate and save report
  generateReport();
  await saveReport();
  
  console.log(`\n${colors.bright}Validation completed at: ${new Date().toISOString()}${colors.reset}`);
  
  // Return exit code based on results
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ ALL TESTS PASSED!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠ Some tests failed. Please review the report.${colors.reset}`);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled Rejection:${colors.reset}`, reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught Exception:${colors.reset}`, error);
  process.exit(1);
});

// Run the validation
main().catch(error => {
  console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
  process.exit(1);
});
