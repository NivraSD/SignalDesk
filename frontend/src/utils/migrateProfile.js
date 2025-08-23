// Migration utility to convert existing onboarding data to unified profile
export const migrateToUnifiedProfile = () => {
  // Check if unified profile already exists
  if (localStorage.getItem('signaldesk_unified_profile')) {
    console.log('✅ Unified profile already exists, skipping migration');
    return false;
  }

  // Check for existing onboarding data
  const legacyOnboarding = localStorage.getItem('signaldesk_onboarding');
  const opportunityProfile = localStorage.getItem('opportunity_profile');
  const organizationData = localStorage.getItem('signaldesk_organization');

  if (!legacyOnboarding && !opportunityProfile && !organizationData) {
    console.log('ℹ️ No existing data to migrate');
    return false;
  }

  console.log('🔄 Starting migration to unified profile...');

  // Initialize unified profile structure
  const unifiedProfile = {
    // Organization Basics (from legacy onboarding)
    organization: {
      name: '',
      industry: '',
      website: '',
      description: ''
    },
    
    // Competitors (from legacy onboarding)
    competitors: [],
    
    // Topics to Monitor (from legacy onboarding)
    monitoring_topics: [],
    
    // Brand & Voice (from opportunity profile or defaults)
    brand: {
      voice: 'professional',
      risk_tolerance: 'moderate',
      response_speed: 'considered'
    },
    
    // Key Messages (from opportunity profile or empty)
    messaging: {
      core_value_props: [],
      proof_points: [],
      competitive_advantages: [],
      key_narratives: []
    },
    
    // Media Strategy (from opportunity profile or empty)
    media: {
      preferred_tiers: [],
      journalist_relationships: [],
      no_comment_topics: [],
      exclusive_partners: []
    },
    
    // Spokespeople (from opportunity profile or empty)
    spokespeople: [],
    
    // Opportunity Preferences (from opportunity profile or defaults)
    opportunities: {
      types: {
        competitor_weakness: true,
        narrative_vacuum: true,
        cascade_effect: true,
        crisis_prevention: true,
        alliance_opening: false
      },
      minimum_confidence: 70,
      auto_execute_threshold: 95
    },
    
    // Migration metadata
    migrated_at: new Date().toISOString(),
    version: '2.0',
    migrated_from: []
  };

  // Migrate legacy onboarding data
  if (legacyOnboarding) {
    try {
      const legacy = JSON.parse(legacyOnboarding);
      unifiedProfile.migrated_from.push('signaldesk_onboarding');
      
      if (legacy.organization) {
        unifiedProfile.organization = {
          ...unifiedProfile.organization,
          ...legacy.organization
        };
      }
      
      if (legacy.competitors) {
        unifiedProfile.competitors = legacy.competitors.map(comp => {
          if (typeof comp === 'string') {
            return { name: comp, advantage: '' };
          }
          return comp;
        });
      }
      
      if (legacy.monitoring_topics) {
        unifiedProfile.monitoring_topics = legacy.monitoring_topics;
      }
      
      console.log('✅ Migrated legacy onboarding data');
    } catch (error) {
      console.error('⚠️ Error migrating legacy onboarding:', error);
    }
  }

  // Migrate opportunity profile data
  if (opportunityProfile) {
    try {
      const oppProfile = JSON.parse(opportunityProfile);
      unifiedProfile.migrated_from.push('opportunity_profile');
      
      // Brand settings
      if (oppProfile.voice) unifiedProfile.brand.voice = oppProfile.voice;
      if (oppProfile.risk_tolerance) unifiedProfile.brand.risk_tolerance = oppProfile.risk_tolerance;
      if (oppProfile.response_speed) unifiedProfile.brand.response_speed = oppProfile.response_speed;
      
      // Messaging
      if (oppProfile.core_value_props) unifiedProfile.messaging.core_value_props = oppProfile.core_value_props;
      if (oppProfile.proof_points) unifiedProfile.messaging.proof_points = oppProfile.proof_points;
      if (oppProfile.competitive_advantages) unifiedProfile.messaging.competitive_advantages = oppProfile.competitive_advantages;
      if (oppProfile.key_narratives) unifiedProfile.messaging.key_narratives = oppProfile.key_narratives;
      
      // Media
      if (oppProfile.preferred_tiers) unifiedProfile.media.preferred_tiers = oppProfile.preferred_tiers;
      if (oppProfile.journalist_relationships) unifiedProfile.media.journalist_relationships = oppProfile.journalist_relationships;
      if (oppProfile.no_comment_topics) unifiedProfile.media.no_comment_topics = oppProfile.no_comment_topics;
      if (oppProfile.exclusive_partners) unifiedProfile.media.exclusive_partners = oppProfile.exclusive_partners;
      
      // Spokespeople
      if (oppProfile.spokespeople) unifiedProfile.spokespeople = oppProfile.spokespeople;
      
      // Opportunity types
      if (oppProfile.opportunity_types) unifiedProfile.opportunities.types = oppProfile.opportunity_types;
      if (oppProfile.minimum_confidence) unifiedProfile.opportunities.minimum_confidence = oppProfile.minimum_confidence;
      if (oppProfile.auto_execute_threshold) unifiedProfile.opportunities.auto_execute_threshold = oppProfile.auto_execute_threshold;
      
      // If competitors exist in opportunity profile but not in legacy, use them
      if (oppProfile.competitors && unifiedProfile.competitors.length === 0) {
        unifiedProfile.competitors = oppProfile.competitors.map(comp => {
          if (typeof comp === 'string') {
            return { name: comp, advantage: '' };
          }
          return comp;
        });
      }
      
      console.log('✅ Migrated opportunity profile data');
    } catch (error) {
      console.error('⚠️ Error migrating opportunity profile:', error);
    }
  }

  // Migrate standalone organization data if nothing else provided it
  if (organizationData && !unifiedProfile.organization.name) {
    try {
      const org = JSON.parse(organizationData);
      unifiedProfile.migrated_from.push('signaldesk_organization');
      
      unifiedProfile.organization = {
        ...unifiedProfile.organization,
        ...org
      };
      
      console.log('✅ Migrated organization data');
    } catch (error) {
      console.error('⚠️ Error migrating organization data:', error);
    }
  }

  // Save the unified profile
  localStorage.setItem('signaldesk_unified_profile', JSON.stringify(unifiedProfile));
  
  // Also update backward compatibility storage
  localStorage.setItem('signaldesk_organization', JSON.stringify(unifiedProfile.organization));
  localStorage.setItem('opportunity_profile', JSON.stringify({
    ...unifiedProfile.brand,
    ...unifiedProfile.messaging,
    ...unifiedProfile.media,
    spokespeople: unifiedProfile.spokespeople,
    opportunity_types: unifiedProfile.opportunities.types,
    minimum_confidence: unifiedProfile.opportunities.minimum_confidence,
    auto_execute_threshold: unifiedProfile.opportunities.auto_execute_threshold,
    competitors: unifiedProfile.competitors
  }));
  
  // Update legacy onboarding with new structure
  localStorage.setItem('signaldesk_onboarding', JSON.stringify({
    organization: unifiedProfile.organization,
    competitors: unifiedProfile.competitors,
    monitoring_topics: unifiedProfile.monitoring_topics
  }));

  console.log('✅ Migration complete! Unified profile created:', unifiedProfile);
  return true;
};

// Auto-run migration on module load
if (typeof window !== 'undefined') {
  try {
    const migrated = migrateToUnifiedProfile();
    if (migrated) {
      console.log('🎉 Profile migration successful');
    }
  } catch (error) {
    console.error('❌ Profile migration failed:', error);
  }
}