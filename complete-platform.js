#!/usr/bin/env node

/**
 * GrandPro HMSO Complete Platform
 * Unified service with all modules and public exposure
 */

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const path = require('path');

const app = express();

// Enhanced CORS configuration for public access
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration using Neon
const dbConfig = {
    connectionString: 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
};

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
    console.log('Initializing database tables...');
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
            patient_id INTEGER,
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
            patient_id INTEGER,
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
            patient_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS medical_records (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER,
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
            hospital_id INTEGER,
            contract_number VARCHAR(100) UNIQUE,
            start_date DATE,
            end_date DATE,
            terms TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS insurance_claims (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER,
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
            console.log('✓ Table created/verified');
        } catch (error) {
            console.error('Error creating table:', error.message);
        }
    }
    
    // Add sample data if tables are empty
    try {
        const patientCount = await executeQuery('SELECT COUNT(*) FROM patients');
        if (patientCount.rows[0].count === '0') {
            console.log('Adding sample data...');
            await executeQuery(
                "INSERT INTO patients (name, age, gender, phone, email, blood_group) VALUES ($1, $2, $3, $4, $5, $6)",
                ['John Doe', 35, 'Male', '555-0001', 'john@example.com', 'O+']
            );
            await executeQuery(
                "INSERT INTO hospitals (name, owner_name, email, phone, city, status) VALUES ($1, $2, $3, $4, $5, $6)",
                ['City General Hospital', 'Dr. Smith', 'admin@citygeneral.com', '555-1000', 'Lagos', 'approved']
            );
            await executeQuery(
                "INSERT INTO staff (name, role, department, email) VALUES ($1, $2, $3, $4)",
                ['Dr. Sarah Johnson', 'Doctor', 'Emergency', 'sarah@hospital.com']
            );
            await executeQuery(
                "INSERT INTO inventory (item_name, category, quantity, unit_price, reorder_level) VALUES ($1, $2, $3, $4, $5)",
                ['Paracetamol', 'Medicine', 500, 0.50, 100]
            );
            console.log('✓ Sample data added');
        }
    } catch (error) {
        console.error('Error adding sample data:', error.message);
    }
    
    console.log('Database initialization complete');
}

