// This file verifies the API configuration at build time
// It will throw an error if the API URL is not correct

import FORCE_API_URL from './apiUrl';

const EXPECTED_URL = 'DISABLED/api';

console.log('=========================================');
console.log('API CONFIGURATION VERIFICATION');
console.log('=========================================');
console.log('Expected URL:', EXPECTED_URL);
console.log('Actual URL:', FORCE_API_URL);

if (FORCE_API_URL !== EXPECTED_URL) {
  console.error('CRITICAL ERROR: API URL MISMATCH!');
  console.error('Expected:', EXPECTED_URL);
  console.error('Got:', FORCE_API_URL);
  throw new Error('API URL configuration is incorrect!');
}

console.log('✅ API URL configuration is correct');
console.log('=========================================');

export default FORCE_API_URL;