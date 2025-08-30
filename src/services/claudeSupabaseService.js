/**
 * Claude AI Service - Integrated with Supabase Edge Functions
 * This service handles all Claude AI interactions through Supabase
 */

import { supabase } from '../config/supabase';

class ClaudeSupabaseService {
  constructor() {
    this.isConfigured = false;
    this.checkConfiguration();
  }

  /**
   * Check if Supabase is properly configured
   */
  async checkConfiguration() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.isConfigured = !!user;
      return this.isConfigured;
    } catch (error) {
      console.warn('Supabase not configured:', error);
      return false;
    }
  }

  /**
   * Call Claude through Supabase Edge Function
   */
  async callClaude(prompt, options = {}) {
    try {
      console.log('Calling Claude through Supabase Edge Function...');
      
      // Check if Supabase is configured
      if (!this.isConfigured) {
        console.warn('Supabase not configured, checking again...');
        await this.checkConfiguration();
        if (!this.isConfigured) {
          throw new Error('Supabase authentication required for Claude API');
        }
      }
      
      // Use Supabase Edge Function for Claude integration
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          prompt,
          ...options,
          model: options.model || 'claude-sonnet-4-20250514',
          max_tokens: options.max_tokens || 1000
        }
      });

      if (error) {
        console.error('Supabase Edge Function error:', error);
        throw error;
      }
      
      console.log('Claude response received via Supabase');
      return data;
    } catch (error) {
      console.error('Claude API error through Supabase:', error);
      
      // Fallback to backend API if Supabase fails
      console.log('Attempting fallback to backend Claude API...');
      try {
        const response = await fetch('/api/ai/claude/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ prompt, ...options })
        });
        
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }
        
        const result = await response.json();
        return result.message || result.content;
      } catch (backendError) {
        console.error('Backend fallback also failed:', backendError);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Analyze content with Claude for monitoring
   */
  async analyzeForMonitoring(content, targetName, targetType) {
    const prompt = `Analyze this ${targetType} content about ${targetName} for PR relevance and opportunities. 
    
Content: ${content.substring(0, 2000)}

Provide analysis in JSON format with:
1. relevance_score (0-100)
2. sentiment (positive/negative/neutral)
3. key_insights (array of strings)
4. opportunities (array of opportunities with title and description)
5. recommended_actions (array of action items)`;

    try {
      const response = await this.callClaude(prompt, {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500
      });

      // Parse the response
      if (typeof response === 'string') {
        try {
          return JSON.parse(response);
        } catch {
          return {
            relevance_score: 50,
            sentiment: 'neutral',
            key_insights: [response],
            opportunities: [],
            recommended_actions: []
          };
        }
      }
      return response;
    } catch (error) {
      console.error('Monitoring analysis error:', error);
      return null;
    }
  }

  /**
   * Generate content with Claude
   */
  async generateContent(type, context) {
    const prompts = {
      press_release: `Write a professional press release for: ${context.topic}
        Company: ${context.company || 'the organization'}
        Key points: ${context.keyPoints || 'to be determined'}
        Format: FOR IMMEDIATE RELEASE format with headline, subheadline, body, about section, and contact info`,
      
      social_post: `Create engaging social media posts for: ${context.topic}
        Platform: ${context.platform || 'LinkedIn/Twitter'}
        Tone: ${context.tone || 'professional'}
        Include hashtags and call-to-action`,
      
      qa_document: `Create a Q&A document for: ${context.topic}
        Audience: ${context.audience || 'media and stakeholders'}
        Include 8-10 common questions with comprehensive answers`,
      
      pitch: `Write a media pitch for: ${context.topic}
        Target: ${context.journalist || 'journalist'}
        Publication: ${context.publication || 'major outlet'}
        Hook: ${context.hook || 'newsworthy angle'}`
    };

    const prompt = prompts[type] || `Generate ${type} content for: ${JSON.stringify(context)}`;

    try {
      const response = await this.callClaude(prompt, {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000
      });

      return response;
    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze opportunity with NVS framework
   */
  async analyzeOpportunity(opportunityData) {
    const prompt = `Analyze this PR opportunity using the Narrative Vacuum Score (NVS) framework:

${JSON.stringify(opportunityData, null, 2)}

Provide comprehensive analysis with:
1. NVS Score (1-100) with detailed breakdown:
   - Media Demand (0-100)
   - Competitor Absence (0-100)
   - Client Strength (0-100)
   - Time Decay (0-100)
   - Market Saturation (0-100)
2. Key opportunity elements
3. Execution recommendations
4. Risk assessment
5. Success probability

Return as JSON.`;

    try {
      const response = await this.callClaude(prompt, {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500
      });

      if (typeof response === 'string') {
        try {
          return JSON.parse(response);
        } catch {
          return { analysis: response };
        }
      }
      return response;
    } catch (error) {
      console.error('Opportunity analysis error:', error);
      throw error;
    }
  }

  /**
   * Chat with Claude for general AI assistance
   */
  async chat(message, context = {}) {
    const systemPrompt = `You are an AI assistant for SignalDesk, a PR intelligence platform. 
    Help users with content creation, media strategy, campaign planning, and PR intelligence.
    Be concise, professional, and actionable in your responses.`;

    const prompt = `${systemPrompt}

Context: ${JSON.stringify(context)}
User: ${message}