import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';
import { communicationService } from '@/lib/communications';

// GET - List appointments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patient_id = searchParams.get('patient_id');
    const hospital_id = searchParams.get('hospital_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (patient_id) {
      conditions.push(`a.patient_id = $${paramIndex++}`);
      params.push(patient_id);
    }

    if (hospital_id) {
      conditions.push(`a.hospital_id = $${paramIndex++}`);
      params.push(hospital_id);
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex++}`);
      params.push(status);
    }

    if (date) {
      conditions.push(`a.appointment_date = $${paramIndex++}`);
      params.push(date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        p.phone as patient_phone,
        p.email as patient_email,
        h.name as hospital_name
      FROM crm.appointments a
      LEFT JOIN crm.patients p ON a.patient_id = p.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeQuery(query, params);
    if (!result.success) throw new Error(result.error || "Query failed");
    const appointments = result.data;

    return NextResponse.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST - Schedule appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patient_id,
      hospital_id,
      appointment_date,
      appointment_time,
      department,
      doctor_name,
      appointment_type,
      reason_for_visit,
      send_confirmation,
      send_reminder,
    } = body;

    // Generate appointment number
    const appointmentNumber = `APT-${Date.now().toString(36).toUpperCase()}`;

    const [appointment] = await sql`
      INSERT INTO crm.appointments (
        patient_id,
        hospital_id,
        appointment_number,
        appointment_date,
        appointment_time,
        department,
        doctor_name,
        appointment_type,
        reason_for_visit,
        status
      ) VALUES (
        ${patient_id},
        ${hospital_id},
        ${appointmentNumber},
        ${appointment_date},
        ${appointment_time},
        ${department || null},
        ${doctor_name || null},
        ${appointment_type || null},
        ${reason_for_visit || null},
        'scheduled'
      ) RETURNING *
    `;

    // Get patient details
    const [patient] = await sql`
      SELECT * FROM crm.patients WHERE id = ${patient_id}
    `;

    // Send confirmation if requested
    if (send_confirmation && patient) {
      const confirmationSent = await communicationService.sendAppointmentReminder(
        appointment,
        patient,
        patient.email ? 'email' : 'sms'
      );

      if (confirmationSent) {
        await sql`
          UPDATE crm.appointments
          SET confirmation_sent = true, confirmation_sent_at = NOW()
          WHERE id = ${appointment.id}
        `;
      }
    }

    // Schedule reminder if requested
    if (send_reminder) {
      const reminderTime = new Date(appointment_date);
      reminderTime.setDate(reminderTime.getDate() - 1); // 24 hours before

      await sql`
        INSERT INTO crm.appointment_reminders (
          appointment_id,
          reminder_type,
          reminder_channel,
          scheduled_time,
          status
        ) VALUES (
          ${appointment.id},
          '24_hour',
          ${patient.email ? 'email' : 'sms'},
          ${reminderTime.toISOString()},
          'pending'
        )
      `;
    }

    // Update patient visit count
    await sql`
      UPDATE crm.patients
      SET total_visits = total_visits + 1
      WHERE id = ${patient_id}
    `;

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment scheduled successfully',
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule appointment' },
      { status: 500 }
    );
  }
}

// PATCH - Update appointment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointment_id, status, notes, check_in_time, check_out_time } = body;

    const updates: any = {
      status,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    if (status === 'in_progress' && check_in_time) {
      updates.check_in_time = check_in_time;
    }

    if (status === 'completed' && check_out_time) {
      updates.check_out_time = check_out_time;
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [appointment_id, ...Object.values(updates)];

    const query = `
      UPDATE crm.appointments
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await executeQuery(query, values);
    if (!result.success) throw new Error(result.error || "Query failed");
    const [updated] = result.data;

    // If completed, award loyalty points
    if (status === 'completed') {
      const [program] = await sql`
        SELECT * FROM loyalty.programs
        WHERE is_active = true
        LIMIT 1
      `;

      if (program) {
        const [patient] = await sql`
          SELECT * FROM crm.patients
          WHERE id = ${updated.patient_id}
        `;

        if (patient) {
          const pointsToAward = program.points_per_visit;
          const newBalance = patient.loyalty_points + pointsToAward;

          await sql`
            INSERT INTO loyalty.patient_points (
              patient_id,
              program_id,
              transaction_type,
              points,
              balance_before,
              balance_after,
              description,
              reference_type,
              reference_id
            ) VALUES (
              ${patient.id},
              ${program.id},
              'earned',
              ${pointsToAward},
              ${patient.loyalty_points},
              ${newBalance},
              'Points for appointment completion',
              'appointment',
              ${appointment_id}
            )
          `;

          // Update patient points and tier
          let newTier = 'bronze';
          if (newBalance >= 1000) newTier = 'platinum';
          else if (newBalance >= 500) newTier = 'gold';
          else if (newBalance >= 100) newTier = 'silver';

          await sql`
            UPDATE crm.patients
            SET 
              loyalty_points = ${newBalance},
              loyalty_tier = ${newTier},
              last_visit_date = ${updated.appointment_date}
            WHERE id = ${patient.id}
          `;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Appointment ${status} successfully`,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
