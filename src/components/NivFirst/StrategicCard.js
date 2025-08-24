import React, { useState } from 'react';
import { ChevronRight, Sparkles, Clock, Target, TrendingUp } from 'lucide-react';

const StrategicCard = ({ card, onOpenWorkspace, onExecuteWithNiv }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = card.icon || TrendingUp;
  
  return (
    <div 
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.3s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        ...(isHovered && {
          borderColor: 'rgba(59, 130, 246, 0.4)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
        })
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <Icon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: '4px'
          }}>
            {card.title}
          </h3>
          <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={12} />
            Just now
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        {Object.entries(card.summary || {}).slice(0, 3).map(([key, value]) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '13px'
          }}>
            <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>
              {key.replace(/_/g, ' ')}:
            </span>
            <span style={{ 
              color: '#60a5fa', 
              fontWeight: '500',
              textAlign: 'right'
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#60a5fa',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Key Insights
        </div>
        {(card.insights || []).map((insight, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '6px',
            fontSize: '13px',
            color: '#e5e7eb'
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              background: '#3b82f6',
              borderRadius: '50%',
              marginTop: '6px',
              marginRight: '8px',
              flexShrink: 0
            }} />
            <span style={{ lineHeight: '1.4' }}>{insight}</span>
          </div>
        ))}
      </div>

      {/* Recommended Action */}
      <div style={{
        padding: '12px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#10b981'
        }}>
          <Target size={14} />
          <span style={{ fontWeight: '500' }}>
            Recommended: {card.recommended_action}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExecuteWithNiv();
          }}
          style={{
            flex: 1,
            padding: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Sparkles size={14} />
          Execute with Niv
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenWorkspace();
          }}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#9ca3af',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          Workspace
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Hover Gradient Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s'
      }} />
    </div>
  );
};

export default StrategicCard;