#!/usr/bin/env node

/**
 * Test Partner & Ecosystem Integration
 * Tests insurance, pharmacy, telemedicine, and compliance endpoints
 */

const axios = require('axios');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3004';
const ALT_PORT = 'http://localhost:11000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green :
                type === 'error' ? colors.red :
                type === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'N/A',
      error: error.message,
      data: error.response?.data
    };
  }
}

async function testInsuranceIntegration() {
  log('\n=== TESTING INSURANCE INTEGRATION ===', 'info');
  
  const tests = [
    {
      name: 'Submit Insurance Claim',
      endpoint: '/api/insurance/claims',
      method: 'POST',
      data: {
        patientId: 'P001',
        patientName: 'John Doe',
        providerId: 'NHIS',
        providerName: 'National Health Insurance',
        claimAmount: 5000,
        services: [
          { code: 'CONSULT', description: 'General Consultation', amount: 1000 },
          { code: 'LAB', description: 'Blood Test', amount: 2000 },
          { code: 'PHARM', description: 'Medication', amount: 2000 }
        ],
        diagnosis: 'Hypertension',
        claimDate: new Date().toISOString()
      }
    },
    {
      name: 'Check Claim Status',
      endpoint: '/api/insurance/claims/status/CLAIM001',
      method: 'GET'
    },
    {
      name: 'Verify Insurance Eligibility',
      endpoint: '/api/insurance/eligibility',
      method: 'POST',
      data: {
        patientId: 'P001',
        providerId: 'NHIS',
        serviceDate: new Date().toISOString()
      }
    },
    {
      name: 'Get Pre-authorization',
      endpoint: '/api/insurance/preauth',
      method: 'POST',
      data: {
        patientId: 'P001',
        providerId: 'NHIS',
        procedureCode: 'SURG001',
        estimatedCost: 50000
      }
    }
  ];
  
  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(BASE_URL + test.endpoint, test.method, test.data);
    if (result.success) {
      log(`✓ ${test.name}: SUCCESS (Status: ${result.status})`, 'success');
      successCount++;
      if (result.data) {
        console.log('  Response:', JSON.stringify(result.data).substring(0, 100));
      }
    } else {
      log(`✗ ${test.name}: FAILED (${result.error})`, 'error');
    }
  }
  
  return { total: tests.length, success: successCount };
}

async function testPharmacyIntegration() {
  log('\n=== TESTING PHARMACY INTEGRATION ===', 'info');
  
  const tests = [
    {
      name: 'Create Pharmacy Order',
      endpoint: '/api/pharmacy/orders',
      method: 'POST',
      data: {
        hospitalId: 'H001',
        items: [
          { drugCode: 'PARA500', name: 'Paracetamol 500mg', quantity: 1000, unit: 'tablets' },
          { drugCode: 'AMOX250', name: 'Amoxicillin 250mg', quantity: 500, unit: 'capsules' },
          { drugCode: 'INSULIN', name: 'Insulin', quantity: 100, unit: 'vials' }
        ],
        supplierId: 'PHARMA001',
        urgency: 'normal',
        deliveryAddress: 'Central Hospital, Lagos'
      }
    },
    {
      name: 'Check Drug Availability',
      endpoint: '/api/pharmacy/availability',
      method: 'POST',
      data: {
        drugs: ['PARA500', 'AMOX250', 'INSULIN'],
        supplierId: 'PHARMA001'
      }
    },
    {
      name: 'Get Order Status',
      endpoint: '/api/pharmacy/orders/ORD001/status',
      method: 'GET'
    },
    {
      name: 'Auto-restock Trigger',
      endpoint: '/api/pharmacy/auto-restock',
      method: 'POST',
      data: {
        hospitalId: 'H001',
        lowStockItems: [
          { drugCode: 'PARA500', currentStock: 50, reorderLevel: 100, reorderQuantity: 1000 }
        ]
      }
    }
  ];
  
  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(BASE_URL + test.endpoint, test.method, test.data);
    if (result.success) {
      log(`✓ ${test.name}: SUCCESS (Status: ${result.status})`, 'success');
      successCount++;
    } else {
      log(`✗ ${test.name}: FAILED (${result.error})`, 'error');
    }
  }
  
  return { total: tests.length, success: successCount };
}

