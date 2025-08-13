// Simple test endpoint to verify Vercel is working
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Test endpoint working!',
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      nodeEnv: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString()
  });
};