/**
 * Niv Production Service
 * Works with both direct API (dev) and proxy server (production)
 */

import { supabase } from '../config/supabase';

class NivProductionService {
  constructor() {
    // Detect environment
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // API configuration
    this.apiProxyUrl = process.env.REACT_APP_API_PROXY_URL || 'http://localhost:3001';
    this.useProxy = process.env.REACT_APP_USE_PROXY === 'true';
    
    // Direct API keys (dev only)
    this.claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Smart API calling - uses proxy in production, direct in dev
   */
  async callAI(messages, systemPrompt) {
    if (this.useProxy) {
      return this.callViaProxy(messages, systemPrompt);
    } else {
      return this.callDirectAPI(messages, systemPrompt);
    }
  }

  /**
   * Call via proxy server (production)
   */
  async callViaProxy(messages, systemPrompt) {
    try {
      // Try Claude first
      const response = await fetch(`${this.apiProxyUrl}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0].text;
      }

      // Fallback to OpenAI
      const openaiResponse = await fetch(`${this.apiProxyUrl}/api/openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        return data.choices[0].message.content;
      }

      throw new Error('Both AI services unavailable');
    } catch (error) {
      console.error('Proxy API error:', error);
      throw error;
    }
  }

  /**
   * Call direct API (development)
   */
  async callDirectAPI(messages, systemPrompt) {
    // Check localStorage for keys if not in env
    const claudeKey = this.claudeApiKey || localStorage.getItem('claude_api_key');
    const openaiKey = this.openaiApiKey || localStorage.getItem('openai_api_key');

    if (!claudeKey && !openaiKey) {
      throw new Error('No API keys configured. Please add them in settings.');
    }

    // Try Claude first
    if (claudeKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.7,
            system: systemPrompt,
            messages: messages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.content[0].text;
        }
      } catch (error) {
        console.warn('Claude API failed:', error);
      }
    }

