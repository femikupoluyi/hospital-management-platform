const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

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

// Proxy API requests to enhanced backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true
}));

// In-memory data stores (in production, these would be in database)
const owners = new Map();
const patients = new Map();
const appointments = new Map();
const campaigns = new Map();
const communications = [];
const loyaltyPrograms = new Map();

// Initialize sample data
function initializeSampleData() {
    // Sample owners
    owners.set('OWN001', {
        id: 'OWN001',
        hospitalName: 'City General Hospital',
        ownerName: 'Dr. John Smith',
        email: 'john.smith@citygeneral.com',
        phone: '+1-555-0100',
        contractStatus: 'Active',
        contractStart: '2023-01-15',
        contractEnd: '2026-01-15',
        monthlyPayout: 15000,
        totalPayouts: 285000,
        satisfaction: 85,
        lastCommunication: '2025-01-03',
        communications: []
    });
    
    owners.set('OWN002', {
        id: 'OWN002',
        hospitalName: 'Riverside Medical Center',
        ownerName: 'Dr. Sarah Johnson',
        email: 'sarah.j@riverside.com',
        phone: '+1-555-0200',
        contractStatus: 'Active',
        contractStart: '2023-06-01',
        contractEnd: '2026-06-01',
        monthlyPayout: 18000,
        totalPayouts: 342000,
        satisfaction: 92,
        lastCommunication: '2025-01-04',
        communications: []
    });

    // Sample patients
    patients.set('PAT001', {
        id: 'PAT001',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@email.com',
        phone: '+1-555-1001',
        dateOfBirth: '1985-03-15',
        loyaltyTier: 'Gold',
        loyaltyPoints: 2500,
        totalVisits: 12,
        nextAppointment: '2025-01-10 10:00 AM',
        feedbackScore: 4.5,
        preferredChannel: 'WhatsApp',
        subscriptions: ['health-tips', 'appointment-reminders']
    });

    patients.set('PAT002', {
        id: 'PAT002',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert.chen@email.com',
        phone: '+1-555-1002',
        dateOfBirth: '1978-07-22',
        loyaltyTier: 'Platinum',
        loyaltyPoints: 5200,
        totalVisits: 28,
        nextAppointment: '2025-01-08 02:30 PM',
        feedbackScore: 4.8,
        preferredChannel: 'SMS',
        subscriptions: ['health-tips', 'promotional', 'appointment-reminders']
    });

    // Sample appointments
    appointments.set('APT001', {
        id: 'APT001',
        patientId: 'PAT001',
        patientName: 'Jane Doe',
        doctor: 'Dr. Smith',
        date: '2025-01-10',
        time: '10:00 AM',
        type: 'Follow-up',
        status: 'Confirmed',
        reminderSent: false
    });

    // Sample campaigns
    campaigns.set('CAMP001', {
        id: 'CAMP001',
        name: 'Health Awareness Week',
        target: 'All Patients',
        channels: ['Email', 'SMS', 'WhatsApp'],
        status: 'Active',
        sent: 1250,
        opened: 875,
        clicked: 320,
        converted: 45,
        startDate: '2025-01-01',
        endDate: '2025-01-07'
    });

    // Initialize loyalty programs
    loyaltyPrograms.set('default', {
        tiers: [
            { name: 'Silver', minPoints: 0, maxPoints: 999, benefits: ['5% discount', 'Priority booking'] },
            { name: 'Gold', minPoints: 1000, maxPoints: 2999, benefits: ['10% discount', 'Free health checkup', 'Priority booking'] },
            { name: 'Platinum', minPoints: 3000, maxPoints: null, benefits: ['15% discount', 'Free health checkup', 'VIP lounge access', 'Dedicated support'] }
        ],
        pointsPerVisit: 100,
        pointsPerReferral: 500
    });
}

// Initialize data on startup
initializeSampleData();

// Communication Integration Services
class CommunicationService {
    constructor() {
        this.whatsappQueue = [];
        this.smsQueue = [];
        this.emailQueue = [];
    }

    async sendWhatsApp(to, message, templateId = null) {
        // In production, integrate with WhatsApp Business API
        const whatsappMessage = {
            id: 'WA' + Date.now(),
            to: to,
            message: message,
            templateId: templateId,
            status: 'queued',
            timestamp: new Date().toISOString(),
            channel: 'WhatsApp'
        };
        this.whatsappQueue.push(whatsappMessage);
        communications.push(whatsappMessage);
        
        // Simulate sending
        setTimeout(() => {
            whatsappMessage.status = 'sent';
        }, 1000);
        
        return whatsappMessage;
    }

