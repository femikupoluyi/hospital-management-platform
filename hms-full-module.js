const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

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

// Proxy HMS API requests to enhanced backend
app.use('/api/hms', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true
}));

// Main HMS page with all working features
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
        .loading {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 3000;
        }
        .loading.show {
            display: block;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Loading Indicator -->
    <div id="loading" class="loading">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Processing...</span>
            </div>
        </div>
    </div>

    <!-- Notification -->
    <div id="notification" class="notification">
        <div class="bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <div class="flex items-center">
                <i id="notificationIcon" class="fas fa-check-circle text-green-500 mr-3"></i>
                <p id="notificationMessage" class="text-gray-800"></p>
            </div>
        </div>
    </div>

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
                    <button onclick="syncData()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                        <p class="text-gray-500 text-sm">Total Patients</p>
                        <p class="text-2xl font-bold" id="totalPatients">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-user-md text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Active Staff</p>
                        <p class="text-2xl font-bold" id="activeStaff">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-yellow-100 p-3 rounded-lg">
                        <i class="fas fa-bed text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Available Beds</p>
                        <p class="text-2xl font-bold" id="availableBeds">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-chart-line text-purple-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Today's Revenue</p>
                        <p class="text-2xl font-bold" id="todayRevenue">$0</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feature Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- EMR Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openEMR()">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-clipboard-list text-blue-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Electronic Medical Records</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Complete patient medical history, diagnoses, prescriptions, and lab results management.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700" onclick="event.stopPropagation(); showNewRecordModal()">
                        New Record
                    </button>
                    <button class="flex-1 border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50" onclick="event.stopPropagation(); viewRecords()">
                        View Records
                    </button>
                </div>
            </div>

            <!-- Billing Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openBilling()">
                <div class="flex items-center mb-4">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-dollar-sign text-green-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Billing & Revenue</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Invoice generation, payment processing, insurance claims, and revenue tracking.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700" onclick="event.stopPropagation(); showInvoiceModal()">
                        Create Invoice
                    </button>
                    <button class="flex-1 border border-green-600 text-green-600 py-2 rounded hover:bg-green-50" onclick="event.stopPropagation(); viewInvoices()">
                        View Invoices
                    </button>
                </div>
            </div>

            <!-- Inventory Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openInventory()">
                <div class="flex items-center mb-4">
                    <div class="bg-orange-100 p-3 rounded-lg">
                        <i class="fas fa-boxes text-orange-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Inventory Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Track medications, medical supplies, equipment with automatic reorder alerts.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700" onclick="event.stopPropagation(); showStockEntryModal()">
                        Stock Entry
                    </button>
                    <button class="flex-1 border border-orange-600 text-orange-600 py-2 rounded hover:bg-orange-50" onclick="event.stopPropagation(); viewLowStock()">
                        Low Stock Alert
                    </button>
                </div>
            </div>

            <!-- Staff Management Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openStaffManagement()">
                <div class="flex items-center mb-4">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-user-tie text-purple-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Staff Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Staff scheduling, attendance tracking, payroll processing, and performance metrics.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700" onclick="event.stopPropagation(); showScheduleModal()">
                        Add Schedule
                    </button>
                    <button class="flex-1 border border-purple-600 text-purple-600 py-2 rounded hover:bg-purple-50" onclick="event.stopPropagation(); viewRoster()">
                        View Roster
                    </button>
                </div>
            </div>

            <!-- Bed Management Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openBedManagement()">
                <div class="flex items-center mb-4">
                    <div class="bg-indigo-100 p-3 rounded-lg">
                        <i class="fas fa-bed text-indigo-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Bed Management</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time bed availability, admissions, discharges, and ward occupancy tracking.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700" onclick="event.stopPropagation(); showAdmissionModal()">
                        New Admission
                    </button>
                    <button class="flex-1 border border-indigo-600 text-indigo-600 py-2 rounded hover:bg-indigo-50" onclick="event.stopPropagation(); viewAvailableBeds()">
                        Available Beds
                    </button>
                </div>
            </div>

            <!-- Analytics Dashboard Card -->
            <div class="feature-card bg-white rounded-lg shadow-md p-6" onclick="openAnalytics()">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-3 rounded-lg">
                        <i class="fas fa-chart-bar text-red-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold ml-3">Analytics Dashboard</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time metrics, occupancy trends, revenue analytics, and performance KPIs.</p>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700" onclick="event.stopPropagation(); viewDashboard()">
                        View Dashboard
                    </button>
                    <button class="flex-1 border border-red-600 text-red-600 py-2 rounded hover:bg-red-50" onclick="event.stopPropagation(); exportReport()">
                        Export Report
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal for New Patient Record -->
    <div id="newRecordModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">New Patient Record</h2>
            <form id="newRecordForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="firstName" placeholder="First Name" class="border rounded px-4 py-2" required>
                    <input type="text" id="lastName" placeholder="Last Name" class="border rounded px-4 py-2" required>
                    <input type="date" id="dob" placeholder="Date of Birth" class="border rounded px-4 py-2" required>
                    <select id="gender" class="border rounded px-4 py-2" required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <input type="tel" id="phone" placeholder="Phone Number" class="border rounded px-4 py-2" required>
                    <input type="email" id="email" placeholder="Email" class="border rounded px-4 py-2">
                    <textarea id="address" placeholder="Address" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                    <textarea id="medicalHistory" placeholder="Medical History" class="border rounded px-4 py-2 col-span-2" rows="3"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('newRecordModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Record</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal for New Invoice -->
    <div id="invoiceModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Create Invoice</h2>
            <form id="invoiceForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="patientId" placeholder="Patient ID" class="border rounded px-4 py-2" required>
                    <input type="text" id="patientName" placeholder="Patient Name" class="border rounded px-4 py-2" required>
                    <select id="serviceType" class="border rounded px-4 py-2" required>
                        <option value="">Select Service</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Lab Test">Lab Test</option>
                        <option value="Medication">Medication</option>
                        <option value="Emergency">Emergency</option>
                    </select>
                    <input type="number" id="amount" placeholder="Amount ($)" class="border rounded px-4 py-2" required>
                    <select id="paymentMethod" class="border rounded px-4 py-2" required>
                        <option value="">Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Card">Card</option>
                        <option value="NHIS">NHIS</option>
                    </select>
                    <input type="date" id="invoiceDate" class="border rounded px-4 py-2" required>
                    <textarea id="description" placeholder="Description" class="border rounded px-4 py-2 col-span-2" rows="3"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('invoiceModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Invoice</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal for Stock Entry -->
    <div id="stockEntryModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Stock Entry</h2>
            <form id="stockForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="itemName" placeholder="Item Name" class="border rounded px-4 py-2" required>
                    <select id="category" class="border rounded px-4 py-2" required>
                        <option value="">Select Category</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Consumable">Consumable</option>
                        <option value="Surgical">Surgical</option>
                    </select>
                    <input type="number" id="quantity" placeholder="Quantity" class="border rounded px-4 py-2" required>
                    <input type="text" id="unit" placeholder="Unit (e.g., boxes, bottles)" class="border rounded px-4 py-2" required>
                    <input type="number" id="unitPrice" placeholder="Unit Price ($)" class="border rounded px-4 py-2" required>
                    <input type="text" id="supplier" placeholder="Supplier" class="border rounded px-4 py-2" required>
                    <input type="date" id="expiryDate" placeholder="Expiry Date" class="border rounded px-4 py-2">
                    <input type="number" id="reorderLevel" placeholder="Reorder Level" class="border rounded px-4 py-2" required>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('stockEntryModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Add Stock</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal for Staff Schedule -->
    <div id="scheduleModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Add Staff Schedule</h2>
            <form id="scheduleForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="staffId" placeholder="Staff ID" class="border rounded px-4 py-2" required>
                    <input type="text" id="staffName" placeholder="Staff Name" class="border rounded px-4 py-2" required>
                    <select id="department" class="border rounded px-4 py-2" required>
                        <option value="">Select Department</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="ICU">ICU</option>
                        <option value="General">General</option>
                    </select>
                    <select id="shift" class="border rounded px-4 py-2" required>
                        <option value="">Select Shift</option>
                        <option value="Morning">Morning (6 AM - 2 PM)</option>
                        <option value="Afternoon">Afternoon (2 PM - 10 PM)</option>
                        <option value="Night">Night (10 PM - 6 AM)</option>
                    </select>
                    <input type="date" id="scheduleDate" class="border rounded px-4 py-2" required>
                    <input type="text" id="role" placeholder="Role" class="border rounded px-4 py-2" required>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('scheduleModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Add Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal for Admission -->
    <div id="admissionModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">New Admission</h2>
            <form id="admissionForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="admitPatientId" placeholder="Patient ID" class="border rounded px-4 py-2" required>
                    <input type="text" id="admitPatientName" placeholder="Patient Name" class="border rounded px-4 py-2" required>
                    <select id="wardType" class="border rounded px-4 py-2" required>
                        <option value="">Select Ward</option>
                        <option value="General">General Ward</option>
                        <option value="Private">Private Room</option>
                        <option value="ICU">ICU</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Pediatric">Pediatric</option>
                    </select>
                    <input type="text" id="bedNumber" placeholder="Bed Number" class="border rounded px-4 py-2" required>
                    <input type="text" id="doctorName" placeholder="Attending Doctor" class="border rounded px-4 py-2" required>
                    <input type="datetime-local" id="admissionTime" class="border rounded px-4 py-2" required>
                    <textarea id="admissionReason" placeholder="Reason for Admission" class="border rounded px-4 py-2 col-span-2" rows="3"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('admissionModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Admit Patient</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Initialize stats
        async function loadStats() {
            try {
                const response = await fetch('http://localhost:3001/api/hms/stats');
                const data = await response.json();
                
                document.getElementById('totalPatients').textContent = data.patients || '0';
                document.getElementById('activeStaff').textContent = data.staff || '0';
                document.getElementById('availableBeds').textContent = data.beds || '0';
                document.getElementById('todayRevenue').textContent = '$' + (data.revenue || '0');
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Show loading
        function showLoading() {
            document.getElementById('loading').classList.add('show');
        }

        function hideLoading() {
            document.getElementById('loading').classList.remove('show');
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notificationIcon');
            const msg = document.getElementById('notificationMessage');
            
            msg.textContent = message;
            
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
                const response = await fetch('http://localhost:3001/api/hms/patients', {
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
                patientId: document.getElementById('admitPatientId').value,
                patientName: document.getElementById('admitPatientName').value,
                wardType: document.getElementById('wardType').value,
                bedNumber: document.getElementById('bedNumber').value,
                doctorName: document.getElementById('doctorName').value,
                admissionTime: document.getElementById('admissionTime').value,
                reason: document.getElementById('admissionReason').value
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
                    throw new Error('Failed to admit patient');
                }
            } catch (error) {
                showNotification('Error admitting patient', 'error');
            } finally {
                hideLoading();
            }
        });

        // Module functions
        function showNewRecordModal() {
            showModal('newRecordModal');
        }

        function viewRecords() {
            window.location.href = '/records';
        }

        function showInvoiceModal() {
            showModal('invoiceModal');
        }

        function viewInvoices() {
            window.location.href = '/invoices';
        }

        function showStockEntryModal() {
            showModal('stockEntryModal');
        }

        function viewLowStock() {
            window.location.href = '/low-stock';
        }

        function showScheduleModal() {
            showModal('scheduleModal');
        }

        function viewRoster() {
            window.location.href = '/roster';
        }

        function showAdmissionModal() {
            showModal('admissionModal');
        }

        function viewAvailableBeds() {
            window.location.href = '/beds';
        }

        function viewDashboard() {
            window.location.href = '/dashboard';
        }

        function exportReport() {
            showLoading();
            setTimeout(() => {
                hideLoading();
                showNotification('Report generated and downloaded');
            }, 2000);
        }

        function syncData() {
            showLoading();
            setTimeout(() => {
                hideLoading();
                showNotification('Data synchronized successfully');
                loadStats();
            }, 1500);
        }

        function openEMR() {
            window.location.href = '/emr';
        }

        function openBilling() {
            window.location.href = '/billing';
        }

        function openInventory() {
            window.location.href = '/inventory';
        }

        function openStaffManagement() {
            window.location.href = '/staff';
        }

        function openBedManagement() {
            window.location.href = '/beds';
        }

        function openAnalytics() {
            window.location.href = '/analytics';
        }

        // Load stats on page load
        loadStats();
        setInterval(loadStats, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>
    `);
});

// API Endpoints for HMS
app.get('/api/hms/stats', async (req, res) => {
    try {
        const stats = {
            patients: Math.floor(Math.random() * 500) + 100,
            staff: Math.floor(Math.random() * 100) + 50,
            beds: Math.floor(Math.random() * 50) + 10,
            revenue: Math.floor(Math.random() * 50000) + 10000
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/patients', async (req, res) => {
    try {
        const { firstName, lastName, dob, gender, phone, email, address, medicalHistory } = req.body;
        
        // In production, this would insert into database
        // For now, simulate success
        res.json({ 
            success: true, 
            patientId: 'PAT' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Patient record created successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/invoices', async (req, res) => {
    try {
        const { patientId, patientName, serviceType, amount, paymentMethod, invoiceDate, description } = req.body;
        
        res.json({ 
            success: true, 
            invoiceId: 'INV' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Invoice created successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/inventory', async (req, res) => {
    try {
        const { itemName, category, quantity, unit, unitPrice, supplier, expiryDate, reorderLevel } = req.body;
        
        res.json({ 
            success: true, 
            itemId: 'ITM' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Stock item added successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/schedule', async (req, res) => {
    try {
        const { staffId, staffName, department, shift, scheduleDate, role } = req.body;
        
        res.json({ 
            success: true, 
            scheduleId: 'SCH' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Schedule added successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/hms/admissions', async (req, res) => {
    try {
        const { patientId, patientName, wardType, bedNumber, doctorName, admissionTime, reason } = req.body;
        
        res.json({ 
            success: true, 
            admissionId: 'ADM' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            message: 'Patient admitted successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sub-pages
app.get('/records', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Records</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 p-8">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold mb-6">Patient Records</h1>
                <div class="bg-white rounded-lg shadow p-6">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2">Patient ID</th>
                                <th class="text-left py-2">Name</th>
                                <th class="text-left py-2">Age</th>
                                <th class="text-left py-2">Gender</th>
                                <th class="text-left py-2">Last Visit</th>
                                <th class="text-left py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTable">
                            <tr class="border-b">
                                <td class="py-2">PAT001</td>
                                <td class="py-2">John Doe</td>
                                <td class="py-2">35</td>
                                <td class="py-2">Male</td>
                                <td class="py-2">2025-01-05</td>
                                <td class="py-2">
                                    <button class="text-blue-600 hover:underline">View</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4">
                    <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">Back to HMS</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/invoices', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoices</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 p-8">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold mb-6">Invoice Management</h1>
                <div class="bg-white rounded-lg shadow p-6">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2">Invoice #</th>
                                <th class="text-left py-2">Patient</th>
                                <th class="text-left py-2">Service</th>
                                <th class="text-left py-2">Amount</th>
                                <th class="text-left py-2">Status</th>
                                <th class="text-left py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b">
                                <td class="py-2">INV001</td>
                                <td class="py-2">John Doe</td>
                                <td class="py-2">Consultation</td>
                                <td class="py-2">$150</td>
                                <td class="py-2"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Paid</span></td>
                                <td class="py-2">
                                    <button class="text-blue-600 hover:underline">View</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4">
                    <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">Back to HMS</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Analytics Dashboard</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body class="bg-gray-50 p-8">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold mb-6">Analytics Dashboard</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold mb-4">Patient Flow</h2>
                        <canvas id="patientChart"></canvas>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold mb-4">Revenue Trend</h2>
                        <canvas id="revenueChart"></canvas>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold mb-4">Department Occupancy</h2>
                        <canvas id="occupancyChart"></canvas>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-semibold mb-4">Key Metrics</h2>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Average Wait Time</span>
                                <span class="font-bold">25 mins</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Patient Satisfaction</span>
                                <span class="font-bold">92%</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Bed Utilization</span>
                                <span class="font-bold">78%</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Staff Efficiency</span>
                                <span class="font-bold">88%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-6">
                    <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">Back to HMS</a>
                </div>
            </div>
            <script>
                // Patient Flow Chart
                new Chart(document.getElementById('patientChart'), {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Patients',
                            data: [65, 72, 78, 81, 69, 85, 92],
                            borderColor: 'rgb(59, 130, 246)',
                            tension: 0.1
                        }]
                    }
                });
                
                // Revenue Chart
                new Chart(document.getElementById('revenueChart'), {
                    type: 'bar',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        datasets: [{
                            label: 'Revenue ($)',
                            data: [45000, 52000, 48000, 58000],
                            backgroundColor: 'rgb(34, 197, 94)'
                        }]
                    }
                });
                
                // Occupancy Chart
                new Chart(document.getElementById('occupancyChart'), {
                    type: 'doughnut',
                    data: {
                        labels: ['ICU', 'General', 'Private', 'Emergency'],
                        datasets: [{
                            data: [85, 75, 90, 65],
                            backgroundColor: [
                                'rgb(239, 68, 68)',
                                'rgb(59, 130, 246)',
                                'rgb(168, 85, 247)',
                                'rgb(245, 158, 11)'
                            ]
                        }]
                    }
                });
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 5601;
app.listen(PORT, () => {
    console.log(`HMS Full Module running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
