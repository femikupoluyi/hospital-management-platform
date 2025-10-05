const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'unified-frontend.html'));
});

const PORT = process.env.FRONTEND_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
});
