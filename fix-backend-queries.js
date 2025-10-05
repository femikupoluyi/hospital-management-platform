const fs = require('fs');
const path = require('path');

// Fix HMS Backend Complete
function fixHMSBackend() {
    const filePath = '/root/hms-backend-complete.js';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix table names to use lowercase
    content = content.replace(/FROM "User"/g, 'FROM users');
    content = content.replace(/INTO "User"/g, 'INTO users');
    content = content.replace(/UPDATE "User"/g, 'UPDATE users');
    
    content = content.replace(/FROM Patient\b/g, 'FROM patients');
    content = content.replace(/INTO Patient\b/g, 'INTO patients');
    content = content.replace(/UPDATE Patient\b/g, 'UPDATE patients');
    
    content = content.replace(/FROM MedicalRecord\b/g, 'FROM medical_records');
    content = content.replace(/INTO MedicalRecord\b/g, 'INTO medical_records');
    content = content.replace(/UPDATE MedicalRecord\b/g, 'UPDATE medical_records');
    
    content = content.replace(/FROM Invoice\b/g, 'FROM invoices');
    content = content.replace(/INTO Invoice\b/g, 'INTO invoices');
    content = content.replace(/UPDATE Invoice\b/g, 'UPDATE invoices');
    
    content = content.replace(/FROM Payment\b/g, 'FROM payments');
    content = content.replace(/INTO Payment\b/g, 'INTO payments');
    
    content = content.replace(/FROM Inventory\b/g, 'FROM inventory_items');
    content = content.replace(/INTO Inventory\b/g, 'INTO inventory_items');
    content = content.replace(/UPDATE Inventory\b/g, 'UPDATE inventory_items');
    
    // Fix column names
    content = content.replace(/\bpatientId\b/g, 'patient_id');
    content = content.replace(/\bdoctorId\b/g, 'doctor_id');
    content = content.replace(/\binvoiceId\b/g, 'invoice_id');
    content = content.replace(/\binvoiceNumber\b/g, 'bill_number');
    content = content.replace(/\bdateOfBirth\b/g, 'dateofbirth');
    content = content.replace(/\btotalAmount\b/g, 'total_amount');
    content = content.replace(/\bdueDate\b/g, 'due_date');
    content = content.replace(/\bpaidAt\b/g, 'paid_at');
    content = content.replace(/\bcreatedAt\b/g, 'created_at');
    content = content.replace(/\bupdatedAt\b/g, 'updated_at');
    content = content.replace(/\breorderLevel\b/g, 'reorder_level');
    content = content.replace(/\bexpiryDate\b/g, 'expiry_date');
    content = content.replace(/\bvisitType\b/g, 'visit_type');
    content = content.replace(/\bpaymentMethod\b/g, 'payment_method');
    
    // Update the Invoice references to bills
    content = content.replace(/invoices/g, 'bills');
    content = content.replace(/invoice_id/g, 'bill_id');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed HMS Backend queries');
}

// Fix Digital Sourcing Backend
function fixDigitalSourcingBackend() {
    const filePath = '/root/digital-sourcing-complete.js';
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Change the schema creation to use UUID consistently
    content = content.replace(
        /id SERIAL PRIMARY KEY,[\s\n]*application_id VARCHAR\(50\) UNIQUE NOT NULL,/g,
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\napplication_id VARCHAR(50) UNIQUE NOT NULL,'
    );
    
    // Fix foreign key references
    content = content.replace(
        /application_id INTEGER REFERENCES/g,
        'application_id UUID REFERENCES'
    );
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed Digital Sourcing Backend queries');
}

// Fix CRM Backend
function fixCRMBackend() {
    const filePath = '/root/crm-system-complete.js';
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix table and column names
        content = content.replace(/crm_patients/g, 'patients');
        content = content.replace(/crm_appointments/g, 'appointments');
        content = content.replace(/crm_owners/g, 'owner_profiles');
        content = content.replace(/crm_payouts/g, 'owner_payouts');
        
        fs.writeFileSync(filePath, content);
        console.log('Fixed CRM Backend queries');
    }
}

// Run all fixes
try {
    fixHMSBackend();
    fixDigitalSourcingBackend();
    fixCRMBackend();
    console.log('All backend query fixes completed!');
} catch (error) {
    console.error('Error fixing backend queries:', error);
}
