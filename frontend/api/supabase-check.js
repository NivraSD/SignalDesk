/**
 * Vercel Serverless Function - Supabase Connection Check
 * Verifies that Supabase is properly configured and accessible
 */

import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    // Get Supabase configuration from environment
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    // Check if configuration exists
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Supabase configuration missing',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          environment: process.env.VERCEL_ENV || 'local'
        }
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test connection by checking auth status
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    // Test database connection
    const { count, error: dbError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Return status
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supabase: {
        connected: true,
        url: supabaseUrl,
        authStatus: authError ? 'error' : 'operational',
        authError: authError?.message || null,
        dbStatus: dbError ? 'error' : 'operational',
        dbError: dbError?.message || null,
        hasSession: !!session
      },
      deployment: {
        environment: process.env.VERCEL_ENV || 'development',
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
        region: process.env.VERCEL_REGION || 'local'
      }
    });

  } catch (error) {
    console.error('Supabase check error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to check Supabase connection',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}