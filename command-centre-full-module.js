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

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

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
        .pulse-dot {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
            }
        }
        .alert-blink {
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 50%, 100% { opacity: 1; }
            25%, 75% { opacity: 0.5; }
        }
        .metric-card {
            transition: all 0.3s;
        }
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
        }
        .status-online { background-color: #10b981; }
        .status-warning { background-color: #f59e0b; }
        .status-critical { background-color: #ef4444; }
        .status-offline { background-color: #6b7280; }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-satellite-dish text-red-500 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold">Operations Command Centre</h1>
                        <p class="text-sm text-gray-400">Real-time Hospital Network Monitoring</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="flex items-center">
                        <span class="pulse-dot w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span class="text-sm">Live Monitoring</span>
                    </span>
                    <span class="text-sm text-gray-400" id="currentTime"></span>
                    <a href="/" class="text-gray-400 hover:text-white">
                        <i class="fas fa-home"></i> Platform
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Alert Bar -->
    <div id="alertBar" class="bg-red-600 px-6 py-2 hidden">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2 alert-blink"></i>
                <span id="alertMessage">Critical: Server room temperature exceeding threshold at City General Hospital</span>
            </div>
            <button onclick="dismissAlert()" class="text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>

    <!-- Main Dashboard -->
    <main class="container mx-auto px-6 py-6">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="metric-card bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Total Hospitals</span>
                    <i class="fas fa-hospital text-blue-500"></i>
                </div>
                <div class="text-2xl font-bold" id="totalHospitals">12</div>
                <div class="text-xs text-green-400 mt-1">
                    <i class="fas fa-arrow-up"></i> 100% operational
                </div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Active Patients</span>
                    <i class="fas fa-users text-green-500"></i>
                </div>
                <div class="text-2xl font-bold" id="activePatients">3,847</div>
                <div class="text-xs text-green-400 mt-1">
                    <i class="fas fa-arrow-up"></i> +12% today
                </div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Bed Occupancy</span>
                    <i class="fas fa-bed text-yellow-500"></i>
                </div>
                <div class="text-2xl font-bold" id="bedOccupancy">78%</div>
                <div class="text-xs text-yellow-400 mt-1">
                    <i class="fas fa-minus"></i> Moderate load
                </div>
            </div>
            <div class="metric-card bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-gray-400 text-sm">Today's Revenue</span>
                    <i class="fas fa-dollar-sign text-purple-500"></i>
                </div>
                <div class="text-2xl font-bold" id="todayRevenue">$284,592</div>
                <div class="text-xs text-green-400 mt-1">
                    <i class="fas fa-arrow-up"></i> +8% vs yesterday
                </div>
            </div>
        </div>

        <!-- Hospital Grid & Real-time Metrics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Hospital Status Grid -->
            <div class="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Hospital Network Status</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">City General</span>
                            <span class="status-indicator status-online"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 342</div>
                            <div>Staff: 89</div>
                            <div>Occupancy: 82%</div>
                        </div>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">Riverside Med</span>
                            <span class="status-indicator status-online"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 228</div>
                            <div>Staff: 67</div>
                            <div>Occupancy: 75%</div>
                        </div>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">Central Health</span>
                            <span class="status-indicator status-warning"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 456</div>
                            <div>Staff: 102</div>
                            <div>Occupancy: 91%</div>
                        </div>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">Westside Clinic</span>
                            <span class="status-indicator status-online"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 156</div>
                            <div>Staff: 45</div>
                            <div>Occupancy: 68%</div>
                        </div>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">North Medical</span>
                            <span class="status-indicator status-online"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 289</div>
                            <div>Staff: 78</div>
                            <div>Occupancy: 77%</div>
                        </div>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold">East Hospital</span>
                            <span class="status-indicator status-critical"></span>
                        </div>
                        <div class="text-xs text-gray-400">
                            <div>Patients: 512</div>
                            <div>Staff: 134</div>
                            <div>Occupancy: 95%</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alerts Panel -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Active Alerts</h2>
                <div class="space-y-3 max-h-64 overflow-y-auto">
                    <div class="bg-red-900 bg-opacity-30 border border-red-700 rounded p-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm font-semibold text-red-400">Critical</span>
                            <span class="text-xs text-gray-400">2 mins ago</span>
                        </div>
                        <p class="text-xs">East Hospital: ICU at 95% capacity</p>
                    </div>
                    <div class="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm font-semibold text-yellow-400">Warning</span>
                            <span class="text-xs text-gray-400">15 mins ago</span>
                        </div>
                        <p class="text-xs">Central Health: Low stock on essential medications</p>
                    </div>
                    <div class="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm font-semibold text-yellow-400">Warning</span>
                            <span class="text-xs text-gray-400">1 hour ago</span>
                        </div>
                        <p class="text-xs">Riverside Med: Staff shortage in Emergency</p>
                    </div>
                    <div class="bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm font-semibold text-blue-400">Info</span>
                            <span class="text-xs text-gray-400">2 hours ago</span>
                        </div>
                        <p class="text-xs">System update scheduled for tonight 2 AM</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Patient Flow Chart -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Patient Flow (24h)</h2>
                <canvas id="patientFlowChart" height="150"></canvas>
            </div>

            <!-- Revenue Chart -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Revenue Trend (7 days)</h2>
                <canvas id="revenueChart" height="150"></canvas>
            </div>
        </div>

        <!-- KPI Monitoring -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Staff Performance -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Staff KPIs</h2>
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-gray-400">Avg Response Time</span>
                            <span class="text-sm font-semibold">4.2 mins</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 85%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-gray-400">Patient Satisfaction</span>
                            <span class="text-sm font-semibold">92%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 92%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-gray-400">Staff Utilization</span>
                            <span class="text-sm font-semibold">78%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 78%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-gray-400">Attendance Rate</span>
                            <span class="text-sm font-semibold">96%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 96%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Financial Metrics -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Financial Metrics</h2>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Collections Rate</span>
                        <span class="text-sm font-semibold text-green-400">94%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Avg Bill Size</span>
                        <span class="text-sm font-semibold">$1,247</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Insurance Claims</span>
                        <span class="text-sm font-semibold">$142,350</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Pending Payments</span>
                        <span class="text-sm font-semibold text-yellow-400">$38,920</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-400">Monthly Target</span>
                        <span class="text-sm font-semibold">82% achieved</span>
                    </div>
                </div>
            </div>

            <!-- Project Management -->
            <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 class="text-lg font-semibold mb-4">Active Projects</h2>
                <div class="space-y-3">
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold">ICU Expansion - East</span>
                            <span class="text-xs bg-blue-600 px-2 py-1 rounded">In Progress</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: 65%"></div>
                        </div>
                        <span class="text-xs text-gray-400">65% complete</span>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold">IT System Upgrade</span>
                            <span class="text-xs bg-yellow-600 px-2 py-1 rounded">Planning</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 25%"></div>
                        </div>
                        <span class="text-xs text-gray-400">25% complete</span>
                    </div>
                    <div class="bg-gray-900 rounded p-3 border border-gray-700">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold">New Wing - Central</span>
                            <span class="text-xs bg-green-600 px-2 py-1 rounded">Completed</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                        <span class="text-xs text-gray-400">100% complete</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-center space-x-4">
            <button onclick="generateReport()" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
                <i class="fas fa-file-pdf mr-2"></i>Generate Report
            </button>
            <button onclick="exportData()" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded">
                <i class="fas fa-download mr-2"></i>Export Data
            </button>
            <button onclick="showAlertConfig()" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded">
                <i class="fas fa-bell mr-2"></i>Configure Alerts
            </button>
            <button onclick="refreshDashboard()" class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded">
                <i class="fas fa-sync mr-2"></i>Refresh
            </button>
        </div>
    </main>

    <script>
        // Update current time
        function updateTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = now.toLocaleString();
        }
        updateTime();
        setInterval(updateTime, 1000);

        // Simulate real-time updates
        function updateMetrics() {
            // Simulate metric changes
            document.getElementById('activePatients').textContent = 
                (3500 + Math.floor(Math.random() * 500)).toLocaleString();
            document.getElementById('bedOccupancy').textContent = 
                (70 + Math.floor(Math.random() * 25)) + '%';
            document.getElementById('todayRevenue').textContent = 
                '$' + (250000 + Math.floor(Math.random() * 50000)).toLocaleString();
        }

        // Patient Flow Chart
        const patientFlowCtx = document.getElementById('patientFlowChart').getContext('2d');
        const patientFlowChart = new Chart(patientFlowCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => i + ':00'),
                datasets: [{
                    label: 'Admissions',
                    data: Array.from({length: 24}, () => Math.floor(Math.random() * 50) + 20),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Discharges',
                    data: Array.from({length: 24}, () => Math.floor(Math.random() * 40) + 15),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#9ca3af'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                }
            }
        });

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        const revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [245000, 268000, 252000, 289000, 276000, 298000, 284000],
                    backgroundColor: 'rgba(168, 85, 247, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#9ca3af'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af',
                            callback: function(value) {
                                return '$' + (value/1000) + 'k';
                            }
                        }
                    }
                }
            }
        });

        // Update charts with real-time data
        function updateCharts() {
            // Add new data point to patient flow
            if (patientFlowChart.data.datasets[0].data.length > 24) {
                patientFlowChart.data.datasets[0].data.shift();
                patientFlowChart.data.datasets[1].data.shift();
            }
            patientFlowChart.data.datasets[0].data.push(Math.floor(Math.random() * 50) + 20);
            patientFlowChart.data.datasets[1].data.push(Math.floor(Math.random() * 40) + 15);
            patientFlowChart.update();
        }

        // Action functions
        function dismissAlert() {
            document.getElementById('alertBar').classList.add('hidden');
        }

        function generateReport() {
            alert('Generating comprehensive report...');
        }

        function exportData() {
            alert('Exporting dashboard data...');
        }

        function showAlertConfig() {
            alert('Opening alert configuration...');
        }

        function refreshDashboard() {
            updateMetrics();
            updateCharts();
            alert('Dashboard refreshed!');
        }

        // Show random alert
        function showRandomAlert() {
            const alerts = [
                'Critical: Server room temperature exceeding threshold at City General Hospital',
                'Warning: Low stock alert for emergency medications at Riverside Medical',
                'Info: Scheduled maintenance completed successfully at Central Health'
            ];
            const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
            document.getElementById('alertMessage').textContent = randomAlert;
            document.getElementById('alertBar').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('alertBar').classList.add('hidden');
            }, 10000);
        }

        // Auto-refresh
        setInterval(updateMetrics, 5000);
        setInterval(updateCharts, 10000);
        setTimeout(showRandomAlert, 5000);
        setInterval(showRandomAlert, 60000);
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.get('/api/command/stats', (req, res) => {
    res.json({
        hospitals: 12,
        patients: 3847,
        occupancy: 78,
        revenue: 284592,
        alerts: {
            critical: 1,
            warning: 2,
            info: 3
        }
    });
});

