// CRITICAL: Hardcoded API URL - Bypasses all environment variables
// This is the ONLY source of truth for the API URL

const FORCE_API_URL = 'https://signaldesk-production.up.railway.app/api';

// Validate the URL format
if (!FORCE_API_URL.startsWith('http://') && !FORCE_API_URL.startsWith('https://')) {
  console.error('CRITICAL ERROR: API URL must start with http:// or https://');
}

if (!FORCE_API_URL.endsWith('/api')) {
  console.error('CRITICAL ERROR: API URL must end with /api');
}

console.log('🚨 HARDCODED API CONFIG ACTIVE');
console.log('✅ Using URL:', FORCE_API_URL);
console.log('📅 Build time:', new Date().toISOString());

// Prevent any modifications
Object.freeze(FORCE_API_URL);

export default FORCE_API_URL;