import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get all hospitals
    const hospitals = await sql`
      SELECT 
        h.id as hospital_id,
        h.name as hospital_name,
        h.city,
        h.status,
        h.bed_capacity,
        h.staff_count,
        COALESCE(
          (SELECT COUNT(*) FROM emr.encounters e 
           WHERE e.hospital_id = h.id 
           AND e.status = 'active' 
           AND e.bed_number IS NOT NULL), 0
        ) as occupied_beds,
        COALESCE(
          (SELECT COUNT(*) FROM emr.encounters e 
           WHERE e.hospital_id = h.id 
           AND DATE(e.admission_date) = CURRENT_DATE), 0
        ) as patient_inflow,
        COALESCE(
          (SELECT COUNT(*) FROM emr.encounters e 
           WHERE e.hospital_id = h.id 
           AND e.encounter_type = 'emergency'
           AND DATE(e.admission_date) = CURRENT_DATE), 0
        ) as emergency_cases,
        COALESCE(
          (SELECT COUNT(*) FROM hr.staff_schedules ss
           JOIN hr.staff s ON ss.staff_id = s.staff_id
           WHERE s.hospital_id = h.id 
           AND ss.schedule_date = CURRENT_DATE
           AND ss.status = 'present'), 0
        ) as staff_present,
        COALESCE(
          (SELECT COUNT(*) FROM hr.staff s
           WHERE s.hospital_id = h.id 
           AND s.employment_status = 'active'), 0
        ) as total_staff,
        COALESCE(
          (SELECT SUM(i.total_amount) FROM billing.invoices i
           WHERE i.hospital_id = h.id 
           AND DATE(i.invoice_date) = CURRENT_DATE), 0
        ) as revenue_today,
        COALESCE(
          (SELECT SUM(i.balance_amount) FROM billing.invoices i
           WHERE i.hospital_id = h.id 
           AND i.payment_status IN ('pending', 'partial')), 0
        ) as pending_amount
      FROM organization.hospitals h
      WHERE h.status = 'active'
    `;

    // Calculate metrics for each hospital
    const hospitalMetrics = hospitals.map(h => {
      const occupancyRate = h.bed_capacity > 0 
        ? ((h.occupied_beds / h.bed_capacity) * 100).toFixed(1) 
        : 0;
      
      const staffAttendanceRate = h.total_staff > 0
        ? ((h.staff_present / h.total_staff) * 100).toFixed(1)
        : 0;

      // Calculate performance score based on multiple factors
      let performanceScore = 0;
      
      // Occupancy score (optimal is 70-85%)
      const occupancy = parseFloat(occupancyRate.toString());
      if (occupancy >= 70 && occupancy <= 85) {
        performanceScore += 30;
      } else if (occupancy < 70) {
        performanceScore += (occupancy / 70) * 20;
      } else {
        performanceScore += Math.max(0, 30 - (occupancy - 85) * 2);
      }
      
      // Staff attendance score
      performanceScore += (parseFloat(staffAttendanceRate.toString()) / 100) * 30;
      
      // Revenue collection score
      const revenueTarget = 50000; // Daily target
      performanceScore += Math.min(30, (h.revenue_today / revenueTarget) * 30);
      
      // Emergency response (lower is better)
      performanceScore += Math.max(0, 10 - h.emergency_cases * 0.5);

      // Determine status based on critical factors
      let status = 'operational';
      if (occupancy > 90 || parseFloat(staffAttendanceRate.toString()) < 70) {
        status = 'warning';
      }
      if (occupancy > 95 || parseFloat(staffAttendanceRate.toString()) < 60 || h.emergency_cases > 15) {
        status = 'critical';
      }

      // Count critical alerts
      let criticalAlerts = 0;
      if (occupancy > 90) criticalAlerts++;
      if (parseFloat(staffAttendanceRate.toString()) < 70) criticalAlerts++;
      if (h.emergency_cases > 10) criticalAlerts++;

      return {
        hospital_id: h.hospital_id,
        hospital_name: h.hospital_name,
        city: h.city,
        status,
        occupancy_rate: parseFloat(occupancyRate.toString()),
        patient_inflow: parseInt(h.patient_inflow),
        emergency_cases: parseInt(h.emergency_cases),
        staff_present: parseFloat(staffAttendanceRate.toString()),
        revenue_today: parseFloat(h.revenue_today),
        pending_amount: parseFloat(h.pending_amount),
        critical_alerts: criticalAlerts,
        performance_score: Math.round(performanceScore)
      };
    });

    // Get system-wide alerts
    const alerts = await sql`
      SELECT 
        'low_stock' as type,
        h.name as hospital,
        'warning' as severity,
        'Inventory' as category,
        i.item_name || ' stock below reorder level' as message,
        NOW() as timestamp
      FROM inventory.stock_levels sl
      JOIN inventory.items i ON sl.item_id = i.item_id
      JOIN organization.hospitals h ON sl.hospital_id = h.id
      WHERE sl.quantity_on_hand <= i.reorder_level
      UNION ALL
      SELECT 
        'high_occupancy' as type,
        h.name as hospital,
        CASE 
          WHEN COUNT(e.encounter_id)::float / NULLIF(h.bed_capacity, 0) > 0.95 THEN 'critical'
          ELSE 'warning'
        END as severity,
        'Capacity' as category,
        'Bed occupancy at ' || ROUND((COUNT(e.encounter_id)::float / NULLIF(h.bed_capacity, 0)) * 100) || '%' as message,
        NOW() as timestamp
      FROM organization.hospitals h
      LEFT JOIN emr.encounters e ON h.id = e.hospital_id AND e.status = 'active'
      GROUP BY h.id, h.name, h.bed_capacity
      HAVING COUNT(e.encounter_id)::float / NULLIF(h.bed_capacity, 0) > 0.85
      LIMIT 10
    `;

    // Get project updates (simulated for now)
    const projects = [
      {
        id: 'proj1',
        hospital_id: hospitals[0]?.hospital_id,
        project_name: 'Emergency Wing Expansion',
        type: 'expansion',
        status: 'in_progress',
        progress: 45,
        budget: 2500000,
        spent: 1125000,
        deadline: '2026-03-31'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        hospitals: hospitalMetrics,
        alerts: alerts,
        projects: projects,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching operations metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations metrics' },
      { status: 500 }
    );
  }
}
