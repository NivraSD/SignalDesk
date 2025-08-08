// EMERGENCY API OVERRIDE - Forces correct backend URL
window.FORCED_API_URL = 'https://signaldesk-production.up.railway.app/api';
console.log('🚨 API OVERRIDE ACTIVE - Using:', window.FORCED_API_URL);

// Override any environment variables
if (window.process && window.process.env) {
  window.process.env.REACT_APP_API_URL = window.FORCED_API_URL;
}

// Set in localStorage for persistence
localStorage.setItem('API_URL_OVERRIDE', window.FORCED_API_URL);