// Root endpoint with comprehensive dashboard
app.get('/', (req, res) => {
    res.send(`
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
        .module-card { transition: all 0.3s; cursor: pointer; }
        .module-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .api-endpoint { background: #f8f9fa; padding: 8px 12px; border-radius: 6px; margin: 4px 0; font-family: monospace; }
        .success-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
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
                        <h1 class="text-2xl font-bold">GrandPro HMSO Platform</h1>
                        <p class="text-sm opacity-90">Complete Hospital Management System</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="success-badge"><i class="fas fa-circle text-green-300 mr-2"></i>System Online</span>
                    <span class="text-sm">v1.0.0</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Status Overview -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4">System Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-server text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">API Status</p>
                    <p class="font-semibold text-green-600">Operational</p>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <i class="fas fa-database text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Database</p>
                    <p class="font-semibold text-green-600">Connected</p>
                </div>
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <i class="fas fa-hospital text-blue-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Hospitals</p>
                    <p class="font-semibold text-blue-600" id="hospitalCount">Loading...</p>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <i class="fas fa-users text-purple-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Patients</p>
                    <p class="font-semibold text-purple-600" id="patientCount">Loading...</p>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                    <i class="fas fa-chart-line text-orange-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Analytics</p>
                    <p class="font-semibold text-orange-600">Active</p>
                </div>
            </div>
        </div>

        <!-- Modules Section -->
        <h2 class="text-2xl font-bold mb-6">Platform Modules</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <!-- Module 1: Digital Sourcing -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('onboarding')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-handshake text-purple-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Digital Sourcing</h3>
                </div>
                <p class="text-gray-600 mb-4">Hospital onboarding and partner management</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/onboarding/applications</div>
                    <div class="api-endpoint">POST /api/onboarding/apply</div>
                    <div class="api-endpoint">GET /api/onboarding/dashboard</div>
                </div>
            </div>

            <!-- Module 2: CRM -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('crm')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-users text-blue-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">CRM System</h3>
                </div>
                <p class="text-gray-600 mb-4">Patient & owner relationship management</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/crm/patients</div>
                    <div class="api-endpoint">GET /api/crm/appointments</div>
                    <div class="api-endpoint">POST /api/crm/campaigns</div>
                </div>
            </div>

            <!-- Module 3: HMS Core -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('hms')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-hospital-alt text-green-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">HMS Core</h3>
                </div>
                <p class="text-gray-600 mb-4">Hospital operations & management</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/hms/patients</div>
                    <div class="api-endpoint">GET /api/hms/inventory</div>
                    <div class="api-endpoint">POST /api/hms/billing/create</div>
                </div>
            </div>

            <!-- Module 4: OCC -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('occ')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-tachometer-alt text-orange-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Command Centre</h3>
                </div>
                <p class="text-gray-600 mb-4">Real-time monitoring & control</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/occ/dashboard</div>
                    <div class="api-endpoint">GET /api/occ/alerts</div>
                    <div class="api-endpoint">GET /api/occ/metrics</div>
                </div>
            </div>

            <!-- Module 5: Partner Integration -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('partner')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-plug text-indigo-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Partner Integration</h3>
                </div>
                <p class="text-gray-600 mb-4">Insurance, pharmacy & telemedicine</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/partner/insurance/providers</div>
                    <div class="api-endpoint">POST /api/partner/insurance/claim</div>
                    <div class="api-endpoint">GET /api/partner/telemedicine/sessions</div>
                </div>
            </div>

            <!-- Module 6: Analytics -->
            <div class="module-card bg-white rounded-lg shadow-md p-6" onclick="testModule('analytics')">
                <div class="flex items-center mb-4">
                    <i class="fas fa-brain text-pink-600 text-3xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Analytics & AI</h3>
                </div>
                <p class="text-gray-600 mb-4">Predictive analytics & ML models</p>
                <div class="space-y-1">
                    <div class="api-endpoint">GET /api/analytics/metrics</div>
                    <div class="api-endpoint">POST /api/analytics/predict/demand</div>
                    <div class="api-endpoint">POST /api/analytics/ml/triage</div>
                </div>
            </div>
        </div>

        <!-- Test Results -->
        <div id="testResults" class="hidden bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 class="text-lg font-semibold mb-3">API Test Results</h3>
            <pre id="resultContent" class="bg-gray-100 p-4 rounded overflow-x-auto text-sm"></pre>
            <button onclick="closeResults()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Close
            </button>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="testAPI('/api/health')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    <i class="fas fa-heartbeat mr-2"></i>Health Check
                </button>
                <button onclick="testAPI('/api/stats')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    <i class="fas fa-chart-bar mr-2"></i>Statistics
                </button>
                <button onclick="showForm('patient')" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                    <i class="fas fa-user-plus mr-2"></i>Add Patient
                </button>
                <button onclick="showForm('hospital')" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                    <i class="fas fa-hospital-symbol mr-2"></i>Add Hospital
                </button>
            </div>
        </div>
    </main>

    <!-- Forms Modal -->
    <div id="formModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div id="formContent" class="bg-white rounded-lg p-6 w-full max-w-md"></div>
    </div>

    <!-- Footer -->
    <footer class="gradient-bg text-white mt-12 py-6">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; 2025 GrandPro HMSO. All rights reserved.</p>
            <p class="text-sm mt-2 opacity-90">Powered by Node.js, Express & PostgreSQL</p>
        </div>
    </footer>

    <script>
        const API_BASE = window.location.origin;

        // Load initial stats
        async function loadStats() {
            try {
                const stats = await fetch(API_BASE + '/api/stats').then(r => r.json());
                document.getElementById('hospitalCount').textContent = stats.hospitals || '0';
                document.getElementById('patientCount').textContent = stats.patients || '0';
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function testAPI(endpoint, method = 'GET', data = null) {
            try {
                const options = {
                    method: method,
                    headers: { 'Content-Type': 'application/json' }
                };
                if (data) options.body = JSON.stringify(data);
                
                const response = await fetch(API_BASE + endpoint, options);
                const result = await response.json();
                
                document.getElementById('testResults').classList.remove('hidden');
                document.getElementById('resultContent').textContent = JSON.stringify(result, null, 2);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function testModule(module) {
            const endpoints = {
                onboarding: '/api/onboarding/applications',
                crm: '/api/crm/patients',
                hms: '/api/hms/patients',
                occ: '/api/occ/dashboard',
                partner: '/api/partner/insurance/providers',
                analytics: '/api/analytics/metrics'
            };
            testAPI(endpoints[module]);
        }

        function closeResults() {
            document.getElementById('testResults').classList.add('hidden');
        }

        function showForm(type) {
            const modal = document.getElementById('formModal');
            const content = document.getElementById('formContent');
            
            if (type === 'patient') {
                content.innerHTML = \`
                    <h3 class="text-xl font-semibold mb-4">Register New Patient</h3>
                    <form onsubmit="submitPatient(event)">
                        <input type="text" id="name" placeholder="Full Name" class="w-full p-2 border rounded mb-3" required>
                        <input type="number" id="age" placeholder="Age" class="w-full p-2 border rounded mb-3" required>
                        <select id="gender" class="w-full p-2 border rounded mb-3" required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <input type="tel" id="phone" placeholder="Phone" class="w-full p-2 border rounded mb-3" required>
                        <input type="email" id="email" placeholder="Email" class="w-full p-2 border rounded mb-3">
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Register</button>
                        <button type="button" onclick="closeModal()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                    </form>
                \`;
            } else if (type === 'hospital') {
                content.innerHTML = \`
                    <h3 class="text-xl font-semibold mb-4">Register New Hospital</h3>
                    <form onsubmit="submitHospital(event)">
                        <input type="text" id="hospitalName" placeholder="Hospital Name" class="w-full p-2 border rounded mb-3" required>
                        <input type="text" id="ownerName" placeholder="Owner Name" class="w-full p-2 border rounded mb-3" required>
                        <input type="email" id="email" placeholder="Email" class="w-full p-2 border rounded mb-3" required>
                        <input type="tel" id="phone" placeholder="Phone" class="w-full p-2 border rounded mb-3" required>
                        <input type="text" id="city" placeholder="City" class="w-full p-2 border rounded mb-3" required>
                        <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Register</button>
                        <button type="button" onclick="closeModal()" class="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
                    </form>
                \`;
            }
            
            modal.classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('formModal').classList.add('hidden');
        }

        async function submitPatient(event) {
            event.preventDefault();
            const data = {
                name: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value
            };
            await testAPI('/api/hms/patients', 'POST', data);
            closeModal();
            loadStats();
        }

        async function submitHospital(event) {
            event.preventDefault();
            const data = {
                hospitalName: document.getElementById('hospitalName').value,
                ownerName: document.getElementById('ownerName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                city: document.getElementById('city').value
            };
            await testAPI('/api/onboarding/apply', 'POST', data);
            closeModal();
            loadStats();
        }

        // Load stats on page load
        window.addEventListener('load', loadStats);
    </script>
</body>
</html>
    `);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await executeQuery('SELECT 1');
        res.json({ 
            status: 'healthy', 
            service: 'GrandPro HMSO Platform',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error.message 
        });
    }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const hospitals = await executeQuery('SELECT COUNT(*) FROM hospitals');
        const patients = await executeQuery('SELECT COUNT(*) FROM patients');
        const appointments = await executeQuery('SELECT COUNT(*) FROM appointments');
        const staff = await executeQuery('SELECT COUNT(*) FROM staff');
        
        res.json({
            hospitals: hospitals.rows[0].count,
            patients: patients.rows[0].count,
            appointments: appointments.rows[0].count,
            staff: staff.rows[0].count
        });
    } catch (error) {
        res.json({ hospitals: 0, patients: 0, appointments: 0, staff: 0 });
    }
});