app.get('/api/command/metrics', (req, res) => {
    res.json({
        performance: {
            patientSatisfaction: 4.5,
            averageWaitTime: 24,
            bedTurnover: 3.2,
            staffEfficiency: 89
        },
        financial: {
            dailyRevenue: 15000,
            monthlyRevenue: 450000,
            outstandingClaims: 125000,
            collectionRate: 92
        },
        operational: {
            emergencyResponseTime: 8,
            surgerySuccessRate: 98,
            medicationErrorRate: 0.1,
            infectionRate: 0.5
        }
    });
});

app.get('/api/command/hospitals', (req, res) => {
    res.json([
        { id: 'HOSP001', name: 'City General', location: 'Lagos', status: 'online', patients: 342, staff: 89, occupancy: 82, emergencyWaitTime: 15, revenue: 485000 },
        { id: 'HOSP002', name: 'Riverside Med', location: 'Abuja', status: 'online', patients: 228, staff: 67, occupancy: 75, emergencyWaitTime: 12, revenue: 325000 },
        { id: 'HOSP003', name: 'Central Health', location: 'Ibadan', status: 'warning', patients: 456, staff: 102, occupancy: 91, emergencyWaitTime: 28, revenue: 612000 },
        { id: 'HOSP004', name: 'Westside Clinic', location: 'Port Harcourt', status: 'online', patients: 156, staff: 45, occupancy: 68, emergencyWaitTime: 10, revenue: 215000 },
        { id: 'HOSP005', name: 'North Medical', location: 'Kano', status: 'online', patients: 289, staff: 78, occupancy: 77, emergencyWaitTime: 18, revenue: 398000 },
        { id: 'HOSP006', name: 'East Hospital', location: 'Enugu', status: 'critical', patients: 512, staff: 134, occupancy: 95, emergencyWaitTime: 35, revenue: 695000 }
    ]);
});

