import React from 'react';
import UnifiedOnboarding from './UnifiedOnboarding';

// SmartOnboarding now uses the comprehensive UnifiedOnboarding
// Collects all necessary configuration for both Intelligence Hub and Opportunity Engine
const SmartOnboarding = ({ onComplete }) => {
  return <UnifiedOnboarding onComplete={onComplete} />;
};

export default SmartOnboarding;