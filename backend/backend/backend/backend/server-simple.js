const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SignalDesk API is running',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET / - This endpoint',
      'GET /api/status - API status'
    ]
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'SignalDesk',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SignalDesk API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});