async function testTelemedicineIntegration() {
  log('\n=== TESTING TELEMEDICINE INTEGRATION ===', 'info');
  
  const tests = [
    {
      name: 'Schedule Telemedicine Session',
      endpoint: '/api/telemedicine/sessions',
      method: 'POST',
      data: {
        patientId: 'P001',
        patientName: 'John Doe',
        doctorId: 'D001',
        doctorName: 'Dr. Smith',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        consultationType: 'follow-up',
        duration: 30,
        platform: 'zoom'
      }
    },
    {
      name: 'Get Session Link',
      endpoint: '/api/telemedicine/sessions/SESSION001/link',
      method: 'GET'
    },
    {
      name: 'Update Session Status',
      endpoint: '/api/telemedicine/sessions/SESSION001/status',
      method: 'PUT',
      data: {
        status: 'completed',
        notes: 'Patient consultation completed successfully',
        prescription: 'Continue current medication'
      }
    },
    {
      name: 'Get Available Slots',
      endpoint: '/api/telemedicine/availability',
      method: 'POST',
      data: {
        doctorId: 'D001',
        date: new Date().toISOString().split('T')[0]
      }
    }
  ];
  
  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(BASE_URL + test.endpoint, test.method, test.data);
    if (result.success) {
      log(`✓ ${test.name}: SUCCESS (Status: ${result.status})`, 'success');
      successCount++;
    } else {
      log(`✗ ${test.name}: FAILED (${result.error})`, 'error');
    }
  }
  
  return { total: tests.length, success: successCount };
}

async function testComplianceReporting() {
  log('\n=== TESTING COMPLIANCE REPORTING ===', 'info');
  
  const tests = [
    {
      name: 'Generate HIPAA Compliance Report',
      endpoint: '/api/compliance/reports/hipaa',
      method: 'POST',
      data: {
        hospitalId: 'H001',
        reportPeriod: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeAuditLog: true
      }
    },
    {
      name: 'Generate Disease Surveillance Report',
      endpoint: '/api/compliance/reports/surveillance',
      method: 'POST',
      data: {
        diseases: ['COVID-19', 'Malaria', 'Typhoid'],
        period: 'weekly',
        region: 'Lagos'
      }
    },
    {
      name: 'Export Government Report',
      endpoint: '/api/compliance/reports/government',
      method: 'POST',
      data: {
        reportType: 'monthly-statistics',
        format: 'pdf',
        hospitalId: 'H001',
        month: '2024-01'
      }
    },
    {
      name: 'Generate NGO Report',
      endpoint: '/api/compliance/reports/ngo',
      method: 'POST',
      data: {
        organizationId: 'WHO',
        metrics: ['patient-volume', 'disease-prevalence', 'treatment-outcomes'],
        period: 'quarterly'
      }
    },
    {
      name: 'Automated Report Schedule',
      endpoint: '/api/compliance/schedule',
      method: 'POST',
      data: {
        reportType: 'monthly-compliance',
        schedule: 'monthly',
        recipients: ['compliance@hospital.com'],
        autoSubmit: true
      }
    }
  ];
  
  let successCount = 0;
  const exportedReports = [];
  
  for (const test of tests) {
    const result = await testEndpoint(BASE_URL + test.endpoint, test.method, test.data);
    if (result.success) {
      log(`✓ ${test.name}: SUCCESS (Status: ${result.status})`, 'success');
      successCount++;
      
      // Check if report was generated
      if (result.data && (result.data.reportUrl || result.data.reportId || result.data.success)) {
        exportedReports.push({
          name: test.name,
          data: result.data
        });
      }
    } else {
      log(`✗ ${test.name}: FAILED (${result.error})`, 'error');
    }
  }
  
  // Save exported reports info
  if (exportedReports.length > 0) {
    await fs.writeFile(
      '/root/compliance-reports-export.json',
      JSON.stringify(exportedReports, null, 2)
    );
    log(`\n✓ Exported ${exportedReports.length} compliance reports to /root/compliance-reports-export.json`, 'success');
  }
  
  return { total: tests.length, success: successCount, exported: exportedReports.length };
}

