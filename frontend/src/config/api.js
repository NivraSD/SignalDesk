// API Configuration with proper environment variable support
// Uses React environment variables (REACT_APP_ prefix required)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://signaldesk-production.up.railway.app/api';

// Log the current configuration
console.log('API Configuration:');
console.log('- Environment API URL:', process.env.REACT_APP_API_URL);
console.log('- Using API URL:', API_BASE_URL);
console.log('- NODE_ENV:', process.env.NODE_ENV);

export default API_BASE_URL;