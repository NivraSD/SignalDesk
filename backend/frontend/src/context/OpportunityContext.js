import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Create the Opportunity Context
const OpportunityContext = createContext();

// Custom hook to use the Opportunity context
export const useOpportunity = () => {
  const context = useContext(OpportunityContext);
  if (!context) {
    throw new Error('useOpportunity must be used within an OpportunityProvider');
  }
  return context;
};

// Opportunity Provider Component
export const OpportunityProvider = ({ children }) => {
  // Core opportunity state
  const [opportunityData, setOpportunityData] = useState({
    // Organization info
    organizationId: null,
    organizationName: null,
    
    // Analysis data
    analysis: null,
    lastAnalysis: null,
    analysisFingerprint: null,
    
    // Opportunity concepts
    concepts: [],
    selectedConcept: null,
    
    // Execution plan
    executionPlan: null,
    
    // Intelligence data used for analysis
    competitors: [],
    topics: [],
    
    // Tracking state
    currentStep: 'analysis', // 'analysis' | 'concepts' | 'execution'
    isStale: false
  });

  // UI state
  const [uiState, setUiState] = useState({
    loading: false,
    analyzing: false,
    generatingConcepts: false,
    generatingPlan: false,
    error: null,
    showAnalysisModal: false
  });

  // Cache management
  const [cache, setCache] = useState({
    analyses: {}, // Keyed by organizationId
    concepts: {}, // Keyed by analysisId
    plans: {} // Keyed by conceptId
  });

  // Update opportunity data
  const updateOpportunityData = useCallback((updates) => {
    setOpportunityData(prev => ({
      ...prev,
      ...updates,
      lastAnalysis: updates.analysis ? new Date().toISOString() : prev.lastAnalysis
    }));
  }, []);

  // Update UI state
  const updateUIState = useCallback((updates) => {
    setUiState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Clear all opportunity data
  const clearOpportunityData = useCallback(() => {
    setOpportunityData({
      organizationId: null,
      organizationName: null,
      analysis: null,
      lastAnalysis: null,
      analysisFingerprint: null,
      concepts: [],
      selectedConcept: null,
      executionPlan: null,
      competitors: [],
      topics: [],
      currentStep: 'analysis',
      isStale: false
    });
    setUiState({
      loading: false,
      analyzing: false,
      generatingConcepts: false,
      generatingPlan: false,
      error: null,
      showAnalysisModal: false
    });
  }, []);

  // Set organization context
  const setOrganization = useCallback((orgId, orgName) => {
    if (orgId !== opportunityData.organizationId) {
      // Clear data when organization changes
      clearOpportunityData();
      setOpportunityData(prev => ({
        ...prev,
        organizationId: orgId,
        organizationName: orgName
      }));
    }
  }, [opportunityData.organizationId, clearOpportunityData]);

  // Set analysis results
  const setAnalysis = useCallback((analysis, competitors = [], topics = []) => {
    const fingerprint = JSON.stringify({ 
      competitors: competitors.map(c => c.id), 
      topics: topics.map(t => t.id) 
    });
    
    setOpportunityData(prev => ({
      ...prev,
      analysis,
      lastAnalysis: new Date().toISOString(),
      analysisFingerprint: fingerprint,
      competitors,
      topics,
      currentStep: 'analysis',
      isStale: false
    }));
    
    // Cache the analysis
    if (opportunityData.organizationId) {
      setCache(prev => ({
        ...prev,
        analyses: {
          ...prev.analyses,
          [opportunityData.organizationId]: {
            analysis,
            timestamp: new Date().toISOString(),
            fingerprint
          }
        }
      }));
    }
  }, [opportunityData.organizationId]);

  // Set opportunity concepts
  const setConcepts = useCallback((concepts) => {
    setOpportunityData(prev => ({
      ...prev,
      concepts,
      currentStep: concepts.length > 0 ? 'concepts' : prev.currentStep
    }));
    
    // Cache concepts
    if (opportunityData.analysis) {
      const analysisId = `${opportunityData.organizationId}_${opportunityData.lastAnalysis}`;
      setCache(prev => ({
        ...prev,
        concepts: {
          ...prev.concepts,
          [analysisId]: {
            concepts,
            timestamp: new Date().toISOString()
          }
        }
      }));
    }
  }, [opportunityData.organizationId, opportunityData.analysis, opportunityData.lastAnalysis]);

  // Select a concept
  const selectConcept = useCallback((concept) => {
    setOpportunityData(prev => ({
      ...prev,
      selectedConcept: concept,
      currentStep: 'execution'
    }));
  }, []);

  // Set execution plan
  const setExecutionPlan = useCallback((plan) => {
    setOpportunityData(prev => ({
      ...prev,
      executionPlan: plan,
      currentStep: 'execution'
    }));
    
    // Cache the plan
    if (opportunityData.selectedConcept) {
      const conceptId = opportunityData.selectedConcept.id || 
                       `${opportunityData.organizationId}_${opportunityData.selectedConcept.name}`;
      setCache(prev => ({
        ...prev,
        plans: {
          ...prev.plans,
          [conceptId]: {
            plan,
            timestamp: new Date().toISOString()
          }
        }
      }));
    }
  }, [opportunityData.organizationId, opportunityData.selectedConcept]);

  // Check if targets have changed
  const checkTargetsChanged = useCallback((newCompetitors, newTopics) => {
    const currentFingerprint = opportunityData.analysisFingerprint;
    const newFingerprint = JSON.stringify({
      competitors: newCompetitors.map(c => c.id),
      topics: newTopics.map(t => t.id)
    });
    
    if (currentFingerprint && currentFingerprint !== newFingerprint) {
      setOpportunityData(prev => ({
        ...prev,
        isStale: true
      }));
      return true;
    }
    return false;
  }, [opportunityData.analysisFingerprint]);

  // Get cached analysis
  const getCachedAnalysis = useCallback((orgId) => {
    return cache.analyses[orgId] || null;
  }, [cache.analyses]);

  // Get cached concepts
  const getCachedConcepts = useCallback((analysisId) => {
    return cache.concepts[analysisId] || null;
  }, [cache.concepts]);

  // Get cached plan
  const getCachedPlan = useCallback((conceptId) => {
    return cache.plans[conceptId] || null;
  }, [cache.plans]);

  // Clear cache for organization
  const clearCache = useCallback((orgId = null) => {
    if (orgId) {
      setCache(prev => ({
        analyses: { ...prev.analyses, [orgId]: undefined },
        concepts: Object.keys(prev.concepts).reduce((acc, key) => {
          if (!key.startsWith(orgId)) acc[key] = prev.concepts[key];
          return acc;
        }, {}),
        plans: Object.keys(prev.plans).reduce((acc, key) => {
          if (!key.startsWith(orgId)) acc[key] = prev.plans[key];
          return acc;
        }, {})
      }));
    } else {
      // Clear all cache
      setCache({
        analyses: {},
        concepts: {},
        plans: {}
      });
    }
  }, []);

  // Check if data is stale (older than 1 hour)
  const isDataStale = useCallback((timestamp) => {
    if (!timestamp) return true;
    const age = Date.now() - new Date(timestamp).getTime();
    return age > 3600000; // 1 hour
  }, []);

  // Navigation helpers
  const goToAnalysis = useCallback(() => {
    setOpportunityData(prev => ({
      ...prev,
      currentStep: 'analysis',
      selectedConcept: null,
      executionPlan: null
    }));
  }, []);

  const goToConcepts = useCallback(() => {
    if (opportunityData.analysis) {
      setOpportunityData(prev => ({
        ...prev,
        currentStep: 'concepts',
        selectedConcept: null,
        executionPlan: null
      }));
    }
  }, [opportunityData.analysis]);

  const goToExecution = useCallback(() => {
    if (opportunityData.selectedConcept) {
      setOpportunityData(prev => ({
        ...prev,
        currentStep: 'execution'
      }));
    }
  }, [opportunityData.selectedConcept]);

  // Effect to check for stale data
  useEffect(() => {
    if (opportunityData.lastAnalysis && isDataStale(opportunityData.lastAnalysis)) {
      setOpportunityData(prev => ({
        ...prev,
        isStale: true
      }));
    }
  }, [opportunityData.lastAnalysis, isDataStale]);

  // Context value
  const value = {
    // State
    opportunityData,
    uiState,
    cache,
    
    // Core functions
    updateOpportunityData,
    updateUIState,
    clearOpportunityData,
    setOrganization,
    setAnalysis,
    setConcepts,
    selectConcept,
    setExecutionPlan,
    
    // Cache functions
    getCachedAnalysis,
    getCachedConcepts,
    getCachedPlan,
    clearCache,
    
    // Utility functions
    checkTargetsChanged,
    isDataStale,
    
    // Navigation
    goToAnalysis,
    goToConcepts,
    goToExecution
  };

  return (
    <OpportunityContext.Provider value={value}>
      {children}
    </OpportunityContext.Provider>
  );
};

export default OpportunityContext;