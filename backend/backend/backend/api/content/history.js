// Content history endpoint
let contentHistory = [];

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  // Return mock content history
  return res.status(200).json({
    success: true,
    data: [
      {
        id: 1,
        type: 'press-release',
        title: 'Product Launch Announcement',
        content: 'Sample press release content...',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        project_id: 1
      },
      {
        id: 2,
        type: 'social-post',
        title: 'Twitter Campaign',
        content: 'Sample social media content...',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        project_id: 1
      }
    ]
  });
}