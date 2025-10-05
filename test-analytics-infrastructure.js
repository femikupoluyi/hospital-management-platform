#!/usr/bin/env node

/**
 * Comprehensive test for Data Analytics & AI Infrastructure
 */

const axios = require('axios');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3005';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green :
                type === 'error' ? colors.red :
                type === 'warning' ? colors.yellow :
                type === 'header' ? colors.cyan : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

// Test results storage
const testResults = {
  dataLake: {
    aggregation: false,
    export: false,
    metrics: false
  },
  predictiveAnalytics: {
    demandForecast: false,
    drugUsage: false,
    occupancyForecast: false
  },
  mlModels: {
    triageBot: false,
    fraudDetection: false,
    riskScoring: false
  },
  performance: {},
  timestamp: new Date().toISOString()
};

// 1. Test Data Lake Aggregation
async function testDataLakeAggregation() {
  log('\n=== TESTING DATA LAKE AGGREGATION ===', 'header');
  
  try {
    // Test metrics aggregation
    const response = await axios.get(`${BASE_URL}/api/analytics/metrics`);
    
    if (response.data && response.data.success && response.data.metrics) {
      const metrics = response.data.metrics;
      
      log('✓ Data aggregated from multiple modules', 'success');
      log(`  - Patient metrics: ${metrics.patient_metrics.total_patients} patients`, 'info');
      log(`  - Financial metrics: $${metrics.financial_metrics.total_revenue || 0}`, 'info');
      log(`  - Operational metrics: ${metrics.operational_metrics.bed_occupancy_rate} occupancy`, 'info');
      log(`  - Inventory metrics: ${metrics.inventory_metrics.low_stock_items} low stock items`, 'info');
      log(`  - Quality metrics: ${metrics.quality_metrics.patient_satisfaction} satisfaction`, 'info');
      
      testResults.dataLake.aggregation = true;
      testResults.dataLake.metrics = true;
      
      // Store aggregated metrics
      await fs.writeFile(
        '/root/data-lake-metrics.json',
        JSON.stringify(metrics, null, 2)
      );
      
      return true;
    }
  } catch (error) {
    log(`✗ Data lake aggregation failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 2. Test Data Lake Export
async function testDataLakeExport() {
  log('\n=== TESTING DATA LAKE EXPORT ===', 'header');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/data-lake/export`, {
      format: 'json',
      modules: ['HMS', 'CRM', 'OCC'],
      date_range: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    });
    
    if (response.data && response.data.export_id) {
      log(`✓ Data lake export successful`, 'success');
      log(`  Export ID: ${response.data.export_id}`, 'info');
      log(`  Records exported: ${response.data.record_count}`, 'info');
      log(`  Modules: ${response.data.metadata.modules.join(', ')}`, 'info');
      
      testResults.dataLake.export = true;
      
      // Save export
      await fs.writeFile(
        '/root/data-lake-export.json',
        JSON.stringify(response.data, null, 2)
      );
      
      return true;
    }
  } catch (error) {
    log(`✗ Data lake export failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 3. Test Patient Demand Prediction
async function testDemandPrediction() {
  log('\n=== TESTING PATIENT DEMAND PREDICTION ===', 'header');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/predict/demand`, {
      timeframe: 7,
      hospital_id: 'H001'
    });
    
    if (response.data && response.data.success && response.data.predictions) {
      log('✓ Patient demand forecast generated', 'success');
      log(`  Timeframe: ${response.data.timeframe} days`, 'info');
      log(`  Model: ${response.data.model}`, 'info');
      
      // Display first 3 predictions
      response.data.predictions.slice(0, 3).forEach(pred => {
        log(`  ${pred.date}: ${pred.predicted_patients} patients (±${pred.upper_bound - pred.lower_bound})`, 'info');
      });
      
      testResults.predictiveAnalytics.demandForecast = true;
      
      // Save predictions
      await fs.writeFile(
        '/root/demand-predictions.json',
        JSON.stringify(response.data, null, 2)
      );
      
      return true;
    }
  } catch (error) {
    log(`✗ Demand prediction failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 4. Test Drug Usage Prediction
async function testDrugUsagePrediction() {
  log('\n=== TESTING DRUG USAGE PREDICTION ===', 'header');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/predict/drug-usage`, {
      drug_code: 'PARA500',
      days: 30
    });
    
    if (response.data && response.data.success && response.data.predictions) {
      log('✓ Drug usage forecast generated', 'success');
      log(`  Drug: ${response.data.drug_code}`, 'info');
      log(`  Optimal stock level: ${response.data.recommendations.optimal_stock_level}`, 'info');
      log(`  Reorder quantity: ${response.data.recommendations.reorder_quantity}`, 'info');
      log(`  Safety stock: ${response.data.recommendations.safety_stock}`, 'info');
      
      testResults.predictiveAnalytics.drugUsage = true;
      
      return true;
    }
  } catch (error) {
    log(`✗ Drug usage prediction failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 5. Test Occupancy Forecast
async function testOccupancyForecast() {
  log('\n=== TESTING OCCUPANCY FORECAST ===', 'header');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analytics/predict/occupancy`, {
      hospital_id: 'H001',
      days: 14
    });
    
    if (response.data && response.data.success && response.data.forecasts) {
      log('✓ Occupancy forecast generated', 'success');
      log(`  Current occupancy: ${response.data.current_occupancy}%`, 'info');
      log(`  Peak day: ${response.data.insights.peak_day}`, 'info');
      log(`  Average occupancy: ${response.data.insights.average_occupancy}%`, 'info');
      log(`  High risk days: ${response.data.insights.high_risk_days}`, 'info');
      
      testResults.predictiveAnalytics.occupancyForecast = true;
      
      // Save forecast
      await fs.writeFile(
        '/root/occupancy-forecast.json',
        JSON.stringify(response.data, null, 2)
      );
      
      return true;
    }
  } catch (error) {
    log(`✗ Occupancy forecast failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 6. Test Triage Bot
async function testTriageBot() {
  log('\n=== TESTING AI TRIAGE BOT ===', 'header');
  
  try {
    const testCase = {
      symptoms: ['chest_pain', 'breathing_difficulty', 'fever'],
      vitals: {
        blood_pressure_systolic: 150,
        blood_pressure_diastolic: 90,
        heart_rate: 110,
        temperature: 38.5,
        oxygen_saturation: 94
      },
      age: 55,
      medical_history: ['hypertension', 'diabetes']
    };
    
    const response = await axios.post(`${BASE_URL}/api/analytics/ml/triage`, testCase);
    
    if (response.data && response.data.triage_level) {
      log('✓ Triage bot classification successful', 'success');
      log(`  Triage level: ${response.data.triage_level}`, 'info');
      log(`  Priority score: ${response.data.priority_score}`, 'info');
      log(`  Department: ${response.data.recommended_department}`, 'info');
      log(`  Wait time: ${response.data.estimated_wait_time} minutes`, 'info');
      log(`  Confidence: ${response.data.confidence}`, 'info');
      
      testResults.mlModels.triageBot = true;
      
      return true;
    }
  } catch (error) {
    log(`✗ Triage bot failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 7. Test Fraud Detection
async function testFraudDetection() {
  log('\n=== TESTING FRAUD DETECTION MODEL ===', 'header');
  
  try {
    const testCase = {
      billing_id: 'BILL001',
      amount: 15000,
      service_codes: ['SURGERY', 'ICU', 'SURGERY'], // Duplicate and suspicious combo
      provider_id: 'PROV001',
      patient_id: 'PAT001',
      claim_date: new Date().toISOString()
    };
    
    const response = await axios.post(`${BASE_URL}/api/analytics/ml/fraud`, testCase);
    
    if (response.data && response.data.hasOwnProperty('fraud_detected')) {
      log('✓ Fraud detection analysis complete', 'success');
      log(`  Fraud detected: ${response.data.fraud_detected}`, 'info');
      log(`  Fraud score: ${response.data.fraud_score}`, 'info');
      log(`  Risk level: ${response.data.risk_level}`, 'info');
      log(`  Anomalies: ${response.data.anomalies.join(', ') || 'None'}`, 'info');
      log(`  Action: ${response.data.recommended_action}`, 'info');
      
      testResults.mlModels.fraudDetection = true;
      
      return true;
    }
  } catch (error) {
    log(`✗ Fraud detection failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 8. Test Patient Risk Scoring
async function testPatientRiskScoring() {
  log('\n=== TESTING PATIENT RISK SCORING ===', 'header');
  
  try {
    const testCase = {
      patient_id: 'PAT001',
      age: 68,
      conditions: ['diabetes', 'hypertension', 'heart_disease'],
      medications: ['metformin', 'lisinopril', 'aspirin', 'atorvastatin', 'metoprolol', 'insulin'],
      lab_results: {
        glucose: 250,
        creatinine: 1.8,
        hemoglobin: 9.5
      },
      vital_signs: {
        blood_pressure_systolic: 160,
        bmi: 32
      }
    };
    
    const response = await axios.post(`${BASE_URL}/api/analytics/ml/risk-score`, testCase);
    
    if (response.data && response.data.risk_score !== undefined) {
      log('✓ Patient risk scoring complete', 'success');
      log(`  Risk score: ${response.data.risk_score}/100`, 'info');
      log(`  Risk level: ${response.data.risk_level}`, 'info');
      log(`  Confidence: ${response.data.confidence}`, 'info');
      log(`  Risk factors: ${response.data.risk_factors.join(', ')}`, 'info');
      log(`  Recommendations: ${response.data.recommendations[0]}`, 'info');
      
      testResults.mlModels.riskScoring = true;
      
      // Save risk assessment
      await fs.writeFile(
        '/root/patient-risk-assessment.json',
        JSON.stringify(response.data, null, 2)
      );
      
      return true;
    }
  } catch (error) {
    log(`✗ Patient risk scoring failed: ${error.message}`, 'error');
  }
  
  return false;
}

// 9. Test Model Performance
async function testModelPerformance() {
  log('\n=== TESTING MODEL PERFORMANCE METRICS ===', 'header');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/analytics/models/performance`);
    
    if (response.data && response.data.models) {
      log('✓ Model performance metrics retrieved', 'success');
      log(`  Total models: ${response.data.overall_metrics.total_models}`, 'info');
      log(`  Average accuracy: ${response.data.overall_metrics.average_accuracy}%`, 'info');
      log(`  Predictions (7 days): ${response.data.overall_metrics.total_predictions_7d}`, 'info');
      
      response.data.models.forEach(model => {
        log(`  ${model.name}: ${model.accuracy} accuracy`, 'info');
      });
      
      testResults.performance = response.data.overall_metrics;
      
      return true;
    }
  } catch (error) {
    log(`✗ Model performance retrieval failed: ${error.message}`, 'error');
  }
  
  return false;
}

// Generate comprehensive report
async function generateReport() {
  const report = {
    timestamp: testResults.timestamp,
    summary: {
      dataLakeEstablished: Object.values(testResults.dataLake).filter(v => v).length === Object.keys(testResults.dataLake).length,
      predictiveAnalyticsWorking: Object.values(testResults.predictiveAnalytics).filter(v => v).length === Object.keys(testResults.predictiveAnalytics).length,
      mlModelsOperational: Object.values(testResults.mlModels).filter(v => v).length === Object.keys(testResults.mlModels).length
    },
    details: testResults,
    verification: {
      centralizedDataLake: testResults.dataLake.aggregation && testResults.dataLake.export,
      predictivePipelines: {
        patientDemand: testResults.predictiveAnalytics.demandForecast,
        drugUsage: testResults.predictiveAnalytics.drugUsage,
        occupancy: testResults.predictiveAnalytics.occupancyForecast
      },
      aimlModels: {
        triageBot: testResults.mlModels.triageBot,
        fraudDetection: testResults.mlModels.fraudDetection,
        patientRiskScoring: testResults.mlModels.riskScoring
      }
    },
    files_created: [
      '/root/data-lake-metrics.json',
      '/root/data-lake-export.json',
      '/root/demand-predictions.json',
      '/root/occupancy-forecast.json',
      '/root/patient-risk-assessment.json'
    ]
  };
  
  await fs.writeFile(
    '/root/analytics-infrastructure-report.json',
    JSON.stringify(report, null, 2)
  );
  
  return report;
}

// Main test execution
async function main() {
  log('========================================', 'header');
  log('DATA ANALYTICS & AI INFRASTRUCTURE TEST', 'header');
  log('========================================', 'header');
  
  // Check if service is running
  try {
    const health = await axios.get(`${BASE_URL}/api/analytics/health`);
    log(`\n✓ Analytics service is running`, 'success');
    log(`  Status: ${health.data.status}`, 'info');
    log(`  Models loaded: ${health.data.models_loaded}`, 'info');
  } catch (error) {
    log(`\n✗ Analytics service not responding on port 3005`, 'error');
    log('Please start the service first: node /root/data-analytics-infrastructure.js', 'warning');
    process.exit(1);
  }
  
  // Run all tests
  const tests = [
    testDataLakeAggregation,
    testDataLakeExport,
    testDemandPrediction,
    testDrugUsagePrediction,
    testOccupancyForecast,
    testTriageBot,
    testFraudDetection,
    testPatientRiskScoring,
    testModelPerformance
  ];
  
  let successCount = 0;
  for (const test of tests) {
    const result = await test();
    if (result) successCount++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  // Generate report
  const report = await generateReport();
  
  // Display summary
  log('\n========================================', 'header');
  log('TEST SUMMARY', 'header');
  log('========================================', 'header');
  
  log(`\n✓ Tests Passed: ${successCount}/${tests.length}`, successCount === tests.length ? 'success' : 'warning');
  
  log('\n📊 DATA LAKE:', 'header');
  log(`  Aggregation: ${report.verification.centralizedDataLake ? '✓' : '✗'}`, report.verification.centralizedDataLake ? 'success' : 'error');
  log(`  Export: ${testResults.dataLake.export ? '✓' : '✗'}`, testResults.dataLake.export ? 'success' : 'error');
  log(`  Metrics: ${testResults.dataLake.metrics ? '✓' : '✗'}`, testResults.dataLake.metrics ? 'success' : 'error');
  
  log('\n📈 PREDICTIVE ANALYTICS:', 'header');
  log(`  Patient Demand: ${report.verification.predictivePipelines.patientDemand ? '✓' : '✗'}`, report.verification.predictivePipelines.patientDemand ? 'success' : 'error');
  log(`  Drug Usage: ${report.verification.predictivePipelines.drugUsage ? '✓' : '✗'}`, report.verification.predictivePipelines.drugUsage ? 'success' : 'error');
  log(`  Occupancy: ${report.verification.predictivePipelines.occupancy ? '✓' : '✗'}`, report.verification.predictivePipelines.occupancy ? 'success' : 'error');
  
  log('\n🤖 AI/ML MODELS:', 'header');
  log(`  Triage Bot: ${report.verification.aimlModels.triageBot ? '✓' : '✗'}`, report.verification.aimlModels.triageBot ? 'success' : 'error');
  log(`  Fraud Detection: ${report.verification.aimlModels.fraudDetection ? '✓' : '✗'}`, report.verification.aimlModels.fraudDetection ? 'success' : 'error');
  log(`  Risk Scoring: ${report.verification.aimlModels.patientRiskScoring ? '✓' : '✗'}`, report.verification.aimlModels.patientRiskScoring ? 'success' : 'error');
  
  log('\n📁 Report saved to: /root/analytics-infrastructure-report.json', 'info');
  
  const allPassed = report.summary.dataLakeEstablished && 
                    report.summary.predictiveAnalyticsWorking && 
                    report.summary.mlModelsOperational;
  
  if (allPassed) {
    log('\n✅ ALL REQUIREMENTS MET', 'success');
    log('Data Analytics & AI Infrastructure is fully operational', 'success');
  } else {
    log('\n⚠️ Some requirements not fully met', 'warning');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(console.error);