async function testAlternativePort() {
  log('\n=== TESTING ALTERNATIVE PORT 11000 ===', 'info');
  
  try {
    const result = await testEndpoint(ALT_PORT + '/api/status');
    if (result.success) {
      log('✓ Partner service also available on port 11000', 'success');
      console.log('  Response:', result.data);
    }
  } catch (error) {
    log('✗ Port 11000 not responding', 'warning');
  }
}

async function generateSummaryReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      successRate: '0%'
    },
    modules: results,
    verification: {
      insuranceAPI: false,
      pharmacyAPI: false,
      telemedicineAPI: false,
      complianceReports: false
    }
  };
  
  // Calculate totals
  for (const [module, data] of Object.entries(results)) {
    report.summary.totalTests += data.total;
    report.summary.successfulTests += data.success;
  }
  report.summary.failedTests = report.summary.totalTests - report.summary.successfulTests;
  report.summary.successRate = report.summary.totalTests > 0 
    ? `${(report.summary.successfulTests / report.summary.totalTests * 100).toFixed(1)}%`
    : '0%';
  
  // Set verification flags
  report.verification.insuranceAPI = results.insurance.success > 0;
  report.verification.pharmacyAPI = results.pharmacy.success > 0;
  report.verification.telemedicineAPI = results.telemedicine.success > 0;
  report.verification.complianceReports = results.compliance.success > 0 && results.compliance.exported > 0;
  
  // Save report
  await fs.writeFile(
    '/root/partner-integration-test-report.json',
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

async function main() {
  log('========================================', 'info');
  log('PARTNER & ECOSYSTEM INTEGRATION TEST', 'info');
  log('========================================', 'info');
  
  const results = {};
  
  // Test each integration
  results.insurance = await testInsuranceIntegration();
  results.pharmacy = await testPharmacyIntegration();
  results.telemedicine = await testTelemedicineIntegration();
  results.compliance = await testComplianceReporting();
  
  // Test alternative port
  await testAlternativePort();
  
  // Generate summary report
  const report = await generateSummaryReport(results);
  
  // Display final summary
  log('\n========================================', 'info');
  log('TEST SUMMARY', 'info');
  log('========================================', 'info');
  
  log(`\nTotal Tests Run: ${report.summary.totalTests}`, 'info');
  log(`Successful: ${report.summary.successfulTests}`, 'success');
  log(`Failed: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
  log(`Success Rate: ${report.summary.successRate}`, 'info');
  
  log('\nVERIFICATION STATUS:', 'info');
  log(`✓ Insurance API Communication: ${report.verification.insuranceAPI ? 'CONFIRMED' : 'FAILED'}`, 
      report.verification.insuranceAPI ? 'success' : 'error');
  log(`✓ Pharmacy Supplier API: ${report.verification.pharmacyAPI ? 'CONFIRMED' : 'FAILED'}`,
      report.verification.pharmacyAPI ? 'success' : 'error');
  log(`✓ Telemedicine Service API: ${report.verification.telemedicineAPI ? 'CONFIRMED' : 'FAILED'}`,
      report.verification.telemedicineAPI ? 'success' : 'error');
  log(`✓ Compliance Report Export: ${report.verification.complianceReports ? 'CONFIRMED' : 'FAILED'}`,
      report.verification.complianceReports ? 'success' : 'error');
  
  log('\nReport saved to: /root/partner-integration-test-report.json', 'info');
  
  // Exit with appropriate code
  process.exit(report.summary.failedTests === 0 ? 0 : 1);
}

// Run tests
main().catch(console.error);