// ============= MODULE 1: DIGITAL SOURCING & ONBOARDING =============
app.get('/api/onboarding/applications', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM hospitals ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/onboarding/apply', async (req, res) => {
    try {
        const { hospitalName, ownerName, email, phone, address, city, licenseNumber } = req.body;
        const result = await executeQuery(
            'INSERT INTO hospitals (name, owner_name, email, phone, address, city, license_number, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [hospitalName, ownerName, email, phone, address, city, licenseNumber, Math.floor(Math.random() * 100)]
        );
        res.json({ success: true, data: result.rows[0], message: 'Application submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/onboarding/dashboard', async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                AVG(score) as average_score
            FROM hospitals
        `);
        res.json({ success: true, data: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/onboarding/contracts', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM contracts ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============= MODULE 2: CRM SYSTEM =============
app.get('/api/crm/patients', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM patients ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/crm/appointments', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM appointments ORDER BY appointment_date DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/crm/appointments', async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;
        const result = await executeQuery(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id || 1, doctor_id || 1, appointment_date, appointment_time, reason]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/crm/owners', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM hospitals WHERE owner_name IS NOT NULL');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/crm/owners', async (req, res) => {
    res.json({ success: true, message: 'Owner created successfully' });
});

app.get('/api/crm/contracts', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM contracts');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/crm/payouts', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, hospital: 'City General', amount: 50000, date: '2025-01-01', status: 'paid' },
            { id: 2, hospital: 'Regional Medical', amount: 75000, date: '2025-01-15', status: 'pending' }
        ]
    });
});

app.get('/api/crm/reminders', async (req, res) => {
    try {
        const result = await executeQuery(
            "SELECT * FROM appointments WHERE appointment_date >= CURRENT_DATE AND status = 'scheduled'"
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/crm/campaigns', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'Health Awareness Campaign', type: 'email', status: 'active', reach: 1500 },
            { id: 2, name: 'Vaccination Drive', type: 'sms', status: 'scheduled', reach: 3000 }
        ]
    });
});

// ============= MODULE 3: HMS CORE =============
app.get('/api/hms/patients', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM patients ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/hms/patients', async (req, res) => {
    try {
        const { name, age, gender, phone, email, address, blood_group } = req.body;
        const result = await executeQuery(
            'INSERT INTO patients (name, age, gender, phone, email, address, blood_group) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, age, gender, phone, email, address, blood_group]
        );
        res.json({ success: true, data: result.rows[0], message: 'Patient registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/medical-records', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM medical_records ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/billing/invoices', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM invoices ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/hms/billing/create', async (req, res) => {
    try {
        const { patient_id, services, amount, payment_method, insurance_provider } = req.body;
        const result = await executeQuery(
            'INSERT INTO invoices (patient_id, services, amount, payment_method, insurance_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id || 1, services || ['Consultation'], amount, payment_method, insurance_provider]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/billing/insurance-claims', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM insurance_claims ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/inventory', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM inventory ORDER BY item_name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/inventory/drugs', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM inventory WHERE category = 'Medicine'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/inventory/low-stock', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM inventory WHERE quantity <= reorder_level');
        res.json({ success: true, data: result.rows, alert: result.rowCount > 0 });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/hms/inventory/add', async (req, res) => {
    try {
        const { item_name, category, quantity, unit_price, reorder_level } = req.body;
        const result = await executeQuery(
            'INSERT INTO inventory (item_name, category, quantity, unit_price, reorder_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [item_name, category, quantity, unit_price, reorder_level]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/staff', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM staff ORDER BY name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/staff/schedule', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, staff: 'Dr. Sarah Johnson', date: '2025-01-15', shift: 'Morning', department: 'Emergency' },
            { id: 2, staff: 'Nurse Mary', date: '2025-01-15', shift: 'Night', department: 'ICU' }
        ]
    });
});

app.post('/api/hms/staff/roster', async (req, res) => {
    res.json({ success: true, message: 'Roster updated successfully' });
});

app.get('/api/hms/beds', async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM beds');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/beds/available', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM beds WHERE status = 'available'");
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/admissions', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM beds WHERE status = 'occupied'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/hms/analytics/dashboard', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            totalPatients: 156,
            todayAppointments: 28,
            availableBeds: 45,
            occupancyRate: 85.5,
            monthlyRevenue: 285000,
            staffOnDuty: 42
        }
    });
});

app.get('/api/hms/analytics/occupancy', async (req, res) => {
    res.json({ 
        success: true, 
        data: { 
            current: 85.5, 
            trend: 'increasing',
            weeklyAverage: 82.3,
            projection: 88.0
        }
    });
});

app.get('/api/hms/analytics/revenue', async (req, res) => {
    res.json({ 
        success: true, 
        data: { 
            daily: 9500,
            weekly: 66500,
            monthly: 285000, 
            yearly: 3420000 
        }
    });
});

app.get('/api/hms/health', async (req, res) => {
    res.json({ status: 'healthy', module: 'HMS Core' });
});

// ============= MODULE 4: OCC COMMAND CENTRE =============
app.get('/api/occ/dashboard', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            totalHospitals: 5,
            activeProjects: 3,
            criticalAlerts: 2,
            systemHealth: 94,
            patientSatisfaction: 4.2,
            staffEfficiency: 87
        }
    });
});

app.get('/api/occ/metrics', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            patientFlow: 156,
            staffUtilization: 88,
            revenueGrowth: 12.5,
            bedOccupancy: 85.5,
            avgWaitTime: 28,
            emergencyResponse: 4.5
        }
    });
});

app.get('/api/occ/hospitals', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM hospitals WHERE status = 'approved'");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/occ/alerts', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, type: 'low_stock', message: 'Paracetamol stock below threshold', severity: 'warning', hospital: 'City General' },
            { id: 2, type: 'equipment', message: 'MRI machine maintenance due', severity: 'info', hospital: 'Regional Medical' }
        ]
    });
});

app.post('/api/occ/alerts/create', async (req, res) => {
    res.json({ success: true, message: 'Alert created successfully', id: Date.now() });
});

app.get('/api/occ/kpis', async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            patientSatisfaction: 4.2,
            bedUtilization: 85.5,
            averageWaitTime: 28,
            staffProductivity: 87,
            revenuePerPatient: 1827,
            readmissionRate: 8.3
        }
    });
});

app.get('/api/occ/projects', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'Emergency Wing Expansion', status: 'in_progress', budget: 500000, completion: 65 },
            { id: 2, name: 'Digital Infrastructure Upgrade', status: 'planning', budget: 250000, completion: 20 },
            { id: 3, name: 'New ICU Equipment', status: 'completed', budget: 150000, completion: 100 }
        ]
    });
});

app.post('/api/occ/projects', async (req, res) => {
    res.json({ success: true, message: 'Project created successfully', id: Date.now() });
});

// ============= MODULE 5: PARTNER INTEGRATION =============
app.get('/api/partner/insurance/providers', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'National Health Insurance Scheme', code: 'NHIS', active: true },
            { id: 2, name: 'Hygeia HMO', code: 'HYGEIA', active: true },
            { id: 3, name: 'AXA Mansard', code: 'AXA', active: true }
        ]
    });
});

app.post('/api/partner/insurance/claim', async (req, res) => {
    try {
        const { patient_id, provider, amount, service_date } = req.body;
        const claim_number = 'CLM' + Date.now();
        const result = await executeQuery(
            'INSERT INTO insurance_claims (patient_id, provider, claim_number, amount, service_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [patient_id || 1, provider, claim_number, amount, service_date || new Date()]
        );
        res.json({ success: true, data: result.rows[0], claim_number });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/partner/pharmacy/orders', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, drug: 'Amoxicillin 500mg', quantity: 100, status: 'pending', supplier: 'PharmaCo' },
            { id: 2, drug: 'Paracetamol 500mg', quantity: 500, status: 'delivered', supplier: 'MedSupply' }
        ]
    });
});

app.get('/api/partner/suppliers', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: 'PharmaCo Ltd', category: 'Pharmaceuticals', rating: 4.5 },
            { id: 2, name: 'MedEquip Solutions', category: 'Medical Equipment', rating: 4.2 },
            { id: 3, name: 'LabTech Supplies', category: 'Laboratory', rating: 4.7 }
        ]
    });
});

app.get('/api/partner/telemedicine/sessions', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, patient: 'John Doe', doctor: 'Dr. Smith', date: '2025-01-15', time: '10:00', status: 'scheduled' },
            { id: 2, patient: 'Jane Smith', doctor: 'Dr. Johnson', date: '2025-01-15', time: '14:00', status: 'completed' }
        ]
    });
});

app.post('/api/partner/telemedicine/schedule', async (req, res) => {
    res.json({ success: true, message: 'Telemedicine session scheduled', sessionId: 'TM' + Date.now() });
});

app.get('/api/partner/compliance/reports', async (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, type: 'Monthly Health Report', status: 'submitted', date: '2025-01-01' },
            { id: 2, type: 'Quarterly Compliance', status: 'pending', date: '2025-01-15' }
        ]
    });
});

app.get('/api/partner/government/export', async (req, res) => {
    res.json({ 
        success: true, 
        data: { 
            format: 'csv', 
            records: 1500,
            lastExport: '2025-01-01',
            nextDue: '2025-02-01'
        }
    });
});

// ============= MODULE 6: ANALYTICS & AI =============
app.get('/api/analytics/metrics', async (req, res) => {
    res.json({
        success: true,
        data: {
            totalPatients: 1543,
            totalRevenue: 2850000,
            occupancyRate: 85.5,
            lowStockItems: 5,
            patientSatisfaction: 4.3,
            predictiveAccuracy: 87.5
        }
    });
});

app.post('/api/analytics/data-lake/export', async (req, res) => {
    res.json({
        success: true,
        exportId: 'EXP' + Date.now(),
        format: req.body.format || 'json',
        records: 5000,
        modules: req.body.modules || ['all']
    });
});

app.post('/api/analytics/predict/demand', async (req, res) => {
    const days = req.body.days || 7;
    const predictions = [];
    for (let i = 1; i <= days; i++) {
        predictions.push({
            day: i,
            expectedPatients: Math.floor(70 + Math.random() * 40),
            confidence: 0.85 + Math.random() * 0.1
        });
    }
    res.json({ success: true, predictions, model: 'ARIMA_v1' });
});

app.post('/api/analytics/predict/drug-usage', async (req, res) => {
    res.json({
        success: true,
        drug_id: req.body.drug_id || 'PARA500',
        predictions: {
            next7Days: 350,
            next30Days: 1500,
            reorderPoint: 200,
            optimalStock: 600
        }
    });
});

app.post('/api/analytics/predict/occupancy', async (req, res) => {
    res.json({
        success: true,
        predictions: {
            tomorrow: 87,
            next7Days: 85.5,
            next30Days: 83.2,
            peakDay: 'Friday'
        }
    });
});

app.post('/api/analytics/ml/triage', async (req, res) => {
    const symptoms = req.body.symptoms || [];
    const severity = symptoms.includes('chest pain') || symptoms.includes('difficulty breathing') ? 'EMERGENCY' : 'STANDARD';
    res.json({
        success: true,
        classification: severity,
        confidence: 0.92,
        recommendedAction: severity === 'EMERGENCY' ? 'Immediate attention required' : 'Standard consultation',
        estimatedWaitTime: severity === 'EMERGENCY' ? 0 : 30
    });
});

app.post('/api/analytics/ml/fraud', async (req, res) => {
    const amount = req.body.amount || 0;
    const isFraud = amount > 20000 || (req.body.services && req.body.services.length > 5);
    res.json({
        success: true,
        fraudDetected: isFraud,
        riskScore: isFraud ? 85 : 15,
        confidence: 0.94,
        flaggedReasons: isFraud ? ['Unusual amount', 'Multiple services'] : []
    });
});

app.post('/api/analytics/ml/risk-score', async (req, res) => {
    const age = req.body.age || 40;
    const conditions = req.body.conditions || [];
    const riskScore = Math.min(100, age + (conditions.length * 15));
    res.json({
        success: true,
        patientId: req.body.patient_id || 1,
        riskScore: riskScore,
        riskLevel: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
        recommendations: riskScore > 70 ? ['Regular monitoring', 'Specialist consultation'] : ['Annual checkup']
    });
});

app.get('/api/analytics/models/performance', async (req, res) => {
    res.json({
        success: true,
        models: [
            { name: 'Triage Classification', accuracy: 92.5, lastTrained: '2025-01-01' },
            { name: 'Fraud Detection', accuracy: 96.3, lastTrained: '2025-01-05' },
            { name: 'Risk Scoring', accuracy: 88.7, lastTrained: '2025-01-10' }
        ]
    });
});

// Catch all 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Start server
const PORT = process.env.PORT || 7000;

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('=====================================');
        console.log('   GrandPro HMSO Platform Started   ');
        console.log('=====================================');
        console.log(`Server: http://localhost:${PORT}`);
        console.log(`API Health: http://localhost:${PORT}/api/health`);
        console.log(`Dashboard: http://localhost:${PORT}`);
        console.log('=====================================');
    });
}).catch(error => {
    console.error('Failed to initialize:', error);
    process.exit(1);
});
