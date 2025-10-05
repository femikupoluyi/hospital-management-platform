const express = require('express');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Operations Command Centre</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .metric-card {
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .alert-pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <header class="bg-gray-800 border-b border-gray-700">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-tv text-red-500 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold">Operations Command Centre</h1>
                        <p class="text-sm text-gray-400">Real-time Hospital Monitoring</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="bg-green-600 px-3 py-1 rounded text-sm">
                        <i class="fas fa-circle text-green-400 alert-pulse mr-2 text-xs"></i>
                        All Systems Operational
                    </span>
                    <a href="/" class="text-gray-400 hover:text-white">
                        <i class="fas fa-home"></i> Platform
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-6">
        <!-- Real-time Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="metric-card bg-gray-800 rounded p-4 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Patient Inflow</p>
                        <p class="text-2xl font-bold">234</p>
                        <p class="text-green-500 text-sm">↑ 12% from yesterday</p>
                    </div>
                    <i class="fas fa-user-plus text-blue-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="metric-card bg-gray-800 rounded p-4 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Bed Occupancy</p>
                        <p class="text-2xl font-bold">78%</p>
                        <p class="text-yellow-500 text-sm">105/135 beds</p>
                    </div>
                    <i class="fas fa-bed text-green-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="metric-card bg-gray-800 rounded p-4 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Staff on Duty</p>
                        <p class="text-2xl font-bold">89</p>
                        <p class="text-green-500 text-sm">Full coverage</p>
                    </div>
                    <i class="fas fa-user-md text-purple-500 text-2xl"></i>
                </div>
            </div>
            
            <div class="metric-card bg-gray-800 rounded p-4 border border-gray-700">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-400 text-sm">Today's Revenue</p>
                        <p class="text-2xl font-bold">$45.2K</p>
                        <p class="text-green-500 text-sm">↑ 8% target met</p>
                    </div>
                    <i class="fas fa-dollar-sign text-yellow-500 text-2xl"></i>
                </div>
            </div>
        </div>

        <!-- Charts and Monitoring -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Patient Flow Chart -->
            <div class="bg-gray-800 rounded p-6 border border-gray-700">
                <h3 class="text-lg font-semibold mb-4">Patient Flow (24h)</h3>
                <canvas id="patientFlowChart" height="150"></canvas>
            </div>
            
            <!-- Department Performance -->
            <div class="bg-gray-800 rounded p-6 border border-gray-700">
                <h3 class="text-lg font-semibold mb-4">Department Performance</h3>
                <canvas id="departmentChart" height="150"></canvas>
            </div>
        </div>

        <!-- Alerts and Notifications -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Active Alerts -->
            <div class="bg-gray-800 rounded p-6 border border-gray-700">
                <h3 class="text-lg font-semibold mb-4 text-red-500">Active Alerts</h3>
                <div class="space-y-3">
                    <div class="bg-red-900 bg-opacity-50 p-3 rounded border border-red-700">
                        <p class="text-sm font-semibold">Low Stock Alert</p>
                        <p class="text-xs text-gray-400">Paracetamol below reorder level</p>
                    </div>
                    <div class="bg-yellow-900 bg-opacity-50 p-3 rounded border border-yellow-700">
                        <p class="text-sm font-semibold">High ER Wait Time</p>
                        <p class="text-xs text-gray-400">Average wait: 45 minutes</p>
                    </div>
                </div>
            </div>
            
            <!-- Hospital Status -->
            <div class="bg-gray-800 rounded p-6 border border-gray-700">
                <h3 class="text-lg font-semibold mb-4">Hospital Status</h3>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm">Emergency Room</span>
                        <span class="bg-yellow-600 px-2 py-1 rounded text-xs">Busy</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm">Operating Rooms</span>
                        <span class="bg-green-600 px-2 py-1 rounded text-xs">Available</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm">ICU</span>
                        <span class="bg-red-600 px-2 py-1 rounded text-xs">Full</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm">Pharmacy</span>
                        <span class="bg-green-600 px-2 py-1 rounded text-xs">Open</span>
                    </div>
                </div>
            </div>
            
            <!-- Project Updates -->
            <div class="bg-gray-800 rounded p-6 border border-gray-700">
                <h3 class="text-lg font-semibold mb-4">Active Projects</h3>
                <div class="space-y-3">
                    <div>
                        <p class="text-sm font-semibold">New Wing Construction</p>
                        <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: 65%"></div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">65% Complete</p>
                    </div>
                    <div>
                        <p class="text-sm font-semibold">IT System Upgrade</p>
                        <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div class="bg-green-600 h-2 rounded-full" style="width: 90%"></div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">90% Complete</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Patient Flow Chart
        const ctx1 = document.getElementById('patientFlowChart').getContext('2d');
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                datasets: [{
                    label: 'Admissions',
                    data: [12, 19, 35, 45, 38, 25, 18],
                    borderColor: 'rgb(34, 197, 94)',
                    tension: 0.3
                }, {
                    label: 'Discharges',
                    data: [8, 12, 28, 32, 30, 22, 15],
                    borderColor: 'rgb(239, 68, 68)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

        // Department Performance Chart
        const ctx2 = document.getElementById('departmentChart').getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Emergency', 'Surgery', 'ICU', 'Pediatrics', 'Maternity'],
                datasets: [{
                    label: 'KPI Score',
                    data: [85, 92, 78, 88, 95],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.5)',
                        'rgba(34, 197, 94, 0.5)',
                        'rgba(234, 179, 8, 0.5)',
                        'rgba(59, 130, 246, 0.5)',
                        'rgba(168, 85, 247, 0.5)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });

        // Update metrics every 5 seconds (simulated)
        setInterval(() => {
            const metrics = document.querySelectorAll('.metric-card p.text-2xl');
            metrics.forEach(metric => {
                const currentValue = parseInt(metric.textContent);
                const change = Math.floor(Math.random() * 10) - 5;
                metric.textContent = currentValue + change;
            });
        }, 5000);
    </script>
</body>
</html>
    `);
});

const PORT = 5801;
app.listen(PORT, () => {
    console.log(`Command Centre UI running on port ${PORT}`);
});
