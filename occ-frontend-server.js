#!/usr/bin/env node

const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve static files
app.use(express.static('/root'));

// Main route
app.get('/', (req, res) => {
    res.sendFile('/root/occ-dashboard-complete.html');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'OCC Dashboard Server',
        port: PORT 
    });
});

app.listen(PORT, () => {
    console.log(`OCC Dashboard Server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
    console.log(`External: https://occ-dashboard-morphvm-mkofwuzh.http.cloud.morph.so`);
});
