// Optimized server.js for Railway $5 plan (512MB RAM limit)
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// CRITICAL: Limit memory usage
if (process.env.NODE_ENV === 'production') {
  // Limit heap to 400MB (leave buffer for system)
  require('v8').setFlagsFromString('--max-old-space-size=400');
}

// Simple CORS for production
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check (Railway needs this)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', memory: process.memoryUsage().heapUsed / 1024 / 1024 + 'MB' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Lazy load database ONLY when needed
let pool = null;
const getDB = () => {
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // REDUCED from default 10
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

// Import routes (lazy load heavy ones)
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

// Lazy load AI routes only when called
app.use("/api/content", (req, res, next) => {
  require("./src/routes/contentRoutes")(req, res, next);
});

app.use("/api/campaigns", (req, res, next) => {
  require("./src/routes/campaignRoutes")(req, res, next);
});

// Start server with minimal logging
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Memory: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    if (pool) pool.end();
    process.exit(0);
  });
});

module.exports = { app, getDB };