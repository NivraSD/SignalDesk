/**
 * Floating Niv Assistant - Platform-wide AI Assistant
 * Always accessible from anywhere in the application
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, X, Minimize2, Maximize2, 
  Brain, Sparkles, ChevronUp, ChevronDown 
} from 'lucide-react';
import AdaptiveNivAssistant from './AdaptiveNivAssistant';

const FloatingNivAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    const stored = localStorage.getItem('niv-floating-position');
    return stored ? JSON.parse(stored) : { x: 20, y: 20 };
  });
  const [size, setSize] = useState(() => {
    const stored = localStorage.getItem('niv-floating-size');
    return stored ? JSON.parse(stored) : { width: 400, height: 600 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasUnread, setHasUnread] = useState(false);

  // Save position and size to localStorage
  useEffect(() => {
    localStorage.setItem('niv-floating-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('niv-floating-size', JSON.stringify(size));
  }, [size]);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.niv-controls')) return; // Don't drag when clicking controls
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = Math.max(0, Math.min(window.innerWidth - (isMinimized ? 60 : size.width), e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - (isMinimized ? 60 : size.height), e.clientY - dragStart.y));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position, size, isMinimized]);

  // Handle content generation callback
  const handleContentGenerated = (content, type) => {
    // Could trigger notifications or other actions
    console.log('Content generated:', { content: content.substring(0, 100), type });
  };

  // Handle strategy generation callback
  const handleStrategyGenerated = (strategy) => {
    // Could trigger notifications or other actions
    console.log('Strategy generated:', strategy.substring(0, 100));
  };

  // Floating button (when closed)
  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          cursor: 'pointer',
          animation: 'pulse 2s infinite'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(139, 92, 246, 0.6)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
        }}
        >
          <Brain size={24} color="white" />
          <Sparkles 
            size={12} 
            color="#fbbf24" 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              animation: 'twinkle 1.5s ease-in-out infinite'
            }}
          />
          {hasUnread && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid white',
              animation: 'bounce 1s infinite'
            }} />
          )}
        </div>
        
        {/* Tooltip */}
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          opacity: '0',
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }}
        className="niv-tooltip"
        >
          Chat with Niv - Your AI PR Assistant
        </div>

        <style jsx>{`
          .floating-niv-button:hover .niv-tooltip {
            opacity: 1;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 1; transform: rotate(0deg); }
            50% { opacity: 0.5; transform: rotate(180deg); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '200px',
          height: '50px',
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'white'
          }}>
            <Brain size={16} color="#a78bfa" />
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Niv Assistant</span>
          </div>
          
          <div className="niv-controls" style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsMinimized(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a78bfa',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full assistant window
  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        resize: 'both',
        minWidth: '300px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Custom header */}
      <div
        style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: 'none',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'white'
        }}>
          <Brain size={18} color="#a78bfa" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            Niv - Your AI Assistant
          </span>
          <Sparkles size={12} color="#fbbf24" />
        </div>
        
        <div className="niv-controls" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a78bfa',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(139, 92, 246, 0.2)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            <Minimize2 size={14} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Assistant content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AdaptiveNivAssistant
          onContentGenerated={handleContentGenerated}
          onStrategyGenerated={handleStrategyGenerated}
          style={{
            height: '100%',
            background: 'transparent',
            borderRadius: '0'
          }}
        />
      </div>

      {/* Resize handle */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '20px',
        height: '20px',
        background: 'linear-gradient(-45deg, transparent 0%, transparent 40%, rgba(139, 92, 246, 0.3) 50%)',
        cursor: 'nw-resize',
        borderBottomRightRadius: '12px'
      }} />
    </div>
  );
};

export default FloatingNivAssistant;