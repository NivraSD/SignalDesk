import React, { useState, useEffect } from 'react';

const NivWorkspace = ({ artifact, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(null);

  useEffect(() => {
    if (artifact) {
      setEditedContent(JSON.parse(JSON.stringify(artifact.content)));
      setIsEditing(false);
    }
  }, [artifact]);

  const handleSave = () => {
    if (editedContent) {
      const updatedArtifact = {
        ...artifact,
        content: editedContent,
        updated: new Date().toISOString()
      };
      onUpdate(updatedArtifact);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(JSON.parse(JSON.stringify(artifact.content)));
    setIsEditing(false);
  };

  const updateContent = (path, value) => {
    const newContent = { ...editedContent };
    const keys = path.split('.');
    let current = newContent;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditedContent(newContent);
  };

  const workspaceStyles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white'
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc'
    },
    toolbarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    toolbarRight: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      padding: '8px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: '1px solid #3b82f6'
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#374151'
    },
    editButton: {
      backgroundColor: '#f59e0b',
      color: 'white',
      border: '1px solid #f59e0b'
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '24px'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '16px',
      borderBottom: '2px solid #e2e8f0',
      paddingBottom: '8px'
    },
    field: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      lineHeight: '1.6',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    readOnlyText: {
      padding: '12px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap'
    },
    list: {
      margin: 0,
      paddingLeft: '20px'
    },
    listItem: {
      marginBottom: '8px',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    mediaContact: {
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      marginBottom: '12px',
      backgroundColor: '#f9fafb'
    },
    contactName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '4px'
    },
    contactOutlet: {
      fontSize: '14px',
      color: '#3b82f6',
      marginBottom: '8px'
    },
    contactDetails: {
      fontSize: '13px',
      color: '#64748b',
      lineHeight: '1.4'
    }
  };

  const renderContent = () => {
    console.log('🎨 NivWorkspace: renderContent called with artifact:', artifact);
    if (!artifact) return null;

    const content = isEditing ? editedContent : artifact.content;
    console.log('🎨 NivWorkspace: Content to render:', content);
    console.log('🎨 NivWorkspace: Content type:', artifact.type);

    // Handle flexible document type from saved messages
    if (artifact.type === 'document' && content.text) {
      return renderFlexibleDocument(content);
    }

    switch (artifact.type) {
      case 'media-list':
        return renderMediaList(content);
      case 'press-release':
        return renderPressRelease(content);
      case 'strategic-plan':
        return renderStrategicPlan(content);
      case 'social-content':
        return renderSocialContent(content);
      case 'key-messaging':
        return renderKeyMessaging(content);
      case 'faq-document':
        return renderFAQDocument(content);
      default:
        return renderGenericContent(content);
    }
  };

  const renderMediaList = (content) => {
    console.log('🔍 NivWorkspace: Rendering media list with content:', content);
    if (!content || !content.tiers) {
      console.error('❌ NivWorkspace: No tiers found in content:', content);
      return <div>No media list data available</div>;
    }

    return (
      <div>
        {content.tiers.map((tier, tierIndex) => (
          <div key={tierIndex} style={workspaceStyles.section}>
            <h3 style={workspaceStyles.sectionTitle}>{tier.name}</h3>
            {tier.journalists.map((journalist, journalistIndex) => (
              <div key={journalistIndex} style={workspaceStyles.mediaContact}>
                <div style={workspaceStyles.contactName}>{journalist.name}</div>
                <div style={workspaceStyles.contactOutlet}>{journalist.outlet}</div>
                <div style={workspaceStyles.contactDetails}>
                  <strong>Email:</strong> {journalist.email}<br/>
                  <strong>Beat:</strong> {journalist.beat}<br/>
                  <strong>Twitter:</strong> {journalist.twitter}<br/>
                  <strong>Recent Coverage:</strong> {journalist.recent_coverage}
                </div>
              </div>
            ))}
          </div>
        ))}
        {content.notes && (
          <div style={workspaceStyles.section}>
            <h3 style={workspaceStyles.sectionTitle}>Notes</h3>
            <div style={workspaceStyles.readOnlyText}>{content.notes}</div>
          </div>
        )}
      </div>
    );
  };

  const renderPressRelease = (content) => {
    console.log('📰 NivWorkspace: Rendering press release with content:', content);
    if (!content) {
      console.error('❌ NivWorkspace: No press release content!');
      return <div>No press release content available</div>;
    }
    return (
    <div>
      <div style={workspaceStyles.section}>
        <h3 style={workspaceStyles.sectionTitle}>Headline</h3>
        {isEditing ? (
          <input
            style={workspaceStyles.input}
            value={content.headline || ''}
            onChange={(e) => updateContent('headline', e.target.value)}
          />
        ) : (
          <div style={workspaceStyles.readOnlyText}>{content.headline}</div>
        )}
      </div>

      <div style={workspaceStyles.section}>
        <h3 style={workspaceStyles.sectionTitle}>Subheadline</h3>
        {isEditing ? (
          <input
            style={workspaceStyles.input}
            value={content.subheadline || ''}
            onChange={(e) => updateContent('subheadline', e.target.value)}
          />
        ) : (
          <div style={workspaceStyles.readOnlyText}>{content.subheadline}</div>
        )}
      </div>

      <div style={workspaceStyles.section}>
        <h3 style={workspaceStyles.sectionTitle}>Dateline</h3>
        <div style={workspaceStyles.readOnlyText}>{content.dateline}</div>
      </div>

      <div style={workspaceStyles.section}>
        <h3 style={workspaceStyles.sectionTitle}>Body</h3>
        {isEditing ? (
          <textarea
            style={workspaceStyles.textarea}
            value={Array.isArray(content.body) ? content.body.join('\n\n') : content.body || ''}
            onChange={(e) => updateContent('body', e.target.value.split('\n\n'))}
            rows={10}
          />
        ) : (
          <div style={workspaceStyles.readOnlyText}>
            {Array.isArray(content.body) ? content.body.join('\n\n') : content.body}
          </div>
        )}
      </div>

      {content.boilerplate && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Boilerplate</h3>
          <div style={workspaceStyles.readOnlyText}>{content.boilerplate}</div>
        </div>
      )}

      {content.contact && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Contact</h3>
          <div style={workspaceStyles.readOnlyText}>{content.contact}</div>
        </div>
      )}
    </div>
  );
  };

  const renderStrategicPlan = (content) => (
    <div>
      {content.campaign_name && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Campaign Name</h3>
          <div style={workspaceStyles.readOnlyText}>{content.campaign_name}</div>
        </div>
      )}

      {content.objectives && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Objectives</h3>
          <ul style={workspaceStyles.list}>
            {content.objectives.map((objective, index) => (
              <li key={index} style={workspaceStyles.listItem}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      {content.timeline && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Timeline</h3>
          {content.timeline.map((phase, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                {phase.phase}
              </h4>
              <ul style={workspaceStyles.list}>
                {phase.activities.map((activity, actIndex) => (
                  <li key={actIndex} style={workspaceStyles.listItem}>{activity}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {content.key_messages && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Key Messages</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Primary:</strong> {content.key_messages.primary}
          </div>
          {content.key_messages.supporting && (
            <div>
              <strong>Supporting:</strong>
              <ul style={workspaceStyles.list}>
                {content.key_messages.supporting.map((message, index) => (
                  <li key={index} style={workspaceStyles.listItem}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSocialContent = (content) => (
    <div>
      {content.twitter && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Twitter Thread</h3>
          {content.twitter.thread.map((tweet, index) => (
            <div key={index} style={{ ...workspaceStyles.readOnlyText, marginBottom: '8px' }}>
              {index + 1}. {tweet}
            </div>
          ))}
          <div style={{ marginTop: '12px' }}>
            <strong>Hashtags:</strong> {content.twitter.hashtags.join(' ')}
          </div>
        </div>
      )}

      {content.linkedin && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>LinkedIn Post</h3>
          <div style={workspaceStyles.readOnlyText}>{content.linkedin.post}</div>
          <div style={{ marginTop: '12px' }}>
            <strong>Hashtags:</strong> {content.linkedin.hashtags.join(' ')}
          </div>
        </div>
      )}
    </div>
  );

  const renderKeyMessaging = (content) => (
    <div>
      {content.elevator_pitch && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Elevator Pitch</h3>
          <div style={workspaceStyles.readOnlyText}>{content.elevator_pitch}</div>
        </div>
      )}

      {content.value_props && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Value Propositions</h3>
          {content.value_props.map((prop, index) => (
            <div key={index} style={{ ...workspaceStyles.mediaContact, marginBottom: '16px' }}>
              <div style={workspaceStyles.contactName}>{prop.headline}</div>
              <div style={{ marginBottom: '8px' }}>{prop.message}</div>
              <div style={workspaceStyles.contactDetails}>
                <strong>Proof:</strong> {prop.proof}
              </div>
            </div>
          ))}
        </div>
      )}

      {content.audience_specific && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Audience-Specific Messages</h3>
          {Object.entries(content.audience_specific).map(([audience, message]) => (
            <div key={audience} style={{ marginBottom: '12px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{audience}:</strong> {message}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFAQDocument = (content) => (
    <div>
      {content.external && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>External FAQ</h3>
          {content.external.map((faq, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Q: {faq.question}
              </div>
              <div style={workspaceStyles.readOnlyText}>
                A: {faq.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {content.internal && (
        <div style={workspaceStyles.section}>
          <h3 style={workspaceStyles.sectionTitle}>Internal FAQ</h3>
          {content.internal.map((faq, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Q: {faq.question}
              </div>
              <div style={workspaceStyles.readOnlyText}>
                A: {faq.answer}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFlexibleDocument = (content) => {
    console.log('📄 NivWorkspace: Rendering flexible document:', content);
    
    // Parse the text to format it nicely
    const formatText = (text) => {
      // Split by double newlines for paragraphs
      const paragraphs = text.split('\n\n');
      
      return paragraphs.map((paragraph, index) => {
        // Check if it's a list
        if (paragraph.includes('•') || paragraph.includes('-') || /^\d+\./.test(paragraph.trim())) {
          const items = paragraph.split('\n').filter(item => item.trim());
          return (
            <ul key={index} style={workspaceStyles.list}>
              {items.map((item, i) => (
                <li key={i} style={workspaceStyles.listItem}>
                  {item.replace(/^[•\-\d+\.]\s*/, '')}
                </li>
              ))}
            </ul>
          );
        }
        
        // Check if it's a heading (starts with caps or has colon)
        if (/^[A-Z][A-Z\s]+:?$/.test(paragraph.trim()) || paragraph.endsWith(':')) {
          return (
            <h3 key={index} style={workspaceStyles.sectionTitle}>
              {paragraph.replace(':', '')}
            </h3>
          );
        }
        
        // Regular paragraph
        return (
          <div key={index} style={{ ...workspaceStyles.readOnlyText, marginBottom: '16px' }}>
            {paragraph}
          </div>
        );
      });
    };

    return (
      <div>
        <div style={workspaceStyles.section}>
          {isEditing ? (
            <textarea
              style={{ ...workspaceStyles.textarea, minHeight: '400px' }}
              value={content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              rows={20}
            />
          ) : (
            <div>{formatText(content.text || '')}</div>
          )}
        </div>
      </div>
    );
  };

  const renderGenericContent = (content) => (
    <div style={workspaceStyles.section}>
      <h3 style={workspaceStyles.sectionTitle}>Content</h3>
      <pre style={workspaceStyles.readOnlyText}>
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );

  if (!artifact) {
    return (
      <div style={workspaceStyles.container}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Select an artifact to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div style={workspaceStyles.container}>
      <style>
        {`
          .workspace-button:hover {
            opacity: 0.9 !important;
            transform: translateY(-1px);
          }
          
          .workspace-button:active {
            transform: translateY(0);
          }
        `}
      </style>

      <div style={workspaceStyles.toolbar}>
        <div style={workspaceStyles.toolbarLeft}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            Last updated: {new Date(artifact.updated || artifact.created).toLocaleString()}
          </span>
        </div>
        <div style={workspaceStyles.toolbarRight}>
          {isEditing ? (
            <>
              <button
                style={{ ...workspaceStyles.button, ...workspaceStyles.secondaryButton }}
                className="workspace-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                style={{ ...workspaceStyles.button, ...workspaceStyles.primaryButton }}
                className="workspace-button"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              style={{ ...workspaceStyles.button, ...workspaceStyles.editButton }}
              className="workspace-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div style={workspaceStyles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default NivWorkspace;