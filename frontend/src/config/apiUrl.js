// EMERGENCY FIX: Hardcoded API URL due to Vercel environment variable issues
// This file completely bypasses environment variables

const FORCE_API_URL = 'https://signaldesk-production.up.railway.app/api';

console.log('🚨 EMERGENCY API CONFIG ACTIVATED');
console.log('🔧 Using hardcoded URL:', FORCE_API_URL);
console.log('📅 Deployed:', new Date().toISOString());

export default FORCE_API_URL;