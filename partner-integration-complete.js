const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
};

// Initialize database
async function initDatabase() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Create schema
    await client.query('CREATE SCHEMA IF NOT EXISTS partner');
    
    // Create tables for partner integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner.insurance_claims (
        id SERIAL PRIMARY KEY,
        claim_id VARCHAR(50) UNIQUE,
        patient_id VARCHAR(50),
        patient_name VARCHAR(255),
        provider_id VARCHAR(50),
        provider_name VARCHAR(255),
        claim_amount DECIMAL(10,2),
        services JSONB,
        diagnosis TEXT,
        status VARCHAR(50) DEFAULT 'submitted',
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approval_date TIMESTAMP,
        response JSONB
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner.pharmacy_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE,
        hospital_id VARCHAR(50),
        supplier_id VARCHAR(50),
        items JSONB,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        urgency VARCHAR(20),
        delivery_address TEXT,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_date TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner.telemedicine_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(50) UNIQUE,
        patient_id VARCHAR(50),
        patient_name VARCHAR(255),
        doctor_id VARCHAR(50),
        doctor_name VARCHAR(255),
        scheduled_time TIMESTAMP,
        consultation_type VARCHAR(50),
        duration INT,
        platform VARCHAR(50),
        meeting_link TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner.compliance_reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) UNIQUE,
        report_type VARCHAR(50),
        hospital_id VARCHAR(50),
        period VARCHAR(20),
        start_date DATE,
        end_date DATE,
        format VARCHAR(20),
        content JSONB,
        file_path TEXT,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted BOOLEAN DEFAULT FALSE,
        submission_date TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner.drug_inventory (
        id SERIAL PRIMARY KEY,
        drug_code VARCHAR(50) UNIQUE,
        drug_name VARCHAR(255),
        supplier_id VARCHAR(50),
        available_quantity INT,
        unit_price DECIMAL(10,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample drug inventory
    await client.query(`
      INSERT INTO partner.drug_inventory (drug_code, drug_name, supplier_id, available_quantity, unit_price)
      VALUES 
        ('PARA500', 'Paracetamol 500mg', 'PHARMA001', 10000, 0.50),
        ('AMOX250', 'Amoxicillin 250mg', 'PHARMA001', 5000, 1.20),
        ('INSULIN', 'Insulin', 'PHARMA001', 1000, 15.00),
        ('ASPIRIN', 'Aspirin 100mg', 'PHARMA001', 8000, 0.30)
      ON CONFLICT (drug_code) DO NOTHING
    `);
    
    console.log('✓ Partner integration database initialized');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    await client.end();
  }
}

// Helper function to generate IDs
function generateId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Partner & Ecosystem Integration',
    status: 'operational',
    version: '2.0.0',
    modules: {
      insurance: '/api/insurance',
      pharmacy: '/api/pharmacy',
      telemedicine: '/api/telemedicine',
      compliance: '/api/compliance'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    integrations: ['insurance', 'pharmacy', 'telemedicine', 'compliance']
  });
});

// ============= INSURANCE INTEGRATION =============

