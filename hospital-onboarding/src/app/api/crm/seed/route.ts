import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    // Get the existing owner
    const [owner] = await sql`
      SELECT * FROM organization.hospital_owners LIMIT 1
    `;

    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'No owner found. Please create an application first.' },
        { status: 404 }
      );
    }

    // Create owner account if doesn't exist
    const existingAccount = await sql`
      SELECT id FROM crm.owner_accounts WHERE owner_id = ${owner.id}
    `;

    if (existingAccount.length === 0) {
      await sql`
        INSERT INTO crm.owner_accounts (
          owner_id,
          account_status,
          contract_count,
          total_revenue,
          satisfaction_score
        ) VALUES (
          ${owner.id},
          'active',
          1,
          125000.00,
          4.5
        )
      `;
    }

    // Get hospital
    const [hospital] = await sql`
      SELECT * FROM organization.hospitals WHERE owner_id = ${owner.id} LIMIT 1
    `;

    // Create sample payout
    await sql`
      INSERT INTO crm.owner_payouts (
        owner_id,
        hospital_id,
        payout_period,
        period_start,
        period_end,
        gross_revenue,
        management_fee_percentage,
        management_fee_amount,
        net_payout,
        status
      ) VALUES (
        ${owner.id},
        ${hospital.id},
        'September 2025',
        '2025-09-01',
        '2025-09-30',
        31250.00,
        20.00,
        6250.00,
        25000.00,
        'pending'
      )
    `;

    // Create sample patients
    const patients = [];
    for (let i = 1; i <= 5; i++) {
      const patientNumber = `PT-TEST${i}`;
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
          blood_group,
          loyalty_points,
          loyalty_tier,
          total_visits
        ) VALUES (
          ${hospital.id},
          ${patientNumber},
          ${['John', 'Jane', 'Michael', 'Sarah', 'David'][i-1]},
          ${['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][i-1]},
          ${new Date(1990 - i * 5, i, i * 5).toISOString()},
          ${i % 2 === 0 ? 'female' : 'male'},
          ${`patient${i}@example.com`},
          ${`+23324400000${i}`},
          ${`${i * 100} Main Street`},
          'Accra',
          'Greater Accra',
          'Ghana',
          ${['A+', 'B+', 'O+', 'AB+', 'A-'][i-1]},
          ${i * 20},
          ${i >= 4 ? 'silver' : 'bronze'},
          ${i * 2}
        ) RETURNING id
      `;
      patients.push(patient);
    }

    // Create sample appointments
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + i);
      
      await sql`
        INSERT INTO crm.appointments (
          patient_id,
          hospital_id,
          appointment_number,
          appointment_date,
          appointment_time,
          department,
          doctor_name,
          appointment_type,
          status
        ) VALUES (
          ${patients[i].id},
          ${hospital.id},
          ${`APT-TEST${i + 1}`},
          ${appointmentDate.toISOString().split('T')[0]},
          ${`${10 + i}:00:00`},
          ${['General Medicine', 'Pediatrics', 'Cardiology'][i]},
          ${['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'][i]},
          ${['Consultation', 'Follow-up', 'Check-up'][i]},
          ${i === 0 ? 'scheduled' : i === 1 ? 'confirmed' : 'completed'}
        )
      `;
    }

    // Create sample feedback
    await sql`
      INSERT INTO crm.patient_feedback (
        patient_id,
        hospital_id,
        feedback_type,
        rating,
        wait_time_rating,
        staff_rating,
        facility_rating,
        treatment_rating,
        comments,
        would_recommend
      ) VALUES (
        ${patients[2].id},
        ${hospital.id},
        'service',
        5,
        4,
        5,
        5,
        5,
        'Excellent service and care from all staff members.',
        true
      )
    `;

    // Create sample campaign
    await sql`
      INSERT INTO communications.campaigns (
        campaign_name,
        campaign_type,
        target_audience,
        channels,
        subject,
        content_template,
        schedule_type,
        status,
        total_recipients,
        sent_count,
        delivered_count,
        opened_count
      ) VALUES (
        'Health Awareness Week',
        'educational',
        'all_patients',
        '["email", "sms"]'::jsonb,
        'Join us for Health Awareness Week',
        'Dear {{name}}, Join us for our Health Awareness Week from October 1-7. Free health screenings and consultations available!',
        'scheduled',
        'completed',
        150,
        150,
        142,
        98
      )
    `;

    // Create sample owner communication
    await sql`
      INSERT INTO crm.owner_communications (
        owner_id,
        communication_type,
        subject,
        content,
        direction,
        status
      ) VALUES (
        ${owner.id},
        'email',
        'September 2025 Performance Report',
        'Your hospital achieved 92% occupancy rate this month with excellent patient satisfaction scores.',
        'outbound',
        'delivered'
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'CRM test data created successfully',
      data: {
        owner_id: owner.id,
        hospital_id: hospital.id,
        patients_created: patients.length,
        appointments_created: 3,
      },
    });
  } catch (error) {
    console.error('Error seeding CRM data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
