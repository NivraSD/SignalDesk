// Centralized Cache Manager - Single source of truth for all caching
// Handles clearing, saving, and loading consistently

class CacheManager {
  constructor() {
    this.CACHE_PREFIX = 'signaldesk_';
    this.CACHE_KEYS = {
      ORGANIZATION: 'signaldesk_organization',
      COMPLETE_PROFILE: 'signaldesk_complete_profile',
      INTELLIGENCE: 'signaldesk_intelligence_cache',
      LAST_SYNTHESIS: 'signaldesk_last_synthesis',
      INTELLIGENCE_HUB: 'signaldesk_intelligence_hub',
      ONBOARDING_CONFIG: 'onboarding_config',
      CURRENT_ORGANIZATION: 'current_organization'
    };
    
    // Cache duration in milliseconds
    this.CACHE_DURATION = {
      ORGANIZATION: 24 * 60 * 60 * 1000, // 24 hours
      INTELLIGENCE: 30 * 60 * 1000,      // 30 minutes
      SYNTHESIS: 30 * 60 * 1000          // 30 minutes
    };
    
    // Initialize on construction
    this.init();
  }
  
  init() {
    console.log('🔧 Cache Manager initialized');
    // Check if we should clear stale data on app start
    this.clearStaleData();
  }
  
  // Clear ALL SignalDesk data - for fresh start
  clearAll() {
    console.log('🗑️ Clearing ALL SignalDesk cache data...');
    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    keys.forEach(key => {
      if (key.includes('signaldesk') || 
          key.includes('onboarding') || 
          key.includes('organization') ||
          key.includes('intelligence') ||
          key.includes('opportunity')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    
    console.log(`✅ Cleared ${cleared} cache items`);
    return cleared;
  }
  
  // Clear only intelligence/synthesis data (keep organization)
  clearIntelligence() {
    console.log('🗑️ Clearing intelligence cache...');
    localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE);
    localStorage.removeItem(this.CACHE_KEYS.LAST_SYNTHESIS);
    localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE_HUB);
  }
  
  // Clear stale data based on age
  clearStaleData() {
    const now = Date.now();
    
    // Check intelligence cache age
    const intelligenceCache = this.get(this.CACHE_KEYS.INTELLIGENCE);
    if (intelligenceCache && intelligenceCache.timestamp) {
      const age = now - new Date(intelligenceCache.timestamp).getTime();
      if (age > this.CACHE_DURATION.INTELLIGENCE) {
        console.log('🗑️ Clearing stale intelligence cache');
        this.clearIntelligence();
      }
    }
    
    // Check synthesis cache age
    const synthesisCache = this.get(this.CACHE_KEYS.LAST_SYNTHESIS);
    if (synthesisCache && synthesisCache.timestamp) {
      const age = now - new Date(synthesisCache.timestamp).getTime();
      if (age > this.CACHE_DURATION.SYNTHESIS) {
        console.log('🗑️ Clearing stale synthesis cache');
        localStorage.removeItem(this.CACHE_KEYS.LAST_SYNTHESIS);
      }
    }
  }
  
  // Save data with timestamp
  save(key, data, addTimestamp = true) {
    try {
      const dataToSave = addTimestamp ? {
        ...data,
        _cachedAt: new Date().toISOString()
      } : data;
      
      localStorage.setItem(key, JSON.stringify(dataToSave));
      console.log(`💾 Saved to cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  }
  
  // Get data from cache
  get(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  }
  
  // Remove specific key
  remove(key) {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed from cache: ${key}`);
  }
  
  // Save organization data
  saveOrganization(orgData) {
    return this.save(this.CACHE_KEYS.ORGANIZATION, orgData);
  }
  
  // Get organization data
  getOrganization() {
    return this.get(this.CACHE_KEYS.ORGANIZATION);
  }
  
  // Save complete profile (org + stakeholders)
  saveCompleteProfile(profile) {
    return this.save(this.CACHE_KEYS.COMPLETE_PROFILE, profile);
  }
  
  // Get complete profile
  getCompleteProfile() {
    return this.get(this.CACHE_KEYS.COMPLETE_PROFILE);
  }
  
  // Save intelligence data
  saveIntelligence(intelligence) {
    return this.save(this.CACHE_KEYS.INTELLIGENCE, {
      data: intelligence,
      timestamp: new Date().toISOString()
    }, false);
  }
  
  // Get intelligence data (with age check)
  getIntelligence() {
    const cached = this.get(this.CACHE_KEYS.INTELLIGENCE);
    if (!cached || !cached.timestamp) return null;
    
    // Check age
    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age > this.CACHE_DURATION.INTELLIGENCE) {
      console.log('⚠️ Intelligence cache is stale');
      this.remove(this.CACHE_KEYS.INTELLIGENCE);
      return null;
    }
    
    return cached.data;
  }
  
  // Save synthesis data
  saveSynthesis(synthesis) {
    return this.save(this.CACHE_KEYS.LAST_SYNTHESIS, synthesis);
  }
  
  // Get synthesis data
  getSynthesis() {
    return this.get(this.CACHE_KEYS.LAST_SYNTHESIS);
  }
  
  // Check if user just onboarded (within last 5 minutes)
  isJustOnboarded() {
    const profile = this.getCompleteProfile();
    if (!profile || !profile._cachedAt) return false;
    
    const age = Date.now() - new Date(profile._cachedAt).getTime();
    return age < 5 * 60 * 1000; // 5 minutes
  }
  
  // Start new search (clear intelligence but keep organization)
  startNewSearch() {
    console.log('🔄 Starting new search...');
    this.clearIntelligence();
    return true;
  }
  
  // Get cache status for debugging
  getCacheStatus() {
    const status = {};
    Object.entries(this.CACHE_KEYS).forEach(([name, key]) => {
      const data = localStorage.getItem(key);
      status[name] = {
        exists: !!data,
        size: data ? data.length : 0,
        key: key
      };
    });
    return status;
  }
}

// Export singleton instance
const cacheManager = new CacheManager();
export default cacheManager;