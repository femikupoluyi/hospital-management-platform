const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'hms-secret-key-2024';

// Initialize database
async function initDatabase() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Create schema
    await client.query('CREATE SCHEMA IF NOT EXISTS hms');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        blood_group VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES hms.patients(id),
        diagnosis TEXT,
        prescription TEXT,
        lab_results TEXT,
        notes TEXT,
        doctor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.invoices (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES hms.patients(id),
        invoice_number VARCHAR(50) UNIQUE,
        services JSONB,
        total_amount DECIMAL(10,2),
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        insurance_provider VARCHAR(100),
        insurance_claim_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.inventory (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INT DEFAULT 0,
        unit VARCHAR(50),
        reorder_level INT DEFAULT 10,
        expiry_date DATE,
        supplier VARCHAR(255),
        unit_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(50) UNIQUE,
        designation VARCHAR(100),
        department VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        shift VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.schedules (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES hms.staff(id),
        date DATE,
        start_time TIME,
        end_time TIME,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.beds (
        id SERIAL PRIMARY KEY,
        bed_number VARCHAR(50) UNIQUE NOT NULL,
        ward VARCHAR(100),
        floor INT,
        status VARCHAR(50) DEFAULT 'available',
        patient_id INT REFERENCES hms.patients(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS hms.admissions (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES hms.patients(id),
        bed_id INT REFERENCES hms.beds(id),
        admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discharge_date TIMESTAMP,
        doctor_name VARCHAR(255),
        diagnosis TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data
    await client.query(`
      INSERT INTO hms.patients (name, date_of_birth, gender, phone, email, blood_group)
      VALUES 
        ('John Doe', '1985-05-15', 'Male', '234-801-2345', 'john@example.com', 'O+'),
        ('Jane Smith', '1990-08-20', 'Female', '234-802-3456', 'jane@example.com', 'A+'),
        ('Michael Brown', '1978-12-10', 'Male', '234-803-4567', 'michael@example.com', 'B+')
      ON CONFLICT DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO hms.inventory (item_name, category, quantity, unit, reorder_level)
      VALUES
        ('Paracetamol 500mg', 'Medicine', 1000, 'tablets', 100),
        ('Surgical Gloves', 'Consumables', 500, 'pairs', 50),
        ('Insulin', 'Medicine', 200, 'vials', 20),
        ('Bandages', 'Consumables', 300, 'rolls', 30),
        ('Syringes', 'Equipment', 1000, 'pieces', 100)
      ON CONFLICT DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO hms.staff (name, employee_id, designation, department)
      VALUES
        ('Dr. Sarah Johnson', 'EMP001', 'Senior Doctor', 'Cardiology'),
        ('Dr. James Wilson', 'EMP002', 'Doctor', 'Emergency'),
        ('Nurse Mary Brown', 'EMP003', 'Head Nurse', 'ICU'),
        ('Nurse John Davis', 'EMP004', 'Nurse', 'General Ward')
      ON CONFLICT DO NOTHING
    `);
    
    await client.query(`
      INSERT INTO hms.beds (bed_number, ward, floor, status)
      VALUES
        ('ICU-001', 'ICU', 3, 'available'),
        ('ICU-002', 'ICU', 3, 'available'),
        ('GEN-101', 'General Ward', 1, 'available'),
        ('GEN-102', 'General Ward', 1, 'available'),
        ('MAT-201', 'Maternity', 2, 'available')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    await client.end();
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'Hospital Management System',
    status: 'operational',
    version: '2.0.0',
    endpoints: {
      emr: '/api/emr',
      billing: '/api/billing',
      inventory: '/api/inventory',
      staff: '/api/staff',
      beds: '/api/bed-management',
      analytics: '/api/analytics'
    }
  });
});

// Electronic Medical Records
app.get('/api/emr', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT mr.*, p.name as patient_name
      FROM hms.medical_records mr
      JOIN hms.patients p ON mr.patient_id = p.id
      ORDER BY mr.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/emr', async (req, res) => {
  const { patient_id, diagnosis, prescription, lab_results, notes, doctor_name } = req.body;
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO hms.medical_records (patient_id, diagnosis, prescription, lab_results, notes, doctor_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, diagnosis, prescription, lab_results, notes, doctor_name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Patients management
app.get('/api/patients', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM hms.patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/patients', async (req, res) => {
  const { name, date_of_birth, gender, phone, email, address, blood_group } = req.body;
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO hms.patients (name, date_of_birth, gender, phone, email, address, blood_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, date_of_birth, gender, phone, email, address, blood_group]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Billing and Invoices
app.get('/api/billing/invoices', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT i.*, p.name as patient_name
      FROM hms.invoices i
      JOIN hms.patients p ON i.patient_id = p.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/billing/invoices', async (req, res) => {
  const { patient_id, services, total_amount, payment_method, insurance_provider } = req.body;
  const invoice_number = 'INV-' + Date.now();
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO hms.invoices (patient_id, invoice_number, services, total_amount, payment_method, insurance_provider)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, invoice_number, JSON.stringify(services), total_amount, payment_method, insurance_provider]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.put('/api/billing/invoices/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { paid_amount, payment_status } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE hms.invoices SET paid_amount = $1, payment_status = $2 WHERE id = $3 RETURNING *`,
      [paid_amount, payment_status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Inventory Management
app.get('/api/inventory', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM hms.inventory ORDER BY item_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.get('/api/inventory/low-stock', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM hms.inventory WHERE quantity <= reorder_level ORDER BY quantity ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/inventory/stock', async (req, res) => {
  const { item_name, category, quantity, unit, reorder_level, expiry_date, supplier, unit_price } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO hms.inventory (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [item_name, category, quantity, unit, reorder_level, expiry_date, supplier, unit_price]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.put('/api/inventory/:id/update-stock', async (req, res) => {
  const { id } = req.params;
  const { quantity_change } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE hms.inventory 
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [quantity_change, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Staff Management
app.get('/api/staff', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM hms.staff ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.get('/api/staff/schedules', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT s.*, st.name as staff_name, st.designation
      FROM hms.schedules s
      JOIN hms.staff st ON s.staff_id = st.id
      WHERE s.date >= CURRENT_DATE
      ORDER BY s.date, s.start_time
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/staff/schedules', async (req, res) => {
  const { staff_id, date, start_time, end_time, department } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO hms.schedules (staff_id, date, start_time, end_time, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [staff_id, date, start_time, end_time, department]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Bed Management
app.get('/api/bed-management/status', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT b.*, p.name as patient_name
      FROM hms.beds b
      LEFT JOIN hms.patients p ON b.patient_id = p.id
      ORDER BY b.ward, b.bed_number
    `);
    
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM hms.beds
    `);
    
    res.json({
      beds: result.rows,
      summary: summary.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/bed-management/admission', async (req, res) => {
  const { patient_id, bed_id, doctor_name, diagnosis } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create admission
    const admission = await client.query(
      `INSERT INTO hms.admissions (patient_id, bed_id, doctor_name, diagnosis)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, bed_id, doctor_name, diagnosis]
    );
    
    // Update bed status
    await client.query(
      `UPDATE hms.beds SET status = 'occupied', patient_id = $1 WHERE id = $2`,
      [patient_id, bed_id]
    );
    
    await client.query('COMMIT');
    
    res.json(admission.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/bed-management/discharge', async (req, res) => {
  const { admission_id, bed_id } = req.body;
  
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    await client.query('BEGIN');
    
    // Update admission
    await client.query(
      `UPDATE hms.admissions SET discharge_date = CURRENT_TIMESTAMP, status = 'discharged' WHERE id = $1`,
      [admission_id]
    );
    
    // Free the bed
    await client.query(
      `UPDATE hms.beds SET status = 'available', patient_id = NULL WHERE id = $1`,
      [bed_id]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Patient discharged successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Analytics Dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Get various metrics
    const patients = await client.query('SELECT COUNT(*) as total FROM hms.patients');
    const admissions = await client.query("SELECT COUNT(*) as active FROM hms.admissions WHERE status = 'active'");
    const revenue = await client.query('SELECT SUM(total_amount) as total, SUM(paid_amount) as collected FROM hms.invoices');
    const inventory = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN quantity <= reorder_level THEN 1 END) as low_stock FROM hms.inventory');
    const beds = await client.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied FROM hms.beds");
    
    res.json({
      patients: patients.rows[0].total,
      active_admissions: admissions.rows[0].active,
      revenue: {
        total: revenue.rows[0].total || 0,
        collected: revenue.rows[0].collected || 0
      },
      inventory: {
        total_items: inventory.rows[0].total,
        low_stock_items: inventory.rows[0].low_stock
      },
      bed_occupancy: {
        total: beds.rows[0].total,
        occupied: beds.rows[0].occupied,
        rate: beds.rows[0].total > 0 ? ((beds.rows[0].occupied / beds.rows[0].total) * 100).toFixed(1) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ HMS Backend running on port ${PORT}`);
    console.log(`  Available endpoints:`);
    console.log(`  - GET  /api/emr`);
    console.log(`  - POST /api/emr`);
    console.log(`  - GET  /api/patients`);
    console.log(`  - POST /api/patients`);
    console.log(`  - GET  /api/billing/invoices`);
    console.log(`  - POST /api/billing/invoices`);
    console.log(`  - GET  /api/inventory`);
    console.log(`  - POST /api/inventory/stock`);
    console.log(`  - GET  /api/staff/schedules`);
    console.log(`  - POST /api/staff/schedules`);
    console.log(`  - GET  /api/bed-management/status`);
    console.log(`  - POST /api/bed-management/admission`);
    console.log(`  - GET  /api/analytics/dashboard`);
  });
});
