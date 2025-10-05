const express = require('express');
const axios = require('axios').default;
const cors = require('cors');

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

// Proxy HMS API requests to enhanced backend
app.use('/api/hms', async (req, res, next) => {
    if (!req.originalUrl.startsWith('/api/hms/')) {
        return next();
    }
    try {
        const url = `http://localhost:3001${req.originalUrl}`;
        const method = req.method.toLowerCase();
        
        console.log(`Proxying ${method.toUpperCase()} ${req.originalUrl} to ${url}`);
        
        let response;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            }
        };
        
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
            res.status(500).json({ error: 'Backend service unavailable' });
        }
    }
});

// Main HMS page
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
            align-items: center;
            justify-content: center;
        }
        .loading {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
        }
        .loading.active {
            display: block;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
            align-items: center;
            z-index: 3000;
        }
        .notification.show {
            display: flex;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Loading Spinner -->
    <div id="loading" class="loading">
        <div class="bg-white rounded-lg p-4 shadow-lg">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    </div>

    <!-- Notification -->
    <div id="notification" class="notification">
        <i id="notificationIcon" class="fas fa-check-circle text-green-500 mr-3"></i>
        <span id="notificationText">Operation successful</span>
    </div>

    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold">🏥 Hospital Management System</h1>
                    <p class="text-blue-100">Complete Healthcare Operations Management</p>
                </div>
                <a href="/" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
                    ← Back to Platform
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Total Patients</div>
                <div class="text-2xl font-bold text-blue-600" id="statPatients">-</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Appointments</div>
                <div class="text-2xl font-bold text-green-600" id="statAppointments">-</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Pending Bills</div>
                <div class="text-2xl font-bold text-yellow-600" id="statBills">-</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Low Stock</div>
                <div class="text-2xl font-bold text-red-600" id="statStock">-</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Occupancy</div>
                <div class="text-2xl font-bold text-purple-600" id="statOccupancy">-%</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
                <div class="text-gray-500 text-sm">Available Beds</div>
                <div class="text-2xl font-bold text-indigo-600" id="statBeds">-</div>
            </div>
        </div>

        <!-- Feature Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Electronic Medical Records -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-file-medical text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Electronic Medical Records</h3>
                </div>
                <p class="text-gray-600 mb-4">Complete patient medical history, diagnoses, prescriptions, and lab results management.</p>
                <div class="space-y-2">
                    <button onclick="openModal('newRecordModal')" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>New Record
                    </button>
                    <button onclick="viewRecords()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-list mr-2"></i>View Records
                    </button>
                </div>
            </div>

            <!-- Billing & Revenue -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-dollar-sign text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Billing & Revenue</h3>
                </div>
                <p class="text-gray-600 mb-4">Invoice generation, payment processing, insurance claims, and revenue tracking.</p>
                <div class="space-y-2">
                    <button onclick="openModal('invoiceModal')" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                        <i class="fas fa-file-invoice mr-2"></i>Create Invoice
                    </button>
                    <button onclick="viewInvoices()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-list mr-2"></i>View Invoices
                    </button>
                </div>
            </div>

            <!-- Inventory Management -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-yellow-100 p-3 rounded-lg">
                        <i class="fas fa-boxes text-yellow-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Inventory Management</h3>
                </div>
                <p class="text-gray-600 mb-4">Track medications, medical supplies, equipment with automatic reorder alerts.</p>
                <div class="space-y-2">
                    <button onclick="openModal('stockEntryModal')" class="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700">
                        <i class="fas fa-plus-circle mr-2"></i>Stock Entry
                    </button>
                    <button onclick="viewInventory()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Low Stock Alert
                    </button>
                </div>
            </div>

            <!-- Staff Management -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-user-md text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Staff Management</h3>
                </div>
                <p class="text-gray-600 mb-4">Staff scheduling, attendance tracking, payroll processing, and performance metrics.</p>
                <div class="space-y-2">
                    <button onclick="openModal('scheduleModal')" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                        <i class="fas fa-calendar-plus mr-2"></i>Add Schedule
                    </button>
                    <button onclick="viewSchedule()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-calendar mr-2"></i>View Roster
                    </button>
                </div>
            </div>

            <!-- Bed Management -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-3 rounded-lg">
                        <i class="fas fa-bed text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Bed Management</h3>
                </div>
                <p class="text-gray-600 mb-4">Real-time bed availability, admissions, discharges, and ward occupancy tracking.</p>
                <div class="space-y-2">
                    <button onclick="openModal('admissionModal')" class="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                        <i class="fas fa-user-plus mr-2"></i>New Admission
                    </button>
                    <button onclick="viewBeds()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-th mr-2"></i>Available Beds
                    </button>
                </div>
            </div>

            <!-- Analytics Dashboard -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-indigo-100 p-3 rounded-lg">
                        <i class="fas fa-chart-line text-indigo-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Analytics Dashboard</h3>
                </div>
                <p class="text-gray-600 mb-4">Real-time metrics, occupancy trends, revenue analytics, and performance KPIs.</p>
                <div class="space-y-2">
                    <button onclick="viewDashboard()" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        <i class="fas fa-chart-bar mr-2"></i>View Dashboard
                    </button>
                    <button onclick="exportReport()" class="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                        <i class="fas fa-download mr-2"></i>Export Report
                    </button>
                </div>
            </div>

        </div>
    </main>

    <!-- Modals -->
    
    <!-- New Patient Record Modal -->
    <div id="newRecordModal" class="modal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h2 class="text-xl font-bold mb-4">New Patient Record</h2>
            <form id="newRecordForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="firstName" placeholder="First Name" class="border rounded px-3 py-2 w-full" required>
                    <input type="text" id="lastName" placeholder="Last Name" class="border rounded px-3 py-2 w-full" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <input type="date" id="dob" placeholder="Date of Birth" class="border rounded px-3 py-2 w-full" required>
                    <select id="gender" class="border rounded px-3 py-2 w-full" required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <input type="tel" id="phone" placeholder="Phone Number" class="border rounded px-3 py-2 w-full" required>
                    <input type="email" id="email" placeholder="Email" class="border rounded px-3 py-2 w-full">
                </div>
                <textarea id="address" placeholder="Address" class="border rounded px-3 py-2 w-full" rows="2"></textarea>
                <textarea id="medicalHistory" placeholder="Medical History" class="border rounded px-3 py-2 w-full" rows="3"></textarea>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('newRecordModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Record</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Invoice Modal -->
    <div id="invoiceModal" class="modal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold mb-4">Create Invoice</h2>
            <form id="invoiceForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="patientId" placeholder="Patient ID" class="border rounded px-3 py-2 w-full" required>
                    <input type="text" id="patientName" placeholder="Patient Name" class="border rounded px-3 py-2 w-full" required>
                </div>
                <select id="serviceType" class="border rounded px-3 py-2 w-full" required>
                    <option value="">Select Service</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Emergency">Emergency</option>
                </select>
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" id="amount" placeholder="Amount" class="border rounded px-3 py-2 w-full" required>
                    <select id="paymentMethod" class="border rounded px-3 py-2 w-full" required>
                        <option value="">Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Insurance">Insurance</option>
                        <option value="NHIS">NHIS</option>
                    </select>
                </div>
                <input type="date" id="invoiceDate" class="border rounded px-3 py-2 w-full" required>
                <textarea id="description" placeholder="Description" class="border rounded px-3 py-2 w-full" rows="2"></textarea>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('invoiceModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Invoice</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Stock Entry Modal -->
    <div id="stockEntryModal" class="modal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold mb-4">Stock Entry</h2>
            <form id="stockForm" class="space-y-4">
                <input type="text" id="itemName" placeholder="Item Name" class="border rounded px-3 py-2 w-full" required>
                <select id="category" class="border rounded px-3 py-2 w-full" required>
                    <option value="">Select Category</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Supplies">Medical Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Consumables">Consumables</option>
                </select>
                <div class="grid grid-cols-3 gap-4">
                    <input type="number" id="quantity" placeholder="Quantity" class="border rounded px-3 py-2 w-full" required>
                    <input type="text" id="unit" placeholder="Unit (e.g., Tablets)" class="border rounded px-3 py-2 w-full" required>
                    <input type="number" id="unitPrice" placeholder="Unit Price" class="border rounded px-3 py-2 w-full" required>
                </div>
                <input type="text" id="supplier" placeholder="Supplier" class="border rounded px-3 py-2 w-full" required>
                <div class="grid grid-cols-2 gap-4">
                    <input type="date" id="expiryDate" placeholder="Expiry Date" class="border rounded px-3 py-2 w-full">
                    <input type="number" id="reorderLevel" placeholder="Reorder Level" class="border rounded px-3 py-2 w-full" required>
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('stockEntryModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Add Stock</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Schedule Modal -->
    <div id="scheduleModal" class="modal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold mb-4">Add Staff Schedule</h2>
            <form id="scheduleForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="staffId" placeholder="Staff ID" class="border rounded px-3 py-2 w-full" required>
                    <input type="text" id="staffName" placeholder="Staff Name" class="border rounded px-3 py-2 w-full" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <select id="department" class="border rounded px-3 py-2 w-full" required>
                        <option value="">Select Department</option>
                        <option value="Emergency">Emergency</option>
                        <option value="ICU">ICU</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General">General</option>
                    </select>
                    <select id="shift" class="border rounded px-3 py-2 w-full" required>
                        <option value="">Select Shift</option>
                        <option value="Morning">Morning (6 AM - 2 PM)</option>
                        <option value="Afternoon">Afternoon (2 PM - 10 PM)</option>
                        <option value="Night">Night (10 PM - 6 AM)</option>
                    </select>
                </div>
                <input type="date" id="scheduleDate" class="border rounded px-3 py-2 w-full" required>
                <select id="role" class="border rounded px-3 py-2 w-full" required>
                    <option value="">Select Role</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Technician">Technician</option>
                    <option value="Support">Support Staff</option>
                </select>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('scheduleModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Add Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Admission Modal -->
    <div id="admissionModal" class="modal">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold mb-4">New Admission</h2>
            <form id="admissionForm" class="space-y-4">
                <input type="text" id="admPatientName" placeholder="Patient Name" class="border rounded px-3 py-2 w-full" required>
                <div class="grid grid-cols-2 gap-4">
                    <select id="wardType" class="border rounded px-3 py-2 w-full" required>
                        <option value="">Select Ward</option>
                        <option value="General">General Ward</option>
                        <option value="Private">Private Room</option>
                        <option value="ICU">ICU</option>
                        <option value="Pediatric">Pediatric Ward</option>
                        <option value="Maternity">Maternity Ward</option>
                    </select>
                    <input type="text" id="bedNumber" placeholder="Bed Number" class="border rounded px-3 py-2 w-full" required>
                </div>
                <input type="text" id="doctor" placeholder="Attending Doctor" class="border rounded px-3 py-2 w-full" required>
                <div class="flex justify-end space-x-2">
                    <button type="button" onclick="closeModal('admissionModal')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Admit Patient</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Load statistics on page load
        async function loadStats() {
            try {
                const response = await fetch('/api/hms/stats');
                if (response.ok) {
                    const stats = await response.json();
                    document.getElementById('statPatients').textContent = stats.totalPatients || '0';
                    document.getElementById('statAppointments').textContent = stats.todayAppointments || '0';
                    document.getElementById('statBills').textContent = stats.pendingBills || '0';
                    document.getElementById('statStock').textContent = stats.lowStockItems || '0';
                    document.getElementById('statOccupancy').textContent = (stats.occupancyRate || '0') + '%';
                    document.getElementById('statBeds').textContent = stats.availableBeds || '0';
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Loading functions
        function showLoading() {
            document.getElementById('loading').classList.add('active');
        }

        function hideLoading() {
            document.getElementById('loading').classList.remove('active');
        }

        // Notification function
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notificationIcon');
            const text = document.getElementById('notificationText');
            
            text.textContent = message;
            
            if (type === 'success') {
                icon.className = 'fas fa-check-circle text-green-500 mr-3';
            } else if (type === 'error') {
                icon.className = 'fas fa-times-circle text-red-500 mr-3';
            } else {
                icon.className = 'fas fa-info-circle text-blue-500 mr-3';
            }
            
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Form handlers
        document.getElementById('newRecordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const formData = {
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
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Patient record created successfully');
                    closeModal('newRecordModal');
                    document.getElementById('newRecordForm').reset();
                    loadStats();
                } else {
                    throw new Error('Failed to create record');
                }
            } catch (error) {
                showNotification('Error creating patient record', 'error');
            } finally {
                hideLoading();
            }
        });

        document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const formData = {
                patientId: document.getElementById('patientId').value,
                patientName: document.getElementById('patientName').value,
                serviceType: document.getElementById('serviceType').value,
                amount: document.getElementById('amount').value,
                paymentMethod: document.getElementById('paymentMethod').value,
                invoiceDate: document.getElementById('invoiceDate').value,
                description: document.getElementById('description').value
            };
            
            try {
                const response = await fetch('/api/hms/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Invoice created successfully');
                    closeModal('invoiceModal');
                    document.getElementById('invoiceForm').reset();
                    loadStats();
                } else {
                    throw new Error('Failed to create invoice');
                }
            } catch (error) {
                showNotification('Error creating invoice', 'error');
            } finally {
                hideLoading();
            }
        });

        document.getElementById('stockForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const formData = {
                itemName: document.getElementById('itemName').value,
                category: document.getElementById('category').value,
                quantity: document.getElementById('quantity').value,
                unit: document.getElementById('unit').value,
                unitPrice: document.getElementById('unitPrice').value,
                supplier: document.getElementById('supplier').value,
                expiryDate: document.getElementById('expiryDate').value,
                reorderLevel: document.getElementById('reorderLevel').value
            };
            
            try {
                const response = await fetch('/api/hms/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Stock added successfully');
                    closeModal('stockEntryModal');
                    document.getElementById('stockForm').reset();
                } else {
                    throw new Error('Failed to add stock');
                }
            } catch (error) {
                showNotification('Error adding stock', 'error');
            } finally {
                hideLoading();
            }
        });

        document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const formData = {
                staffId: document.getElementById('staffId').value,
                staffName: document.getElementById('staffName').value,
                department: document.getElementById('department').value,
                shift: document.getElementById('shift').value,
                scheduleDate: document.getElementById('scheduleDate').value,
                role: document.getElementById('role').value
            };
            
            try {
                const response = await fetch('/api/hms/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Schedule added successfully');
                    closeModal('scheduleModal');
                    document.getElementById('scheduleForm').reset();
                } else {
                    throw new Error('Failed to add schedule');
                }
            } catch (error) {
                showNotification('Error adding schedule', 'error');
            } finally {
                hideLoading();
            }
        });

        document.getElementById('admissionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const formData = {
                patientName: document.getElementById('admPatientName').value,
                wardType: document.getElementById('wardType').value,
                bedNumber: document.getElementById('bedNumber').value,
                doctor: document.getElementById('doctor').value
            };
            
            try {
                const response = await fetch('/api/hms/admissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showNotification('Patient admitted successfully');
                    closeModal('admissionModal');
                    document.getElementById('admissionForm').reset();
                    loadStats();
                } else {
                    throw new Error('Failed to create admission');
                }
            } catch (error) {
                showNotification('Error creating admission', 'error');
            } finally {
                hideLoading();
            }
        });

        // View functions
        function viewRecords() {
            showNotification('Loading patient records...', 'info');
            // In a real app, this would navigate to a records page
        }

        function viewInvoices() {
            showNotification('Loading invoices...', 'info');
        }

        function viewInventory() {
            showNotification('Loading inventory...', 'info');
        }

        function viewSchedule() {
            showNotification('Loading staff schedule...', 'info');
        }

        function viewBeds() {
            showNotification('Loading bed availability...', 'info');
        }

        function viewDashboard() {
            showNotification('Loading analytics dashboard...', 'info');
        }

        function exportReport() {
            showNotification('Generating report...', 'info');
        }

        // Load stats on page load
        loadStats();
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 5601;
app.listen(PORT, () => {
    console.log(`HMS Module (Complete) running on port ${PORT}`);
});
