import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - List vital signs for an encounter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const encounterId = searchParams.get('encounter_id');
    
    if (!encounterId) {
      return NextResponse.json(
        { error: 'Encounter ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT 
        v.*,
        s.first_name || ' ' || s.last_name as recorded_by_name
      FROM emr.vital_signs v
      LEFT JOIN hr.staff s ON v.recorded_by = s.staff_id
      WHERE v.encounter_id = ${encounterId}
      ORDER BY v.recorded_at DESC
    `;
    
    return NextResponse.json({ vital_signs: result });
  } catch (error) {
    console.error('Error fetching vital signs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vital signs' },
      { status: 500 }
    );
  }
}

// POST - Record new vital signs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (body.weight && body.height) {
      const heightInMeters = body.height / 100;
      bmi = (body.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    
    const result = await sql`
      INSERT INTO emr.vital_signs (
        encounter_id,
        recorded_by,
        temperature,
        blood_pressure_systolic,
        blood_pressure_diastolic,
        pulse_rate,
        respiratory_rate,
        oxygen_saturation,
        weight,
        height,
        bmi,
        blood_sugar,
        pain_score,
        notes
      ) VALUES (
        ${body.encounter_id},
        ${body.recorded_by || null},
        ${body.temperature || null},
        ${body.blood_pressure_systolic || null},
        ${body.blood_pressure_diastolic || null},
        ${body.pulse_rate || null},
        ${body.respiratory_rate || null},
        ${body.oxygen_saturation || null},
        ${body.weight || null},
        ${body.height || null},
        ${bmi},
        ${body.blood_sugar || null},
        ${body.pain_score || null},
        ${body.notes || null}
      )
      RETURNING *
    `;
    
    return NextResponse.json({ 
      message: 'Vital signs recorded successfully',
      vital_signs: result[0] 
    });
  } catch (error) {
    console.error('Error recording vital signs:', error);
    return NextResponse.json(
      { error: 'Failed to record vital signs' },
      { status: 500 }
    );
  }
}
