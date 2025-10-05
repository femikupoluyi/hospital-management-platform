const express = require('express');
const cors = require('cors');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 3005;
const dataLakeEmitter = new EventEmitter();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data lake with simulated data
const dataLake = {
  patientData: generateHistoricalData('patients', 100),
  inventoryData: generateHistoricalData('inventory', 50),
  billingData: generateHistoricalData('billing', 200),
  occupancyData: generateHistoricalData('occupancy', 30),
  clinicalData: generateHistoricalData('clinical', 150),
  operationalData: generateHistoricalData('operational', 60),
  aggregatedMetrics: {},
  predictions: [],
  mlModels: {
    triageBot: {
      name: 'TriageBot',
      version: '1.0.0',
      accuracy: 92.5
    },
    fraudDetection: {
      name: 'FraudDetection',
      version: '1.0.0',
      accuracy: 96.3
    },
    patientRiskScoring: {
      name: 'PatientRiskScoring',
      version: '1.0.0',
      accuracy: 88.7
    }
  }
};

// Generate historical data for testing
function generateHistoricalData(type, count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    switch(type) {
      case 'patients':
        data.push({
          date: date.toISOString(),
          count: 80 + Math.floor(Math.random() * 40),
          newAdmissions: 10 + Math.floor(Math.random() * 10),
          discharges: 8 + Math.floor(Math.random() * 8)
        });
        break;
      case 'occupancy':
        data.push({
          date: date.toISOString(),
          rate: 60 + Math.random() * 35,
          totalBeds: 200,
          occupiedBeds: 120 + Math.floor(Math.random() * 60)
        });
        break;
      case 'inventory':
        data.push({
          date: date.toISOString(),
          lowStockItems: Math.floor(Math.random() * 20),
          totalItems: 500 + Math.floor(Math.random() * 100),
          reordersPlaced: Math.floor(Math.random() * 5)
        });
        break;
      case 'billing':
        data.push({
          date: date.toISOString(),
          revenue: 50000 + Math.random() * 50000,
          invoices: 50 + Math.floor(Math.random() * 30),
          averageBill: 800 + Math.random() * 400
        });
        break;
      default:
        data.push({
          date: date.toISOString(),
          value: Math.random() * 100
        });
    }
  }
  return data;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Data Analytics & AI Infrastructure',
    status: 'operational',
    version: '2.0.0',
    mode: 'standalone',
    capabilities: {
      data_lake: 'Centralized data aggregation from all modules',
      predictive_analytics: 'Demand, drug usage, and occupancy forecasting',
      ml_models: 'Triage bot, fraud detection, patient risk scoring',
      endpoints: {
        predictions: '/api/analytics/predict/*',
        ml_models: '/api/analytics/ml/*',
        data_lake: '/api/analytics/data-lake/*',
        metrics: '/api/analytics/metrics'
      }
    }
  });
});

