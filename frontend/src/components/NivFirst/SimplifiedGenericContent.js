import React, { useState } from 'react';
import { FileText, Edit2, Save, Copy, Download, Send } from 'lucide-react';

const SimplifiedGenericContent = ({ context }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Extract content from Niv's generated structure
  const getNivContent = () => {
    // Check if we have generated content from Niv
    if (context?.generatedContent) {
      const generated = context.generatedContent;
      
      // Handle key messaging format
      if (generated.sections && generated.sections.coreMessage) {
        let content = `CORE MESSAGE:\n${generated.sections.coreMessage}\n\n`;
        
        if (generated.sections.supportingMessages) {
          content += `SUPPORTING MESSAGES:\n`;
          generated.sections.supportingMessages.forEach((msg, i) => {
            content += `${i + 1}. ${msg}\n`;
          });
          content += '\n';
        }
        
        if (generated.sections.audienceMessaging) {
          content += `AUDIENCE-SPECIFIC MESSAGING:\n`;
          Object.entries(generated.sections.audienceMessaging).forEach(([audience, message]) => {
            content += `${audience.toUpperCase()}: ${message}\n`;
          });
          content += '\n';
        }
        
        if (generated.sections.talkingPoints) {
          content += `KEY TALKING POINTS:\n`;
          generated.sections.talkingPoints.forEach((point, i) => {
            content += `• ${point}\n`;
          });
        }
        
        return {
          title: generated.title || context?.title || 'Key Messaging Framework',
          content: content
        };
      }
      
      // Handle FAQ format
      if (generated.sections && (generated.sections.general || generated.sections.technical || generated.sections.business)) {
        let content = '';
        
        if (generated.sections.general) {
          content += `GENERAL QUESTIONS:\n\n`;
          generated.sections.general.forEach((faq, i) => {
            content += `Q${i + 1}: ${faq.q}\nA: ${faq.a}\n\n`;
          });
        }
        
        if (generated.sections.technical) {
          content += `TECHNICAL QUESTIONS:\n\n`;
          generated.sections.technical.forEach((faq, i) => {
            content += `Q${i + 1}: ${faq.q}\nA: ${faq.a}\n\n`;
          });
        }
        
        if (generated.sections.business) {
          content += `BUSINESS QUESTIONS:\n\n`;
          generated.sections.business.forEach((faq, i) => {
            content += `Q${i + 1}: ${faq.q}\nA: ${faq.a}\n\n`;
          });
        }
        
        return {
          title: generated.title || context?.title || 'FAQ Document',
          content: content
        };
      }
      
      // Handle social content format
      if (generated.platforms) {
        let content = '';
        
        Object.entries(generated.platforms).forEach(([platform, posts]) => {
          content += `${platform.toUpperCase()} CONTENT:\n\n`;
          
          if (Array.isArray(posts)) {
            posts.forEach((post, i) => {
              content += `${post.type ? post.type.toUpperCase() + ': ' : ''}${post.content}\n`;
              if (post.hashtags) {
                content += `Hashtags: ${post.hashtags.join(' ')}\n`;
              }
              content += '\n';
            });
          }
          content += '\n';
        });
        
        return {
          title: generated.title || context?.title || 'Social Media Content',
          content: content
        };
      }
      
      // Handle generic structured content
      if (typeof generated === 'object' && generated.title) {
        return {
          title: generated.title,
          content: JSON.stringify(generated, null, 2)
        };
      }
    }
    
    // Fallback to context fields
    return {
      title: context?.title || 'Generated Content',
      content: context?.content || `Your generated content will appear here once Niv creates it.`
    };
  };
  
  const [content, setContent] = useState(getNivContent());

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving content:', content);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    console.log('Content copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([content.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      color: '#e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#ffffff'
              }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                    style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: '#ffffff'
                    }}
                  />
                ) : content.title}
              </h2>
              <p style={{
                margin: '4px 0 0',
                fontSize: '14px',
                color: '#9ca3af'
              }}>
                {content.content.split(' ').length} words • {content.content.split('\n').length} lines
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Copy to clipboard"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '10px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              style={{
                padding: '10px 20px',
                background: isEditing 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
              {isEditing ? 'Save Changes' : 'Edit Content'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto'
      }}>
        {isEditing ? (
          <textarea
            value={content.content}
            onChange={(e) => setContent({ ...content, content: e.target.value })}
            style={{
              width: '100%',
              height: '100%',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '15px',
              lineHeight: '1.6',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              resize: 'none',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.target.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              e.target.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          />
        ) : (
          <div style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            minHeight: '100%'
          }}>
            <pre style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#e5e7eb',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {content.content}
            </pre>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={16} />
          Send for Review
        </button>
      </div>
    </div>
  );
};

export default SimplifiedGenericContent;