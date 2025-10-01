import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// POST - Update stock levels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_id, hospital_id, movement_type, quantity, batch_number, expiry_date, unit_cost, performed_by, notes } = body;
    
    // Start transaction
    let result: any;
    
    await sql`BEGIN`;
    
    try {
      // Record stock movement
      const movement = await sql`
        INSERT INTO inventory.stock_movements (
          item_id,
          hospital_id,
          movement_type,
          batch_number,
          quantity,
          unit_cost,
          total_cost,
          performed_by,
          notes
        ) VALUES (
          ${item_id},
          ${hospital_id},
          ${movement_type},
          ${batch_number || null},
          ${quantity},
          ${unit_cost || null},
          ${(unit_cost || 0) * quantity},
          ${performed_by || null},
          ${notes || null}
        )
        RETURNING *
      `;
      
      // Update stock levels based on movement type
      let stockUpdate;
      
      if (movement_type === 'purchase' || movement_type === 'transfer_in') {
        // Check if stock level exists
        const existing = await sql`
          SELECT * FROM inventory.stock_levels
          WHERE item_id = ${item_id} 
            AND hospital_id = ${hospital_id}
            AND batch_number = ${batch_number || 'DEFAULT'}
        `;
        
        if (existing.length > 0) {
          // Update existing stock
          stockUpdate = await sql`
            UPDATE inventory.stock_levels
            SET 
              quantity_on_hand = quantity_on_hand + ${quantity},
              last_updated = CURRENT_TIMESTAMP
            WHERE item_id = ${item_id} 
              AND hospital_id = ${hospital_id}
              AND batch_number = ${batch_number || 'DEFAULT'}
            RETURNING *
          `;
        } else {
          // Create new stock level
          stockUpdate = await sql`
            INSERT INTO inventory.stock_levels (
              item_id,
              hospital_id,
              batch_number,
              expiry_date,
              quantity_on_hand,
              unit_cost,
              selling_price
            ) VALUES (
              ${item_id},
              ${hospital_id},
              ${batch_number || 'DEFAULT'},
              ${expiry_date || null},
              ${quantity},
              ${unit_cost || 0},
              ${(unit_cost || 0) * 1.5}
            )
            RETURNING *
          `;
        }
      } else if (movement_type === 'sale' || movement_type === 'transfer_out' || movement_type === 'expired' || movement_type === 'damaged') {
        // Reduce stock
        stockUpdate = await sql`
          UPDATE inventory.stock_levels
          SET 
            quantity_on_hand = GREATEST(0, quantity_on_hand - ${quantity}),
            last_updated = CURRENT_TIMESTAMP
          WHERE item_id = ${item_id} 
            AND hospital_id = ${hospital_id}
            AND (batch_number = ${batch_number} OR ${batch_number} IS NULL)
          RETURNING *
        `;
      }
      
      result = { movement: movement[0], stock: stockUpdate ? stockUpdate[0] : null };
      
      await sql`COMMIT`;
    } catch (err) {
      await sql`ROLLBACK`;
      throw err;
    }
    
    return NextResponse.json({ 
      message: 'Stock updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

// GET - Get stock levels
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('hospital_id');
    const itemId = searchParams.get('item_id');
    
    let query = `
      SELECT 
        sl.*,
        i.item_name,
        i.item_type,
        i.category,
        i.unit_of_measure,
        i.reorder_level,
        h.name as hospital_name
      FROM inventory.stock_levels sl
      JOIN inventory.items i ON sl.item_id = i.item_id
      JOIN organization.hospitals h ON sl.hospital_id = h.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (hospitalId) {
      query += ` AND sl.hospital_id = $${++paramCount}`;
      params.push(hospitalId);
    }
    if (itemId) {
      query += ` AND sl.item_id = $${++paramCount}`;
      params.push(itemId);
    }
    
    query += ' ORDER BY i.item_name, sl.expiry_date';
    
    const stockLevels = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ stock_levels: stockLevels });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock levels' },
      { status: 500 }
    );
  }
}
