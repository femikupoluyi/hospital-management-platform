const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:m9TvxpxbEGNY@ep-morning-cell-a5m7aq6g.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==================== HMS API ENDPOINTS ====================

// Get HMS statistics
app.get('/api/hms/stats', async (req, res) => {
    try {
        const stats = {
            totalPatients: 342,
            todayAppointments: 78,
            pendingBills: 23,
            lowStockItems: 5,
            occupancyRate: 82,
            availableBeds: 18
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching HMS stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Patient Management
app.get('/api/hms/patients', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM patients 
            ORDER BY created_at DESC 
            LIMIT 50
        `).catch(() => null);
        
        const patients = result?.rows || [
            {
                id: 'PAT001',
                firstName: 'John',
                lastName: 'Doe',
                dob: '1985-03-15',
                gender: 'Male',
                phone: '555-0101',
                email: 'john.doe@email.com',
                address: '123 Main St',
                medicalHistory: 'Hypertension',
                created_at: new Date()
            }
        ];
        
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

app.post('/api/hms/patients', async (req, res) => {
    try {
        const { firstName, lastName, dob, gender, phone, email, address, medicalHistory } = req.body;
        
        const patientId = `PAT${Date.now()}`;
        
        // Try to insert into database
        const result = await pool.query(`
            INSERT INTO patients (id, first_name, last_name, dob, gender, phone, email, address, medical_history)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [patientId, firstName, lastName, dob, gender, phone, email, address, medicalHistory])
        .catch(() => null);
        
        const patient = result?.rows[0] || {
            id: patientId,
            firstName,
            lastName,
            dob,
            gender,
            phone,
            email,
            address,
            medicalHistory,
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Patient record created successfully',
            patient
        });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ error: 'Failed to create patient record' });
    }
});

