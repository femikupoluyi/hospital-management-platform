const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

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

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Proxy all /api/hms/* requests to the enhanced backend
app.all('/api/hms/*', async (req, res) => {
    try {
        const url = `http://localhost:3001${req.originalUrl}`;
        const method = req.method.toLowerCase();
        
        console.log(`Proxying ${method.toUpperCase()} ${req.originalUrl} to ${url}`);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            }
        };
        
        let response;
        if (method === 'get') {
            response = await axios.get(url, config);
        } else if (method === 'post') {
            response = await axios.post(url, req.body, config);
        } else if (method === 'put') {
            response = await axios.put(url, req.body, config);
        } else if (method === 'delete') {
            response = await axios.delete(url, config);
        }
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Failed to process request' });
        }
    }
});

// Main HMS interface with working functionality
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
            background-color: rgba(0,0,0,0.4);
        }
        .modal.active {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .data-table th,
        .data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-hospital text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-2xl font-bold">Hospital Management System</h1>
                        <p class="text-sm opacity-90">Complete Healthcare Operations</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded transition">
                        <i class="fas fa-home mr-2"></i> Main Platform
                    </a>
                    <span id="status-indicator" class="bg-green-500 px-3 py-1 rounded-full text-sm">
                        <i class="fas fa-circle text-green-300 mr-1"></i> Online
                    </span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Statistics -->
        <div id="stats-container" class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-users text-blue-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Total Patients</p>
                <p id="stat-patients" class="text-2xl font-bold">-</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-calendar-check text-green-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Today's Appointments</p>
                <p id="stat-appointments" class="text-2xl font-bold">-</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-file-invoice-dollar text-yellow-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Pending Bills</p>
                <p id="stat-bills" class="text-2xl font-bold">-</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Low Stock Items</p>
                <p id="stat-stock" class="text-2xl font-bold">-</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-bed text-purple-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Occupancy Rate</p>
                <p id="stat-occupancy" class="text-2xl font-bold">-</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow text-center">
                <i class="fas fa-procedures text-indigo-500 text-2xl mb-2"></i>
                <p class="text-gray-600 text-sm">Available Beds</p>
                <p id="stat-beds" class="text-2xl font-bold">-</p>
            </div>
        </div>

        <!-- Feature Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- EMR Module -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('emr')">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-notes-medical text-blue-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Electronic Medical Records</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Complete patient medical history, diagnoses, prescriptions, and lab results management.</p>
                <div class="space-y-2">
                    <button class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i> New Record
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-list mr-2"></i> View Records
                    </button>
                </div>
            </div>

            <!-- Billing Module -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('billing')">
                <div class="flex items-center mb-4">
                    <div class="bg-green-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-money-check-alt text-green-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Billing & Revenue</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Invoice generation, payment processing, insurance claims, and revenue tracking.</p>
                <div class="space-y-2">
                    <button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                        <i class="fas fa-file-invoice mr-2"></i> Create Invoice
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-history mr-2"></i> View Invoices
                    </button>
                </div>
            </div>

            <!-- Inventory Module -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('inventory')">
                <div class="flex items-center mb-4">
                    <div class="bg-yellow-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-boxes text-yellow-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Inventory Management</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Track medications, medical supplies, equipment with automatic reorder alerts.</p>
                <div class="space-y-2">
                    <button class="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition">
                        <i class="fas fa-plus-circle mr-2"></i> Stock Entry
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-exclamation mr-2"></i> Low Stock Alert
                    </button>
                </div>
            </div>

            <!-- Staff Management -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('staff')">
                <div class="flex items-center mb-4">
                    <div class="bg-purple-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-user-md text-purple-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Staff Management</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Staff scheduling, attendance tracking, payroll processing, and performance metrics.</p>
                <div class="space-y-2">
                    <button class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">
                        <i class="fas fa-calendar-plus mr-2"></i> Add Schedule
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-clipboard-list mr-2"></i> View Roster
                    </button>
                </div>
            </div>

            <!-- Bed Management -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('beds')">
                <div class="flex items-center mb-4">
                    <div class="bg-indigo-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-bed text-indigo-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Bed Management</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time bed availability, admissions, discharges, and ward occupancy tracking.</p>
                <div class="space-y-2">
                    <button class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                        <i class="fas fa-user-plus mr-2"></i> New Admission
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-th mr-2"></i> Available Beds
                    </button>
                </div>
            </div>

            <!-- Analytics Dashboard -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openModule('analytics')">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-chart-line text-red-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Analytics Dashboard</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time metrics, occupancy trends, revenue analytics, and performance KPIs.</p>
                <div class="space-y-2">
                    <button class="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition">
                        <i class="fas fa-tachometer-alt mr-2"></i> View Dashboard
                    </button>
                    <button class="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition">
                        <i class="fas fa-download mr-2"></i> Export Report
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Modals -->
    <div id="modal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-4">
                <h2 id="modal-title" class="text-2xl font-bold"></h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div id="modal-body" class="mt-4"></div>
        </div>
    </div>

    <script>
        // Load statistics on page load
        async function loadStats() {
            try {
                const response = await fetch('/api/hms/stats');
                const stats = await response.json();
                
                document.getElementById('stat-patients').textContent = stats.totalPatients || 0;
                document.getElementById('stat-appointments').textContent = stats.todayAppointments || 0;
                document.getElementById('stat-bills').textContent = stats.pendingBills || 0;
                document.getElementById('stat-stock').textContent = stats.lowStockItems || 0;
                document.getElementById('stat-occupancy').textContent = (stats.occupancyRate || 0) + '%';
                document.getElementById('stat-beds').textContent = stats.availableBeds || 0;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        // Module handlers
        function openModule(module) {
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            modal.classList.add('active');
            
            switch(module) {
                case 'emr':
                    modalTitle.textContent = 'Electronic Medical Records';
                    loadEMRModule();
                    break;
                case 'billing':
                    modalTitle.textContent = 'Billing & Revenue Management';
                    loadBillingModule();
                    break;
                case 'inventory':
                    modalTitle.textContent = 'Inventory Management';
                    loadInventoryModule();
                    break;
                case 'staff':
                    modalTitle.textContent = 'Staff Management';
                    loadStaffModule();
                    break;
                case 'beds':
                    modalTitle.textContent = 'Bed Management';
                    loadBedModule();
                    break;
                case 'analytics':
                    modalTitle.textContent = 'Analytics Dashboard';
                    loadAnalyticsModule();
                    break;
            }
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }

        // EMR Module
        async function loadEMRModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading patient records...';
            
            try {
                const response = await fetch('/api/hms/patients');
                const patients = await response.json();
                
                let html = \`
                    <div class="mb-4">
                        <button onclick="showAddPatientForm()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i> Add New Patient
                        </button>
                    </div>
                    <div id="patient-form" style="display:none;" class="bg-gray-50 p-4 rounded mb-4">
                        <h3 class="font-bold mb-3">New Patient Registration</h3>
                        <form onsubmit="addPatient(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" id="firstName" placeholder="First Name" required class="px-3 py-2 border rounded">
                                <input type="text" id="lastName" placeholder="Last Name" required class="px-3 py-2 border rounded">
                                <input type="date" id="dob" placeholder="Date of Birth" required class="px-3 py-2 border rounded">
                                <select id="gender" required class="px-3 py-2 border rounded">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <input type="tel" id="phone" placeholder="Phone Number" required class="px-3 py-2 border rounded">
                                <input type="email" id="email" placeholder="Email" class="px-3 py-2 border rounded">
                                <input type="text" id="address" placeholder="Address" class="px-3 py-2 border rounded col-span-2">
                                <textarea id="medicalHistory" placeholder="Medical History" class="px-3 py-2 border rounded col-span-2" rows="3"></textarea>
                            </div>
                            <div class="mt-4">
                                <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2">Save Patient</button>
                                <button type="button" onclick="hideAddPatientForm()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (patients && patients.length > 0) {
                    patients.forEach(patient => {
                        html += \`
                            <tr>
                                <td>\${patient.id}</td>
                                <td>\${patient.firstName} \${patient.lastName}</td>
                                <td>\${patient.gender}</td>
                                <td>\${patient.phone}</td>
                                <td>
                                    <button onclick="viewPatient('\${patient.id}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">View</button>
                                    <button onclick="deletePatient('\${patient.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 ml-1">Delete</button>
                                </td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="5" class="text-center">No patients found</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load patient records</div>';
            }
        }

        // Billing Module
        async function loadBillingModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading billing information...';
            
            try {
                const response = await fetch('/api/hms/billing');
                const bills = await response.json();
                
                let html = \`
                    <div class="mb-4">
                        <button onclick="showAddBillForm()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i> Create New Invoice
                        </button>
                    </div>
                    <div id="bill-form" style="display:none;" class="bg-gray-50 p-4 rounded mb-4">
                        <h3 class="font-bold mb-3">New Invoice</h3>
                        <form onsubmit="addBill(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" id="billPatientId" placeholder="Patient ID" required class="px-3 py-2 border rounded">
                                <input type="text" id="billPatientName" placeholder="Patient Name" required class="px-3 py-2 border rounded">
                                <input type="number" id="billAmount" placeholder="Amount" step="0.01" required class="px-3 py-2 border rounded">
                                <select id="billType" required class="px-3 py-2 border rounded">
                                    <option value="">Payment Type</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Credit">Credit</option>
                                </select>
                                <textarea id="billDescription" placeholder="Description" class="px-3 py-2 border rounded col-span-2" rows="2"></textarea>
                            </div>
                            <div class="mt-4">
                                <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2">Create Invoice</button>
                                <button type="button" onclick="hideAddBillForm()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Patient</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (bills && bills.length > 0) {
                    bills.forEach(bill => {
                        html += \`
                            <tr>
                                <td>\${bill.id}</td>
                                <td>\${bill.patientName}</td>
                                <td>$\${bill.amount}</td>
                                <td><span class="px-2 py-1 rounded text-xs \${bill.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">\${bill.status}</span></td>
                                <td>\${new Date(bill.date).toLocaleDateString()}</td>
                                <td>
                                    <button onclick="viewBill('\${bill.id}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">View</button>
                                    \${bill.status === 'Pending' ? \`<button onclick="markPaid('\${bill.id}')" class="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 ml-1">Mark Paid</button>\` : ''}
                                </td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="6" class="text-center">No invoices found</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load billing information</div>';
            }
        }

        // Inventory Module
        async function loadInventoryModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading inventory...';
            
            try {
                const response = await fetch('/api/hms/inventory');
                const inventory = await response.json();
                
                let html = \`
                    <div class="mb-4">
                        <button onclick="showAddItemForm()" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                            <i class="fas fa-plus mr-2"></i> Add New Item
                        </button>
                    </div>
                    <div id="item-form" style="display:none;" class="bg-gray-50 p-4 rounded mb-4">
                        <h3 class="font-bold mb-3">New Inventory Item</h3>
                        <form onsubmit="addItem(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" id="itemName" placeholder="Item Name" required class="px-3 py-2 border rounded">
                                <select id="itemCategory" required class="px-3 py-2 border rounded">
                                    <option value="">Select Category</option>
                                    <option value="Medicine">Medicine</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Consumable">Consumable</option>
                                </select>
                                <input type="number" id="itemQuantity" placeholder="Quantity" required class="px-3 py-2 border rounded">
                                <input type="number" id="itemMinStock" placeholder="Minimum Stock" required class="px-3 py-2 border rounded">
                                <input type="text" id="itemUnit" placeholder="Unit (e.g., boxes, bottles)" class="px-3 py-2 border rounded">
                                <input type="date" id="itemExpiry" placeholder="Expiry Date" class="px-3 py-2 border rounded">
                            </div>
                            <div class="mt-4">
                                <button type="submit" class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 mr-2">Add Item</button>
                                <button type="button" onclick="hideAddItemForm()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (inventory && inventory.length > 0) {
                    inventory.forEach(item => {
                        const isLowStock = item.quantity <= item.minStock;
                        html += \`
                            <tr>
                                <td>\${item.id}</td>
                                <td>\${item.name}</td>
                                <td>\${item.category}</td>
                                <td>\${item.quantity} \${item.unit || ''}</td>
                                <td><span class="px-2 py-1 rounded text-xs \${isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">\${isLowStock ? 'Low Stock' : 'In Stock'}</span></td>
                                <td>
                                    <button onclick="updateStock('\${item.id}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">Update</button>
                                    <button onclick="deleteItem('\${item.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 ml-1">Delete</button>
                                </td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="6" class="text-center">No items in inventory</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load inventory</div>';
            }
        }

        // Staff Module
        async function loadStaffModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading staff information...';
            
            try {
                const response = await fetch('/api/hms/staff');
                const staff = await response.json();
                
                let html = \`
                    <div class="mb-4">
                        <button onclick="showAddStaffForm()" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            <i class="fas fa-plus mr-2"></i> Add Staff Member
                        </button>
                    </div>
                    <div id="staff-form" style="display:none;" class="bg-gray-50 p-4 rounded mb-4">
                        <h3 class="font-bold mb-3">New Staff Member</h3>
                        <form onsubmit="addStaff(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" id="staffName" placeholder="Full Name" required class="px-3 py-2 border rounded">
                                <select id="staffRole" required class="px-3 py-2 border rounded">
                                    <option value="">Select Role</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Nurse">Nurse</option>
                                    <option value="Technician">Technician</option>
                                    <option value="Admin">Admin</option>
                                </select>
                                <input type="text" id="staffDepartment" placeholder="Department" required class="px-3 py-2 border rounded">
                                <select id="staffShift" required class="px-3 py-2 border rounded">
                                    <option value="">Select Shift</option>
                                    <option value="Morning">Morning (6AM-2PM)</option>
                                    <option value="Afternoon">Afternoon (2PM-10PM)</option>
                                    <option value="Night">Night (10PM-6AM)</option>
                                </select>
                                <input type="tel" id="staffPhone" placeholder="Phone Number" required class="px-3 py-2 border rounded">
                                <input type="email" id="staffEmail" placeholder="Email" required class="px-3 py-2 border rounded">
                            </div>
                            <div class="mt-4">
                                <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-2">Add Staff</button>
                                <button type="button" onclick="hideAddStaffForm()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Staff ID</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Shift</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (staff && staff.length > 0) {
                    staff.forEach(member => {
                        html += \`
                            <tr>
                                <td>\${member.id}</td>
                                <td>\${member.name}</td>
                                <td>\${member.role}</td>
                                <td>\${member.department}</td>
                                <td>\${member.shift}</td>
                                <td><span class="px-2 py-1 rounded text-xs \${member.status === 'On Duty' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">\${member.status}</span></td>
                                <td>
                                    <button onclick="viewStaff('\${member.id}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">View</button>
                                    <button onclick="updateShift('\${member.id}')" class="bg-purple-500 text-white px-2 py-1 rounded text-sm hover:bg-purple-600 ml-1">Update</button>
                                </td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="7" class="text-center">No staff members found</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load staff information</div>';
            }
        }

        // Bed Management Module
        async function loadBedModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading bed information...';
            
            try {
                const response = await fetch('/api/hms/beds');
                const beds = await response.json();
                
                let html = \`
                    <div class="mb-4">
                        <button onclick="showAdmissionForm()" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                            <i class="fas fa-user-plus mr-2"></i> New Admission
                        </button>
                    </div>
                    <div id="admission-form" style="display:none;" class="bg-gray-50 p-4 rounded mb-4">
                        <h3 class="font-bold mb-3">New Patient Admission</h3>
                        <form onsubmit="admitPatient(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <input type="text" id="admitPatientId" placeholder="Patient ID" required class="px-3 py-2 border rounded">
                                <input type="text" id="admitPatientName" placeholder="Patient Name" required class="px-3 py-2 border rounded">
                                <select id="admitWard" required class="px-3 py-2 border rounded">
                                    <option value="">Select Ward</option>
                                    <option value="General">General Ward</option>
                                    <option value="ICU">ICU</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Maternity">Maternity</option>
                                </select>
                                <input type="text" id="admitBedNumber" placeholder="Bed Number" required class="px-3 py-2 border rounded">
                                <textarea id="admitReason" placeholder="Reason for Admission" class="px-3 py-2 border rounded col-span-2" rows="2"></textarea>
                            </div>
                            <div class="mt-4">
                                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mr-2">Admit Patient</button>
                                <button type="button" onclick="hideAdmissionForm()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
                            </div>
                        </form>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mb-6">
                        <div class="bg-green-50 p-3 rounded text-center">
                            <p class="text-green-800 font-bold text-2xl">\${beds.available || 0}</p>
                            <p class="text-sm text-gray-600">Available</p>
                        </div>
                        <div class="bg-red-50 p-3 rounded text-center">
                            <p class="text-red-800 font-bold text-2xl">\${beds.occupied || 0}</p>
                            <p class="text-sm text-gray-600">Occupied</p>
                        </div>
                        <div class="bg-yellow-50 p-3 rounded text-center">
                            <p class="text-yellow-800 font-bold text-2xl">\${beds.maintenance || 0}</p>
                            <p class="text-sm text-gray-600">Maintenance</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded text-center">
                            <p class="text-blue-800 font-bold text-2xl">\${beds.total || 0}</p>
                            <p class="text-sm text-gray-600">Total Beds</p>
                        </div>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Bed ID</th>
                                <th>Ward</th>
                                <th>Patient</th>
                                <th>Status</th>
                                <th>Admission Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (beds.beds && beds.beds.length > 0) {
                    beds.beds.forEach(bed => {
                        const statusColor = bed.status === 'Available' ? 'bg-green-100 text-green-800' : 
                                          bed.status === 'Occupied' ? 'bg-red-100 text-red-800' : 
                                          'bg-yellow-100 text-yellow-800';
                        html += \`
                            <tr>
                                <td>\${bed.id}</td>
                                <td>\${bed.ward}</td>
                                <td>\${bed.patientName || '-'}</td>
                                <td><span class="px-2 py-1 rounded text-xs \${statusColor}">\${bed.status}</span></td>
                                <td>\${bed.admissionDate ? new Date(bed.admissionDate).toLocaleDateString() : '-'}</td>
                                <td>
                                    \${bed.status === 'Occupied' ? 
                                        \`<button onclick="dischargPatient('\${bed.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">Discharge</button>\` :
                                        \`<button onclick="assignBed('\${bed.id}')" class="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600">Assign</button>\`
                                    }
                                </td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="6" class="text-center">No bed information available</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load bed information</div>';
            }
        }

        // Analytics Module
        async function loadAnalyticsModule() {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = '<div class="loading"></div> Loading analytics...';
            
            try {
                const response = await fetch('/api/hms/analytics');
                const analytics = await response.json();
                
                let html = \`
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded">
                            <h3 class="font-semibold text-blue-800 mb-2">Revenue This Month</h3>
                            <p class="text-3xl font-bold text-blue-900">$\${analytics.monthlyRevenue || '0'}</p>
                            <p class="text-sm text-gray-600 mt-1">\${analytics.revenueGrowth || '0'}% from last month</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded">
                            <h3 class="font-semibold text-green-800 mb-2">Patients Served</h3>
                            <p class="text-3xl font-bold text-green-900">\${analytics.patientsServed || '0'}</p>
                            <p class="text-sm text-gray-600 mt-1">This month</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded">
                            <h3 class="font-semibold text-purple-800 mb-2">Average Wait Time</h3>
                            <p class="text-3xl font-bold text-purple-900">\${analytics.avgWaitTime || '0'} min</p>
                            <p class="text-sm text-gray-600 mt-1">Emergency department</p>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded">
                            <h3 class="font-semibold text-yellow-800 mb-2">Staff Efficiency</h3>
                            <p class="text-3xl font-bold text-yellow-900">\${analytics.staffEfficiency || '0'}%</p>
                            <p class="text-sm text-gray-600 mt-1">Overall performance</p>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <button onclick="exportReport()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            <i class="fas fa-download mr-2"></i> Export Full Report
                        </button>
                    </div>
                    
                    <h3 class="font-semibold mb-3">Department Performance</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Patients</th>
                                <th>Revenue</th>
                                <th>Satisfaction</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                if (analytics.departments && analytics.departments.length > 0) {
                    analytics.departments.forEach(dept => {
                        html += \`
                            <tr>
                                <td>\${dept.name}</td>
                                <td>\${dept.patients}</td>
                                <td>$\${dept.revenue}</td>
                                <td>\${dept.satisfaction}%</td>
                            </tr>
                        \`;
                    });
                } else {
                    html += '<tr><td colspan="4" class="text-center">No analytics data available</td></tr>';
                }
                
                html += '</tbody></table>';
                modalBody.innerHTML = html;
            } catch (error) {
                modalBody.innerHTML = '<div class="text-red-600">Failed to load analytics</div>';
            }
        }

        // Helper functions for forms
        function showAddPatientForm() {
            document.getElementById('patient-form').style.display = 'block';
        }
        
        function hideAddPatientForm() {
            document.getElementById('patient-form').style.display = 'none';
        }
        
        function showAddBillForm() {
            document.getElementById('bill-form').style.display = 'block';
        }
        
        function hideAddBillForm() {
            document.getElementById('bill-form').style.display = 'none';
        }
        
        function showAddItemForm() {
            document.getElementById('item-form').style.display = 'block';
        }
        
        function hideAddItemForm() {
            document.getElementById('item-form').style.display = 'none';
        }
        
        function showAddStaffForm() {
            document.getElementById('staff-form').style.display = 'block';
        }
        
        function hideAddStaffForm() {
            document.getElementById('staff-form').style.display = 'none';
        }
        
        function showAdmissionForm() {
            document.getElementById('admission-form').style.display = 'block';
        }
        
        function hideAdmissionForm() {
            document.getElementById('admission-form').style.display = 'none';
        }

        // API interaction functions
        async function addPatient(event) {
            event.preventDefault();
            const data = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                dob: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                medicalHistory: document.getElementById('medicalHistory').value
            };
            
            try {
                const response = await fetch('/api/hms/patients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Patient added successfully!');
                    loadEMRModule();
                } else {
                    alert('Failed to add patient');
                }
            } catch (error) {
                alert('Error adding patient');
            }
        }

        async function addBill(event) {
            event.preventDefault();
            const data = {
                patientId: document.getElementById('billPatientId').value,
                patientName: document.getElementById('billPatientName').value,
                amount: document.getElementById('billAmount').value,
                type: document.getElementById('billType').value,
                description: document.getElementById('billDescription').value
            };
            
            try {
                const response = await fetch('/api/hms/billing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Invoice created successfully!');
                    loadBillingModule();
                } else {
                    alert('Failed to create invoice');
                }
            } catch (error) {
                alert('Error creating invoice');
            }
        }

        async function addItem(event) {
            event.preventDefault();
            const data = {
                name: document.getElementById('itemName').value,
                category: document.getElementById('itemCategory').value,
                quantity: document.getElementById('itemQuantity').value,
                minStock: document.getElementById('itemMinStock').value,
                unit: document.getElementById('itemUnit').value,
                expiryDate: document.getElementById('itemExpiry').value
            };
            
            try {
                const response = await fetch('/api/hms/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Item added successfully!');
                    loadInventoryModule();
                } else {
                    alert('Failed to add item');
                }
            } catch (error) {
                alert('Error adding item');
            }
        }

        async function addStaff(event) {
            event.preventDefault();
            const data = {
                name: document.getElementById('staffName').value,
                role: document.getElementById('staffRole').value,
                department: document.getElementById('staffDepartment').value,
                shift: document.getElementById('staffShift').value,
                phone: document.getElementById('staffPhone').value,
                email: document.getElementById('staffEmail').value
            };
            
            try {
                const response = await fetch('/api/hms/staff', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Staff member added successfully!');
                    loadStaffModule();
                } else {
                    alert('Failed to add staff member');
                }
            } catch (error) {
                alert('Error adding staff member');
            }
        }

        async function admitPatient(event) {
            event.preventDefault();
            const data = {
                patientId: document.getElementById('admitPatientId').value,
                patientName: document.getElementById('admitPatientName').value,
                ward: document.getElementById('admitWard').value,
                bedNumber: document.getElementById('admitBedNumber').value,
                reason: document.getElementById('admitReason').value
            };
            
            try {
                const response = await fetch('/api/hms/admissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Patient admitted successfully!');
                    loadBedModule();
                } else {
                    alert('Failed to admit patient');
                }
            } catch (error) {
                alert('Error admitting patient');
            }
        }

        async function deletePatient(id) {
            if (!confirm('Are you sure you want to delete this patient record?')) return;
            
            try {
                const response = await fetch(\`/api/hms/patients/\${id}\`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    alert('Patient deleted successfully!');
                    loadEMRModule();
                } else {
                    alert('Failed to delete patient');
                }
            } catch (error) {
                alert('Error deleting patient');
            }
        }

        async function markPaid(billId) {
            try {
                const response = await fetch(\`/api/hms/billing/\${billId}/pay\`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    alert('Invoice marked as paid!');
                    loadBillingModule();
                } else {
                    alert('Failed to update invoice');
                }
            } catch (error) {
                alert('Error updating invoice');
            }
        }

        async function dischargPatient(bedId) {
            if (!confirm('Are you sure you want to discharge this patient?')) return;
            
            try {
                const response = await fetch(\`/api/hms/beds/\${bedId}/discharge\`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    alert('Patient discharged successfully!');
                    loadBedModule();
                } else {
                    alert('Failed to discharge patient');
                }
            } catch (error) {
                alert('Error discharging patient');
            }
        }

        function exportReport() {
            alert('Generating report... This would download a PDF report in production.');
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadStats();
            // Refresh stats every 30 seconds
            setInterval(loadStats, 30000);
        });
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 5601;
app.listen(PORT, () => {
    console.log(`HMS Module (Fixed) running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
