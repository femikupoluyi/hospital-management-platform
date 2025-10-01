import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('id');
    const patientId = searchParams.get('patient_id');
    const status = searchParams.get('status');
    const hospitalId = searchParams.get('hospital_id');

    let query = `
      SELECT 
        i.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.patient_number,
        h.name as hospital_name
      FROM billing.invoices i
      LEFT JOIN crm.patients p ON i.patient_id = p.id
      LEFT JOIN organization.hospitals h ON i.hospital_id = h.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (invoiceId) {
      query += ` AND i.invoice_id = $${++paramCount}`;
      params.push(invoiceId);
    }
    if (patientId) {
      query += ` AND i.patient_id = $${++paramCount}`;
      params.push(patientId);
    }
    if (hospitalId) {
      query += ` AND i.hospital_id = $${++paramCount}`;
      params.push(hospitalId);
    }
    if (status) {
      query += ` AND i.payment_status = $${++paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY i.invoice_date DESC';

    const invoices = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    // Get invoice items if single invoice
    if (invoiceId && invoices.length > 0) {
      const items = await sql`
        SELECT * FROM billing.invoice_items
        WHERE invoice_id = ${invoiceId}
        ORDER BY created_at
      `;
      invoices[0].items = items;
    }
    
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate invoice number
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + 
      Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Start transaction
    let invoiceResult: any;
    
    await sql`BEGIN`;
    
    try {
      // Create invoice
      const invoice = await sql`
        INSERT INTO billing.invoices (
          invoice_number,
          encounter_id,
          patient_id,
          hospital_id,
          due_date,
          billing_type,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          balance_amount
        ) VALUES (
          ${invoiceNumber},
          ${body.encounter_id || null},
          ${body.patient_id},
          ${body.hospital_id},
          ${body.due_date || null},
          ${body.billing_type || 'cash'},
          ${body.subtotal || 0},
          ${body.tax_amount || 0},
          ${body.discount_amount || 0},
          ${body.total_amount || 0},
          ${body.total_amount || 0}
        )
        RETURNING *
      `;
      
      // Add invoice items if provided
      if (body.items && body.items.length > 0) {
        let totalAmount = 0;
        
        for (const item of body.items) {
          const itemTotal = item.quantity * item.unit_price * 
            (1 - (item.discount_percent || 0) / 100) * 
            (1 + (item.tax_percent || 0) / 100);
          
          await sql`
            INSERT INTO billing.invoice_items (
              invoice_id,
              item_type,
              item_code,
              item_description,
              quantity,
              unit_price,
              discount_percent,
              tax_percent,
              total_amount
            ) VALUES (
              ${invoice[0].invoice_id},
              ${item.item_type},
              ${item.item_code || null},
              ${item.item_description},
              ${item.quantity},
              ${item.unit_price},
              ${item.discount_percent || 0},
              ${item.tax_percent || 0},
              ${itemTotal}
            )
          `;
          
          totalAmount += itemTotal;
        }
        
        // Update invoice totals
        await sql`
          UPDATE billing.invoices
          SET 
            subtotal = ${totalAmount},
            total_amount = ${totalAmount},
            balance_amount = ${totalAmount}
          WHERE invoice_id = ${invoice[0].invoice_id}
        `;
        
        invoice[0].total_amount = totalAmount;
        invoice[0].balance_amount = totalAmount;
      }
      
      invoiceResult = invoice[0];
      
      await sql`COMMIT`;
    } catch (err) {
      await sql`ROLLBACK`;
      throw err;
    }
    
    return NextResponse.json({ 
      message: 'Invoice created successfully',
      invoice: invoiceResult
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// PUT - Update invoice status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id, payment_status } = body;
    
    if (!invoice_id || !payment_status) {
      return NextResponse.json(
        { error: 'Invoice ID and payment status are required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE billing.invoices 
      SET 
        payment_status = ${payment_status},
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = ${invoice_id}
      RETURNING *
    `;
    
    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: result[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
