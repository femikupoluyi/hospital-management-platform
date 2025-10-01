import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';

// GET - List payouts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner_id = searchParams.get('owner_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (owner_id) {
      conditions.push(`op.owner_id = $${paramIndex++}`);
      params.push(owner_id);
    }

    if (status) {
      conditions.push(`op.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        op.*,
        ho.name as owner_name,
        ho.email as owner_email,
        h.name as hospital_name,
        h.code as hospital_code
      FROM crm.owner_payouts op
      LEFT JOIN organization.hospital_owners ho ON op.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON op.hospital_id = h.id
      ${whereClause}
      ORDER BY op.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const result = await executeQuery(query, params);
    if (!result.success) throw new Error(result.error || "Query failed");
    const payouts = result.data;

    // Get totals
    const totalsQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(gross_revenue) as total_gross,
        SUM(net_payout) as total_net,
        SUM(CASE WHEN status = 'pending' THEN net_payout ELSE 0 END) as pending_amount
      FROM crm.owner_payouts op
      ${whereClause}
    `;

    const totalsResult = await executeQuery(totalsQuery, params);
    if (!totalsResult.success) throw new Error(totalsResult.error || "Query failed");
    const [totals] = totalsResult.data;

    return NextResponse.json({
      success: true,
      data: payouts,
      summary: {
        total_count: parseInt(totals.total_count || '0'),
        total_gross: parseFloat(totals.total_gross || '0'),
        total_net: parseFloat(totals.total_net || '0'),
        pending_amount: parseFloat(totals.pending_amount || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

// POST - Create payout record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      owner_id,
      hospital_id,
      payout_period,
      period_start,
      period_end,
      gross_revenue,
      management_fee_percentage,
    } = body;

    // Calculate fees and net payout
    const management_fee_amount = (gross_revenue * management_fee_percentage) / 100;
    const net_payout = gross_revenue - management_fee_amount;

    const [payout] = await sql`
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
        ${owner_id},
        ${hospital_id},
        ${payout_period},
        ${period_start},
        ${period_end},
        ${gross_revenue},
        ${management_fee_percentage},
        ${management_fee_amount},
        ${net_payout},
        'pending'
      ) RETURNING *
    `;

    // Update owner account totals
    await sql`
      UPDATE crm.owner_accounts
      SET 
        total_revenue = total_revenue + ${gross_revenue},
        pending_payouts = pending_payouts + ${net_payout},
        updated_at = NOW()
      WHERE owner_id = ${owner_id}
    `;

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Payout record created successfully',
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payout' },
      { status: 500 }
    );
  }
}

// PATCH - Process payout
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { payout_id, status, payment_reference, payment_method } = body;

    const [updated] = await sql`
      UPDATE crm.owner_payouts
      SET 
        status = ${status},
        payment_reference = ${payment_reference || null},
        payment_method = ${payment_method || null},
        payment_date = ${status === 'completed' ? new Date().toISOString() : null},
        updated_at = NOW()
      WHERE id = ${payout_id}
      RETURNING *
    `;

    // If completed, update owner account
    if (status === 'completed') {
      await sql`
        UPDATE crm.owner_accounts oa
        SET 
          total_payouts = total_payouts + op.net_payout,
          pending_payouts = pending_payouts - op.net_payout,
          updated_at = NOW()
        FROM crm.owner_payouts op
        WHERE op.id = ${payout_id}
          AND oa.owner_id = op.owner_id
      `;
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Payout ${status} successfully`,
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payout' },
      { status: 500 }
    );
  }
}
