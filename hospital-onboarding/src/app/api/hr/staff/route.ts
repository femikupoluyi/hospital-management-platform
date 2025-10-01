import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - List staff members
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('hospital_id');
    const department = searchParams.get('department');
    const staffType = searchParams.get('staff_type');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        s.*,
        h.name as hospital_name
      FROM hr.staff s
      LEFT JOIN organization.hospitals h ON s.hospital_id = h.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (hospitalId) {
      query += ` AND s.hospital_id = $${++paramCount}`;
      params.push(hospitalId);
    }
    if (department) {
      query += ` AND s.department = $${++paramCount}`;
      params.push(department);
    }
    if (staffType) {
      query += ` AND s.staff_type = $${++paramCount}`;
      params.push(staffType);
    }
    if (status) {
      query += ` AND s.employment_status = $${++paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY s.first_name, s.last_name';
    
    const staff = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST - Add new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate employee ID
    const employeeId = 'EMP' + Date.now().toString().substr(-6);
    
    const result = await sql`
      INSERT INTO hr.staff (
        employee_id,
        hospital_id,
        first_name,
        last_name,
        middle_name,
        gender,
        date_of_birth,
        email,
        phone,
        address,
        department,
        designation,
        staff_type,
        specialization,
        qualification,
        license_number,
        employment_date,
        employment_status,
        salary_grade,
        basic_salary,
        bank_account,
        bank_name,
        emergency_contact
      ) VALUES (
        ${employeeId},
        ${body.hospital_id},
        ${body.first_name},
        ${body.last_name},
        ${body.middle_name || null},
        ${body.gender || null},
        ${body.date_of_birth || null},
        ${body.email},
        ${body.phone},
        ${body.address || null},
        ${body.department},
        ${body.designation},
        ${body.staff_type},
        ${body.specialization || null},
        ${body.qualification || null},
        ${body.license_number || null},
        ${body.employment_date || new Date().toISOString().split('T')[0]},
        ${body.employment_status || 'active'},
        ${body.salary_grade || null},
        ${body.basic_salary || null},
        ${body.bank_account || null},
        ${body.bank_name || null},
        ${body.emergency_contact || null}::jsonb
      )
      RETURNING *
    `;
    
    return NextResponse.json({ 
      message: 'Staff member added successfully',
      staff: result[0] 
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    return NextResponse.json(
      { error: 'Failed to add staff member' },
      { status: 500 }
    );
  }
}

// PUT - Update staff member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, ...updateData } = body;
    
    if (!staff_id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }
    
    // Build dynamic update query
    const updateFields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [staff_id, ...Object.values(updateData)];
    
    const query = `
      UPDATE hr.staff 
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = $1
      RETURNING *
    `;
    
    const result = await sql.query(query, values);
    
    return NextResponse.json({
      message: 'Staff member updated successfully',
      staff: result[0]
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}
