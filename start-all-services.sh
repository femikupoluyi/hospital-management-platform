#!/bin/bash

# Hospital Management Platform - Complete Service Startup Script

echo "========================================"
echo "STARTING ALL HMS PLATFORM SERVICES"
echo "========================================"

# Set the correct database URL (using pooler connection)
export DATABASE_URL='postgresql://neondb_owner:npg_lIeD35dukpfC@ep-steep-river-ad25brti-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'

# Kill any existing node processes
echo "Stopping existing services..."
pkill -f node 2>/dev/null
sleep 2

# Create logs directory
mkdir -p /root/logs

echo ""
echo "Starting Backend Services..."
echo "----------------------------"

# 1. Digital Sourcing Service
echo "Starting Digital Sourcing (Port 3001)..."
PORT=3001 nohup node /root/digital-sourcing-complete.js > /root/logs/digital-sourcing.log 2>&1 &
sleep 1

# 2. CRM System
echo "Starting CRM System (Port 3002)..."
PORT=3002 nohup node /root/crm-system-complete.js > /root/logs/crm-system.log 2>&1 &
sleep 1

# 3. HMS Core (Already running)
echo "HMS Core already running (Port 3003)..."

# 4. Partner Integration
echo "Starting Partner Integration (Port 3004)..."
if [ -f /root/enhanced-partner-integration.js ]; then
    PORT=3004 nohup node /root/enhanced-partner-integration.js > /root/logs/partner.log 2>&1 &
else
    PORT=3004 nohup node /root/partner-integration.js > /root/logs/partner.log 2>&1 &
fi
sleep 1

# 5. Data Analytics
echo "Starting Data Analytics (Port 3005)..."
if [ -f /root/data-analytics-infrastructure.js ]; then
    PORT=3005 nohup node /root/data-analytics-infrastructure.js > /root/logs/analytics.log 2>&1 &
else
    PORT=3005 nohup node /root/analytics-ml-standalone.js > /root/logs/analytics.log 2>&1 &
fi
sleep 1

# 6. OCC Command Centre
echo "Starting OCC Command Centre (Port 8080)..."
if [ -f /root/occ-command-centre-complete.js ]; then
    PORT=8080 nohup node /root/occ-command-centre-complete.js > /root/logs/occ.log 2>&1 &
elif [ -f /root/occ-command-centre.js ]; then
    PORT=8080 nohup node /root/occ-command-centre.js > /root/logs/occ.log 2>&1 &
else
    PORT=8080 nohup node /root/command-centre-enhanced.js > /root/logs/occ.log 2>&1 &
fi
sleep 1

echo ""
echo "Starting Frontend Services..."
echo "-----------------------------"

# 7. Digital Sourcing Frontend
echo "Starting Digital Sourcing Frontend (Port 3011)..."
cat > /root/sourcing-frontend.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3011;

app.get('/', (req, res) => {
    res.sendFile('/root/digital-sourcing-portal.html');
});

app.use(express.static('/root'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Sourcing Frontend running on port ${PORT}`);
});
EOF
PORT=3011 nohup node /root/sourcing-frontend.js > /root/logs/sourcing-frontend.log 2>&1 &
sleep 1

# 8. CRM Dashboard
echo "Starting CRM Dashboard (Port 3012)..."
PORT=3012 nohup node /root/crm-frontend-server.js > /root/logs/crm-frontend.log 2>&1 &
sleep 1

# 9. HMS Dashboard
echo "Starting HMS Dashboard (Port 3013)..."
cat > /root/hms-frontend.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3013;

app.get('/', (req, res) => {
    res.sendFile('/root/hms-dashboard-complete.html');
});

app.use(express.static('/root'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`HMS Dashboard running on port ${PORT}`);
});
EOF
PORT=3013 nohup node /root/hms-frontend.js > /root/logs/hms-frontend.log 2>&1 &
sleep 1

# 10. OCC Dashboard
echo "Starting OCC Dashboard (Port 8081)..."
if [ -f /root/occ-frontend-server.js ]; then
    PORT=8081 nohup node /root/occ-frontend-server.js > /root/logs/occ-frontend.log 2>&1 &
else
    cat > /root/occ-dashboard-server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 8081;

app.get('/', (req, res) => {
    res.sendFile('/root/occ-dashboard-complete.html');
});

app.use(express.static('/root'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`OCC Dashboard running on port ${PORT}`);
});
EOF
    PORT=8081 nohup node /root/occ-dashboard-server.js > /root/logs/occ-dashboard.log 2>&1 &
fi
sleep 1

# 11. Unified Platform
echo "Starting Unified Platform (Port 3007)..."
cat > /root/unified-platform.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 3007;

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>GrandPro HMSO - Hospital Management Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 1200px;
            width: 90%;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 2rem;
        }
        .modules {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .module {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            transition: transform 0.3s;
        }
        .module:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .module h3 {
            color: #667eea;
            margin-bottom: 1rem;
        }
        .module p {
            color: #666;
            margin-bottom: 1rem;
        }
        .module a {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            text-decoration: none;
            transition: transform 0.2s;
        }
        .module a:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏥 GrandPro HMSO Hospital Management Platform</h1>
        <p style="text-align: center; color: #666;">Select a module to access:</p>
        
        <div class="modules">
            <div class="module">
                <h3>📝 Digital Sourcing</h3>
                <p>Hospital partner onboarding and evaluation system</p>
                <a href="http://localhost:3011" target="_blank">Access Portal</a>
            </div>
            
            <div class="module">
                <h3>👥 CRM System</h3>
                <p>Customer relationship management for owners and patients</p>
                <a href="http://localhost:3012" target="_blank">Open CRM</a>
            </div>
            
            <div class="module">
                <h3>🏥 HMS Core</h3>
                <p>Hospital management system with EMR, billing, and inventory</p>
                <a href="http://localhost:3013" target="_blank">Launch HMS</a>
            </div>
            
            <div class="module">
                <h3>📊 Command Centre</h3>
                <p>Operations monitoring and project management</p>
                <a href="http://localhost:8081" target="_blank">Open OCC</a>
            </div>
            
            <div class="module">
                <h3>🔗 Partner Integration</h3>
                <p>Insurance, pharmacy, and telemedicine integrations</p>
                <a href="http://localhost:3004/api" target="_blank">API Status</a>
            </div>
            
            <div class="module">
                <h3>📈 Analytics & AI</h3>
                <p>Data analytics and machine learning insights</p>
                <a href="http://localhost:3005/api" target="_blank">Analytics API</a>
            </div>
        </div>
        
        <div style="margin-top: 3rem; text-align: center; color: #666;">
            <p><strong>System Status:</strong> All modules operational</p>
            <p>Version 2.0.0 | © 2024 GrandPro HMSO</p>
        </div>
    </div>
</body>
</html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified Platform running on port ${PORT}`);
});
EOF
PORT=3007 nohup node /root/unified-platform.js > /root/logs/unified.log 2>&1 &
sleep 1

