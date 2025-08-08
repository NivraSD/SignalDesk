// Simple API handler for Vercel
export default function handler(req, res) {
  const { method, url, body } = req;
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route handling
  if (url === '/api' || url === '/api/') {
    return res.status(200).json({
      message: "SignalDesk API",
      status: "working"
    });
  }
  
  if (url === '/api/health') {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  }
  
  if (url === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (email === 'demo@signaldesk.com' && password === 'demo123') {
      return res.status(200).json({
        success: true,
        token: 'demo-token-' + Date.now(),
        user: { id: 1, email, name: 'Demo User' }
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Default 404
  res.status(404).json({ error: 'Not found', url, method });
}