// Centralized API configuration
// CRITICAL: This is the ONLY place to change the API URL

// PRODUCTION API - Railway deployment
const PROD_API = 'https://signaldesk-production.up.railway.app/api';

// Check for environment variable first, then use production URL
const API_BASE_URL = process.env.REACT_APP_API_URL || PROD_API;

// Log the URL being used (helpful for debugging)
if (typeof window !== 'undefined') {
  console.log('API URL:', API_BASE_URL);
  
  // Override any cached or incorrect URLs
  if (API_BASE_URL.includes('signaldesk-api-production')) {
    console.warn('⚠️ Old API URL detected, using correct URL:', PROD_API);
    window.API_BASE_URL = PROD_API;
  }
}

// Export the correct URL
export default window?.API_BASE_URL || API_BASE_URL || PROD_API;
export const BACKUP_URL = PROD_API;