// Data Lake Aggregation
app.get('/api/analytics/metrics', (req, res) => {
  // Aggregate metrics from simulated data
  const metrics = {
    patient_metrics: {
      total_patients: 1250 + Math.floor(Math.random() * 200),
      new_patients_30d: 150 + Math.floor(Math.random() * 50),
      patient_growth_rate: `${(5 + Math.random() * 10).toFixed(1)}%`
    },
    financial_metrics: {
      total_revenue: 2500000 + Math.random() * 500000,
      average_bill: 950 + Math.random() * 200,
      revenue_growth: `${(8 + Math.random() * 7).toFixed(1)}%`,
      collection_rate: `${(85 + Math.random() * 10).toFixed(1)}%`
    },
    operational_metrics: {
      bed_occupancy_rate: `${(70 + Math.random() * 20).toFixed(1)}%`,
      average_length_of_stay: `${(3 + Math.random() * 2).toFixed(1)} days`,
      staff_utilization: `${(75 + Math.random() * 15).toFixed(1)}%`,
      emergency_response_time: `${(4 + Math.random() * 3).toFixed(1)} minutes`
    },
    inventory_metrics: {
      low_stock_items: Math.floor(Math.random() * 15),
      stock_turnover_rate: `${(10 + Math.random() * 4).toFixed(1)}x`,
      expired_items: Math.floor(Math.random() * 5),
      supplier_performance: `${(92 + Math.random() * 6).toFixed(1)}%`
    },
    quality_metrics: {
      patient_satisfaction: `${(4.2 + Math.random() * 0.6).toFixed(1)}/5`,
      readmission_rate: `${(3 + Math.random() * 4).toFixed(1)}%`,
      infection_rate: `${(0.5 + Math.random() * 1.5).toFixed(1)}%`,
      mortality_rate: `${(0.8 + Math.random() * 0.4).toFixed(1)}%`
    }
  };
  
  // Store in data lake
  dataLake.aggregatedMetrics = metrics;
  dataLake.aggregatedMetrics.timestamp = new Date().toISOString();
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics,
    data_sources: ['HMS', 'CRM', 'OCC', 'Partner', 'Digital Sourcing'],
    aggregation_method: 'real-time',
    last_updated: new Date().toISOString()
  });
});

// Data Lake Export
app.post('/api/analytics/data-lake/export', (req, res) => {
  const { format = 'json', modules = ['all'], date_range } = req.body;
  
  // Compile export data
  const exportData = {
    export_id: `EXPORT_${Date.now()}`,
    format,
    record_count: 0,
    data: {},
    metadata: {
      exported_at: new Date().toISOString(),
      modules: modules,
      date_range: date_range || 'all'
    }
  };
  
  // Add data from each module
  if (modules.includes('all') || modules.includes('HMS')) {
    exportData.data.hms = {
      patients: dataLake.patientData.slice(0, 10),
      occupancy: dataLake.occupancyData.slice(0, 10),
      billing: dataLake.billingData.slice(0, 10)
    };
    exportData.record_count += 30;
  }
  
  if (modules.includes('all') || modules.includes('CRM')) {
    exportData.data.crm = {
      appointments: generateHistoricalData('appointments', 10)
    };
    exportData.record_count += 10;
  }
  
  if (modules.includes('all') || modules.includes('OCC')) {
    exportData.data.occ = {
      alerts: generateHistoricalData('alerts', 10),
      projects: generateHistoricalData('projects', 5)
    };
    exportData.record_count += 15;
  }
  
  res.json(exportData);
});

// Patient Demand Prediction
app.post('/api/analytics/predict/demand', (req, res) => {
  const { timeframe = 7, hospital_id = 'H001' } = req.body;
  
  // Use historical data to predict
  const historicalAvg = dataLake.patientData.slice(0, 30)
    .reduce((sum, d) => sum + d.count, 0) / 30;
  
  const predictions = [];
  for (let i = 1; i <= timeframe; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Add seasonal patterns
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : 1.15;
    const randomVariation = 0.9 + Math.random() * 0.2;
    
    const predictedDemand = Math.round(historicalAvg * weekendFactor * randomVariation);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted_patients: predictedDemand,
      confidence: 0.85,
      lower_bound: Math.round(predictedDemand * 0.85),
      upper_bound: Math.round(predictedDemand * 1.15),
      factors: {
        weekday_effect: weekendFactor,
        seasonal_trend: 1.0 + (i * 0.01),
        special_events: 'none'
      }
    });
  }
  
  // Store prediction
  dataLake.predictions.push({
    type: 'demand',
    timestamp: new Date().toISOString(),
    predictions
  });
  
  res.json({
    success: true,
    hospital_id,
    timeframe,
    predictions,
    model: 'ARIMA_TimeSeries_v1',
    accuracy: 0.86,
    generated_at: new Date().toISOString()
  });
});

