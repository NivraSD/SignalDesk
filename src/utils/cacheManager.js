// DISABLED: Centralized Cache Manager - Using Supabase as single source of truth
// ALL caching operations are now no-ops to prevent localStorage interference

class CacheManager {
  constructor() {
    console.log('⚠️ Cache Manager DISABLED - Using Supabase only');
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
    
    // DISABLED: Initialize on construction
    // this.init();
  }
  
  init() {
    console.log('🔧 Cache Manager init DISABLED');
    // DISABLED: Check if we should clear stale data on app start
    // this.clearStaleData();
  }
  
  // Clear ALL SignalDesk data - for fresh start
  clearAll() {
    console.log('⚠️ ClearAll DISABLED - no localStorage to clear, using Supabase');
    return 0; // Return immediately without clearing
    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    // More comprehensive list of keys to clear
    const clearPatterns = [
      'signaldesk',
      'onboarding', 
      'organization',
      'intelligence',
      'opportunity',
      'synthesis',
      'gathering',
      'discovery',
      'monitoring',
      'cache',
      'profile',
      'stakeholder',
      'competitor',
      'regulator',
      'analyst',
      'investor',
      'media',
      'activist',
      'mcp_results',
      'just_onboarded',
      'completed'
    ];
    
    keys.forEach(key => {
      const shouldClear = clearPatterns.some(pattern => 
        key.toLowerCase().includes(pattern)
      );
      
      if (shouldClear) {
        localStorage.removeItem(key);
        cleared++;
        console.log(`  🗑️ Removed: ${key}`);
      }
    });
    
    // Also clear any window-level caches
    if (typeof window !== 'undefined') {
      // Clear any window-level intelligence cache
      if (window.__SIGNALDESK_INTELLIGENCE__) {
        window.__SIGNALDESK_INTELLIGENCE__ = null;
        console.log('  🗑️ Cleared window.__SIGNALDESK_INTELLIGENCE__');
      }
      if (window.__SIGNALDESK_CACHE__) {
        window.__SIGNALDESK_CACHE__ = null;
        console.log('  🗑️ Cleared window.__SIGNALDESK_CACHE__');
      }
      if (window.__SIGNALDESK_ORG__) {
        window.__SIGNALDESK_ORG__ = null;
        console.log('  🗑️ Cleared window.__SIGNALDESK_ORG__');
      }
    }
    
    console.log(`✅ Cleared ${cleared} cache items`);
    return cleared;
  }
  
  // Clear only intelligence/synthesis data (keep organization)
  clearIntelligence() {
    console.log('🗑️ Clearing ALL intelligence data...');
    
    // Clear primary intelligence keys
    localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE);
    localStorage.removeItem(this.CACHE_KEYS.LAST_SYNTHESIS);
    localStorage.removeItem(this.CACHE_KEYS.INTELLIGENCE_HUB);
    
    // Clear any other intelligence-related keys that might exist
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if ((key.includes('intelligence') || 
           key.includes('synthesis') || 
           key.includes('gathering') ||
           key.includes('opportunity') ||
           key.includes('cache')) && 
          !key.includes('organization') && 
          !key.includes('profile')) {
        console.log(`  🗑️ Removing: ${key}`);
        localStorage.removeItem(key);
      }
    });
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
    // DISABLED: No localStorage saving
    console.log(`⚠️ Cache save DISABLED for: ${key} - using Supabase`);
    return true; // Return success to avoid breaking flows
  }
  
  // Get data from cache
  get(key) {
    // DISABLED: No localStorage reading
    console.log(`⚠️ Cache get DISABLED for: ${key} - use Supabase`);
    return null; // Always return null to force Supabase load
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
    console.log('🔄 Starting new search - clearing ALL intelligence data...');
    this.clearIntelligence();
    
    // Also clear window-level intelligence caches
    if (typeof window !== 'undefined') {
      if (window.__SIGNALDESK_INTELLIGENCE__) {
        window.__SIGNALDESK_INTELLIGENCE__ = null;
        console.log('  🗑️ Cleared window.__SIGNALDESK_INTELLIGENCE__');
      }
      if (window.__SIGNALDESK_CACHE__) {
        window.__SIGNALDESK_CACHE__ = null;
        console.log('  🗑️ Cleared window.__SIGNALDESK_CACHE__');
      }
    }
    
    // Verify what's left
    this.verifyCacheState();
    
    return true;
  }
  
  // Verify cache state - useful for debugging
  verifyCacheState() {
    const state = {
      localStorage: {},
      windowCaches: {},
      totalItems: 0
    };
    
    // Check localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('signaldesk') || 
          key.includes('organization') ||
          key.includes('intelligence') ||
          key.includes('opportunity') ||
          key.includes('profile')) {
        try {
          const value = localStorage.getItem(key);
          const parsed = JSON.parse(value);
          state.localStorage[key] = parsed ? '✅ Has data' : '⚠️ Empty';
        } catch {
          state.localStorage[key] = '⚠️ Invalid JSON';
        }
        state.totalItems++;
      }
    });
    
    // Check window caches
    if (typeof window !== 'undefined') {
      state.windowCaches.__SIGNALDESK_INTELLIGENCE__ = window.__SIGNALDESK_INTELLIGENCE__ ? '✅ Has data' : '❌ Empty';
      state.windowCaches.__SIGNALDESK_CACHE__ = window.__SIGNALDESK_CACHE__ ? '✅ Has data' : '❌ Empty';
      state.windowCaches.__SIGNALDESK_ORG__ = window.__SIGNALDESK_ORG__ ? '✅ Has data' : '❌ Empty';
    }
    
    console.log('📊 Cache State Verification:', state);
    return state;
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

// Add global debug functions for testing cache issues
if (typeof window !== 'undefined') {
  window.debugCache = () => cacheManager.verifyCacheState();
  window.clearAllCache = () => cacheManager.clearAll();
  window.checkCacheContamination = () => {
    const state = cacheManager.verifyCacheState();
    const issues = [];
    
    // Check for multiple organizations in cache
    const orgKeys = Object.keys(state.localStorage).filter(k => 
      k.includes('organization') || k.includes('profile')
    );
    
    if (orgKeys.length > 3) {
      issues.push(`⚠️ Multiple organization keys found: ${orgKeys.length}`);
    }
    
    // Check for stale intelligence
    const intelKeys = Object.keys(state.localStorage).filter(k => 
      k.includes('intelligence') || k.includes('synthesis')
    );
    
    intelKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.timestamp) {
          const age = Date.now() - new Date(data.timestamp).getTime();
          if (age > 30 * 60 * 1000) { // 30 minutes
            issues.push(`⚠️ Stale cache: ${key} is ${Math.round(age / 60000)} minutes old`);
          }
        }
      } catch {}
    });
    
    // Check for window-level contamination
    if (window.__SIGNALDESK_INTELLIGENCE__ || window.__SIGNALDESK_CACHE__) {
      issues.push('⚠️ Window-level caches still active');
    }
    
    if (issues.length > 0) {
      console.log('🚨 Cache contamination detected:', issues);
    } else {
      console.log('✅ Cache is clean');
    }
    
    return issues;
  };
  
  console.log('🛠️ Cache debug functions available:');
  console.log('  - window.debugCache() - Show cache state');
  console.log('  - window.clearAllCache() - Clear all caches');
  console.log('  - window.checkCacheContamination() - Check for issues');
}

export default cacheManager;