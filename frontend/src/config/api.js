// Centralized API configuration
// CRITICAL: This is the ONLY place to change the API URL

// PRODUCTION API - Railway deployment
const PROD_API = 'https://signaldesk-production.up.railway.app/api';

// FORCE correct URL - Check window override FIRST
// The old URL signaldesk-api-production is WRONG
let API_BASE_URL = window?.FORCED_API_URL || 
                   localStorage.getItem('API_URL_OVERRIDE') ||
                   PROD_API;

// Check if environment variable is set and if it's the WRONG URL
if (process.env.REACT_APP_API_URL) {
  if (process.env.REACT_APP_API_URL.includes('signaldesk-api-production')) {
    console.warn('⚠️ WRONG API URL in environment variable, overriding with correct URL');
    API_BASE_URL = PROD_API;
  } else if (process.env.REACT_APP_API_URL.includes('signaldesk-production.up.railway.app')) {
    // Only use env var if it's the correct URL
    API_BASE_URL = process.env.REACT_APP_API_URL;
  } else {
    // Any other URL, use production
    console.warn('⚠️ Unknown API URL in environment, using production URL');
    API_BASE_URL = PROD_API;
  }
}

// Log the URL being used (helpful for debugging)
if (typeof window !== 'undefined') {
  console.log('✅ Final API URL:', API_BASE_URL);
  console.log('Environment var was:', process.env.REACT_APP_API_URL);
  
  // Double-check and override at runtime if needed
  if (API_BASE_URL.includes('signaldesk-api-production')) {
    console.error('❌ CRITICAL: Wrong URL still detected, forcing correct URL');
    API_BASE_URL = PROD_API;
  }
  
  // Store in window for absolute certainty
  window.SIGNALDESK_API_URL = PROD_API;
}

// Always export the correct URL, with multiple fallbacks
const FINAL_URL = (typeof window !== 'undefined' && window.SIGNALDESK_API_URL) || 
                   (!API_BASE_URL.includes('signaldesk-api-production') ? API_BASE_URL : PROD_API) || 
                   PROD_API;

export default FINAL_URL;
export const BACKUP_URL = PROD_API;