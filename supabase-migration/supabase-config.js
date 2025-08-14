// Supabase Configuration for SignalDesk
// Save your Supabase URL and Keys here after creating the project

module.exports = {
  // Get these from your Supabase Dashboard > Settings > API
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY', // Safe for client-side
  supabaseServiceKey: 'YOUR_SERVICE_KEY', // Server-side only!
  
  // Database connection string (for migrations)
  // Get from: Settings > Database > Connection string
  databaseUrl: 'postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres',
  
  // Edge Function URL (after deployment)
  edgeFunctionUrl: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/',
  
  // Realtime configuration
  realtimeConfig: {
    channels: {
      intelligence: 'intelligence-monitoring',
      opportunities: 'opportunity-updates',
      campaigns: 'campaign-events',
      system: 'system-notifications'
    }
  },
  
  // Storage buckets
  storage: {
    buckets: {
      documents: 'pr-documents',
      images: 'pr-images',
      reports: 'pr-reports'
    }
  }
};

// Environment-specific configuration
const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
      databaseUrl: process.env.DATABASE_URL
    };
  }
  
  return module.exports;
};

module.exports.getConfig = getConfig;