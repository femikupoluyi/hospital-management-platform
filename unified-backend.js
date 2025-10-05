const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'hms-secret-key-2024';

// Helper function to execute queries
async function executeQuery(query, params = []) {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

// Initialize database tables
async function initializeDatabase() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS hospitals (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            owner_name VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            license_number VARCHAR(100),
            status VARCHAR(50) DEFAULT 'pending',
            score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS patients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            age INTEGER,
            gender VARCHAR(20),
            phone VARCHAR(50),
            email VARCHAR(255),
            address TEXT,
            blood_group VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS appointments (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES patients(id),
            doctor_id INTEGER,
            appointment_date DATE,
            appointment_time TIME,
            reason TEXT,
            status VARCHAR(50) DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY,
            item_name VARCHAR(255) NOT NULL,
            category VARCHAR(100),
            quantity INTEGER DEFAULT 0,
            unit_price DECIMAL(10,2),
            reorder_level INTEGER DEFAULT 10,
            expiry_date DATE,
            supplier VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES patients(id),
            amount DECIMAL(10,2),
            services TEXT[],
            payment_method VARCHAR(50),
            payment_status VARCHAR(50) DEFAULT 'pending',
            insurance_provider VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS staff (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(100),
            department VARCHAR(100),
            phone VARCHAR(50),
            email VARCHAR(255),
            salary DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS beds (
            id SERIAL PRIMARY KEY,
            ward VARCHAR(100),
            bed_number VARCHAR(50),
            status VARCHAR(50) DEFAULT 'available',
            patient_id INTEGER REFERENCES patients(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS medical_records (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES patients(id),
            diagnosis TEXT,
            treatment TEXT,
            prescriptions TEXT,
            lab_results TEXT,
            doctor_notes TEXT,
            visit_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS contracts (
            id SERIAL PRIMARY KEY,
            hospital_id INTEGER REFERENCES hospitals(id),
            contract_number VARCHAR(100) UNIQUE,
            start_date DATE,
            end_date DATE,
            terms TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS insurance_claims (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES patients(id),
            provider VARCHAR(255),
            claim_number VARCHAR(100),
            amount DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'submitted',
            service_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const table of tables) {
        try {
            await executeQuery(table);
        } catch (error) {
            console.error('Error creating table:', error.message);
        }
    }
    console.log('Database tables initialized');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'unified-backend' });
});

// ============= DIGITAL SOURCING MODULE =============
app.post('/api/onboarding/apply', async (req, res) => {
    try {
        const { hospitalName, ownerName, email, phone, address, city, licenseNumber } = req.body;
        const result = await executeQuery(
            'INSERT INTO hospitals (name, owner_name, email, phone, address, city, license_number) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [hospitalName, ownerName, email, phone, address, city, licenseNumber]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/onboarding/applications', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM hospitals ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/onboarding/dashboard', async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
            FROM hospitals
        `);
        res.json({ success: true, data: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/onboarding/contracts', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM contracts ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= CRM MODULE =============
app.get('/api/crm/owners', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM hospitals WHERE owner_name IS NOT NULL');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crm/owners', async (req, res) => {
    try {
        const { name, email, phone, hospital, contract_status } = req.body;
        const result = await executeQuery(
            'INSERT INTO hospitals (name, owner_name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [hospital, name, email, phone, contract_status || 'active']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/crm/patients', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM patients ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/crm/appointments', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM appointments ORDER BY appointment_date DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crm/appointments', async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;
        const result = await executeQuery(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id, doctor_id, appointment_date, appointment_time, reason]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/crm/reminders', async (req, res) => {
    try {
        const result = await executeQuery(
            "SELECT * FROM appointments WHERE appointment_date >= CURRENT_DATE AND status = 'scheduled'"
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/crm/campaigns', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'Health Checkup Campaign', type: 'email', status: 'active' },
            { id: 2, name: 'Vaccination Drive', type: 'sms', status: 'scheduled' }
        ]
    });
});

app.get('/api/crm/contracts', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM contracts');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/crm/payouts', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, hospital: 'Test Hospital', amount: 50000, date: '2025-01-01', status: 'paid' }
        ]
    });
});

// ============= HMS CORE MODULE =============
app.get('/api/hms/health', async (req, res) => {
    try {
        await executeQuery('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
    }
});

app.get('/api/hms/patients', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM patients ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/patients', async (req, res) => {
    try {
        const { name, age, gender, phone, email, address, blood_group } = req.body;
        const result = await executeQuery(
            'INSERT INTO patients (name, age, gender, phone, email, address, blood_group) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, age, gender, phone, email, address, blood_group]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/medical-records', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM medical_records ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/billing/invoices', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM invoices ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/billing/create', async (req, res) => {
    try {
        const { patient_id, services, amount, payment_method, insurance_provider } = req.body;
        const result = await executeQuery(
            'INSERT INTO invoices (patient_id, services, amount, payment_method, insurance_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id, services, amount, payment_method, insurance_provider]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/billing/insurance-claims', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM insurance_claims ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/inventory', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM inventory ORDER BY item_name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/inventory/drugs', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM inventory WHERE category = 'Medicine'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/inventory/low-stock', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM inventory WHERE quantity <= reorder_level');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/inventory/add', async (req, res) => {
    try {
        const { item_name, category, quantity, unit_price, reorder_level, expiry_date, supplier } = req.body;
        const result = await executeQuery(
            'INSERT INTO inventory (item_name, category, quantity, unit_price, reorder_level, expiry_date, supplier) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [item_name, category, quantity, unit_price, reorder_level, expiry_date, supplier]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/staff', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM staff ORDER BY name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/staff/schedule', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, staff_id: 1, date: '2025-01-15', shift: 'Morning', department: 'Emergency' }
        ]
    });
});

app.post('/api/hms/staff/roster', async (req, res) => {
    res.json({ success: true, message: 'Roster created successfully' });
});

app.get('/api/hms/beds', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM beds');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/beds/available', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM beds WHERE status = 'available'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/admissions', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM beds WHERE status = 'occupied'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hms/analytics/dashboard', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            totalPatients: 150,
            todayAppointments: 25,
            availableBeds: 45,
            occupancyRate: 85,
            monthlyRevenue: 250000
        }
    });
});

app.get('/api/hms/analytics/occupancy', async (req, res) => {
    res.json({ 
        success: true, 
        data: { rate: 85, trend: 'increasing' }
    });
});

app.get('/api/hms/analytics/revenue', async (req, res) => {
    res.json({ 
        success: true, 
        data: { monthly: 250000, yearly: 3000000 }
    });
});

// ============= OCC MODULE =============
app.get('/api/occ/dashboard', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            totalHospitals: 5,
            activeProjects: 3,
            alerts: 2,
            performance: 92
        }
    });
});

app.get('/api/occ/metrics', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            patientFlow: 150,
            staffEfficiency: 88,
            revenueGrowth: 12
        }
    });
});

app.get('/api/occ/hospitals', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM hospitals WHERE status = 'approved'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/occ/alerts', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, type: 'low_stock', message: 'Low stock alert', severity: 'warning' }
        ]
    });
});

app.post('/api/occ/alerts/create', async (req, res) => {
    res.json({ success: true, message: 'Alert created successfully' });
});

app.get('/api/occ/kpis', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            patientSatisfaction: 4.5,
            bedUtilization: 85,
            averageWaitTime: 30
        }
    });
});

app.get('/api/occ/projects', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'Hospital Expansion', status: 'in_progress', budget: 500000 }
        ]
    });
});

app.post('/api/occ/projects', async (req, res) => {
    res.json({ success: true, message: 'Project created successfully' });
});

// ============= PARTNER INTEGRATION MODULE =============
app.get('/api/partner/insurance/providers', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'National Health Insurance', type: 'NHIS' },
            { id: 2, name: 'Private Insurance Co', type: 'Private' }
        ]
    });
});

app.post('/api/partner/insurance/claim', async (req, res) => {
    try {
        const { patient_id, provider, amount, service_date } = req.body;
        const result = await executeQuery(
            'INSERT INTO insurance_claims (patient_id, provider, amount, service_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [patient_id, provider, amount, service_date]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/partner/pharmacy/orders', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, drug: 'Amoxicillin', quantity: 100, status: 'pending' }
        ]
    });
});

app.get('/api/partner/suppliers', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'Medical Supplies Co', category: 'Equipment' },
            { id: 2, name: 'Pharma Distributors', category: 'Drugs' }
        ]
    });
});

app.get('/api/partner/telemedicine/sessions', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, patient: 'John Doe', doctor: 'Dr. Smith', date: '2025-01-15' }
        ]
    });
});

app.post('/api/partner/telemedicine/schedule', async (req, res) => {
    res.json({ success: true, message: 'Telemedicine session scheduled' });
});

app.get('/api/partner/compliance/reports', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, type: 'Monthly', status: 'submitted', date: '2025-01-01' }
        ]
    });
});

app.get('/api/partner/government/export', async (req, res) => {
    res.json({ 
        success: true, 
        data: { format: 'csv', records: 1000 }
    });
});

// Start server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Unified backend server running on port ${PORT}`);
    });
});
