/**
 * Adaptive Niv Assistant - Platform-wide AI Assistant
 * Conversational content generation with step-by-step guidance
 * Adaptive learning from user interactions and preferences
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Bot, Send, Sparkles, TrendingUp, Users, 
  AlertCircle, Target, Calendar, MessageSquare,
  Brain, Zap, ChevronRight, Loader, FileText,
  Settings, Lightbulb, CheckCircle, ArrowRight,
  Edit3, Save, Copy, Download, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import supabaseApiService from '../services/supabaseApiService';
import SaveToMemoryVaultButton from './MemoryVault/SaveToMemoryVaultButton';

const AdaptiveNivAssistant = ({ 
  onContentGenerated, 
  onStrategyGenerated, 
  initialMode = 'general',
  className = '',
  style = {} 
}) => {
  const { user } = useAuth();
  const { selectedProject } = useProject();
  
  // Core state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mode, setMode] = useState(initialMode);
  const messagesEndRef = useRef(null);

  // Content generation state
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentContentType, setCurrentContentType] = useState(null);
  const [gatheringInfo, setGatheringInfo] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentAnalysis, setContentAnalysis] = useState(null);
  
  // Adaptive learning state
  const [userPreferences, setUserPreferences] = useState({});
  const [adaptivePersonality, setAdaptivePersonality] = useState({});
  const [conversationContext, setConversationContext] = useState({});

  // Niv's enhanced personality with adaptive traits
  const basePersonality = {
    name: 'Niv',
    title: 'Your AI PR Assistant',
    experience: '20+ years of collective knowledge',
    style: 'Adaptive to your working style',
    strengths: ['Strategic Thinking', 'Content Creation', 'Adaptive Learning', 'Multi-modal Support'],
    tone: 'professional', // Will adapt based on user preferences
    communicationStyle: 'conversational', // Will adapt based on interactions
    expertiseAreas: ['PR Strategy', 'Content Generation', 'Media Relations', 'Crisis Management', 'Campaign Planning']
  };

  // Content type questions for conversational generation
  const contentQuestions = {
    'press-release': [
      { key: 'announcement', question: "What's the main news you're announcing?", type: 'textarea' },
      { key: 'company', question: "What's your company name and industry?", type: 'text' },
      { key: 'metrics', question: "Do you have specific numbers, dates, or metrics to highlight?", type: 'textarea', optional: true },
      { key: 'quotes', question: "Would you like to include any executive quotes? If so, what should they say?", type: 'textarea', optional: true },
      { key: 'timing', question: "When should this news be released, and what are the next steps?", type: 'text', optional: true }
    ],
    'social-post': [
      { key: 'platform', question: "Which social platform is this for? (LinkedIn, Twitter, Instagram, etc.)", type: 'text' },
      { key: 'message', question: "What's the key message you want to share?", type: 'textarea' },
      { key: 'tone', question: "What tone should this have? (Professional, casual, inspiring, urgent, etc.)", type: 'text' },
      { key: 'cta', question: "What action do you want people to take after reading this?", type: 'text', optional: true }
    ],
    'media-pitch': [
      { key: 'outlet', question: "Which media outlet or journalist are you pitching to?", type: 'text' },
      { key: 'story_angle', question: "What's your story angle? Why should they care?", type: 'textarea' },
      { key: 'newsworthiness', question: "What makes this newsworthy right now?", type: 'textarea' },
      { key: 'exclusivity', question: "Are you offering any exclusive access, data, or interviews?", type: 'text', optional: true }
    ],
    'crisis-response': [
      { key: 'situation', question: "What happened? Give me the key facts.", type: 'textarea' },
      { key: 'impact', question: "Who was affected and how?", type: 'textarea' },
      { key: 'actions', question: "What steps are you taking to address this?", type: 'textarea' },
      { key: 'timeline', question: "When will you provide updates, and what are next steps?", type: 'text' }
    ]
  };

  // Quick action prompts with conversational generation
  const quickActions = [
    { 
      id: 'content', 
      label: 'Create Content', 
      icon: FileText, 
      prompt: 'I need help creating content',
      description: 'Generate any type of PR content with guided questions'
    },
    { 
      id: 'strategy', 
      label: 'PR Strategy', 
      icon: Target, 
      prompt: 'Help me develop a PR strategy for',
      description: 'Strategic planning and campaign development'
    },
    { 
      id: 'media', 
      label: 'Media Relations', 
      icon: Users, 
      prompt: 'I need media advice about',
      description: 'Journalist outreach and relationship building'
    },
    { 
      id: 'crisis', 
      label: 'Crisis Help', 
      icon: AlertCircle, 
      prompt: 'I need crisis communication help with',
      description: 'Urgent crisis communication support'
    },
    { 
      id: 'optimize', 
      label: 'Optimize Content', 
      icon: BarChart3, 
      prompt: 'Review and improve this content:',
      description: 'Analyze and enhance existing content'
    }
  ];

  // Initialize Niv with adaptive welcome
  useEffect(() => {
    initializeNiv();
    loadUserPreferences();
  }, [user, selectedProject]);

  // Load user preferences and adapt Niv's personality
  const loadUserPreferences = () => {
    const stored = localStorage.getItem(`niv-preferences-${user?.id || 'default'}`);
    if (stored) {
      const prefs = JSON.parse(stored);
      setUserPreferences(prefs);
      
      // Adapt personality based on preferences
      setAdaptivePersonality({
        ...basePersonality,
        tone: prefs.preferredTone || basePersonality.tone,
        communicationStyle: prefs.communicationStyle || basePersonality.communicationStyle,
        detailLevel: prefs.detailLevel || 'balanced'
      });
    } else {
      setAdaptivePersonality(basePersonality);
    }
  };

  const initializeNiv = () => {
    const welcomeMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `Hi! I'm Niv, your adaptive AI PR assistant. I learn from our conversations to better support your communication goals.

I can help you with:
✨ **Content Creation** - I'll ask the right questions to create exactly what you need
🎯 **PR Strategy** - Strategic planning tailored to your industry and goals  
📱 **Social Media** - Platform-optimized content that drives engagement
📰 **Media Relations** - Journalist outreach and relationship building
🚨 **Crisis Communication** - Rapid response and reputation management

${selectedProject ? `I see you're working on "${selectedProject.name}". ` : ''}What would you like to work on today?`,
      timestamp: new Date().toISOString(),
      adaptive: true
    };
    
    setMessages([welcomeMessage]);
    setConversationId(Date.now().toString());
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Conversational content generation flow
  const startContentGeneration = async (contentType) => {
    setIsGeneratingContent(true);
    setCurrentContentType(contentType);
    setGatheringInfo(true);
    setCurrentStep(0);
    setCollectedInfo({});

    const questions = contentQuestions[contentType];
    if (!questions || questions.length === 0) {
      // Fallback to general content creation
      const message = {
        id: Date.now(),
        role: 'assistant',
        content: `I'd love to help you create ${contentType.replace('-', ' ')} content! Tell me what you have in mind, and I'll guide you through creating something great.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, message]);
      setIsGeneratingContent(false);
      return;
    }

    // Start with first question
    askNextQuestion(questions, 0, {});
  };

  const askNextQuestion = (questions, stepIndex, currentInfo) => {
    if (stepIndex >= questions.length) {
      // All questions answered, generate content
      generateContentFromInfo(currentInfo);
      return;
    }

    const question = questions[stepIndex];
    const progressPercent = Math.round((stepIndex / questions.length) * 100);
    
    const message = {
      id: Date.now(),
      role: 'assistant',
      content: `**Step ${stepIndex + 1} of ${questions.length}** (${progressPercent}% complete)

${question.question}

${question.optional ? '*This is optional - you can skip by typing "skip" or just hit enter.*' : ''}

💡 **Tip:** Be as specific as possible. The more detail you provide, the better content I can create for you.`,
      timestamp: new Date().toISOString(),
      waitingForInput: true,
      questionKey: question.key,
      questionType: question.type,
      isOptional: question.optional,
      currentStep: stepIndex,
      totalSteps: questions.length
    };
    
    setMessages(prev => [...prev, message]);
    setCurrentStep(stepIndex);
  };

  const generateContentFromInfo = async (info) => {
    setGatheringInfo(false);
    
    const summaryMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `Perfect! I have all the information I need. Let me create your ${currentContentType.replace('-', ' ')} now...

**What I'm creating:**
${Object.entries(info).map(([key, value]) => `• ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`).join('\n')}

✨ **Generating your content now...**`,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, summaryMessage]);
    setLoading(true);

    try {
      const prompt = `Create a ${currentContentType} with the following information:\n\n${Object.entries(info).map(([key, value]) => `${key}: ${value}`).join('\n\n')}`;
      
      const response = await supabaseApiService.generateContent(currentContentType, {
        prompt,
        type: currentContentType,
        tone: adaptivePersonality.tone,
        projectId: selectedProject?.id,
        companyName: selectedProject?.name || user?.company || 'the company',
        industry: selectedProject?.industry || 'technology',
        context: {
          userPreferences,
          conversationHistory: messages.slice(-5),
          collectedInfo: info
        }
      });

      const content = response.content || response.data?.content || response.message || response;
      setGeneratedContent(content);
      
      const contentMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `🎉 **Here's your ${currentContentType.replace('-', ' ')}:**

${content}

---

**What would you like to do now?**
• Ask me to make changes ("make it more casual", "add statistics", etc.)
• Generate a different version with different tone
• Create additional content for this campaign
• Analyze the performance potential of this content

I can adapt and refine this until it's exactly what you need!`,
        timestamp: new Date().toISOString(),
        generatedContent: content,
        contentType: currentContentType,
        showContentActions: true
      };
      
      setMessages(prev => [...prev, contentMessage]);
      
      // Update user preferences based on this interaction
      updateUserPreferences({
        lastContentType: currentContentType,
        lastGeneratedAt: new Date().toISOString(),
        preferredDetailLevel: Object.keys(info).length > 3 ? 'detailed' : 'concise'
      });
      
      if (onContentGenerated) {
        onContentGenerated(content, currentContentType);
      }
      
    } catch (error) {
      console.error('Content generation error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I apologize, but I encountered an issue generating your content. Let me try a different approach. Could you give me a brief description of what you'd like me to create, and I'll work with that?`,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsGeneratingContent(false);
      setCurrentContentType(null);
    }
  };

  // Handle user input during content generation flow
  const handleContentGenerationInput = (text, currentMessage) => {
    const questions = contentQuestions[currentContentType];
    const currentInfo = { ...collectedInfo };
    
    // Handle skip for optional questions
    if (currentMessage.isOptional && (text.toLowerCase() === 'skip' || text.trim() === '')) {
      // Skip this question, move to next
      const nextStep = currentMessage.currentStep + 1;
      if (nextStep < questions.length) {
        askNextQuestion(questions, nextStep, currentInfo);
      } else {
        generateContentFromInfo(currentInfo);
      }
      return;
    }
    
    // Store the answer
    currentInfo[currentMessage.questionKey] = text;
    setCollectedInfo(currentInfo);
    
    // Move to next question or generate content
    const nextStep = currentMessage.currentStep + 1;
    if (nextStep < questions.length) {
      askNextQuestion(questions, nextStep, currentInfo);
    } else {
      generateContentFromInfo(currentInfo);
    }
  };

  // Main message sending function
  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Check if we're in content generation flow
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.waitingForInput && isGeneratingContent) {
      handleContentGenerationInput(text, lastMessage);
      return;
    }

    setLoading(true);

    try {
      // Detect content creation requests
      const contentTypeMatch = text.match(/create|write|generate|help.*with.*(press release|social post|media pitch|crisis|content)/i);
      if (contentTypeMatch && !isGeneratingContent) {
        // Ask what type of content they want
        const contentTypeQuestion = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `I'd love to help you create content! What type would you like to work on?

**Quick Options:**
• Press Release - Company announcements and news
• Social Media Post - Engaging platform content  
• Media Pitch - Journalist outreach
• Crisis Response - Urgent communications
• Other - Tell me what you have in mind

Just tell me the type, and I'll guide you through creating exactly what you need with the right questions.`,
          timestamp: new Date().toISOString(),
          waitingForContentType: true
        };
        
        setMessages(prev => [...prev, contentTypeQuestion]);
        setLoading(false);
        return;
      }

      // Handle content type selection
      if (lastMessage?.waitingForContentType) {
        const typeMapping = {
          'press': 'press-release',
          'social': 'social-post', 
          'media': 'media-pitch',
          'pitch': 'media-pitch',
          'crisis': 'crisis-response'
        };
        
        const detectedType = Object.keys(typeMapping).find(key => 
          text.toLowerCase().includes(key)
        );
        
        if (detectedType) {
          startContentGeneration(typeMapping[detectedType]);
        } else {
          // Generic content creation
          startContentGeneration('general');
        }
        setLoading(false);
        return;
      }

      // Regular conversation with adaptive responses
      const response = await generateAdaptiveResponse(text);
      
      const nivMessage = {
        id: Date.now() + 1,
        role: 'assistant', 
        content: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, nivMessage]);
      
      // Learn from this interaction
      updateConversationContext(text, response);
      
    } catch (error) {
      console.error('Error in conversation:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I encountered a technical issue, but I'm still here to help! Could you try rephrasing your request, or let me know if you'd like to start with creating some content?`,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Generate adaptive responses based on user patterns
  const generateAdaptiveResponse = async (userInput) => {
    // Use the existing AI content generation with enhanced context
    const contextualPrompt = `As Niv, an adaptive AI PR assistant, respond to: "${userInput}"
    
Context:
- User preferences: ${JSON.stringify(userPreferences)}
- Current project: ${selectedProject?.name || 'None'}
- Communication style: ${adaptivePersonality.communicationStyle}
- Previous interactions: ${messages.slice(-3).map(m => `${m.role}: ${m.content.substring(0, 100)}`).join(' | ')}

Respond helpfully and adapt your tone to match the user's preferred communication style.`;

    try {
      const response = await supabaseApiService.sendClaudeMessage(contextualPrompt, {
        type: 'conversation',
        tone: adaptivePersonality.tone,
        projectId: selectedProject?.id,
        companyName: selectedProject?.name || user?.company || 'your company',
        context: { userPreferences, conversationHistory: messages.slice(-5) }
      });
      
      return response.content || response.data?.content || response.message || "I understand what you're looking for. How can I help you achieve that goal?";
    } catch (error) {
      return "I'm here to help with your PR and content needs. What would you like to work on?";
    }
  };

  // Update user preferences based on interactions
  const updateUserPreferences = (newPrefs) => {
    const updated = { ...userPreferences, ...newPrefs, lastUpdated: new Date().toISOString() };
    setUserPreferences(updated);
    localStorage.setItem(`niv-preferences-${user?.id || 'default'}`, JSON.stringify(updated));
  };

  const updateConversationContext = (userInput, response) => {
    const context = {
      ...conversationContext,
      lastInteraction: new Date().toISOString(),
      totalMessages: messages.length + 2,
      topics: [...(conversationContext.topics || []), extractTopics(userInput)].slice(-10),
      userSentiment: analyzeSentiment(userInput)
    };
    setConversationContext(context);
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    if (action.id === 'content') {
      startContentGeneration('general');
    } else {
      setInput(action.prompt + ' ');
      setMode(action.id);
      document.getElementById('niv-input')?.focus();
    }
  };

  // Analyze generated content
  const analyzeGeneratedContent = async (content) => {
    try {
      const analysis = await supabaseApiService.sendClaudeMessage(
        `Analyze this ${currentContentType}: ${content}`,
        {
          action: 'analyzeContent',
          contentType: currentContentType,
          tone: adaptivePersonality.tone,
          user_id: user?.id,
          company: selectedProject?.name || user?.company,
          industry: selectedProject?.industry || 'technology',
          projectId: selectedProject?.id,
        }
      );
      
      setContentAnalysis(analysis.analysis);
      
      const analysisMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `📊 **Content Analysis Complete**

**Overall Score: ${analysis.analysis.overallScore}%**

**Key Insights:**
${analysis.analysis.insights?.strengths?.map(s => `✅ ${s}`).join('\n') || ''}
${analysis.analysis.insights?.improvements?.map(i => `💡 ${i}`).join('\n') || ''}

Would you like me to revise the content based on these insights?`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  // Helper functions
  const extractTopics = (text) => {
    // Simple topic extraction - in production, use NLP
    const keywords = text.toLowerCase().match(/\b(?:strategy|content|media|crisis|campaign|social|press|pitch|brand|marketing)\b/g);
    return keywords ? [...new Set(keywords)] : [];
  };

  const analyzeSentiment = (text) => {
    // Simple sentiment analysis - in production, use AI
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'perfect', 'love', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'frustrated', 'problem', 'issue'];
    
    const positive = positiveWords.some(word => text.toLowerCase().includes(word));
    const negative = negativeWords.some(word => text.toLowerCase().includes(word));
    
    return positive ? 'positive' : negative ? 'negative' : 'neutral';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      className={`adaptive-niv-assistant ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Enhanced Header */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Brain size={24} color="white" />
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                background: '#10b981',
                borderRadius: '50%',
                border: '2px solid rgba(0,0,0,0.3)'
              }} />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#e8e8e8',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {adaptivePersonality.name}
                <Sparkles size={16} color="#a78bfa" />
              </h2>
              <p style={{ 
                fontSize: '13px', 
                color: '#9ca3af',
                margin: '2px 0 0 0'
              }}>
                {adaptivePersonality.title} • Adaptive AI • Learning from {messages.length} interactions
              </p>
            </div>
          </div>
          
          {/* Status indicators */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '11px' }}>
              {adaptivePersonality.strengths?.slice(0, 3).map(strength => (
                <span key={strength} style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#a78bfa'
                }}>
                  {strength}
                </span>
              ))}
            </div>
            {selectedProject && (
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                Context: {selectedProject.name}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.25rem',
                  padding: '0.75rem',
                  background: mode === action.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${mode === action.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: '#e8e8e8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={e => {
                  if (mode !== action.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={14} />
                  <span style={{ fontWeight: '500' }}>{action.label}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {action.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages with enhanced content generation */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              animation: 'fadeIn 0.3s ease-in'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: message.role === 'user' 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {message.role === 'user' ? (
                <User size={16} color="#60a5fa" />
              ) : (
                <Bot size={16} color="white" />
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: message.role === 'user' ? '#60a5fa' : '#a78bfa'
                }}>
                  {message.role === 'user' ? 'You' : adaptivePersonality.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.error && (
                  <span style={{
                    fontSize: '11px',
                    color: '#ef4444',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '10px'
                  }}>
                    Connection Issue
                  </span>
                )}
                {message.adaptive && (
                  <span style={{
                    fontSize: '11px',
                    color: '#10b981',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '10px'
                  }}>
                    Adaptive
                  </span>
                )}
              </div>
              
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#e8e8e8',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </div>

              {/* Content action buttons */}
              {message.showContentActions && message.generatedContent && (
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <SaveToMemoryVaultButton
                    content={message.generatedContent}
                    title={`${message.contentType} - ${new Date().toLocaleDateString()}`}
                    type="content"
                    source="niv-assistant"
                    folder_type="content"
                    tags={[message.contentType, adaptivePersonality.tone, "niv-generated"]}
                    metadata={{
                      generated_at: message.timestamp,
                      project_id: selectedProject?.id,
                      content_type: message.contentType,
                      tone: adaptivePersonality.tone,
                      conversation_id: conversationId
                    }}
                    style={{
                      fontSize: '12px',
                      padding: '0.5rem 0.75rem'
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.generatedContent);
                      alert('✅ Content copied to clipboard!');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '12px',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#e8e8e8',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                  
                  <button
                    onClick={() => analyzeGeneratedContent(message.generatedContent)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '12px',
                      padding: '0.5rem 0.75rem',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <BarChart3 size={12} /> Analyze
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader size={16} color="white" className="animate-spin" />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              {isGeneratingContent 
                ? `Creating your ${currentContentType?.replace('-', ' ')}...` 
                : "Niv is thinking strategically..."}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <input
            id="niv-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isGeneratingContent 
                ? "Type your answer here..." 
                : "Ask me anything about PR, content, or strategy..."
            }
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e8e8e8',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading || !input.trim() 
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: loading || !input.trim() ? '#6b7280' : 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
            {isGeneratingContent ? 'Next' : 'Send'}
          </button>
        </div>
        
        {/* Progress indicator for content generation */}
        {isGeneratingContent && gatheringInfo && (
          <div style={{
            marginTop: '0.75rem',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.25rem'
            }}>
              <span>Creating {currentContentType?.replace('-', ' ')}...</span>
              <span>{currentStep + 1} of {contentQuestions[currentContentType]?.length || 0}</span>
            </div>
            <div style={{
              width: '100%',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentStep + 1) / (contentQuestions[currentContentType]?.length || 1)) * 100}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveNivAssistant;