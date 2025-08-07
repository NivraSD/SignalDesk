/**
 * Debug utility to trace data flow through the PR Intelligence system
 */

export const debugDataFlow = {
  // Log PR Strategy completion
  logStrategyComplete: (data) => {
    console.group('🎯 PR Strategy Complete');
    console.log('Company:', data.company);
    console.log('User Type:', data.userType);
    console.log('Objectives:', data.objectives);
    console.log('Stakeholder Groups:', data.stakeholderGroups?.length || 0);
    console.log('Raw Stakeholders:', data.stakeholders?.length || 0);
    
    if (data.stakeholderGroups) {
      console.log('First Stakeholder Group:', data.stakeholderGroups[0]);
    }
    
    console.groupEnd();
  },

  // Log source configuration
  logSourceConfiguration: (stakeholderStrategy) => {
    console.group('🔧 Source Configuration');
    console.log('Has Strategy:', !!stakeholderStrategy);
    console.log('Stakeholder Groups:', stakeholderStrategy?.stakeholderGroups?.length || 0);
    console.log('Company Profile:', stakeholderStrategy?.companyProfile);
    
    if (stakeholderStrategy?.stakeholderGroups?.[0]) {
      console.log('Sample Stakeholder:', {
        id: stakeholderStrategy.stakeholderGroups[0].id,
        name: stakeholderStrategy.stakeholderGroups[0].name,
        type: stakeholderStrategy.stakeholderGroups[0].type,
        topics: stakeholderStrategy.stakeholderGroups[0].topics
      });
    }
    
    console.groupEnd();
  },

  // Log opportunity discovery
  logOpportunityDiscovery: (client, unifiedState) => {
    console.group('💡 Opportunity Discovery');
    console.log('Client Prop:', client);
    console.log('Unified State:', {
      hasCompanyProfile: !!unifiedState.companyProfile,
      stakeholders: unifiedState.stakeholders?.length || 0,
      sources: unifiedState.sources?.length || 0,
      goals: unifiedState.goals?.length || 0
    });
    
    if (unifiedState.companyProfile) {
      console.log('Company Profile:', {
        company: unifiedState.companyProfile.company,
        userType: unifiedState.companyProfile.userType,
        industry: unifiedState.companyProfile.industry
      });
    }
    
    console.groupEnd();
  },

  // Log unified service state
  logUnifiedState: (state) => {
    console.group('🌐 Unified Service State');
    console.log('Initialized:', state.isInitialized);
    console.log('Company:', state.companyProfile?.company);
    console.log('User Type:', state.companyProfile?.userType);
    console.log('Goals:', state.goals?.map(g => g.id).join(', '));
    console.log('Stakeholders:', state.stakeholders?.map(s => s.name).join(', '));
    console.log('Sources Configured:', state.sources?.length || 0);
    console.groupEnd();
  }
};

export default debugDataFlow;