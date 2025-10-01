import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// POST - Process payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate payment reference
    const paymentReference = 'PAY-' + Date.now() + '-' + 
      Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // Start transaction
    let result: any;
    
    await sql`BEGIN`;
    
    try {
      // Record payment
      const payment = await sql`
        INSERT INTO billing.payments (
          payment_reference,
          invoice_id,
          amount,
          payment_method,
          payment_details,
          received_by,
          notes,
          status
        ) VALUES (
          ${paymentReference},
          ${body.invoice_id},
          ${body.amount},
          ${body.payment_method},
          ${body.payment_details || null}::jsonb,
          ${body.received_by || null},
          ${body.notes || null},
          ${body.status || 'completed'}
        )
        RETURNING *
      `;
      
      // Update invoice paid amount and balance
      const invoice = await sql`
        UPDATE billing.invoices
        SET 
          paid_amount = paid_amount + ${body.amount},
          balance_amount = total_amount - (paid_amount + ${body.amount}),
          payment_status = CASE 
            WHEN total_amount <= (paid_amount + ${body.amount}) THEN 'paid'
            WHEN paid_amount + ${body.amount} > 0 THEN 'partial'
            ELSE payment_status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = ${body.invoice_id}
        RETURNING *
      `;
      
      result = { payment: payment[0], invoice: invoice[0] };
      
      await sql`COMMIT`;
    } catch (err) {
      await sql`ROLLBACK`;
      throw err;
    }
    
    return NextResponse.json({ 
      message: 'Payment processed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

// GET - Get payment history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoice_id');
    const patientId = searchParams.get('patient_id');
    
    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.patient_id,
        pat.first_name || ' ' || pat.last_name as patient_name
      FROM billing.payments p
      JOIN billing.invoices i ON p.invoice_id = i.invoice_id
      JOIN crm.patients pat ON i.patient_id = pat.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (invoiceId) {
      query += ` AND p.invoice_id = $${++paramCount}`;
      params.push(invoiceId);
    }
    if (patientId) {
      query += ` AND i.patient_id = $${++paramCount}`;
      params.push(patientId);
    }
    
    query += ' ORDER BY p.payment_date DESC';
    
    const payments = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
