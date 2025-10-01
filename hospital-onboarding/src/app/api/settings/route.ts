import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Create settings table if it doesn't exist
async function ensureSettingsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        category VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating settings table:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureSettingsTable();
    
    const settings = await sql`
      SELECT setting_key, setting_value, category
      FROM system_settings
      ORDER BY category, setting_key
    `;
    
    // Transform array to object
    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
    
    // Return default settings if none exist
    if (Object.keys(settingsObject).length === 0) {
      return NextResponse.json({
        success: true,
        data: getDefaultSettings()
      });
    }
    
    return NextResponse.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSettingsTable();
    
    const body = await request.json();
    
    // Save each setting category
    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO system_settings (setting_key, setting_value, category)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${key})
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = ${JSON.stringify(value)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

function getDefaultSettings() {
  return {
    currency: {
      code: 'NGN',
      symbol: '₦',
      name: 'Nigerian Naira',
      position: 'before',
      decimal_places: 2,
      thousands_separator: ',',
      decimal_separator: '.'
    },
    timezone: {
      zone: 'Africa/Lagos',
      offset: '+01:00',
      name: 'West Africa Time (Lagos)'
    },
    language: {
      code: 'en',
      name: 'English',
      direction: 'ltr'
    },
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    theme: {
      mode: 'light',
      primaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      fontFamily: 'Inter',
      fontSize: 'medium'
    },
    organization: {
      name: 'GrandPro HMSO',
      logo: '/logo.png',
      tagline: 'Hospital Management Service Organization',
      headquarters: 'Lagos, Nigeria',
      contact_email: 'info@grandprohmso.com',
      contact_phone: '+234 800 123 4567',
      tax_id: 'TIN123456789',
      registration_number: 'RC1234567'
    },
    operations: {
      fiscal_year_start: 'January',
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      working_hours: {
        start: '08:00',
        end: '17:00'
      },
      emergency_contact: '+234 800 911 911',
      auto_refresh_interval: 30,
      data_retention_days: 365,
      session_timeout_minutes: 30
    },
    notifications: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: false,
      alert_sound: true,
      critical_alerts_email: 'alerts@grandprohmso.com',
      daily_reports: true,
      weekly_summaries: true
    },
    features: {
      enable_telemedicine: true,
      enable_online_payments: true,
      enable_patient_portal: true,
      enable_mobile_app: false,
      enable_api_access: true,
      enable_data_export: true,
      enable_audit_logs: true,
      multi_language_support: true
    }
  };
}
