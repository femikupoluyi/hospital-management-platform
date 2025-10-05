const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

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

// HMS Frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hospital Management System - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .feature-card {
            transition: all 0.3s;
            cursor: pointer;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            display: none;
        }
        .notification.show {
            display: block;
            animation: slideIn 0.3s;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-hospital text-blue-600 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">Hospital Management System</h1>
                        <p class="text-sm text-gray-600">Core Operations Module</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onclick="showNotification('System synchronized', 'success')">
                        <i class="fas fa-sync mr-2"></i>Sync
                    </button>
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-home"></i> Back to Platform
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-users text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-600 text-sm">Total Patients</p>
                        <p class="text-2xl font-bold">1,234</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-bed text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-600 text-sm">Available Beds</p>
                        <p class="text-2xl font-bold">45/150</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-calendar-check text-purple-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-600 text-sm">Today's Appointments</p>
                        <p class="text-2xl font-bold">28</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-yellow-100 p-3 rounded-lg">
                        <i class="fas fa-dollar-sign text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-600 text-sm">Today's Revenue</p>
                        <p class="text-2xl font-bold">$12,450</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feature Modules -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- EMR Module -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openEMR()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-file-medical text-blue-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Electronic Medical Records</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Complete patient medical history, diagnoses, prescriptions, and lab results.</p>
                <div class="flex space-x-2">
                    <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        New Record
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        View Records
                    </button>
                </div>
            </div>

            <!-- Billing Module -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openBilling()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-money-check-alt text-green-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Billing & Revenue</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Invoice generation, payment processing, insurance claims, and revenue tracking.</p>
                <div class="flex space-x-2">
                    <button class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Create Invoice
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        View Invoices
                    </button>
                </div>
            </div>

            <!-- Inventory Module -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openInventory()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-boxes text-purple-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Inventory Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Track medications, medical supplies, equipment with automatic reorder alerts.</p>
                <div class="flex space-x-2">
                    <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                        Stock Entry
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        Low Stock Alert
                    </button>
                </div>
            </div>

            <!-- Staff Management -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openStaffManagement()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-user-md text-indigo-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Staff Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Staff scheduling, attendance tracking, payroll processing, and performance metrics.</p>
                <div class="flex space-x-2">
                    <button class="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                        Add Schedule
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        View Roster
                    </button>
                </div>
            </div>

            <!-- Bed Management -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openBedManagement()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-procedures text-red-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Bed Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time bed availability, admissions, discharges, and ward occupancy tracking.</p>
                <div class="flex space-x-2">
                    <button class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                        New Admission
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        Available Beds
                    </button>
                </div>
            </div>

            <!-- Analytics Dashboard -->
            <div class="feature-card bg-white rounded-lg shadow p-6" onclick="openAnalytics()">
                <div class="flex items-center mb-4">
                    <i class="fas fa-chart-line text-yellow-600 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">Analytics Dashboard</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time metrics, occupancy trends, revenue analytics, and performance KPIs.</p>
                <div class="flex space-x-2">
                    <button class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
                        View Dashboard
                    </button>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                        Export Report
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal for EMR -->
    <div id="emrModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-4">Electronic Medical Records</h2>
            <form id="emrForm">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
                        <input type="text" class="w-full p-2 border rounded" placeholder="Enter patient name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input type="date" class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                        <input type="text" class="w-full p-2 border rounded" placeholder="Enter diagnosis">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                        <select class="w-full p-2 border rounded">
                            <option>Dr. Smith</option>
                            <option>Dr. Johnson</option>
                            <option>Dr. Williams</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Treatment Notes</label>
                    <textarea class="w-full p-2 border rounded" rows="4" placeholder="Enter treatment details"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('emrModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Record</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Notification -->
    <div id="notification" class="notification">
        <div class="bg-white rounded-lg shadow-lg p-4 flex items-center">
            <i id="notificationIcon" class="fas fa-check-circle text-green-600 mr-3"></i>
            <span id="notificationText">Operation successful</span>
        </div>
    </div>

    <script>
        // Modal functions
        function openEMR() {
            document.getElementById('emrModal').classList.add('active');
        }
        
        function openBilling() {
            showNotification('Billing module loading...', 'info');
            setTimeout(() => {
                showNotification('Billing module ready', 'success');
            }, 1000);
        }
        
        function openInventory() {
            showNotification('Inventory module loading...', 'info');
            setTimeout(() => {
                showNotification('Inventory module ready', 'success');
            }, 1000);
        }
        
        function openStaffManagement() {
            showNotification('Staff management loading...', 'info');
            setTimeout(() => {
                showNotification('Staff management ready', 'success');
            }, 1000);
        }
        
        function openBedManagement() {
            showNotification('Bed management loading...', 'info');
            setTimeout(() => {
                showNotification('Bed management ready', 'success');
            }, 1000);
        }
        
        function openAnalytics() {
            showNotification('Analytics dashboard loading...', 'info');
            setTimeout(() => {
                window.location.href = '/analytics';
            }, 1000);
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
        
        function showNotification(message, type) {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notificationIcon');
            const text = document.getElementById('notificationText');
            
            text.textContent = message;
            
            // Set icon based on type
            if (type === 'success') {
                icon.className = 'fas fa-check-circle text-green-600 mr-3';
            } else if (type === 'error') {
                icon.className = 'fas fa-exclamation-circle text-red-600 mr-3';
            } else if (type === 'info') {
                icon.className = 'fas fa-info-circle text-blue-600 mr-3';
            }
            
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Form submission
        document.getElementById('emrForm').addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Medical record saved successfully', 'success');
            closeModal('emrModal');
        });
        
        // Initialize
        console.log('HMS Frontend initialized');
    </script>
</body>
</html>
    `);
});

const PORT = 5601;
app.listen(PORT, () => {
    console.log(`HMS Frontend running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