    // Fallback to OpenAI
    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    }

    throw new Error('Failed to call AI APIs');
  }

  /**
   * Process message with intelligent content detection
   */
  async processMessage(message, conversationHistory) {
    const systemPrompt = this.getSystemPrompt();
    const fullHistory = [...conversationHistory, { role: 'user', content: message }];
    
    try {
      const response = await this.callAI(fullHistory, systemPrompt);
      const artifact = this.detectArtifact(message, response, conversationHistory);
      
      // Save to database
      await this.saveToDatabase(message, response, artifact);
      
      return {
        chatMessage: artifact ? this.getArtifactSummary(artifact) : response,
        artifact: artifact
      };
    } catch (error) {
      console.error('Process message error:', error);
      throw error;
    }
  }

  getSystemPrompt() {
    return `You are Niv, SignalDesk's elite AI PR strategist. Your mission is to transform how organizations approach public relations through strategic insights and tactical excellence.

    CONSULTATION APPROACH:
    - For content requests (media lists, press releases, etc.), first gather context through 2-3 specific questions
    - Ask about: company/product details, target audience, timeline, goals, tone preferences
    - After sufficient context (2+ exchanges), generate comprehensive content

    CONTENT GENERATION:
    When creating PR materials, ensure they are:
    - Professional and publication-ready
    - Detailed with specific examples and data points
    - Structured with clear sections and formatting
    - Actionable with next steps

    EXPERTISE AREAS:
    - Media relations and journalist outreach
    - Press release writing and distribution strategy
    - Crisis communications and management
    - Brand messaging and positioning
    - Social media strategy
    - Executive thought leadership
    - PR campaign planning and execution

    Be conversational yet professional. You're a strategic partner, not just a tool.`;
  }

  detectArtifact(userMessage, aiResponse, history) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if we have enough consultation (2+ exchanges)
    const exchanges = history.filter((msg, idx) => 
      msg.role === 'user' && history[idx + 1]?.role === 'assistant'
    ).length;
    
    if (exchanges < 2) return null;

    // Content type detection
    const contentTypes = {
      'media-list': ['media list', 'journalist list', 'reporter list', 'press contacts'],
      'press-release': ['press release', 'announcement', 'news release'],
      'strategic-plan': ['strategic plan', 'pr strategy', 'campaign plan'],
      'social-content': ['social media', 'social posts', 'twitter', 'linkedin'],
      'key-messaging': ['key messages', 'messaging', 'talking points'],
      'faq-document': ['faq', 'frequently asked questions', 'q&a']
    };

    for (const [type, triggers] of Object.entries(contentTypes)) {
      for (const trigger of triggers) {
        if (lowerMessage.includes(trigger)) {
          return this.createArtifact(type, aiResponse);
        }
      }
    }

    // Check if response is substantial strategic content
    if (aiResponse.length > 800 && this.isStrategicContent(aiResponse)) {
      return this.createArtifact('strategic-advice', aiResponse);
    }

    return null;
  }

  isStrategicContent(text) {
    const strategicKeywords = [
      'strategy', 'framework', 'approach', 'plan', 'tactical',
      'campaign', 'objectives', 'metrics', 'timeline', 'budget'
    ];
    
    const matches = strategicKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    return matches.length >= 3;
  }

  createArtifact(type, content) {
    return {
      id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      title: this.generateTitle(type),
      content: this.parseContent(content),
      created: new Date().toISOString()
    };
  }

  generateTitle(type) {
    const titles = {
      'media-list': 'Media List - Strategic Outreach',
      'press-release': 'Press Release',
      'strategic-plan': 'PR Strategic Plan',
      'social-content': 'Social Media Content Package',
      'key-messaging': 'Key Messaging Framework',
      'faq-document': 'FAQ Document',
      'strategic-advice': 'Strategic PR Guidance'
    };
    return titles[type] || 'PR Content';
  }

  parseContent(text) {
    // Parse content into structured format
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('#')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: line.replace(/^#+\s*/, ''),
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);

    return {
      raw: text,
      sections: sections.length > 0 ? sections : [{ title: 'Content', content: [text] }],
      formatted: text
    };
  }

  getArtifactSummary(artifact) {
    const summaries = {
      'media-list': "I've created a comprehensive media list with targeted journalists and outlets. It's now available in the artifacts panel.",
      'press-release': "I've drafted a professional press release ready for distribution. You can review and edit it in the artifacts panel.",
      'strategic-plan': "I've developed a detailed PR strategic plan with timelines and objectives. Access it in the artifacts panel.",
      'social-content': "I've created a complete social media content package. The posts are ready in the artifacts panel.",
      'key-messaging': "I've developed your key messaging framework with primary and supporting messages. It's available in the artifacts panel.",
      'faq-document': "I've prepared a comprehensive FAQ document covering internal and external questions. Review it in the artifacts panel.",
      'strategic-advice': "I've provided strategic PR guidance that you may want to save. It's available in the artifacts panel."
    };
    return summaries[artifact.type] || "I've created valuable content for you. It's available in the artifacts panel.";
  }

  async saveToDatabase(userMessage, aiResponse, artifact) {
    try {
      // Save messages
      const batch = [
        {
          session_id: this.sessionId,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString()
        },
        {
          session_id: this.sessionId,
          role: 'assistant',
          content: aiResponse,
          artifact_id: artifact?.id,
          created_at: new Date().toISOString()
        }
      ];

      await supabase.from('niv_conversations').insert(batch);

      // Save artifact
      if (artifact) {
        await supabase.from('niv_artifacts').insert({
          id: artifact.id,
          session_id: this.sessionId,
          type: artifact.type,
          title: artifact.title,
          content: artifact.content,
          status: 'draft',
          created_at: artifact.created
        });
      }
    } catch (error) {
      console.error('Database save error:', error);
      // Don't throw - allow operation to continue
    }
  }

  async loadHistory(sessionId) {
    try {
      const { data } = await supabase
        .from('niv_conversations')
        .select('*')
        .eq('session_id', sessionId || this.sessionId)
        .order('created_at', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Load history error:', error);
      return [];
    }
  }

  async loadArtifacts(sessionId) {
    try {
      const { data } = await supabase
        .from('niv_artifacts')
        .select('*')
        .eq('session_id', sessionId || this.sessionId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Load artifacts error:', error);
      return [];
    }
  }

  async updateArtifact(artifactId, updates) {
    try {
      const { data } = await supabase
        .from('niv_artifacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', artifactId)
        .select()
        .single();

      return data;
    } catch (error) {
      console.error('Update artifact error:', error);
      throw error;
    }
  }

  async deleteArtifact(artifactId) {
    try {
      await supabase
        .from('niv_artifacts')
        .delete()
        .eq('id', artifactId);
    } catch (error) {
      console.error('Delete artifact error:', error);
      throw error;
    }
  }
}

export default new NivProductionService();