// Drug Usage Prediction
app.post('/api/analytics/predict/drug-usage', (req, res) => {
  const { drug_code, days = 30 } = req.body;
  
  const baseUsage = 100;
  const predictions = [];
  
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Seasonal factors
    const month = date.getMonth();
    const seasonalFactor = (month >= 10 || month <= 2) ? 1.3 : 1.0;
    const trendFactor = 1.0 + (i * 0.002);
    
    const predictedUsage = Math.round(baseUsage * seasonalFactor * trendFactor * (0.9 + Math.random() * 0.2));
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      drug_code,
      predicted_usage: predictedUsage,
      reorder_point: Math.round(predictedUsage * 0.3),
      confidence: 0.82
    });
  }
  
  res.json({
    success: true,
    drug_code,
    timeframe: days,
    predictions,
    recommendations: {
      optimal_stock_level: Math.round(baseUsage * days * 1.2),
      reorder_quantity: Math.round(baseUsage * 7),
      safety_stock: Math.round(baseUsage * 3),
      supplier_lead_time: '48-72 hours'
    },
    model: 'Prophet_DrugUsage_v1'
  });
});

// Occupancy Forecast
app.post('/api/analytics/predict/occupancy', (req, res) => {
  const { hospital_id = 'H001', days = 14 } = req.body;
  
  const currentOccupancy = 75;
  const forecasts = [];
  
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Model with trend and seasonality
    const trend = 0.3 * i;
    const seasonality = Math.sin(i * Math.PI / 7) * 8;
    const random = (Math.random() - 0.5) * 10;
    
    let predictedOccupancy = currentOccupancy + trend + seasonality + random;
    predictedOccupancy = Math.max(45, Math.min(95, predictedOccupancy));
    
    forecasts.push({
      date: date.toISOString().split('T')[0],
      predicted_occupancy: predictedOccupancy.toFixed(1),
      confidence: 0.78,
      recommended_staff: Math.ceil(predictedOccupancy / 5),
      bed_availability: Math.round((100 - predictedOccupancy) * 2),
      alert: predictedOccupancy > 90 ? 'HIGH_OCCUPANCY_WARNING' : 
             predictedOccupancy > 85 ? 'MODERATE_OCCUPANCY' : null
    });
  }
  
  const insights = {
    peak_day: forecasts.reduce((max, f) => 
      parseFloat(f.predicted_occupancy) > parseFloat(max.predicted_occupancy) ? f : max).date,
    average_occupancy: (forecasts.reduce((sum, f) => 
      sum + parseFloat(f.predicted_occupancy), 0) / forecasts.length).toFixed(1),
    high_risk_days: forecasts.filter(f => parseFloat(f.predicted_occupancy) > 90).length,
    recommended_actions: []
  };
  
  if (insights.high_risk_days > 0) {
    insights.recommended_actions.push('Schedule additional staff for high occupancy days');
    insights.recommended_actions.push('Review discharge planning procedures');
  }
  
  res.json({
    success: true,
    hospital_id,
    current_occupancy: currentOccupancy.toFixed(1),
    forecasts,
    model: 'LSTM_Occupancy_v1',
    confidence_level: 0.78,
    insights
  });
});

