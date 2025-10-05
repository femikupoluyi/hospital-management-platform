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

// Main Analytics Dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data & Analytics - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .metric-card { transition: all 0.3s; }
        .metric-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-gray-100">
    <!-- Header -->
    <header class="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-chart-line text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-2xl font-bold">Data & Analytics Center</h1>
                        <p class="text-sm opacity-90">Real-time Insights & Predictive Analytics</p>
                    </div>
                </div>
                <button onclick="window.location.href='/'" class="bg-white text-red-600 px-4 py-2 rounded hover:bg-gray-100">
                    <i class="fas fa-home mr-2"></i>Main Platform
                </button>
            </div>
        </div>
    </header>

    <div class="container mx-auto px-6 py-6">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="metric-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Patient Volume</p>
                        <p class="text-2xl font-bold">2,847</p>
                        <p class="text-green-600 text-sm">↑ 12% this month</p>
                    </div>
                    <i class="fas fa-users text-blue-500 text-3xl"></i>
                </div>
            </div>
            <div class="metric-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Revenue</p>
                        <p class="text-2xl font-bold">$428K</p>
                        <p class="text-green-600 text-sm">↑ 8% from last month</p>
                    </div>
                    <i class="fas fa-dollar-sign text-green-500 text-3xl"></i>
                </div>
            </div>
            <div class="metric-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Bed Occupancy</p>
                        <p class="text-2xl font-bold">87%</p>
                        <p class="text-yellow-600 text-sm">→ Stable</p>
                    </div>
                    <i class="fas fa-bed text-purple-500 text-3xl"></i>
                </div>
            </div>
            <div class="metric-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm">Avg Wait Time</p>
                        <p class="text-2xl font-bold">24 min</p>
                        <p class="text-green-600 text-sm">↓ 5 min improvement</p>
                    </div>
                    <i class="fas fa-clock text-orange-500 text-3xl"></i>
                </div>
            </div>
        </div>

        <!-- Analytics Features -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Predictive Analytics -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4">
                    <i class="fas fa-brain text-purple-600 mr-2"></i>Predictive Analytics
                </h3>
                <div class="space-y-3">
                    <div class="p-3 bg-purple-50 rounded">
                        <p class="font-medium">Patient Demand Forecast</p>
                        <p class="text-sm text-gray-600">Expected 15% increase in ER visits next week</p>
                    </div>
                    <div class="p-3 bg-blue-50 rounded">
                        <p class="font-medium">Drug Usage Prediction</p>
                        <p class="text-sm text-gray-600">Antibiotics stock may run low in 5 days</p>
                    </div>
                    <div class="p-3 bg-green-50 rounded">
                        <p class="font-medium">Bed Occupancy Forecast</p>
                        <p class="text-sm text-gray-600">92% occupancy expected by weekend</p>
                    </div>
                </div>
            </div>

            <!-- AI/ML Features -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4">
                    <i class="fas fa-robot text-blue-600 mr-2"></i>AI/ML Capabilities
                </h3>
                <div class="space-y-3">
                    <button onclick="alert('Triage Bot: Analyzing patient symptoms...')" class="w-full p-3 bg-blue-50 rounded hover:bg-blue-100 text-left">
                        <i class="fas fa-stethoscope mr-2"></i>
                        <span class="font-medium">Triage Bot</span>
                        <p class="text-sm text-gray-600">AI-powered patient prioritization</p>
                    </button>
                    <button onclick="alert('Fraud Detection: Scanning billing records...')" class="w-full p-3 bg-red-50 rounded hover:bg-red-100 text-left">
                        <i class="fas fa-shield-alt mr-2"></i>
                        <span class="font-medium">Fraud Detection</span>
                        <p class="text-sm text-gray-600">Identify billing anomalies</p>
                    </button>
                    <button onclick="alert('Risk Scoring: Calculating patient risk...')" class="w-full p-3 bg-yellow-50 rounded hover:bg-yellow-100 text-left">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <span class="font-medium">Patient Risk Scoring</span>
                        <p class="text-sm text-gray-600">Predict high-risk patients</p>
                    </button>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4">Patient Flow Trends</h3>
                <canvas id="patientFlowChart"></canvas>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4">Revenue Analysis</h3>
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <!-- Data Lake Status -->
        <div class="bg-white rounded-lg shadow p-6 mt-6">
            <h3 class="text-lg font-bold mb-4">
                <i class="fas fa-database text-indigo-600 mr-2"></i>Centralized Data Lake
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-sm text-gray-600">Total Records</p>
                    <p class="text-xl font-bold">1.2M+</p>
                </div>
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-sm text-gray-600">Data Sources</p>
                    <p class="text-xl font-bold">12</p>
                </div>
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-sm text-gray-600">Last Sync</p>
                    <p class="text-xl font-bold">2 min ago</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Patient Flow Chart
        const patientCtx = document.getElementById('patientFlowChart').getContext('2d');
        new Chart(patientCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Inpatients',
                    data: [165, 159, 180, 181, 156, 155, 140],
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.1
                }, {
                    label: 'Outpatients',
                    data: [285, 289, 300, 291, 296, 275, 260],
                    borderColor: 'rgb(34, 197, 94)',
                    tension: 0.1
                }]
            }
        });

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Cash', 'Insurance', 'NHIS', 'HMO'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [125000, 180000, 75000, 48000],
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
                }]
            }
        });

        // Simulate real-time updates
        setInterval(() => {
            document.querySelectorAll('.metric-card p.text-2xl').forEach(el => {
                const current = parseInt(el.textContent.replace(/[^0-9]/g, ''));
                const variation = Math.floor(Math.random() * 10) - 5;
                if (!isNaN(current)) {
                    el.textContent = el.textContent.includes('$') ? 
                        '$' + (current + variation).toLocaleString() : 
                        (current + variation).toLocaleString();
                }
            });
        }, 5000);
    </script>
</body>
</html>
    `);
});

// API endpoints
app.get('/api/analytics/metrics', async (req, res) => {
    res.json({
        patientVolume: 2847,
        revenue: 428000,
        bedOccupancy: 87,
        avgWaitTime: 24,
        predictions: {
            patientDemand: '+15%',
            drugUsage: 'Low stock in 5 days',
            occupancy: '92% by weekend'
        }
    });
});

app.get('/api/analytics/predictions', async (req, res) => {
    res.json({
        patientDemandForecast: {
            nextWeek: { expected: 3275, confidence: 0.85 },
            trend: 'increasing',
            factors: ['seasonal flu', 'weekend coverage']
        },
        drugUsagePrediction: {
            lowStockItems: ['Antibiotics', 'Pain relievers'],
            daysUntilReorder: 5
        },
        bedOccupancyForecast: {
            weekend: 92,
            weekday: 87,
            critical: false
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Analytics Module' });
});

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
    console.log(`Analytics Module running on port ${PORT}`);
});
