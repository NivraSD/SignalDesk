/**
 * Onboarding Adapter
 * Bridges the onboarding flow with the intelligence pipeline
 * Converts onboarding data to standard intelligence profile format
 */

import { 
  createStandardProfile, 
  saveToLocalStorage,
  prepareStagePayload 
} from './intelligenceDataFlow';
import intelligencePipelineService from '../services/intelligencePipelineService';

/**
 * Convert onboarding data to intelligence profile
 */
export const convertOnboardingToProfile = (onboardingData) => {
  // Extract organization info
  const organization = onboardingData.organization || {
    name: onboardingData.companyName || onboardingData.organizationName || '',
    industry: onboardingData.industry || '',
    description: onboardingData.description || '',
    url: onboardingData.website || onboardingData.url || ''
  };

  // Extract competitors (may be in different formats)
  const competitors = {
    direct: [],
    indirect: [],
    emerging: []
  };

  // Check various possible locations for competitors
  if (onboardingData.competitors) {
    if (Array.isArray(onboardingData.competitors)) {
      // Flat array - categorize them
      onboardingData.competitors.forEach(comp => {
        const competitorObj = typeof comp === 'string' ? { name: comp } : comp;
        const type = competitorObj.type || competitorObj.category || 'direct';
        competitors[type].push(competitorObj);
      });
    } else if (typeof onboardingData.competitors === 'object') {
      // Already categorized
      competitors.direct = onboardingData.competitors.direct || [];
      competitors.indirect = onboardingData.competitors.indirect || [];
      competitors.emerging = onboardingData.competitors.emerging || [];
    }
  }

  // Extract stakeholders
  const stakeholders = {
    regulators: [],
    media: [],
    investors: [],
    analysts: [],
    activists: []
  };

  // Map stakeholder selections to actual entities
  if (onboardingData.stakeholders) {
    if (Array.isArray(onboardingData.stakeholders)) {
      // Convert stakeholder IDs to placeholder entities
      onboardingData.stakeholders.forEach(stakeholderId => {
        switch(stakeholderId) {
          case 'regulators':
            stakeholders.regulators = ['SEC', 'FTC', 'DOJ'];
            break;
          case 'media':
            stakeholders.media = ['TechCrunch', 'WSJ', 'Bloomberg'];
            break;
          case 'investors':
            stakeholders.investors = ['Sequoia', 'a16z', 'Benchmark'];
            break;
          case 'analysts':
            stakeholders.analysts = ['Gartner', 'Forrester', 'IDC'];
            break;
          case 'activists':
            stakeholders.activists = ['EFF', 'Privacy International'];
            break;
        }
      });
    }
  }

  // Extract keywords
  const keywords = onboardingData.keywords || onboardingData.topics || [];

  // Extract products
  const products = onboardingData.products || onboardingData.services || [];

  // Extract executives
  const executives = onboardingData.executives || onboardingData.leadership || [];

  // Create standard profile
  return createStandardProfile({
    organization,
    competitors,
    stakeholders,
    keywords,
    products,
    executives,
    metadata: {
      source: 'onboarding',
      onboardingVersion: onboardingData.version || '1.0',
      goals: onboardingData.goals || {}
    }
  });
};

/**
 * Save onboarding data and prepare for intelligence pipeline
 */
export const saveOnboardingData = async (onboardingData) => {
  try {
    // Convert to standard profile
    const profile = convertOnboardingToProfile(onboardingData);
    
    // Save using both key formats for compatibility
    const orgName = profile.organization.name;
    
    // Save in intelligence pipeline format
    saveToLocalStorage('organizationProfile', profile);
    saveToLocalStorage(`profile_${orgName}`, profile);
    
    // Also save original onboarding data for backward compatibility
    if (onboardingData) {
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(onboardingData));
      localStorage.setItem('signaldesk_organization', JSON.stringify(profile.organization));
    }
    
    // Save to database via intelligence pipeline service
    await intelligencePipelineService.saveProfileToDatabase(orgName, profile);
    
    console.log('✅ Onboarding data saved and converted to intelligence profile');
    
    return profile;
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
};

/**
 * Load onboarding data and convert to profile
 */
export const loadOnboardingProfile = async () => {
  try {
    // Try to load from intelligence pipeline first
    const orgData = localStorage.getItem('signaldesk_organization');
    if (orgData) {
      const org = JSON.parse(orgData);
      const profile = await intelligencePipelineService.loadProfile(org.name);
      if (profile) {
        return profile;
      }
    }
    
    // Fallback to onboarding data
    const onboardingData = localStorage.getItem('signaldesk_onboarding');
    if (onboardingData) {
      const parsed = JSON.parse(onboardingData);
      return convertOnboardingToProfile(parsed);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading onboarding profile:', error);
    return null;
  }
};

/**
 * Check if onboarding is complete and data is ready for pipeline
 */
export const isOnboardingComplete = () => {
  const completed = localStorage.getItem('signaldesk_completed') === 'true';
  const hasOrganization = localStorage.getItem('signaldesk_organization') !== null;
  return completed && hasOrganization;
};

/**
 * Start intelligence pipeline after onboarding
 */
export const startIntelligencePipeline = async () => {
  try {
    // Load the profile
    const profile = await loadOnboardingProfile();
    if (!profile) {
      throw new Error('No organization profile found');
    }
    
    // Validate pipeline readiness
    const validation = await intelligencePipelineService.validatePipelineReadiness(
      profile.organization.name
    );
    
    if (!validation.ready) {
      console.warn('Pipeline not ready:', validation.issues);
      
      // Try to fix by running discovery
      if (!validation.hasProfile) {
        await intelligencePipelineService.runDiscovery(
          profile.organization.name,
          { profile }
        );
      }
    }
    
    // Start the pipeline
    const results = await intelligencePipelineService.runCompletePipeline(
      profile.organization.name,
      {
        runDiscovery: !validation.hasProfile,
        continueOnError: true
      }
    );
    
    return results;
  } catch (error) {
    console.error('Error starting intelligence pipeline:', error);
    throw error;
  }
};

/**
 * Clear all onboarding and intelligence data
 */
export const clearAllData = () => {
  // Clear onboarding keys
  localStorage.removeItem('signaldesk_onboarding');
  localStorage.removeItem('signaldesk_organization');
  localStorage.removeItem('signaldesk_completed');
  localStorage.removeItem('signaldesk_just_onboarded');
  localStorage.removeItem('signaldesk_mcp_results');
  
  // Clear intelligence pipeline keys
  localStorage.removeItem('organizationProfile');
  
  // Clear any profile keys
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('profile_') || key.startsWith('pipeline_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('🧹 All onboarding and intelligence data cleared');
};

export default {
  convertOnboardingToProfile,
  saveOnboardingData,
  loadOnboardingProfile,
  isOnboardingComplete,
  startIntelligencePipeline,
  clearAllData
};