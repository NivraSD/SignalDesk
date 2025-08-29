import React from 'react';

const NivArtifactPanel = ({ artifacts, onSelect, onDelete }) => {
  const getArtifactIcon = (type) => {
    const icons = {
      'media-list': '📰',
      'press-release': '📄',
      'strategic-plan': '🎯',
      'social-content': '💬',
      'key-messaging': '🗣️',
      'faq-document': '❓'
    };
    return icons[type] || '📄';
  };

  const getArtifactTypeLabel = (type) => {
    const labels = {
      'media-list': 'Media List',
      'press-release': 'Press Release',
      'strategic-plan': 'Strategic Plan',
      'social-content': 'Social Content',
      'key-messaging': 'Key Messaging',
      'faq-document': 'FAQ Document'
    };
    return labels[type] || 'Document';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const panelStyles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8fafc'
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px'
    },
    emptyState: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: '#64748b',
      gap: '16px'
    },
    emptyIcon: {
      fontSize: '48px',
      opacity: 0.5
    },
    emptyText: {
      fontSize: '16px',
      fontWeight: '500',
      margin: 0
    },
    emptySubtext: {
      fontSize: '14px',
      margin: 0,
      maxWidth: '280px',
      lineHeight: '1.5'
    },
    artifactsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    artifactCard: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative'
    },
    artifactCardHover: {
      borderColor: '#3b82f6',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
    },
    artifactHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '8px'
    },
    artifactIcon: {
      fontSize: '20px',
      flexShrink: 0,
      marginTop: '2px'
    },
    artifactInfo: {
      flex: 1,
      minWidth: 0
    },
    artifactTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
      marginBottom: '4px',
      wordWrap: 'break-word'
    },
    artifactType: {
      fontSize: '12px',
      color: '#64748b',
      margin: 0,
      marginBottom: '8px'
    },
    artifactMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#64748b'
    },
    artifactDate: {
      flex: 1
    },
    deleteButton: {
      background: 'none',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      position: 'absolute',
      top: '12px',
      right: '12px',
      opacity: 0
    },
    deleteButtonVisible: {
      opacity: 1
    },
    deleteButtonHover: {
      backgroundColor: '#fef2f2'
    }
  };

  if (artifacts.length === 0) {
    return (
      <div style={panelStyles.container}>
        <div style={panelStyles.emptyState}>
          <div style={panelStyles.emptyIcon}>📋</div>
          <h3 style={panelStyles.emptyText}>No artifacts yet</h3>
          <p style={panelStyles.emptySubtext}>
            Start a conversation with Niv to create media lists, press releases, strategic plans, and more. Your work will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyles.container}>
      <style>
        {`
          .artifact-card:hover {
            border-color: #3b82f6 !important;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1) !important;
          }
          
          .artifact-card:hover .delete-button {
            opacity: 1 !important;
          }
          
          .delete-button:hover {
            background-color: #fef2f2 !important;
          }
        `}
      </style>

      <div style={panelStyles.content}>
        <div style={panelStyles.artifactsList}>
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              style={panelStyles.artifactCard}
              className="artifact-card"
              onClick={() => onSelect(artifact)}
            >
              <button
                style={{
                  ...panelStyles.deleteButton,
                  ...(artifacts.length > 0 ? {} : panelStyles.deleteButtonVisible)
                }}
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(artifact.id);
                }}
                title="Delete artifact"
              >
                ×
              </button>
              
              <div style={panelStyles.artifactHeader}>
                <div style={panelStyles.artifactIcon}>
                  {getArtifactIcon(artifact.type)}
                </div>
                <div style={panelStyles.artifactInfo}>
                  <h4 style={panelStyles.artifactTitle}>
                    {artifact.title}
                  </h4>
                  <p style={panelStyles.artifactType}>
                    {getArtifactTypeLabel(artifact.type)}
                  </p>
                </div>
              </div>
              
              <div style={panelStyles.artifactMeta}>
                <span style={panelStyles.artifactDate}>
                  {formatDate(artifact.created)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NivArtifactPanel;