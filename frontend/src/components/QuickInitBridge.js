import React, { useState } from 'react';
import QuickInit from './QuickInit';
import MultiStageIntelligence from './MultiStageIntelligence';

/**
 * QuickInitBridge - Connects QuickInit to MultiStageIntelligence
 * Ensures company name flows properly through the entire pipeline
 */
const QuickInitBridge = () => {
  const [initialized, setInitialized] = useState(false);
  const [organization, setOrganization] = useState(null);

  const handleInitComplete = (data) => {
    console.log('✅ QuickInit completed, starting MultiStageIntelligence');
    console.log('Organization:', data.organization);
    console.log('Request ID:', data.request_id);
    
    // Set the organization for MultiStageIntelligence
    setOrganization(data.organization);
    setInitialized(true);
  };

  const handleAnalysisComplete = (results) => {
    console.log('✅ Multi-stage analysis complete:', results);
    
    // You can navigate to dashboard or show results here
    alert(`Analysis complete for ${organization.name}! Check console for details.`);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      padding: '20px'
    }}>
      {!initialized ? (
        <QuickInit onComplete={handleInitComplete} />
      ) : (
        <div>
          <div style={{ 
            textAlign: 'center',
            color: 'white',
            marginBottom: '20px'
          }}>
            <h2>Running Intelligence Analysis for: {organization.name}</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              This will take 2-3 minutes for comprehensive analysis
            </p>
          </div>
          <MultiStageIntelligence 
            organization={organization}
            onComplete={handleAnalysisComplete}
          />
        </div>
      )}
    </div>
  );
};

export default QuickInitBridge;