export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'Email and password are required' 
    });
  }
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid input format' 
    });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid email format' 
    });
  }
  
  // Demo login
  if (email === 'demo@signaldesk.com' && password === 'demo123') {
    return res.status(200).json({
      success: true,
      token: 'demo-token-' + Date.now(),
      user: { 
        id: 1, 
        email, 
        name: 'Demo User' 
      }
    });
  }
  
  return res.status(401).json({ 
    success: false,
    error: 'Invalid credentials' 
  });
}