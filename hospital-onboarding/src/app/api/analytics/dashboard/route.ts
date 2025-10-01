import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hospitalId = searchParams.get('hospital_id') || '37f6c11b-5ded-4c17-930d-88b1fec06301';
    const dateFrom = searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('date_to') || new Date().toISOString().split('T')[0];

    // Get hospital info and bed capacity
    const hospitalInfo = await sql`
      SELECT 
        name,
        bed_capacity,
        staff_count,
        departments,
        services_offered
      FROM organization.hospitals
      WHERE id = ${hospitalId}
    `;

    // Get occupancy metrics
    const occupancyMetrics = await sql`
      SELECT 
        COUNT(DISTINCT e.encounter_id) as total_encounters,
        COUNT(DISTINCT CASE WHEN e.status = 'active' AND e.encounter_type = 'inpatient' THEN e.encounter_id END) as current_inpatients,
        COUNT(DISTINCT CASE WHEN e.status = 'active' AND e.bed_number IS NOT NULL THEN e.bed_number END) as occupied_beds,
        COUNT(DISTINCT CASE WHEN e.encounter_type = 'emergency' THEN e.encounter_id END) as emergency_visits,
        COUNT(DISTINCT CASE WHEN e.encounter_type = 'outpatient' THEN e.encounter_id END) as outpatient_visits
      FROM emr.encounters e
      WHERE e.hospital_id = ${hospitalId}
        AND DATE(e.admission_date) BETWEEN ${dateFrom} AND ${dateTo}
    `;

    // Calculate occupancy rate
    const bedOccupancyRate = hospitalInfo[0]?.bed_capacity 
      ? ((occupancyMetrics[0].occupied_beds / hospitalInfo[0].bed_capacity) * 100).toFixed(1)
      : 0;

    // Get patient flow by day
    const patientFlow = await sql`
      SELECT 
        DATE(admission_date) as date,
        COUNT(*) as admissions,
        COUNT(CASE WHEN encounter_type = 'emergency' THEN 1 END) as emergency,
        COUNT(CASE WHEN encounter_type = 'outpatient' THEN 1 END) as outpatient,
        COUNT(CASE WHEN encounter_type = 'inpatient' THEN 1 END) as inpatient
      FROM emr.encounters
      WHERE hospital_id = ${hospitalId}
        AND DATE(admission_date) BETWEEN ${dateFrom} AND ${dateTo}
      GROUP BY DATE(admission_date)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Get revenue metrics
    const revenueMetrics = await sql`
      SELECT 
        COUNT(DISTINCT invoice_id) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as collected_revenue,
        COALESCE(SUM(balance_amount), 0) as pending_revenue,
        COALESCE(AVG(total_amount), 0) as average_invoice_amount,
        COUNT(DISTINCT CASE WHEN payment_status = 'paid' THEN invoice_id END) as paid_invoices,
        COUNT(DISTINCT CASE WHEN payment_status = 'pending' THEN invoice_id END) as pending_invoices
      FROM billing.invoices
      WHERE hospital_id = ${hospitalId}
        AND DATE(invoice_date) BETWEEN ${dateFrom} AND ${dateTo}
    `;

    // Get revenue by payment method
    const revenueByMethod = await sql`
      SELECT 
        billing_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM billing.invoices
      WHERE hospital_id = ${hospitalId}
        AND DATE(invoice_date) BETWEEN ${dateFrom} AND ${dateTo}
      GROUP BY billing_type
      ORDER BY amount DESC
    `;

    // Get department utilization
    const departmentUtilization = await sql`
      SELECT 
        department,
        COUNT(*) as visits,
        COUNT(DISTINCT patient_id) as unique_patients,
        AVG(EXTRACT(EPOCH FROM (COALESCE(discharge_date, CURRENT_TIMESTAMP) - admission_date)) / 3600) as avg_duration_hours
      FROM emr.encounters
      WHERE hospital_id = ${hospitalId}
        AND DATE(admission_date) BETWEEN ${dateFrom} AND ${dateTo}
        AND department IS NOT NULL
      GROUP BY department
      ORDER BY visits DESC
    `;

    // Get staff metrics
    const staffMetrics = await sql`
      SELECT 
        COUNT(DISTINCT s.staff_id) as total_staff,
        COUNT(DISTINCT CASE WHEN s.staff_type = 'doctor' THEN s.staff_id END) as doctors,
        COUNT(DISTINCT CASE WHEN s.staff_type = 'nurse' THEN s.staff_id END) as nurses,
        COUNT(DISTINCT CASE WHEN s.employment_status = 'active' THEN s.staff_id END) as active_staff,
        COUNT(DISTINCT CASE WHEN s.employment_status = 'on_leave' THEN s.staff_id END) as on_leave
      FROM hr.staff s
      WHERE s.hospital_id = ${hospitalId}
    `;

    // Get today's schedules
    const todaySchedules = await sql`
      SELECT 
        COUNT(DISTINCT ss.staff_id) as scheduled_today,
        COUNT(DISTINCT CASE WHEN ss.status = 'present' THEN ss.staff_id END) as present_today
      FROM hr.staff_schedules ss
      JOIN hr.staff s ON ss.staff_id = s.staff_id
      WHERE s.hospital_id = ${hospitalId}
        AND ss.schedule_date = CURRENT_DATE
    `;

    // Get inventory alerts
    const inventoryAlerts = await sql`
      SELECT 
        i.item_name,
        i.item_type,
        i.reorder_level,
        COALESCE(SUM(sl.quantity_on_hand), 0) as current_stock
      FROM inventory.items i
      LEFT JOIN inventory.stock_levels sl ON i.item_id = sl.item_id AND sl.hospital_id = ${hospitalId}
      WHERE i.is_active = true
      GROUP BY i.item_id, i.item_name, i.item_type, i.reorder_level
      HAVING COALESCE(SUM(sl.quantity_on_hand), 0) <= i.reorder_level
      ORDER BY current_stock ASC
      LIMIT 10
    `;

    // Get top diagnoses
    const topDiagnoses = await sql`
      SELECT 
        d.diagnosis_description,
        COUNT(*) as count
      FROM emr.diagnoses d
      JOIN emr.encounters e ON d.encounter_id = e.encounter_id
      WHERE e.hospital_id = ${hospitalId}
        AND DATE(e.admission_date) BETWEEN ${dateFrom} AND ${dateTo}
      GROUP BY d.diagnosis_description
      ORDER BY count DESC
      LIMIT 10
    `;

    // Compile dashboard data
    const dashboardData = {
      hospital: hospitalInfo[0],
      metrics: {
        occupancy: {
          ...occupancyMetrics[0],
          bed_capacity: hospitalInfo[0]?.bed_capacity || 0,
          occupancy_rate: bedOccupancyRate,
          available_beds: (hospitalInfo[0]?.bed_capacity || 0) - occupancyMetrics[0].occupied_beds
        },
        revenue: {
          ...revenueMetrics[0],
          revenue_by_method: revenueByMethod,
          collection_rate: revenueMetrics[0].total_revenue > 0 
            ? ((revenueMetrics[0].collected_revenue / revenueMetrics[0].total_revenue) * 100).toFixed(1)
            : 0
        },
        staff: {
          ...staffMetrics[0],
          ...todaySchedules[0],
          attendance_rate: todaySchedules[0].scheduled_today > 0
            ? ((todaySchedules[0].present_today / todaySchedules[0].scheduled_today) * 100).toFixed(1)
            : 0
        }
      },
      charts: {
        patient_flow: patientFlow,
        department_utilization: departmentUtilization,
        top_diagnoses: topDiagnoses
      },
      alerts: {
        low_stock_items: inventoryAlerts,
        pending_revenue: revenueMetrics[0].pending_revenue,
        staff_on_leave: staffMetrics[0].on_leave
      },
      period: {
        from: dateFrom,
        to: dateTo
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
