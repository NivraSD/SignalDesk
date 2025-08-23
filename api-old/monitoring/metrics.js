// Monitoring Metrics
module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const { organizationId, days = 7 } = req.query;
  
  // Generate mock metrics
  const metrics = {
    totalMentions: Math.floor(Math.random() * 1000) + 500,
    sentimentScore: 0.65 + Math.random() * 0.3,
    reach: Math.floor(Math.random() * 1000000) + 500000,
    engagement: Math.floor(Math.random() * 10000) + 5000,
    topSources: [
      { name: 'Twitter', count: 234 },
      { name: 'News Sites', count: 189 },
      { name: 'LinkedIn', count: 156 },
      { name: 'Reddit', count: 98 }
    ],
    trendData: Array.from({ length: parseInt(days) }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mentions: Math.floor(Math.random() * 100) + 50,
      sentiment: 0.5 + Math.random() * 0.5
    }))
  };
  
  return res.status(200).json({
    success: true,
    metrics,
    period: `${days} days`,
    organizationId
  });
}