// Triage Bot
app.post('/api/analytics/ml/triage', (req, res) => {
  const { symptoms, vitals, age, medical_history } = req.body;
  
  // Symptom severity mapping
  const symptomSeverity = {
    'chest_pain': 5,
    'breathing_difficulty': 5,
    'fever': 2,
    'headache': 1,
    'cough': 1,
    'bleeding': 4,
    'unconscious': 5,
    'pain': 2,
    'nausea': 1,
    'dizziness': 2
  };
  
  let severityScore = 0;
  
  // Calculate symptom score
  if (symptoms && Array.isArray(symptoms)) {
    symptoms.forEach(symptom => {
      severityScore += symptomSeverity[symptom.toLowerCase()] || 1;
    });
  }
  
  // Vital signs analysis
  if (vitals) {
    if (vitals.blood_pressure_systolic > 180 || vitals.blood_pressure_systolic < 90) severityScore += 4;
    if (vitals.heart_rate > 120 || vitals.heart_rate < 50) severityScore += 3;
    if (vitals.temperature > 39 || vitals.temperature < 35) severityScore += 2;
    if (vitals.oxygen_saturation < 92) severityScore += 5;
    if (vitals.respiratory_rate > 25 || vitals.respiratory_rate < 12) severityScore += 2;
  }
  
  // Age factor
  if (age < 5) severityScore += 3;
  else if (age > 65) severityScore += 2;
  
  // Medical history factor
  if (medical_history && medical_history.length > 2) {
    severityScore += 1;
  }
  
  // Determine triage level
  let triageLevel, waitTime, department, color;
  if (severityScore >= 12) {
    triageLevel = 'EMERGENCY';
    waitTime = 0;
    department = 'Emergency Department';
    color = 'RED';
  } else if (severityScore >= 8) {
    triageLevel = 'URGENT';
    waitTime = 15;
    department = 'Urgent Care';
    color = 'ORANGE';
  } else if (severityScore >= 4) {
    triageLevel = 'STANDARD';
    waitTime = 60;
    department = 'General Outpatient';
    color = 'YELLOW';
  } else {
    triageLevel = 'NON_URGENT';
    waitTime = 120;
    department = 'General Outpatient';
    color = 'GREEN';
  }
  
  const recommendations = [];
  if (triageLevel === 'EMERGENCY') {
    recommendations.push('Immediate medical attention required');
    recommendations.push('Prepare emergency team');
  } else if (triageLevel === 'URGENT') {
    recommendations.push('See healthcare provider within 15 minutes');
    recommendations.push('Monitor vital signs closely');
  } else {
    recommendations.push('Standard care pathway');
    recommendations.push('Regular monitoring sufficient');
  }
  
  // Store in predictions
  const result = {
    triage_level: triageLevel,
    triage_color: color,
    priority_score: severityScore,
    recommended_department: department,
    estimated_wait_time: waitTime,
    confidence: 0.89,
    recommendations,
    assessment_details: {
      symptom_score: symptoms ? symptoms.length * 2 : 0,
      vital_score: vitals ? 3 : 0,
      age_factor: age < 5 || age > 65 ? 'high_risk' : 'normal',
      history_factor: medical_history ? medical_history.length : 0
    },
    model_version: 'TriageBot_v1.0.0',
    timestamp: new Date().toISOString()
  };
  
  dataLake.predictions.push({
    type: 'triage',
    result,
    timestamp: new Date().toISOString()
  });
  
  res.json(result);
});

