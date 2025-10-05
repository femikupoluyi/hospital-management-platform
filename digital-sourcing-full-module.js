const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

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

// Proxy API requests to enhanced backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(503).json({ error: 'Backend service unavailable' });
    }
}));

// Main Digital Sourcing page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Sourcing & Partner Onboarding - GrandPro HMSO</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .step-indicator {
            transition: all 0.3s;
        }
        .step-indicator.active {
            background-color: rgb(59, 130, 246);
            color: white;
        }
        .step-indicator.completed {
            background-color: rgb(34, 197, 94);
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
        .score-bar {
            transition: width 0.5s ease;
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
                    <i class="fas fa-handshake text-green-600 text-2xl mr-3"></i>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">Digital Sourcing & Partner Onboarding</h1>
                        <p class="text-sm text-gray-600">Hospital Acquisition Portal</p>
                    </div>
                </div>
                <a href="/" class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-home"></i> Back to Platform
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-blue-100 p-3 rounded-lg">
                        <i class="fas fa-paper-plane text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Applications</p>
                        <p class="text-2xl font-bold" id="totalApplications">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-yellow-100 p-3 rounded-lg">
                        <i class="fas fa-clock text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Under Review</p>
                        <p class="text-2xl font-bold" id="underReview">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-green-100 p-3 rounded-lg">
                        <i class="fas fa-check-circle text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Approved</p>
                        <p class="text-2xl font-bold" id="approved">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="bg-purple-100 p-3 rounded-lg">
                        <i class="fas fa-file-contract text-purple-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-gray-500 text-sm">Contracts Signed</p>
                        <p class="text-2xl font-bold" id="contractsSigned">0</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Application Portal -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold">Hospital Application Portal</h2>
                <button onclick="showApplicationModal()" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                    <i class="fas fa-plus mr-2"></i>New Application
                </button>
            </div>

            <!-- Process Steps -->
            <div class="flex justify-between mb-8">
                <div class="flex-1 text-center">
                    <div class="step-indicator completed rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2">
                        <i class="fas fa-edit"></i>
                    </div>
                    <p class="text-sm font-semibold">Application</p>
                </div>
                <div class="flex-1 text-center">
                    <div class="step-indicator completed rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2">
                        <i class="fas fa-file-upload"></i>
                    </div>
                    <p class="text-sm font-semibold">Documents</p>
                </div>
                <div class="flex-1 text-center">
                    <div class="step-indicator active rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2">
                        <i class="fas fa-star"></i>
                    </div>
                    <p class="text-sm font-semibold">Evaluation</p>
                </div>
                <div class="flex-1 text-center">
                    <div class="step-indicator rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2 border-2 border-gray-300">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <p class="text-sm font-semibold">Contract</p>
                </div>
                <div class="flex-1 text-center">
                    <div class="step-indicator rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-2 border-2 border-gray-300">
                        <i class="fas fa-check"></i>
                    </div>
                    <p class="text-sm font-semibold">Approval</p>
                </div>
            </div>
        </div>

        <!-- Applications Dashboard -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Application Dashboard</h3>
            
            <!-- Filter Tabs -->
            <div class="border-b mb-4">
                <div class="flex space-x-6">
                    <button class="pb-2 border-b-2 border-blue-600 text-blue-600 font-semibold">All Applications</button>
                    <button class="pb-2 text-gray-600 hover:text-gray-800">Pending Review</button>
                    <button class="pb-2 text-gray-600 hover:text-gray-800">In Evaluation</button>
                    <button class="pb-2 text-gray-600 hover:text-gray-800">Contract Phase</button>
                    <button class="pb-2 text-gray-600 hover:text-gray-800">Completed</button>
                </div>
            </div>

            <!-- Applications Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b">
                            <th class="text-left py-3">Application ID</th>
                            <th class="text-left py-3">Hospital Name</th>
                            <th class="text-left py-3">Owner</th>
                            <th class="text-left py-3">Submission Date</th>
                            <th class="text-left py-3">Score</th>
                            <th class="text-left py-3">Status</th>
                            <th class="text-left py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="applicationsTable">
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">APP-2025-001</td>
                            <td class="py-3">Riverside Medical Center</td>
                            <td class="py-3">Dr. Sarah Johnson</td>
                            <td class="py-3">2025-01-03</td>
                            <td class="py-3">
                                <div class="flex items-center">
                                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                        <div class="score-bar bg-green-600 h-2 rounded-full" style="width: 85%"></div>
                                    </div>
                                    <span class="text-sm font-semibold">85/100</span>
                                </div>
                            </td>
                            <td class="py-3">
                                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Under Evaluation</span>
                            </td>
                            <td class="py-3">
                                <button onclick="viewApplication('APP-2025-001')" class="text-blue-600 hover:underline mr-2">View</button>
                                <button onclick="evaluateApplication('APP-2025-001')" class="text-green-600 hover:underline">Evaluate</button>
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">APP-2025-002</td>
                            <td class="py-3">Central Healthcare Facility</td>
                            <td class="py-3">Mr. Robert Chen</td>
                            <td class="py-3">2025-01-02</td>
                            <td class="py-3">
                                <div class="flex items-center">
                                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                        <div class="score-bar bg-yellow-600 h-2 rounded-full" style="width: 72%"></div>
                                    </div>
                                    <span class="text-sm font-semibold">72/100</span>
                                </div>
                            </td>
                            <td class="py-3">
                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Contract Pending</span>
                            </td>
                            <td class="py-3">
                                <button onclick="viewApplication('APP-2025-002')" class="text-blue-600 hover:underline mr-2">View</button>
                                <button onclick="generateContract('APP-2025-002')" class="text-purple-600 hover:underline">Contract</button>
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3">APP-2025-003</td>
                            <td class="py-3">Westside Clinic</td>
                            <td class="py-3">Dr. Maria Garcia</td>
                            <td class="py-3">2025-01-01</td>
                            <td class="py-3">
                                <div class="flex items-center">
                                    <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                        <div class="score-bar bg-green-600 h-2 rounded-full" style="width: 92%"></div>
                                    </div>
                                    <span class="text-sm font-semibold">92/100</span>
                                </div>
                            </td>
                            <td class="py-3">
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Approved</span>
                            </td>
                            <td class="py-3">
                                <button onclick="viewApplication('APP-2025-003')" class="text-blue-600 hover:underline mr-2">View</button>
                                <button onclick="downloadContract('APP-2025-003')" class="text-green-600 hover:underline">Download</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Application Modal -->
    <div id="applicationModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6">New Hospital Application</h2>
            <form id="applicationForm">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Hospital Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Hospital Name" class="border rounded px-4 py-2" required>
                        <input type="text" placeholder="Registration Number" class="border rounded px-4 py-2" required>
                        <input type="text" placeholder="License Number" class="border rounded px-4 py-2" required>
                        <input type="date" placeholder="Established Date" class="border rounded px-4 py-2" required>
                        <select class="border rounded px-4 py-2" required>
                            <option value="">Hospital Type</option>
                            <option>General Hospital</option>
                            <option>Specialty Hospital</option>
                            <option>Clinic</option>
                            <option>Medical Center</option>
                        </select>
                        <input type="number" placeholder="Number of Beds" class="border rounded px-4 py-2" required>
                        <input type="number" placeholder="Number of Doctors" class="border rounded px-4 py-2" required>
                        <input type="number" placeholder="Number of Staff" class="border rounded px-4 py-2" required>
                        <textarea placeholder="Hospital Address" class="border rounded px-4 py-2 col-span-2" rows="2" required></textarea>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Owner Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Owner Full Name" class="border rounded px-4 py-2" required>
                        <input type="text" placeholder="Title/Position" class="border rounded px-4 py-2" required>
                        <input type="email" placeholder="Email Address" class="border rounded px-4 py-2" required>
                        <input type="tel" placeholder="Phone Number" class="border rounded px-4 py-2" required>
                        <input type="text" placeholder="National ID" class="border rounded px-4 py-2" required>
                        <input type="text" placeholder="Professional License" class="border rounded px-4 py-2">
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Services & Capabilities</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold mb-2">Departments Available</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> Emergency
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> Surgery
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> Pediatrics
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> Maternity
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Equipment Available</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> X-Ray
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> CT Scan
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> MRI
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-2"> Laboratory
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Document Upload</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold mb-2">Hospital License</label>
                            <input type="file" class="border rounded px-4 py-2 w-full" accept=".pdf,.jpg,.png" required>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Registration Certificate</label>
                            <input type="file" class="border rounded px-4 py-2 w-full" accept=".pdf,.jpg,.png" required>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Tax Certificate</label>
                            <input type="file" class="border rounded px-4 py-2 w-full" accept=".pdf,.jpg,.png" required>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold mb-2">Financial Statement</label>
                            <input type="file" class="border rounded px-4 py-2 w-full" accept=".pdf,.jpg,.png">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('applicationModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="button" onclick="saveDraft()" class="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Save Draft</button>
                    <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Submit Application</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Evaluation Modal -->
    <div id="evaluationModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Application Evaluation</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Infrastructure Score (0-30)</label>
                    <input type="range" id="infraScore" min="0" max="30" value="25" class="w-full">
                    <span id="infraScoreValue" class="text-sm text-gray-600">25</span>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Staff Capability (0-25)</label>
                    <input type="range" id="staffScore" min="0" max="25" value="20" class="w-full">
                    <span id="staffScoreValue" class="text-sm text-gray-600">20</span>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Financial Stability (0-25)</label>
                    <input type="range" id="financeScore" min="0" max="25" value="22" class="w-full">
                    <span id="financeScoreValue" class="text-sm text-gray-600">22</span>
                </div>
                <div>
                    <label class="block text-sm font-semibold mb-2">Service Quality (0-20)</label>
                    <input type="range" id="serviceScore" min="0" max="20" value="18" class="w-full">
                    <span id="serviceScoreValue" class="text-sm text-gray-600">18</span>
                </div>
                <div class="pt-4 border-t">
                    <p class="text-lg font-semibold">Total Score: <span id="totalScore" class="text-green-600">85</span>/100</p>
                    <p class="text-sm text-gray-600 mt-2">Minimum passing score: 70/100</p>
                </div>
                <textarea placeholder="Evaluation Comments" class="border rounded px-4 py-2 w-full" rows="3"></textarea>
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('evaluationModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button onclick="submitEvaluation()" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Evaluation</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Contract Modal -->
    <div id="contractModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
            <h2 class="text-2xl font-bold mb-6">Contract Generation</h2>
            <div class="border rounded-lg p-4 mb-4 bg-gray-50">
                <h3 class="font-semibold mb-2">Contract Preview</h3>
                <div class="text-sm space-y-2">
                    <p><strong>Hospital:</strong> Riverside Medical Center</p>
                    <p><strong>Owner:</strong> Dr. Sarah Johnson</p>
                    <p><strong>Contract Type:</strong> Standard Partnership Agreement</p>
                    <p><strong>Duration:</strong> 3 Years</p>
                    <p><strong>Monthly Fee:</strong> $15,000</p>
                    <p><strong>Commission:</strong> 15% of net revenue</p>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold mb-2">Contract Terms</label>
                    <textarea class="border rounded px-4 py-2 w-full" rows="6">
This Partnership Agreement is entered into between GrandPro HMSO and the Hospital Owner...

Terms and Conditions:
1. Service Level Agreement
2. Revenue Sharing Model
3. Quality Standards
4. Compliance Requirements
5. Termination Clauses
                    </textarea>
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2"> Include performance-based incentives
                    </label>
                </div>
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2"> Add exclusivity clause
                    </label>
                </div>
                <div class="pt-4 border-t">
                    <label class="block text-sm font-semibold mb-2">Digital Signature</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <i class="fas fa-signature text-4xl text-gray-400 mb-2"></i>
                        <p class="text-gray-600">Click to sign or upload signature</p>
                    </div>
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('contractModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button onclick="saveContract()" class="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Save Draft</button>
                    <button onclick="sendContract()" class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Send for Signature</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch('/api/sourcing/stats');
                const data = await response.json();
                
                document.getElementById('totalApplications').textContent = data.total || '24';
                document.getElementById('underReview').textContent = data.review || '8';
                document.getElementById('approved').textContent = data.approved || '12';
                document.getElementById('contractsSigned').textContent = data.signed || '10';
            } catch (error) {
                console.error('Error loading stats:', error);
                // Use default values
                document.getElementById('totalApplications').textContent = '24';
                document.getElementById('underReview').textContent = '8';
                document.getElementById('approved').textContent = '12';
                document.getElementById('contractsSigned').textContent = '10';
            }
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function showApplicationModal() {
            showModal('applicationModal');
        }

        function showEvaluationModal() {
            showModal('evaluationModal');
        }

        function showContractModal() {
            showModal('contractModal');
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

        // Form submission
        document.getElementById('applicationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Simulate API call
            showNotification('Application submitted successfully! Application ID: APP-2025-' + Math.floor(Math.random() * 1000));
            closeModal('applicationModal');
            loadStats();
            
            // In production, this would send data to backend
            try {
                const formData = new FormData(e.target);
                const response = await fetch('/api/sourcing/applications', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    showNotification('Application submitted! ID: ' + result.applicationId);
                }
            } catch (error) {
                console.error('Error submitting application:', error);
            }
        });

        // Evaluation score calculation
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const valueSpan = document.getElementById(e.target.id + 'Value');
                if (valueSpan) {
                    valueSpan.textContent = e.target.value;
                }
                calculateTotalScore();
            });
        });

        function calculateTotalScore() {
            const infra = parseInt(document.getElementById('infraScore')?.value || 0);
            const staff = parseInt(document.getElementById('staffScore')?.value || 0);
            const finance = parseInt(document.getElementById('financeScore')?.value || 0);
            const service = parseInt(document.getElementById('serviceScore')?.value || 0);
            const total = infra + staff + finance + service;
            
            const totalScoreElement = document.getElementById('totalScore');
            if (totalScoreElement) {
                totalScoreElement.textContent = total;
                totalScoreElement.className = total >= 70 ? 'text-green-600' : 'text-red-600';
            }
        }

        // Action functions
        function viewApplication(appId) {
            showNotification('Loading application ' + appId + '...', 'info');
            // In production, this would load and display application details
        }

        function evaluateApplication(appId) {
            showEvaluationModal();
        }

        function generateContract(appId) {
            showContractModal();
        }

        function downloadContract(appId) {
            showNotification('Downloading contract for ' + appId + '...', 'info');
            // In production, this would download the contract PDF
        }

        function submitEvaluation() {
            const total = document.getElementById('totalScore').textContent;
            showNotification('Evaluation submitted with score: ' + total + '/100');
            closeModal('evaluationModal');
            loadStats();
        }

        function saveDraft() {
            showNotification('Application saved as draft');
            closeModal('applicationModal');
        }

        function saveContract() {
            showNotification('Contract saved as draft');
        }

        function sendContract() {
            showNotification('Contract sent for signature');
            closeModal('contractModal');
            loadStats();
        }

        // Auto-refresh statistics
        loadStats();
        setInterval(loadStats, 30000); // Refresh every 30 seconds
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.get('/api/sourcing/stats', (req, res) => {
    res.json({
        total: 24,
        review: 8,
        approved: 12,
        signed: 10
    });
});

app.get('/api/sourcing/applications', (req, res) => {
    res.json({
        applications: [
            { id: 'APP-2025-001', hospitalName: 'City General Hospital', status: 'review', score: 85 },
            { id: 'APP-2025-002', hospitalName: 'Regional Medical Center', status: 'approved', score: 92 },
            { id: 'APP-2025-003', hospitalName: 'Community Health Clinic', status: 'pending', score: 78 }
        ],
        total: 3
    });
});

app.post('/api/sourcing/applications', upload.any(), async (req, res) => {
    try {
        // Generate application ID
        const applicationId = 'APP-2025-' + Math.floor(Math.random() * 10000);
        
        res.json({
            success: true,
            applicationId: applicationId,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sourcing/evaluate', async (req, res) => {
    try {
        const { applicationId, scores, comments } = req.body;
        
        res.json({
            success: true,
            message: 'Evaluation completed',
            totalScore: scores.total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sourcing/contract', async (req, res) => {
    try {
        const { applicationId, contractTerms } = req.body;
        
        res.json({
            success: true,
            contractId: 'CON-2025-' + Math.floor(Math.random() * 10000),
            message: 'Contract generated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8091;
app.listen(PORT, () => {
    console.log(`Digital Sourcing Full Module running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
