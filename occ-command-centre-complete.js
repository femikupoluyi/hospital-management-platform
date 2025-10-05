#!/usr/bin/env node

/**
 * Centralized Operations & Development Management Command Centre
 * Complete implementation with real-time monitoring, alerts, and project management
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection
const connectionString = 'postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WebSocket connections management
const wsClients = new Map(); // Store clients by hospital ID
const allClients = new Set();

wss.on('connection', (ws, req) => {
    allClients.add(ws);
    console.log('New WebSocket client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.hospitalId) {
                wsClients.set(data.hospitalId, ws);
            }
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    });
    
    ws.on('close', () => {
        allClients.delete(ws);
        // Remove from hospital-specific clients
        for (const [hospitalId, client] of wsClients.entries()) {
            if (client === ws) {
                wsClients.delete(hospitalId);
            }
        }
    });
});

// Broadcast to all clients
function broadcastToAll(data) {
    const message = JSON.stringify(data);
    allClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Broadcast to specific hospital
function broadcastToHospital(hospitalId, data) {
    const client = wsClients.get(hospitalId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}

// Initialize OCC database schema
async function initializeDatabase() {
    try {
        await pool.query('CREATE SCHEMA IF NOT EXISTS occ');
        
        // Monitoring metrics table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.monitoring_metrics (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50),
                metric_type VARCHAR(100),
                metric_value JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.alerts (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50),
                alert_type VARCHAR(100),
                severity VARCHAR(20),
                message TEXT,
                status VARCHAR(20) DEFAULT 'active',
                acknowledged BOOLEAN DEFAULT false,
                acknowledged_by VARCHAR(100),
                acknowledged_at TIMESTAMP,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Projects table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.projects (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50),
                project_name VARCHAR(255),
                project_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'planning',
                budget DECIMAL(12, 2),
                spent DECIMAL(12, 2) DEFAULT 0,
                start_date DATE,
                end_date DATE,
                completion_percentage INTEGER DEFAULT 0,
                project_manager VARCHAR(255),
                description TEXT,
                milestones JSONB,
                resources JSONB,
                risks JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Project tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.project_tasks (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES occ.projects(id),
                task_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                assigned_to VARCHAR(255),
                priority VARCHAR(20),
                due_date DATE,
                completed_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Hospital registry
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.hospitals (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                location VARCHAR(255),
                beds INTEGER,
                staff_count INTEGER,
                status VARCHAR(50) DEFAULT 'operational',
                performance_score DECIMAL(3, 2),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // KPI definitions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.kpi_definitions (
                id SERIAL PRIMARY KEY,
                kpi_name VARCHAR(255),
                category VARCHAR(100),
                target_value DECIMAL(10, 2),
                unit VARCHAR(50),
                calculation_method TEXT,
                threshold_warning DECIMAL(10, 2),
                threshold_critical DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Performance metrics
        await pool.query(`
            CREATE TABLE IF NOT EXISTS occ.performance_metrics (
                id SERIAL PRIMARY KEY,
                hospital_id VARCHAR(50),
                kpi_id INTEGER REFERENCES occ.kpi_definitions(id),
                value DECIMAL(10, 2),
                period_start DATE,
                period_end DATE,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert sample hospitals
        await pool.query(`
            INSERT INTO occ.hospitals (id, name, location, beds, staff_count)
            VALUES 
                ('HOSP001', 'Central Hospital', 'Lagos', 200, 150),
                ('HOSP002', 'Regional Medical Center', 'Abuja', 150, 120),
                ('HOSP003', 'Community Health Center', 'Port Harcourt', 100, 80)
            ON CONFLICT (id) DO NOTHING
        `);
        
        // Insert KPI definitions
        await pool.query(`
            INSERT INTO occ.kpi_definitions (kpi_name, category, target_value, unit, threshold_warning, threshold_critical)
            VALUES 
                ('Bed Occupancy Rate', 'Operational', 85, '%', 95, 98),
                ('Average Wait Time', 'Patient Experience', 30, 'minutes', 45, 60),
                ('Staff Utilization', 'HR', 80, '%', 90, 95),
                ('Revenue per Patient', 'Financial', 500, 'USD', 400, 350),
                ('Patient Satisfaction', 'Quality', 4.5, 'rating', 4.0, 3.5),
                ('Inventory Turnover', 'Supply Chain', 12, 'times/year', 10, 8),
                ('Emergency Response Time', 'Clinical', 5, 'minutes', 7, 10)
            ON CONFLICT DO NOTHING
        `);
        
        console.log('✓ OCC database initialized successfully');
        
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// ============= MONITORING ENDPOINTS =============

// Get real-time monitoring dashboard data
app.get('/api/monitoring/dashboard', async (req, res) => {
    try {
        const { hospitalId } = req.query;
        
        // Get patient inflows (last 24 hours)
        const patientInflows = await pool.query(`
            SELECT 
                DATE_TRUNC('hour', created_at) as hour,
                COUNT(*) as patients
            FROM hms.patients
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ${hospitalId ? "AND hospital_id = $1" : ""}
            GROUP BY hour
            ORDER BY hour
        `, hospitalId ? [hospitalId] : []);
        
        // Get current admissions
        const admissions = await pool.query(`
            SELECT 
                COUNT(*) as total_admissions,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_admissions,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_admissions
            FROM hms.admissions
            ${hospitalId ? "WHERE hospital_id = $1" : ""}
        `, hospitalId ? [hospitalId] : []);
        
        // Get bed occupancy across hospitals
        const bedOccupancy = await pool.query(`
            SELECT 
                h.id as hospital_id,
                h.name as hospital_name,
                COUNT(b.id) as total_beds,
                COUNT(CASE WHEN b.is_occupied THEN 1 END) as occupied_beds,
                ROUND(COUNT(CASE WHEN b.is_occupied THEN 1 END)::numeric / NULLIF(COUNT(b.id), 0) * 100, 2) as occupancy_rate
            FROM occ.hospitals h
            LEFT JOIN hms.beds b ON b.hospital_id = h.id
            ${hospitalId ? "WHERE h.id = $1" : ""}
            GROUP BY h.id, h.name
        `, hospitalId ? [hospitalId] : []);
        
        // Get staff KPIs
        const staffKPIs = await pool.query(`
            SELECT 
                COUNT(DISTINCT s.id) as total_staff,
                COUNT(DISTINCT ss.staff_id) as staff_on_duty,
                ROUND(AVG(s.performance_score), 2) as avg_performance_score,
                COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_staff
            FROM hms.staff s
            LEFT JOIN hms.staff_schedules ss ON s.id = ss.staff_id 
                AND ss.date = CURRENT_DATE
            ${hospitalId ? "WHERE s.hospital_id = $1" : ""}
        `, hospitalId ? [hospitalId] : []);
        
        // Get financial metrics
        const financialMetrics = await pool.query(`
            SELECT 
                SUM(total_amount) as total_revenue,
                SUM(paid_amount) as collected_revenue,
                SUM(total_amount - paid_amount) as outstanding_revenue,
                COUNT(*) as total_invoices,
                ROUND(AVG(total_amount), 2) as avg_invoice_amount
            FROM hms.billing
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            ${hospitalId ? "AND hospital_id = $1" : ""}
        `, hospitalId ? [hospitalId] : []);
        
        // Get active alerts count
        const activeAlerts = await pool.query(`
            SELECT 
                severity,
                COUNT(*) as count
            FROM occ.alerts
            WHERE status = 'active'
            ${hospitalId ? "AND hospital_id = $1" : ""}
            GROUP BY severity
        `, hospitalId ? [hospitalId] : []);
        
        res.json({
            patientInflows: patientInflows.rows,
            admissions: admissions.rows[0],
            bedOccupancy: bedOccupancy.rows,
            staffKPIs: staffKPIs.rows[0],
            financialMetrics: financialMetrics.rows[0],
            activeAlerts: activeAlerts.rows,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching monitoring dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get hospital-specific metrics
app.get('/api/monitoring/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        
        // Get hospital details
        const hospital = await pool.query(
            'SELECT * FROM occ.hospitals WHERE id = $1',
            [hospitalId]
        );
        
        // Get latest performance metrics
        const performance = await pool.query(`
            SELECT 
                kd.kpi_name,
                kd.category,
                pm.value,
                kd.target_value,
                kd.unit,
                CASE 
                    WHEN pm.value >= kd.target_value THEN 'good'
                    WHEN pm.value >= kd.threshold_warning THEN 'warning'
                    ELSE 'critical'
                END as status
            FROM occ.performance_metrics pm
            JOIN occ.kpi_definitions kd ON pm.kpi_id = kd.id
            WHERE pm.hospital_id = $1
            AND pm.recorded_at >= NOW() - INTERVAL '24 hours'
            ORDER BY pm.recorded_at DESC
        `, [hospitalId]);
        
        res.json({
            hospital: hospital.rows[0],
            performance: performance.rows,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching hospital metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// Record monitoring metrics
app.post('/api/monitoring/metrics', async (req, res) => {
    try {
        const { hospital_id, metric_type, metric_value } = req.body;
        
        const result = await pool.query(`
            INSERT INTO occ.monitoring_metrics (hospital_id, metric_type, metric_value)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [hospital_id, metric_type, JSON.stringify(metric_value)]);
        
        // Broadcast update
        broadcastToAll({
            type: 'metric_update',
            hospital_id,
            metric_type,
            data: result.rows[0]
        });
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error recording metric:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= ALERTING SYSTEM =============

// Create alert
app.post('/api/alerts', async (req, res) => {
    try {
        const { hospital_id, alert_type, severity, message } = req.body;
        
        const result = await pool.query(`
            INSERT INTO occ.alerts (hospital_id, alert_type, severity, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [hospital_id, alert_type, severity, message]);
        
        // Broadcast alert to all monitoring stations
        broadcastToAll({
            type: 'new_alert',
            alert: result.rows[0]
        });
        
        // Also send to specific hospital
        if (hospital_id) {
            broadcastToHospital(hospital_id, {
                type: 'alert',
                data: result.rows[0]
            });
        }
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active alerts
app.get('/api/alerts', async (req, res) => {
    try {
        const { hospitalId, severity, status = 'active' } = req.query;
        
        let query = 'SELECT * FROM occ.alerts WHERE 1=1';
        const params = [];
        
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        
        if (hospitalId) {
            params.push(hospitalId);
            query += ` AND hospital_id = $${params.length}`;
        }
        
        if (severity) {
            params.push(severity);
            query += ` AND severity = $${params.length}`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const alerts = await pool.query(query, params);
        res.json(alerts.rows);
        
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Acknowledge alert
app.put('/api/alerts/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;
        const { acknowledged_by } = req.body;
        
        const result = await pool.query(`
            UPDATE occ.alerts 
            SET acknowledged = true,
                acknowledged_by = $1,
                acknowledged_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [acknowledged_by, id]);
        
        broadcastToAll({
            type: 'alert_acknowledged',
            alert: result.rows[0]
        });
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resolve alert
app.put('/api/alerts/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        
        const result = await pool.query(`
            UPDATE occ.alerts 
            SET status = 'resolved',
                resolved_at = CURRENT_TIMESTAMP,
                message = message || E'\n\nResolution: ' || $1
            WHERE id = $2
            RETURNING *
        `, [resolution_notes || 'Resolved', id]);
        
        broadcastToAll({
            type: 'alert_resolved',
            alert: result.rows[0]
        });
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: error.message });
    }
});

// Automated alert checking
async function checkForAnomalies() {
    try {
        // Check for low stock items
        const lowStock = await pool.query(`
            SELECT 
                i.item_code,
                i.item_name,
                i.quantity,
                i.reorder_level,
                h.id as hospital_id,
                h.name as hospital_name
            FROM hms.inventory i
            JOIN occ.hospitals h ON i.hospital_id = h.id
            WHERE i.quantity <= i.reorder_level
        `);
        
        for (const item of lowStock.rows) {
            // Check if alert already exists
            const existingAlert = await pool.query(`
                SELECT id FROM occ.alerts 
                WHERE hospital_id = $1 
                AND alert_type = 'low_stock' 
                AND status = 'active'
                AND message LIKE $2
            `, [item.hospital_id, `%${item.item_code}%`]);
            
            if (existingAlert.rows.length === 0) {
                await pool.query(`
                    INSERT INTO occ.alerts (hospital_id, alert_type, severity, message)
                    VALUES ($1, $2, $3, $4)
                `, [
                    item.hospital_id,
                    'low_stock',
                    item.quantity === 0 ? 'critical' : 'warning',
                    `Low stock alert: ${item.item_name} (${item.item_code}) - Only ${item.quantity} units remaining`
                ]);
            }
        }
        
        // Check for high bed occupancy
        const highOccupancy = await pool.query(`
            SELECT 
                h.id as hospital_id,
                h.name as hospital_name,
                COUNT(b.id) as total_beds,
                COUNT(CASE WHEN b.is_occupied THEN 1 END) as occupied_beds,
                ROUND(COUNT(CASE WHEN b.is_occupied THEN 1 END)::numeric / NULLIF(COUNT(b.id), 0) * 100, 2) as occupancy_rate
            FROM occ.hospitals h
            LEFT JOIN hms.beds b ON b.hospital_id = h.id
            GROUP BY h.id, h.name
            HAVING COUNT(CASE WHEN b.is_occupied THEN 1 END)::numeric / NULLIF(COUNT(b.id), 0) > 0.95
        `);
        
        for (const hospital of highOccupancy.rows) {
            const existingAlert = await pool.query(`
                SELECT id FROM occ.alerts 
                WHERE hospital_id = $1 
                AND alert_type = 'high_occupancy' 
                AND status = 'active'
                AND created_at >= NOW() - INTERVAL '1 hour'
            `, [hospital.hospital_id]);
            
            if (existingAlert.rows.length === 0) {
                await pool.query(`
                    INSERT INTO occ.alerts (hospital_id, alert_type, severity, message)
                    VALUES ($1, $2, $3, $4)
                `, [
                    hospital.hospital_id,
                    'high_occupancy',
                    'warning',
                    `High bed occupancy alert: ${hospital.hospital_name} at ${hospital.occupancy_rate}% capacity`
                ]);
            }
        }
        
        // Check for outstanding revenue
        const outstandingRevenue = await pool.query(`
            SELECT 
                h.id as hospital_id,
                h.name as hospital_name,
                SUM(b.total_amount - b.paid_amount) as outstanding
            FROM hms.billing b
            JOIN occ.hospitals h ON b.hospital_id = h.id
            WHERE b.payment_status != 'paid'
            GROUP BY h.id, h.name
            HAVING SUM(b.total_amount - b.paid_amount) > 10000
        `);
        
        for (const hospital of outstandingRevenue.rows) {
            const existingAlert = await pool.query(`
                SELECT id FROM occ.alerts 
                WHERE hospital_id = $1 
                AND alert_type = 'outstanding_revenue' 
                AND status = 'active'
                AND created_at >= NOW() - INTERVAL '24 hours'
            `, [hospital.hospital_id]);
            
            if (existingAlert.rows.length === 0) {
                await pool.query(`
                    INSERT INTO occ.alerts (hospital_id, alert_type, severity, message)
                    VALUES ($1, $2, $3, $4)
                `, [
                    hospital.hospital_id,
                    'outstanding_revenue',
                    'info',
                    `Outstanding revenue alert: ${hospital.hospital_name} has $${hospital.outstanding} in unpaid invoices`
                ]);
            }
        }
        
    } catch (error) {
        console.error('Error checking for anomalies:', error);
    }
}

// Run anomaly checks every 5 minutes
setInterval(checkForAnomalies, 5 * 60 * 1000);

// ============= PROJECT MANAGEMENT =============

// Create project
app.post('/api/projects', async (req, res) => {
    try {
        const {
            hospital_id,
            project_name,
            project_type,
            budget,
            start_date,
            end_date,
            project_manager,
            description,
            milestones
        } = req.body;
        
        const result = await pool.query(`
            INSERT INTO occ.projects 
            (hospital_id, project_name, project_type, budget, start_date, end_date, 
             project_manager, description, milestones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            hospital_id,
            project_name,
            project_type,
            budget,
            start_date,
            end_date,
            project_manager,
            description,
            JSON.stringify(milestones || [])
        ]);
        
        broadcastToAll({
            type: 'new_project',
            project: result.rows[0]
        });
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get projects
app.get('/api/projects', async (req, res) => {
    try {
        const { hospitalId, status, project_type } = req.query;
        
        let query = 'SELECT * FROM occ.projects WHERE 1=1';
        const params = [];
        
        if (hospitalId) {
            params.push(hospitalId);
            query += ` AND hospital_id = $${params.length}`;
        }
        
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        
        if (project_type) {
            params.push(project_type);
            query += ` AND project_type = $${params.length}`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const projects = await pool.query(query, params);
        res.json(projects.rows);
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const setClause = [];
        const values = [];
        let paramCount = 1;
        
        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id') {
                setClause.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }
        
        values.push(id);
        
        const result = await pool.query(`
            UPDATE occ.projects 
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `, values);
        
        broadcastToAll({
            type: 'project_updated',
            project: result.rows[0]
        });
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add project task
app.post('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { task_name, assigned_to, priority, due_date, notes } = req.body;
        
        const result = await pool.query(`
            INSERT INTO occ.project_tasks 
            (project_id, task_name, assigned_to, priority, due_date, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [projectId, task_name, assigned_to, priority, due_date, notes]);
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get project tasks
app.get('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const tasks = await pool.query(
            'SELECT * FROM occ.project_tasks WHERE project_id = $1 ORDER BY created_at',
            [projectId]
        );
        
        res.json(tasks.rows);
        
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update task status
app.put('/api/tasks/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(`
            UPDATE occ.project_tasks 
            SET status = $1,
                completed_date = CASE WHEN $1 = 'completed' THEN CURRENT_DATE ELSE NULL END
            WHERE id = $2
            RETURNING *
        `, [status, id]);
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get project summary
app.get('/api/projects/summary', async (req, res) => {
    try {
        const summary = await pool.query(`
            SELECT 
                COUNT(*) as total_projects,
                COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold,
                SUM(budget) as total_budget,
                SUM(spent) as total_spent
            FROM occ.projects
        `);
        
        const byType = await pool.query(`
            SELECT 
                project_type,
                COUNT(*) as count,
                SUM(budget) as total_budget
            FROM occ.projects
            GROUP BY project_type
        `);
        
        res.json({
            summary: summary.rows[0],
            byType: byType.rows,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching project summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= AGGREGATE ENDPOINTS =============

// Get command centre overview
app.get('/api/command-centre/overview', async (req, res) => {
    try {
        // Get all hospitals status
        const hospitals = await pool.query(`
            SELECT 
                h.*,
                (SELECT COUNT(*) FROM occ.alerts WHERE hospital_id = h.id AND status = 'active') as active_alerts,
                (SELECT COUNT(*) FROM occ.projects WHERE hospital_id = h.id AND status = 'in_progress') as active_projects
            FROM occ.hospitals h
        `);
        
        // Get system-wide metrics
        const systemMetrics = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM hms.patients WHERE created_at >= NOW() - INTERVAL '24 hours') as new_patients_24h,
                (SELECT COUNT(*) FROM hms.admissions WHERE status = 'active') as current_admissions,
                (SELECT COUNT(*) FROM hms.staff WHERE status = 'active') as total_active_staff,
                (SELECT SUM(total_amount) FROM hms.billing WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue
        `);
        
        // Get recent alerts
        const recentAlerts = await pool.query(`
            SELECT a.*, h.name as hospital_name
            FROM occ.alerts a
            LEFT JOIN occ.hospitals h ON a.hospital_id = h.id
            WHERE a.status = 'active'
            ORDER BY a.created_at DESC
            LIMIT 10
        `);
        
        // Get active projects
        const activeProjects = await pool.query(`
            SELECT p.*, h.name as hospital_name
            FROM occ.projects p
            LEFT JOIN occ.hospitals h ON p.hospital_id = h.id
            WHERE p.status IN ('planning', 'in_progress')
            ORDER BY p.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            hospitals: hospitals.rows,
            systemMetrics: systemMetrics.rows[0],
            recentAlerts: recentAlerts.rows,
            activeProjects: activeProjects.rows,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error fetching command centre overview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'OCC Command Centre',
        timestamp: new Date(),
        websocket: `${allClients.size} clients connected`
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Operations Command Centre API',
        version: '2.0',
        endpoints: {
            'Monitoring': '/api/monitoring/dashboard',
            'Alerts': '/api/alerts',
            'Projects': '/api/projects',
            'Command Centre': '/api/command-centre/overview'
        }
    });
});

// Start server
const PORT = process.env.PORT || 8080;

async function startServer() {
    await initializeDatabase();
    
    // Start initial anomaly check
    setTimeout(checkForAnomalies, 5000);
    
    server.listen(PORT, () => {
        console.log(`
        ========================================
        OCC Command Centre Running
        ========================================
        Port: ${PORT}
        URL: http://localhost:${PORT}
        WebSocket: ws://localhost:${PORT}
        
        Features:
        ✓ Real-time monitoring dashboards
        ✓ Multi-hospital management
        ✓ Automated alerting system
        ✓ Project management
        ✓ KPI tracking
        ✓ WebSocket updates
        
        API Endpoints:
        - GET  /api/monitoring/dashboard
        - GET  /api/monitoring/hospital/:id
        - POST /api/monitoring/metrics
        - GET  /api/alerts
        - POST /api/alerts
        - GET  /api/projects
        - POST /api/projects
        - GET  /api/command-centre/overview
        ========================================
        `);
    });
}

startServer().catch(console.error);
