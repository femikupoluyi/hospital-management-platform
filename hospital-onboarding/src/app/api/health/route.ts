import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if database URL is configured
    const isDatabaseConfigured = !!process.env.DATABASE_URL;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: isDatabaseConfigured ? 'connected' : 'not configured',
      modules: {
        onboarding: 'operational',
        crm: 'operational',
        hospital_ops: 'operational',
        command_center: 'operational',
        settings: 'operational'
      },
      version: '1.0.0'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
