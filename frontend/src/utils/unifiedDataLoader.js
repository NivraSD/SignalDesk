// Unified Data Loader - EDGE FUNCTION as SINGLE SOURCE OF TRUTH
// NO localStorage - ALL data comes from intelligence-persistence edge function

import supabaseDataService from '../services/supabaseDataService';

export const getUnifiedOrganization = async () => {
  // CRITICAL: Load ONLY from edge function - NO localStorage
  console.log('🔍 Loading organization from edge function (single source of truth)...');
  
  try {
    // Get current user's organization from edge function
    const response = await fetch(
      `${supabaseDataService.supabaseUrl}/functions/v1/intelligence-persistence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseDataService.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getLatestProfile'  // Use the correct action for RailwayV2
        })
      }
    );
    
    if (!response.ok) {
      console.error('❌ Failed to load from edge function:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (data.success && data.profile) {
      const org = data.profile.organization || data.profile;
      console.log('✅ Loaded organization from edge function:', org);
      // Store the organization name for future requests
      if (org?.name) {
        window.__currentOrganizationName = org.name;
      }
      return org;
    } else {
      console.warn('⚠️ No organization profile in edge function');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to load from edge function:', error);
    return null;
  }
};

export const getUnifiedOpportunityConfig = async () => {
  // Load from edge function - NO localStorage
  try {
    // First get the organization profile
    const org = await getUnifiedOrganization();
    if (!org?.name) {
      console.warn('No organization found for opportunity config');
      return getDefaultOpportunityConfig();
    }
    
    // Get opportunity profile from edge function
    const response = await fetch(
      `${supabaseDataService.supabaseUrl}/functions/v1/intelligence-persistence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseDataService.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getStageData',
          organization_name: org.name,
          stage: 'opportunity_profile'
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        console.log('✅ Loaded opportunity config from edge function');
        return data.data;
      }
    }
  } catch (error) {
    console.error('Error loading opportunity config:', error);
  }
  
  return getDefaultOpportunityConfig();
};

const getDefaultOpportunityConfig = () => ({
  minimum_confidence: 70,
  opportunity_types: {
    competitor_weakness: true,
    narrative_vacuum: true,
    cascade_effect: true,
    crisis_prevention: true,
    viral_moment: false
  },
  risk_tolerance: 'moderate',
  preferred_tiers: ['tier1_business', 'tier1_tech'],
  voice: 'professional',
  response_speed: 'immediate',
  industry: 'technology'
});

// Save organization data to edge function - NO localStorage
export const syncOrganizationData = async (organization) => {
  if (!organization?.name) return;
  
  console.log('🔄 Saving organization data to edge function:', organization);
  
  try {
    // Save to edge function ONLY
    const response = await fetch(
      `${supabaseDataService.supabaseUrl}/functions/v1/intelligence-persistence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseDataService.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveProfile',
          organization_name: organization.name,
          profile: { organization }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }
    
    console.log('✅ Organization saved to edge function');
  } catch (error) {
    console.error('❌ Failed to save organization to edge function:', error);
    throw error; // Fail if save fails - NO localStorage fallback
  }
};