// SUPABASE-ONLY CONFIGURATION - NO BACKEND SERVER NEEDED
// All backend functionality is handled by Supabase Edge Functions

import { supabase } from './supabase';

// No traditional API URL needed - everything goes through Supabase
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';

console.log('🚀 SUPABASE-ONLY MODE ACTIVE');
console.log('✅ Using Supabase URL:', SUPABASE_URL);
console.log('🔒 No backend server required');
console.log('⚡ All APIs handled by Supabase Edge Functions');
console.log('📅 Build time:', new Date().toISOString());

// Export empty string for legacy code compatibility
// All actual API calls should use Supabase directly
const FORCE_API_URL = '';

Object.freeze(FORCE_API_URL);

export { SUPABASE_URL, supabase };
export default FORCE_API_URL;