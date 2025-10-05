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
