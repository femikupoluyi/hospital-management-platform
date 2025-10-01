import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get application counts by status
    const statusCounts = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM onboarding.applications
      GROUP BY status
    `;

    // Get total counts
    const [totals] = await sql`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' OR status = 'submitted' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_applications
      FROM onboarding.applications
    `;

    // Get average processing time (in days)
    const [processingTime] = await sql`
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (
            COALESCE(completion_date, approval_date, rejection_date, NOW()) - submission_date
          )) / 86400
        )::numeric(10,2) as avg_processing_days
      FROM onboarding.applications
      WHERE submission_date IS NOT NULL
    `;

    // Get documents pending verification
    const [pendingDocs] = await sql`
      SELECT COUNT(*) as pending_documents
      FROM onboarding.documents
      WHERE status = 'pending'
    `;

    // Get contracts pending signature
    const [pendingContracts] = await sql`
      SELECT COUNT(*) as pending_contracts
      FROM onboarding.contracts
      WHERE status IN ('draft', 'sent', 'viewed')
    `;

    // Get recent applications
    const recentApplications = await sql`
      SELECT 
        a.id,
        a.application_number,
        a.status,
        a.priority,
        a.submission_date,
        a.created_at,
        ho.name as owner_name,
        h.name as hospital_name,
        h.city as hospital_city
      FROM onboarding.applications a
      LEFT JOIN organization.hospital_owners ho ON a.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `;

    // Get applications by month for the last 6 months
    const applicationsByMonth = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM onboarding.applications
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `;

    // Get applications by priority
    const priorityCounts = await sql`
      SELECT 
        priority,
        COUNT(*) as count
      FROM onboarding.applications
      WHERE status NOT IN ('completed', 'rejected')
      GROUP BY priority
    `;

    // Get top cities by applications
    const topCities = await sql`
      SELECT 
        h.city,
        COUNT(DISTINCT a.id) as application_count
      FROM onboarding.applications a
      JOIN organization.hospitals h ON a.hospital_id = h.id
      GROUP BY h.city
      ORDER BY application_count DESC
      LIMIT 5
    `;

    // Get hospital type distribution
    const hospitalTypes = await sql`
      SELECT 
        h.type,
        COUNT(DISTINCT a.id) as count
      FROM onboarding.applications a
      JOIN organization.hospitals h ON a.hospital_id = h.id
      GROUP BY h.type
    `;

    // Calculate conversion rates
    const [conversionRates] = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        CASE 
          WHEN COUNT(*) > 0 
          THEN (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100)::numeric(5,2)
          ELSE 0 
        END as completion_rate,
        CASE 
          WHEN COUNT(*) > 0 
          THEN (COUNT(CASE WHEN status = 'rejected' THEN 1 END)::float / COUNT(*)::float * 100)::numeric(5,2)
          ELSE 0 
        END as rejection_rate
      FROM onboarding.applications
      WHERE status NOT IN ('draft', 'submitted', 'pending')
    `;

    const dashboardData = {
      metrics: {
        totalApplications: parseInt(totals.total_applications || '0'),
        pendingApplications: parseInt(totals.pending_applications || '0'),
        approvedApplications: parseInt(totals.approved_applications || '0'),
        rejectedApplications: parseInt(totals.rejected_applications || '0'),
        completedApplications: parseInt(totals.completed_applications || '0'),
        averageProcessingDays: parseFloat(processingTime?.avg_processing_days || '0'),
        pendingDocuments: parseInt(pendingDocs.pending_documents || '0'),
        pendingContracts: parseInt(pendingContracts.pending_contracts || '0'),
        completionRate: parseFloat(conversionRates?.completion_rate || '0'),
        rejectionRate: parseFloat(conversionRates?.rejection_rate || '0'),
      },
      charts: {
        applicationsByStatus: statusCounts.map((item: any) => ({
          status: item.status,
          count: parseInt(item.count),
        })),
        applicationsByMonth: applicationsByMonth.map((item: any) => ({
          month: item.month,
          count: parseInt(item.count),
        })),
        applicationsByPriority: priorityCounts.map((item: any) => ({
          priority: item.priority,
          count: parseInt(item.count),
        })),
        topCities: topCities.map((item: any) => ({
          city: item.city,
          count: parseInt(item.application_count),
        })),
        hospitalTypes: hospitalTypes.map((item: any) => ({
          type: item.type,
          count: parseInt(item.count),
        })),
      },
      recentApplications: recentApplications,
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
