import React from 'react';
import MinimalOnboarding from './Onboarding/MinimalOnboarding';

// SmartOnboarding now uses the new MinimalOnboarding approach
// Only collects: Company name, website, goals, and priorities
// Everything else is automatically discovered by AI
const SmartOnboarding = ({ onComplete }) => {
  return <MinimalOnboarding onComplete={onComplete} />;
};

export default SmartOnboarding;