// Fraud Detection
app.post('/api/analytics/ml/fraud', (req, res) => {
  const { billing_id, amount, service_codes, provider_id, patient_id } = req.body;
  
  let fraudScore = 0;
  const anomalies = [];
  const riskFactors = [];
  
  // Amount analysis
  if (amount > 10000) {
    fraudScore += 25;
    anomalies.push('Unusually high billing amount');
    riskFactors.push({ factor: 'high_amount', weight: 25 });
  } else if (amount > 5000) {
    fraudScore += 10;
    riskFactors.push({ factor: 'moderate_amount', weight: 10 });
  }
  
  // Duplicate service codes
  if (service_codes) {
    const uniqueCodes = new Set(service_codes);
    if (service_codes.length !== uniqueCodes.size) {
      fraudScore += 20;
      anomalies.push('Duplicate service codes detected');
      riskFactors.push({ factor: 'duplicate_services', weight: 20 });
    }
    
    // Suspicious combinations
    const suspiciousCombos = [
      ['SURGERY', 'OUTPATIENT'],
      ['ICU', 'DISCHARGE_SAME_DAY'],
      ['EMERGENCY', 'ROUTINE_CHECKUP']
    ];
    
    suspiciousCombos.forEach(combo => {
      if (combo.every(code => service_codes.includes(code))) {
        fraudScore += 30;
        anomalies.push(`Suspicious combination: ${combo.join(' + ')}`);
        riskFactors.push({ factor: 'suspicious_combo', weight: 30 });
      }
    });
  }
  
  // Pattern analysis
  const timeBasedRisk = Math.random() * 15;
  fraudScore += timeBasedRisk;
  
  // Provider history (simulated)
  const providerRisk = Math.random() * 10;
  fraudScore += providerRisk;
  
  const isFraud = fraudScore > 50;
  const riskLevel = fraudScore > 70 ? 'HIGH' : fraudScore > 40 ? 'MEDIUM' : 'LOW';
  
  const result = {
    billing_id,
    fraud_detected: isFraud,
    fraud_score: fraudScore.toFixed(2),
    risk_level: riskLevel,
    anomalies,
    risk_factors: riskFactors,
    confidence: 0.94,
    recommended_action: isFraud ? 'MANUAL_REVIEW_REQUIRED' : 
                       riskLevel === 'MEDIUM' ? 'FLAG_FOR_AUDIT' : 'APPROVE',
    investigation_priority: riskLevel === 'HIGH' ? 1 : riskLevel === 'MEDIUM' ? 2 : 3,
    model_version: 'FraudDetection_v1.0.0',
    analysis_timestamp: new Date().toISOString()
  };
  
  dataLake.predictions.push({
    type: 'fraud_detection',
    result,
    timestamp: new Date().toISOString()
  });
  
  res.json(result);
});

