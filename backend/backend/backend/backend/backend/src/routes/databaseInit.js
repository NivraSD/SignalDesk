const express = require('express');
const router = express.Router();
const { initializeDatabase } = require('../utils/initDatabase');

// Database initialization endpoint
// This can be called to set up all required tables
router.post('/database/init', async (req, res) => {
  console.log('📦 Database initialization requested');
  
  try {
    const result = await initializeDatabase();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Database initialized successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database initialization failed',
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Database init endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize database',
      error: error.message
    });
  }
});

// Database health check endpoint
router.get('/database/health', async (req, res) => {
  const pool = require('../config/db');
  
  try {
    // Test basic query
    const result = await pool.query('SELECT NOW() as current_time, current_database() as database');
    
    // Get table count
    const tables = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Get user count
    let userCount = 0;
    try {
      const users = await pool.query('SELECT COUNT(*) FROM users');
      userCount = parseInt(users.rows[0].count);
    } catch (e) {
      // Table might not exist yet
    }
    
    res.status(200).json({
      success: true,
      status: 'connected',
      database: result.rows[0].database,
      serverTime: result.rows[0].current_time,
      tableCount: parseInt(tables.rows[0].table_count),
      userCount: userCount,
      message: 'Database connection is healthy'
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'disconnected',
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

// Get database schema information
router.get('/database/schema', async (req, res) => {
  const pool = require('../config/db');
  
  try {
    // Get all tables with their columns
    const schema = await pool.query(`
      SELECT 
        t.table_name,
        array_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name 
        AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `);
    
    res.status(200).json({
      success: true,
      tables: schema.rows,
      tableCount: schema.rows.length
    });
    
  } catch (error) {
    console.error('Schema query failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;