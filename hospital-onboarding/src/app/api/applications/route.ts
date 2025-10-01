import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';
import { applicationSchema } from '@/lib/validations';
import { z } from 'zod';

// GET - List all applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        a.*,
        ho.name as owner_name,
        ho.email as owner_email,
        h.name as hospital_name,
        h.type as hospital_type,
        h.city as hospital_city
      FROM onboarding.applications a
      LEFT JOIN organization.hospital_owners ho ON a.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE a.status = $1';
      params.push(status);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const appResult = await executeQuery(query, params);
    if (!appResult.success) {
      throw new Error(appResult.error || 'Failed to fetch applications');
    }
    const applications = appResult.data;

    // Get total count
    const countQuery = status 
      ? `SELECT COUNT(*) as total FROM onboarding.applications WHERE status = $1`
      : `SELECT COUNT(*) as total FROM onboarding.applications`;
    
    const countRes = await executeQuery(countQuery, status ? [status] : []);
    if (!countRes.success) {
      throw new Error(countRes.error || 'Failed to get count');
    }
    const [countResult] = countRes.data as any[];

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        total: parseInt(countResult.total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = applicationSchema.parse(body);

    // Start transaction
    await sql`BEGIN`;

    try {
      // 1. Create hospital owner
      const [owner] = await sql`
        INSERT INTO organization.hospital_owners (
          owner_type, name, email, phone, company_name, 
          registration_number, tax_id, address, city, state, 
          country, postal_code, bank_name, account_number, payment_method
        ) VALUES (
          ${validatedData.owner.owner_type},
          ${validatedData.owner.name},
          ${validatedData.owner.email},
          ${validatedData.owner.phone},
          ${validatedData.owner.company_name || null},
          ${validatedData.owner.registration_number || null},
          ${validatedData.owner.tax_id || null},
          ${validatedData.owner.address},
          ${validatedData.owner.city},
          ${validatedData.owner.state},
          ${validatedData.owner.country},
          ${validatedData.owner.postal_code || null},
          ${validatedData.owner.bank_name || null},
          ${validatedData.owner.account_number || null},
          ${validatedData.owner.payment_method || null}
        ) RETURNING id
      `;

      // 2. Generate hospital code
      const hospitalCode = `HOSP-${Date.now().toString(36).toUpperCase()}`;

      // 3. Create hospital
      const [hospital] = await sql`
        INSERT INTO organization.hospitals (
          owner_id, code, name, type, status, address, city, state, 
          country, postal_code, phone, email, website, bed_capacity, 
          staff_count, departments, services_offered, license_number, 
          license_expiry, accreditations, insurance_partners
        ) VALUES (
          ${owner.id},
          ${hospitalCode},
          ${validatedData.hospital.name},
          ${validatedData.hospital.type},
          'pending',
          ${validatedData.hospital.address},
          ${validatedData.hospital.city},
          ${validatedData.hospital.state},
          ${validatedData.hospital.country},
          ${validatedData.hospital.postal_code || null},
          ${validatedData.hospital.phone},
          ${validatedData.hospital.email},
          ${validatedData.hospital.website || null},
          ${validatedData.hospital.bed_capacity || null},
          ${validatedData.hospital.staff_count || null},
          ${JSON.stringify(validatedData.hospital.departments || [])},
          ${JSON.stringify(validatedData.hospital.services_offered || [])},
          ${validatedData.hospital.license_number},
          ${validatedData.hospital.license_expiry || null},
          ${JSON.stringify(validatedData.hospital.accreditations || [])},
          ${JSON.stringify(validatedData.hospital.insurance_partners || [])}
        ) RETURNING id
      `;

      // 4. Generate application number
      const applicationNumber = `APP-${Date.now().toString(36).toUpperCase()}`;

      // 5. Create application
      const [application] = await sql`
        INSERT INTO onboarding.applications (
          application_number, owner_id, hospital_id, status, submission_date
        ) VALUES (
          ${applicationNumber},
          ${owner.id},
          ${hospital.id},
          'submitted',
          NOW()
        ) RETURNING *
      `;

      // 6. Add to status history
      await sql`
        INSERT INTO onboarding.application_status_history (
          application_id, new_status, reason
        ) VALUES (
          ${application.id},
          'submitted',
          'Application submitted successfully'
        )
      `;

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        data: {
          application,
          owner_id: owner.id,
          hospital_id: hospital.id,
        },
        message: 'Application submitted successfully',
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error creating application:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
