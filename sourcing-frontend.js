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
