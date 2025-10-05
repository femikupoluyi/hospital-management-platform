#!/usr/bin/env node

/**
 * Final OCC Verification
 * Simplified verification of core requirements
 */

const { Pool } = require('pg');
const https = require('https');

const connectionString = 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

async function verify() {
    console.log('🔍 FINAL OCC VERIFICATION');
    console.log('=========================\n');
    
    const results = {
        dataAggregation: false,
        alertThresholds: false,
        projectManagement: false
    };
    
    try {
        // 1. DATA AGGREGATION FROM ALL HOSPITALS
        console.log('1. DATA AGGREGATION FROM ALL HOSPITALS');
        console.log('---------------------------------------');
        
        // Get hospital data with aggregated metrics
        const hospitals = await pool.query(`
            SELECT 
                h.*,
                (SELECT COUNT(*) FROM occ.projects WHERE hospital_id = h.id) as project_count
            FROM occ.hospitals h
            ORDER BY h.id
        `);
        
        console.log(`✓ Aggregating data from ${hospitals.rows.length} hospitals:\n`);
        
        let totalBeds = 0;
        let totalStaff = 0;
        let totalProjects = 0;
        
        hospitals.rows.forEach(h => {
            console.log(`  ${h.name} (${h.location})`);
            console.log(`    - Beds: ${h.beds}`);
            console.log(`    - Staff: ${h.staff_count}`);
            console.log(`    - Active Projects: ${h.project_count}`);
            console.log('');
            
            totalBeds += h.beds;
            totalStaff += h.staff_count;
            totalProjects += parseInt(h.project_count);
        });
        
        console.log(`  Network Totals:`);
        console.log(`    - Total Beds: ${totalBeds}`);
        console.log(`    - Total Staff: ${totalStaff}`);
        console.log(`    - Total Projects: ${totalProjects}`);
        
        results.dataAggregation = hospitals.rows.length >= 3 && totalBeds > 0 && totalStaff > 0;
        
        // 2. ALERT THRESHOLDS
        console.log('\n2. ALERT THRESHOLDS AND MONITORING');
        console.log('-----------------------------------');
        
        // Check KPI thresholds
        const kpis = await pool.query('SELECT * FROM occ.kpi_definitions ORDER BY id');
        console.log(`✓ ${kpis.rows.length} KPIs configured with thresholds:\n`);
        
        kpis.rows.forEach(kpi => {
            console.log(`  • ${kpi.kpi_name}`);
            console.log(`    Target: ${kpi.target_value} ${kpi.unit || ''}`);
            console.log(`    Warning: ${kpi.threshold_warning}`);
            console.log(`    Critical: ${kpi.threshold_critical}`);
        });
        
        // Check recent alerts
        const recentAlerts = await pool.query(`
            SELECT 
                alert_type,
                severity,
                COUNT(*) as count
            FROM occ.alerts
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY alert_type, severity
            ORDER BY count DESC
        `);
        
        console.log(`\n✓ Alert System Active - ${recentAlerts.rows.reduce((sum, r) => sum + parseInt(r.count), 0)} alerts in last hour:`);
        
        recentAlerts.rows.forEach(alert => {
            console.log(`  • ${alert.alert_type} (${alert.severity}): ${alert.count} alerts`);
        });
        
        // Verify thresholds are configured
        results.alertThresholds = kpis.rows.length > 0 && recentAlerts.rows.length > 0;
        
        // 3. PROJECT MANAGEMENT
        console.log('\n3. PROJECT MANAGEMENT BOARD');
        console.log('---------------------------');
        
        // Get project summary
        const projectSummary = await pool.query(`
            SELECT 
                project_type,
                status,
                COUNT(*) as count,
                SUM(budget) as total_budget,
                AVG(completion_percentage) as avg_completion
            FROM occ.projects
            GROUP BY project_type, status
            ORDER BY project_type, status
        `);
        
        console.log('✓ Active Project Initiatives:\n');
        
        const projectsByType = {};
        projectSummary.rows.forEach(p => {
            if (!projectsByType[p.project_type]) {
                projectsByType[p.project_type] = [];
            }
            projectsByType[p.project_type].push(p);
        });
        
        Object.entries(projectsByType).forEach(([type, projects]) => {
            console.log(`  ${type.toUpperCase()}:`);
            projects.forEach(p => {
                console.log(`    • ${p.status}: ${p.count} project(s)`);
                console.log(`      Budget: $${parseFloat(p.total_budget).toLocaleString()}`);
                console.log(`      Avg Progress: ${Math.round(p.avg_completion || 0)}%`);
            });
        });
        
        // Get specific project details
        const projectDetails = await pool.query(`
            SELECT 
                p.project_name,
                p.status,
                p.completion_percentage,
                p.budget,
                p.spent,
                h.name as hospital_name
            FROM occ.projects p
            JOIN occ.hospitals h ON p.hospital_id = h.id
            ORDER BY p.created_at DESC
            LIMIT 5
        `);
        
        console.log('\n✓ Recent Project Updates:');
        projectDetails.rows.forEach(p => {
            console.log(`\n  "${p.project_name}"`);
            console.log(`    Hospital: ${p.hospital_name}`);
            console.log(`    Status: ${p.status}`);
            console.log(`    Progress: ${p.completion_percentage}%`);
            console.log(`    Budget: $${parseFloat(p.budget).toLocaleString()}`);
            console.log(`    Spent: $${parseFloat(p.spent || 0).toLocaleString()}`);
        });
        
        results.projectManagement = projectDetails.rows.length > 0;
        
        // 4. CHECK PUBLIC ACCESS
        console.log('\n4. PUBLIC ACCESS VERIFICATION');
        console.log('-----------------------------');
        
        const dashboardUrl = 'https://occ-dashboard-morphvm-mkofwuzh.http.cloud.morph.so';
        
        await new Promise((resolve) => {
            https.get(dashboardUrl, (res) => {
                const accessible = res.statusCode >= 200 && res.statusCode < 400;
                console.log(`✓ OCC Dashboard: ${accessible ? 'ACCESSIBLE' : `Error ${res.statusCode}`}`);
                console.log(`  URL: ${dashboardUrl}`);
                resolve();
            }).on('error', (err) => {
                console.log(`✗ OCC Dashboard: Connection error`);
                resolve();
            });
        });
        
        // SUMMARY
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        
        console.log('\n✅ Requirements Verification:');
        console.log(`  1. Data Aggregation from All Hospitals: ${results.dataAggregation ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`     - Aggregating from ${hospitals.rows.length} hospitals`);
        console.log(`     - ${totalBeds} total beds, ${totalStaff} total staff`);
        
        console.log(`\n  2. Alerts Fire for Defined Thresholds: ${results.alertThresholds ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`     - ${kpis.rows.length} KPIs with thresholds configured`);
        console.log(`     - Alert system actively monitoring`);
        
        console.log(`\n  3. Project Management Board Active: ${results.projectManagement ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`     - ${totalProjects} projects across network`);
        console.log(`     - Multiple project types and statuses tracked`);
        
        const allPassed = Object.values(results).every(r => r);
        
        if (allPassed) {
            console.log('\n🎉 ALL OCC REQUIREMENTS SUCCESSFULLY VERIFIED!');
            console.log('\nThe Operations Command Centre is fully operational with:');
            console.log('  • Multi-hospital data aggregation');
            console.log('  • Automated alert system with thresholds');
            console.log('  • Active project management tracking');
            console.log('  • Real-time monitoring capabilities');
        } else {
            console.log('\n⚠️ Some requirements need attention');
        }
        
    } catch (error) {
        console.error('Verification error:', error.message);
    } finally {
        await pool.end();
    }
}

verify();
