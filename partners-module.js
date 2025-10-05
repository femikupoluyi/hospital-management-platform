const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Main Partners Dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partner & Ecosystem Integrations - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .partner-card { transition: all 0.3s; }
        .partner-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .status-indicator { animation: pulse 2s infinite; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body class="bg-gray-100">
    <!-- Header -->
    <header class="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-handshake text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-2xl font-bold">Partner & Ecosystem Hub</h1>
                        <p class="text-sm opacity-90">Integrated Healthcare Network</p>
                    </div>
                </div>
                <button onclick="window.location.href='/'" class="bg-white text-teal-600 px-4 py-2 rounded hover:bg-gray-100">
                    <i class="fas fa-home mr-2"></i>Main Platform
                </button>
            </div>
        </div>
    </header>

    <div class="container mx-auto px-6 py-6">
        <!-- Integration Status -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Active Integrations</p>
                        <p class="text-2xl font-bold">18</p>
                    </div>
                    <i class="fas fa-link text-green-500 text-2xl"></i>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">API Calls Today</p>
                        <p class="text-2xl font-bold">12.4K</p>
                    </div>
                    <i class="fas fa-exchange-alt text-blue-500 text-2xl"></i>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Claims Processed</p>
                        <p class="text-2xl font-bold">847</p>
                    </div>
                    <i class="fas fa-file-invoice text-purple-500 text-2xl"></i>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Compliance Score</p>
                        <p class="text-2xl font-bold">98%</p>
                    </div>
                    <i class="fas fa-shield-alt text-yellow-500 text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Partner Categories -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Insurance & HMO Integration -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-umbrella text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Insurance & HMO</h3>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>HealthGuard Insurance</span>
                        <span class="text-green-600 text-sm status-indicator">● Active</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>MediCare Plus HMO</span>
                        <span class="text-green-600 text-sm status-indicator">● Active</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>National Health Scheme</span>
                        <span class="text-green-600 text-sm status-indicator">● Active</span>
                    </div>
                </div>
                <button onclick="showIntegrationDetails('insurance')" class="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Manage Integrations
                </button>
            </div>

            <!-- Pharmacy & Suppliers -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-pills text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Pharmacy & Suppliers</h3>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>MedSupply Direct</span>
                        <span class="text-green-600 text-sm status-indicator">● Active</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>PharmaCare Network</span>
                        <span class="text-green-600 text-sm status-indicator">● Active</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>QuickMed Supplies</span>
                        <span class="text-yellow-600 text-sm">● Pending</span>
                    </div>
                </div>
                <button onclick="showIntegrationDetails('pharmacy')" class="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Auto-Restock Settings
                </button>
            </div>

            <!-- Telemedicine -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-video text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Telemedicine</h3>
                </div>
                <div class="space-y-3">
                    <div class="p-3 bg-purple-50 rounded">
                        <p class="font-medium">Virtual Consultations</p>
                        <p class="text-sm text-gray-600">324 sessions this month</p>
                    </div>
                    <div class="p-3 bg-purple-50 rounded">
                        <p class="font-medium">Remote Diagnostics</p>
                        <p class="text-sm text-gray-600">AI-powered analysis ready</p>
                    </div>
                </div>
                <button onclick="launchTelemedicine()" class="w-full mt-4 bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                    Launch Session
                </button>
            </div>

            <!-- Government & NGO -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-3 rounded-lg">
                        <i class="fas fa-landmark text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Government & NGO</h3>
                </div>
                <div class="space-y-3">
                    <div class="p-2 bg-gray-50 rounded">
                        <div class="flex items-center justify-between">
                            <span>Ministry of Health</span>
                            <span class="text-green-600 text-sm">✓ Compliant</span>
                        </div>
                    </div>
                    <div class="p-2 bg-gray-50 rounded">
                        <div class="flex items-center justify-between">
                            <span>WHO Standards</span>
                            <span class="text-green-600 text-sm">✓ Certified</span>
                        </div>
                    </div>
                    <div class="p-2 bg-gray-50 rounded">
                        <div class="flex items-center justify-between">
                            <span>Red Cross Partnership</span>
                            <span class="text-green-600 text-sm">✓ Active</span>
                        </div>
                    </div>
                </div>
                <button onclick="generateComplianceReport()" class="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700">
                    Generate Report
                </button>
            </div>

            <!-- Lab Networks -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-indigo-100 p-3 rounded-lg">
                        <i class="fas fa-microscope text-indigo-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Laboratory Networks</h3>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>DiagnoLab Plus</span>
                        <span class="text-green-600 text-sm status-indicator">● Connected</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>PathoCare Labs</span>
                        <span class="text-green-600 text-sm status-indicator">● Connected</span>
                    </div>
                    <div class="p-2 bg-indigo-50 rounded">
                        <p class="text-sm">Results sync: Every 15 min</p>
                    </div>
                </div>
                <button onclick="viewLabResults()" class="w-full mt-4 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                    View Results
                </button>
            </div>

            <!-- Emergency Services -->
            <div class="partner-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="fas fa-ambulance text-orange-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold ml-3">Emergency Services</h3>
                </div>
                <div class="space-y-3">
                    <div class="p-2 bg-gray-50 rounded">
                        <div class="flex items-center justify-between">
                            <span>Ambulance Network</span>
                            <span class="text-green-600 text-sm">24/7 Active</span>
                        </div>
                    </div>
                    <div class="p-2 bg-gray-50 rounded">
                        <div class="flex items-center justify-between">
                            <span>Blood Bank</span>
                            <span class="text-green-600 text-sm">Connected</span>
                        </div>
                    </div>
                    <div class="p-2 bg-orange-50 rounded">
                        <p class="text-sm">Response time: Avg 8 min</p>
                    </div>
                </div>
                <button onclick="emergencyDispatch()" class="w-full mt-4 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                    Emergency Dispatch
                </button>
            </div>
        </div>

        <!-- Integration Activity Log -->
        <div class="bg-white rounded-lg shadow p-6 mt-6">
            <h3 class="text-lg font-bold mb-4">Recent Integration Activity</h3>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-500 mr-3"></i>
                        <div>
                            <p class="font-medium">Insurance Claim #INS2847</p>
                            <p class="text-sm text-gray-600">HealthGuard - Approved</p>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">2 min ago</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div class="flex items-center">
                        <i class="fas fa-sync text-blue-500 mr-3"></i>
                        <div>
                            <p class="font-medium">Pharmacy Auto-Restock</p>
                            <p class="text-sm text-gray-600">50 items ordered from MedSupply</p>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">15 min ago</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div class="flex items-center">
                        <i class="fas fa-file-export text-purple-500 mr-3"></i>
                        <div>
                            <p class="font-medium">Government Report Submitted</p>
                            <p class="text-sm text-gray-600">Monthly compliance report sent</p>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">1 hour ago</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showIntegrationDetails(type) {
            alert('Opening ' + type + ' integration dashboard...');
        }

        function launchTelemedicine() {
            alert('Launching telemedicine platform...');
        }

        function generateComplianceReport() {
            alert('Generating compliance report for government submission...');
        }

        function viewLabResults() {
            alert('Opening laboratory results portal...');
        }

        function emergencyDispatch() {
            alert('Emergency dispatch system activated!');
        }

        // Simulate real-time updates
        setInterval(() => {
            const apiCalls = document.querySelector('.text-2xl.font-bold');
            if (apiCalls && apiCalls.textContent.includes('K')) {
                const current = parseFloat(apiCalls.textContent);
                apiCalls.textContent = (current + 0.1).toFixed(1) + 'K';
            }
        }, 3000);
    </script>
