// Get Monitoring Status
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const { organizationId } = req.query;
  
  return res.status(200).json({
    success: true,
    status: 'active',
    organizationId,
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metrics: {
      articlesProcessed: 1234,
      alertsGenerated: 12,
      topicsTracked: 8
    }
  });
}