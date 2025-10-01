import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    // Get counts from our tables
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM organization.hospital_owners) as owners_count,
        (SELECT COUNT(*) FROM organization.hospitals) as hospitals_count,
        (SELECT COUNT(*) FROM onboarding.applications) as applications_count,
        (SELECT COUNT(*) FROM onboarding.evaluation_criteria) as criteria_count
    `;

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        time: result[0].current_time,
        version: result[0].pg_version,
      },
      tables: {
        hospital_owners: counts[0].owners_count,
        hospitals: counts[0].hospitals_count,
        applications: counts[0].applications_count,
        evaluation_criteria: counts[0].criteria_count,
      },
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
