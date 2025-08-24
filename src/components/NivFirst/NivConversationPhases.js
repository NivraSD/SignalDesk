import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  Lightbulb, 
  Package, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  Target,
  AlertCircle
} from 'lucide-react';

// Railway-inspired phase indicator component
const NivConversationPhases = ({ 
  currentPhase = 'discovery',
  phaseProgress = 0,
  phaseData = {},
  onPhaseComplete,
  className = ''
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  // Phase definitions with Railway-inspired styling
  const phases = [
    {
      id: 'discovery',
      title: 'Discovery',
      subtitle: 'Understanding your needs',
      icon: MessageCircle,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      description: 'Niv is gathering strategic information about your situation',
      requiredExchanges: 2,
      status: 'active'
    },
    {
      id: 'strategic-counsel',
      title: 'Strategic Counsel',
      subtitle: 'Analyzing & recommending',
      icon: Lightbulb,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      description: 'Niv is synthesizing insights and developing recommendations',
      status: 'pending'
    },
    {
      id: 'material-creation',
      title: 'Material Creation',
      subtitle: 'Building your PR assets',
      icon: Package,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      description: 'Niv is creating comprehensive PR materials for your campaign',
      status: 'pending'
    }
  ];

  // Update phase status based on current phase
  const phasesWithStatus = phases.map((phase, index) => {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    if (index < currentIndex) {
      return { ...phase, status: 'completed' };
    } else if (index === currentIndex) {
      return { ...phase, status: 'active' };
    } else {
      return { ...phase, status: 'pending' };
    }
  });

  // Trigger animation when phase changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentPhase]);

  // Get current phase data
  const getCurrentPhaseInfo = () => {
    const current = phasesWithStatus.find(p => p.status === 'active');
    if (!current) return null;

    let additionalInfo = '';
    let progressIndicator = null;

    switch (current.id) {
      case 'discovery':
        const exchangeCount = phaseData.exchangeCount || 0;
        const remaining = Math.max(0, current.requiredExchanges - exchangeCount);
        additionalInfo = remaining > 0 
          ? `${remaining} more exchange${remaining !== 1 ? 's' : ''} needed for thorough discovery`
          : 'Ready to move to strategic analysis';
        progressIndicator = (
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px'
          }}>
            {Array.from({ length: current.requiredExchanges }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '20px',
                  height: '4px',
                  background: i < exchangeCount ? current.color : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '2px',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
        );
        break;
      case 'strategic-counsel':
        additionalInfo = 'Niv is analyzing your needs and developing strategic recommendations';
        break;
      case 'material-creation':
        const materialsCreated = phaseData.materialsCreated || 0;
        const totalMaterials = phaseData.totalMaterials || 6;
        additionalInfo = materialsCreated > 0 
          ? `Creating ${totalMaterials} materials (${materialsCreated} completed)`
          : 'Preparing comprehensive PR materials package';
        break;
    }

    return { ...current, additionalInfo, progressIndicator };
  };

  const currentPhaseInfo = getCurrentPhaseInfo();

  return (
    <div className={`niv-conversation-phases ${className}`}>
      {/* Phase Progress Railway */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        {/* Railway Track Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <MapPin size={20} color="#3b82f6" />
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#e8e8e8'
            }}>
              Strategic Consultation Journey
            </h3>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Niv's proven 3-phase approach for effective PR strategy
            </p>
          </div>
        </div>

        {/* Railway Track */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          {/* Track Line */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '30px',
            right: '30px',
            height: '2px',
            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%)',
            opacity: 0.3,
            zIndex: 1
          }} />

          {/* Phase Stations */}
          {phasesWithStatus.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = phase.status === 'active';
            const isCompleted = phase.status === 'completed';
            
            return (
              <div
                key={phase.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  animation: isActive ? `pulse 2s infinite` : 'none'
                }}
              >
                {/* Station Node */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isActive || isCompleted
                    ? `linear-gradient(135deg, ${phase.color}, ${phase.color}dd)`
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${isActive || isCompleted ? phase.color : 'rgba(255, 255, 255, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  {isCompleted ? (
                    <CheckCircle size={24} color="white" />
                  ) : (
                    <Icon size={24} color={isActive || isCompleted ? 'white' : '#6b7280'} />
                  )}
                  
                  {/* Active Pulse Effect */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: phase.color,
                      opacity: 0.3,
                      animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                  )}
                </div>

                {/* Station Info */}
                <div style={{
                  textAlign: 'center',
                  maxWidth: '120px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isActive || isCompleted ? '#e8e8e8' : '#9ca3af',
                    marginBottom: '4px'
                  }}>
                    {phase.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    lineHeight: 1.3
                  }}>
                    {phase.subtitle}
                  </div>
                </div>

                {/* Connection Arrow */}
                {index < phasesWithStatus.length - 1 && (
                  <ArrowRight
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '-50px',
                      top: '20px',
                      color: index < phasesWithStatus.findIndex(p => p.status === 'active') 
                        ? '#3b82f6' 
                        : 'rgba(255, 255, 255, 0.3)',
                      zIndex: 3
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Phase Details */}
        {currentPhaseInfo && (
          <div
            key={animationKey}
            style={{
              background: currentPhaseInfo.bgColor,
              border: `1px solid ${currentPhaseInfo.borderColor}`,
              borderRadius: '8px',
              padding: '16px',
              animation: 'slideInUp 0.5s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: currentPhaseInfo.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <currentPhaseInfo.icon size={18} color="white" />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#e8e8e8'
                  }}>
                    {currentPhaseInfo.title} Phase
                  </h4>
                  <Sparkles size={14} color={currentPhaseInfo.color} />
                </div>
                
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#d1d5db',
                  lineHeight: 1.4,
                  marginBottom: '8px'
                }}>
                  {currentPhaseInfo.description}
                </p>
                
                {currentPhaseInfo.additionalInfo && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: currentPhaseInfo.color,
                    marginBottom: '8px'
                  }}>
                    <Clock size={12} />
                    {currentPhaseInfo.additionalInfo}
                  </div>
                )}
                
                {currentPhaseInfo.progressIndicator}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase Transition Guidance */}
      {currentPhase === 'discovery' && phaseData.exchangeCount >= 2 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          animation: 'slideInUp 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#a78bfa'
          }}>
            <Lightbulb size={14} />
            <span>Ready for strategic analysis - Niv will synthesize your inputs next</span>
          </div>
        </div>
      )}

      {currentPhase === 'strategic-counsel' && phaseData.readyForCreation && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
          animation: 'slideInUp 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#6ee7b7'
          }}>
            <Package size={14} />
            <span>Strategic plan complete - Ready to create your PR materials</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NivConversationPhases;