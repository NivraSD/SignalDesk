const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Demo user fallback (works even if database is down)
    if (email.toLowerCase() === 'demo@signaldesk.com' && password === 'Demo123') {
      console.log('Demo user login - using fallback');
      const demoUser = {
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        email: 'demo@signaldesk.com',
        name: 'Demo User',
        company: 'SignalDesk Demo',
        role: 'admin',
        created_at: new Date().toISOString()
      };

      const token = jwt.sign(
        { 
          id: demoUser.id, 
          email: demoUser.email,
          name: demoUser.name 
        },
        process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: demoUser,
        message: 'Demo login successful (fallback mode)'
      });
    }

    // Try database login
    try {
      // Query the database for the user - note: using password_hash
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email.toLowerCase()]);

      // Check if user exists
      if (result.rows.length === 0) {
        console.log('User not found in database:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      const user = result.rows[0];

      // Verify password - handle both password_hash and password columns
      const hashedPassword = user.password_hash || user.password;
      if (!hashedPassword) {
        console.error('No password column found for user:', email);
        return res.status(500).json({ error: 'Database configuration error' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);
      if (!isPasswordValid) {
        console.log('Invalid password for user:', email);
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

      console.log('Database login successful for:', email);
      
      // Send response (exclude password_hash)
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          role: user.role,
          created_at: user.created_at
        }
      });

    } catch (dbError) {
      console.error('Database error during login:', dbError.message);
      
      // If database fails, still allow demo user
      if (email.toLowerCase() === 'demo@signaldesk.com' && password === 'Demo123') {
        console.log('Database error - falling back to demo user');
        const demoUser = {
          id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
          email: 'demo@signaldesk.com',
          name: 'Demo User',
          company: 'SignalDesk Demo',
          role: 'admin',
          created_at: new Date().toISOString()
        };

        const token = jwt.sign(
          { 
            id: demoUser.id, 
            email: demoUser.email,
            name: demoUser.name 
          },
          process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: demoUser,
          message: 'Demo login successful (database unavailable)'
        });
      }
      
      // For non-demo users, return error
      return res.status(500).json({ 
        error: 'Database connection error. Please try again later.' 
      });
    }

  } catch (error) {
    console.error('Unexpected login error:', error);
    res.status(500).json({ 
      error: 'An unexpected error occurred during login' 
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

    // Verify the token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024'
    );

    // Fetch fresh user data from database
    const query = 'SELECT id, email, name, company, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'User not found' 
      });
    }

    const user = result.rows[0];

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
});

module.exports = router;
