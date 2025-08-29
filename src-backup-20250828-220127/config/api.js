// SUPABASE-ONLY MODE - No traditional backend API
import { supabase } from './supabase';

const getAPIBaseURL = () => {
  // Return empty string - all API calls go through Supabase
  return '';
};

const API_BASE_URL = '';  // No backend server - Supabase handles everything

// Enhanced API configuration with retry logic and error handling
const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Log the current configuration
console.log('SignalDesk Configuration - SUPABASE ONLY:');
console.log('- Backend Mode: Supabase Edge Functions');
console.log('- Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('- Environment:', process.env.NODE_ENV);
console.log('- Auth: Supabase Auth');
console.log('- Database: Supabase PostgreSQL');
console.log('- APIs: Supabase Edge Functions');
console.log('✅ Supabase-only configuration loaded');

// Debug log - only warn if API_BASE_URL is supposed to have a value
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  console.error('⚠️ WARNING: API_BASE_URL is missing protocol:', API_BASE_URL);
  console.error('This will cause requests to fail. Check environment variables.');
} else if (!API_BASE_URL) {
  console.log('✅ Supabase-only mode: No API_BASE_URL needed');
}

// API request helper with retry logic
export async function apiRequest(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  let lastError;
  
  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers
        }
      });
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${options.method || 'GET'} ${url} - Status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`[API] Attempt ${attempt}/${API_CONFIG.retryAttempts} failed for ${url}:`, error.message);
      
      if (attempt < API_CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Check API health
export async function checkAPIHealth() {
  try {
    const response = await apiRequest('/health');
    return response.ok;
  } catch (error) {
    console.error('[API] Health check failed:', error);
    return false;
  }
}

export { API_CONFIG };
export default API_BASE_URL;