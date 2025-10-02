const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const PDFDocument = require('pdfkit'); // Commenting out for now
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 9000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('/root'));

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile('/root/hospital-management-platform-full/modules/hms/hms-final.html');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'HMS Backend Complete',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ==================== ELECTRONIC MEDICAL RECORDS ====================

// Get all patient records with search and pagination
app.get('/api/emr/records', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        e.patient_id,
        e.patient_name,
        e.patient_age,
        e.patient_gender,
        e.contact_phone,
        e.contact_email,
        COUNT(DISTINCT e.encounter_id) as total_visits,
        MAX(e.encounter_date) as last_visit,
        array_agg(DISTINCT d.diagnosis_code) as diagnoses
      FROM emr.encounters e
      LEFT JOIN emr.diagnoses d ON e.encounter_id = d.encounter_id
    `;
    
    const params = [];
    if (search) {
      query += ` WHERE (e.patient_name ILIKE $1 OR e.patient_id ILIKE $1 OR e.contact_phone ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += `
      GROUP BY e.patient_id, e.patient_name, e.patient_age, e.patient_gender, 
               e.contact_phone, e.contact_email
      ORDER BY last_visit DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT patient_id) as total FROM emr.encounters`;
    if (search) {
      countQuery += ` WHERE (patient_name ILIKE $1 OR patient_id ILIKE $1 OR contact_phone ILIKE $1)`;
    }
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    
    res.json({
      records: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ error: 'Failed to fetch patient records' });
  }
});

