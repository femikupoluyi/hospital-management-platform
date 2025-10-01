const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Serve the CRM frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'crm-frontend.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'CRM Frontend' });
});

const PORT = 7001;
app.listen(PORT, () => {
    console.log(`✅ CRM Frontend running on port ${PORT}`);
    console.log(`   Access at: http://localhost:${PORT}`);
});