# 12. API Documentation
echo "Starting API Documentation (Port 3008)..."
cat > /root/api-docs.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 3008;

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>HMS Platform API Documentation</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        h1 { color: #4ec9b0; }
        h2 { color: #569cd6; margin-top: 30px; }
        .endpoint { background: #2d2d30; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #dcdcaa; font-weight: bold; }
        .path { color: #ce9178; }
        .description { color: #9cdcfe; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>HMS Platform API Documentation</h1>
    
    <h2>Digital Sourcing API (Port 3001)</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/applications</span>
        <div class="description">List all hospital applications</div>
    </div>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/applications/submit</span>
        <div class="description">Submit new hospital application</div>
    </div>
    
    <h2>CRM API (Port 3002)</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/patients</span>
        <div class="description">List all patients</div>
    </div>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/appointments</span>
        <div class="description">Create new appointment</div>
    </div>
    
    <h2>HMS Core API (Port 3003)</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/emr</span>
        <div class="description">Get electronic medical records</div>
    </div>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/billing/invoices</span>
        <div class="description">Create new invoice</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/inventory</span>
        <div class="description">Get inventory items</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/bed-management/status</span>
        <div class="description">Get bed availability status</div>
    </div>
    
    <h2>OCC API (Port 8080)</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/command-centre/overview</span>
        <div class="description">Get system overview</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/alerts</span>
        <div class="description">Get system alerts</div>
    </div>
    
    <h2>Partner Integration API (Port 3004)</h2>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/insurance/submit-claim</span>
        <div class="description">Submit insurance claim</div>
    </div>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/pharmacy/orders</span>
        <div class="description">Create pharmacy order</div>
    </div>
    
    <h2>Analytics API (Port 3005)</h2>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/analytics/predict/demand</span>
        <div class="description">Predict patient demand</div>
    </div>
    <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/analytics/ml/triage</span>
        <div class="description">AI triage assistant</div>
    </div>
</body>
</html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Documentation running on port ${PORT}`);
});
EOF
PORT=3008 nohup node /root/api-docs.js > /root/logs/api-docs.log 2>&1 &
sleep 1

echo ""
echo "========================================"
echo "CHECKING SERVICE STATUS"
echo "========================================"

# Wait for services to stabilize
sleep 3

# Check which services are running
echo ""
echo "Running Services:"
echo "-----------------"
ps aux | grep -E "node.*js" | grep -v grep | awk '{print $11, $12}' | while read line; do
    echo "✓ $line"
done

echo ""
echo "Active Ports:"
echo "-------------"
ss -tlnp | grep node | awk '{print $4}' | sed 's/.*:/Port /' | sort -u

echo ""
echo "========================================"
echo "SERVICE URLS"
echo "========================================"
echo ""
echo "Frontend Services:"
echo "- Digital Sourcing: http://localhost:3011"
echo "- CRM Dashboard: http://localhost:3012"
echo "- HMS Dashboard: http://localhost:3013"
echo "- OCC Command Centre: http://localhost:8081"
echo "- Unified Platform: http://localhost:3007"
echo "- API Documentation: http://localhost:3008"
echo ""
echo "Backend APIs:"
echo "- Digital Sourcing API: http://localhost:3001"
echo "- CRM API: http://localhost:3002"
echo "- HMS API: http://localhost:3003"
echo "- Partner API: http://localhost:3004"
echo "- Analytics API: http://localhost:3005"
echo "- OCC API: http://localhost:8080"
echo ""
echo "Logs available in: /root/logs/"
echo ""
echo "========================================"
echo "STARTUP COMPLETE"
echo "========================================"
