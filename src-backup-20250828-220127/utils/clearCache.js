/**
 * Clear all cached intelligence data when switching organizations
 * This prevents stale data from being displayed
 */

export const clearAllIntelligenceCache = () => {
  console.log('🧹 Clearing all intelligence cache...');
  
  // Clear all localStorage items related to intelligence
  const keysToRemove = [
    'signaldesk_intelligence_cache',
    'signaldesk_last_fetch',
    'signaldesk_cached_results',
    'intelligence_data',
    'opportunity_cache',
    'last_intelligence_timestamp'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`  ✅ Removed ${key}`);
    }
  });
  
  // Clear session storage too
  sessionStorage.clear();
  console.log('  ✅ Cleared session storage');
  
  // Force page reload to ensure all components get fresh data
  return true;
};

export const switchOrganization = (newOrganization) => {
  console.log('🔄 Switching to organization:', newOrganization.name);
  
  // Clear all caches
  clearAllIntelligenceCache();
  
  // Update the profile with new organization
  const existingProfile = JSON.parse(localStorage.getItem('signaldesk_unified_profile') || '{}');
  const updatedProfile = {
    ...existingProfile,
    organization: newOrganization,
    // Reset competitors and topics for the new org
    competitors: [],
    monitoring_topics: [],
    // Add timestamp to force fresh data
    lastUpdated: new Date().toISOString(),
    cacheInvalidated: true
  };
  
  // Save updated profile
  localStorage.setItem('signaldesk_unified_profile', JSON.stringify(updatedProfile));
  localStorage.setItem('signaldesk_organization', JSON.stringify(newOrganization));
  
  // Force a hard reload to ensure all components reinitialize
  window.location.reload(true);
};

export const isDataStale = (timestamp) => {
  if (!timestamp) return true;
  
  const dataAge = Date.now() - new Date(timestamp).getTime();
  const MAX_AGE = 5 * 60 * 1000; // 5 minutes
  
  return dataAge > MAX_AGE;
};