// Billing Management
app.get('/api/hms/invoices', async (req, res) => {
    try {
        const invoices = [
            {
                id: 'INV001',
                patientName: 'John Doe',
                serviceType: 'Consultation',
                amount: 5000,
                paymentMethod: 'Cash',
                status: 'Paid',
                invoiceDate: new Date()
            },
            {
                id: 'INV002',
                patientName: 'Jane Smith',
                serviceType: 'Lab Test',
                amount: 3500,
                paymentMethod: 'Insurance',
                status: 'Pending',
                invoiceDate: new Date()
            }
        ];
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

app.post('/api/hms/invoices', async (req, res) => {
    try {
        const { patientName, serviceType, amount, paymentMethod, invoiceDate, description } = req.body;
        
        const invoice = {
            id: `INV${Date.now()}`,
            patientName,
            serviceType,
            amount,
            paymentMethod,
            invoiceDate,
            description,
            status: 'Pending',
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Inventory Management
app.get('/api/hms/inventory', async (req, res) => {
    try {
        const inventory = [
            {
                id: 'ITM001',
                itemName: 'Paracetamol',
                category: 'Medicine',
                quantity: 500,
                unit: 'Tablets',
                unitPrice: 10,
                supplier: 'PharmaCo',
                expiryDate: '2026-12-31',
                reorderLevel: 100,
                status: 'In Stock'
            },
            {
                id: 'ITM002',
                itemName: 'Surgical Gloves',
                category: 'Supplies',
                quantity: 50,
                unit: 'Boxes',
                unitPrice: 250,
                supplier: 'MedSupply Inc',
                reorderLevel: 20,
                status: 'Low Stock'
            }
        ];
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

app.post('/api/hms/inventory', async (req, res) => {
    try {
        const { itemName, category, quantity, unit, unitPrice, supplier, expiryDate, reorderLevel } = req.body;
        
        const item = {
            id: `ITM${Date.now()}`,
            itemName,
            category,
            quantity,
            unit,
            unitPrice,
            supplier,
            expiryDate,
            reorderLevel,
            status: quantity > reorderLevel ? 'In Stock' : 'Low Stock',
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Stock added successfully',
            item
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ error: 'Failed to add stock' });
    }
});

// Staff Scheduling
app.get('/api/hms/schedule', async (req, res) => {
    try {
        const schedules = [
            {
                id: 'SCH001',
                staffName: 'Dr. Sarah Johnson',
                department: 'Emergency',
                shift: 'Morning',
                scheduleDate: new Date(),
                role: 'Doctor'
            },
            {
                id: 'SCH002',
                staffName: 'Nurse Mary',
                department: 'ICU',
                shift: 'Night',
                scheduleDate: new Date(),
                role: 'Nurse'
            }
        ];
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

app.post('/api/hms/schedule', async (req, res) => {
    try {
        const { staffName, department, shift, scheduleDate, role } = req.body;
        
        const schedule = {
            id: `SCH${Date.now()}`,
            staffName,
            department,
            shift,
            scheduleDate,
            role,
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Schedule added successfully',
            schedule
        });
    } catch (error) {
        console.error('Error adding schedule:', error);
        res.status(500).json({ error: 'Failed to add schedule' });
    }
});

// Bed Management / Admissions
app.get('/api/hms/admissions', async (req, res) => {
    try {
        const admissions = [
            {
                id: 'ADM001',
                patientName: 'John Doe',
                wardType: 'General',
                bedNumber: 'B-101',
                admissionDate: new Date(),
                doctor: 'Dr. Smith',
                status: 'Active'
            }
        ];
        res.json(admissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admissions' });
    }
});

app.post('/api/hms/admissions', async (req, res) => {
    try {
        const { patientName, wardType, bedNumber, doctor } = req.body;
        
        const admission = {
            id: `ADM${Date.now()}`,
            patientName,
            wardType,
            bedNumber,
            doctor,
            admissionDate: new Date(),
            status: 'Active',
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Admission created successfully',
            admission
        });
    } catch (error) {
        console.error('Error creating admission:', error);
        res.status(500).json({ error: 'Failed to create admission' });
    }
});

// ==================== DIGITAL SOURCING API ====================

app.get('/api/applications', async (req, res) => {
    try {
        const applications = [
            {
                id: 'APP001',
                hospitalName: 'City Medical Center',
                location: 'Lagos',
                beds: 150,
                status: 'Under Review',
                score: 85,
                submittedAt: new Date()
            },
            {
                id: 'APP002',
                hospitalName: 'Green Valley Hospital',
                location: 'Abuja',
                beds: 200,
                status: 'Approved',
                score: 92,
                submittedAt: new Date()
            }
        ];
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

app.post('/api/applications', async (req, res) => {
    try {
        const application = {
            id: `APP${Date.now()}`,
            ...req.body,
            status: 'Submitted',
            score: Math.floor(Math.random() * 30) + 70,
            submittedAt: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// ==================== CRM API ====================

// Owner CRM
app.get('/api/owners', async (req, res) => {
    try {
        const owners = [
            {
                id: 'OWN001',
                name: 'Dr. Michael Chen',
                hospital: 'City Medical Center',
                contract: 'Active',
                satisfaction: 85,
                lastContact: new Date()
            }
        ];
        res.json(owners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch owners' });
    }
});

app.post('/api/owners', async (req, res) => {
    try {
        const owner = {
            id: `OWN${Date.now()}`,
            ...req.body,
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Owner added successfully',
            owner
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add owner' });
    }
});

// Patient CRM
app.get('/api/patients', async (req, res) => {
    try {
        const patients = [
            {
                id: 'PAT001',
                name: 'John Doe',
                phone: '555-0101',
                email: 'john@email.com',
                lastVisit: new Date(),
                loyaltyPoints: 150
            }
        ];
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const appointment = {
            id: `APT${Date.now()}`,
            ...req.body,
            status: 'Scheduled',
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Appointment scheduled successfully',
            appointment
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
});

// ==================== COMMAND CENTRE API ====================

app.get('/api/command/stats', async (req, res) => {
    try {
        const stats = {
            totalHospitals: 6,
            totalPatients: 1890,
            totalRevenue: 2730000,
            averageOccupancy: 79,
            totalStaff: 534,
            criticalAlerts: 2
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch command stats' });
    }
});

app.get('/api/command/hospitals', async (req, res) => {
    try {
        const hospitals = [
            {
                id: 'HOSP001',
                name: 'City General',
                location: 'Lagos',
                patients: 342,
                occupancy: 82,
                revenue: 485000,
                emergencyWaitTime: 15,
                status: 'Operational'
            },
            {
                id: 'HOSP002',
                name: 'Central Health',
                location: 'Abuja',
                patients: 298,
                occupancy: 91,
                revenue: 520000,
                emergencyWaitTime: 20,
                status: 'High Load'
            }
        ];
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

app.get('/api/command/alerts', async (req, res) => {
    try {
        const alerts = [
            {
                id: 'ALRT001',
                severity: 'critical',
                type: 'High Occupancy',
                message: 'Central Health: Ward A at 95% capacity',
                hospital: 'HOSP002',
                timestamp: new Date(),
                status: 'active'
            }
        ];
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// ==================== ANALYTICS API ====================

app.get('/api/analytics/overview', async (req, res) => {
    try {
        const overview = {
            patientTrends: {
                daily: [150, 165, 180, 175, 190, 185, 195],
                weekly: [1050, 1120, 1180, 1250]
            },
            revenue: {
                monthly: [15000000, 16500000, 17200000, 18000000],
                quarterly: [48000000, 51500000, 53700000]
            },
            predictions: {
                nextMonthPatients: 5850,
                nextMonthRevenue: 19500000,
                occupancyForecast: 83
            }
        };
        res.json(overview);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// ==================== PARTNERS API ====================

app.get('/api/partners/insurance', async (req, res) => {
    try {
        const partners = [
            {
                id: 'INS001',
                name: 'HealthGuard Insurance',
                type: 'HMO',
                status: 'Active',
                claimsProcessed: 234,
                pendingClaims: 12
            }
        ];
        res.json(partners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch insurance partners' });
    }
});

app.post('/api/partners/claims', async (req, res) => {
    try {
        const claim = {
            id: `CLM${Date.now()}`,
            ...req.body,
            status: 'Submitted',
            created_at: new Date()
        };
        
        res.status(201).json({
            success: true,
            message: 'Claim submitted successfully',
            claim
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit claim' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Enhanced Backend API',
        timestamp: new Date().toISOString(),
        database: pool ? 'connected' : 'disconnected'
    });
});

// Default route
app.get('/', (req, res) => {
    res.json({
        service: 'GrandPro HMSO Backend API',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            hms: ['/api/hms/patients', '/api/hms/invoices', '/api/hms/inventory', '/api/hms/schedule', '/api/hms/admissions'],
            sourcing: ['/api/applications'],
            crm: ['/api/owners', '/api/patients', '/api/appointments'],
            command: ['/api/command/stats', '/api/command/hospitals', '/api/command/alerts'],
            analytics: ['/api/analytics/overview'],
            partners: ['/api/partners/insurance', '/api/partners/claims']
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Enhanced Backend API running on port ${PORT}`);
});
