const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Development bypass for testing - check if we're in dev mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware - dev mode, auto-approving');
      req.user = { userId: 1, email: 'demo@signaldesk.com' };
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = authMiddleware;

