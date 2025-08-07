// Simple test endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};