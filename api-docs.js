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
