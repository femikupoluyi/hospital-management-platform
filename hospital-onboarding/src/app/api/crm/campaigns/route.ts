import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';
import { communicationService } from '@/lib/communications';

// GET - List campaigns
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const campaign_type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (campaign_type) {
      conditions.push(`campaign_type = $${paramIndex++}`);
      params.push(campaign_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT * FROM communications.campaigns
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeQuery(query, params);
    if (!result.success) throw new Error(result.error || "Query failed");
    const campaigns = result.data;

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaign_name,
      campaign_type,
      target_audience,
      audience_filters,
      channels,
      subject,
      content_template,
      personalization_fields,
      schedule_type,
      scheduled_time,
      recurrence_pattern,
    } = body;

    const [campaign] = await sql`
      INSERT INTO communications.campaigns (
        campaign_name,
        campaign_type,
        target_audience,
        audience_filters,
        channels,
        subject,
        content_template,
        personalization_fields,
        schedule_type,
        scheduled_time,
        recurrence_pattern,
        status
      ) VALUES (
        ${campaign_name},
        ${campaign_type},
        ${target_audience},
        ${JSON.stringify(audience_filters || {})},
        ${JSON.stringify(channels)},
        ${subject || null},
        ${content_template},
        ${JSON.stringify(personalization_fields || [])},
        ${schedule_type},
        ${scheduled_time || null},
        ${JSON.stringify(recurrence_pattern || null)},
        ${schedule_type === 'immediate' ? 'scheduled' : 'draft'}
      ) RETURNING *
    `;

    // If immediate, send the campaign
    if (schedule_type === 'immediate') {
      // Run asynchronously
      setTimeout(async () => {
        await communicationService.sendCampaign(campaign.id);
      }, 1000);
    }

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// POST - Send campaign
export async function sendCampaign(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_id } = body;

    // Check campaign exists and is not already sent
    const [campaign] = await sql`
      SELECT * FROM communications.campaigns
      WHERE id = ${campaign_id}
    `;

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.status === 'in_progress' || campaign.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Campaign already sent or in progress' },
        { status: 400 }
      );
    }

    // Send campaign
    const result = await communicationService.sendCampaign(campaign_id);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Campaign sent to ${result.sent} recipients`,
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
