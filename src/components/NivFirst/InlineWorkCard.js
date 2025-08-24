import React, { useState } from 'react';
import { 
  Bot, Sparkles, TrendingUp, Users, FileText, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Zap, Target, Brain
} from 'lucide-react';

const InlineWorkCard = ({ type, data, onAddToWorkflow, onExpand }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState('generating'); // generating, ready, in-progress

  // Get styling based on work type
  const getTypeConfig = () => {
    const configs = {
      'media-list': {
        icon: Users,
        color: '#60a5fa',
        title: 'Media Target List',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
      },
      'content-draft': {
        icon: FileText,
        color: '#10b981',
        title: 'Content Draft',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      },
      'strategy-plan': {
        icon: TrendingUp,
        color: '#f59e0b',
        title: 'Strategic Plan',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      },
      'crisis-response': {
        icon: AlertTriangle,
        color: '#ef4444',
        title: 'Crisis Response',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      },
      'opportunity': {
        icon: Zap,
        color: '#8b5cf6',
        title: 'Opportunity Analysis',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      }
    };
    return configs[type] || configs['strategy-plan'];
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  // Simulate status change after mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${isHovered ? config.color + '44' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        transition: 'all 0.3s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onExpand}
    >
      {/* Progress indicator for generating state */}
      {status === 'generating' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '30%',
            height: '100%',
            background: config.gradient,
            animation: 'slide 1.5s infinite'
          }} />
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        {/* Icon Container */}
        <div style={{
          width: '36px',
          height: '36px',
          background: config.gradient,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={18} color="white" />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {data.title || config.title}
            </h4>
            {status === 'ready' && (
              <CheckCircle size={14} color="#10b981" />
            )}
            {status === 'generating' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '4px'
              }}>
                <Sparkles size={10} color="#60a5fa" />
                <span style={{ fontSize: '10px', color: '#60a5fa' }}>
                  Niv is working...
                </span>
              </div>
            )}
          </div>

          <p style={{
            margin: '4px 0',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: '1.4'
          }}>
            {data.description}
          </p>

          {/* Key Details */}
          {data.details && (
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              {Object.entries(data.details).slice(0, 3).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ color: '#9ca3af' }}>{key}:</span>
                  <span style={{ color: config.color, fontWeight: '500' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Section */}
          {status === 'ready' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWorkflow();
                }}
                style={{
                  padding: '6px 12px',
                  background: config.gradient,
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Zap size={12} />
                Add to Workflow
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${config.color}33`,
                  borderRadius: '4px',
                  color: config.color,
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${config.color}11`;
                  e.currentTarget.style.borderColor = `${config.color}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = `${config.color}33`;
                }}
              >
                Open Workspace
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default InlineWorkCard;