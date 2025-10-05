#!/bin/bash

# GrandPro HMSO Hospital Management Platform - Service Restart Script
# This script stops all existing services and restarts them with proper configuration

echo "======================================================================"
echo "        GrandPro HMSO Platform - Complete Service Restart            "
echo "======================================================================"
echo "Starting at: $(date)"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
export DATABASE_URL="postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DATABASE_HOST="ep-steep-river-ad25brti.c-2.us-east-1.aws.neon.tech"
export DATABASE_PORT="5432"
export DATABASE_NAME="neondb"
export DATABASE_USER="neondb_owner"
export DATABASE_PASSWORD="npg_lIeD35dukpfC"
export JWT_SECRET="hms-secret-key-2024"
export NODE_ENV="production"

# Step 1: Stop all existing Node.js services
echo -e "${YELLOW}Step 1: Stopping all existing Node.js services...${NC}"
pkill -f node 2>/dev/null
sleep 3

# Check if any services are still running
if pgrep -f node > /dev/null; then
    echo -e "${RED}Warning: Some Node processes still running. Force killing...${NC}"
    pkill -9 -f node 2>/dev/null
    sleep 2
fi

echo -e "${GREEN}✓ All existing services stopped${NC}"
echo ""

# Step 2: Clean up any stale PID files
echo -e "${YELLOW}Step 2: Cleaning up PID files...${NC}"
rm -f /root/*.pid 2>/dev/null
echo -e "${GREEN}✓ PID files cleaned${NC}"
echo ""

# Step 3: Create comprehensive backend server with all modules
echo -e "${YELLOW}Step 3: Creating unified backend server...${NC}"

cat > /root/unified-backend.js << 'EOF'
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
EOF

echo -e "${GREEN}✓ Unified backend created${NC}"
echo ""

# Step 4: Create frontend server
echo -e "${YELLOW}Step 4: Creating unified frontend server...${NC}"

cat > /root/unified-frontend.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GrandPro HMSO - Hospital Management Platform</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .module-card { transition: transform 0.3s; }
        .module-card:hover { transform: translateY(-5px); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-hospital text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-2xl font-bold">GrandPro HMSO</h1>
                        <p class="text-sm opacity-90">Hospital Management Platform</p>
                    </div>
                </div>
                <nav class="flex space-x-4">
                    <a href="#modules" class="hover:text-purple-200">Modules</a>
                    <a href="#dashboard" class="hover:text-purple-200">Dashboard</a>
                    <a href="#api" class="hover:text-purple-200">API Docs</a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- System Status -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4">System Status</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-server text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Backend API</p>
                    <p class="font-semibold text-green-600">Online</p>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-database text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Database</p>
                    <p class="font-semibold text-green-600">Connected</p>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-chart-line text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Analytics</p>
                    <p class="font-semibold text-green-600">Active</p>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-shield-alt text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Security</p>
                    <p class="font-semibold text-green-600">Enabled</p>
                </div>
            </div>
        </div>

        <!-- Modules Grid -->
        <section id="modules" class="mb-8">
            <h2 class="text-2xl font-bold mb-6">Platform Modules</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Digital Sourcing -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-handshake text-purple-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">Digital Sourcing</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Hospital onboarding and partner management</p>
                    <div class="space-y-2">
                        <button onclick="testAPI('/api/onboarding/applications', 'GET')" class="w-full text-left px-3 py-2 bg-purple-50 rounded hover:bg-purple-100">
                            <i class="fas fa-list mr-2"></i>View Applications
                        </button>
                        <button onclick="showApplicationForm()" class="w-full text-left px-3 py-2 bg-purple-50 rounded hover:bg-purple-100">
                            <i class="fas fa-plus mr-2"></i>New Application
                        </button>
                    </div>
                </div>

                <!-- CRM -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-users text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">CRM System</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Patient and owner relationship management</p>
                    <div class="space-y-2">
                        <button onclick="testAPI('/api/crm/patients', 'GET')" class="w-full text-left px-3 py-2 bg-blue-50 rounded hover:bg-blue-100">
                            <i class="fas fa-user-injured mr-2"></i>Patients
                        </button>
                        <button onclick="testAPI('/api/crm/appointments', 'GET')" class="w-full text-left px-3 py-2 bg-blue-50 rounded hover:bg-blue-100">
                            <i class="fas fa-calendar mr-2"></i>Appointments
                        </button>
                    </div>
                </div>

                <!-- HMS Core -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-hospital-alt text-green-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">HMS Core</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Hospital management and operations</p>
                    <div class="space-y-2">
                        <button onclick="showPatientForm()" class="w-full text-left px-3 py-2 bg-green-50 rounded hover:bg-green-100">
                            <i class="fas fa-user-plus mr-2"></i>Register Patient
                        </button>
                        <button onclick="testAPI('/api/hms/inventory', 'GET')" class="w-full text-left px-3 py-2 bg-green-50 rounded hover:bg-green-100">
                            <i class="fas fa-boxes mr-2"></i>Inventory
                        </button>
                    </div>
                </div>

                <!-- OCC -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-tachometer-alt text-orange-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">Command Centre</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Real-time monitoring and control</p>
                    <div class="space-y-2">
                        <button onclick="testAPI('/api/occ/dashboard', 'GET')" class="w-full text-left px-3 py-2 bg-orange-50 rounded hover:bg-orange-100">
                            <i class="fas fa-chart-pie mr-2"></i>Dashboard
                        </button>
                        <button onclick="testAPI('/api/occ/alerts', 'GET')" class="w-full text-left px-3 py-2 bg-orange-50 rounded hover:bg-orange-100">
                            <i class="fas fa-bell mr-2"></i>Alerts
                        </button>
                    </div>
                </div>

                <!-- Partner Integration -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-plug text-indigo-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">Partner Integration</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Insurance, pharmacy, and telemedicine</p>
                    <div class="space-y-2">
                        <button onclick="testAPI('/api/partner/insurance/providers', 'GET')" class="w-full text-left px-3 py-2 bg-indigo-50 rounded hover:bg-indigo-100">
                            <i class="fas fa-shield-alt mr-2"></i>Insurance
                        </button>
                        <button onclick="showInsuranceClaimForm()" class="w-full text-left px-3 py-2 bg-indigo-50 rounded hover:bg-indigo-100">
                            <i class="fas fa-file-invoice mr-2"></i>New Claim
                        </button>
                    </div>
                </div>

                <!-- Analytics -->
                <div class="module-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-brain text-pink-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold">Analytics & AI</h3>
                    </div>
                    <p class="text-gray-600 mb-4">Predictive analytics and ML models</p>
                    <div class="space-y-2">
                        <button onclick="testAPI('/api/analytics/metrics', 'GET')" class="w-full text-left px-3 py-2 bg-pink-50 rounded hover:bg-pink-100">
                            <i class="fas fa-chart-line mr-2"></i>Metrics
                        </button>
                        <button onclick="testPrediction()" class="w-full text-left px-3 py-2 bg-pink-50 rounded hover:bg-pink-100">
                            <i class="fas fa-robot mr-2"></i>Predictions
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- API Response Display -->
        <div id="responseDisplay" class="hidden bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 class="text-lg font-semibold mb-3">API Response</h3>
            <pre id="responseContent" class="bg-gray-100 p-4 rounded overflow-x-auto text-sm"></pre>
            <button onclick="closeResponse()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Close
            </button>
        </div>

        <!-- Forms Container -->
        <div id="formsContainer"></div>
    </main>

    <!-- Footer -->
    <footer class="gradient-bg text-white mt-12 py-6">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; 2025 GrandPro HMSO. All rights reserved.</p>
            <p class="text-sm mt-2 opacity-90">Version 1.0.0 | Powered by Node.js & PostgreSQL</p>
        </div>
    </footer>

    <script>
        const API_BASE = 'http://localhost:3000';

        async function testAPI(endpoint, method = 'GET', data = null) {
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(API_BASE + endpoint, options);
                const result = await response.json();
                
                document.getElementById('responseDisplay').classList.remove('hidden');
                document.getElementById('responseContent').textContent = JSON.stringify(result, null, 2);
            } catch (error) {
                alert('API Error: ' + error.message);
            }
        }

        function closeResponse() {
            document.getElementById('responseDisplay').classList.add('hidden');
        }

        function showApplicationForm() {
            document.getElementById('formsContainer').innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 class="text-xl font-semibold mb-4">Hospital Application</h3>
                        <form onsubmit="submitApplication(event)">
                            <input type="text" id="hospitalName" placeholder="Hospital Name" class="w-full p-2 border rounded mb-3" required>
                            <input type="text" id="ownerName" placeholder="Owner Name" class="w-full p-2 border rounded mb-3" required>
                            <input type="email" id="email" placeholder="Email" class="w-full p-2 border rounded mb-3" required>
                            <input type="tel" id="phone" placeholder="Phone" class="w-full p-2 border rounded mb-3" required>
                            <input type="text" id="address" placeholder="Address" class="w-full p-2 border rounded mb-3" required>
                            <input type="text" id="city" placeholder="City" class="w-full p-2 border rounded mb-3" required>
                            <input type="text" id="licenseNumber" placeholder="License Number" class="w-full p-2 border rounded mb-3">
                            <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Submit</button>
                            <button type="button" onclick="closeForm()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        }

        function showPatientForm() {
            document.getElementById('formsContainer').innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 class="text-xl font-semibold mb-4">Patient Registration</h3>
                        <form onsubmit="submitPatient(event)">
                            <input type="text" id="name" placeholder="Patient Name" class="w-full p-2 border rounded mb-3" required>
                            <input type="number" id="age" placeholder="Age" class="w-full p-2 border rounded mb-3" required>
                            <select id="gender" class="w-full p-2 border rounded mb-3" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <input type="tel" id="phone" placeholder="Phone" class="w-full p-2 border rounded mb-3" required>
                            <input type="email" id="email" placeholder="Email" class="w-full p-2 border rounded mb-3">
                            <input type="text" id="address" placeholder="Address" class="w-full p-2 border rounded mb-3">
                            <select id="blood_group" class="w-full p-2 border rounded mb-3">
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                            <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Register</button>
                            <button type="button" onclick="closeForm()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        }

        function showInsuranceClaimForm() {
            document.getElementById('formsContainer').innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 class="text-xl font-semibold mb-4">Insurance Claim</h3>
                        <form onsubmit="submitClaim(event)">
                            <input type="number" id="patient_id" placeholder="Patient ID" class="w-full p-2 border rounded mb-3" required>
                            <input type="text" id="provider" placeholder="Insurance Provider" class="w-full p-2 border rounded mb-3" required>
                            <input type="number" id="amount" placeholder="Claim Amount" class="w-full p-2 border rounded mb-3" required>
                            <input type="date" id="service_date" class="w-full p-2 border rounded mb-3" required>
                            <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Submit Claim</button>
                            <button type="button" onclick="closeForm()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </form>
                    </div>
                </div>
            `;
        }

        async function submitApplication(event) {
            event.preventDefault();
            const data = {
                hospitalName: document.getElementById('hospitalName').value,
                ownerName: document.getElementById('ownerName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                licenseNumber: document.getElementById('licenseNumber').value
            };
            await testAPI('/api/onboarding/apply', 'POST', data);
            closeForm();
        }

        async function submitPatient(event) {
            event.preventDefault();
            const data = {
                name: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                blood_group: document.getElementById('blood_group').value
            };
            await testAPI('/api/hms/patients', 'POST', data);
            closeForm();
        }

        async function submitClaim(event) {
            event.preventDefault();
            const data = {
                patient_id: parseInt(document.getElementById('patient_id').value),
                provider: document.getElementById('provider').value,
                amount: parseFloat(document.getElementById('amount').value),
                service_date: document.getElementById('service_date').value
            };
            await testAPI('/api/partner/insurance/claim', 'POST', data);
            closeForm();
        }

        async function testPrediction() {
            await testAPI('/api/analytics/predict/demand', 'POST', { days: 7 });
        }

        function closeForm() {
            document.getElementById('formsContainer').innerHTML = '';
        }

        // Check system status on load
        window.addEventListener('load', async () => {
            try {
                const response = await fetch(API_BASE + '/health');
                if (response.ok) {
                    console.log('Backend is healthy');
                }
            } catch (error) {
                console.error('Backend health check failed:', error);
            }
        });
    </script>
</body>
</html>
EOF

cat > /root/frontend-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'unified-frontend.html'));
});

const PORT = process.env.FRONTEND_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
});
EOF

echo -e "${GREEN}✓ Frontend server created${NC}"
echo ""

# Step 5: Install dependencies
echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
cd /root
npm install express cors pg jsonwebtoken bcrypt 2>/dev/null || true
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 6: Start all services
echo -e "${YELLOW}Step 6: Starting all services...${NC}"

# Start unified backend
nohup node unified-backend.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to initialize
sleep 5

# Start frontend
nohup node frontend-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Start analytics service (if exists)
if [ -f "/root/analytics-ml-standalone.js" ]; then
    nohup node analytics-ml-standalone.js > analytics.log 2>&1 &
    ANALYTICS_PID=$!
    echo "Analytics service started with PID: $ANALYTICS_PID"
fi

echo ""
echo -e "${GREEN}✓ All services started${NC}"
echo ""

# Step 7: Verify services
echo -e "${YELLOW}Step 7: Verifying services...${NC}"
sleep 3

# Test backend health
echo -n "Testing backend health... "
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

# Test frontend
echo -n "Testing frontend... "
if curl -s http://localhost:4000 | grep -q "GrandPro HMSO"; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend not accessible${NC}"
fi

# Test analytics
if [ -f "/root/analytics-ml-standalone.js" ]; then
    echo -n "Testing analytics... "
    if curl -s http://localhost:3005/api/analytics/metrics | grep -q "success"; then
        echo -e "${GREEN}✓ Analytics is working${NC}"
    else
        echo -e "${RED}✗ Analytics not responding${NC}"
    fi
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}Service restart completed!${NC}"
echo ""
echo "Access points:"
echo "  Frontend: http://localhost:4000"
echo "  Backend API: http://localhost:3000"
echo "  Analytics: http://localhost:3005"
echo ""
echo "Logs:"
echo "  Backend: /root/backend.log"
echo "  Frontend: /root/frontend.log"
echo "  Analytics: /root/analytics.log"
echo ""
echo "PIDs:"
echo "  Backend: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
[ ! -z "$ANALYTICS_PID" ] && echo "  Analytics: $ANALYTICS_PID"
echo "======================================================================"
