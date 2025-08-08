const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const authMiddleware = require("../src/middleware/authMiddleware");

// Login route - Demo user with bulletproof credentials
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Login attempt for:", email, "with password:", password ? '[PROVIDED]' : '[MISSING]');

    // BULLETPROOF demo user check - support both password variants
    if (email === "demo@signaldesk.com" && (password === "demo123" || password === "password")) {
      // Generate token with UUID-based ID for consistency
      const demoUser = {
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        userId: '7f39af2e-933c-44e9-b67c-1f7e28b3a858', // For compatibility
        email: 'demo@signaldesk.com',
        name: 'Demo User',
        organization_id: 'demo-org'
      };
      
      const token = jwt.sign(
        demoUser,
        process.env.JWT_SECRET || "signaldesk-jwt-secret-2024",
        { expiresIn: "24h" }
      );

      console.log("✅ Demo user login successful!");
      res.json({
        success: true,
        token,
        user: demoUser
      });
      return;
    }

    // Check database for real users
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
          const token = jwt.sign(
            { 
              id: user.id, 
              userId: user.id, // For compatibility
              email: user.email, 
              organization_id: user.organization_id 
            },
            process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
            { expiresIn: '24h' }
          );
          
          console.log("✅ Database user login successful!");
          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              organization_id: user.organization_id
            }
          });
        }
      }
    } catch (dbError) {
      console.log('⚠️ Database error, falling back to demo user only');
    }

    console.log("❌ Invalid credentials for:", email);
    res.status(401).json({ 
      success: false,
      error: "Invalid credentials",
      message: "Please use demo@signaldesk.com with demo123 or password" 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      error: "Login failed", 
      details: error.message 
    });
  }
});

// Verify token endpoint (GET) - with auth middleware
router.get("/verify", authMiddleware, (req, res) => {
  console.log("✅ GET /api/auth/verify - token valid for user:", req.user.email);
  res.json({
    valid: true,
    success: true,
    user: req.user
  });
});

// Verify token endpoint (POST) - with auth middleware  
router.post("/verify", authMiddleware, (req, res) => {
  console.log("✅ POST /api/auth/verify - token valid for user:", req.user.email);
  res.json({
    valid: true,
    success: true,
    user: req.user
  });
});

// Verify token endpoint (GET) - manual token extraction for compatibility
router.get("/verify-manual", (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log("❌ No token provided to /verify-manual");
    return res.status(401).json({ valid: false, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
    console.log("✅ Manual token verification successful for:", decoded.email);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    res.status(401).json({ valid: false, error: error.message });
  }
});

// Verify token endpoint (POST) - manual token extraction for compatibility
router.post("/verify-manual", (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log("❌ No token provided to POST /verify-manual");
    return res.status(401).json({ valid: false, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
    console.log("✅ Manual POST token verification successful for:", decoded.email);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.log("❌ POST Token verification failed:", error.message);
    res.status(401).json({ valid: false, error: error.message });
  }
});

module.exports = router;
