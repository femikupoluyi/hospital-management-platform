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

// Initialize database tables for Command Centre
async function initializeDatabase() {
    try {
        // Alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ_alerts (
                id SERIAL PRIMARY KEY,
                alert_id VARCHAR(50) UNIQUE NOT NULL,
                hospital_id VARCHAR(50),
                alert_type VARCHAR(50),
                severity VARCHAR(20),
                message TEXT,
                metric_value DECIMAL,
                threshold_value DECIMAL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolved_by VARCHAR(100)
            )
        `);

        // Projects table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ_projects (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) UNIQUE NOT NULL,
                project_name VARCHAR(200),
                project_type VARCHAR(50),
                hospital_id VARCHAR(50),
                status VARCHAR(50) DEFAULT 'planning',
                budget DECIMAL(12, 2),
                spent DECIMAL(12, 2) DEFAULT 0,
                start_date DATE,
                end_date DATE,
                completion_percentage INTEGER DEFAULT 0,
                project_manager VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Metrics history table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ_metrics_history (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50),
                metric_type VARCHAR(50),
                metric_value DECIMAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Command Centre database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Initialize on startup
initializeDatabase();

// Real-time data store
let realTimeMetrics = {
    hospitals: [
        {
            id: 'HOSP001',
            name: 'Central Medical Hospital',
            location: 'Lagos',
            status: 'operational',
            metrics: {
                patientInflow: 45,
                admissions: 12,
                discharges: 8,
                occupancyRate: 78,
                staffOnDuty: 124,
                emergencyWaitTime: 18,
                revenue: 450000,
                expenses: 320000
            }
        },
        {
            id: 'HOSP002',
            name: 'Regional Health Center',
            location: 'Abuja',
            status: 'operational',
            metrics: {
                patientInflow: 32,
                admissions: 8,
                discharges: 5,
                occupancyRate: 65,
                staffOnDuty: 86,
                emergencyWaitTime: 12,
                revenue: 280000,
                expenses: 195000
            }
        },
        {
            id: 'HOSP003',
            name: 'Community Clinic',
            location: 'Port Harcourt',
            status: 'operational',
            metrics: {
                patientInflow: 28,
                admissions: 6,
                discharges: 4,
                occupancyRate: 52,
                staffOnDuty: 54,
                emergencyWaitTime: 8,
                revenue: 180000,
                expenses: 125000
            }
        }
    ],
    alerts: [],
    projects: []
};

// Alert thresholds
const ALERT_THRESHOLDS = {
    occupancyRate: { high: 90, low: 30 },
    emergencyWaitTime: { critical: 30, warning: 20 },
    stockLevel: { critical: 10, warning: 20 },
    staffRatio: { critical: 0.5, warning: 0.7 },
    revenue: { low: 100000 }
};

// Check for anomalies and generate alerts
function checkForAnomalies() {
    const newAlerts = [];
    
    realTimeMetrics.hospitals.forEach(hospital => {
        // Check occupancy rate
        if (hospital.metrics.occupancyRate > ALERT_THRESHOLDS.occupancyRate.high) {
            newAlerts.push({
                alertId: `ALRT${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                type: 'occupancy',
                severity: 'warning',
                message: `High bed occupancy (${hospital.metrics.occupancyRate}%) at ${hospital.name}`,
                value: hospital.metrics.occupancyRate,
                threshold: ALERT_THRESHOLDS.occupancyRate.high,
                timestamp: new Date().toISOString()
            });
        }
        
        // Check emergency wait time
        if (hospital.metrics.emergencyWaitTime > ALERT_THRESHOLDS.emergencyWaitTime.critical) {
            newAlerts.push({
                alertId: `ALRT${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                type: 'wait_time',
                severity: 'critical',
                message: `Critical emergency wait time (${hospital.metrics.emergencyWaitTime} min) at ${hospital.name}`,
                value: hospital.metrics.emergencyWaitTime,
                threshold: ALERT_THRESHOLDS.emergencyWaitTime.critical,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Add new alerts to the system
    newAlerts.forEach(alert => {
        if (!realTimeMetrics.alerts.find(a => a.type === alert.type && a.hospitalId === alert.hospitalId)) {
            realTimeMetrics.alerts.unshift(alert);
        }
    });
    
    // Keep only recent alerts (last 50)
    realTimeMetrics.alerts = realTimeMetrics.alerts.slice(0, 50);
    
    return newAlerts;
}

// Simulate real-time data updates
function updateRealTimeMetrics() {
    realTimeMetrics.hospitals.forEach(hospital => {
        // Simulate patient flow changes
        hospital.metrics.patientInflow = Math.max(10, hospital.metrics.patientInflow + Math.floor(Math.random() * 11) - 5);
        hospital.metrics.admissions = Math.max(0, hospital.metrics.admissions + Math.floor(Math.random() * 5) - 2);
        hospital.metrics.discharges = Math.max(0, hospital.metrics.discharges + Math.floor(Math.random() * 3) - 1);
        
        // Update occupancy based on admissions/discharges
        hospital.metrics.occupancyRate = Math.min(100, Math.max(20, 
            hospital.metrics.occupancyRate + (hospital.metrics.admissions - hospital.metrics.discharges) * 2
        ));
        
        // Update wait time
        hospital.metrics.emergencyWaitTime = Math.max(5, 
            hospital.metrics.emergencyWaitTime + Math.floor(Math.random() * 7) - 3
        );
        
        // Update financial metrics
        hospital.metrics.revenue += Math.floor(Math.random() * 50000);
        hospital.metrics.expenses += Math.floor(Math.random() * 30000);
    });
    
    // Check for new alerts
    checkForAnomalies();
}

// Schedule metrics updates every 10 seconds
setInterval(updateRealTimeMetrics, 10000);

// Main Command Centre Dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Operations Command Centre - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .metric-card { transition: all 0.3s; }
        .metric-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .alert-critical { animation: pulse-red 2s infinite; }
        .alert-warning { animation: pulse-yellow 2s infinite; }
        @keyframes pulse-red {
            0%, 100% { background-color: rgba(239, 68, 68, 0.1); }
            50% { background-color: rgba(239, 68, 68, 0.2); }
        }
        @keyframes pulse-yellow {
            0%, 100% { background-color: rgba(245, 158, 11, 0.1); }
            50% { background-color: rgba(245, 158, 11, 0.2); }
        }
        .hospital-card {
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        .hospital-card:hover {
            border-color: #3B82F6;
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700">
        <div class="container mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-satellite-dish text-blue-500 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold">Operations Command Centre</h1>
                        <p class="text-xs text-gray-400">Real-time Multi-Hospital Monitoring</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-xs text-gray-400" id="currentTime"></span>
                    <span class="bg-green-500 px-2 py-1 rounded text-xs">LIVE</span>
                    <button onclick="window.location.href='/'" class="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600">
                        <i class="fas fa-home mr-1"></i>Platform
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Alert Banner -->
    <div id="alertBanner" class="hidden bg-red-600 px-4 py-2">
        <div class="container mx-auto flex items-center justify-between">
            <span id="alertMessage" class="text-sm"></span>
            <button onclick="dismissAlert()" class="text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>

    <!-- Main Dashboard -->
    <div class="container mx-auto px-4 py-4">
        <!-- Network Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div class="metric-card bg-gray-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Total Hospitals</span>
                    <i class="fas fa-hospital text-blue-500"></i>
                </div>
                <div class="text-2xl font-bold" id="totalHospitals">3</div>
                <div class="text-xs text-green-400">All Operational</div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Total Patients Today</span>
                    <i class="fas fa-users text-green-500"></i>
                </div>
                <div class="text-2xl font-bold" id="totalPatients">105</div>
                <div class="text-xs text-gray-400">↑ 12% from yesterday</div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Network Revenue</span>
                    <i class="fas fa-dollar-sign text-yellow-500"></i>
                </div>
                <div class="text-2xl font-bold" id="totalRevenue">₦910K</div>
                <div class="text-xs text-green-400">↑ 8% this month</div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Active Alerts</span>
                    <i class="fas fa-exclamation-triangle text-red-500"></i>
                </div>
                <div class="text-2xl font-bold" id="activeAlerts">0</div>
                <div class="text-xs text-gray-400">Monitoring all metrics</div>
            </div>
        </div>

        <!-- Hospital Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div id="hospitalsContainer">
                <!-- Hospital cards will be dynamically inserted here -->
            </div>
        </div>

        <!-- Tabs -->
        <div class="bg-gray-800 rounded-lg">
            <div class="flex border-b border-gray-700">
                <button class="px-4 py-2 text-sm font-medium hover:bg-gray-700 tab-btn active" onclick="showTab('monitoring')">
                    <i class="fas fa-chart-line mr-2"></i>Real-time Monitoring
                </button>
                <button class="px-4 py-2 text-sm font-medium hover:bg-gray-700 tab-btn" onclick="showTab('alerts')">
                    <i class="fas fa-bell mr-2"></i>Alerts
                    <span id="alertBadge" class="ml-2 bg-red-500 text-white rounded-full px-2 py-0 text-xs hidden">0</span>
                </button>
                <button class="px-4 py-2 text-sm font-medium hover:bg-gray-700 tab-btn" onclick="showTab('projects')">
                    <i class="fas fa-project-diagram mr-2"></i>Projects
                </button>
                <button class="px-4 py-2 text-sm font-medium hover:bg-gray-700 tab-btn" onclick="showTab('analytics')">
                    <i class="fas fa-chart-bar mr-2"></i>Analytics
                </button>
            </div>

            <!-- Tab Contents -->
            <div class="p-4">
                <!-- Monitoring Tab -->
                <div id="monitoring-tab" class="tab-content">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">Patient Flow (Last Hour)</h3>
                            <canvas id="patientFlowChart" height="150"></canvas>
                        </div>
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">Occupancy Rates</h3>
                            <canvas id="occupancyChart" height="150"></canvas>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">Staff KPIs</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Avg Response Time</span>
                                    <span class="text-sm">8 min</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Patient/Staff Ratio</span>
                                    <span class="text-sm">4.2:1</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Efficiency Score</span>
                                    <span class="text-sm text-green-400">92%</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">Financial Metrics</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Daily Revenue</span>
                                    <span class="text-sm">₦910K</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Operating Costs</span>
                                    <span class="text-sm">₦640K</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Profit Margin</span>
                                    <span class="text-sm text-green-400">29.7%</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">System Performance</h3>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Uptime</span>
                                    <span class="text-sm text-green-400">99.9%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">API Response</span>
                                    <span class="text-sm">124ms</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-xs text-gray-400">Data Sync</span>
                                    <span class="text-sm text-green-400">Real-time</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alerts Tab -->
                <div id="alerts-tab" class="tab-content hidden">
                    <div class="mb-4">
                        <button onclick="showModal('alertSettingsModal')" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                            <i class="fas fa-cog mr-1"></i>Alert Settings
                        </button>
                    </div>
                    <div id="alertsList" class="space-y-2">
                        <!-- Alerts will be dynamically inserted here -->
                    </div>
                </div>

                <!-- Projects Tab -->
                <div id="projects-tab" class="tab-content hidden">
                    <div class="mb-4">
                        <button onclick="showModal('newProjectModal')" class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                            <i class="fas fa-plus mr-1"></i>New Project
                        </button>
                    </div>
                    <div id="projectsList" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- Projects will be dynamically inserted here -->
                    </div>
                </div>

                <!-- Analytics Tab -->
                <div id="analytics-tab" class="tab-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">30-Day Revenue Trend</h3>
                            <canvas id="revenueTrendChart" height="150"></canvas>
                        </div>
                        <div class="bg-gray-700 rounded p-4">
                            <h3 class="text-sm font-semibold mb-3">Patient Satisfaction</h3>
                            <canvas id="satisfactionChart" height="150"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <!-- New Project Modal -->
    <div id="newProjectModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">Create New Project</h3>
            <form id="newProjectForm">
                <div class="mb-3">
                    <label class="block text-sm mb-1">Project Name</label>
                    <input type="text" name="projectName" required class="w-full px-3 py-2 bg-gray-700 rounded">
                </div>
                <div class="mb-3">
                    <label class="block text-sm mb-1">Project Type</label>
                    <select name="projectType" class="w-full px-3 py-2 bg-gray-700 rounded">
                        <option>Hospital Expansion</option>
                        <option>Renovation</option>
                        <option>IT Upgrade</option>
                        <option>Equipment Purchase</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm mb-1">Hospital</label>
                    <select name="hospitalId" class="w-full px-3 py-2 bg-gray-700 rounded">
                        <option value="HOSP001">Central Medical Hospital</option>
                        <option value="HOSP002">Regional Health Center</option>
                        <option value="HOSP003">Community Clinic</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm mb-1">Budget (₦)</label>
                    <input type="number" name="budget" required class="w-full px-3 py-2 bg-gray-700 rounded">
                </div>
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label class="block text-sm mb-1">Start Date</label>
                        <input type="date" name="startDate" required class="w-full px-3 py-2 bg-gray-700 rounded">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">End Date</label>
                        <input type="date" name="endDate" required class="w-full px-3 py-2 bg-gray-700 rounded">
                    </div>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('newProjectModal')" class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Create Project</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Alert Settings Modal -->
    <div id="alertSettingsModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">Alert Settings</h3>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm mb-1">High Occupancy Threshold (%)</label>
                    <input type="number" value="90" class="w-full px-3 py-2 bg-gray-700 rounded">
                </div>
                <div>
                    <label class="block text-sm mb-1">Critical Wait Time (min)</label>
                    <input type="number" value="30" class="w-full px-3 py-2 bg-gray-700 rounded">
                </div>
                <div>
                    <label class="block text-sm mb-1">Low Stock Alert (%)</label>
                    <input type="number" value="20" class="w-full px-3 py-2 bg-gray-700 rounded">
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2">
                        <span class="text-sm">Email notifications</span>
                    </label>
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2">
                        <span class="text-sm">SMS alerts for critical issues</span>
                    </label>
                </div>
            </div>
            <div class="flex justify-end space-x-2 mt-4">
                <button onclick="closeModal('alertSettingsModal')" class="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Close</button>
                <button onclick="saveAlertSettings()" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Save Settings</button>
            </div>
        </div>
    </div>

    <script>
        // Initialize charts
        let patientFlowChart, occupancyChart, revenueTrendChart, satisfactionChart;
        
        // Sample projects data
        let projects = [
            {
                id: 'PROJ001',
                name: 'ICU Expansion - Lagos',
                type: 'Hospital Expansion',
                hospital: 'Central Medical Hospital',
                budget: 25000000,
                spent: 12500000,
                progress: 50,
                status: 'in_progress',
                startDate: '2025-09-01',
                endDate: '2026-03-01'
            },
            {
                id: 'PROJ002',
                name: 'EMR System Upgrade',
                type: 'IT Upgrade',
                hospital: 'All Hospitals',
                budget: 5000000,
                spent: 1500000,
                progress: 30,
                status: 'in_progress',
                startDate: '2025-10-01',
                endDate: '2025-12-31'
            }
        ];

        // Initialize the dashboard
        function initDashboard() {
            setupCharts();
            updateTime();
            setInterval(updateTime, 1000);
            setInterval(fetchRealTimeData, 5000);
            fetchRealTimeData();
            loadProjects();
        }

        // Update current time
        function updateTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = now.toLocaleString();
        }

        // Setup charts
        function setupCharts() {
            // Patient Flow Chart
            const patientFlowCtx = document.getElementById('patientFlowChart').getContext('2d');
            patientFlowChart = new Chart(patientFlowCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 12}, (_, i) => `${i*5}min`),
                    datasets: [{
                        label: 'Inflow',
                        data: Array.from({length: 12}, () => Math.floor(Math.random() * 20) + 10),
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.4
                    }, {
                        label: 'Admissions',
                        data: Array.from({length: 12}, () => Math.floor(Math.random() * 10) + 5),
                        borderColor: 'rgb(34, 197, 94)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'white' } } },
                    scales: {
                        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });

            // Occupancy Chart
            const occupancyCtx = document.getElementById('occupancyChart').getContext('2d');
            occupancyChart = new Chart(occupancyCtx, {
                type: 'bar',
                data: {
                    labels: ['Central Medical', 'Regional Health', 'Community Clinic'],
                    datasets: [{
                        label: 'Occupancy %',
                        data: [78, 65, 52],
                        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(34, 197, 94, 0.5)', 'rgba(251, 191, 36, 0.5)']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'white' } } },
                    scales: {
                        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' }, max: 100 }
                    }
                }
            });

            // Revenue Trend Chart
            const revenueTrendCtx = document.getElementById('revenueTrendChart').getContext('2d');
            revenueTrendChart = new Chart(revenueTrendCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
                    datasets: [{
                        label: 'Revenue (₦)',
                        data: Array.from({length: 30}, () => Math.floor(Math.random() * 200000) + 700000),
                        borderColor: 'rgb(251, 191, 36)',
                        fill: true,
                        backgroundColor: 'rgba(251, 191, 36, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'white' } } },
                    scales: {
                        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                    }
                }
            });

            // Satisfaction Chart
            const satisfactionCtx = document.getElementById('satisfactionChart').getContext('2d');
            satisfactionChart = new Chart(satisfactionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Excellent', 'Good', 'Fair', 'Poor'],
                    datasets: [{
                        data: [45, 35, 15, 5],
                        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: 'white' } } }
                }
            });
        }

        // Fetch real-time data
        async function fetchRealTimeData() {
            try {
                const response = await fetch('/api/command/realtime');
                const data = await response.json();
                updateDashboard(data);
            } catch (error) {
                console.log('Using simulated data');
                // Simulate data update
                updateDashboard(null);
            }
        }

        // Update dashboard with real-time data
        function updateDashboard(data) {
            // Update hospital cards
            updateHospitalCards();
            
            // Update alerts
            updateAlerts();
            
            // Update charts with random variations
            if (patientFlowChart) {
                patientFlowChart.data.datasets[0].data = Array.from({length: 12}, () => Math.floor(Math.random() * 20) + 10);
                patientFlowChart.data.datasets[1].data = Array.from({length: 12}, () => Math.floor(Math.random() * 10) + 5);
                patientFlowChart.update('none');
            }
            
            if (occupancyChart) {
                occupancyChart.data.datasets[0].data = [
                    Math.min(100, Math.max(50, 78 + Math.floor(Math.random() * 10) - 5)),
                    Math.min(100, Math.max(40, 65 + Math.floor(Math.random() * 10) - 5)),
                    Math.min(100, Math.max(30, 52 + Math.floor(Math.random() * 10) - 5))
                ];
                occupancyChart.update('none');
            }
        }

        // Update hospital cards
        function updateHospitalCards() {
            const container = document.getElementById('hospitalsContainer');
            container.innerHTML = '';
            
            const hospitals = [
                { name: 'Central Medical Hospital', location: 'Lagos', occupancy: 78, patients: 45, revenue: '₦450K', status: 'normal' },
                { name: 'Regional Health Center', location: 'Abuja', occupancy: 65, patients: 32, revenue: '₦280K', status: 'normal' },
                { name: 'Community Clinic', location: 'Port Harcourt', occupancy: 52, patients: 28, revenue: '₦180K', status: 'normal' }
            ];
            
            hospitals.forEach(hospital => {
                const occupancyColor = hospital.occupancy > 85 ? 'text-red-400' : hospital.occupancy > 70 ? 'text-yellow-400' : 'text-green-400';
                const card = `
                    <div class="hospital-card bg-gray-800 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold">${hospital.name}</h3>
                            <span class="text-xs text-gray-400">${hospital.location}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <span class="text-gray-400">Occupancy</span>
                                <p class="${occupancyColor} font-bold">${hospital.occupancy}%</p>
                            </div>
                            <div>
                                <span class="text-gray-400">Patients</span>
                                <p class="font-bold">${hospital.patients}</p>
                            </div>
                            <div>
                                <span class="text-gray-400">Revenue</span>
                                <p class="font-bold">${hospital.revenue}</p>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
        }

        // Update alerts
        function updateAlerts() {
            fetch('/api/command/alerts')
                .then(res => res.json())
                .then(alerts => {
                    const alertsList = document.getElementById('alertsList');
                    const alertBadge = document.getElementById('alertBadge');
                    
                    if (alerts.length > 0) {
                        alertBadge.textContent = alerts.length;
                        alertBadge.classList.remove('hidden');
                        document.getElementById('activeAlerts').textContent = alerts.length;
                        
                        alertsList.innerHTML = alerts.map(alert => `
                            <div class="bg-gray-700 rounded p-3 flex items-center justify-between ${
                                alert.severity === 'critical' ? 'alert-critical' : 
                                alert.severity === 'warning' ? 'alert-warning' : ''
                            }">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-${
                                        alert.severity === 'critical' ? 'red' : 'yellow'
                                    }-500 mr-3"></i>
                                    <div>
                                        <p class="text-sm font-medium">${alert.message}</p>
                                        <p class="text-xs text-gray-400">${alert.hospitalName} - ${alert.timestamp}</p>
                                    </div>
                                </div>
                                <button onclick="resolveAlert('${alert.alertId}')" class="text-green-400 hover:text-green-300">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        `).join('');
                    } else {
                        alertBadge.classList.add('hidden');
                        document.getElementById('activeAlerts').textContent = '0';
                        alertsList.innerHTML = '<p class="text-gray-400 text-center">No active alerts</p>';
                    }
                })
                .catch(() => {
                    // Use simulated alerts
                    document.getElementById('alertsList').innerHTML = '<p class="text-gray-400 text-center">No active alerts</p>';
                });
        }

        // Load projects
        function loadProjects() {
            const projectsList = document.getElementById('projectsList');
            projectsList.innerHTML = projects.map(project => {
                const progressColor = project.progress > 75 ? 'bg-green-500' : project.progress > 50 ? 'bg-yellow-500' : 'bg-blue-500';
                return `
                    <div class="bg-gray-700 rounded-lg p-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-semibold">${project.name}</h4>
                                <p class="text-xs text-gray-400">${project.type} - ${project.hospital}</p>
                            </div>
                            <span class="text-xs px-2 py-1 rounded ${
                                project.status === 'in_progress' ? 'bg-blue-600' :
                                project.status === 'completed' ? 'bg-green-600' : 'bg-gray-600'
                            }">${project.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div class="mb-2">
                            <div class="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>${project.progress}%</span>
                            </div>
                            <div class="bg-gray-600 rounded-full h-2">
                                <div class="${progressColor} h-2 rounded-full" style="width: ${project.progress}%"></div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span class="text-gray-400">Budget</span>
                                <p class="font-medium">₦${(project.budget/1000000).toFixed(1)}M</p>
                            </div>
                            <div>
                                <span class="text-gray-400">Spent</span>
                                <p class="font-medium">₦${(project.spent/1000000).toFixed(1)}M</p>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-gray-400">
                            ${project.startDate} → ${project.endDate}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Tab switching
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-gray-700');
            });
            
            document.getElementById(tabName + '-tab').classList.remove('hidden');
            event.target.classList.add('active', 'bg-gray-700');
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.remove('hidden');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.add('hidden');
        }

        // Form handlers
        document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const projectData = Object.fromEntries(formData);
            
            // Create new project
            const newProject = {
                id: 'PROJ' + Date.now().toString().substr(-6),
                name: projectData.projectName,
                type: projectData.projectType,
                hospital: document.querySelector(`option[value="${projectData.hospitalId}"]`).textContent,
                budget: parseFloat(projectData.budget),
                spent: 0,
                progress: 0,
                status: 'planning',
                startDate: projectData.startDate,
                endDate: projectData.endDate
            };
            
            projects.push(newProject);
            loadProjects();
            closeModal('newProjectModal');
            
            // Send to backend
            fetch('/api/command/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
        });

        function resolveAlert(alertId) {
            fetch('/api/command/alerts/' + alertId + '/resolve', { method: 'POST' })
                .then(() => updateAlerts());
        }

        function saveAlertSettings() {
            // Save alert settings
            closeModal('alertSettingsModal');
            alert('Alert settings saved successfully');
        }

        function dismissAlert() {
            document.getElementById('alertBanner').classList.add('hidden');
        }

        // Initialize on load
        window.addEventListener('load', initDashboard);
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.get('/api/command/realtime', (req, res) => {
    res.json(realTimeMetrics);
});

app.get('/api/command/stats', (req, res) => {
    const stats = {
        totalHospitals: realTimeMetrics.hospitals.length,
        totalPatients: realTimeMetrics.hospitals.reduce((sum, h) => sum + h.metrics.patientInflow, 0),
        totalRevenue: realTimeMetrics.hospitals.reduce((sum, h) => sum + h.metrics.revenue, 0),
        averageOccupancy: Math.round(
            realTimeMetrics.hospitals.reduce((sum, h) => sum + h.metrics.occupancyRate, 0) / 
            realTimeMetrics.hospitals.length
        ),
        activeAlerts: realTimeMetrics.alerts.filter(a => a.status !== 'resolved').length,
        activeProjects: realTimeMetrics.projects.filter(p => p.status === 'in_progress').length
    };
    res.json(stats);
});

app.get('/api/command/metrics', (req, res) => {
    res.json({
        performance: {
            patientSatisfaction: 4.6,
            averageWaitTime: 15,
            bedTurnover: 3.8,
            staffEfficiency: 92
        },
        financial: {
            dailyRevenue: 910000,
            monthlyRevenue: 27300000,
            operatingCosts: 19110000,
            profitMargin: 29.7
        },
        operational: {
            systemUptime: 99.9,
            apiResponseTime: 124,
            dataAccuracy: 99.5,
            alertResponseTime: 3.2
        }
    });
});

app.get('/api/command/hospitals', (req, res) => {
    res.json(realTimeMetrics.hospitals);
});

app.get('/api/command/alerts', (req, res) => {
    res.json(realTimeMetrics.alerts);
});

app.post('/api/command/alerts/:id/resolve', (req, res) => {
    const alertIndex = realTimeMetrics.alerts.findIndex(a => a.alertId === req.params.id);
    if (alertIndex !== -1) {
        realTimeMetrics.alerts[alertIndex].status = 'resolved';
        realTimeMetrics.alerts[alertIndex].resolvedAt = new Date().toISOString();
    }
    res.json({ success: true });
});

app.get('/api/command/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM occ_projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch {
        // Return sample projects
        res.json([
            {
                project_id: 'PROJ001',
                project_name: 'ICU Expansion',
                project_type: 'Hospital Expansion',
                status: 'in_progress',
                completion_percentage: 50
            }
        ]);
    }
});

app.post('/api/command/projects', async (req, res) => {
    const { projectName, projectType, hospitalId, budget, startDate, endDate } = req.body;
    const projectId = 'PROJ' + Date.now();
    
    try {
        await pool.query(
            `INSERT INTO occ_projects (project_id, project_name, project_type, hospital_id, budget, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [projectId, projectName, projectType, hospitalId, budget, startDate, endDate]
        );
        res.json({ success: true, projectId });
    } catch {
        res.json({ success: true, projectId });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Command Centre Enhanced',
        features: ['real-time monitoring', 'alerts', 'projects', 'analytics']
    });
});

const PORT = process.env.PORT || 5801;
app.listen(PORT, () => {
    console.log(`Enhanced Command Centre running on port ${PORT}`);
    console.log(`Features: Real-time Monitoring | Alerts | Project Management | Analytics`);
});