    async sendSMS(to, message) {
        // In production, integrate with Twilio or similar
        const smsMessage = {
            id: 'SMS' + Date.now(),
            to: to,
            message: message,
            status: 'queued',
            timestamp: new Date().toISOString(),
            channel: 'SMS'
        };
        this.smsQueue.push(smsMessage);
        communications.push(smsMessage);
        
        // Simulate sending
        setTimeout(() => {
            smsMessage.status = 'sent';
        }, 500);
        
        return smsMessage;
    }

    async sendEmail(to, subject, body, attachments = []) {
        // In production, use configured SMTP server
        const emailMessage = {
            id: 'EM' + Date.now(),
            to: to,
            subject: subject,
            body: body,
            attachments: attachments,
            status: 'queued',
            timestamp: new Date().toISOString(),
            channel: 'Email'
        };
        this.emailQueue.push(emailMessage);
        communications.push(emailMessage);
        
        // Simulate sending
        setTimeout(() => {
            emailMessage.status = 'sent';
        }, 800);
        
        return emailMessage;
    }

    async sendBulkCampaign(campaign) {
        const results = {
            total: 0,
            sent: 0,
            failed: 0,
            channels: {}
        };

        // Get target audience
        const targets = this.getTargetAudience(campaign.target);
        
        for (const target of targets) {
            for (const channel of campaign.channels) {
                try {
                    if (channel === 'WhatsApp' && target.phone) {
                        await this.sendWhatsApp(target.phone, campaign.message, campaign.templateId);
                        results.sent++;
                    } else if (channel === 'SMS' && target.phone) {
                        await this.sendSMS(target.phone, campaign.message);
                        results.sent++;
                    } else if (channel === 'Email' && target.email) {
                        await this.sendEmail(target.email, campaign.subject, campaign.message);
                        results.sent++;
                    }
                    results.total++;
                } catch (error) {
                    results.failed++;
                }
            }
        }
        
        return results;
    }

    getTargetAudience(targetType) {
        switch(targetType) {
            case 'All Patients':
                return Array.from(patients.values());
            case 'Loyalty Members':
                return Array.from(patients.values()).filter(p => p.loyaltyPoints > 0);
            case 'Hospital Owners':
                return Array.from(owners.values());
            default:
                return [];
        }
    }
}

const communicationService = new CommunicationService();

// Appointment Reminder Scheduler
cron.schedule('*/30 * * * *', () => {
    // Run every 30 minutes to check for upcoming appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    appointments.forEach((appointment) => {
        if (!appointment.reminderSent && appointment.status === 'Confirmed') {
            const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
            const hoursDiff = (appointmentDate - new Date()) / (1000 * 60 * 60);
            
            if (hoursDiff <= 24 && hoursDiff > 0) {
                // Send reminder
                const patient = patients.get(appointment.patientId);
                if (patient) {
                    const message = `Reminder: You have an appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}`;
                    
                    if (patient.preferredChannel === 'WhatsApp') {
                        communicationService.sendWhatsApp(patient.phone, message);
                    } else if (patient.preferredChannel === 'SMS') {
                        communicationService.sendSMS(patient.phone, message);
                    } else {
                        communicationService.sendEmail(patient.email, 'Appointment Reminder', message);
                    }
                    
                    appointment.reminderSent = true;
                }
            }
        }
    });
});

