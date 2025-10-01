import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';

// GET - List patients
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospital_id = searchParams.get('hospital_id');
    const search = searchParams.get('search');
    const loyalty_tier = searchParams.get('loyalty_tier');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (hospital_id) {
      conditions.push(`p.hospital_id = $${paramIndex++}`);
      params.push(hospital_id);
    }

    if (search) {
      conditions.push(`(
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR 
        p.patient_number ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (loyalty_tier) {
      conditions.push(`p.loyalty_tier = $${paramIndex++}`);
      params.push(loyalty_tier);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.*,
        h.name as hospital_name,
        COUNT(DISTINCT a.id) as appointment_count,
        MAX(a.appointment_date) as last_appointment
      FROM crm.patients p
      LEFT JOIN organization.hospitals h ON p.hospital_id = h.id
      LEFT JOIN crm.appointments a ON a.patient_id = p.id
      ${whereClause}
      GROUP BY p.id, h.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeQuery(query, params);
    if (!result.success) throw new Error(result.error || "Query failed");
    const patients = result.data;

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Register new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hospital_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      email,
      phone,
      address,
      city,
      state,
      country,
      emergency_contact_name,
      emergency_contact_phone,
      blood_group,
      allergies,
      chronic_conditions,
    } = body;

    // Generate patient number
    const patientNumber = `PT-${Date.now().toString(36).toUpperCase()}`;

    const [patient] = await sql`
      INSERT INTO crm.patients (
        hospital_id,
        patient_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        email,
        phone,
        address,
        city,
        state,
        country,
        emergency_contact_name,
        emergency_contact_phone,
        blood_group,
        allergies,
        chronic_conditions,
        loyalty_points,
        loyalty_tier
      ) VALUES (
        ${hospital_id},
        ${patientNumber},
        ${first_name},
        ${last_name},
        ${date_of_birth || null},
        ${gender || null},
        ${email || null},
        ${phone},
        ${address || null},
        ${city || null},
        ${state || null},
        ${country || 'Ghana'},
        ${emergency_contact_name || null},
        ${emergency_contact_phone || null},
        ${blood_group || null},
        ${JSON.stringify(allergies || [])},
        ${JSON.stringify(chronic_conditions || [])},
        0,
        'bronze'
      ) RETURNING *
    `;

    // Get active loyalty program
    const [program] = await sql`
      SELECT id FROM loyalty.programs
      WHERE is_active = true
      LIMIT 1
    `;

    if (program) {
      // Award welcome bonus points
      await sql`
        INSERT INTO loyalty.patient_points (
          patient_id,
          program_id,
          transaction_type,
          points,
          balance_before,
          balance_after,
          description
        ) VALUES (
          ${patient.id},
          ${program.id},
          'bonus',
          10,
          0,
          10,
          'Welcome bonus'
        )
      `;

      // Update patient points
      await sql`
        UPDATE crm.patients
        SET loyalty_points = 10
        WHERE id = ${patient.id}
      `;
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient registered successfully',
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register patient' },
      { status: 500 }
    );
  }
}
