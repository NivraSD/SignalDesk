// Simple test endpoint
export default function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader(corsHeaders).end();
    return;
  }

  // Return simple JSON response
  res.status(200).json({
    message: 'Backend orchestrator is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    env: {
      hasClaudeKey: !!process.env.CLAUDE_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    }
  });
}