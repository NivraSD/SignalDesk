import React, { useState } from 'react';
import NivChatPOC from './NivChatPOC';
import WorkItemsPanelPOC from './WorkItemsPanelPOC';
import WorkspaceViewPOC from './WorkspaceViewPOC';
import nivStateManager from './NivStateManager';
import { Sparkles, RefreshCw } from 'lucide-react';

// PROOF OF CONCEPT: Complete Niv Layout with Clean Architecture
// This demonstrates the full system working together with proper separation of concerns

const NivLayoutPOC = () => {
  const [inWorkspaceMode, setInWorkspaceMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleReset = () => {
    if (window.confirm('Reset all data and start fresh?')) {
      nivStateManager.reset();
      setInWorkspaceMode(false);
    }
  };

  const handleExportState = () => {
    const state = nivStateManager.exportState();
    console.log('=== CURRENT NIV STATE ===');
    console.log(JSON.stringify(state, null, 2));
    console.log('=========================');
    alert('State exported to console. Check developer tools.');
  };

  // If in workspace mode, show the full workspace view
  if (inWorkspaceMode) {
    return <WorkspaceViewPOC onBack={() => setInWorkspaceMode(false)} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f',
      overflow: 'hidden'
    }}>
      {/* POC Header */}
      <div style={{
        padding: '12px 20px',
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Sparkles size={20} color="#8b5cf6" />
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#e8e8e8'
          }}>
            Niv System - Proof of Concept
          </h3>
          <span style={{
            padding: '4px 8px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            CLEAN ARCHITECTURE
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              color: '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </button>
          <button
            onClick={handleExportState}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              color: '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Export State
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Chat Component (Left) */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: showSidebar ? '1px solid rgba(139, 92, 246, 0.2)' : 'none'
        }}>
          <NivChatPOC />
        </div>

        {/* Work Items Panel (Right) */}
        {showSidebar && (
          <div style={{
            width: '320px',
            height: '100%',
            flexShrink: 0
          }}>
            <WorkItemsPanelPOC 
              onOpenWorkspace={(item) => {
                setInWorkspaceMode(true);
                console.log('[Layout] Opening workspace for:', item);
              }}
            />
          </div>
        )}
      </div>

      {/* Architecture Info Footer */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(30, 30, 45, 0.4)',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          <span>
            <strong style={{ color: '#9ca3af' }}>Chat:</strong> Pure conversation UI
          </span>
          <span>
            <strong style={{ color: '#9ca3af' }}>Work Items:</strong> Separated artifacts
          </span>
          <span>
            <strong style={{ color: '#9ca3af' }}>State Manager:</strong> Single source of truth
          </span>
          <span>
            <strong style={{ color: '#9ca3af' }}>Niv Engine:</strong> Intelligent generation
          </span>
        </div>
        <div style={{
          fontSize: '11px',
          color: '#10b981'
        }}>
          ✓ Clean separation of concerns
        </div>
      </div>
    </div>
  );
};

export default NivLayoutPOC;