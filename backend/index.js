// Railway-compatible Express server
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

console.log('Starting server...');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'SignalDesk API on Railway',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'signaldesk-backend',
    environment: process.env.NODE_ENV || 'development',
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY
  });
});

// Start server exactly as Railway expects
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});