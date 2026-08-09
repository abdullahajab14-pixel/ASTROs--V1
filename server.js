const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname, '/')));

// Simple API endpoint for health/status
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
});
