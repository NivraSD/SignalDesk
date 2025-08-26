/**
 * Hook for managing intelligence pipeline integration
 * Auto-starts pipeline after onboarding and provides status
 */

import { useState, useEffect } from 'react';
import { 
  isOnboardingComplete, 
  loadOnboardingProfile,
  startIntelligencePipeline 
} from '../utils/onboardingAdapter';
import intelligencePipelineService from '../services/intelligencePipelineService';

export const useIntelligencePipeline = () => {
  const [status, setStatus] = useState({
    isReady: false,
    isRunning: false,
    hasResults: false,
    profile: null,
    results: null,
    error: null
  });

  useEffect(() => {
    checkPipelineStatus();
  }, []);

  const checkPipelineStatus = async () => {
    try {
      // Check if onboarding is complete
      if (!isOnboardingComplete()) {
        setStatus(prev => ({
          ...prev,
          isReady: false,
          error: 'Onboarding not complete'
        }));
        return;
      }

      // Load the profile
      const profile = await loadOnboardingProfile();
      if (!profile) {
        setStatus(prev => ({
          ...prev,
          isReady: false,
          error: 'No organization profile found'
        }));
        return;
      }

      // Check if we have pipeline results
      const existingResults = intelligencePipelineService.getPipelineResults(
        profile.organization.name
      );

      setStatus({
        isReady: true,
        isRunning: false,
        hasResults: !!existingResults,
        profile: profile,
        results: existingResults,
        error: null
      });

      // Check if we just completed onboarding and should auto-start
      const justOnboarded = localStorage.getItem('signaldesk_just_onboarded') === 'true';
      if (justOnboarded && !existingResults) {
        localStorage.removeItem('signaldesk_just_onboarded');
        await runPipeline();
      }
    } catch (error) {
      console.error('Error checking pipeline status:', error);
      setStatus(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  const runPipeline = async () => {
    setStatus(prev => ({
      ...prev,
      isRunning: true,
      error: null
    }));

    try {
      const results = await startIntelligencePipeline();
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        hasResults: true,
        results: results,
        error: null
      }));

      return results;
    } catch (error) {
      console.error('Pipeline error:', error);
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error.message
      }));
      throw error;
    }
  };

  const clearResults = () => {
    if (status.profile?.organization?.name) {
      intelligencePipelineService.clearCache(status.profile.organization.name);
    }
    
    setStatus(prev => ({
      ...prev,
      hasResults: false,
      results: null
    }));
  };

  const refresh = async () => {
    await checkPipelineStatus();
  };

  return {
    ...status,
    runPipeline,
    clearResults,
    refresh
  };
};

export default useIntelligencePipeline;