import React from 'react';
import NivChat from './NivChat';
import NivArtifactPanel from './NivArtifactPanel';
import NivWorkspace from './NivWorkspace';

const NivLayout = ({
  messages,
  artifacts,
  selectedArtifact,
  loading,
  onSendMessage,
  onArtifactSelect,
  onArtifactUpdate,
  onArtifactDelete,
  onCloseWorkspace
}) => {
  const isWorkspaceOpen = !!selectedArtifact;

  const layoutStyles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    chatSection: {
      width: isWorkspaceOpen ? '40%' : '60%',
      transition: 'width 0.3s ease',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    },
    rightSection: {
      width: isWorkspaceOpen ? '60%' : '40%',
      transition: 'width 0.3s ease',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '16px 24px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: 0
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      backgroundColor: '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
      fontSize: '16px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      color: '#64748b',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div style={layoutStyles.container}>
      {/* Chat Section */}
      <div style={layoutStyles.chatSection}>
        <div style={layoutStyles.header}>
          <div style={layoutStyles.logo}>
            <div style={layoutStyles.logoIcon}>N</div>
            <div>
              <h1 style={layoutStyles.title}>Niv</h1>
              <p style={layoutStyles.subtitle}>PR Strategist</p>
            </div>
          </div>
        </div>
        <NivChat
          messages={messages}
          loading={loading}
          onSendMessage={onSendMessage}
        />
      </div>

      {/* Right Panel - Artifacts or Workspace */}
      <div style={layoutStyles.rightSection}>
        {isWorkspaceOpen ? (
          <>
            <div style={layoutStyles.header}>
              <div>
                <h2 style={layoutStyles.title}>{selectedArtifact.title}</h2>
                <p style={layoutStyles.subtitle}>Workspace Editor</p>
              </div>
              <button
                style={{
                  ...layoutStyles.closeButton,
                  ':hover': { backgroundColor: '#f1f5f9' }
                }}
                onClick={onCloseWorkspace}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
            <NivWorkspace
              artifact={selectedArtifact}
              onUpdate={onArtifactUpdate}
            />
          </>
        ) : (
          <>
            <div style={layoutStyles.header}>
              <div>
                <h2 style={layoutStyles.title}>Artifacts</h2>
                <p style={layoutStyles.subtitle}>
                  {artifacts.length} {artifacts.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <NivArtifactPanel
              artifacts={artifacts}
              onSelect={onArtifactSelect}
              onDelete={onArtifactDelete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NivLayout;