app.get('/api/command/alerts', (req, res) => {
    res.json([
        { 
            alertId: 'ALRT001',
            level: 'critical', 
            severity: 'critical',
            message: 'East Hospital: ICU at 95% capacity', 
            hospitalName: 'East Hospital',
            time: '2 mins ago',
            timestamp: new Date().toISOString()
        },
        { 
            alertId: 'ALRT002',
            level: 'warning',
            severity: 'warning', 
            message: 'Central Health: Low stock on essential medications', 
            hospitalName: 'Central Health',
            time: '15 mins ago',
            timestamp: new Date().toISOString()
        },
        { 
            alertId: 'ALRT003',
            level: 'warning',
            severity: 'warning',
            message: 'Riverside Med: Staff shortage in Emergency', 
            hospitalName: 'Riverside Med',
            time: '1 hour ago',
            timestamp: new Date().toISOString()
        },
        { 
            alertId: 'ALRT004',
            level: 'info',
            severity: 'info',
            message: 'System update scheduled for tonight 2 AM', 
            hospitalName: 'All Hospitals',
            time: '2 hours ago',
            timestamp: new Date().toISOString()
        }
    ]);
});

app.post('/api/command/alerts/:id/resolve', (req, res) => {
    res.json({ 
        success: true,
        alertId: req.params.id,
        message: 'Alert resolved successfully'
    });
});

