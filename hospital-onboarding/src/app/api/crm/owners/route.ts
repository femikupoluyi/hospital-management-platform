import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';

// GET - List owner accounts with details
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        oa.*,
        ho.name as owner_name,
        ho.email as owner_email,
        ho.phone as owner_phone,
        ho.company_name,
        COUNT(DISTINCT h.id) as hospital_count,
        COUNT(DISTINCT op.id) FILTER (WHERE op.status = 'pending') as pending_payouts_count
      FROM crm.owner_accounts oa
      LEFT JOIN organization.hospital_owners ho ON oa.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON h.owner_id = ho.id
      LEFT JOIN crm.owner_payouts op ON op.owner_id = ho.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE oa.account_status = $1';
      params.push(status);
    }

    query += `
      GROUP BY oa.id, ho.id
      ORDER BY oa.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeQuery(query, params);
    if (!result.success) throw new Error(result.error || "Query failed");
    const owners = result.data;

    return NextResponse.json({
      success: true,
      data: owners,
    });
  } catch (error) {
    console.error('Error fetching owner accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch owner accounts' },
      { status: 500 }
    );
  }
}

// POST - Create or update owner account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner_id, preferred_communication_channel, communication_frequency, notes } = body;

    // Check if account exists
    const existing = await sql`
      SELECT id FROM crm.owner_accounts WHERE owner_id = ${owner_id}
    `;

    if (existing.length > 0) {
      // Update existing account
      const [updated] = await sql`
        UPDATE crm.owner_accounts
        SET 
          preferred_communication_channel = ${preferred_communication_channel || 'email'},
          communication_frequency = ${communication_frequency || 'monthly'},
          notes = ${notes || null},
          updated_at = NOW()
        WHERE owner_id = ${owner_id}
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Owner account updated successfully',
      });
    } else {
      // Create new account
      const [created] = await sql`
        INSERT INTO crm.owner_accounts (
          owner_id,
          preferred_communication_channel,
          communication_frequency,
          notes
        ) VALUES (
          ${owner_id},
          ${preferred_communication_channel || 'email'},
          ${communication_frequency || 'monthly'},
          ${notes || null}
        ) RETURNING *
      `;

      return NextResponse.json({
        success: true,
        data: created,
        message: 'Owner account created successfully',
      });
    }
  } catch (error) {
    console.error('Error creating/updating owner account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update owner account' },
      { status: 500 }
    );
  }
}
