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
  
  const { organizationId, targets, topics } = req.body;
  
  // Mock source configuration
  const sources = [
    { type: 'rss', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', active: true },
    { type: 'rss', name: 'VentureBeat', url: 'https://venturebeat.com/feed/', active: true },
    { type: 'google_news', query: 'technology innovation', active: true },
    { type: 'google_news', query: 'market trends', active: true }
  ];
  
  return res.status(200).json({
    success: true,
    message: 'Sources configured successfully',
    configuredSources: sources.length,
    sources
  });
}