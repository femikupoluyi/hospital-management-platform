const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixDatabaseSchema() {
    console.log('Starting database schema fixes...');
    
    try {
        // 1. Drop problematic constraints in onboarding schema
        console.log('Fixing onboarding schema...');
        await pool.query(`DROP SCHEMA IF EXISTS onboarding CASCADE`);
        await pool.query(`CREATE SCHEMA IF NOT EXISTS onboarding`);
        
        // 2. Create proper onboarding tables with consistent data types
        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding.applications (
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding.documents (
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding.contracts (
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
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding.evaluation_scores (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES onboarding.applications(id) ON DELETE CASCADE,
                criteria_name VARCHAR(255),
                max_score INTEGER,
                actual_score INTEGER,
                weight DECIMAL(5,2),
                weighted_score DECIMAL(5,2),
                evaluation_notes TEXT,
                evaluated_by UUID,
                evaluated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding.progress_tracker (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_id UUID REFERENCES onboarding.applications(id) ON DELETE CASCADE,
                step_name VARCHAR(255),
                step_status VARCHAR(50),
                completed_date TIMESTAMP,
                completed_by UUID,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Create indexes for better performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON onboarding.applications(status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_applications_submission_date ON onboarding.applications(submission_date)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_application_id ON onboarding.documents(application_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_contracts_application_id ON onboarding.contracts(application_id)`);

        // 4. Ensure other critical tables exist with proper structure
        console.log('Ensuring core tables exist...');
        
        // Drop existing tables with wrong data types
        await pool.query(`DROP TABLE IF EXISTS patient_profiles CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS medical_records CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS bills CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS bill_items CASCADE`);
        
        // Check if patients table exists with wrong type and recreate if needed
        const patientsCheck = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'id'
        `);
        
        if (patientsCheck.rows.length > 0 && patientsCheck.rows[0].data_type === 'integer') {
            console.log('Dropping and recreating patients table with UUID...');
            await pool.query(`DROP TABLE IF EXISTS patients CASCADE`);
        }
        
        // Ensure patients table with proper structure
        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50),
                dateOfBirth DATE,
                gender VARCHAR(20),
                address TEXT,
                emergency_contact VARCHAR(255),
                emergency_phone VARCHAR(50),
                insurance_provider VARCHAR(255),
                insurance_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure patient_profiles table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS patient_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
                blood_group VARCHAR(10),
                allergies TEXT,
                medical_history TEXT,
                current_medications TEXT,
                family_history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure staff table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                role VARCHAR(100),
                department VARCHAR(100),
                specialization VARCHAR(255),
                license_number VARCHAR(100),
                employment_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure medical_records table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS medical_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
                doctor_id UUID REFERENCES staff(id),
                visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visit_type VARCHAR(50),
                chief_complaint TEXT,
                diagnosis TEXT,
                symptoms TEXT,
                treatment TEXT,
                prescriptions TEXT,
                lab_results TEXT,
                vital_signs JSONB,
                notes TEXT,
                follow_up_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure appointments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
                doctor_id UUID REFERENCES staff(id),
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 30,
                appointment_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'scheduled',
                reason TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure bills table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bills (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bill_number VARCHAR(100) UNIQUE NOT NULL,
                patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
                total_amount DECIMAL(10,2) NOT NULL,
                paid_amount DECIMAL(10,2) DEFAULT 0,
                balance_amount DECIMAL(10,2),
                due_date DATE,
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                insurance_claim_number VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure bill_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bill_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
                service_name VARCHAR(255) NOT NULL,
                service_code VARCHAR(50),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure inventory_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_name VARCHAR(255) NOT NULL,
                item_code VARCHAR(100) UNIQUE,
                category VARCHAR(100),
                unit VARCHAR(50),
                quantity INTEGER DEFAULT 0,
                reorder_level INTEGER DEFAULT 10,
                unit_cost DECIMAL(10,2),
                selling_price DECIMAL(10,2),
                expiry_date DATE,
                batch_number VARCHAR(100),
                supplier VARCHAR(255),
                location VARCHAR(255),
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database schema fixes completed successfully!');
        
        // Insert sample data for testing
        console.log('Inserting sample data...');
        
        // Sample application
        await pool.query(`
            INSERT INTO onboarding.applications (
                application_id, hospital_name, registration_number,
                location, address, city, state,
                contact_person, contact_email, contact_phone,
                bed_capacity, staff_count, status
            ) VALUES (
                'APP-2025-001', 'St. Mary Hospital', 'REG123456',
                'Accra', '123 Hospital Road', 'Accra', 'Greater Accra',
                'Dr. John Smith', 'admin@stmary.gh', '+233241234567',
                150, 200, 'pending'
            ) ON CONFLICT (application_id) DO NOTHING
        `);

        // Sample patient
        await pool.query(`
            INSERT INTO patients (
                name, email, phone, dateOfBirth, gender, address
            ) VALUES (
                'Jane Doe', 'jane.doe@example.com', '+233241234567',
                '1990-01-15', 'Female', '456 Patient Street, Accra'
            ) ON CONFLICT (email) DO NOTHING
        `);

        // Sample staff
        await pool.query(`
            INSERT INTO staff (
                name, email, phone, role, department
            ) VALUES (
                'Dr. Sarah Johnson', 'sarah.johnson@hospital.com', '+233241234568',
                'Doctor', 'General Medicine'
            ) ON CONFLICT (email) DO NOTHING
        `);

        console.log('Sample data inserted successfully!');

    } catch (error) {
        console.error('Error fixing database schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

fixDatabaseSchema().then(() => {
    console.log('Database schema fix completed!');
    process.exit(0);
}).catch(error => {
    console.error('Failed to fix database schema:', error);
    process.exit(1);
});