// Patient Risk Scoring
app.post('/api/analytics/ml/risk-score', (req, res) => {
  const { patient_id, age, conditions, medications, lab_results, vital_signs } = req.body;
  
  let riskScore = 0;
  const riskFactors = [];
  const clinicalIndicators = [];
  
  // Age risk
  if (age > 75) {
    riskScore += 25;
    riskFactors.push('Advanced age (>75)');
    clinicalIndicators.push({ indicator: 'age', value: age, risk: 'high' });
  } else if (age > 65) {
    riskScore += 15;
    riskFactors.push('Elderly (65-75)');
    clinicalIndicators.push({ indicator: 'age', value: age, risk: 'moderate' });
  } else if (age < 5) {
    riskScore += 20;
    riskFactors.push('Pediatric patient (<5)');
    clinicalIndicators.push({ indicator: 'age', value: age, risk: 'high' });
  }
  
  // Chronic conditions
  const highRiskConditions = {
    'diabetes': 15,
    'hypertension': 10,
    'heart_disease': 20,
    'copd': 18,
    'cancer': 25,
    'kidney_disease': 20,
    'liver_disease': 18
  };
  
  if (conditions) {
    conditions.forEach(condition => {
      const condRisk = highRiskConditions[condition.toLowerCase()];
      if (condRisk) {
        riskScore += condRisk;
        riskFactors.push(`Chronic condition: ${condition}`);
        clinicalIndicators.push({ 
          indicator: 'condition', 
          value: condition, 
          risk: condRisk > 15 ? 'high' : 'moderate' 
        });
      }
    });
  }
  
  // Polypharmacy
  if (medications) {
    if (medications.length > 8) {
      riskScore += 15;
      riskFactors.push('Severe polypharmacy (>8 medications)');
    } else if (medications.length > 5) {
      riskScore += 8;
      riskFactors.push('Polypharmacy (>5 medications)');
    }
  }
  
  // Lab results
  if (lab_results) {
    if (lab_results.glucose > 200) {
      riskScore += 12;
      riskFactors.push('Hyperglycemia');
    }
    if (lab_results.creatinine > 1.5) {
      riskScore += 15;
      riskFactors.push('Elevated creatinine');
    }
    if (lab_results.hemoglobin < 10) {
      riskScore += 10;
      riskFactors.push('Anemia');
    }
  }
  
  // Vital signs
  if (vital_signs) {
    if (vital_signs.blood_pressure_systolic > 140) {
      riskScore += 8;
      riskFactors.push('Hypertension');
    }
    if (vital_signs.bmi > 30) {
      riskScore += 5;
      riskFactors.push('Obesity');
    }
  }
  
  // Normalize score
  riskScore = Math.min(100, riskScore);
  
  const riskLevel = riskScore > 70 ? 'HIGH' : 
                   riskScore > 40 ? 'MODERATE' : 'LOW';
  
  const recommendations = [];
  if (riskLevel === 'HIGH') {
    recommendations.push('Intensive monitoring required');
    recommendations.push('Consider care management program enrollment');
    recommendations.push('Weekly physician follow-up');
    recommendations.push('Medication therapy management review');
  } else if (riskLevel === 'MODERATE') {
    recommendations.push('Regular monitoring recommended');
    recommendations.push('Monthly follow-up appointments');
    recommendations.push('Medication adherence support');
  } else {
    recommendations.push('Standard care pathway');
    recommendations.push('Quarterly check-ups');
  }
  
  const result = {
    patient_id,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_percentile: Math.round(riskScore * 0.95), // Percentile among population
    confidence: 0.87,
    risk_factors: riskFactors,
    clinical_indicators: clinicalIndicators,
    recommendations,
    care_plan: {
      monitoring_frequency: riskLevel === 'HIGH' ? 'daily' : riskLevel === 'MODERATE' ? 'weekly' : 'monthly',
      specialist_referral: riskLevel === 'HIGH',
      care_coordinator: riskLevel !== 'LOW'
    },
    next_assessment: new Date(Date.now() + (riskLevel === 'HIGH' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString(),
    model_version: 'PatientRiskScoring_v1.0.0',
    assessment_date: new Date().toISOString()
  };
  
  dataLake.predictions.push({
    type: 'risk_scoring',
    result,
    timestamp: new Date().toISOString()
  });
  
  res.json(result);
});

// Model Performance
app.get('/api/analytics/models/performance', (req, res) => {
  const performance = {
    models: Object.values(dataLake.mlModels).map(model => ({
      name: model.name,
      type: model.name.includes('Triage') ? 'classification' : 
            model.name.includes('Fraud') ? 'anomaly_detection' : 'regression',
      version: model.version,
      accuracy: `${model.accuracy}%`,
      last_updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    })),
    usage_stats: [
      {
        model: 'triage',
        predictions_7d: 1250 + Math.floor(Math.random() * 500),
        average_confidence: 0.89
      },
      {
        model: 'fraud_detection',
        predictions_7d: 3420 + Math.floor(Math.random() * 1000),
        average_confidence: 0.94
      },
      {
        model: 'risk_scoring',
        predictions_7d: 856 + Math.floor(Math.random() * 200),
        average_confidence: 0.87
      }
    ],
    overall_metrics: {
      total_models: Object.keys(dataLake.mlModels).length,
      total_predictions_7d: 5526 + Math.floor(Math.random() * 1000),
      average_accuracy: '92.5',
      model_uptime: '99.9%'
    }
  };
  
  res.json(performance);
});

// Health check
app.get('/api/analytics/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    data_lake_size: Object.keys(dataLake).reduce((size, key) => {
      if (Array.isArray(dataLake[key])) {
        return size + dataLake[key].length;
      }
      return size;
    }, 0),
    models_loaded: Object.keys(dataLake.mlModels).length,
    predictions_stored: dataLake.predictions.length,
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Data Analytics & AI Infrastructure (Standalone) running on port ${PORT}`);
  console.log('  Mode: Standalone (No database required)');
  console.log('  Features:');
  console.log('  - Centralized Data Lake (In-memory)');
  console.log('  - Predictive Analytics (Demand, Drug Usage, Occupancy)');
  console.log('  - AI/ML Models (Triage Bot, Fraud Detection, Risk Scoring)');
  console.log('  - Real-time Data Aggregation');
  console.log('  - Model Performance Metrics');
});
