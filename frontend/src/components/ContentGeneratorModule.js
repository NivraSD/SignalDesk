// Content Generator Module - Interactive content creation with AI integration
import React, { useState, useEffect } from 'react';
import {
  FileText, Zap, Sparkles, Copy, Download, RefreshCw, 
  Check, AlertCircle, ChevronDown, Send, Edit3, 
  MessageSquare, List, HelpCircle, FileQuestion,
  Megaphone, Mail, Twitter, Linkedin, Hash, Bot,
  Save, ArrowLeft, Wand2, X
} from 'lucide-react';

const ContentGeneratorModule = ({ onAIMessage, generatedContent, onContentUpdate, triggerGeneration, currentContentType }) => {
  // Content state
  const [contentType, setContentType] = useState(currentContentType || null);
  const [tone, setTone] = useState(null);
  const [content, setContent] = useState(generatedContent || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  
  // Interactive UI state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [showAiEdit, setShowAiEdit] = useState(false);
  
  // Content type options - enhanced with new types
  const contentTypes = [
    { id: 'press-release', name: 'Press Release', icon: Megaphone, color: '#8b5cf6' },
    { id: 'crisis-response', name: 'Crisis Response', icon: AlertCircle, color: '#ef4444' },
    { id: 'social-post', name: 'Social Media Post', icon: Hash, color: '#10b981' },
    { id: 'media-pitch', name: 'Media Pitch', icon: Mail, color: '#f59e0b' },
    { id: 'exec-statement', name: 'Executive Statement', icon: MessageSquare, color: '#6366f1' },
    { id: 'qa-doc', name: 'Q&A Document', icon: FileQuestion, color: '#3b82f6' },
    { id: 'thought-leadership', name: 'Thought Leadership', icon: Sparkles, color: '#ec4899' },
    { id: 'corporate-messaging', name: 'Corporate Messaging', icon: Bot, color: '#14b8a6' },
  ];
  
  // Tone options - matching existing ContentGenerator.js
  const toneOptions = [
    { id: 'professional', name: 'Corporate/Professional', description: 'Formal, authoritative, industry-standard' },
    { id: 'bold', name: 'Bold/Innovative', description: 'Confident, disruptive, attention-grabbing' },
    { id: 'conversational', name: 'Conversational/Friendly', description: 'Approachable, human, relatable' },
    { id: 'analytical', name: 'Data-Driven/Analytical', description: 'Fact-based, research-heavy, objective' },
  ];
  
  // Track if we've processed the initial content to prevent infinite loops
  const [hasProcessedContent, setHasProcessedContent] = useState(false);
  
  // Listen for generated content from parent
  useEffect(() => {
    console.log('ContentGeneratorModule received generatedContent:', generatedContent?.length);
    // Only process content once when it's new and different
    if (generatedContent && generatedContent.trim() && !hasProcessedContent) {
      console.log('Setting content in ContentGeneratorModule');
      setContent(generatedContent);
      setHasProcessedContent(true);
      // Auto-detect content type from the content
      detectContentType(generatedContent);
    }
  }, [generatedContent, hasProcessedContent]);
  
  // Reset processing flag when content is cleared
  useEffect(() => {
    if (!generatedContent || generatedContent === '') {
      setHasProcessedContent(false);
    }
  }, [generatedContent]);
  
  // Listen for content type changes from AI Assistant
  useEffect(() => {
    if (currentContentType && currentContentType !== contentType) {
      setContentType(currentContentType);
      // Auto-detect tone if content is provided
      if (generatedContent) {
        detectTone(generatedContent);
      }
    }
  }, [currentContentType]); // Only depend on currentContentType prop changes
  
  
  // Listen for trigger from parent
  useEffect(() => {
    if (triggerGeneration && contentType && tone) {
      handleGenerate();
    }
  }, [triggerGeneration]);
  
  // Detect content type from generated content
  const detectContentType = (text) => {
    if (text.includes('FOR IMMEDIATE RELEASE') || text.includes('Press Release')) {
      setContentType('press-release');
    } else if (text.includes('Q:') || text.includes('Question:')) {
      setContentType('qa-doc');
    } else if (text.includes('#') || text.length < 280) {
      setContentType('social-post');
    } else if (text.includes('Subject:') || text.includes('Dear')) {
      setContentType('media-pitch');
    } else if (text.includes('crisis') || text.includes('Crisis')) {
      setContentType('crisis-response');
    } else {
      setContentType('exec-statement');
    }
  };
  
  // Detect tone from generated content
  const detectTone = (text) => {
    if (text.includes('superhuman') || text.includes('revolutionary') || text.includes('breakthrough')) {
      setTone('bold');
    } else if (text.includes('We\'re excited') || text.includes('Hey there') || text.includes('!')) {
      setTone('conversational');
    } else if (text.includes('data shows') || text.includes('research indicates') || text.includes('%')) {
      setTone('analytical');
    } else {
      setTone('professional');
    }
  };
  
  // Handle content type selection
  const handleContentTypeSelect = (typeId) => {
    if (contentType === typeId) return; // Prevent duplicate selections
    
    setContentType(typeId);
    // Only set state - no AI messages triggered by selections
  };
  
  // Handle tone selection
  const handleToneSelect = (toneId) => {
    if (tone === toneId) return; // Prevent duplicate selections
    
    setTone(toneId);
    // Only set state - no AI messages triggered by selections
    
    // Set ready to generate flag when both content type and tone are selected
    if (contentType) {
      setReadyToGenerate(true);
    }
  };
  
  // Remove the welcome message useEffect entirely - it will be handled in UnifiedPlatform.js
  // This prevents the infinite loop issue
  
  // Generate content
  const handleGenerate = async () => {
    if (!contentType || !tone) {
      if (onAIMessage) {
        onAIMessage({
          type: 'error',
          content: 'Please select both content type and tone before generating.',
        });
      }
      return;
    }
    
    setIsGenerating(true);
    
    // Don't send any messages to AI chat - just generate directly
    
    // Real API call to backend
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const contentTypeName = contentTypes.find(t => t.id === contentType)?.name || 'content';
      const toneName = toneOptions.find(t => t.id === tone)?.name || 'professional';
      
      // Create more specific prompts for different content types
      let prompt;
      switch(contentType) {
        case 'exec-statement':
          prompt = `Generate a thought leadership executive statement with a ${toneName.toLowerCase()} tone. This should be an insightful piece that demonstrates industry expertise and forward-thinking perspectives.`;
          break;
        case 'press-release':
          prompt = `Generate a press release with a ${toneName.toLowerCase()} tone. Include "FOR IMMEDIATE RELEASE" header and follow standard press release format.`;
          break;
        case 'crisis-response':
          prompt = `Generate a crisis response statement with a ${toneName.toLowerCase()} tone. Address the situation with empathy and clear action steps.`;
          break;
        case 'social-post':
          prompt = `Generate a social media post with a ${toneName.toLowerCase()} tone. Keep it engaging and include relevant hashtags.`;
          break;
        case 'media-pitch':
          prompt = `Generate a media pitch email with a ${toneName.toLowerCase()} tone. Include a compelling subject line and clear value proposition.`;
          break;
        case 'qa-doc':
          prompt = `Generate a Q&A document with a ${toneName.toLowerCase()} tone. Include relevant questions and comprehensive answers.`;
          break;
        case 'thought-leadership':
          prompt = `Generate a thought leadership article with a ${toneName.toLowerCase()} tone. Provide unique insights, industry trends analysis, and forward-thinking perspectives that position the author as an industry expert.`;
          break;
        case 'corporate-messaging':
          prompt = `Generate corporate messaging with a ${toneName.toLowerCase()} tone. Create clear, aligned messaging that communicates company values, mission, and strategic initiatives to internal and external stakeholders.`;
          break;
        default:
          prompt = `Generate a ${contentTypeName.toLowerCase()} with a ${toneName.toLowerCase()} tone.`;
      }
      
      const response = await fetch(`${apiUrl}/ai/generate-with-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: prompt,
          projectId: 'demo-project'
        })
      });
      
      console.log('Generate response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Generate response data:', data);
      
      if (data.success && data.content) {
        console.log('Manual generation successful, content length:', data.content.length);
        setContent(data.content);
        if (onContentUpdate) {
          console.log('Calling onContentUpdate for manual generation');
          onContentUpdate(data.content);
        }
        
        // Don't send any message to AI chat for manual generation
        // The content should only appear in the Content Generator
      } else {
        throw new Error(data.message || 'No content returned from API');
      }
    } catch (error) {
      console.error('Content generation error:', error);
      // Show more detailed error in content area
      setContent(`Error generating content: ${error.message}\n\nPlease check the console for details and try again.`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  
  // Get content type specific questions for AI assistant
  const getContentTypeQuestions = (contentType) => {
    const questionMap = {
      'press-release': [
        '• What is the main news or announcement?',
        '• Who is your target audience (media, customers, investors)?',
        '• What makes this newsworthy and unique?',
        '• Do you have any key quotes or data points to include?',
        '• What is the desired outcome or action you want readers to take?'
      ],
      'crisis-response': [
        '• What is the nature of the crisis or situation?',
        '• What are the key facts that need to be communicated?',
        '• Who are your primary stakeholders that need to hear from you?',
        '• What accountability or corrective actions are being taken?',
        '• What is your main message of reassurance or resolution?'
      ],
      'social-post': [
        '• What platform is this for (LinkedIn, Twitter, Facebook, Instagram)?',
        '• What is the key message or story you want to share?',
        '• Do you want to include any hashtags, mentions, or links?',
        '• What action do you want your audience to take?',
        '• Any specific character limits or image considerations?'
      ],
      'media-pitch': [
        '• Who is your target journalist or publication?',
        '• What is your story angle or news hook?',
        '• Why is this relevant to their audience right now?',
        '• What exclusive information or access can you provide?',
        '• Do you have supporting data, visuals, or expert sources?'
      ],
      'exec-statement': [
        '• What is the occasion or topic for this statement?',
        '• What is the executive\'s key message or position?',
        '• Who is the intended audience?',
        '• What context or background should be included?',
        '• What tone best reflects the executive\'s voice and the situation?'
      ],
      'qa-doc': [
        '• What topic or situation will this Q&A address?',
        '• Who is your target audience?',
        '• What are the main concerns or questions you expect?',
        '• Are there any sensitive topics that need careful handling?',
        '• Do you have specific key messages that must be included?'
      ],
      'thought-leadership': [
        '• What is your unique perspective or insight?',
        '• What industry trend or challenge are you addressing?',
        '• What expertise or experience supports your viewpoint?',
        '• Who is your target audience (C-suite, practitioners, general)?',
        '• What action or mindset shift do you want to inspire?'
      ],
      'corporate-messaging': [
        '• What is the key corporate initiative or value?',
        '• Who are the internal and external stakeholders?',
        '• What is the desired perception or behavior change?',
        '• How does this align with company mission/vision?',
        '• What proof points or examples support the message?'
      ]
    };
    
    return questionMap[contentType] || [
      '• What is the main purpose of this content?',
      '• Who is your target audience?',
      '• What key message do you want to communicate?',
      '• What outcome are you hoping to achieve?'
    ];
  };

  // Get sample content based on type and tone
  const getSampleContent = (type, tone) => {
    const samples = {
      'press-release': {
        professional: `FOR IMMEDIATE RELEASE

SignalDesk Introduces "Intelligent Communications Orchestration" Category
First Platform to Amplify Human PR Expertise Rather Than Replace It

[City, Date] - SignalDesk today unveiled the communications industry's first Intelligent Communications Orchestration platform, establishing a new category that combines human strategic thinking with AI-powered execution to achieve what beta customers call "superhuman PR results."

Unlike traditional PR tools that automate individual tasks, SignalDesk's breakthrough approach creates a symbiotic relationship between human expertise and artificial intelligence, enabling communications professionals to achieve 70% faster execution while delivering 3x higher media engagement rates.

"We've solved the industry's fundamental challenge," said [Executive Name], CEO of SignalDesk. "Instead of AI replacing PR professionals, our platform amplifies their capabilities, allowing them to operate at previously impossible scales while maintaining the authentic relationships that drive successful communications."

Core platform capabilities include:
• Predictive Strategy Engine for optimal campaign timing and messaging
• Contextual Content Intelligence that adapts to real-time market conditions  
• Relationship Amplification System for systematic media engagement
• Crisis Response Orchestration with sub-hour response capabilities
• Performance Intelligence with predictive outcome modeling

About SignalDesk:
SignalDesk is defining the Intelligent Communications Orchestration category, serving forward-thinking organizations that recognize AI as an amplifier of human expertise rather than a replacement.

Contact:
[Contact Information]`,
        conversational: `Hey there! 

Big news from SignalDesk! 🎉

We're super excited to share that we've just launched our new AI-powered PR platform, and it's going to change everything about how you handle communications.

Think of it as your personal PR assistant that never sleeps. It helps you write content, find the right journalists, and even manages those stressful crisis moments - all powered by cutting-edge AI.

What makes it special? Well, imagine having a tool that:
- Writes press releases in seconds
- Knows exactly which journalists to contact
- Monitors what people are saying about you 24/7
- Helps you respond to crises before they blow up
- Shows you what's actually working

Ready to give it a try? Let's chat!`,
      },
      'qa': {
        professional: `Q&A Document: SignalDesk Platform

Q: What is SignalDesk?
A: SignalDesk is an enterprise-grade AI-powered public relations platform that streamlines communications workflows and enhances media outreach capabilities.

Q: What are the primary features?
A: The platform offers content generation, media monitoring, journalist database access, campaign analytics, and crisis management tools.

Q: Who is the target audience?
A: SignalDesk serves PR agencies, corporate communications teams, and marketing departments across various industries.

Q: What makes SignalDesk different from competitors?
A: Our proprietary AI technology provides superior content generation and predictive analytics capabilities not available in traditional PR tools.

Q: What is the pricing structure?
A: SignalDesk offers tiered pricing plans based on organization size and feature requirements. Custom enterprise solutions are available.`,
        informative: `Understanding SignalDesk: Your Questions Answered

Q: How does SignalDesk work?
A: SignalDesk uses artificial intelligence to analyze your communication needs, generate appropriate content, and identify the best channels and timing for your messages. It learns from your preferences and improves over time.

Q: What kind of content can it create?
A: The platform can generate press releases, social media posts, email campaigns, blog articles, talking points, and crisis communications. Each piece is customized to your brand voice and objectives.

Q: How does the AI ensure accuracy?
A: Our AI is trained on millions of successful PR campaigns and continuously updated with current best practices. All generated content includes fact-checking prompts and source verification.

Q: Can I customize the output?
A: Absolutely. You can adjust tone, length, format, and key messages. The AI adapts to your feedback and remembers your preferences for future content.

Q: Is my data secure?
A: Yes, SignalDesk employs enterprise-grade encryption and complies with GDPR, CCPA, and SOC 2 standards.`,
      },
      'social-media': {
        conversational: `🚀 Exciting news! SignalDesk is here to revolutionize your PR game! 

Our AI-powered platform makes creating content, finding journalists, and managing campaigns easier than ever. 

Try it free today! → [link]

#PRTech #AI #Communications #SignalDesk`,
        persuasive: `Your competitors are already using AI for PR. Don't get left behind.

SignalDesk cuts content creation time by 80% and doubles media coverage.

Limited time: 30% off annual plans. 

Start your free trial now → [link]

#PRInnovation #AITools`,
      },
    };
    
    return samples[type]?.[tone] || `Generated ${type} content with ${tone} tone.\n\nThis is sample content that would be customized based on your specific needs and inputs.`;
  };
  
  // Copy content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Download content
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contentType || 'content'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle content edit - Fixed to prevent re-render issues
  const handleContentEdit = (newContent) => {
    setContent(newContent);
    // Don't call onContentUpdate immediately - wait for user to finish editing
  };
  
  // Save content to memory vault
  const handleSave = async () => {
    try {
      // Save to memory vault or backend
      console.log('Saving content to memory vault:', content.length, 'characters');
      
      // Notify parent to clear editing mode
      if (onAIMessage) {
        onAIMessage({ type: 'save' });
      }
      
      // You can add actual save logic here
      // For now, just update parent and show confirmation
      if (onContentUpdate) {
        onContentUpdate(content);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Show success message
      if (onAIMessage) {
        onAIMessage({
          type: 'system',
          content: 'Content saved to Memory Vault successfully!'
        });
      }
    } catch (error) {
      console.error('Error saving content:', error);
      if (onAIMessage) {
        onAIMessage({
          type: 'error',
          content: 'Failed to save content. Please try again.'
        });
      }
    }
  };
  
  // Handle AI-powered editing
  const handleAiEdit = async () => {
    if (!aiEditPrompt.trim()) return;
    
    try {
      // Send edit request with special flag to indicate it's an edit request
      if (onAIMessage) {
        onAIMessage({
          type: 'edit_request',
          content: aiEditPrompt,
          currentContent: content,
          metadata: {
            contentType: contentType,
            tone: tone
          }
        });
      }
      
      setShowAiEdit(false);
      setAiEditPrompt('');
    } catch (error) {
      console.error('Error with AI edit:', error);
    }
  };
  
  // Handle return to generator
  const handleReturnToGenerator = () => {
    // Notify parent to clear editing mode
    if (onAIMessage) {
      onAIMessage({ type: 'close' });
    }
    
    setContent('');
    setContentType(null);
    setTone(null);
    setReadyToGenerate(false);
    setEditMode(false);
    setHasProcessedContent(false);
    // Clear the parent's generated content too
    if (onContentUpdate) {
      onContentUpdate('');
    }
    if (onAIMessage) {
      onAIMessage({
        type: 'system',
        content: 'Returned to Content Generator. Select a content type to begin!'
      });
    }
  };
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#e8e8e8',
      position: 'relative'
    }}>
      {/* When content exists, show full content view - hide everything else */}
      {content ? (
        <div style={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Minimal header with content info */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {(() => {
                const type = contentTypes.find(t => t.id === contentType);
                if (!type) return null;
                const Icon = type.icon;
                return (
                  <>
                    <Icon size={16} style={{ color: type.color }} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {type.name}
                    </span>
                  </>
                );
              })()}
              {currentContentType && (
                <div style={{
                  background: 'rgba(124, 58, 237, 0.8)',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Bot size={10} />
                  AI Generated
                </div>
              )}
            </div>
            
            {/* Action buttons - Top row */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Return/Close button */}
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
                title="Return to Content Generator"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: editMode 
                    ? 'rgba(124, 58, 237, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
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
              
              {/* AI Edit button */}
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
          
          {/* AI Edit Panel - Shows when AI Edit is clicked */}
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
                placeholder="How would you like to edit this content? (e.g., 'Make it shorter', 'Add more details', 'Change tone to formal')"
                value={aiEditPrompt}
                onChange={(e) => setAiEditPrompt(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAiEdit();
                  }
                }}
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
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {/* Full content area */}
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
          
          {/* Bottom action buttons - Save and Download */}
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
                border: saved 
                  ? '1px solid rgba(16, 185, 129, 0.3)' 
                  : 'none',
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
              {saved ? 'Saved to Memory Vault!' : 'Save to Memory Vault'}
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
              Download as File
            </button>
          </div>
        </div>
      ) : (
        /* Selection interface when no content */
        <>
          {/* Selection Panel - Only when no content */}
          <div style={{ 
            padding: '1.5rem',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            {/* Content Type Selection */}
        <h3 style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          marginBottom: '0.75rem',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Content Type
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {contentTypes.map(type => {
            const Icon = type.icon;
            const isSelected = contentType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => handleContentTypeSelect(type.id)}
                style={{
                  padding: '0.75rem',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${type.color}30, ${type.color}15)` 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected 
                    ? type.color 
                    : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '8px',
                  color: isSelected ? type.color : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s',
                  fontSize: '12px',
                  fontWeight: isSelected ? '600' : '400',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected 
                    ? `0 4px 12px ${type.color}20`
                    : 'none'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <Icon size={20} />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tone Selection */}
        <h3 style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          marginBottom: '0.75rem',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Tone & Style
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem'
        }}>
          {toneOptions.map(toneOption => {
            const isSelected = tone === toneOption.id;
            return (
              <button
                key={toneOption.id}
                onClick={() => handleToneSelect(toneOption.id)}
                style={{
                  padding: '0.75rem',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.15))' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected 
                    ? 'rgba(124, 58, 237, 0.5)' 
                    : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '6px',
                  color: isSelected ? '#c4b5fd' : '#e8e8e8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected 
                    ? '0 2px 8px rgba(124, 58, 237, 0.2)'
                    : 'none'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '2px' }}>
                  {toneOption.name}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: isSelected ? '#a78bfa' : '#6b7280'
                }}>
                  {toneOption.description}
                </div>
              </button>
            );
          })}
        </div>
        
        
        {/* Interactive Questions Section - Shows when both type and tone are selected */}
        {contentType && tone && !content && (
          <div style={{ 
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(124, 58, 237, 0.05)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            borderRadius: '8px'
          }}>
            <h3 style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              marginBottom: '0.75rem',
              color: '#c4b5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <HelpCircle size={14} />
              Answer these to improve your content:
            </h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {getContentTypeQuestions(contentType).slice(0, 3).map((question, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder={question.replace('• ', '')}
                    value={answers[index] || ''}
                    onChange={(e) => {
                      setAnswers({ ...answers, [index]: e.target.value });
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        if (onAIMessage) {
                          onAIMessage({
                            type: 'user',
                            content: e.target.value
                          });
                        }
                        e.target.value = '';
                      }
                    }}
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
                    onClick={() => {
                      if (answers[index]) {
                        if (onAIMessage) {
                          onAIMessage({
                            type: 'user',
                            content: answers[index]
                          });
                        }
                        setAnswers({ ...answers, [index]: '' });
                      }
                    }}
                    disabled={!answers[index]}
                    style={{
                      padding: '0.5rem',
                      background: answers[index] ? '#7c3aed' : 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '6px',
                      color: answers[index] ? 'white' : '#6b7280',
                      cursor: answers[index] ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Generate/Clear Buttons - Only show when both selections are made */}
        {contentType && tone && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontWeight: '500',
                fontSize: '12px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {content ? 'Regenerate' : 'Generate Content'}
                </>
              )}
            </button>
            
            <span style={{
              fontSize: '11px',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Or tell me what you need in the chat
            </span>
            
            {content && (
              <button
                onClick={() => {
                  setContent('');
                  setContentType(null);
                  setTone(null);
                  setReadyToGenerate(false);
                  if (onAIMessage) {
                    onAIMessage({
                      type: 'system',
                      content: 'Content cleared. Select a new content type and tone to start fresh, or tell me what you need!'
                    });
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={14} />
                Reset
              </button>
            )}
          </div>
        )}
      </div>
      
        </>
      )}
          
      
      {/* AI Integration Indicator */}
      {currentContentType && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(124, 58, 237, 0.8)',
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          zIndex: 10
        }}>
          <Bot size={12} />
          AI Assisted
        </div>
      )}
    </div>
  );
};

export default ContentGeneratorModule;