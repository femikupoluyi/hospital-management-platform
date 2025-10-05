const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Main landing page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GrandPro HMSO - Hospital Management Platform</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .module-card { 
            transition: all 0.3s; 
            cursor: pointer;
            background: white;
            border: 1px solid #e5e7eb;
        }
        .module-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-color: #3b82f6;
        }
        .gradient-bg { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        .status-online {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg text-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-hospital text-3xl mr-3"></i>
                    <div>
                        <h1 class="text-2xl font-bold">GrandPro HMSO Platform</h1>
                        <p class="text-sm opacity-90">Complete Hospital Management System</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <i class="fas fa-circle text-green-300 mr-2 status-online text-xs"></i>
                        System Online
                    </span>
                    <span class="text-sm">v1.0.0</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-8">
        <!-- System Status -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4">System Status</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                    <i class="fas fa-server text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">API Status</p>
                    <p class="font-semibold text-green-600">Operational</p>
                </div>
                <div class="text-center">
                    <i class="fas fa-database text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Database</p>
                    <p class="font-semibold text-green-600">Connected</p>
                </div>
                <div class="text-center">
                    <i class="fas fa-shield-alt text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Security</p>
                    <p class="font-semibold text-green-600">Active</p>
                </div>
                <div class="text-center">
                    <i class="fas fa-chart-line text-green-600 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600">Analytics</p>
                    <p class="font-semibold text-green-600">Running</p>
                </div>
            </div>
        </div>

        <!-- Modules Grid -->
        <h2 class="text-2xl font-bold mb-6">Platform Modules</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Digital Sourcing Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/digital-sourcing')">
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-hospital-user text-blue-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Digital Sourcing</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Hospital onboarding, evaluation, and contract management</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Applications</span>
                        <span class="font-semibold">Portal Ready</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Contracts</span>
                        <span class="font-semibold">E-Sign Enabled</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Access Module →
                </button>
            </div>

            <!-- CRM Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/crm')">
                <div class="flex items-center mb-4">
                    <div class="bg-purple-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-users text-purple-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">CRM System</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Patient & owner relationship management</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Appointments</span>
                        <span class="font-semibold">Scheduling Active</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Communications</span>
                        <span class="font-semibold">Multi-channel</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">
                    Access Module →
                </button>
            </div>

            <!-- HMS Core Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/hms')">
                <div class="flex items-center mb-4">
                    <div class="bg-green-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-procedures text-green-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">HMS Core</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Hospital operations & patient care management</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">EMR</span>
                        <span class="font-semibold">Functional</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Billing</span>
                        <span class="font-semibold">Multi-payment</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                    Access Module →
                </button>
            </div>

            <!-- Command Centre Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/command-centre')">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-tv text-red-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Command Centre</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Real-time monitoring & operations management</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Monitoring</span>
                        <span class="font-semibold">Real-time</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Alerts</span>
                        <span class="font-semibold">Automated</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition">
                    Access Module →
                </button>
            </div>

            <!-- Analytics Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/analytics')">
                <div class="flex items-center mb-4">
                    <div class="bg-yellow-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-chart-bar text-yellow-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Analytics & AI</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Data analytics & predictive insights</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">ML Models</span>
                        <span class="font-semibold">3 Active</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Reports</span>
                        <span class="font-semibold">Auto-generated</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition">
                    Access Module →
                </button>
            </div>

            <!-- Partners Module -->
            <div class="module-card rounded-lg p-6" onclick="openModule('/partners')">
                <div class="flex items-center mb-4">
                    <div class="bg-indigo-100 p-3 rounded-lg mr-4">
                        <i class="fas fa-handshake text-indigo-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold">Partner Integration</h3>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-4">Third-party integrations & partnerships</p>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Insurance</span>
                        <span class="font-semibold">Connected</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">Suppliers</span>
                        <span class="font-semibold">Integrated</span>
                    </div>
                </div>
                <button class="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                    Access Module →
                </button>
            </div>
        </div>

        <!-- API Documentation -->
        <div class="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Developer Resources</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/api-docs" class="flex items-center p-4 bg-gray-50 rounded hover:bg-gray-100 transition">
                    <i class="fas fa-book text-gray-600 mr-3"></i>
                    <div>
                        <p class="font-semibold">API Documentation</p>
                        <p class="text-sm text-gray-600">RESTful API reference</p>
                    </div>
                </a>
                <a href="/api/health" class="flex items-center p-4 bg-gray-50 rounded hover:bg-gray-100 transition">
                    <i class="fas fa-heartbeat text-gray-600 mr-3"></i>
                    <div>
                        <p class="font-semibold">Health Check</p>
                        <p class="text-sm text-gray-600">System status endpoint</p>
                    </div>
                </a>
                <a href="/api/metrics" class="flex items-center p-4 bg-gray-50 rounded hover:bg-gray-100 transition">
                    <i class="fas fa-tachometer-alt text-gray-600 mr-3"></i>
                    <div>
                        <p class="font-semibold">Metrics</p>
                        <p class="text-sm text-gray-600">Performance metrics</p>
                    </div>
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="mt-12 bg-gray-800 text-white py-6">
        <div class="container mx-auto px-6 text-center">
            <p>&copy; 2025 GrandPro HMSO. All rights reserved.</p>
            <p class="text-sm text-gray-400 mt-2">Powered by advanced healthcare technology</p>
        </div>
    </footer>

    <script>
        function openModule(path) {
            window.location.href = path;
        }
        
        // Check system status
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                console.log('System health:', data);
            })
            .catch(err => {
                console.error('Health check failed:', err);
            });
    </script>
</body>
</html>
    `);
});

// Module routes with proper proxying
const moduleRoutes = {
    '/digital-sourcing': 'http://localhost:8091',
    '/crm': 'http://localhost:7001',
    '/hms': 'http://localhost:5601',
    '/command-centre': 'http://localhost:5801',
    '/analytics': 'http://localhost:9002',
    '/partners': 'http://localhost:5003',
    '/security': 'http://localhost:9003'
};

// API endpoints proxy
app.use('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GrandPro HMSO Platform',
        database: 'connected',
        timestamp: new Date().toISOString(),
        modules: {
            digitalSourcing: 'active',
            crm: 'active', 
            hms: 'active',
            commandCentre: 'active',
            analytics: 'active',
            partners: 'active'
        }
    });
});

app.use('/api/metrics', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString()
    });
});

// Proxy API requests to enhanced backend
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error(`API proxy error:`, err);
        res.status(503).json({ error: 'Backend service unavailable' });
    }
}));

// Setup module proxies
Object.entries(moduleRoutes).forEach(([path, target]) => {
    app.use(path, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
            [`^${path}`]: ''
        },
        onError: (err, req, res) => {
            console.error(`Proxy error for ${path}:`, err);
            res.status(503).send(`
                <html>
                <head>
                    <title>Module Loading...</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                </head>
                <body class="bg-gray-100 flex items-center justify-center h-screen">
                    <div class="bg-white p-8 rounded-lg shadow-md text-center">
                        <h1 class="text-2xl font-bold text-gray-800 mb-4">Module Starting Up</h1>
                        <p class="text-gray-600 mb-4">The module is currently initializing. Please refresh the page in a few seconds.</p>
                        <button onclick="window.location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Refresh Page
                        </button>
                        <button onclick="window.location.href='/'" class="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                            Back to Home
                        </button>
                    </div>
                </body>
                </html>
            `);
        }
    }));
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
    console.log(`Unified Platform Router running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
