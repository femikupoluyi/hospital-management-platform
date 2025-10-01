import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - List patient feedback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patient_id = searchParams.get('patient_id');
    const hospital_id = searchParams.get('hospital_id');
    const rating = searchParams.get('rating');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = `
      SELECT 
        pf.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.patient_number,
        h.name as hospital_name,
        a.appointment_number,
        a.appointment_date
      FROM crm.patient_feedback pf
      LEFT JOIN crm.patients p ON pf.patient_id = p.id
      LEFT JOIN organization.hospitals h ON pf.hospital_id = h.id
      LEFT JOIN crm.appointments a ON pf.appointment_id = a.id
      WHERE 1=1
    `;

    if (patient_id) {
      query += ` AND pf.patient_id = '${patient_id}'`;
    }
    if (hospital_id) {
      query += ` AND pf.hospital_id = '${hospital_id}'`;
    }
    if (rating) {
      query += ` AND pf.rating = ${rating}`;
    }

    query += ` ORDER BY pf.created_at DESC LIMIT ${limit}`;

    const feedback = await sql.query(query);

    // Calculate average ratings
    const avgQuery = `
      SELECT 
        AVG(rating) as avg_rating,
        AVG(service_quality) as avg_service_quality,
        AVG(staff_friendliness) as avg_staff_friendliness,
        AVG(cleanliness) as avg_cleanliness,
        AVG(wait_time) as avg_wait_time,
        COUNT(*) as total_feedback,
        SUM(CASE WHEN would_recommend = true THEN 1 ELSE 0 END) as would_recommend_count
      FROM crm.patient_feedback
      ${hospital_id ? `WHERE hospital_id = '${hospital_id}'` : ''}
    `;

    const [avgData] = await sql.query(avgQuery);

    return NextResponse.json({
      success: true,
      data: feedback,
      statistics: {
        average_rating: parseFloat(avgData.avg_rating || 0).toFixed(2),
        average_service_quality: parseFloat(avgData.avg_service_quality || 0).toFixed(2),
        average_staff_friendliness: parseFloat(avgData.avg_staff_friendliness || 0).toFixed(2),
        average_cleanliness: parseFloat(avgData.avg_cleanliness || 0).toFixed(2),
        average_wait_time: parseFloat(avgData.avg_wait_time || 0).toFixed(2),
        total_feedback: avgData.total_feedback,
        recommendation_rate: avgData.total_feedback > 0 
          ? ((avgData.would_recommend_count / avgData.total_feedback) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Submit patient feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create feedback record
    const [feedback] = await sql`
      INSERT INTO crm.patient_feedback (
        patient_id,
        hospital_id,
        appointment_id,
        feedback_type,
        rating,
        wait_time_rating,
        staff_rating,
        facility_rating,
        treatment_rating,
        comments,
        improvements_suggested,
        would_recommend,
        follow_up_required,
        submitted_at
      ) VALUES (
        ${body.patient_id},
        ${body.hospital_id},
        ${body.appointment_id || null},
        ${body.feedback_type || 'general'},
        ${body.rating},
        ${body.wait_time || body.wait_time_rating || null},
        ${body.staff_friendliness || body.staff_rating || null},
        ${body.cleanliness || body.facility_rating || null},
        ${body.service_quality || body.treatment_rating || null},
        ${body.overall_experience || body.comments || null},
        ${body.recommendations || body.improvements_suggested || null},
        ${body.would_recommend || false},
        ${body.follow_up_required || false},
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    // Award loyalty points for feedback
    if (body.patient_id) {
      const pointsToAward = body.rating >= 4 ? 20 : 10; // More points for positive feedback
      
      try {
        await sql`
          UPDATE crm.patients
          SET 
            loyalty_points = loyalty_points + ${pointsToAward},
            loyalty_tier = CASE
              WHEN loyalty_points + ${pointsToAward} >= 1000 THEN 'platinum'
              WHEN loyalty_points + ${pointsToAward} >= 500 THEN 'gold'
              WHEN loyalty_points + ${pointsToAward} >= 100 THEN 'silver'
              ELSE 'bronze'
            END
          WHERE id = ${body.patient_id}
        `;
      } catch (error) {
        console.error('Error awarding loyalty points:', error);
        // Continue even if loyalty points fail
      }
    }

    // Update appointment if feedback is for an appointment
    if (body.appointment_id) {
      await sql`
        UPDATE crm.appointments
        SET notes = COALESCE(notes, '') || ' | Patient feedback received: Rating ' || ${body.rating} || '/5'
        WHERE id = ${body.appointment_id}
      `;
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully. Thank you for your input!'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// PUT - Update feedback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE crm.patient_feedback
      SET 
        rating = COALESCE(${updateData.rating}, rating),
        service_quality = COALESCE(${updateData.service_quality}, service_quality),
        staff_friendliness = COALESCE(${updateData.staff_friendliness}, staff_friendliness),
        cleanliness = COALESCE(${updateData.cleanliness}, cleanliness),
        wait_time = COALESCE(${updateData.wait_time}, wait_time),
        overall_experience = COALESCE(${updateData.overall_experience}, overall_experience),
        recommendations = COALESCE(${updateData.recommendations}, recommendations),
        would_recommend = COALESCE(${updateData.would_recommend}, would_recommend),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Feedback updated successfully'
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
