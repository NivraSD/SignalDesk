const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Login endpoint - FIXED to handle both password and password_hash columns
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Query the database for the user
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase()]);

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Verify password - handle both column names
    const hashedPassword = user.password_hash || user.password;
    
    if (!hashedPassword) {
      console.error('No password column found for user:', email);
      return res.status(500).json({ 
        error: 'Database configuration error' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'An error occurred during login' 
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to insert with password_hash first, fallback to password
    let insertQuery;
    try {
      // Try password_hash column first
      insertQuery = `
        INSERT INTO users (name, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, name, email
      `;
      const result = await pool.query(insertQuery, [name, email.toLowerCase(), hashedPassword]);
      
      const newUser = result.rows[0];
      
      // Generate token for immediate login
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email,
          name: newUser.name 
        },
        process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: newUser
      });
    } catch (err) {
      // If password_hash fails, try password column
      if (err.code === '42703') { // column does not exist
        insertQuery = `
          INSERT INTO users (name, email, password, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id, name, email
        `;
        const result = await pool.query(insertQuery, [name, email.toLowerCase(), hashedPassword]);
        
        const newUser = result.rows[0];
        
        // Generate token for immediate login
        const token = jwt.sign(
          { 
            id: newUser.id, 
            email: newUser.email,
            name: newUser.name 
          },
          process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Registration successful',
          token,
          user: newUser
        });
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'An error occurred during registration' 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024'
    );

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    });

  } catch (error) {
    res.status(401).json({ 
      valid: false,
      error: 'Invalid or expired token' 
    });
  }
});

module.exports = router;