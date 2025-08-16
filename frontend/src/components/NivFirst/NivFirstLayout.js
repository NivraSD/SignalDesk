import React, { useState, useCallback } from 'react';
import { Bot, Briefcase, Users, TrendingUp, FileText, AlertTriangle, Brain, BarChart3 } from 'lucide-react';
import NivStrategicOrchestrator from '../NivStrategicOrchestrator';
import ActiveWorkflowsPanel from './ActiveWorkflowsPanel';
import StrategicCard from './StrategicCard';
import WorkspaceContainer from './WorkspaceContainer';
import InlineWorkCard from './InlineWorkCard';

const NivFirstLayout = ({ user, organization }) => {
  const [messages, setMessages] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [strategicCards, setStrategicCards] = useState([]);
  const [inlineWorkCards, setInlineWorkCards] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [nivContext, setNivContext] = useState({});

  // Handle when Niv creates a strategic card
  const handleStrategicCard = useCallback((card) => {
    setStrategicCards(prev => [...prev, {
      id: Date.now(),
      ...card,
      timestamp: new Date()
    }]);
  }, []);

  // Handle when Niv creates an inline work card
  const handleWorkCardCreate = useCallback((workCard) => {
    const newCard = {
      id: Date.now(),
      ...workCard,
      timestamp: new Date()
    };
    setInlineWorkCards(prev => [...prev, newCard]);
    
    // Also add to active workflows
    setActiveWorkflows(prev => [...prev, {
      id: `wf-${Date.now()}`,
      name: workCard.data.title,
      status: 'active',
      progress: 0,
      priority: 'normal',
      artifacts: [{
        type: workCard.type,
        name: workCard.data.title,
        count: 1,
        status: 'generating',
        workspace: getWorkspaceFromType(workCard.type)
      }],
      nivInsight: 'Niv is creating this for you',
      nextAction: 'Review and refine'
    }]);
  }, []);

  // Map work card types to workspace types
  const getWorkspaceFromType = (type) => {
    const mapping = {
      'media-list': 'media-intelligence',
      'content-draft': 'content-generator',
      'strategy-plan': 'strategic-planning',
      'crisis-response': 'crisis-command',
      'opportunity': 'opportunity-engine'
    };
    return mapping[type] || 'content-generator';
  };

  // Handle opening a workspace from a strategic card
  const handleOpenWorkspace = useCallback((workspace, context) => {
    setActiveWorkspace({
      type: workspace,
      context: context,
      nivAssistance: true
    });
  }, []);

  // Handle feature orchestration from Niv
  const handleFeatureOpen = useCallback((feature) => {
    // Create strategic card instead of opening full feature
    const cardConfig = getStrategicCardConfig(feature);
    handleStrategicCard(cardConfig);
  }, [handleStrategicCard]);

  // Get strategic card configuration for each feature
  const getStrategicCardConfig = (feature) => {
    const configs = {
      'media-intelligence': {
        title: 'Media Outreach Strategy',
        type: 'media',
        icon: Users,
        summary: {
          total_journalists: 47,
          tier_1_targets: 12,
          optimal_timing: 'Tuesday-Thursday, 9-11am',
          key_angles: ['Innovation', 'Market disruption', 'Customer value']
        },
        insights: [
          'Jennifer Chen at TechCrunch covered competitors last week',
          'Bloomberg seeking enterprise tech stories this quarter',
          'Avoid Fridays - 70% lower response rate'
        ],
        recommended_action: 'Focus on Tier 1 with exclusive angles',
        workspace: 'media-intelligence'
      },
      'content-generator': {
        title: 'Content Strategy Overview',
        type: 'content',
        icon: FileText,
        summary: {
          recommended_type: 'Executive Blog Post',
          angle: 'Thought leadership on industry transformation',
          length: '800-1000 words',
          key_messages: 3,
          seo_opportunity: 'High volume, low competition keywords identified'
        },
        insights: [
          'Similar content increased engagement by 45% last quarter',
          'Tuesday morning posts get 3x more shares',
          'Include data visualization for better retention'
        ],
        recommended_action: 'Create thought leadership piece',
        workspace: 'content-generator'
      },
      'strategic-planning': {
        title: 'Campaign Architecture',
        type: 'campaign',
        icon: TrendingUp,
        summary: {
          timeline: '6 weeks optimal',
          budget_required: '$75K',
          team_resources: '3 members',
          critical_path: 'Content → Media → Launch',
          success_probability: '78%'
        },
        insights: [
          'Competitor announcement likely in Week 3',
          'Media embargo strategy recommended',
          'Executive availability constraint in Week 5'
        ],
        recommended_action: 'Build detailed campaign plan',
        workspace: 'strategic-planning'
      },
      'opportunity-engine': {
        title: 'Opportunity Assessment',
        type: 'opportunity',
        icon: TrendingUp,
        summary: {
          type: 'Competitor Weakness',
          window: '24-48 hours',
          impact_score: 85,
          effort_required: '2 hours',
          risk_level: 'Low'
        },
        insights: [
          'Competitor facing criticism on social media',
          'Journalists actively seeking alternative perspectives',
          'Your CEO available for immediate comment'
        ],
        recommended_action: 'Execute rapid response strategy',
        workspace: 'opportunity-engine'
      },
      'crisis-command': {
        title: 'Crisis Response Status',
        type: 'crisis',
        icon: AlertTriangle,
        summary: {
          threat_level: 'Medium',
          response_time: '45 minutes elapsed',
          stakeholders_notified: '8/12',
          media_queries: 3,
          sentiment_trend: 'Stabilizing'
        },
        insights: [
          'Main narrative controlled successfully',
          'Two journalists need immediate response',
          'Employee communications draft ready'
        ],
        recommended_action: 'Approve and send holding statement',
        workspace: 'crisis-command'
      }
    };

    return configs[feature] || configs['strategic-planning'];
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Active Workflows Sidebar - Always Visible */}
      <ActiveWorkflowsPanel 
        workflows={activeWorkflows}
        onWorkflowClick={(workflow) => {
          // Open specific artifact in workspace
          if (workflow.selectedArtifact) {
            handleOpenWorkspace(workflow.selectedArtifact.workspace, {
              name: workflow.selectedArtifact.name,
              ...workflow.selectedArtifact
            });
          }
        }}
        style={{
          width: '280px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeWorkspace ? (
          // Workspace View with Niv Assistance
          <WorkspaceContainer
            workspace={activeWorkspace}
            nivContext={nivContext}
            onClose={() => setActiveWorkspace(null)}
            onNivRequest={(request) => {
              // Handle Niv assistance requests from workspace
              console.log('Niv assistance requested:', request);
            }}
          />
        ) : (
          // Niv Conversation View with Strategic Cards
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            padding: '20px'
          }}>
            {/* Niv Orchestrator - Primary Interface */}
            <div style={{ 
              flex: 1,
              marginBottom: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <NivStrategicOrchestrator
                messages={messages}
                setMessages={setMessages}
                onFeatureOpen={handleFeatureOpen}
                onWorkCardCreate={handleWorkCardCreate}
                onContentGenerate={(data) => {
                  handleFeatureOpen('content-generator');
                }}
                onStrategicPlanGenerate={(data) => {
                  handleFeatureOpen('strategic-planning');
                }}
              />
            </div>

            {/* Inline Work Cards Display */}
            {inlineWorkCards.length > 0 && (
              <div style={{
                marginTop: '20px'
              }}>
                {inlineWorkCards.map(card => (
                  <InlineWorkCard
                    key={card.id}
                    type={card.type}
                    data={card.data}
                    onAddToWorkflow={() => {
                      // Already added to workflows when created
                      console.log('Already in workflow:', card);
                    }}
                    onExpand={() => {
                      // Open workspace for this card
                      handleOpenWorkspace(getWorkspaceFromType(card.type), card.data);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Strategic Cards Display */}
            {strategicCards.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '16px',
                marginTop: '20px'
              }}>
                {strategicCards.map(card => (
                  <StrategicCard
                    key={card.id}
                    card={card}
                    onOpenWorkspace={() => handleOpenWorkspace(card.workspace, card)}
                    onExecuteWithNiv={() => {
                      // Execute inline with Niv
                      console.log('Executing with Niv:', card);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Niv Indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
        cursor: 'pointer',
        transition: 'transform 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onClick={() => setActiveWorkspace(null)}
      >
        <Bot size={28} color="white" />
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '16px',
          height: '16px',
          background: '#10b981',
          borderRadius: '50%',
          border: '2px solid #0a0a0a'
        }} />
      </div>
    </div>
  );
};

export default NivFirstLayout;