const express = require('express');
const axios = require('axios').default;
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

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

// Proxy HMS API requests to enhanced backend
app.use('/api/hms', async (req, res) => {
    try {
        const url = `http://localhost:3001${req.originalUrl}`;
        const method = req.method.toLowerCase();
        
        let response;
        const config = {
            headers: req.headers,
            params: req.query
        };
        
        if (method === 'get') {
            response = await axios.get(url, config);
        } else if (method === 'post') {
            response = await axios.post(url, req.body, config);
        } else if (method === 'put') {
            response = await axios.put(url, req.body, config);
        } else if (method === 'delete') {
            response = await axios.delete(url, config);
        }
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || 'Backend service error'
        });
    }
});

// Main HMS page with all working features
app.get('/', (req, res) => {
    const htmlContent = require('fs').readFileSync('/root/hms-full-module.js', 'utf8');
    const htmlMatch = htmlContent.match(/res\.send\(`([\s\S]*?)`\);/);
    if (htmlMatch && htmlMatch[1]) {
        res.send(htmlMatch[1]);
    } else {
        res.send('<h1>HMS Module</h1><p>Loading...</p>');
    }
});

const PORT = process.env.PORT || 5601;
app.listen(PORT, () => {
    console.log(`HMS Module (Fixed) running on port ${PORT}`);
});
