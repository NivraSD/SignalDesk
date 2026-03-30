module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const organization = req.body;
  
  // Mock creating organization
  return res.status(200).json({
    success: true,
    organization: {
      id: Date.now(),
      ...organization,
      created_at: new Date().toISOString(),
      status: 'active'
    }
  });
}