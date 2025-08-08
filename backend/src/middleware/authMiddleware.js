// backend/src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log(`🔐 Auth middleware called for ${req.method} ${req.path}`);
    
    // Development mode bypass (OPTIONAL - can be disabled for stricter testing)
    if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Auth middleware - dev mode bypass ENABLED');
      req.user = {
        userId: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        email: 'demo@signaldesk.com',
        name: 'Demo User',
        organization_id: 'demo-org'
      };
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Bearer [TOKEN]' : 'MISSING');

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({
        valid: false,
        success: false,
        message: "No token provided - use Authorization: Bearer <token>",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token extracted, length:', token.length);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "signaldesk-jwt-secret-2024"
    );

    console.log("✅ Token decoded successfully for user:", decoded.email);

    // Set user on request object with comprehensive compatibility
    req.user = {
      // Primary identifiers
      userId: decoded.userId || decoded.id || '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
      id: decoded.id || decoded.userId || '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
      
      // User information
      email: decoded.email || 'demo@signaldesk.com',
      name: decoded.name || 'Demo User',
      organization_id: decoded.organization_id || 'demo-org',
      
      // Include any other properties from the token
      ...decoded,
    };

    console.log("✅ req.user set with ID:", req.user.id, "Email:", req.user.email);

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        valid: false,
        success: false,
        message: "Invalid token format",
        error: error.message
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        valid: false,
        success: false,
        message: "Token has expired - please login again",
      });
    }

    return res.status(500).json({
      valid: false,
      success: false,
      message: "Token verification failed",
      error: error.message
    });
  }
};

module.exports = authMiddleware;
