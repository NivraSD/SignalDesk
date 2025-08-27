/**
 * Unified Intelligence Data Flow Management
 * This is the SINGLE SOURCE OF TRUTH for data structure and flow
 */

// Standard data structure used EVERYWHERE
export const createStandardProfile = (data = {}) => {
  return {
    organization: {
      id: data.organization?.id || data.id || generateId(),
      name: data.organization?.name || data.name || '',
      industry: data.organization?.industry || data.industry || '',
      description: data.organization?.description || data.description || '',
      url: data.organization?.url || data.url || ''
    },
    competitors: {
      direct: Array.isArray(data.competitors?.direct) ? data.competitors.direct : [],
      indirect: Array.isArray(data.competitors?.indirect) ? data.competitors.indirect : [],
      emerging: Array.isArray(data.competitors?.emerging) ? data.competitors.emerging : []
    },
    stakeholders: {
      regulators: Array.isArray(data.stakeholders?.regulators) ? data.stakeholders.regulators : [],
      media: Array.isArray(data.stakeholders?.media) ? data.stakeholders.media : [],
      investors: Array.isArray(data.stakeholders?.investors) ? data.stakeholders.investors : [],
      analysts: Array.isArray(data.stakeholders?.analysts) ? data.stakeholders.analysts : [],
      activists: Array.isArray(data.stakeholders?.activists) ? data.stakeholders.activists : []
    },
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    products: Array.isArray(data.products) ? data.products : [],
    executives: Array.isArray(data.executives) ? data.executives : [],
    metadata: {
      discoveredAt: data.metadata?.discoveredAt || new Date().toISOString(),
      lastUpdated: data.metadata?.lastUpdated || new Date().toISOString(),
      source: data.metadata?.source || 'discovery',
      version: '2.0' // Data structure version
    }
  };
};

// Convert nested competitors to flat array for stages that need it
export const flattenCompetitors = (competitors) => {
  if (!competitors) return [];
  
  const result = [];
  
  if (Array.isArray(competitors)) {
    // Already flat
    return competitors;
  }
  
  // Convert nested structure to flat array
  if (competitors.direct) {
    result.push(...competitors.direct.map(c => ({
      ...c,
      type: 'direct',
      category: 'direct'
    })));
  }
  
  if (competitors.indirect) {
    result.push(...competitors.indirect.map(c => ({
      ...c,
      type: 'indirect',
      category: 'indirect'
    })));
  }
  
  if (competitors.emerging) {
    result.push(...competitors.emerging.map(c => ({
      ...c,
      type: 'emerging',
      category: 'emerging'
    })));
  }
  
  return result;
};

// Convert flat array back to nested structure
export const nestCompetitors = (competitorsArray) => {
  if (!Array.isArray(competitorsArray)) {
    return { direct: [], indirect: [], emerging: [] };
  }
  
  const nested = {
    direct: [],
    indirect: [],
    emerging: []
  };
  
  competitorsArray.forEach(competitor => {
    const type = competitor.type || competitor.category || 'direct';
    if (nested[type]) {
      nested[type].push(competitor);
    } else {
      nested.direct.push(competitor); // Default to direct
    }
  });
  
  return nested;
};

// Prepare data for Edge Function calls
export const prepareStagePayload = (profileData) => {
  const standardProfile = createStandardProfile(profileData);
  
  return {
    // Always include these fields
    organization: standardProfile.organization,
    competitors: flattenCompetitors(standardProfile.competitors),
    competitorsNested: standardProfile.competitors, // Include nested structure too
    stakeholders: standardProfile.stakeholders,
    keywords: standardProfile.keywords,
    products: standardProfile.products,
    executives: standardProfile.executives,
    metadata: standardProfile.metadata,
    
    // Include full profile for stages that need it
    fullProfile: standardProfile,
    
    // Include version for compatibility checking
    dataVersion: '2.0'
  };
};

// Save to localStorage with validation
export const saveToLocalStorage = (key, data) => {
  try {
    const standardData = createStandardProfile(data);
    localStorage.setItem(key, JSON.stringify(standardData));
    
    // Also save with timestamp for debugging
    localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
    localStorage.setItem(`${key}_version`, '2.0');
    
    console.log('✅ Saved to localStorage:', {
      key,
      organizationName: standardData.organization.name,
      competitorCount: flattenCompetitors(standardData.competitors).length,
      stakeholderCount: Object.values(standardData.stakeholders).flat().length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
    return false;
  }
};

// Load from localStorage with validation
export const loadFromLocalStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    const standardData = createStandardProfile(parsed);
    
    console.log('✅ Loaded from localStorage:', {
      key,
      organizationName: standardData.organization.name,
      competitorCount: flattenCompetitors(standardData.competitors).length,
      stakeholderCount: Object.values(standardData.stakeholders).flat().length,
      version: localStorage.getItem(`${key}_version`) || 'unknown'
    });
    
    return standardData;
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    return null;
  }
};

// Validate data structure
export const validateDataStructure = (data, stageName = '') => {
  const errors = [];
  
  if (!data) {
    errors.push(`${stageName}: No data provided`);
    return { valid: false, errors };
  }
  
  // Check organization
  if (!data.organization?.name) {
    errors.push(`${stageName}: Missing organization.name`);
  }
  
  // Check competitors structure
  if (data.competitors) {
    if (!data.competitors.direct && !Array.isArray(data.competitors)) {
      errors.push(`${stageName}: Invalid competitors structure`);
    }
  }
  
  // Check if we have any actual data
  const competitorCount = data.competitors ? 
    (Array.isArray(data.competitors) ? data.competitors.length : 
     flattenCompetitors(data.competitors).length) : 0;
  
  if (competitorCount === 0 && stageName.includes('Stage')) {
    console.warn(`⚠️ ${stageName}: No competitors found in data`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    stats: {
      competitorCount,
      hasStakeholders: !!data.stakeholders,
      hasMetadata: !!data.metadata
    }
  };
};

// Generate unique ID
const generateId = () => {
  return `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Debug helper
export const debugDataFlow = (label, data) => {
  console.group(`🔍 ${label}`);
  console.log('Data structure:', {
    hasOrganization: !!data?.organization,
    organizationName: data?.organization?.name,
    competitorStructure: data?.competitors ? 
      (Array.isArray(data.competitors) ? 'flat-array' : 'nested-object') : 'none',
    competitorCount: data?.competitors ? 
      (Array.isArray(data.competitors) ? data.competitors.length : 
       flattenCompetitors(data.competitors).length) : 0,
    stakeholderTypes: data?.stakeholders ? Object.keys(data.stakeholders) : [],
    hasFullProfile: !!data?.fullProfile,
    dataVersion: data?.dataVersion || 'unknown'
  });
  console.groupEnd();
};

// Export all functions
export default {
  createStandardProfile,
  flattenCompetitors,
  nestCompetitors,
  prepareStagePayload,
  saveToLocalStorage,
  loadFromLocalStorage,
  validateDataStructure,
  debugDataFlow
};