import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';

// GET - Get single application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get application with related data
    const [application] = await sql`
      SELECT 
        a.*,
        ho.name as owner_name,
        ho.email as owner_email,
        ho.phone as owner_phone,
        ho.company_name,
        h.name as hospital_name,
        h.type as hospital_type,
        h.address as hospital_address,
        h.city as hospital_city,
        h.bed_capacity,
        h.staff_count
      FROM onboarding.applications a
      LEFT JOIN organization.hospital_owners ho ON a.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE a.id = ${id}
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get evaluation scores
    const scores = await sql`
      SELECT * FROM onboarding.evaluation_scores
      WHERE application_id = ${id}
      ORDER BY created_at DESC
    `;

    // Get documents
    const documents = await sql`
      SELECT * FROM onboarding.documents
      WHERE application_id = ${id}
      ORDER BY created_at DESC
    `;

    // Get status history
    const statusHistory = await sql`
      SELECT * FROM onboarding.application_status_history
      WHERE application_id = ${id}
      ORDER BY created_at DESC
    `;

    // Get contract if exists
    const contracts = await sql`
      SELECT * FROM onboarding.contracts
      WHERE application_id = ${id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        application,
        scores,
        documents,
        statusHistory,
        contract: contracts[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PATCH - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, priority, assigned_reviewer, rejection_reason } = body;

    // Get current application
    const [currentApp] = await sql`
      SELECT * FROM onboarding.applications WHERE id = ${id}
    `;

    if (!currentApp) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      // Update relevant date fields based on status
      if (status === 'under_review') {
        updates.push(`review_start_date = NOW()`);
      } else if (status === 'approved') {
        updates.push(`approval_date = NOW()`);
      } else if (status === 'rejected') {
        updates.push(`rejection_date = NOW()`);
        if (rejection_reason) {
          updates.push(`rejection_reason = $${paramIndex++}`);
          values.push(rejection_reason);
        }
      } else if (status === 'completed') {
        updates.push(`completion_date = NOW()`);
      }
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (priority) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (assigned_reviewer) {
      updates.push(`assigned_reviewer = $${paramIndex++}`);
      values.push(assigned_reviewer);
    }

    updates.push('updated_at = NOW()');

    values.push(id); // Add ID as the last parameter

    // Use raw SQL query with dynamic parameters
    const updateQuery = `
      UPDATE onboarding.applications 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(updateQuery, values);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update application');
    }
    const [updatedApp] = result.data as any[];

    // Add to status history if status changed
    if (status && status !== currentApp.status) {
      await sql`
        INSERT INTO onboarding.application_status_history (
          application_id, old_status, new_status, reason
        ) VALUES (
          ${id},
          ${currentApp.status},
          ${status},
          ${rejection_reason || notes || 'Status updated'}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      data: updatedApp,
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
