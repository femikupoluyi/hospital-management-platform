import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - List inventory items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get('type');
    const category = searchParams.get('category');
    const hospitalId = searchParams.get('hospital_id');
    const lowStock = searchParams.get('low_stock');

    let query = `
      SELECT 
        i.*,
        COALESCE(SUM(sl.quantity_on_hand), 0) as total_stock,
        COALESCE(SUM(sl.quantity_available), 0) as available_stock,
        CASE 
          WHEN COALESCE(SUM(sl.quantity_on_hand), 0) <= i.reorder_level 
          THEN true 
          ELSE false 
        END as needs_reorder
      FROM inventory.items i
      LEFT JOIN inventory.stock_levels sl ON i.item_id = sl.item_id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;
    
    if (hospitalId) {
      conditions.push(`sl.hospital_id = $${++paramCount}`);
      params.push(hospitalId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY i.item_id';
    
    // Add HAVING clause for filters that depend on aggregates
    const havingConditions: string[] = [];
    
    if (itemType) {
      havingConditions.push(`i.item_type = $${++paramCount}`);
      params.push(itemType);
    }
    if (category) {
      havingConditions.push(`i.category = $${++paramCount}`);
      params.push(category);
    }
    if (lowStock === 'true') {
      havingConditions.push('COALESCE(SUM(sl.quantity_on_hand), 0) <= i.reorder_level');
    }
    
    if (havingConditions.length > 0) {
      query += ' HAVING ' + havingConditions.join(' AND ');
    }
    
    query += ' ORDER BY i.item_name';
    
    const items = params.length > 0 
      ? await sql.query(query, params)
      : await sql.query(query);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

// POST - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await sql`
      INSERT INTO inventory.items (
        item_code,
        item_name,
        item_type,
        category,
        subcategory,
        unit_of_measure,
        manufacturer,
        brand,
        generic_name,
        strength,
        form,
        reorder_level,
        reorder_quantity,
        requires_prescription,
        is_controlled,
        storage_conditions
      ) VALUES (
        ${body.item_code},
        ${body.item_name},
        ${body.item_type},
        ${body.category || null},
        ${body.subcategory || null},
        ${body.unit_of_measure || null},
        ${body.manufacturer || null},
        ${body.brand || null},
        ${body.generic_name || null},
        ${body.strength || null},
        ${body.form || null},
        ${body.reorder_level || 0},
        ${body.reorder_quantity || 0},
        ${body.requires_prescription || false},
        ${body.is_controlled || false},
        ${body.storage_conditions || null}
      )
      RETURNING *
    `;
    
    return NextResponse.json({ 
      message: 'Item added successfully',
      item: result[0] 
    });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
}