// Submit insurance claim
app.post('/api/insurance/claims', async (req, res) => {
  const client = new Client(dbConfig);
  const claimId = generateId('CLM');
  
  try {
    await client.connect();
    
    const { patientId, patientName, providerId, providerName, claimAmount, services, diagnosis } = req.body;
    
    const result = await client.query(
      `INSERT INTO partner.insurance_claims 
       (claim_id, patient_id, patient_name, provider_id, provider_name, claim_amount, services, diagnosis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [claimId, patientId, patientName, providerId, providerName, claimAmount, JSON.stringify(services), diagnosis]
    );
    
    // Simulate API call to insurance provider
    const response = {
      success: true,
      claimId: claimId,
      status: 'submitted',
      message: 'Claim submitted successfully to ' + providerName,
      estimatedProcessingTime: '24-48 hours',
      trackingNumber: crypto.randomBytes(8).toString('hex').toUpperCase()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Check claim status
app.get('/api/insurance/claims/status/:claimId', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM partner.insurance_claims WHERE claim_id = $1',
      [req.params.claimId]
    );
    
    if (result.rows.length === 0) {
      // Simulate status for demo
      res.json({
        claimId: req.params.claimId,
        status: 'processing',
        message: 'Claim is being processed by the insurance provider'
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Verify insurance eligibility
app.post('/api/insurance/eligibility', async (req, res) => {
  const { patientId, providerId, serviceDate } = req.body;
  
  // Simulate eligibility check
  res.json({
    eligible: true,
    patientId,
    providerId,
    coverageLevel: 'Premium',
    deductibleMet: true,
    coveragePercentage: 80,
    remainingBenefit: 100000,
    validUntil: '2024-12-31'
  });
});

// Pre-authorization
app.post('/api/insurance/preauth', async (req, res) => {
  const { patientId, providerId, procedureCode, estimatedCost } = req.body;
  
  res.json({
    authorizationNumber: generateId('AUTH'),
    approved: true,
    patientId,
    procedureCode,
    approvedAmount: estimatedCost * 0.8,
    validFor: 30,
    conditions: 'Pre-authorization valid for 30 days from issue date'
  });
});

// ============= PHARMACY INTEGRATION =============

// Create pharmacy order
app.post('/api/pharmacy/orders', async (req, res) => {
  const client = new Client(dbConfig);
  const orderId = generateId('ORD');
  
  try {
    await client.connect();
    
    const { hospitalId, items, supplierId, urgency, deliveryAddress } = req.body;
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const priceResult = await client.query(
        'SELECT unit_price FROM partner.drug_inventory WHERE drug_code = $1',
        [item.drugCode]
      );
      if (priceResult.rows.length > 0) {
        totalAmount += priceResult.rows[0].unit_price * item.quantity;
      }
    }
    
    await client.query(
      `INSERT INTO partner.pharmacy_orders 
       (order_id, hospital_id, supplier_id, items, total_amount, urgency, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, hospitalId, supplierId, JSON.stringify(items), totalAmount, urgency, deliveryAddress]
    );
    
    res.json({
      success: true,
      orderId,
      hospitalId,
      supplierId,
      totalAmount,
      estimatedDelivery: urgency === 'urgent' ? '4-6 hours' : '24-48 hours',
      status: 'confirmed',
      trackingNumber: crypto.randomBytes(8).toString('hex').toUpperCase()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Check drug availability
app.post('/api/pharmacy/availability', async (req, res) => {
  const client = new Client(dbConfig);
  const { drugs, supplierId } = req.body;
  
  try {
    await client.connect();
    
    const availability = [];
    for (const drugCode of drugs) {
      const result = await client.query(
        'SELECT * FROM partner.drug_inventory WHERE drug_code = $1 AND supplier_id = $2',
        [drugCode, supplierId]
      );
      
      if (result.rows.length > 0) {
        availability.push({
          drugCode,
          available: true,
          quantity: result.rows[0].available_quantity,
          unitPrice: result.rows[0].unit_price
        });
      } else {
        availability.push({
          drugCode,
          available: false,
          quantity: 0
        });
      }
    }
    
    res.json({ supplierId, availability });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Get order status
app.get('/api/pharmacy/orders/:orderId/status', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM partner.pharmacy_orders WHERE order_id = $1',
      [req.params.orderId]
    );
    
    if (result.rows.length === 0) {
      res.json({
        orderId: req.params.orderId,
        status: 'processing',
        message: 'Order is being processed'
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Auto-restock
app.post('/api/pharmacy/auto-restock', async (req, res) => {
  const { hospitalId, lowStockItems } = req.body;
  const orders = [];
  
  for (const item of lowStockItems) {
    const orderId = generateId('AUTO');
    orders.push({
      orderId,
      drugCode: item.drugCode,
      reorderQuantity: item.reorderQuantity,
      status: 'auto-generated',
      estimatedDelivery: '24-48 hours'
    });
  }
  
  res.json({
    success: true,
    hospitalId,
    ordersGenerated: orders.length,
    orders
  });
});

// ============= TELEMEDICINE INTEGRATION =============

// Schedule telemedicine session
app.post('/api/telemedicine/sessions', async (req, res) => {
  const client = new Client(dbConfig);
  const sessionId = generateId('TEL');
  
  try {
    await client.connect();
    
    const { patientId, patientName, doctorId, doctorName, scheduledTime, consultationType, duration, platform } = req.body;
    
    // Generate meeting link
    const meetingLink = `https://${platform}.com/meeting/${crypto.randomBytes(16).toString('hex')}`;
    
    await client.query(
      `INSERT INTO partner.telemedicine_sessions 
       (session_id, patient_id, patient_name, doctor_id, doctor_name, scheduled_time, consultation_type, duration, platform, meeting_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [sessionId, patientId, patientName, doctorId, doctorName, scheduledTime, consultationType, duration, platform, meetingLink]
    );
    
    res.json({
      success: true,
      sessionId,
      meetingLink,
      scheduledTime,
      duration,
      platform,
      status: 'scheduled',
      confirmationSent: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Get session link
app.get('/api/telemedicine/sessions/:sessionId/link', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT meeting_link, scheduled_time, platform FROM partner.telemedicine_sessions WHERE session_id = $1',
      [req.params.sessionId]
    );
    
    if (result.rows.length === 0) {
      res.json({
        sessionId: req.params.sessionId,
        meetingLink: `https://meet.example.com/session/${req.params.sessionId}`,
        platform: 'default'
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Update session status
app.put('/api/telemedicine/sessions/:sessionId/status', async (req, res) => {
  const client = new Client(dbConfig);
  const { status, notes, prescription } = req.body;
  
  try {
    await client.connect();
    
    await client.query(
      'UPDATE partner.telemedicine_sessions SET status = $1, notes = $2 WHERE session_id = $3',
      [status, notes || prescription, req.params.sessionId]
    );
    
    res.json({
      success: true,
      sessionId: req.params.sessionId,
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Get available slots
app.post('/api/telemedicine/availability', async (req, res) => {
  const { doctorId, date } = req.body;
  
  // Generate sample available slots
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    if (Math.random() > 0.3) { // 70% availability
      slots.push({
        time: `${hour}:00`,
        available: true,
        duration: 30
      });
    }
  }
  
  res.json({
    doctorId,
    date,
    slots
  });
});

// ============= COMPLIANCE REPORTING =============

// Generate HIPAA compliance report
app.post('/api/compliance/reports/hipaa', async (req, res) => {
  const client = new Client(dbConfig);
  const reportId = generateId('HIPAA');
  
  try {
    await client.connect();
    
    const { hospitalId, reportPeriod, startDate, endDate, includeAuditLog } = req.body;
    
    // Generate report content
    const reportContent = {
      hospitalId,
      period: reportPeriod,
      dateRange: { start: startDate, end: endDate },
      compliance: {
        dataEncryption: 'Compliant',
        accessControls: 'Compliant',
        auditLogging: 'Compliant',
        patientRights: 'Compliant',
        breachNotification: 'No breaches reported',
        training: '98% staff trained'
      },
      metrics: {
        totalRecords: 15234,
        accessRequests: 1823,
        authorizedAccess: 1820,
        deniedAccess: 3,
        auditsPerformed: 12
      }
    };
    
    await client.query(
      `INSERT INTO partner.compliance_reports 
       (report_id, report_type, hospital_id, period, start_date, end_date, format, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [reportId, 'hipaa', hospitalId, reportPeriod, startDate, endDate, 'pdf', JSON.stringify(reportContent)]
    );
    
    res.json({
      success: true,
      reportId,
      reportUrl: `/api/compliance/reports/download/${reportId}`,
      format: 'pdf',
      generated: true,
      content: reportContent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Generate disease surveillance report
app.post('/api/compliance/reports/surveillance', async (req, res) => {
  const reportId = generateId('SURV');
  const { diseases, period, region } = req.body;
  
  const reportContent = {
    reportId,
    period,
    region,
    diseases: diseases.map(disease => ({
      name: disease,
      cases: Math.floor(Math.random() * 100),
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)]
    })),
    generatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    reportId,
    reportUrl: `/api/compliance/reports/download/${reportId}`,
    content: reportContent,
    submitted: true
  });
});

// Export government report
app.post('/api/compliance/reports/government', async (req, res) => {
  const reportId = generateId('GOV');
  const { reportType, format, hospitalId, month } = req.body;
  
  res.json({
    success: true,
    reportId,
    reportType,
    format,
    reportUrl: `/api/compliance/reports/download/${reportId}`,
    status: 'generated',
    submissionStatus: 'ready',
    exportPath: `/exports/government/${reportId}.${format}`
  });
});

// Generate NGO report
app.post('/api/compliance/reports/ngo', async (req, res) => {
  const reportId = generateId('NGO');
  const { organizationId, metrics, period } = req.body;
  
  const reportContent = {
    organization: organizationId,
    period,
    metrics: metrics.map(metric => ({
      name: metric,
      value: Math.floor(Math.random() * 1000),
      unit: metric.includes('volume') ? 'patients' : 'percentage'
    }))
  };
  
  res.json({
    success: true,
    reportId,
    organizationId,
    reportUrl: `/api/compliance/reports/download/${reportId}`,
    content: reportContent,
    autoSubmitted: true
  });
});

// Schedule automated reports
app.post('/api/compliance/schedule', async (req, res) => {
  const { reportType, schedule, recipients, autoSubmit } = req.body;
  const scheduleId = generateId('SCH');
  
  res.json({
    success: true,
    scheduleId,
    reportType,
    schedule,
    recipients,
    autoSubmit,
    nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  });
});

// Download report
app.get('/api/compliance/reports/download/:reportId', async (req, res) => {
  res.json({
    reportId: req.params.reportId,
    downloadUrl: `https://reports.hospital.com/download/${req.params.reportId}`,
    expiresIn: '24 hours'
  });
});

// Initialize and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Partner Integration Service running on port ${PORT}`);
    console.log('  Available modules:');
    console.log('  - Insurance Integration');
    console.log('  - Pharmacy Integration');
    console.log('  - Telemedicine Integration');
    console.log('  - Compliance Reporting');
  });
});
