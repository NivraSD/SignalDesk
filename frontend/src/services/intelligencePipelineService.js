/**
 * Intelligence Pipeline Service - FIXED VERSION
 * Manages the complete intelligence pipeline with proper data flow
 */

import { 
  createStandardProfile, 
  prepareStagePayload, 
  saveToLocalStorage, 
  loadFromLocalStorage,
  validateDataStructure,
  debugDataFlow
} from '../utils/intelligenceDataFlow';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

class IntelligencePipelineService {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    };
  }

  /**
   * Run organization discovery and save profile
   */
  async runDiscovery(organizationName, additionalContext = {}) {
    console.log(`🔍 Starting discovery for: ${organizationName}`);
    
    try {
      // Call discovery Edge Function
      const response = await fetch(`${this.baseUrl}/organization-discovery`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          organization_name: organizationName,
          context: additionalContext
        })
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const discoveryData = await response.json();
      
      // Standardize the profile
      const standardProfile = createStandardProfile(discoveryData.profile || discoveryData);
      
      // Save to localStorage
      saveToLocalStorage('organizationProfile', standardProfile);
      saveToLocalStorage(`profile_${organizationName}`, standardProfile);
      
      // Save to database
      await this.saveProfileToDatabase(organizationName, standardProfile);
      
      console.log('✅ Discovery complete, profile saved');
      debugDataFlow('Discovery Profile', standardProfile);
      
      return standardProfile;
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      throw error;
    }
  }

  /**
   * Save profile to database via persistence Edge Function
   */
  async saveProfileToDatabase(organizationName, profile) {
    try {
      const response = await fetch(`${this.baseUrl}/intelligence-persistence`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'saveProfile',
          organization_name: organizationName,
          profile: profile
        })
      });

      if (!response.ok) {
        console.warn('Could not save profile to database');
      } else {
        console.log('✅ Profile saved to database');
      }
    } catch (error) {
      console.warn('Database save failed:', error);
    }
  }

  /**
   * Load organization profile from localStorage or database
   */
  async loadProfile(organizationName) {
    console.log(`📖 Loading profile for: ${organizationName}`);
    
    // Try localStorage first
    let profile = loadFromLocalStorage(`profile_${organizationName}`);
    
    if (profile) {
      console.log('✅ Profile loaded from localStorage');
      return profile;
    }
    
    // Try database
    try {
      const response = await fetch(`${this.baseUrl}/intelligence-persistence`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'getProfile',
          organization_name: organizationName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          profile = createStandardProfile(data.profile);
          
          // Cache in localStorage
          saveToLocalStorage(`profile_${organizationName}`, profile);
          
          console.log('✅ Profile loaded from database');
          return profile;
        }
      }
    } catch (error) {
      console.warn('Could not load from database:', error);
    }
    
    console.log('⚠️ No profile found');
    return null;
  }

  /**
   * Run a specific pipeline stage
   */
  async runStage(stageName, organizationProfile, previousResults = {}) {
    console.log(`🎯 Running stage: ${stageName}`);
    
    // Validate profile
    const validation = validateDataStructure(organizationProfile, stageName);
    if (!validation.valid) {
      console.warn(`⚠️ Data validation issues:`, validation.errors);
    }
    
    // Prepare payload with ALL data formats
    const payload = prepareStagePayload(organizationProfile);
    
    // Add previous results if available
    payload.previousResults = previousResults;
    
    debugDataFlow(`Stage ${stageName} Input`, payload);
    
    try {
      // Map stage names to Edge Function endpoints
      const stageEndpoints = {
        'competitors': 'intelligence-stage-1-competitors',
        'media': 'intelligence-stage-2-media',
        'regulatory': 'intelligence-stage-3-regulatory',
        'trends': 'intelligence-stage-4-trends',
        'synthesis': 'intelligence-stage-5-synthesis'
      };
      
      const endpoint = stageEndpoints[stageName] || stageName;
      
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Stage ${stageName} failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Stage ${stageName} complete`);
      debugDataFlow(`Stage ${stageName} Output`, result);
      
      // Save stage results
      await this.saveStageResults(organizationProfile.organization.name, stageName, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Stage ${stageName} failed:`, error);
      throw error;
    }
  }

  /**
   * Save stage results to database
   */
  async saveStageResults(organizationName, stageName, results) {
    try {
      const response = await fetch(`${this.baseUrl}/intelligence-persistence`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: organizationName,
          stage: stageName,
          stage_data: results.data || results,
          metadata: {
            timestamp: new Date().toISOString(),
            stage: stageName
          }
        })
      });

      if (!response.ok) {
        console.warn(`Could not save ${stageName} results to database`);
      } else {
        console.log(`✅ ${stageName} results saved to database`);
      }
    } catch (error) {
      console.warn(`Database save failed for ${stageName}:`, error);
    }
  }

  /**
   * Run the complete intelligence pipeline
   */
  async runCompletePipeline(organizationName, options = {}) {
    console.log(`🚀 Starting complete intelligence pipeline for: ${organizationName}`);
    
    const results = {
      profile: null,
      stages: {},
      errors: [],
      metadata: {
        startTime: Date.now(),
        endTime: null,
        duration: null
      }
    };
    
    try {
      // Step 1: Get or create organization profile
      results.profile = await this.loadProfile(organizationName);
      
      if (!results.profile && options.runDiscovery !== false) {
        console.log('📊 No profile found, running discovery...');
        results.profile = await this.runDiscovery(organizationName, options.context || {});
      }
      
      if (!results.profile) {
        throw new Error('No organization profile available');
      }
      
      // Step 2: Run pipeline stages in sequence
      const stages = ['competitors', 'media', 'regulatory', 'trends'];
      
      for (const stage of stages) {
        if (options.skipStages && options.skipStages.includes(stage)) {
          console.log(`⏭️ Skipping stage: ${stage}`);
          continue;
        }
        
        try {
          results.stages[stage] = await this.runStage(
            stage, 
            results.profile, 
            results.stages
          );
        } catch (error) {
          console.error(`Stage ${stage} failed:`, error);
          results.errors.push({ stage, error: error.message });
          
          if (!options.continueOnError) {
            throw error;
          }
        }
      }
      
      // Step 3: Run synthesis if we have any stage results
      if (Object.keys(results.stages).length > 0) {
        try {
          results.stages.synthesis = await this.runStage(
            'synthesis',
            results.profile,
            results.stages
          );
        } catch (error) {
          console.error('Synthesis failed:', error);
          results.errors.push({ stage: 'synthesis', error: error.message });
        }
      }
      
    } catch (error) {
      console.error('Pipeline failed:', error);
      results.errors.push({ stage: 'pipeline', error: error.message });
    }
    
    // Calculate duration
    results.metadata.endTime = Date.now();
    results.metadata.duration = results.metadata.endTime - results.metadata.startTime;
    
    console.log(`✅ Pipeline complete in ${results.metadata.duration}ms`);
    console.log(`📊 Stages completed: ${Object.keys(results.stages).length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    // Save complete results to localStorage
    saveToLocalStorage(`pipeline_${organizationName}`, results);
    
    return results;
  }

  /**
   * Get pipeline results from cache
   */
  getPipelineResults(organizationName) {
    return loadFromLocalStorage(`pipeline_${organizationName}`);
  }

  /**
   * Clear all cached data for an organization
   */
  clearCache(organizationName) {
    const keys = [
      `profile_${organizationName}`,
      `pipeline_${organizationName}`,
      'organizationProfile'
    ];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      localStorage.removeItem(`${key}_version`);
    });
    
    console.log(`🧹 Cache cleared for: ${organizationName}`);
  }

  /**
   * Validate pipeline readiness
   */
  async validatePipelineReadiness(organizationName) {
    const validation = {
      ready: false,
      hasProfile: false,
      profileValid: false,
      hasCompetitors: false,
      hasStakeholders: false,
      issues: []
    };
    
    try {
      const profile = await this.loadProfile(organizationName);
      
      if (profile) {
        validation.hasProfile = true;
        
        const structureValidation = validateDataStructure(profile, 'Pipeline Validation');
        validation.profileValid = structureValidation.valid;
        
        if (!structureValidation.valid) {
          validation.issues.push(...structureValidation.errors);
        }
        
        // Check for competitors
        const competitorCount = profile.competitors ? 
          (profile.competitors.direct?.length || 0) +
          (profile.competitors.indirect?.length || 0) +
          (profile.competitors.emerging?.length || 0) : 0;
        
        validation.hasCompetitors = competitorCount > 0;
        if (!validation.hasCompetitors) {
          validation.issues.push('No competitors defined');
        }
        
        // Check for stakeholders
        const stakeholderCount = profile.stakeholders ?
          Object.values(profile.stakeholders).flat().length : 0;
        
        validation.hasStakeholders = stakeholderCount > 0;
        if (!validation.hasStakeholders) {
          validation.issues.push('No stakeholders defined');
        }
      } else {
        validation.issues.push('No organization profile found');
      }
      
      validation.ready = validation.hasProfile && validation.profileValid;
      
    } catch (error) {
      validation.issues.push(`Validation error: ${error.message}`);
    }
    
    return validation;
  }
}

// Export singleton instance
const intelligencePipelineService = new IntelligencePipelineService();
export default intelligencePipelineService;