import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET - List satisfaction surveys
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner_id = searchParams.get('owner_id');
    const hospital_id = searchParams.get('hospital_id');

    let query = `
      SELECT 
        s.*,
        ho.name as owner_name,
        ho.email as owner_email,
        h.name as hospital_name
      FROM crm.owner_satisfaction_surveys s
      LEFT JOIN organization.hospital_owners ho ON s.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON s.hospital_id = h.id
      WHERE 1=1
    `;

    if (owner_id) {
      query += ` AND s.owner_id = '${owner_id}'`;
    }
    if (hospital_id) {
      query += ` AND s.hospital_id = '${hospital_id}'`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const surveys = await sql.query(query);

    // Calculate average scores
    const avgQuery = `
      SELECT 
        AVG(overall_satisfaction) as avg_overall,
        AVG(management_quality) as avg_management,
        AVG(communication_rating) as avg_communication,
        AVG(support_rating) as avg_support,
        AVG(financial_transparency) as avg_financial,
        AVG(technology_satisfaction) as avg_technology,
        COUNT(*) as total_surveys,
        SUM(CASE WHEN would_renew_contract = true THEN 1 ELSE 0 END) as would_renew_count
      FROM crm.owner_satisfaction_surveys
      ${owner_id ? `WHERE owner_id = '${owner_id}'` : ''}
    `;

    const [avgData] = await sql.query(avgQuery);

    return NextResponse.json({
      success: true,
      data: surveys,
      statistics: {
        average_overall_satisfaction: parseFloat(avgData.avg_overall || 0).toFixed(2),
        average_management_quality: parseFloat(avgData.avg_management || 0).toFixed(2),
        average_communication: parseFloat(avgData.avg_communication || 0).toFixed(2),
        average_support: parseFloat(avgData.avg_support || 0).toFixed(2),
        average_financial_transparency: parseFloat(avgData.avg_financial || 0).toFixed(2),
        average_technology: parseFloat(avgData.avg_technology || 0).toFixed(2),
        total_surveys: avgData.total_surveys,
        renewal_rate: avgData.total_surveys > 0 
          ? ((avgData.would_renew_count / avgData.total_surveys) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (error) {
    console.error('Error fetching satisfaction surveys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch satisfaction surveys' },
      { status: 500 }
    );
  }
}

// POST - Submit satisfaction survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create survey record
    const [survey] = await sql`
      INSERT INTO crm.owner_satisfaction_surveys (
        owner_id,
        survey_type,
        survey_date,
        overall_score,
        service_quality_score,
        communication_score,
        support_score,
        platform_score,
        comments,
        improvements_suggested,
        would_recommend,
        follow_up_required
      ) VALUES (
        ${body.owner_id},
        ${body.survey_type || 'quarterly'},
        CURRENT_DATE,
        ${body.overall_satisfaction || body.overall_score},
        ${body.management_quality || body.service_quality_score || null},
        ${body.communication_rating || body.communication_score || null},
        ${body.support_rating || body.support_score || null},
        ${body.technology_satisfaction || body.platform_score || null},
        ${body.additional_comments || body.comments || null},
        ${body.improvement_suggestions || body.improvements_suggested || null},
        ${body.would_renew_contract || body.would_recommend || false},
        ${body.follow_up_required || false}
      )
      RETURNING *
    `;

    // Update owner account satisfaction score
    if (body.owner_id) {
      // Calculate average satisfaction for this owner
      const [avgSatisfaction] = await sql`
        SELECT AVG(overall_satisfaction) as avg_satisfaction
        FROM crm.owner_satisfaction_surveys
        WHERE owner_id = ${body.owner_id}
      `;

      await sql`
        UPDATE crm.owner_accounts
        SET 
          satisfaction_score = ${avgSatisfaction.avg_satisfaction},
          updated_at = CURRENT_TIMESTAMP
        WHERE owner_id = ${body.owner_id}
      `;

      // Send automated response based on satisfaction level
      if (body.overall_satisfaction <= 2) {
        // Low satisfaction - trigger immediate follow-up
        await sql`
          INSERT INTO crm.owner_communications (
            owner_id,
            hospital_id,
            communication_type,
            subject,
            content,
            channel,
            priority,
            status,
            scheduled_date
          ) VALUES (
            ${body.owner_id},
            ${body.hospital_id},
            'follow_up',
            'Urgent: Follow-up on Your Recent Feedback',
            'We noticed your recent satisfaction survey indicates concerns. Our management team would like to schedule an immediate call to address your issues.',
            'phone',
            'urgent',
            'pending',
            CURRENT_DATE
          )
        `;
      } else if (body.overall_satisfaction >= 4) {
        // High satisfaction - send thank you
        await sql`
          INSERT INTO crm.owner_communications (
            owner_id,
            hospital_id,
            communication_type,
            subject,
            content,
            channel,
            priority,
            status,
            scheduled_date
          ) VALUES (
            ${body.owner_id},
            ${body.hospital_id},
            'appreciation',
            'Thank You for Your Positive Feedback',
            'We appreciate your positive feedback and partnership. We look forward to continuing our successful collaboration.',
            'email',
            'normal',
            'pending',
            CURRENT_DATE + INTERVAL '1 day'
          )
        `;
      }
    }

    return NextResponse.json({
      success: true,
      data: survey,
      message: 'Satisfaction survey submitted successfully. Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Error submitting satisfaction survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit satisfaction survey' },
      { status: 500 }
    );
  }
}

// PUT - Update satisfaction survey
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE crm.owner_satisfaction_surveys
      SET 
        overall_satisfaction = COALESCE(${updateData.overall_satisfaction}, overall_satisfaction),
        management_quality = COALESCE(${updateData.management_quality}, management_quality),
        communication_rating = COALESCE(${updateData.communication_rating}, communication_rating),
        support_rating = COALESCE(${updateData.support_rating}, support_rating),
        financial_transparency = COALESCE(${updateData.financial_transparency}, financial_transparency),
        technology_satisfaction = COALESCE(${updateData.technology_satisfaction}, technology_satisfaction),
        improvement_suggestions = COALESCE(${updateData.improvement_suggestions}, improvement_suggestions),
        would_renew_contract = COALESCE(${updateData.would_renew_contract}, would_renew_contract),
        additional_comments = COALESCE(${updateData.additional_comments}, additional_comments),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Survey updated successfully'
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}
