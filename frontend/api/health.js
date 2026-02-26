/**
 * Vercel Serverless Function - Health Check Endpoint
 * Returns deployment status and metadata
 */

export default function handler(req, res) {
  const buildVersion = process.env.REACT_APP_BUILD_VERSION || '0.0.0';
  const buildTime = process.env.REACT_APP_BUILD_TIME || new Date().toISOString();
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'local';
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return health status
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    deployment: {
      id: deploymentId,
      version: buildVersion,
      buildTime: buildTime,
      environment: process.env.VERCEL_ENV || 'development'
    },
    checks: {
      api: 'operational',
      serverless: 'operational'
    }
  });
}