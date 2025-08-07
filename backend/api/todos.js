export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Mock todos data
  return res.status(200).json([
    { id: 1, title: 'Setup platform', completed: true },
    { id: 2, title: 'Test deployment', completed: false },
    { id: 3, title: 'Add monitoring', completed: false }
  ]);
}