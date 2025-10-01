import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - Get staff schedules
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staff_id');
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const hospitalId = searchParams.get('hospital_id');

    let query = `
      SELECT 
        ss.*,
        s.first_name || ' ' || s.last_name as staff_name,
        s.department,
        s.designation,
        sh.shift_name,
        sh.start_time,
        sh.end_time
      FROM hr.staff_schedules ss
      JOIN hr.staff s ON ss.staff_id = s.staff_id
      JOIN hr.shifts sh ON ss.shift_id = sh.shift_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (staffId) {
      query += ` AND ss.staff_id = $${++paramCount}`;
      params.push(staffId);
    }
    if (date) {
      query += ` AND ss.schedule_date = $${++paramCount}`;
      params.push(date);
    }
    if (startDate && endDate) {
      query += ` AND ss.schedule_date BETWEEN $${++paramCount} AND $${++paramCount}`;
      params.push(startDate, endDate);
    }
    if (hospitalId) {
      query += ` AND s.hospital_id = $${++paramCount}`;
      params.push(hospitalId);
    }
    
    query += ' ORDER BY ss.schedule_date, sh.start_time';
    
    const schedules = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST - Create staff schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check for existing schedule
    const existing = await sql`
      SELECT * FROM hr.staff_schedules
      WHERE staff_id = ${body.staff_id} 
        AND schedule_date = ${body.schedule_date}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Schedule already exists for this staff member on this date' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO hr.staff_schedules (
        staff_id,
        shift_id,
        schedule_date,
        status,
        notes
      ) VALUES (
        ${body.staff_id},
        ${body.shift_id},
        ${body.schedule_date},
        ${body.status || 'scheduled'},
        ${body.notes || null}
      )
      RETURNING *
    `;
    
    return NextResponse.json({ 
      message: 'Schedule created successfully',
      schedule: result[0] 
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// PUT - Update schedule (check-in/check-out)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule_id, action } = body;
    
    if (!schedule_id || !action) {
      return NextResponse.json(
        { error: 'Schedule ID and action are required' },
        { status: 400 }
      );
    }
    
    let updateQuery;
    
    if (action === 'check_in') {
      updateQuery = sql`
        UPDATE hr.staff_schedules
        SET 
          check_in_time = CURRENT_TIMESTAMP,
          status = 'present'
        WHERE schedule_id = ${schedule_id}
        RETURNING *
      `;
    } else if (action === 'check_out') {
      updateQuery = sql`
        UPDATE hr.staff_schedules
        SET 
          check_out_time = CURRENT_TIMESTAMP,
          overtime_hours = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 3600 - 8
        WHERE schedule_id = ${schedule_id}
        RETURNING *
      `;
    } else {
      const { status, notes } = body;
      updateQuery = sql`
        UPDATE hr.staff_schedules
        SET 
          status = ${status},
          notes = ${notes || null}
        WHERE schedule_id = ${schedule_id}
        RETURNING *
      `;
    }
    
    const result = await updateQuery;
    
    return NextResponse.json({
      message: 'Schedule updated successfully',
      schedule: result[0]
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
