// Unified Data Loader - Single source of truth for organization data
// Fixes inconsistency where different modules read from different localStorage keys

export const getUnifiedOrganization = () => {
  // Priority order: signaldesk_unified_profile > signaldesk_organization > signaldesk_onboarding
  
  // Check unified profile first (most complete)
  const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
  if (unifiedProfile) {
    try {
      const profile = JSON.parse(unifiedProfile);
      if (profile.organization?.name) {
        return profile.organization;
      }
    } catch (e) {
      console.warn('Error parsing unified profile:', e);
    }
  }
  
  // Check direct organization storage
  const directOrg = localStorage.getItem('signaldesk_organization');
  if (directOrg) {
    try {
      const org = JSON.parse(directOrg);
      if (org.name) {
        return org;
      }
    } catch (e) {
      console.warn('Error parsing organization:', e);
    }
  }
  
  // Fallback to onboarding data
  const onboardingData = localStorage.getItem('signaldesk_onboarding');
  if (onboardingData) {
    try {
      const data = JSON.parse(onboardingData);
      if (data.organization?.name) {
        return data.organization;
      }
    } catch (e) {
      console.warn('Error parsing onboarding data:', e);
    }
  }
  
  console.warn('No organization data found in localStorage');
  return null;
};

export const getUnifiedCompleteProfile = () => {
  // Get the COMPLETE profile including all stakeholders
  // Check both possible keys (complete_profile is the new standard)
  const completeProfile = localStorage.getItem('signaldesk_complete_profile');
  if (completeProfile) {
    try {
      const profile = JSON.parse(completeProfile);
      console.log('📂 Loaded complete profile from cache');
      return profile;
    } catch (e) {
      console.warn('Error parsing complete profile:', e);
    }
  }
  
  // Fallback to unified profile
  const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
  if (unifiedProfile) {
    try {
      const profile = JSON.parse(unifiedProfile);
      console.log('📂 Loaded profile from localStorage:', {
        hasOrganization: !!profile.organization,
        competitors: profile.competitors,
        regulators: profile.regulators,
        media_outlets: profile.media_outlets,
        activists: profile.activists,
        investors: profile.investors,
        analysts: profile.analysts
      });
      
      return {
        organization: profile.organization,
        competitors: profile.competitors || [],
        monitoring_topics: profile.monitoring_topics || [],
        // Include ALL stakeholder types
        stakeholders: profile.stakeholders || {},
        regulators: profile.regulators || [],
        activists: profile.activists || [],
        media_outlets: profile.media_outlets || [],
        investors: profile.investors || [],
        analysts: profile.analysts || [],
        // Include opportunity config
        opportunities: profile.opportunities,
        brand: profile.brand,
        messaging: profile.messaging,
        media: profile.media,
        spokespeople: profile.spokespeople
      };
    } catch (e) {
      console.warn('Error parsing unified profile:', e);
    }
  }
  
  // Fallback to organization only
  return {
    organization: getUnifiedOrganization(),
    competitors: [],
    monitoring_topics: [],
    stakeholders: {},
    regulators: [],
    activists: [],
    media_outlets: [],
    investors: [],
    analysts: []
  };
};

export const getUnifiedOpportunityConfig = () => {
  // Priority: opportunity_profile > signaldesk_unified_profile > defaults
  
  const opportunityProfile = localStorage.getItem('opportunity_profile');
  if (opportunityProfile) {
    try {
      return JSON.parse(opportunityProfile);
    } catch (e) {
      console.warn('Error parsing opportunity profile:', e);
    }
  }
  
  // Extract from unified profile
  const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
  if (unifiedProfile) {
    try {
      const profile = JSON.parse(unifiedProfile);
      return {
        minimum_confidence: profile.opportunities?.minimum_confidence || 70,
        opportunity_types: profile.opportunities?.types || {
          competitor_weakness: true,
          narrative_vacuum: true,
          cascade_effect: true,
          crisis_prevention: true,
          viral_moment: false
        },
        risk_tolerance: profile.brand?.risk_tolerance || 'moderate',
        preferred_tiers: profile.media?.preferred_tiers || ['tier1_business', 'tier1_tech'],
        voice: profile.brand?.voice || 'professional',
        response_speed: profile.brand?.response_speed || 'immediate',
        core_value_props: profile.messaging?.core_value_props || [],
        industry: profile.organization?.industry || 'technology'
      };
    } catch (e) {
      console.warn('Error parsing unified profile for opportunities:', e);
    }
  }
  
  // Default config
  return {
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
  };
};

// Sync all storage keys to ensure consistency
export const syncOrganizationData = (organization) => {
  if (!organization?.name) return;
  
  console.log('🔄 Syncing organization data across all storage keys:', organization);
  
  // Update all storage locations
  localStorage.setItem('signaldesk_organization', JSON.stringify(organization));
  
  // Update unified profile
  const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
  if (unifiedProfile) {
    try {
      const profile = JSON.parse(unifiedProfile);
      profile.organization = organization;
      localStorage.setItem('signaldesk_unified_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Error updating unified profile:', e);
    }
  }
  
  // Update onboarding data
  const onboardingData = localStorage.getItem('signaldesk_onboarding');
  if (onboardingData) {
    try {
      const data = JSON.parse(onboardingData);
      data.organization = organization;
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(data));
    } catch (e) {
      console.warn('Error updating onboarding data:', e);
    }
  }
};