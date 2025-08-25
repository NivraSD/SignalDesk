// Smart Cache Manager - Prevents cache from ruining everything
// Only caches when appropriate, clears when needed

class SmartCacheManager {
  constructor() {
    this.CACHE_KEYS = {
      INTELLIGENCE: 'signaldesk_intelligence_cache',
      ORGANIZATION: 'signaldesk_organization',
      UNIFIED_PROFILE: 'signaldesk_unified_profile',
      ONBOARDING: 'signaldesk_onboarding',
      JUST_ONBOARDED: 'signaldesk_just_onboarded'
    }
    
    // Development/Testing mode detection
    this.isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('vercel.app')
    
    // Auto-clear stale caches on load
    this.clearStaleCaches()
  }
  
  clearStaleCaches() {
    // In development, always clear intelligence cache
    if (this.isDevelopment) {
      localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE)
      console.log('🗑️ Cleared intelligence cache (development mode)')
    }
    
    // Clear "just onboarded" flag if it's been more than 5 minutes
    const onboardedTime = localStorage.getItem('onboarded_timestamp')
    if (onboardedTime) {
      const elapsed = Date.now() - parseInt(onboardedTime)
      if (elapsed > 5 * 60 * 1000) { // 5 minutes
        localStorage.removeItem(this.CACHE_KEYS.JUST_ONBOARDED)
        localStorage.removeItem('onboarded_timestamp')
        console.log('🗑️ Cleared stale onboarding flag')
      }
    }
  }
  
  saveIntelligence(data, organization) {
    // NEVER cache in development/testing
    if (this.isDevelopment) {
      console.log('🚫 Skipping cache save (development mode)')
      return
    }
    
    // Only cache if we have real data (not templates)
    if (this.isRealData(data)) {
      localStorage.setItem(this.CACHE_KEYS.INTELLIGENCE, JSON.stringify({
        data,
        organization: organization?.name,
        timestamp: Date.now()
      }))
      console.log('💾 Cached real intelligence data')
    } else {
      console.log('🚫 Not caching template/mock data')
    }
  }
  
  getIntelligence(organization) {
    // NEVER use cache in development/testing
    if (this.isDevelopment) {
      console.log('🚫 Skipping cache read (development mode)')
      return null
    }
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEYS.INTELLIGENCE)
      if (!cached) return null
      
      const parsed = JSON.parse(cached)
      
      // Check if cache is for same organization
      if (parsed.organization !== organization?.name) {
        console.log('🗑️ Cache is for different organization, clearing')
        localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE)
        return null
      }
      
      // Check if cache is fresh (less than 30 minutes old)
      const age = Date.now() - parsed.timestamp
      if (age > 30 * 60 * 1000) {
        console.log('🗑️ Cache is stale, clearing')
        localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE)
        return null
      }
      
      return parsed.data
    } catch (e) {
      console.error('Cache read error:', e)
      localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE)
      return null
    }
  }
  
  isRealData(data) {
    // Check if this is real data or template/mock
    if (!data) return false
    
    // Check for template indicators
    const templateIndicators = [
      'Microsoft', 'Google', 'Apple', // Generic tech companies
      'template', 'mock', 'example', 'test',
      'Lorem ipsum', 'placeholder'
    ]
    
    const dataString = JSON.stringify(data).toLowerCase()
    
    for (const indicator of templateIndicators) {
      if (dataString.includes(indicator.toLowerCase())) {
        // Exception: Allow if it's in a real context (like actual competitor data)
        if (data.competitors && Array.isArray(data.competitors)) {
          continue // This might be real competitor data
        }
        return false
      }
    }
    
    // Check for suspiciously fast generation (less than 2 seconds)
    if (data.generatedIn && data.generatedIn < 2000) {
      return false
    }
    
    return true
  }
  
  saveOrganizationProfile(profile) {
    // Always save organization profile
    localStorage.setItem(this.CACHE_KEYS.UNIFIED_PROFILE, JSON.stringify(profile))
    console.log('💾 Saved organization profile')
  }
  
  clearAllCaches() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    sessionStorage.clear()
    console.log('🗑️ Cleared all caches')
  }
  
  clearIntelligenceOnly() {
    localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE)
    console.log('🗑️ Cleared intelligence cache only')
  }
}

// Export singleton instance
export const cacheManager = new SmartCacheManager()
export default cacheManager
