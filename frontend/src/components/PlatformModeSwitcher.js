import React from 'react';
import { Sparkles, Grid, ChevronRight } from 'lucide-react';

const PlatformModeSwitcher = ({ currentMode, onModeChange }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '20px',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '12px',
      padding: '8px',
      display: 'flex',
      gap: '4px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      <button
        onClick={() => onModeChange('classic')}
        style={{
          padding: '8px 16px',
          background: currentMode === 'classic' 
            ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
            : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: currentMode === 'classic' ? 'white' : '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (currentMode !== 'classic') {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.color = '#60a5fa';
          }
        }}
        onMouseLeave={(e) => {
          if (currentMode !== 'classic') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
      >
        <Grid size={16} />
        Classic View
      </button>

      <button
        onClick={() => onModeChange('niv-first')}
        style={{
          padding: '8px 16px',
          background: currentMode === 'niv-first' 
            ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
            : 'transparent',
          border: 'none',
          borderRadius: '8px',
          color: currentMode === 'niv-first' ? 'white' : '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (currentMode !== 'niv-first') {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.color = '#60a5fa';
          }
        }}
        onMouseLeave={(e) => {
          if (currentMode !== 'niv-first') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
      >
        <Sparkles size={16} />
        Niv-First
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#10b981',
          color: 'white',
          fontSize: '9px',
          padding: '2px 4px',
          borderRadius: '4px',
          fontWeight: '600'
        }}>
          NEW
        </span>
      </button>

      {/* Mode Description Tooltip */}
      <div style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        width: '280px',
        fontSize: '12px',
        color: '#9ca3af',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        ...(currentMode === 'niv-first' && {
          opacity: 1,
          pointerEvents: 'auto'
        })
      }}>
        <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: '600' }}>
          🚀 Niv-First Mode Active
        </div>
        <div style={{ lineHeight: '1.4' }}>
          Experience the new conversational workflow with strategic cards and intelligent orchestration.
        </div>
        <div style={{ 
          marginTop: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          color: '#60a5fa'
        }}>
          Switch back anytime
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
};

export default PlatformModeSwitcher;