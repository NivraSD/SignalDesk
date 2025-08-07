const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const authMiddleware = require("../src/middleware/authMiddleware");

// Login route - Simple version for demo user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // For demo user, just check email and password
    if (email === "demo@signaldesk.com" && password === "password") {
      // Generate token
      const token = jwt.sign(
        { userId: 1, email: "demo@signaldesk.com" },
        process.env.JWT_SECRET || "signaldesk-jwt-secret-2024",
        { expiresIn: "24h" }
      );

      console.log("Login successful for demo user");
      res.json({
        success: true,
        token,
        user: {
          id: 1,
          email: "demo@signaldesk.com",
        },
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// Verify token endpoint - ADD THIS!
router.get("/verify", authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
