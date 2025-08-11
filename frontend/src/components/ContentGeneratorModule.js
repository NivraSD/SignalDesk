// Content Generator Module - Simplified content type launcher
import React, { useState, useEffect } from 'react';
import {
  FileText, Sparkles, Copy, Download, Check, AlertCircle, 
  Edit3, MessageSquare, FileQuestion, Megaphone, Mail, 
  Hash, Bot, Save, ArrowLeft, Wand2, X, Send
} from 'lucide-react';

const ContentGeneratorModule = ({ onAIMessage, generatedContent, onContentUpdate, currentContentType }) => {
  const [content, setContent] = useState(generatedContent || '');
  // Start in edit mode when there's content
  const [editMode, setEditMode] = useState(!!generatedContent || false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [showAiEdit, setShowAiEdit] = useState(false);
  
  // Content type options
  const contentTypes = [
    { 
      id: 'press-release', 
      name: 'Press Release', 
      icon: Megaphone, 
      color: '#8b5cf6',
      description: 'Official announcements and news releases'
    },
    { 
      id: 'thought-leadership', 
      name: 'Thought Leadership', 
      icon: Sparkles, 
      color: '#ec4899',
      description: 'Expert insights and industry perspective'
    },
    { 
      id: 'social-post', 
      name: 'Social Media Post', 
      icon: Hash, 
      color: '#10b981',
      description: 'LinkedIn, Twitter, and social content'
    },
    { 
      id: 'media-pitch', 
      name: 'Media Pitch', 
      icon: MessageSquare, 
      color: '#14b8a6',
      description: 'Journalist outreach and story pitches'
    },
    { 
      id: 'qa-doc', 
      name: 'Q&A Document', 
      icon: FileQuestion, 
      color: '#3b82f6',
      description: 'FAQs and question responses'
    },
    { 
      id: 'crisis-response', 
      name: 'Crisis Response', 
      icon: AlertCircle, 
      color: '#ef4444',
      description: 'Crisis communications and responses'
    },
    { 
      id: 'corporate-messaging', 
      name: 'Corporate Messaging', 
      icon: FileText, 
      color: '#f59e0b',
      description: 'Internal communications and company messaging'
    }
  ];

  // Listen for generated content from parent
  useEffect(() => {
    if (generatedContent && generatedContent.trim()) {
      setContent(generatedContent);
      // Automatically enable edit mode when new content is received
      setEditMode(true);
    }
  }, [generatedContent]);

  // Handle content type selection - triggers AI assistant
  const handleContentTypeSelect = (contentType) => {
    if (onAIMessage) {
      // Send message to AI assistant to trigger tips and conversation flow
      onAIMessage({
        type: 'user',
        content: `I want to create a ${contentType.name.toLowerCase()}`
      });
    }
  };
  
  // Copy, edit, save, and download functions (keep the good stuff)
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentContentType || 'content'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleContentEdit = (newContent) => {
    setContent(newContent);
    if (onContentUpdate) {
      onContentUpdate(newContent);
    }
  };
  
  const handleSave = async () => {
    if (onContentUpdate) {
      onContentUpdate(content);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Signal that content is saved and AI can reset conversation state
    if (onAIMessage) {
      onAIMessage({
        type: 'content_saved',
        content: 'Content saved to Memory Vault successfully!'
      });
    }
  };
  
  const handleAiEdit = async () => {
    if (!aiEditPrompt.trim()) return;
    
    if (onAIMessage) {
      onAIMessage({
        type: 'edit_request',
        content: aiEditPrompt,
        currentContent: content,
        metadata: { contentType: currentContentType }
      });
    }
    
    setShowAiEdit(false);
    setAiEditPrompt('');
  };
  
  const handleReturnToGenerator = () => {
    setContent('');
    if (onContentUpdate) {
      onContentUpdate('');
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#e8e8e8'
    }}>
      {/* If content exists, show content workspace */}
      {content ? (
        <div style={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Content header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {currentContentType && (
                <div style={{
                  background: 'rgba(124, 58, 237, 0.8)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Bot size={12} />
                  AI Generated
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleReturnToGenerator}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px'
                }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
              
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: editMode ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: editMode ? '#a78bfa' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px'
                }}
              >
                <Edit3 size={14} />
                {editMode ? 'Preview' : 'Edit'}
              </button>
              
              <button
                onClick={handleCopy}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: copied ? '#10b981' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={() => setShowAiEdit(!showAiEdit)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(147, 51, 234, 0.2)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  borderRadius: '6px',
                  color: '#c084fc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px'
                }}
              >
                <Wand2 size={14} />
                AI Edit
              </button>
            </div>
          </div>
          
          {/* AI Edit Panel */}
          {showAiEdit && (
            <div style={{
              padding: '1rem',
              background: 'rgba(147, 51, 234, 0.1)',
              borderBottom: '1px solid rgba(147, 51, 234, 0.2)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="How would you like to edit this content?"
                value={aiEditPrompt}
                onChange={(e) => setAiEditPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiEdit()}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: '#e8e8e8',
                  fontSize: '12px'
                }}
              />
              <button
                onClick={handleAiEdit}
                disabled={!aiEditPrompt.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  background: aiEditPrompt.trim() ? '#9333ea' : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  color: aiEditPrompt.trim() ? 'white' : '#6b7280',
                  cursor: aiEditPrompt.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '12px'
                }}
              >
                <Send size={14} />
                Apply
              </button>
              <button
                onClick={() => {
                  setShowAiEdit(false);
                  setAiEditPrompt('');
                }}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {/* Content area */}
          <div style={{ 
            flex: 1, 
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {editMode ? (
              <textarea
                value={content}
                onChange={(e) => handleContentEdit(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#e8e8e8',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  resize: 'none',
                  minHeight: '300px'
                }}
              />
            ) : (
              <div style={{
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#e8e8e8',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '8px',
                minHeight: '300px'
              }}>
                {content}
              </div>
            )}
          </div>
          
          {/* Bottom actions */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSave}
              style={{
                padding: '0.5rem 1.5rem',
                background: saved 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                border: saved ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                borderRadius: '6px',
                color: saved ? '#10b981' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : 'Save to Memory Vault'}
            </button>
            
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      ) : (
        /* Content Type Selector */
        <div style={{ 
          padding: '2rem',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Sparkles size={48} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#e8e8e8',
              marginBottom: '0.5rem'
            }}>
              Content Generator
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              margin: 0
            }}>
              Select a content type to start the AI conversation
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            width: '100%',
            maxWidth: '800px'
          }}>
            {contentTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleContentTypeSelect(type)}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#e8e8e8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${type.color}10`;
                    e.currentTarget.style.borderColor = `${type.color}40`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${type.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} style={{ color: type.color }} />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {type.name}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      {type.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGeneratorModule;