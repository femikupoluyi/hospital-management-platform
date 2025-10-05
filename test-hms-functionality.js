#!/usr/bin/env node

const axios = require('axios').default;

const BASE_URL = 'https://grandpro-hmso-morphvm-mkofwuzh.http.cloud.morph.so';

async function testHMSFunctionality() {
    console.log('🏥 Testing HMS Module Functionality');
    console.log('====================================\n');
    
    try {
        // Test 1: Main HMS Page
        console.log('1. Testing HMS Main Page...');
        const mainPage = await axios.get(`${BASE_URL}/hms`);
        if (mainPage.status === 200) {
            console.log('   ✅ HMS page loads successfully');
            const hasForm = mainPage.data.includes('<form');
            const hasButtons = mainPage.data.includes('<button');
            console.log(`   ${hasForm ? '✅' : '❌'} Forms detected`);
            console.log(`   ${hasButtons ? '✅' : '❌'} Interactive buttons detected`);
        }
        
        // Test 2: HMS Stats API
        console.log('\n2. Testing HMS Stats API...');
        try {
            const stats = await axios.get(`${BASE_URL}/hms/api/hms/stats`);
            console.log('   ✅ Stats API working');
            console.log('   Data:', JSON.stringify(stats.data, null, 2).substring(0, 200));
        } catch (error) {
            console.log('   ❌ Stats API failed:', error.response?.status || error.message);
        }
        
        // Test 3: Patient Management
        console.log('\n3. Testing Patient Management...');
        
        // Get patients
        try {
            const patients = await axios.get(`${BASE_URL}/hms/api/hms/patients`);
            console.log('   ✅ Get patients API working');
            console.log('   Patients found:', Array.isArray(patients.data) ? patients.data.length : 0);
        } catch (error) {
            console.log('   ❌ Get patients failed:', error.response?.status || error.message);
        }
        
        // Create patient
        try {
            const newPatient = {
                firstName: 'Test',
                lastName: 'Patient',
                dob: '1990-01-01',
                gender: 'Male',
                phone: '555-TEST',
                email: 'test@example.com',
                address: 'Test Address',
                medicalHistory: 'Test History'
            };
            
            const createResponse = await axios.post(`${BASE_URL}/hms/api/hms/patients`, newPatient);
            if (createResponse.data.success) {
                console.log('   ✅ Create patient API working');
                console.log('   Patient ID:', createResponse.data.patient?.id);
            }
        } catch (error) {
            console.log('   ❌ Create patient failed:', error.response?.status || error.message);
        }
        
        // Test 4: Billing/Invoice Management
        console.log('\n4. Testing Billing Management...');
        
        // Get invoices
        try {
            const invoices = await axios.get(`${BASE_URL}/hms/api/hms/invoices`);
            console.log('   ✅ Get invoices API working');
            console.log('   Invoices found:', Array.isArray(invoices.data) ? invoices.data.length : 0);
        } catch (error) {
            console.log('   ❌ Get invoices failed:', error.response?.status || error.message);
        }
        
        // Create invoice
        try {
            const newInvoice = {
                patientName: 'Test Patient',
                serviceType: 'Consultation',
                amount: 5000,
                paymentMethod: 'Cash',
                invoiceDate: new Date().toISOString(),
                description: 'Test invoice'
            };
            
            const invoiceResponse = await axios.post(`${BASE_URL}/hms/api/hms/invoices`, newInvoice);
            if (invoiceResponse.data.success) {
                console.log('   ✅ Create invoice API working');
                console.log('   Invoice ID:', invoiceResponse.data.invoice?.id);
            }
        } catch (error) {
            console.log('   ❌ Create invoice failed:', error.response?.status || error.message);
        }
        
        // Test 5: Inventory Management
        console.log('\n5. Testing Inventory Management...');
        
        // Get inventory
        try {
            const inventory = await axios.get(`${BASE_URL}/hms/api/hms/inventory`);
            console.log('   ✅ Get inventory API working');
            console.log('   Items found:', Array.isArray(inventory.data) ? inventory.data.length : 0);
        } catch (error) {
            console.log('   ❌ Get inventory failed:', error.response?.status || error.message);
        }
        
        // Add stock
        try {
            const newStock = {
                itemName: 'Test Medicine',
                category: 'Medicine',
                quantity: 100,
                unit: 'Tablets',
                unitPrice: 10,
                supplier: 'Test Supplier',
                expiryDate: '2026-12-31',
                reorderLevel: 20
            };
            
            const stockResponse = await axios.post(`${BASE_URL}/hms/api/hms/inventory`, newStock);
            if (stockResponse.data.success) {
                console.log('   ✅ Add stock API working');
                console.log('   Item ID:', stockResponse.data.item?.id);
            }
        } catch (error) {
            console.log('   ❌ Add stock failed:', error.response?.status || error.message);
        }
        
        // Test 6: Staff Scheduling
        console.log('\n6. Testing Staff Management...');
        
        // Get schedules
        try {
            const schedules = await axios.get(`${BASE_URL}/hms/api/hms/schedule`);
            console.log('   ✅ Get schedules API working');
            console.log('   Schedules found:', Array.isArray(schedules.data) ? schedules.data.length : 0);
        } catch (error) {
            console.log('   ❌ Get schedules failed:', error.response?.status || error.message);
        }
        
        // Add schedule
        try {
            const newSchedule = {
                staffName: 'Test Doctor',
                department: 'Emergency',
                shift: 'Morning',
                scheduleDate: new Date().toISOString(),
                role: 'Doctor'
            };
            
            const scheduleResponse = await axios.post(`${BASE_URL}/hms/api/hms/schedule`, newSchedule);
            if (scheduleResponse.data.success) {
                console.log('   ✅ Add schedule API working');
                console.log('   Schedule ID:', scheduleResponse.data.schedule?.id);
            }
        } catch (error) {
            console.log('   ❌ Add schedule failed:', error.response?.status || error.message);
        }
        
        // Test 7: Bed Management/Admissions
        console.log('\n7. Testing Bed Management...');
        
        // Get admissions
        try {
            const admissions = await axios.get(`${BASE_URL}/hms/api/hms/admissions`);
            console.log('   ✅ Get admissions API working');
            console.log('   Admissions found:', Array.isArray(admissions.data) ? admissions.data.length : 0);
        } catch (error) {
            console.log('   ❌ Get admissions failed:', error.response?.status || error.message);
        }
        
        // Create admission
        try {
            const newAdmission = {
                patientName: 'Test Patient',
                wardType: 'General',
                bedNumber: 'B-999',
                doctor: 'Dr. Test'
            };
            
            const admissionResponse = await axios.post(`${BASE_URL}/hms/api/hms/admissions`, newAdmission);
            if (admissionResponse.data.success) {
                console.log('   ✅ Create admission API working');
                console.log('   Admission ID:', admissionResponse.data.admission?.id);
            }
        } catch (error) {
            console.log('   ❌ Create admission failed:', error.response?.status || error.message);
        }
        
        console.log('\n====================================');
        console.log('✅ HMS Module Test Complete');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testHMSFunctionality();
