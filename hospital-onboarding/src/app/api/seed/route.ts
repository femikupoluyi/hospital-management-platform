import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Insert sample hospital owner
    const [owner] = await sql`
      INSERT INTO organization.hospital_owners (
        owner_type, name, email, phone, company_name,
        address, city, state, country
      ) VALUES (
        'company',
        'HealthCare Partners Ltd',
        'admin@healthcarepartners.gh',
        '+233244123456',
        'HealthCare Partners Limited',
        '123 Independence Avenue',
        'Accra',
        'Greater Accra',
        'Ghana'
      ) RETURNING id
    `;

    // Insert sample hospital
    const hospitalCode = `HOSP-${Date.now().toString(36).toUpperCase()}`;
    const [hospital] = await sql`
      INSERT INTO organization.hospitals (
        owner_id, code, name, type, status,
        address, city, state, country,
        phone, email, bed_capacity, staff_count,
        departments, services_offered,
        license_number, license_expiry
      ) VALUES (
        ${owner.id},
        ${hospitalCode},
        'Accra Medical Center',
        'general',
        'pending',
        '456 Liberation Road',
        'Accra',
        'Greater Accra',
        'Ghana',
        '+233244987654',
        'info@accramedical.gh',
        150,
        75,
        '["Emergency", "Surgery", "Pediatrics", "Maternity", "ICU", "Radiology"]'::jsonb,
        '["General Surgery", "Emergency Care", "X-Ray", "Laboratory", "Pharmacy", "Maternity Care", "Pediatric Care", "ICU Services"]'::jsonb,
        'GHS-MED-2024-001',
        '2026-12-31'
      ) RETURNING id
    `;

    // Create application
    const applicationNumber = `APP-${Date.now().toString(36).toUpperCase()}`;
    const [application] = await sql`
      INSERT INTO onboarding.applications (
        application_number, owner_id, hospital_id, status,
        submission_date, priority
      ) VALUES (
        ${applicationNumber},
        ${owner.id},
        ${hospital.id},
        'submitted',
        NOW(),
        'high'
      ) RETURNING id
    `;

    // Add sample documents
    await sql`
      INSERT INTO onboarding.documents (
        application_id, document_type, document_name,
        file_path, status
      ) VALUES
        (${application.id}, 'business_registration', 'Business Registration Certificate.pdf', '/documents/business_reg.pdf', 'verified'),
        (${application.id}, 'medical_license', 'Medical Practice License.pdf', '/documents/med_license.pdf', 'verified'),
        (${application.id}, 'tax_certificate', 'Tax Clearance Certificate.pdf', '/documents/tax_cert.pdf', 'pending'),
        (${application.id}, 'insurance_certificate', 'Professional Liability Insurance.pdf', '/documents/insurance.pdf', 'verified'),
        (${application.id}, 'facility_photos', 'Hospital Facility Photos.zip', '/documents/photos.zip', 'pending')
    `;

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        owner_id: owner.id,
        hospital_id: hospital.id,
        application_id: application.id,
        application_number: applicationNumber,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
