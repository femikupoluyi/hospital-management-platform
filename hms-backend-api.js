const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

// Database connection (simulated for now)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:m9TvxpxbEGNY@ep-morning-cell-a5m7aq6g.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// HMS API Endpoints
app.get('/api/hms/stats', (req, res) => {
    res.json({
        totalPatients: 342,
        todayAppointments: 78,
        pendingBills: 23,
        lowStockItems: 5,
        occupancyRate: 82,
        availableBeds: 18
    });
});

app.get('/api/hms/patients', (req, res) => {
    res.json([
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
        },
        {
            id: 'PAT002',
            firstName: 'Jane',
            lastName: 'Smith',
            dob: '1990-07-22',
            gender: 'Female',
            phone: '555-0102',
            email: 'jane.smith@email.com',
            address: '456 Oak Ave',
            medicalHistory: 'Diabetes Type 2',
            created_at: new Date()
        }
    ]);
});

app.post('/api/hms/patients', (req, res) => {
    const { firstName, lastName, dob, gender, phone, email, address, medicalHistory } = req.body;
    const patientId = `PAT${Date.now()}`;
    
    res.status(201).json({
        id: patientId,
        firstName,
        lastName,
        dob,
        gender,
        phone,
        email,
        address,
        medicalHistory,
        created_at: new Date(),
        message: 'Patient added successfully'
    });
});

app.delete('/api/hms/patients/:id', (req, res) => {
    res.json({ message: 'Patient deleted successfully', id: req.params.id });
});

app.get('/api/hms/billing', (req, res) => {
    res.json([
        {
            id: 'INV001',
            patientName: 'John Doe',
            amount: 250.00,
            status: 'Pending',
            type: 'Cash',
            description: 'Consultation and Lab Tests',
            date: new Date()
        },
        {
            id: 'INV002',
            patientName: 'Jane Smith',
            amount: 150.00,
            status: 'Paid',
            type: 'Insurance',
            description: 'Regular Checkup',
            date: new Date()
        }
    ]);
});

app.post('/api/hms/billing', (req, res) => {
    const { patientId, patientName, amount, type, description } = req.body;
    const billId = `INV${Date.now()}`;
    
    res.status(201).json({
        id: billId,
        patientId,
        patientName,
        amount,
        type,
        description,
        status: 'Pending',
        date: new Date(),
        message: 'Invoice created successfully'
    });
});

app.put('/api/hms/billing/:id/pay', (req, res) => {
    res.json({ message: 'Invoice marked as paid', id: req.params.id });
});

app.get('/api/hms/inventory', (req, res) => {
    res.json([
        {
            id: 'ITEM001',
            name: 'Paracetamol',
            category: 'Medicine',
            quantity: 500,
            minStock: 100,
            unit: 'tablets',
            expiryDate: '2025-12-31'
        },
        {
            id: 'ITEM002',
            name: 'Surgical Gloves',
            category: 'Consumable',
            quantity: 50,
            minStock: 200,
            unit: 'boxes',
            expiryDate: null
        },
        {
            id: 'ITEM003',
            name: 'Blood Pressure Monitor',
            category: 'Equipment',
            quantity: 10,
            minStock: 5,
            unit: 'units',
            expiryDate: null
        }
    ]);
});

app.post('/api/hms/inventory', (req, res) => {
    const { name, category, quantity, minStock, unit, expiryDate } = req.body;
    const itemId = `ITEM${Date.now()}`;
    
    res.status(201).json({
        id: itemId,
        name,
        category,
        quantity,
        minStock,
        unit,
        expiryDate,
        message: 'Item added successfully'
    });
});

app.get('/api/hms/staff', (req, res) => {
    res.json([
        {
            id: 'STAFF001',
            name: 'Dr. Robert Johnson',
            role: 'Doctor',
            department: 'Emergency',
            shift: 'Morning',
            phone: '555-1001',
            email: 'r.johnson@hospital.com',
            status: 'On Duty'
        },
        {
            id: 'STAFF002',
            name: 'Nurse Mary Wilson',
            role: 'Nurse',
            department: 'ICU',
            shift: 'Night',
            phone: '555-1002',
            email: 'm.wilson@hospital.com',
            status: 'Off Duty'
        }
    ]);
});

app.post('/api/hms/staff', (req, res) => {
    const { name, role, department, shift, phone, email } = req.body;
    const staffId = `STAFF${Date.now()}`;
    
    res.status(201).json({
        id: staffId,
        name,
        role,
        department,
        shift,
        phone,
        email,
        status: 'On Duty',
        message: 'Staff member added successfully'
    });
});

app.get('/api/hms/beds', (req, res) => {
    res.json({
        available: 18,
        occupied: 82,
        maintenance: 5,
        total: 105,
        beds: [
            {
                id: 'BED001',
                ward: 'General',
                patientName: 'John Doe',
                status: 'Occupied',
                admissionDate: new Date()
            },
            {
                id: 'BED002',
                ward: 'ICU',
                patientName: null,
                status: 'Available',
                admissionDate: null
            },
            {
                id: 'BED003',
                ward: 'Emergency',
                patientName: 'Jane Smith',
                status: 'Occupied',
                admissionDate: new Date()
            }
        ]
    });
});

app.post('/api/hms/admissions', (req, res) => {
    const { patientId, patientName, ward, bedNumber, reason } = req.body;
    const admissionId = `ADM${Date.now()}`;
    
    res.status(201).json({
        id: admissionId,
        patientId,
        patientName,
        ward,
        bedNumber,
        reason,
        admissionDate: new Date(),
        status: 'Active',
        message: 'Patient admitted successfully'
    });
});

app.put('/api/hms/beds/:id/discharge', (req, res) => {
    res.json({ message: 'Patient discharged successfully', bedId: req.params.id });
});

app.get('/api/hms/analytics', (req, res) => {
    res.json({
        monthlyRevenue: 125000,
        revenueGrowth: 12.5,
        patientsServed: 1847,
        avgWaitTime: 23,
        staffEfficiency: 87,
        departments: [
            {
                name: 'Emergency',
                patients: 523,
                revenue: 35000,
                satisfaction: 85
            },
            {
                name: 'General Medicine',
                patients: 892,
                revenue: 45000,
                satisfaction: 92
            },
            {
                name: 'ICU',
                patients: 127,
                revenue: 45000,
                satisfaction: 88
            }
        ]
    });
});

const PORT = process.env.HMS_API_PORT || 5602;
app.listen(PORT, () => {
    console.log(`HMS API Backend running on port ${PORT}`);
});
