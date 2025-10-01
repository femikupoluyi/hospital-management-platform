import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { communicationService } from '@/lib/communications';

// GET - List appointment reminders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const appointment_id = searchParams.get('appointment_id');

    let query = `
      SELECT 
        ar.*,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.department,
        a.doctor_name,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.phone as patient_phone,
        p.email as patient_email,
        h.name as hospital_name
      FROM crm.appointment_reminders ar
      LEFT JOIN crm.appointments a ON ar.appointment_id = a.id
      LEFT JOIN crm.patients p ON a.patient_id = p.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE 1=1
    `;

    if (status) {
      query += ` AND ar.status = '${status}'`;
    }
    if (appointment_id) {
      query += ` AND ar.appointment_id = '${appointment_id}'`;
    }

    query += ` ORDER BY ar.scheduled_time DESC`;

    const reminders = await sql.query(query);

    return NextResponse.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// POST - Create appointment reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get appointment details
    const [appointment] = await sql`
      SELECT 
        a.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        p.communication_preferences,
        h.name as hospital_name
      FROM crm.appointments a
      LEFT JOIN crm.patients p ON a.patient_id = p.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE a.id = ${body.appointment_id}
    `;

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Calculate reminder time
    const appointmentDateTime = new Date(appointment.appointment_date);
    const timeMatch = appointment.appointment_time.match(/(\d+):(\d+)/);
    if (timeMatch) {
      appointmentDateTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
    }
    
    const reminderTime = new Date(appointmentDateTime);
    reminderTime.setDate(reminderTime.getDate() - (body.days_before || 1));

    // Create reminder record
    const [reminder] = await sql`
      INSERT INTO crm.appointment_reminders (
        appointment_id,
        reminder_type,
        scheduled_time,
        channel,
        status,
        message_template
      ) VALUES (
        ${body.appointment_id},
        ${body.reminder_type || 'appointment'},
        ${reminderTime.toISOString()},
        ${body.channel || 'sms'},
        'pending',
        ${body.message_template || `Dear ${appointment.first_name}, this is a reminder for your appointment on ${appointmentDateTime.toLocaleDateString()} at ${appointment.appointment_time} with ${appointment.doctor_name} at ${appointment.hospital_name}.`}
      )
      RETURNING *
    `;

    // Send immediate reminder if requested
    if (body.send_immediately) {
      const channels = body.channels || ['sms'];
      const message = body.message || reminder.message_template;

      for (const channel of channels) {
        if (channel === 'sms' && appointment.phone) {
          await communicationService.sendSMS(appointment.phone, message);
        } else if (channel === 'email' && appointment.email) {
          await communicationService.sendEmail(
            appointment.email,
            'Appointment Reminder',
            message
          );
        } else if (channel === 'whatsapp' && appointment.phone) {
          await communicationService.sendWhatsApp(appointment.phone, message);
        }
      }

      // Update reminder status
      await sql`
        UPDATE crm.appointment_reminders
        SET 
          status = 'sent',
          sent_time = CURRENT_TIMESTAMP,
          response_status = 'delivered'
        WHERE id = ${reminder.id}
      `;

      // Update appointment
      await sql`
        UPDATE crm.appointments
        SET 
          reminder_sent = true,
          reminder_sent_at = CURRENT_TIMESTAMP
        WHERE id = ${body.appointment_id}
      `;
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder created successfully'
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

// PUT - Process pending reminders (for scheduled job)
export async function PUT(request: NextRequest) {
  try {
    // Get all pending reminders that are due
    const pendingReminders = await sql`
      SELECT 
        ar.*,
        a.appointment_number,
        a.appointment_date,
        a.appointment_time,
        a.department,
        a.doctor_name,
        p.first_name,
        p.last_name,
        p.phone,
        p.email,
        p.communication_preferences,
        h.name as hospital_name
      FROM crm.appointment_reminders ar
      LEFT JOIN crm.appointments a ON ar.appointment_id = a.id
      LEFT JOIN crm.patients p ON a.patient_id = p.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE ar.status = 'pending'
        AND ar.scheduled_time <= CURRENT_TIMESTAMP
    `;

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of pendingReminders) {
      try {
        // Prepare personalized message
        const message = reminder.message_template
          .replace('{{name}}', `${reminder.first_name} ${reminder.last_name}`)
          .replace('{{date}}', new Date(reminder.appointment_date).toLocaleDateString())
          .replace('{{time}}', reminder.appointment_time)
          .replace('{{doctor}}', reminder.doctor_name)
          .replace('{{hospital}}', reminder.hospital_name)
          .replace('{{department}}', reminder.department);

        // Send based on channel
        let sent = false;
        if (reminder.channel === 'sms' && reminder.phone) {
          await communicationService.sendSMS(reminder.phone, message);
          sent = true;
        } else if (reminder.channel === 'email' && reminder.email) {
          await communicationService.sendEmail(
            reminder.email,
            'Appointment Reminder',
            message
          );
          sent = true;
        } else if (reminder.channel === 'whatsapp' && reminder.phone) {
          await communicationService.sendWhatsApp(reminder.phone, message);
          sent = true;
        }

        if (sent) {
          // Update reminder status
          await sql`
            UPDATE crm.appointment_reminders
            SET 
              status = 'sent',
              sent_time = CURRENT_TIMESTAMP,
              response_status = 'delivered'
            WHERE id = ${reminder.id}
          `;

          // Update appointment
          await sql`
            UPDATE crm.appointments
            SET 
              reminder_sent = true,
              reminder_sent_at = CURRENT_TIMESTAMP
            WHERE id = ${reminder.appointment_id}
          `;

          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
        failedCount++;
        
        // Mark as failed
        await sql`
          UPDATE crm.appointment_reminders
          SET 
            status = 'failed',
            response_status = 'error',
            error_message = ${error instanceof Error ? error.message : 'Unknown error'}
          WHERE id = ${reminder.id}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingReminders.length} reminders`,
      sent: sentCount,
      failed: failedCount
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