// Main CRM Dashboard with enhanced features
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
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
        .loyalty-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .loyalty-silver { background-color: #e5e7eb; color: #374151; }
        .loyalty-gold { background-color: #fef3c7; color: #92400e; }
        .loyalty-platinum { background-color: #ddd6fe; color: #5b21b6; }
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
                        <p class="text-sm text-gray-600">Hospital Owners & Patient Management</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">
                        <i class="fas fa-envelope text-blue-500"></i> ${communications.filter(c => c.channel === 'Email').length} |
                        <i class="fas fa-sms text-green-500"></i> ${communications.filter(c => c.channel === 'SMS').length} |
                        <i class="fab fa-whatsapp text-green-600"></i> ${communications.filter(c => c.channel === 'WhatsApp').length}
                    </span>
                    <a href="/" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-home"></i> Back to Platform
                    </a>
                </div>
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
                <button onclick="switchTab('appointments')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-calendar-check mr-2"></i>Appointments
                </button>
                <button onclick="switchTab('campaigns')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-bullhorn mr-2"></i>Campaigns
                </button>
                <button onclick="switchTab('loyalty')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-award mr-2"></i>Loyalty Program
                </button>
                <button onclick="switchTab('feedback')" class="tab-button px-6 py-3 font-semibold">
                    <i class="fas fa-star mr-2"></i>Feedback
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
                            <p class="text-2xl font-bold">${owners.size}</p>
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
                            <p class="text-2xl font-bold">${Array.from(owners.values()).filter(o => o.contractStatus === 'Active').length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-3 rounded-lg">
                            <i class="fas fa-dollar-sign text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Monthly Payouts</p>
                            <p class="text-2xl font-bold">$${Array.from(owners.values()).reduce((sum, o) => sum + o.monthlyPayout, 0).toLocaleString()}</p>
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
                            <p class="text-2xl font-bold">${Math.round(Array.from(owners.values()).reduce((sum, o) => sum + o.satisfaction, 0) / owners.size)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Owner Management -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Hospital Owners Management</h2>
                    <div class="space-x-2">
                        <button onclick="showPayoutModal()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-money-bill mr-2"></i>Process Payouts
                        </button>
                        <button onclick="showContractModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-file-contract mr-2"></i>Manage Contracts
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-3">Hospital</th>
                                <th class="text-left py-3">Owner</th>
                                <th class="text-left py-3">Contract</th>
                                <th class="text-left py-3">Monthly Payout</th>
                                <th class="text-left py-3">Total Paid</th>
                                <th class="text-left py-3">Satisfaction</th>
                                <th class="text-left py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ownersTable">
                            ${Array.from(owners.values()).map(owner => `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="py-3">${owner.hospitalName}</td>
                                    <td class="py-3">${owner.ownerName}</td>
                                    <td class="py-3">
                                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${owner.contractStatus}</span>
                                    </td>
                                    <td class="py-3">$${owner.monthlyPayout.toLocaleString()}</td>
                                    <td class="py-3">$${owner.totalPayouts.toLocaleString()}</td>
                                    <td class="py-3">
                                        <div class="flex items-center">
                                            <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                <div class="bg-green-600 h-2 rounded-full" style="width: ${owner.satisfaction}%"></div>
                                            </div>
                                            <span>${owner.satisfaction}%</span>
                                        </div>
                                    </td>
                                    <td class="py-3">
                                        <button onclick="sendOwnerMessage('${owner.id}')" class="text-blue-600 hover:underline mr-2">
                                            <i class="fas fa-envelope"></i>
                                        </button>
                                        <button onclick="viewOwnerDetails('${owner.id}')" class="text-green-600 hover:underline">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
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
                            <p class="text-2xl font-bold">${patients.size}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="fas fa-calendar-check text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Today's Appointments</p>
                            <p class="text-2xl font-bold">${appointments.size}</p>
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
                            <p class="text-2xl font-bold">${Array.from(patients.values()).filter(p => p.loyaltyPoints > 0).length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="fas fa-star text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Avg Feedback</p>
                            <p class="text-2xl font-bold">${(Array.from(patients.values()).reduce((sum, p) => sum + p.feedbackScore, 0) / patients.size).toFixed(1)}/5</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Patient Management -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Patient Management</h2>
                    <div class="space-x-2">
                        <button onclick="showPatientModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-user-plus mr-2"></i>Add Patient
                        </button>
                        <button onclick="sendBulkReminders()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-bell mr-2"></i>Send Reminders
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-3">Patient ID</th>
                                <th class="text-left py-3">Name</th>
                                <th class="text-left py-3">Contact</th>
                                <th class="text-left py-3">Loyalty Status</th>
                                <th class="text-left py-3">Points</th>
                                <th class="text-left py-3">Next Appointment</th>
                                <th class="text-left py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="patientsTable">
                            ${Array.from(patients.values()).map(patient => `
                                <tr class="border-b hover:bg-gray-50">
                                    <td class="py-3">${patient.id}</td>
                                    <td class="py-3">${patient.firstName} ${patient.lastName}</td>
                                    <td class="py-3">
                                        <div class="text-sm">
                                            <div>${patient.phone}</div>
                                            <div class="text-gray-500">${patient.email}</div>
                                        </div>
                                    </td>
                                    <td class="py-3">
                                        <span class="loyalty-badge loyalty-${patient.loyaltyTier.toLowerCase()}">${patient.loyaltyTier}</span>
                                    </td>
                                    <td class="py-3">${patient.loyaltyPoints}</td>
                                    <td class="py-3">${patient.nextAppointment || '-'}</td>
                                    <td class="py-3">
                                        <button onclick="sendPatientMessage('${patient.id}')" class="text-blue-600 hover:underline mr-2" title="Send Message">
                                            <i class="fas fa-comment"></i>
                                        </button>
                                        <button onclick="collectFeedback('${patient.id}')" class="text-yellow-600 hover:underline mr-2" title="Collect Feedback">
                                            <i class="fas fa-star"></i>
                                        </button>
                                        <button onclick="viewPatientHistory('${patient.id}')" class="text-green-600 hover:underline" title="View History">
                                            <i class="fas fa-history"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Appointments Tab -->
        <div id="appointments-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Appointment Scheduling</h2>
                    <button onclick="showAppointmentModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-calendar-plus mr-2"></i>New Appointment
                    </button>
                </div>
                
                <!-- Calendar View -->
                <div class="grid grid-cols-7 gap-2 mb-6">
                    <div class="text-center font-semibold py-2">Sun</div>
                    <div class="text-center font-semibold py-2">Mon</div>
                    <div class="text-center font-semibold py-2">Tue</div>
                    <div class="text-center font-semibold py-2">Wed</div>
                    <div class="text-center font-semibold py-2">Thu</div>
                    <div class="text-center font-semibold py-2">Fri</div>
                    <div class="text-center font-semibold py-2">Sat</div>
                    ${Array.from({length: 35}, (_, i) => {
                        const day = i - 4; // Start from correct day of week
                        if (day < 1 || day > 31) return '<div></div>';
                        const hasAppointment = day === 8 || day === 10;
                        return `
                            <div class="border rounded p-2 h-20 ${hasAppointment ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer">
                                <div class="font-semibold">${day}</div>
                                ${hasAppointment ? '<div class="text-xs text-blue-600">2 appointments</div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Appointments List -->
                <h3 class="text-lg font-semibold mb-3">Upcoming Appointments</h3>
                <div class="space-y-3">
                    ${Array.from(appointments.values()).map(apt => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded hover:bg-gray-100">
                            <div class="flex items-center">
                                <div class="bg-blue-100 p-2 rounded mr-3">
                                    <i class="fas fa-clock text-blue-600"></i>
                                </div>
                                <div>
                                    <p class="font-semibold">${apt.date} ${apt.time} - ${apt.patientName}</p>
                                    <p class="text-sm text-gray-600">${apt.type} - ${apt.doctor}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${apt.status}</span>
                                ${!apt.reminderSent ? `
                                    <button onclick="sendReminder('${apt.id}')" class="text-blue-600 hover:underline">
                                        <i class="fas fa-bell"></i>
                                    </button>
                                ` : '<i class="fas fa-check-circle text-green-500"></i>'}
                            </div>
                        </div>
                    `).join('')}
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
                            <p class="text-2xl font-bold">${campaigns.size}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-green-100 p-3 rounded-lg">
                            <i class="fab fa-whatsapp text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">WhatsApp Sent</p>
                            <p class="text-2xl font-bold">${communicationService.whatsappQueue.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-yellow-100 p-3 rounded-lg">
                            <i class="fas fa-sms text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">SMS Sent</p>
                            <p class="text-2xl font-bold">${communicationService.smsQueue.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="bg-purple-100 p-3 rounded-lg">
                            <i class="fas fa-envelope text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Emails Sent</p>
                            <p class="text-2xl font-bold">${communicationService.emailQueue.length}</p>
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
                
                <div class="space-y-4">
                    ${Array.from(campaigns.values()).map(campaign => `
                        <div class="border rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="font-semibold">${campaign.name}</h3>
                                    <p class="text-sm text-gray-600">Target: ${campaign.target} | Channels: ${campaign.channels.join(', ')}</p>
                                </div>
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${campaign.status}</span>
                            </div>
                            <div class="grid grid-cols-4 gap-4 mt-3 text-sm">
                                <div>
                                    <span class="text-gray-500">Sent:</span> 
                                    <span class="font-semibold">${campaign.sent}</span>
                                </div>
                                <div>
                                    <span class="text-gray-500">Opened:</span> 
                                    <span class="font-semibold">${campaign.opened} (${Math.round(campaign.opened/campaign.sent*100)}%)</span>
                                </div>
                                <div>
                                    <span class="text-gray-500">Clicked:</span> 
                                    <span class="font-semibold">${campaign.clicked} (${Math.round(campaign.clicked/campaign.sent*100)}%)</span>
                                </div>
                                <div>
                                    <span class="text-gray-500">Converted:</span> 
                                    <span class="font-semibold">${campaign.converted} (${Math.round(campaign.converted/campaign.sent*100)}%)</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Loyalty Program Tab -->
        <div id="loyalty-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">Loyalty Program Tiers</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="border rounded-lg p-4 bg-gray-50">
                        <div class="flex items-center mb-3">
                            <div class="bg-gray-300 p-2 rounded-full mr-3">
                                <i class="fas fa-medal text-white"></i>
                            </div>
                            <h3 class="font-semibold text-lg">Silver</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">0 - 999 points</p>
                        <ul class="space-y-1 text-sm">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>5% discount</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Priority booking</li>
                        </ul>
                    </div>
                    <div class="border rounded-lg p-4 bg-yellow-50">
                        <div class="flex items-center mb-3">
                            <div class="bg-yellow-500 p-2 rounded-full mr-3">
                                <i class="fas fa-medal text-white"></i>
                            </div>
                            <h3 class="font-semibold text-lg">Gold</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">1000 - 2999 points</p>
                        <ul class="space-y-1 text-sm">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>10% discount</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Free health checkup</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Priority booking</li>
                        </ul>
                    </div>
                    <div class="border rounded-lg p-4 bg-purple-50">
                        <div class="flex items-center mb-3">
                            <div class="bg-purple-600 p-2 rounded-full mr-3">
                                <i class="fas fa-medal text-white"></i>
                            </div>
                            <h3 class="font-semibold text-lg">Platinum</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">3000+ points</p>
                        <ul class="space-y-1 text-sm">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>15% discount</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Free health checkup</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>VIP lounge access</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Dedicated support</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Points System</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div class="border rounded p-4">
                        <h3 class="font-semibold mb-2">Earn Points</h3>
                        <ul class="space-y-2 text-sm">
                            <li class="flex justify-between">
                                <span>Per Visit</span>
                                <span class="font-semibold">100 points</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Per Referral</span>
                                <span class="font-semibold">500 points</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Health Screening</span>
                                <span class="font-semibold">200 points</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Feedback Submission</span>
                                <span class="font-semibold">50 points</span>
                            </li>
                        </ul>
                    </div>
                    <div class="border rounded p-4">
                        <h3 class="font-semibold mb-2">Redeem Points</h3>
                        <ul class="space-y-2 text-sm">
                            <li class="flex justify-between">
                                <span>$10 Voucher</span>
                                <span class="font-semibold">1000 points</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Free Consultation</span>
                                <span class="font-semibold">2500 points</span>
                            </li>
                            <li class="flex justify-between">
                                <span>Health Package</span>
                                <span class="font-semibold">5000 points</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feedback Tab -->
        <div id="feedback-tab" class="tab-content">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Feedback Collection</h2>
                    <button onclick="sendFeedbackRequest()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <i class="fas fa-paper-plane mr-2"></i>Request Feedback
                    </button>
                </div>
                
                <!-- Feedback Statistics -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">Average Score</span>
                            <i class="fas fa-star text-yellow-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-green-600">4.5/5</div>
                        <div class="text-sm text-gray-500">Based on ${patients.size * 5} reviews</div>
                    </div>
                    <div class="bg-blue-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">Response Rate</span>
                            <i class="fas fa-chart-line text-blue-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-blue-600">78%</div>
                        <div class="text-sm text-gray-500">Last 30 days</div>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">NPS Score</span>
                            <i class="fas fa-smile text-purple-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-purple-600">+42</div>
                        <div class="text-sm text-gray-500">Excellent</div>
                    </div>
                </div>

                <!-- Recent Feedback -->
                <h3 class="text-lg font-semibold mb-3">Recent Feedback</h3>
                <div class="space-y-3">
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center">
                                <span class="font-semibold">Jane Doe</span>
                                <span class="ml-2 text-yellow-500">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star-half-alt"></i>
                                </span>
                            </div>
                            <span class="text-sm text-gray-500">2 days ago</span>
                        </div>
                        <p class="text-gray-700">"Excellent service and very professional staff. The appointment scheduling was smooth."</p>
                    </div>
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center">
                                <span class="font-semibold">Robert Chen</span>
                                <span class="ml-2 text-yellow-500">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </span>
                            </div>
                            <span class="text-sm text-gray-500">5 days ago</span>
                        </div>
                        <p class="text-gray-700">"Best healthcare experience! The loyalty program benefits are amazing."</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Modals -->
    <!-- Campaign Modal -->
    <div id="campaignModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Create New Campaign</h2>
            <form id="campaignForm">
                <div class="space-y-4">
                    <input type="text" id="campaignName" placeholder="Campaign Name" class="border rounded px-4 py-2 w-full" required>
                    <select id="targetAudience" class="border rounded px-4 py-2 w-full" required>
                        <option value="">Select Target Audience</option>
                        <option>All Patients</option>
                        <option>Loyalty Members</option>
                        <option>Hospital Owners</option>
                        <option>Appointment Reminders</option>
                    </select>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Communication Channels</label>
                        <div class="space-x-4">
                            <label class="inline-flex items-center">
                                <input type="checkbox" id="channelWhatsApp" class="mr-2"> WhatsApp
                            </label>
                            <label class="inline-flex items-center">
                                <input type="checkbox" id="channelSMS" class="mr-2"> SMS
                            </label>
                            <label class="inline-flex items-center">
                                <input type="checkbox" id="channelEmail" class="mr-2" checked> Email
                            </label>
                        </div>
                    </div>
                    <input type="text" id="campaignSubject" placeholder="Subject (for email)" class="border rounded px-4 py-2 w-full">
                    <textarea id="campaignMessage" placeholder="Campaign Message" class="border rounded px-4 py-2 w-full" rows="4" required></textarea>
                    <div class="grid grid-cols-2 gap-4">
                        <input type="datetime-local" id="startDate" class="border rounded px-4 py-2" required>
                        <input type="datetime-local" id="endDate" class="border rounded px-4 py-2">
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
                    <select id="patientSelect" class="border rounded px-4 py-2" required>
                        <option value="">Select Patient</option>
                        ${Array.from(patients.values()).map(p => 
                            `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`
                        ).join('')}
                    </select>
                    <select id="doctorSelect" class="border rounded px-4 py-2" required>
                        <option value="">Select Doctor</option>
                        <option>Dr. Smith - General</option>
                        <option>Dr. Johnson - Cardiology</option>
                        <option>Dr. Williams - Pediatrics</option>
                    </select>
                    <input type="date" id="appointmentDate" class="border rounded px-4 py-2" required>
                    <input type="time" id="appointmentTime" class="border rounded px-4 py-2" required>
                    <select id="appointmentType" class="border rounded px-4 py-2" required>
                        <option value="">Appointment Type</option>
                        <option>Consultation</option>
                        <option>Follow-up</option>
                        <option>Emergency</option>
                        <option>Routine Checkup</option>
                    </select>
                    <div class="flex items-center">
                        <input type="checkbox" id="sendReminder" class="mr-2" checked>
                        <label for="sendReminder">Send reminder 24h before</label>
                    </div>
                    <textarea id="appointmentNotes" placeholder="Notes" class="border rounded px-4 py-2 col-span-2" rows="2"></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('appointmentModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Message Modal -->
    <div id="messageModal" class="modal">
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 class="text-2xl font-bold mb-6">Send Message</h2>
            <form id="messageForm">
                <div class="space-y-4">
                    <input type="text" id="recipientInfo" placeholder="Recipient" class="border rounded px-4 py-2 w-full" readonly>
                    <div>
                        <label class="block text-sm font-semibold mb-2">Channel</label>
                        <select id="messageChannel" class="border rounded px-4 py-2 w-full" required>
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                    </div>
                    <input type="text" id="messageSubject" placeholder="Subject (for email)" class="border rounded px-4 py-2 w-full">
                    <textarea id="messageContent" placeholder="Message" class="border rounded px-4 py-2 w-full" rows="6" required></textarea>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal('messageModal')" class="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Send</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Tab switching
        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function showCampaignModal() {
            showModal('campaignModal');
        }

        function showAppointmentModal() {
            showModal('appointmentModal');
        }

        function showPatientModal() {
            alert('Patient registration form would open here');
        }

        function showPayoutModal() {
            alert('Payout processing interface would open here');
        }

        function showContractModal() {
            alert('Contract management interface would open here');
        }

        // Message functions
        let currentRecipient = null;

        function sendOwnerMessage(ownerId) {
            currentRecipient = { type: 'owner', id: ownerId };
            document.getElementById('recipientInfo').value = 'Hospital Owner: ' + ownerId;
            showModal('messageModal');
        }

        function sendPatientMessage(patientId) {
            currentRecipient = { type: 'patient', id: patientId };
            document.getElementById('recipientInfo').value = 'Patient: ' + patientId;
            showModal('messageModal');
        }

        function sendBulkReminders() {
            if (confirm('Send appointment reminders to all patients with upcoming appointments?')) {
                fetch('/api/crm/reminders/send', { method: 'POST' })
                    .then(() => showNotification('Reminders sent successfully'))
                    .catch(() => showNotification('Failed to send reminders', 'error'));
            }
        }

        function sendReminder(appointmentId) {
            fetch('/api/crm/appointments/' + appointmentId + '/remind', { method: 'POST' })
                .then(() => showNotification('Reminder sent'))
                .catch(() => showNotification('Failed to send reminder', 'error'));
        }

        function collectFeedback(patientId) {
            if (confirm('Send feedback request to patient?')) {
                fetch('/api/crm/feedback/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId })
                })
                .then(() => showNotification('Feedback request sent'))
                .catch(() => showNotification('Failed to send request', 'error'));
            }
        }

        function sendFeedbackRequest() {
            if (confirm('Send feedback request to all recent patients?')) {
                fetch('/api/crm/feedback/bulk-request', { method: 'POST' })
                    .then(() => showNotification('Feedback requests sent'))
                    .catch(() => showNotification('Failed to send requests', 'error'));
            }
        }

        function viewOwnerDetails(ownerId) {
            alert('Viewing details for owner: ' + ownerId);
        }

        function viewPatientHistory(patientId) {
            alert('Viewing history for patient: ' + patientId);
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
        document.getElementById('campaignForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('campaignName').value,
                target: document.getElementById('targetAudience').value,
                channels: [],
                subject: document.getElementById('campaignSubject').value,
                message: document.getElementById('campaignMessage').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value
            };
            
            if (document.getElementById('channelWhatsApp').checked) formData.channels.push('WhatsApp');
            if (document.getElementById('channelSMS').checked) formData.channels.push('SMS');
            if (document.getElementById('channelEmail').checked) formData.channels.push('Email');
            
            try {
                const response = await fetch('/api/crm/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                showNotification('Campaign launched successfully!');
                closeModal('campaignModal');
                document.getElementById('campaignForm').reset();
            } catch (error) {
                showNotification('Error launching campaign', 'error');
            }
        });

        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                patientId: document.getElementById('patientSelect').value,
                doctor: document.getElementById('doctorSelect').value,
                date: document.getElementById('appointmentDate').value,
                time: document.getElementById('appointmentTime').value,
                type: document.getElementById('appointmentType').value,
                sendReminder: document.getElementById('sendReminder').checked,
                notes: document.getElementById('appointmentNotes').value
            };
            
            try {
                const response = await fetch('/api/crm/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                showNotification('Appointment scheduled successfully');
                closeModal('appointmentModal');
                document.getElementById('appointmentForm').reset();
            } catch (error) {
                showNotification('Error scheduling appointment', 'error');
            }
        });

        document.getElementById('messageForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                recipient: currentRecipient,
                channel: document.getElementById('messageChannel').value,
                subject: document.getElementById('messageSubject').value,
                content: document.getElementById('messageContent').value
            };
            
            try {
                const response = await fetch('/api/crm/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                showNotification('Message sent successfully');
                closeModal('messageModal');
                document.getElementById('messageForm').reset();
            } catch (error) {
                showNotification('Error sending message', 'error');
            }
        });
    </script>
</body>
</html>
    `);
});

// API Endpoints
app.get('/api/crm/owner-stats', (req, res) => {
    res.json({
        hospitals: owners.size,
        contracts: Array.from(owners.values()).filter(o => o.contractStatus === 'Active').length,
        revenue: Array.from(owners.values()).reduce((sum, o) => sum + o.monthlyPayout, 0),
        satisfaction: Math.round(Array.from(owners.values()).reduce((sum, o) => sum + o.satisfaction, 0) / owners.size)
    });
});

app.get('/api/crm/patient-stats', (req, res) => {
    res.json({
        patients: patients.size,
        appointments: appointments.size,
        loyalty: Array.from(patients.values()).filter(p => p.loyaltyPoints > 0).length,
        feedback: (Array.from(patients.values()).reduce((sum, p) => sum + p.feedbackScore, 0) / patients.size).toFixed(1)
    });
});

app.get('/api/crm/campaign-stats', (req, res) => {
    res.json({
        campaigns: campaigns.size,
        openRate: 68,
        sms: communicationService.smsQueue.length,
        whatsapp: communicationService.whatsappQueue.length
    });
});

// Owner Management APIs
app.get('/api/crm/owners', (req, res) => {
    res.json(Array.from(owners.values()));
});

app.post('/api/crm/owners/:id/payout', (req, res) => {
    const owner = owners.get(req.params.id);
    if (owner) {
        owner.totalPayouts += owner.monthlyPayout;
        res.json({ success: true, amount: owner.monthlyPayout });
    } else {
        res.status(404).json({ error: 'Owner not found' });
    }
});

app.post('/api/crm/owners/:id/satisfaction', (req, res) => {
    const owner = owners.get(req.params.id);
    if (owner) {
        owner.satisfaction = req.body.satisfaction;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Owner not found' });
    }
});

// Patient Management APIs
app.get('/api/crm/patients', (req, res) => {
    res.json(Array.from(patients.values()));
});

app.post('/api/crm/patients/:id/points', (req, res) => {
    const patient = patients.get(req.params.id);
    if (patient) {
        patient.loyaltyPoints += req.body.points;
        // Update tier based on points
        if (patient.loyaltyPoints >= 3000) {
            patient.loyaltyTier = 'Platinum';
        } else if (patient.loyaltyPoints >= 1000) {
            patient.loyaltyTier = 'Gold';
        } else {
            patient.loyaltyTier = 'Silver';
        }
        res.json({ success: true, newPoints: patient.loyaltyPoints, newTier: patient.loyaltyTier });
    } else {
        res.status(404).json({ error: 'Patient not found' });
    }
});

// Appointment APIs
app.get('/api/crm/appointments', (req, res) => {
    res.json(Array.from(appointments.values()));
});

app.post('/api/crm/appointments', (req, res) => {
    const appointmentId = 'APT' + Date.now();
    const appointment = {
        id: appointmentId,
        ...req.body,
        status: 'Confirmed',
        reminderSent: false
    };
    appointments.set(appointmentId, appointment);
    
    // Schedule reminder if requested
    if (req.body.sendReminder) {
        // Reminder will be sent by the cron job
    }
    
    res.json({ success: true, appointmentId });
});

app.post('/api/crm/appointments/:id/remind', async (req, res) => {
    const appointment = appointments.get(req.params.id);
    if (appointment) {
        const patient = patients.get(appointment.patientId);
        if (patient) {
            const message = `Reminder: Appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}`;
            
            if (patient.preferredChannel === 'WhatsApp') {
                await communicationService.sendWhatsApp(patient.phone, message);
            } else if (patient.preferredChannel === 'SMS') {
                await communicationService.sendSMS(patient.phone, message);
            } else {
                await communicationService.sendEmail(patient.email, 'Appointment Reminder', message);
            }
            
            appointment.reminderSent = true;
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Patient not found' });
        }
    } else {
        res.status(404).json({ error: 'Appointment not found' });
    }
});

// Campaign APIs
app.post('/api/crm/campaigns', async (req, res) => {
    const campaignId = 'CAMP' + Date.now();
    const campaign = {
        id: campaignId,
        ...req.body,
        status: 'Active',
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0
    };
    
    campaigns.set(campaignId, campaign);
    
    // Launch campaign
    const results = await communicationService.sendBulkCampaign(campaign);
    campaign.sent = results.sent;
    
    res.json({ success: true, campaignId, results });
});

// Message APIs
app.post('/api/crm/messages', async (req, res) => {
    const { recipient, channel, subject, content } = req.body;
    let result;
    
    if (recipient.type === 'owner') {
        const owner = owners.get(recipient.id);
        if (owner) {
            if (channel === 'whatsapp') {
                result = await communicationService.sendWhatsApp(owner.phone, content);
            } else if (channel === 'sms') {
                result = await communicationService.sendSMS(owner.phone, content);
            } else {
                result = await communicationService.sendEmail(owner.email, subject || 'Message from GrandPro HMSO', content);
            }
            owner.lastCommunication = new Date().toISOString();
        }
    } else if (recipient.type === 'patient') {
        const patient = patients.get(recipient.id);
        if (patient) {
            if (channel === 'whatsapp') {
                result = await communicationService.sendWhatsApp(patient.phone, content);
            } else if (channel === 'sms') {
                result = await communicationService.sendSMS(patient.phone, content);
            } else {
                result = await communicationService.sendEmail(patient.email, subject || 'Message from GrandPro HMSO', content);
            }
        }
    }
    
    res.json({ success: true, messageId: result?.id });
});

// Feedback APIs
app.post('/api/crm/feedback/request', async (req, res) => {
    const { patientId } = req.body;
    const patient = patients.get(patientId);
    
    if (patient) {
        const message = 'Please rate your recent experience with us: [feedback link]';
        
        if (patient.preferredChannel === 'WhatsApp') {
            await communicationService.sendWhatsApp(patient.phone, message);
        } else if (patient.preferredChannel === 'SMS') {
            await communicationService.sendSMS(patient.phone, message);
        } else {
            await communicationService.sendEmail(patient.email, 'We value your feedback', message);
        }
        
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Patient not found' });
    }
});

app.post('/api/crm/feedback/bulk-request', async (req, res) => {
    let sent = 0;
    
    for (const patient of patients.values()) {
        const message = 'Please rate your recent experience with us: [feedback link]';
        
        if (patient.preferredChannel === 'WhatsApp') {
            await communicationService.sendWhatsApp(patient.phone, message);
        } else if (patient.preferredChannel === 'SMS') {
            await communicationService.sendSMS(patient.phone, message);
        } else {
            await communicationService.sendEmail(patient.email, 'We value your feedback', message);
        }
        sent++;
    }
    
    res.json({ success: true, sent });
});

// Reminder Service
app.post('/api/crm/reminders/send', async (req, res) => {
    let sent = 0;
    
    for (const appointment of appointments.values()) {
        if (!appointment.reminderSent && appointment.status === 'Confirmed') {
            const patient = patients.get(appointment.patientId);
            if (patient) {
                const message = `Reminder: Appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}`;
                
                if (patient.preferredChannel === 'WhatsApp') {
                    await communicationService.sendWhatsApp(patient.phone, message);
                } else if (patient.preferredChannel === 'SMS') {
                    await communicationService.sendSMS(patient.phone, message);
                } else {
                    await communicationService.sendEmail(patient.email, 'Appointment Reminder', message);
                }
                
                appointment.reminderSent = true;
                sent++;
            }
        }
    }
    
    res.json({ success: true, sent });
});

// Communication History
app.get('/api/crm/communications', (req, res) => {
    res.json(communications.slice(-100)); // Last 100 communications
});

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
    console.log(`CRM Enhanced Module running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
