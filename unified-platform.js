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
