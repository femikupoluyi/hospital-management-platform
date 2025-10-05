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

// Main CRM Dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM System - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-button.active { 
            background-color: rgb(59, 130, 246);
            color: white;
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
                    <i class="fas fa-users text-blue-600 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">CRM & Relationship Management</h1>
                        <p class="text-sm text-gray-600">Manage Hospital Owners & Patients</p>
                    </div>
                </div>
                <a href="/" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-home"></i> Back to Platform
                </a>
            </div>
        </div>
    </header>

    <!-- Tabs -->
    <div class="container mx-auto px-6 mt-6">
        <div class="bg-white rounded-lg shadow-sm">
            <div class="flex border-b">
                <button onclick="switchTab('owner')" class="tab-button active px-6 py-3 font-semibold">
                    <i class="fas fa-building mr-2"></i>Owner CRM
                </button>
                <button onclick="switchTab('patient')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-user-injured mr-2"></i>Patient CRM
                </button>
                <button onclick="switchTab('campaigns')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-bullhorn mr-2"></i>Campaigns
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-6">
        <!-- Owner CRM Tab -->
        <div id="owner-tab" class="tab-content active">
            <!-- Owner Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-blue-100 p-3 rounded-lg">
                            <i class="fas fa-hospital text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Total Hospitals</p>
                            <p class="text-2xl font-bold" id="totalHospitals">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="fas fa-file-contract text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Active Contracts</p>
                            <p class="text-2xl font-bold" id="activeContracts">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-3 rounded-lg">
                            <i class="fas fa-dollar-sign text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Monthly Revenue</p>
                            <p class="text-2xl font-bold" id="monthlyRevenue">$0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="fas fa-star text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Avg Satisfaction</p>
                            <p class="text-2xl font-bold" id="avgSatisfaction">0%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Owner Management -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Hospital Owners</h2>
                    <button onclick="showAddOwnerModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Owner
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-3">Hospital Name</th>
                                <th class="text-left py-3">Owner</th>
                                <th class="text-left py-3">Contract Status</th>
                                <th class="text-left py-3">Monthly Payout</th>
                                <th class="text-left py-3">Satisfaction</th>
                                <th class="text-left py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ownersTable">
                            <tr class="border-b">
                                <td class="py-3">City General Hospital</td>
                                <td class="py-3">Dr. John Smith</td>
                                <td class="py-3"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span></td>
                                <td class="py-3">$15,000</td>
                                <td class="py-3">
                                    <div class="flex items-center">
                                        <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-green-600 h-2 rounded-full" style="width: 85%"></div>
                                        </div>
                                        <span>85%</span>
                                    </div>
                                </td>
                                <td class="py-3">
                                    <button onclick="viewOwnerDetails()" class="text-blue-600 hover:underline mr-2">View</button>
                                    <button onclick="sendMessage('owner')" class="text-green-600 hover:underline">Message</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Patient CRM Tab -->
        <div id="patient-tab" class="tab-content">
            <!-- Patient Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                            <i class="fas fa-calendar-check text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Appointments Today</p>
                            <p class="text-2xl font-bold" id="todayAppointments">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-3 rounded-lg">
                            <i class="fas fa-award text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Loyalty Members</p>
                            <p class="text-2xl font-bold" id="loyaltyMembers">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="fas fa-comments text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Feedback Score</p>
                            <p class="text-2xl font-bold" id="feedbackScore">0/5</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Patient Management -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Patient Management</h2>
                    <div class="space-x-2">
                        <button onclick="showAppointmentModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-calendar-plus mr-2"></i>New Appointment
                        </button>
                        <button onclick="showPatientModal()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-user-plus mr-2"></i>Add Patient
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-3">Patient ID</th>
                                <th class="text-left py-3">Name</th>
                                <th class="text-left py-3">Phone</th>
                                <th class="text-left py-3">Next Appointment</th>
                                <th class="text-left py-3">Loyalty Status</th>
                                <th class="text-left py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="patientsTable">
                            <tr class="border-b">
                                <td class="py-3">PAT001</td>
                                <td class="py-3">Jane Doe</td>
                                <td class="py-3">+1 234-567-8900</td>
                                <td class="py-3">2025-01-10 10:00 AM</td>
                                <td class="py-3"><span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Gold</span></td>
                                <td class="py-3">
                                    <button onclick="viewPatientDetails()" class="text-blue-600 hover:underline mr-2">View</button>
                                    <button onclick="sendReminder()" class="text-green-600 hover:underline">Remind</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Upcoming Appointments -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Today's Appointments</h2>
                <div class="space-y-3" id="appointmentsList">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-2 rounded mr-3">
                                <i class="fas fa-clock text-blue-600"></i>
                            </div>
                            <div>
                                <p class="font-semibold">10:00 AM - Jane Doe</p>
                                <p class="text-sm text-gray-600">General Checkup - Dr. Smith</p>
                            </div>
                        </div>
                        <button class="text-blue-600 hover:underline">View Details</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Campaigns Tab -->
        <div id="campaigns-tab" class="tab-content">
            <!-- Campaign Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-blue-100 p-3 rounded-lg">
                            <i class="fas fa-paper-plane text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Active Campaigns</p>
                            <p class="text-2xl font-bold" id="activeCampaigns">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="fas fa-envelope-open text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Open Rate</p>
                            <p class="text-2xl font-bold" id="openRate">0%</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-3 rounded-lg">
                            <i class="fas fa-sms text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">SMS Sent Today</p>
                            <p class="text-2xl font-bold" id="smsSent">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="fab fa-whatsapp text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">WhatsApp Reach</p>
                            <p class="text-2xl font-bold" id="whatsappReach">0</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Campaign Management -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Communication Campaigns</h2>
                    <button onclick="showCampaignModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>New Campaign
                    </button>
                </div>
                
                <!-- Campaign List -->
                <div class="space-y-4">
                    <div class="border rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="font-semibold">Health Awareness Week</h3>
                                <p class="text-sm text-gray-600">Target: All Patients | Channel: Email, SMS</p>
                            </div>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>
                        </div>
                        <div class="grid grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                                <span class="text-gray-500">Sent:</span> 
                                <span class="font-semibold">1,250</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Opened:</span> 
                                <span class="font-semibold">875 (70%)</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Clicked:</span> 
                                <span class="font-semibold">320 (25.6%)</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Converted:</span> 
                                <span class="font-semibold">45 (3.6%)</span>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="text-blue-600 hover:underline text-sm">View Details</button>
                            <button class="text-green-600 hover:underline text-sm">Edit</button>
                            <button class="text-red-600 hover:underline text-sm">Pause</button>
                        </div>
                    </div>

                    <div class="border rounded-lg p-4">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="font-semibold">Appointment Reminders</h3>
                                <p class="text-sm text-gray-600">Target: Scheduled Patients | Channel: WhatsApp, SMS</p>
                            </div>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>
                        </div>
                        <div class="grid grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                                <span class="text-gray-500">Sent:</span> 
                                <span class="font-semibold">450</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Delivered:</span> 
                                <span class="font-semibold">445 (98.9%)</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Read:</span> 
                                <span class="font-semibold">420 (93.3%)</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Confirmed:</span> 
                                <span class="font-semibold">380 (84.4%)</span>
                            </div>
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button class="text-blue-600 hover:underline text-sm">View Details</button>
                            <button class="text-green-600 hover:underline text-sm">Edit</button>
                            <button class="text-red-600 hover:underline text-sm">Pause</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modals -->
    <!-- Add Owner Modal -->
    <div id="addOwnerModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Add Hospital Owner</h2>
            <form id="ownerForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Hospital Name" class="border rounded px-4 py-2" required>
                    <input type="text" placeholder="Owner Name" class="border rounded px-4 py-2" required>
                    <input type="email" placeholder="Email" class="border rounded px-4 py-2" required>
                    <input type="tel" placeholder="Phone" class="border rounded px-4 py-2" required>
                    <input type="text" placeholder="License Number" class="border rounded px-4 py-2" required>
                    <select class="border rounded px-4 py-2" required>
                        <option value="">Contract Type</option>
                        <option>Standard</option>
                        <option>Premium</option>
                        <option>Enterprise</option>
                    </select>
                    <input type="number" placeholder="Monthly Payout ($)" class="border rounded px-4 py-2" required>
                    <input type="date" placeholder="Contract Start Date" class="border rounded px-4 py-2" required>
                    <textarea placeholder="Address" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('addOwnerModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Owner</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Patient Modal -->
    <div id="addPatientModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Add New Patient</h2>
            <form id="patientForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" class="border rounded px-4 py-2" required>
                    <input type="text" placeholder="Last Name" class="border rounded px-4 py-2" required>
                    <input type="email" placeholder="Email" class="border rounded px-4 py-2">
                    <input type="tel" placeholder="Phone" class="border rounded px-4 py-2" required>
                    <input type="date" placeholder="Date of Birth" class="border rounded px-4 py-2" required>
                    <select class="border rounded px-4 py-2" required>
                        <option value="">Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                    <select class="border rounded px-4 py-2">
                        <option value="">Loyalty Program</option>
                        <option>None</option>
                        <option>Silver</option>
                        <option>Gold</option>
                        <option>Platinum</option>
                    </select>
                    <input type="text" placeholder="Emergency Contact" class="border rounded px-4 py-2">
                    <textarea placeholder="Address" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                    <textarea placeholder="Medical Notes" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('addPatientModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Patient</button>
                </div>
            </form>
        </div>
    </div>

    <!-- New Campaign Modal -->
    <div id="campaignModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Create New Campaign</h2>
            <form id="campaignForm">
                <div class="space-y-4">
                    <input type="text" placeholder="Campaign Name" class="border rounded px-4 py-2 w-full" required>
                    <select class="border rounded px-4 py-2 w-full" required>
                        <option value="">Select Target Audience</option>
                        <option>All Patients</option>
                        <option>Active Patients</option>
                        <option>Loyalty Members</option>
                        <option>Hospital Owners</option>
                        <option>Custom Segment</option>
                    </select>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Communication Channels</label>
                        <div class="space-x-4">
                            <label class="inline-flex items-center">
                                <input type="checkbox" class="mr-2" checked> Email
                            </label>
                            <label class="inline-flex items-center">
                                <input type="checkbox" class="mr-2" checked> SMS
                            </label>
                            <label class="inline-flex items-center">
                                <input type="checkbox" class="mr-2" checked> WhatsApp
                            </label>
                        </div>
                    </div>
                    <textarea placeholder="Campaign Message" class="border rounded px-4 py-2 w-full" rows="4" required></textarea>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="datetime-local" placeholder="Start Date" class="border rounded px-4 py-2" required>
                        <input type="datetime-local" placeholder="End Date" class="border rounded px-4 py-2">
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('campaignModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Launch Campaign</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Appointment Modal -->
    <div id="appointmentModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Schedule Appointment</h2>
            <form id="appointmentForm">
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Patient ID or Name" class="border rounded px-4 py-2" required>
                    <select class="border rounded px-4 py-2" required>
                        <option value="">Select Doctor</option>
                        <option>Dr. Smith - General</option>
                        <option>Dr. Johnson - Cardiology</option>
                        <option>Dr. Williams - Pediatrics</option>
                    </select>
                    <input type="date" class="border rounded px-4 py-2" required>
                    <input type="time" class="border rounded px-4 py-2" required>
                    <select class="border rounded px-4 py-2" required>
                        <option value="">Appointment Type</option>
                        <option>Consultation</option>
                        <option>Follow-up</option>
                        <option>Emergency</option>
                        <option>Routine Checkup</option>
                    </select>
                    <input type="text" placeholder="Duration (minutes)" class="border rounded px-4 py-2" value="30">
                    <textarea placeholder="Notes" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('appointmentModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Tab switching
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            // Remove active from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            // Mark button as active
            event.target.classList.add('active');
            
            // Load tab-specific data
            loadTabData(tabName);
        }

        // Load data for specific tab
        async function loadTabData(tabName) {
            if (tabName === 'owner') {
                loadOwnerStats();
            } else if (tabName === 'patient') {
                loadPatientStats();
            } else if (tabName === 'campaigns') {
                loadCampaignStats();
            }
        }

        // Load statistics
        async function loadOwnerStats() {
            try {
                const response = await fetch('/api/crm/owner-stats');
                const data = await response.json();
                document.getElementById('totalHospitals').textContent = data.hospitals || '12';
                document.getElementById('activeContracts').textContent = data.contracts || '10';
                document.getElementById('monthlyRevenue').textContent = '$' + (data.revenue || '150,000');
                document.getElementById('avgSatisfaction').textContent = (data.satisfaction || '88') + '%';
            } catch (error) {
                console.error('Error loading owner stats:', error);
            }
        }

        async function loadPatientStats() {
            try {
                const response = await fetch('/api/crm/patient-stats');
                const data = await response.json();
                document.getElementById('totalPatients').textContent = data.patients || '2,450';
                document.getElementById('todayAppointments').textContent = data.appointments || '48';
                document.getElementById('loyaltyMembers').textContent = data.loyalty || '856';
                document.getElementById('feedbackScore').textContent = (data.feedback || '4.5') + '/5';
            } catch (error) {
                console.error('Error loading patient stats:', error);
            }
        }

        async function loadCampaignStats() {
            try {
                const response = await fetch('/api/crm/campaign-stats');
                const data = await response.json();
                document.getElementById('activeCampaigns').textContent = data.campaigns || '5';
                document.getElementById('openRate').textContent = (data.openRate || '68') + '%';
                document.getElementById('smsSent').textContent = data.sms || '1,250';
                document.getElementById('whatsappReach').textContent = data.whatsapp || '3,200';
            } catch (error) {
                console.error('Error loading campaign stats:', error);
            }
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function showAddOwnerModal() {
            showModal('addOwnerModal');
        }

        function showPatientModal() {
            showModal('addPatientModal');
        }

        function showCampaignModal() {
            showModal('campaignModal');
        }

        function showAppointmentModal() {
            showModal('appointmentModal');
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
            }
            
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Form submissions
        document.getElementById('ownerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showNotification('Hospital owner added successfully');
            closeModal('addOwnerModal');
            loadOwnerStats();
        });

        document.getElementById('patientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showNotification('Patient added successfully');
            closeModal('addPatientModal');
            loadPatientStats();
        });

        document.getElementById('campaignForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showNotification('Campaign launched successfully');
            closeModal('campaignModal');
            loadCampaignStats();
        });

        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            showNotification('Appointment scheduled successfully');
            closeModal('appointmentModal');
            loadPatientStats();
        });

        // Action functions
        function viewOwnerDetails() {
            showNotification('Loading owner details...');
        }

        function viewPatientDetails() {
            showNotification('Loading patient details...');
        }

        function sendMessage(type) {
            showNotification('Message composer opening...');
        }

        function sendReminder() {
            showNotification('Reminder sent successfully');
        }

        // Load initial data
        loadOwnerStats();
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.get('/api/crm/owner-stats', (req, res) => {
    res.json({
        hospitals: 12,
        contracts: 10,
        revenue: 150000,
        satisfaction: 88
    });
});

app.get('/api/crm/patient-stats', (req, res) => {
    res.json({
        patients: 2450,
        appointments: 48,
        loyalty: 856,
        feedback: 4.5
    });
});

app.get('/api/crm/campaign-stats', (req, res) => {
    res.json({
        campaigns: 5,
        openRate: 68,
        sms: 1250,
        whatsapp: 3200
    });
});

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
    console.log(`CRM Full Module running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