// Get detailed patient record
app.get('/api/emr/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get patient basic info
    const patientQuery = `
      SELECT DISTINCT 
        patient_id, patient_name, patient_age, patient_gender,
        contact_phone, contact_email
      FROM emr.encounters 
      WHERE patient_id = $1
      LIMIT 1
    `;
    const patientResult = await pool.query(patientQuery, [id]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get encounters
    const encountersQuery = `
      SELECT * FROM emr.encounters 
      WHERE patient_id = $1 
      ORDER BY encounter_date DESC
    `;
    const encountersResult = await pool.query(encountersQuery, [id]);
    
    // Get diagnoses
    const diagnosesQuery = `
      SELECT d.* FROM emr.diagnoses d
      JOIN emr.encounters e ON d.encounter_id = e.encounter_id
      WHERE e.patient_id = $1
      ORDER BY d.diagnosis_date DESC
    `;
    const diagnosesResult = await pool.query(diagnosesQuery, [id]);
    
    // Get prescriptions
    const prescriptionsQuery = `
      SELECT p.* FROM emr.prescriptions p
      JOIN emr.encounters e ON p.encounter_id = e.encounter_id
      WHERE e.patient_id = $1
      ORDER BY p.prescription_date DESC
    `;
    const prescriptionsResult = await pool.query(prescriptionsQuery, [id]);
    
    // Get lab results
    const labResultsQuery = `
      SELECT l.* FROM emr.lab_results l
      JOIN emr.encounters e ON l.encounter_id = e.encounter_id
      WHERE e.patient_id = $1
      ORDER BY l.test_date DESC
    `;
    const labResultsResult = await pool.query(labResultsQuery, [id]);
    
    res.json({
      patient: patientResult.rows[0],
      encounters: encountersResult.rows,
      diagnoses: diagnosesResult.rows,
      prescriptions: prescriptionsResult.rows,
      labResults: labResultsResult.rows
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

// Create new patient record
app.post('/api/emr/patients', async (req, res) => {
  try {
    const { name, age, gender, phone, email, address, blood_type, allergies, emergency_contact } = req.body;
    
    // Generate patient ID
    const patientId = 'PT-' + Date.now().toString().slice(-5);
    
    // Create first encounter
    const query = `
      INSERT INTO emr.encounters (
        patient_id, patient_name, patient_age, patient_gender, 
        contact_phone, contact_email, encounter_date, encounter_type, 
        chief_complaint, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'Registration', 
        'New Patient Registration', 'Active'
      ) RETURNING *
    `;
    const values = [patientId, name, age, gender, phone, email];
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      patient: result.rows[0],
      message: `Patient ${name} registered successfully with ID: ${patientId}`
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient record' });
  }
});

// Add diagnosis
app.post('/api/emr/diagnoses', async (req, res) => {
  try {
    const { encounter_id, diagnosis_code, description, severity } = req.body;
    
    const query = `
      INSERT INTO emr.diagnoses (
        encounter_id, diagnosis_code, diagnosis_desc, severity, diagnosis_date
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [encounter_id, diagnosis_code, description, severity]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding diagnosis:', error);
    res.status(500).json({ error: 'Failed to add diagnosis' });
  }
});

// Add prescription
app.post('/api/emr/prescriptions', async (req, res) => {
  try {
    const { encounter_id, medication, dosage, frequency, duration, instructions } = req.body;
    
    const query = `
      INSERT INTO emr.prescriptions (
        encounter_id, medication_name, dosage, frequency, duration, 
        instructions, prescription_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'Active')
      RETURNING *
    `;
    const result = await pool.query(query, [
      encounter_id, medication, dosage, frequency, duration, instructions
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ error: 'Failed to add prescription' });
  }
});

// Add lab result
app.post('/api/emr/lab-results', async (req, res) => {
  try {
    const { encounter_id, test_name, test_type, result_value, normal_range, interpretation } = req.body;
    
    const query = `
      INSERT INTO emr.lab_results (
        encounter_id, test_name, test_type, result_value, 
        normal_range, interpretation, test_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 'Completed')
      RETURNING *
    `;
    const result = await pool.query(query, [
      encounter_id, test_name, test_type, result_value, normal_range, interpretation
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding lab result:', error);
    res.status(500).json({ error: 'Failed to add lab result' });
  }
});

// ==================== BILLING & REVENUE ====================

// Get all invoices
app.get('/api/billing/invoices', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        i.*,
        COALESCE(SUM(p.amount), 0) as paid_amount,
        i.total_amount - COALESCE(SUM(p.amount), 0) as balance
      FROM billing.invoices i
      LEFT JOIN billing.payments p ON i.invoice_id = p.invoice_id
    `;
    
    const params = [];
    if (status) {
      query += ` WHERE i.payment_status = $1`;
      params.push(status);
    }
    
    query += `
      GROUP BY i.invoice_id
      ORDER BY i.invoice_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice details
app.get('/api/billing/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get invoice
    const invoiceQuery = `
      SELECT * FROM billing.invoices WHERE invoice_id = $1
    `;
    const invoiceResult = await pool.query(invoiceQuery, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Get invoice items
    const itemsQuery = `
      SELECT * FROM billing.invoice_items WHERE invoice_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);
    
    // Get payments
    const paymentsQuery = `
      SELECT * FROM billing.payments WHERE invoice_id = $1
      ORDER BY payment_date DESC
    `;
    const paymentsResult = await pool.query(paymentsQuery, [id]);
    
    res.json({
      invoice: invoiceResult.rows[0],
      items: itemsResult.rows,
      payments: paymentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// Create invoice
app.post('/api/billing/invoices', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      patient_id, patient_name, payment_method, 
      items, insurance_provider, insurance_number 
    } = req.body;
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // Create invoice
    const invoiceQuery = `
      INSERT INTO billing.invoices (
        invoice_number, patient_id, patient_name, invoice_date,
        total_amount, payment_method, payment_status,
        insurance_provider, insurance_number
      ) VALUES (
        'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(CAST(FLOOR(RANDOM() * 1000) AS TEXT), 3, '0'),
        $1, $2, CURRENT_TIMESTAMP, $3, $4, 'Pending', $5, $6
      ) RETURNING *
    `;
    const invoiceResult = await client.query(invoiceQuery, [
      patient_id, patient_name, total, payment_method, 
      insurance_provider, insurance_number
    ]);
    const invoice = invoiceResult.rows[0];
    
    // Add invoice items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO billing.invoice_items (
          invoice_id, service_code, description, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(itemQuery, [
        invoice.invoice_id, item.service_code, item.description,
        item.quantity, item.unit_price, item.quantity * item.unit_price
      ]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      invoice: invoice,
      message: `Invoice ${invoice.invoice_number} created successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  } finally {
    client.release();
  }
});

// Record payment
app.post('/api/billing/payments', async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, reference_number } = req.body;
    
    // Record payment
    const paymentQuery = `
      INSERT INTO billing.payments (
        invoice_id, amount, payment_method, payment_date, 
        reference_number, status
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'Completed')
      RETURNING *
    `;
    const paymentResult = await pool.query(paymentQuery, [
      invoice_id, amount, payment_method, reference_number
    ]);
    
    // Update invoice status if fully paid
    const checkQuery = `
      SELECT 
        i.total_amount,
        COALESCE(SUM(p.amount), 0) as paid_amount
      FROM billing.invoices i
      LEFT JOIN billing.payments p ON i.invoice_id = p.invoice_id
      WHERE i.invoice_id = $1
      GROUP BY i.total_amount
    `;
    const checkResult = await pool.query(checkQuery, [invoice_id]);
    
    if (checkResult.rows[0].paid_amount >= checkResult.rows[0].total_amount) {
      await pool.query(
        `UPDATE billing.invoices SET payment_status = 'Paid' WHERE invoice_id = $1`,
        [invoice_id]
      );
    }
    
    res.json({
      success: true,
      payment: paymentResult.rows[0],
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// ==================== INVENTORY MANAGEMENT ====================

// Get all inventory items
app.get('/api/inventory/items', async (req, res) => {
  try {
    const query = `
      SELECT 
        item_id,
        item_name as name,
        category,
        COALESCE(sl.current_stock, 0) as current_quantity,
        reorder_level,
        unit_of_measure as unit
      FROM inventory.items i
      LEFT JOIN inventory.stock_levels sl ON i.item_id = sl.item_id
      WHERE i.is_active = true
      ORDER BY item_name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get low stock items
app.get('/api/inventory/low-stock', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.item_id,
        i.item_name as name,
        i.category,
        COALESCE(sl.current_stock, 0) as current_quantity,
        i.reorder_level,
        i.unit_of_measure as unit
      FROM inventory.items i
      LEFT JOIN inventory.stock_levels sl ON i.item_id = sl.item_id
      WHERE i.is_active = true 
        AND COALESCE(sl.current_stock, 0) <= i.reorder_level
      ORDER BY (COALESCE(sl.current_stock, 0)::float / NULLIF(i.reorder_level, 0)) ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Add stock entry
app.post('/api/inventory/stock-entry', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { item_id, quantity, type, notes, supplier_id, batch_number, expiry_date } = req.body;
    
    // Record stock movement
    const moveQuery = `
      INSERT INTO inventory.stock_movements (
        movement_id, item_id, movement_type, quantity, 
        batch_number, expiry_date, notes, movement_date, created_at
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const moveResult = await client.query(moveQuery, [
      item_id, type === 'IN' ? 'receipt' : 'issue', quantity, 
      batch_number, expiry_date, notes
    ]);
    
    // Update stock levels
    const updateOp = type === 'IN' ? '+' : '-';
    const stockQuery = `
      UPDATE inventory.stock_levels 
      SET current_stock = current_stock ${updateOp} $1,
          last_updated = CURRENT_TIMESTAMP
      WHERE item_id = $2
      RETURNING *
    `;
    const stockResult = await client.query(stockQuery, [quantity, item_id]);
    
    // If no stock level exists, create one
    if (stockResult.rows.length === 0 && type === 'IN') {
      const createStockQuery = `
        INSERT INTO inventory.stock_levels (
          stock_id, item_id, hospital_id, location, current_stock, 
          minimum_stock, maximum_stock, last_updated
        ) VALUES (
          gen_random_uuid(), $1, gen_random_uuid(), 'Main Storage', $2,
          10, 1000, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      const createResult = await client.query(createStockQuery, [item_id, quantity]);
      stockResult.rows = createResult.rows;
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      movement: moveResult.rows[0],
      stock: stockResult.rows[0],
      message: 'Stock entry recorded successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording stock entry:', error);
    res.status(500).json({ error: 'Failed to record stock entry' });
  } finally {
    client.release();
  }
});

// Get categories
app.get('/api/inventory/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category FROM inventory.items 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ==================== STAFF MANAGEMENT ====================

// Get all staff
app.get('/api/staff/all', async (req, res) => {
  try {
    const query = `
      SELECT * FROM staff.employees 
      WHERE status = 'Active' 
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff roster
app.get('/api/staff/roster', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0], department } = req.query;
    
    let query = `
      SELECT 
        s.schedule_id,
        s.staff_id,
        e.name as staff_name,
        e.position,
        e.department,
        s.shift_date,
        s.shift_type,
        s.start_time,
        s.end_time,
        s.status
      FROM staff.schedules s
      JOIN staff.employees e ON s.staff_id = e.staff_id
      WHERE s.shift_date = $1
    `;
    
    const params = [date];
    if (department) {
      query += ` AND e.department = $2`;
      params.push(department);
    }
    
    query += ` ORDER BY s.start_time, e.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Add schedule
app.post('/api/staff/schedule', async (req, res) => {
  try {
    const { staff_id, shift_date, shift_type, start_time, end_time } = req.body;
    
    const query = `
      INSERT INTO staff.schedules (
        staff_id, shift_date, shift_type, start_time, end_time, status
      ) VALUES ($1, $2, $3, $4, $5, 'Scheduled')
      RETURNING *
    `;
    const result = await pool.query(query, [
      staff_id, shift_date, shift_type, start_time, end_time
    ]);
    
    res.json({
      success: true,
      schedule: result.rows[0],
      message: 'Schedule added successfully'
    });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// Record attendance
app.post('/api/staff/attendance', async (req, res) => {
  try {
    const { staff_id, action } = req.body;
    const timestamp = new Date().toISOString();
    
    const query = `
      INSERT INTO staff.attendance (
        staff_id, check_${action.toLowerCase()}, date
      ) VALUES ($1, $2, $3)
      ON CONFLICT (staff_id, date) 
      DO UPDATE SET check_${action.toLowerCase()} = $2
      RETURNING *
    `;
    const result = await pool.query(query, [
      staff_id, timestamp, timestamp.split('T')[0]
    ]);
    
    res.json({
      success: true,
      attendance: result.rows[0],
      message: `${action} recorded successfully`
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Get staff on duty
app.get('/api/staff/on-duty', async (req, res) => {
  try {
    const currentTime = new Date().toTimeString().split(' ')[0];
    const currentDate = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        e.staff_id,
        e.name,
        e.position,
        e.department,
        e.contact_phone,
        s.shift_type,
        s.start_time,
        s.end_time,
        a.check_in,
        a.check_out
      FROM staff.employees e
      JOIN staff.schedules s ON e.staff_id = s.staff_id
      LEFT JOIN staff.attendance a ON e.staff_id = a.staff_id AND a.date = $1
      WHERE s.shift_date = $1
        AND s.start_time <= $2
        AND s.end_time >= $2
        AND e.status = 'Active'
      ORDER BY e.department, e.name
    `;
    const result = await pool.query(query, [currentDate, currentTime]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff on duty:', error);
    res.status(500).json({ error: 'Failed to fetch staff on duty' });
  }
});

// ==================== BED MANAGEMENT ====================

// Get available beds
app.get('/api/beds/available', async (req, res) => {
  try {
    const { ward_id } = req.query;
    
    let query = `
      SELECT 
        b.bed_id,
        b.bed_number,
        b.ward_id,
        w.ward_name,
        b.bed_type,
        b.status
      FROM hospital.beds b
      JOIN hospital.wards w ON b.ward_id = w.ward_id
      WHERE b.status = 'Available'
    `;
    
    if (ward_id) {
      query += ` AND b.ward_id = $1`;
    }
    
    query += ` ORDER BY w.ward_name, b.bed_number`;
    
    const result = await pool.query(query, ward_id ? [ward_id] : []);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({ error: 'Failed to fetch available beds' });
  }
});

// Get bed occupancy statistics
app.get('/api/beds/occupancy', async (req, res) => {
  try {
    const query = `
      SELECT 
        w.ward_id,
        w.ward_name,
        COUNT(b.bed_id) as total_beds,
        COUNT(CASE WHEN b.status = 'Available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.status = 'Occupied' THEN 1 END) as occupied_beds,
        ROUND((COUNT(CASE WHEN b.status = 'Occupied' THEN 1 END)::numeric / 
               NULLIF(COUNT(b.bed_id), 0) * 100), 2) as occupancy_rate
      FROM hospital.wards w
      LEFT JOIN hospital.beds b ON w.ward_id = b.ward_id
      GROUP BY w.ward_id, w.ward_name
      ORDER BY w.ward_name
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching occupancy stats:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy statistics' });
  }
});

// Process admission
app.post('/api/beds/admission', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      patient_id, patient_name, ward_id, bed_id, 
      admission_reason, doctor_id 
    } = req.body;
    
    // Create admission record
    const admissionQuery = `
      INSERT INTO hospital.admissions (
        patient_id, patient_name, ward_id, bed_id,
        admission_date, admission_reason, doctor_id, status
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, 'Active')
      RETURNING *
    `;
    const admissionResult = await client.query(admissionQuery, [
      patient_id, patient_name, ward_id, bed_id, admission_reason, doctor_id
    ]);
    
    // Update bed status
    await client.query(
      `UPDATE hospital.beds SET status = 'Occupied' WHERE bed_id = $1`,
      [bed_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      admission: admissionResult.rows[0],
      message: 'Patient admitted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing admission:', error);
    res.status(500).json({ error: 'Failed to process admission' });
  } finally {
    client.release();
  }
});

// Process discharge
app.post('/api/beds/discharge', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { admission_id, discharge_notes } = req.body;
    
    // Get admission details
    const admissionQuery = `
      SELECT bed_id FROM hospital.admissions 
      WHERE admission_id = $1 AND status = 'Active'
    `;
    const admissionResult = await client.query(admissionQuery, [admission_id]);
    
    if (admissionResult.rows.length === 0) {
      throw new Error('Active admission not found');
    }
    
    // Update admission record
    const dischargeQuery = `
      UPDATE hospital.admissions 
      SET status = 'Discharged',
          discharge_date = CURRENT_TIMESTAMP,
          discharge_notes = $2
      WHERE admission_id = $1
      RETURNING *
    `;
    const dischargeResult = await client.query(dischargeQuery, [
      admission_id, discharge_notes
    ]);
    
    // Update bed status
    await client.query(
      `UPDATE hospital.beds SET status = 'Available' WHERE bed_id = $1`,
      [admissionResult.rows[0].bed_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      discharge: dischargeResult.rows[0],
      message: 'Patient discharged successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing discharge:', error);
    res.status(500).json({ error: error.message || 'Failed to process discharge' });
  } finally {
    client.release();
  }
});

// ==================== ANALYTICS ====================

// Get dashboard metrics
app.get('/api/analytics/metrics', async (req, res) => {
  try {
    const metrics = {};
    
    // Total patients
    const patientsQuery = `SELECT COUNT(DISTINCT patient_id) as count FROM emr.encounters`;
    const patientsResult = await pool.query(patientsQuery);
    metrics.totalPatients = patientsResult.rows[0].count;
    
    // Today's appointments
    const appointmentsQuery = `
      SELECT COUNT(*) as count FROM emr.encounters 
      WHERE DATE(encounter_date) = CURRENT_DATE
    `;
    const appointmentsResult = await pool.query(appointmentsQuery);
    metrics.todayAppointments = appointmentsResult.rows[0].count;
    
    // Available beds
    const bedsQuery = `
      SELECT COUNT(*) as count FROM hospital.beds 
      WHERE status = 'Available'
    `;
    const bedsResult = await pool.query(bedsQuery);
    metrics.availableBeds = bedsResult.rows[0].count;
    
    // Staff on duty
    const staffQuery = `
      SELECT COUNT(DISTINCT staff_id) as count FROM staff.schedules 
      WHERE shift_date = CURRENT_DATE
    `;
    const staffResult = await pool.query(staffQuery);
    metrics.staffOnDuty = staffResult.rows[0].count;
    
    // Pending invoices
    const invoicesQuery = `
      SELECT COUNT(*) as count FROM billing.invoices 
      WHERE payment_status = 'Pending'
    `;
    const invoicesResult = await pool.query(invoicesQuery);
    metrics.pendingInvoices = invoicesResult.rows[0].count;
    
    // Low stock items
    const stockQuery = `
      SELECT COUNT(*) as count FROM inventory.items 
      WHERE current_quantity <= reorder_level
    `;
    const stockResult = await pool.query(stockQuery);
    metrics.lowStockItems = stockResult.rows[0].count;
    
    // Today's revenue
    const revenueQuery = `
      SELECT COALESCE(SUM(amount), 0) as total FROM billing.payments 
      WHERE DATE(payment_date) = CURRENT_DATE
    `;
    const revenueResult = await pool.query(revenueQuery);
    metrics.todayRevenue = parseFloat(revenueResult.rows[0].total);
    
    // Occupancy rate
    const occupancyQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'Occupied' THEN 1 END)::float / 
        NULLIF(COUNT(*), 0) * 100 as rate
      FROM hospital.beds
    `;
    const occupancyResult = await pool.query(occupancyQuery);
    metrics.occupancyRate = Math.round(occupancyResult.rows[0].rate || 0);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get trend data
app.get('/api/analytics/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    let dateFilter = '';
    switch(period) {
      case '7d':
        dateFilter = "WHERE date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "WHERE date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "WHERE date >= CURRENT_DATE - INTERVAL '90 days'";
        break;
    }
    
    // Patient visits trend
    const visitsQuery = `
      SELECT 
        DATE(encounter_date) as date,
        COUNT(*) as visits
      FROM emr.encounters
      ${dateFilter.replace('date', 'DATE(encounter_date)')}
      GROUP BY DATE(encounter_date)
      ORDER BY date
    `;
    const visitsResult = await pool.query(visitsQuery);
    
    // Revenue trend
    const revenueQuery = `
      SELECT 
        DATE(payment_date) as date,
        SUM(amount) as revenue
      FROM billing.payments
      ${dateFilter.replace('date', 'DATE(payment_date)')}
      GROUP BY DATE(payment_date)
      ORDER BY date
    `;
    const revenueResult = await pool.query(revenueQuery);
    
    // Occupancy trend
    const occupancyQuery = `
      SELECT 
        DATE(admission_date) as date,
        COUNT(*) as admissions
      FROM hospital.admissions
      ${dateFilter.replace('date', 'DATE(admission_date)')}
      GROUP BY DATE(admission_date)
      ORDER BY date
    `;
    const occupancyResult = await pool.query(occupancyQuery);
    
    res.json({
      visits: visitsResult.rows,
      revenue: revenueResult.rows,
      occupancy: occupancyResult.rows
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// Generate report
app.get('/api/reports/generate', async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;
    
    let data = {};
    
    switch(type) {
      case 'patient-summary':
        const patientsQuery = `
          SELECT 
            COUNT(DISTINCT patient_id) as total_patients,
            COUNT(*) as total_visits,
            AVG(patient_age) as avg_age
          FROM emr.encounters
          WHERE encounter_date BETWEEN $1 AND $2
        `;
        const patientsResult = await pool.query(patientsQuery, [startDate, endDate]);
        data = patientsResult.rows[0];
        break;
        
      case 'revenue-summary':
        const revenueQuery = `
          SELECT 
            COUNT(*) as total_invoices,
            SUM(total_amount) as total_billed,
            SUM(CASE WHEN payment_status = 'Paid' THEN total_amount END) as total_collected,
            SUM(CASE WHEN payment_status = 'Pending' THEN total_amount END) as total_pending
          FROM billing.invoices
          WHERE invoice_date BETWEEN $1 AND $2
        `;
        const revenueResult = await pool.query(revenueQuery, [startDate, endDate]);
        data = revenueResult.rows[0];
        break;
        
      case 'staff-performance':
        const staffQuery = `
          SELECT 
            e.name,
            e.department,
            COUNT(s.schedule_id) as shifts_scheduled,
            COUNT(a.check_in) as shifts_attended,
            ROUND(COUNT(a.check_in)::numeric / NULLIF(COUNT(s.schedule_id), 0) * 100, 2) as attendance_rate
          FROM staff.employees e
          LEFT JOIN staff.schedules s ON e.staff_id = s.staff_id
            AND s.shift_date BETWEEN $1 AND $2
          LEFT JOIN staff.attendance a ON e.staff_id = a.staff_id
            AND a.date BETWEEN $1 AND $2
          GROUP BY e.staff_id, e.name, e.department
          ORDER BY attendance_rate DESC
        `;
        const staffResult = await pool.query(staffQuery, [startDate, endDate]);
        data = staffResult.rows;
        break;
    }
    
    if (format === 'pdf') {
      // Generate PDF report (simplified for now)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.pdf`);
      res.send('PDF generation would be implemented here');
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HMS Backend Complete running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = app;
