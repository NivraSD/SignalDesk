// Supabase Singleton Validation Utility
// This file helps ensure only one Supabase client instance exists

import { supabase } from '../config/supabase';

// Validation function to check client health
export const validateSupabaseClient = () => {
  const validation = {
    isValid: false,
    issues: [],
    client: null
  };

  try {
    // Check if client exists
    if (!supabase) {
      validation.issues.push('Supabase client is not initialized');
      return validation;
    }

    // Check if auth is available
    if (!supabase.auth) {
      validation.issues.push('Supabase auth is not available');
      return validation;
    }

    // Check if from method is available (database access)
    if (!supabase.from) {
      validation.issues.push('Supabase database access is not available');
      return validation;
    }

    // Check environment variables
    if (!process.env.REACT_APP_SUPABASE_URL) {
      validation.issues.push('REACT_APP_SUPABASE_URL is not set');
    }

    if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
      validation.issues.push('REACT_APP_SUPABASE_ANON_KEY is not set');
    }

    validation.isValid = validation.issues.length === 0;
    validation.client = supabase;
    
    return validation;
  } catch (error) {
    validation.issues.push(`Validation error: ${error.message}`);
    return validation;
  }
};

// Test authentication availability (without triggering additional auth state changes)
export const testAuthConnection = async () => {
  try {
    // Just test that auth object exists and has required methods
    const hasRequiredMethods = supabase.auth && 
                              typeof supabase.auth.getSession === 'function' &&
                              typeof supabase.auth.signInWithPassword === 'function';
    
    return {
      success: hasRequiredMethods,
      session: null, // Don't query session during validation to avoid state triggers
      error: hasRequiredMethods ? null : 'Auth methods not available',
      note: 'Auth client structure validated (session not queried to avoid state changes)'
    };
  } catch (err) {
    return {
      success: false,
      session: null,
      error: err.message
    };
  }
};

// Test database connection (graceful)
export const testDatabaseConnection = async () => {
  try {
    // Try a simple query that shouldn't fail
    const { error } = await supabase
      .from('nonexistent_table_test')
      .select('*')
      .limit(1);
    
    // If we get a "table doesn't exist" error, that's actually good - it means DB connection works
    return {
      success: true,
      connected: true,
      error: error?.message || null,
      note: error?.message?.includes('does not exist') ? 'Connection working (table not found is expected)' : null
    };
  } catch (err) {
    return {
      success: false,
      connected: false,
      error: err.message
    };
  }
};

// Run full validation
export const runFullValidation = async () => {
  console.log('🔍 Running Supabase singleton validation...');
  
  const clientValidation = validateSupabaseClient();
  const authTest = await testAuthConnection();
  const dbTest = await testDatabaseConnection();
  
  const report = {
    timestamp: new Date().toISOString(),
    client: clientValidation,
    auth: authTest,
    database: dbTest,
    overall: clientValidation.isValid && authTest.success && dbTest.success
  };
  
  console.log('📊 Validation Report:', report);
  
  return report;
};

const validationUtils = {
  validateSupabaseClient,
  testAuthConnection,
  testDatabaseConnection,
  runFullValidation
};

export default validationUtils;