</body>
</html>
    `);
});

// API endpoints
app.get('/api/partners/status', async (req, res) => {
    res.json({
        activeIntegrations: 18,
        apiCallsToday: 12400,
        claimsProcessed: 847,
        complianceScore: 98,
        partners: {
            insurance: ['HealthGuard', 'MediCare Plus', 'NHIS'],
            pharmacy: ['MedSupply Direct', 'PharmaCare Network'],
            labs: ['DiagnoLab Plus', 'PathoCare Labs'],
            government: ['Ministry of Health', 'WHO'],
            emergency: ['Ambulance Network', 'Blood Bank']
        }
    });
});

app.post('/api/partners/insurance/claim', async (req, res) => {
    const { patientId, providerId, amount, serviceType } = req.body;
    const claimId = 'CLM' + Date.now();
    res.json({
        success: true,
        claimId,
        status: 'submitted',
        estimatedProcessing: '24-48 hours'
    });
});

app.post('/api/partners/pharmacy/restock', async (req, res) => {
    const { items, supplierId } = req.body;
    res.json({
        success: true,
        orderId: 'ORD' + Date.now(),
        itemsOrdered: items?.length || 0,
        estimatedDelivery: '2-3 business days'
    });
});

app.get('/api/partners/telemedicine/sessions', async (req, res) => {
    res.json({
        totalSessions: 324,
        activeNow: 5,
        avgDuration: 22,
        satisfaction: 4.6
    });
});

app.post('/api/partners/government/report', async (req, res) => {
    res.json({
        success: true,
        reportId: 'RPT' + Date.now(),
        type: req.body.type || 'monthly',
        status: 'submitted',
        nextDue: '30 days'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Partners Module' });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Partners Module running on port ${PORT}`);
});
