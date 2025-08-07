export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'No token provided' 
    });
  }
  
  // For demo, any token starting with 'demo-token-' is valid
  if (token.startsWith('demo-token-')) {
    return res.status(200).json({ 
      success: true,
      userId: 1,
      message: 'Token is valid' 
    });
  }
  
  return res.status(401).json({ 
    success: false,
    error: 'Invalid token' 
  });
}