// backend/src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Development mode bypass for easier testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - dev mode bypass');
      req.user = {
        userId: 1,
        id: 1,
        email: 'demo@signaldesk.com'
      };
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "signaldesk-jwt-secret-2024"
    );

    console.log("Auth middleware - decoded token:", decoded);

    // Set user on request object
    // Make sure we have both userId and id for compatibility
    req.user = {
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      email: decoded.email,
      // Include any other user properties from the token
      ...decoded,
    };

    console.log("Auth middleware - req.user set to:", req.user);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

module.exports = authMiddleware;
