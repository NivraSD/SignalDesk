import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context for global intelligence state
const IntelligenceContext = createContext();

// Cache expiration time (in milliseconds) - 5 minutes default
const CACHE_EXPIRATION = 5 * 60 * 1000;

export const IntelligenceProvider = ({ children }) => {
  // Intelligence state
  const [intelligenceData, setIntelligenceData] = useState({
    unified: null,
    competitors: {},
    topics: {},
    lastFetch: null
  });

  // Organization state
  const [organizationData, setOrganizationData] = useState({
    id: null,
    name: null,
    targets: [],
    strategy: null
  });

  // Opportunity state
  const [opportunityData, setOpportunityData] = useState({
    analysis: null,
    concepts: [],
    selectedConcept: null,
    executionPlan: null,
    lastAnalysis: null
  });

  // Source configuration state
  const [sourceData, setSourceData] = useState({
    sources: [],
    validated: false,
    lastUpdate: null
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    intelligence: false,
    opportunities: false,
    sources: false
  });

  // Check if data is stale
  const isDataStale = (lastFetch) => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_EXPIRATION;
  };

  // Update intelligence data
  const updateIntelligenceData = (data) => {
    setIntelligenceData({
      ...data,
      lastFetch: Date.now()
    });
  };

  // Update organization data
  const updateOrganizationData = (data) => {
    // Check if targets have changed
    if (data.targets && organizationData.targets) {
      const prevTargetIds = organizationData.targets.map(t => t.id).sort().join(',');
      const newTargetIds = data.targets.map(t => t.id).sort().join(',');
      
      if (prevTargetIds !== newTargetIds) {
        console.log('Organization targets changed, clearing opportunity data');
        // Clear opportunity data when targets change
        setOpportunityData({
          analysis: null,
          concepts: [],
          selectedConcept: null,
          executionPlan: null,
          lastAnalysis: null
        });
      }
    }
    
    setOrganizationData(prev => ({
      ...prev,
      ...data
    }));
  };

  // Update opportunity data
  const updateOpportunityData = (data) => {
    setOpportunityData(prev => ({
      ...prev,
      ...data,
      lastAnalysis: data.analysis ? Date.now() : prev.lastAnalysis
    }));
  };

  // Update source data
  const updateSourceData = (data) => {
    setSourceData({
      ...data,
      lastUpdate: Date.now()
    });
  };

  // Clear specific data type
  const clearData = (dataType) => {
    switch(dataType) {
      case 'intelligence':
        setIntelligenceData({
          unified: null,
          competitors: {},
          topics: {},
          lastFetch: null
        });
        break;
      case 'opportunities':
        setOpportunityData({
          analysis: null,
          concepts: [],
          selectedConcept: null,
          executionPlan: null,
          lastAnalysis: null
        });
        break;
      case 'sources':
        setSourceData({
          sources: [],
          validated: false,
          lastUpdate: null
        });
        break;
      case 'all':
        // Clear all data
        setIntelligenceData({
          unified: null,
          competitors: {},
          topics: {},
          lastFetch: null
        });
        setOpportunityData({
          analysis: null,
          concepts: [],
          selectedConcept: null,
          executionPlan: null,
          lastAnalysis: null
        });
        setSourceData({
          sources: [],
          validated: false,
          lastUpdate: null
        });
        break;
      default:
        break;
    }
  };

  // Manual refresh function
  const refreshData = (dataType) => {
    clearData(dataType);
    // Component will re-fetch when it detects null data
  };

  // Persist to localStorage
  useEffect(() => {
    const state = {
      intelligence: intelligenceData,
      organization: organizationData,
      opportunity: opportunityData,
      source: sourceData
    };
    localStorage.setItem('signaldesk_state', JSON.stringify(state));
  }, [intelligenceData, organizationData, opportunityData, sourceData]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('signaldesk_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        
        // Only restore if data is not too old (24 hours)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (parsed.intelligence?.lastFetch > dayAgo) {
          setIntelligenceData(parsed.intelligence);
        }
        
        if (parsed.organization) {
          setOrganizationData(parsed.organization);
        }
        
        if (parsed.opportunity?.lastAnalysis > dayAgo) {
          setOpportunityData(parsed.opportunity);
        }
        
        if (parsed.source?.lastUpdate > dayAgo) {
          setSourceData(parsed.source);
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  const value = {
    // Data
    intelligenceData,
    organizationData,
    opportunityData,
    sourceData,
    loadingStates,
    
    // Update functions
    updateIntelligenceData,
    updateOrganizationData,
    updateOpportunityData,
    updateSourceData,
    setLoadingStates,
    
    // Utility functions
    isDataStale,
    clearData,
    refreshData
  };

  return (
    <IntelligenceContext.Provider value={value}>
      {children}
    </IntelligenceContext.Provider>
  );
};

// Custom hook to use the context
export const useIntelligence = () => {
  const context = useContext(IntelligenceContext);
  if (!context) {
    throw new Error('useIntelligence must be used within IntelligenceProvider');
  }
  return context;
};