app.get('/api/command/projects', (req, res) => {
    res.json([
        {
            project_id: 'PROJ001',
            project_name: 'ICU Expansion - Lagos',
            project_type: 'Hospital Expansion',
            hospital_id: 'HOSP001',
            status: 'in_progress',
            budget: 25000000,
            spent: 12500000,
            completion_percentage: 50,
            start_date: '2025-09-01',
            end_date: '2026-03-01'
        },
        {
            project_id: 'PROJ002',
            project_name: 'EMR System Upgrade',
            project_type: 'IT Upgrade',
            hospital_id: 'ALL',
            status: 'in_progress',
            budget: 5000000,
            spent: 1500000,
            completion_percentage: 30,
            start_date: '2025-10-01',
            end_date: '2025-12-31'
        },
        {
            project_id: 'PROJ003',
            project_name: 'Pediatric Ward Renovation',
            project_type: 'Renovation',
            hospital_id: 'HOSP002',
            status: 'planning',
            budget: 8000000,
            spent: 0,
            completion_percentage: 0,
            start_date: '2025-11-01',
            end_date: '2026-02-01'
        }
    ]);
});

app.post('/api/command/projects', (req, res) => {
    const projectId = 'PROJ' + Date.now().toString().substr(-6);
    res.json({ 
        success: true, 
        projectId: projectId,
        message: 'Project created successfully',
        project: {
            ...req.body,
            project_id: projectId,
            status: 'planning',
            spent: 0,
            completion_percentage: 0
        }
    });
});

const PORT = process.env.PORT || 5801;
app.listen(PORT, () => {
    console.log(`Command Centre Full Module running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
