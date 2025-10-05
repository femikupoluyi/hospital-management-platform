const fs = require('fs');

// Read the HMS backend file
let hmsContent = fs.readFileSync('/root/hms-backend-complete.js', 'utf8');

// Fix the user query properly - users table doesn't have quotes on column names
hmsContent = hmsContent.replace(
    'SELECT * FROM users WHERE "email" = $1',
    'SELECT * FROM users WHERE email = $1'
);

// Fix the patient queries
hmsContent = hmsContent.replace(
    `SELECT p.*, pp.blood_group, pp.allergies, pp.medical_history
             FROM patients p`,
    `SELECT p.*, pp.blood_group, pp.allergies, pp.medical_history
             FROM patients p`
);

// Fix INSERT queries for patients - need to use correct column names
hmsContent = hmsContent.replace(
    'INSERT INTO patients (name, email, phone, dateofbirth, gender, address, created_at, updated_at)',
    'INSERT INTO patients (name, email, phone, dateofbirth, gender, address, created_at, updated_at)'
);

// Fix medical records table reference
hmsContent = hmsContent.replace(
    `SELECT mr.*, p.name as patient_name, sm.name as doctor_name
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.id
            LEFT JOIN StaffMember sm ON mr.doctor_id = sm.id`,
    `SELECT mr.*, p.name as patient_name, s.name as doctor_name
            FROM medical_records mr
            LEFT JOIN patients p ON mr.patient_id = p.id
            LEFT JOIN staff s ON mr.doctor_id = s.id`
);

// Fix StaffMember references
hmsContent = hmsContent.replace(/StaffMember/g, 'staff');

// Fix bills queries
hmsContent = hmsContent.replace(
    `SELECT i.*, p.name as patient_name
             FROM bills i
             LEFT JOIN patients p ON i.patient_id = p.id`,
    `SELECT b.*, p.name as patient_name
             FROM bills b
             LEFT JOIN patients p ON b.patient_id = p.id`
);

// Fix Inventory references - use inventory_items table
hmsContent = hmsContent.replace(
    `SELECT i.*, ic.name as category_name, s.name as supplier_name
             FROM inventory_items i
             LEFT JOIN item_categories ic ON i.category = ic.id`,
    `SELECT i.*, i.category as category_name, i.supplier as supplier_name
             FROM inventory_items i`
);

hmsContent = hmsContent.replace(
    'SELECT * FROM inventory_items WHERE name = $1',
    'SELECT * FROM inventory_items WHERE item_name = $1'
);

// Fix column names in UPDATE statements
hmsContent = hmsContent.replace(
    'UPDATE inventory_items\n                 SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP',
    'UPDATE inventory_items\n                 SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP'
);

// Fix bill items INSERT
hmsContent = hmsContent.replace(
    'INSERT INTO bill_items (bill_id, service_name, quantity, unit_price, total_price)',
    'INSERT INTO bill_items (bill_id, service_name, quantity, unit_price, total_price)'
);

// Fix bills UPDATE
hmsContent = hmsContent.replace(
    "UPDATE bills SET status = 'paid', paid_at = NOW() WHERE id = $1",
    "UPDATE bills SET status = 'paid', updated_at = NOW() WHERE id = $1"
);

// Fix INSERT INTO payments
hmsContent = hmsContent.replace(
    'INSERT INTO payments (invoice_id, amount, payment_method, status, created_at)',
    'INSERT INTO payments (bill_id, amount, payment_method, status, created_at)'
);

// Fix inventory INSERT column names
hmsContent = hmsContent.replace(
    'INSERT INTO inventory_items (name, category, quantity, unit, reorder_level, expiry_date, supplier, created_at, updated_at)',
    'INSERT INTO inventory_items (item_name, category, quantity, unit, reorder_level, expiry_date, supplier, created_at, updated_at)'
);

// Write the fixed content back
fs.writeFileSync('/root/hms-backend-complete.js', hmsContent);
console.log('Fixed HMS backend queries');

// Now fix digital sourcing
let dsContent = fs.readFileSync('/root/digital-sourcing-complete.js', 'utf8');

// Fix the CREATE TABLE statements to use consistent UUID types
dsContent = dsContent.replace(
    /CREATE TABLE IF NOT EXISTS onboarding\.applications \([^)]+\)/gs,
    `CREATE TABLE IF NOT EXISTS onboarding.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    location VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ghana',
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    bed_capacity INTEGER,
    staff_count INTEGER,
    specializations TEXT[],
    insurance_partners TEXT[],
    current_ehr_system VARCHAR(255),
    annual_patient_volume INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluation_score DECIMAL(5,2),
    evaluation_status VARCHAR(50),
    evaluation_date TIMESTAMP,
    evaluator_id UUID,
    evaluation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`
);

dsContent = dsContent.replace(
    /CREATE TABLE IF NOT EXISTS onboarding\.documents \([^)]+\)/gs,
    `CREATE TABLE IF NOT EXISTS onboarding.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES onboarding.applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    document_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_by UUID,
    verification_date TIMESTAMP,
    verification_notes TEXT
)`
);

dsContent = dsContent.replace(
    /CREATE TABLE IF NOT EXISTS onboarding\.contracts \([^)]+\)/gs,
    `CREATE TABLE IF NOT EXISTS onboarding.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES onboarding.applications(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) UNIQUE,
    template_id UUID,
    contract_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    revenue_share_percentage DECIMAL(5,2),
    monthly_fee DECIMAL(10,2),
    payment_terms TEXT,
    special_conditions TEXT,
    contract_status VARCHAR(50) DEFAULT 'draft',
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_date TIMESTAMP,
    signed_date TIMESTAMP,
    signer_name VARCHAR(255),
    signer_email VARCHAR(255),
    signer_ip VARCHAR(50),
    signature_data TEXT,
    contract_document_url TEXT
)`
);

fs.writeFileSync('/root/digital-sourcing-complete.js', dsContent);
console.log('Fixed digital sourcing queries');

console.log('All query fixes completed!');
