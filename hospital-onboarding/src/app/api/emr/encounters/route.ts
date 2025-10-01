import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - List encounters or get specific encounter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const encounterId = searchParams.get('id');
    const patientId = searchParams.get('patient_id');
    const hospitalId = searchParams.get('hospital_id');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        e.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.patient_number,
        h.name as hospital_name
      FROM emr.encounters e
      LEFT JOIN crm.patients p ON e.patient_id = p.id
      LEFT JOIN organization.hospitals h ON e.hospital_id = h.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (encounterId) {
      query += ` AND e.encounter_id = $${++paramCount}`;
      params.push(encounterId);
    }
    if (patientId) {
      query += ` AND e.patient_id = $${++paramCount}`;
      params.push(patientId);
    }
    if (hospitalId) {
      query += ` AND e.hospital_id = $${++paramCount}`;
      params.push(hospitalId);
    }
    if (status) {
      query += ` AND e.status = $${++paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY e.admission_date DESC';

    const result = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ encounters: result });
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encounters' },
      { status: 500 }
    );
  }
}

// POST - Create new encounter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate encounter number
    const encounterNumber = 'ENC-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const result = await sql`
      INSERT INTO emr.encounters (
        encounter_number,
        patient_id,
        appointment_id,
        hospital_id,
        encounter_type,
        admission_date,
        department,
        assigned_doctor_id,
        assigned_nurse_id,
        bed_number,
        chief_complaint,
        triage_level,
        status
      ) VALUES (
        ${encounterNumber},
        ${body.patient_id},
        ${body.appointment_id || null},
        ${body.hospital_id},
        ${body.encounter_type},
        ${body.admission_date || new Date().toISOString()},
        ${body.department || null},
        ${body.assigned_doctor_id || null},
        ${body.assigned_nurse_id || null},
        ${body.bed_number || null},
        ${body.chief_complaint || null},
        ${body.triage_level || null},
        ${body.status || 'active'}
      )
      RETURNING *
    `;
    
    // Update appointment status if linked
    if (body.appointment_id) {
      await sql`
        UPDATE crm.appointments 
        SET status = 'in_progress'
        WHERE id = ${body.appointment_id}
      `;
    }
    
    return NextResponse.json({ 
      message: 'Encounter created successfully',
      encounter: result[0] 
    });
  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to create encounter' },
      { status: 500 }
    );
  }
}

// PUT - Update encounter
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { encounter_id, ...updateData } = body;
    
    if (!encounter_id) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }
    
    // Build dynamic update query
    const updateFields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [encounter_id, ...Object.values(updateData)];
    
    const query = `
      UPDATE emr.encounters 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE encounter_id = $1
      RETURNING *
    `;
    
    const result = await sql.query(query, values);
    
    return NextResponse.json({
      message: 'Encounter updated successfully',
      encounter: result[0]
    });
  } catch (error) {
    console.error('Error updating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to update encounter' },
      { status: 500 }
    );
  }
}
