// Import emergency hardcoded URL
import FORCE_API_URL from './apiUrl';

// API Configuration - Using EMERGENCY hardcoded URL
const API_BASE_URL = FORCE_API_URL;

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
console.log('SignalDesk API Configuration:');
console.log('- Environment API URL:', process.env.REACT_APP_API_URL);
console.log('- Using API URL:', API_BASE_URL);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Timeout:', API_CONFIG.timeout, 'ms');
console.log('- Retry Attempts:', API_CONFIG.retryAttempts);

// Debug log
if (!API_BASE_URL.startsWith('http')) {
  console.error('⚠️ WARNING: API_BASE_URL is missing protocol:', API_BASE_URL);
  console.error('This will cause requests to fail. Check environment variables.');
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