const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hello World from a minimal Vercel function!',
    time: new Date().toISOString()
  });
});

app.get('/api/(.*)', (req, res) => {
    res.json({ message: 'Minimal API is active. Default route hit.' });
});

module.exports = app;
