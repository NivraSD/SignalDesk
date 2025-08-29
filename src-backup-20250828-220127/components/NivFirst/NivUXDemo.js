import React, { useState } from 'react';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import NivConversationPhases from './NivConversationPhases';
import NivMaterialCreationProgress from './NivMaterialCreationProgress';

// Demo component to showcase the new phase-aware UX
const NivUXDemo = () => {
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Demo scenarios
  const demoScenarios = [
    {
      title: "Initial Discovery Phase",
      description: "User starts conversation - Niv needs to gather information",
      phase: "discovery",
      phaseData: { exchangeCount: 0 },
      showCreation: false
    },
    {
      title: "Discovery in Progress",
      description: "First exchange complete - still gathering context",
      phase: "discovery", 
      phaseData: { exchangeCount: 1 },
      showCreation: false
    },
    {
      title: "Discovery Complete",
      description: "Sufficient context gathered - ready for strategic analysis",
      phase: "discovery",
      phaseData: { exchangeCount: 2 },
      showCreation: false
    },
    {
      title: "Strategic Counsel Phase",
      description: "Niv provides strategic recommendations",
      phase: "strategic-counsel",
      phaseData: { exchangeCount: 3 },
      showCreation: false
    },
    {
      title: "Ready for Creation",
      description: "User approves recommendations - ready to create materials",
      phase: "strategic-counsel",
      phaseData: { exchangeCount: 3, readyForCreation: true },
      showCreation: false
    },
    {
      title: "Material Creation Started",
      description: "Niv begins creating comprehensive PR package",
      phase: "material-creation",
      phaseData: { exchangeCount: 3, readyForCreation: true, isCreatingMaterials: true },
      showCreation: true,
      isCreating: true
    },
    {
      title: "Materials Created",
      description: "All materials complete and ready for editing",
      phase: "material-creation",
      phaseData: { 
        exchangeCount: 3, 
        readyForCreation: true, 
        materialsCreated: 6,
        createdMaterials: [
          { id: 1, type: 'press-release', title: 'Press Release Draft' },
          { id: 2, type: 'media-list', title: 'Strategic Media Plan' },
          { id: 3, type: 'strategy-plan', title: 'Communications Strategy' },
          { id: 4, type: 'messaging-framework', title: 'Messaging Framework' },
          { id: 5, type: 'social-content', title: 'Social Media Content' },
          { id: 6, type: 'faq-document', title: 'FAQ Document' }
        ]
      },
      showCreation: true,
      isCreating: false
    }
  ];

  const currentScenario = demoScenarios[demoStep];

  // Auto-play through scenarios
  const startAutoPlay = () => {
    setIsAutoPlaying(true);
    const interval = setInterval(() => {
      setDemoStep(prev => {
        if (prev >= demoScenarios.length - 1) {
          setIsAutoPlaying(false);
          clearInterval(interval);
          return 0;
        }
        return prev + 1;
      });
    }, 3000);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setIsAutoPlaying(false);
  };

  const nextStep = () => {
    setDemoStep(prev => (prev + 1) % demoScenarios.length);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#0a0a0f',
      color: '#e8e8e8',
      minHeight: '100vh'
    }}>
      {/* Demo Header */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#e8e8e8'
        }}>
          Niv UX Demo - Phase-Aware Conversation Interface
        </h1>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: '#9ca3af',
          lineHeight: 1.5
        }}>
          This demo showcases the new phase-aware UX that guides users through Niv's strategic consultation process.
          Watch how the interface adapts to each phase with visual indicators, contextual guidance, and material creation progress.
        </p>
        
        {/* Demo Controls */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={startAutoPlay}
            disabled={isAutoPlaying}
            style={{
              padding: '8px 16px',
              background: isAutoPlaying 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isAutoPlaying ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <Play size={14} />
            {isAutoPlaying ? 'Auto-Playing...' : 'Auto-Play Demo'}
          </button>
          
          <button
            onClick={nextStep}
            disabled={isAutoPlaying}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#e8e8e8',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isAutoPlaying ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <ChevronRight size={14} />
            Next Step
          </button>
          
          <button
            onClick={resetDemo}
            style={{
              padding: '8px 16px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          
          <div style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            Step {demoStep + 1} of {demoScenarios.length}
          </div>
        </div>
      </div>

      {/* Current Scenario Info */}
      <div style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: '0 0 4px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#e8e8e8'
        }}>
          {currentScenario.title}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#a78bfa',
          lineHeight: 1.4
        }}>
          {currentScenario.description}
        </p>
      </div>

      {/* Demo Content */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Phase Progress */}
        <NivConversationPhases
          currentPhase={currentScenario.phase}
          phaseData={currentScenario.phaseData}
        />

        {/* Material Creation Progress (when applicable) */}
        {currentScenario.showCreation && (
          <NivMaterialCreationProgress
            isCreating={currentScenario.isCreating}
            createdMaterials={currentScenario.phaseData.createdMaterials || []}
            onMaterialClick={(material) => {
              console.log('Demo: Material clicked:', material);
              alert(`Demo: Would open ${material.title} for editing`);
            }}
          />
        )}

        {/* Mock Chat Interface Preview */}
        <div style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px',
            fontStyle: 'italic'
          }}>
            Chat interface would appear here with phase-aware styling and guidance
          </div>
          
          <div style={{
            background: 'rgba(30, 30, 45, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#8b5cf6',
              marginBottom: '4px'
            }}>
              Niv • {currentScenario.phase.replace('-', ' ').toUpperCase()}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#e8e8e8'
            }}>
              {currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 0 && 
                "Hello! I'm Niv, your senior PR strategist. To provide the best strategic counsel, I need to understand your situation better. What's the main announcement or challenge you need PR support for?"}
              {currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 1 && 
                "Great start! I'd love to learn more about your timeline and target audiences. When do you need to announce this, and who are your key stakeholders?"}
              {currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 2 && 
                "Perfect! I now have enough context to develop strategic recommendations. Let me analyze your situation and provide some strategic counsel."}
              {currentScenario.phase === 'strategic-counsel' && !currentScenario.phaseData.readyForCreation && 
                "Based on our discussion, here are my strategic recommendations: [Strategic analysis and recommendations would appear here] What questions do you have about this approach?"}
              {currentScenario.phase === 'strategic-counsel' && currentScenario.phaseData.readyForCreation && 
                "Excellent! Based on your approval, I'm ready to create a comprehensive PR package with 6 essential materials. Would you like me to proceed with creating these materials?"}
              {currentScenario.phase === 'material-creation' && 
                "Perfect! I'll now create a comprehensive PR package with press release, media plan, strategy timeline, messaging framework, social content, and FAQ. This will take about 15-20 minutes."}
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            color: '#9ca3af',
            fontStyle: 'italic'
          }}>
            Input placeholder: {
              currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 0 && 
                "Tell Niv about your PR challenge - what do you need to announce or achieve?"
            }
            {currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 1 && 
                "Share more details about your timeline, audience, and goals..."
            }
            {currentScenario.phase === 'discovery' && currentScenario.phaseData.exchangeCount === 2 && 
                "Any additional context or specific requirements?"
            }
            {currentScenario.phase === 'strategic-counsel' && !currentScenario.phaseData.readyForCreation && 
                "Ask questions about Niv's strategic recommendations"
            }
            {currentScenario.phase === 'strategic-counsel' && currentScenario.phaseData.readyForCreation && 
                "Ask Niv to create your materials or request specific items"
            }
            {currentScenario.phase === 'material-creation' && 
                "Request specific materials or ask about the creation process"
            }
          </div>
        </div>
      </div>

      {/* Key Features Highlighted */}
      <div style={{
        marginTop: '24px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: '#6ee7b7'
        }}>
          Key UX Improvements Demonstrated:
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: '#10b981',
          lineHeight: 1.5
        }}>
          <li>Visual phase progression with Railway-inspired design</li>
          <li>Phase-specific guidance and input placeholders</li>
          <li>Material creation progress with real-time updates</li>
          <li>Clear transition points between consultation and creation</li>
          <li>Contextual helper text that adapts to current phase</li>
          <li>Professional consultation methodology enforcement</li>
        </ul>
      </div>
    </div>
  );
};

export default NivUXDemo;