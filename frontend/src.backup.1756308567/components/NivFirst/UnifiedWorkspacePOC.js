import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import nivStateManager from './NivStateManager';
import SimplifiedMediaList from './SimplifiedMediaList';
import SimplifiedContentDraft from './SimplifiedContentDraft';
import SimplifiedStrategicPlanning from './SimplifiedStrategicPlanning';
import SimplifiedGenericContent from './SimplifiedGenericContent';

// PROOF OF CONCEPT: Unified Workspace Handler
// This component renders the appropriate workspace based on the work item type
// It subscribes to the state manager for clean data flow

const UnifiedWorkspacePOC = ({ onClose }) => {
  const [activeWorkItem, setActiveWorkItem] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Subscribe to workspace events from state manager
    const unsubscribe = nivStateManager.subscribe('workspace', (event) => {
      if (event.type === 'workspace_opened') {
        console.log('[UnifiedWorkspace] Opening workspace for:', event.workItem);
        setActiveWorkItem(event.workItem);
      } else if (event.type === 'workspace_closed') {
        setActiveWorkItem(null);
      }
    });

    // Check if there's already an active workspace
    const currentWorkspace = nivStateManager.getActiveWorkspace();
    if (currentWorkspace) {
      setActiveWorkItem(currentWorkspace);
    }

    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    nivStateManager.closeWorkspace();
    setActiveWorkItem(null);
    if (onClose) onClose();
  };

  const renderWorkspace = () => {
    if (!activeWorkItem) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Select a work item from the sidebar to begin editing
        </div>
      );
    }

    // Create context object with proper data structure
    const context = {
      title: activeWorkItem.title,
      description: activeWorkItem.description,
      generatedContent: activeWorkItem.generatedContent,
      // Include all metadata
      ...activeWorkItem.metadata
    };

    console.log('[UnifiedWorkspace] Rendering workspace for type:', activeWorkItem.type);
    console.log('[UnifiedWorkspace] Context being passed:', context);

    // Route to the appropriate component based on type
    switch (activeWorkItem.type) {
      case 'media-list':
        return <SimplifiedMediaList context={context} />;
      
      case 'content-draft':
        return <SimplifiedContentDraft context={context} />;
      
      case 'strategy-plan':
        return <SimplifiedStrategicPlanning context={context} />;
      
      case 'key-messaging':
      case 'social-content':
      case 'faq-document':
        // Use generic content component for these types
        return <SimplifiedGenericContent context={context} />;
      
      default:
        console.warn('[UnifiedWorkspace] Unknown work item type:', activeWorkItem.type);
        return <SimplifiedGenericContent context={context} />;
    }
  };

  // Don't render if no active work item
  if (!activeWorkItem && !isMaximized) {
    return null;
  }

  return (
    <div style={{
      position: isMaximized ? 'fixed' : 'relative',
      top: isMaximized ? 0 : 'auto',
      left: isMaximized ? 0 : 'auto',
      right: isMaximized ? 0 : 'auto',
      bottom: isMaximized ? 0 : 'auto',
      width: isMaximized ? '100vw' : '100%',
      height: isMaximized ? '100vh' : '100%',
      background: '#0a0a0f',
      zIndex: isMaximized ? 1000 : 1,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: !isMaximized ? '1px solid rgba(139, 92, 246, 0.2)' : 'none'
    }}>
      {/* Workspace Header */}
      {activeWorkItem && (
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(30, 30, 45, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{
              fontSize: '14px',
              color: '#e8e8e8',
              fontWeight: '500'
            }}>
              Editing: {activeWorkItem.title}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#9ca3af',
              padding: '2px 8px',
              background: 'rgba(139, 92, 246, 0.2)',
              borderRadius: '4px'
            }}>
              {activeWorkItem.type.replace('-', ' ')}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                padding: '6px',
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: '6px',
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '4px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close workspace"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Workspace Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {renderWorkspace()}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedWorkspacePOC;