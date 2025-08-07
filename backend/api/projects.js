export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Mock projects data
  return res.status(200).json([
    { id: 1, name: 'Project 1', description: 'Demo project' },
    { id: 2, name: 'Project 2', description: 'Another demo project' }
  ]);
}