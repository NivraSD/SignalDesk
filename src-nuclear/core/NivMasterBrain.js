/**
 * NIV MASTER BRAIN - The Universal Intelligence Orchestrator
 * 
 * This is the core of SignalDesk - an AI that can answer any strategic question
 * by orchestrating all platform capabilities.
 */

import { MultiStageIntelligence } from '../capabilities/intelligence/MultiStageIntelligence';
import { OpportunityEngine } from '../capabilities/opportunities/OpportunityEngine';
import { ContentGenerator } from '../capabilities/content/ContentGenerator';
import { MediaListBuilder } from '../capabilities/media/MediaListBuilder';
import { CrisisCommandCenter } from '../capabilities/crisis/CrisisCommandCenter';
import { PromptLibrary } from '../orchestration/PromptLibrary';

class NivMasterBrain {
  constructor() {
    this.capabilities = {
      intelligence: new MultiStageIntelligence(),
      opportunities: new OpportunityEngine(),
      content: new ContentGenerator(),
      media: new MediaListBuilder(),
      crisis: new CrisisCommandCenter()
    };
    
    this.promptLibrary = new PromptLibrary();
    this.conversationHistory = [];
    this.context = {};
  }

  /**
   * Main entry point - process any user request
   */
  async processRequest(userInput, organization = null) {
    console.log('🧠 NIV Processing:', userInput);
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: userInput });
    
    try {
      // 1. Parse user intent and extract entities
      const intent = await this.parseIntent(userInput);
      
      // 2. Determine which capabilities are needed
      const requiredCapabilities = this.determineCapabilities(intent);
      
      // 3. Orchestrate the capabilities
      const results = await this.orchestrate(intent, requiredCapabilities, organization);
      
      // 4. Format and return response
      const response = this.formatResponse(results, intent);
      
      // Add to history
      this.conversationHistory.push({ role: 'assistant', content: response });
      
      return response;
    } catch (error) {
      console.error('🚨 NIV Error:', error);
      return this.handleError(error);
    }
  }

  /**
   * Parse user intent using pattern matching and NLP
   */
  async parseIntent(userInput) {
    const input = userInput.toLowerCase();
    
    // Check for prompt library patterns
    const libraryMatch = this.promptLibrary.matchPrompt(userInput);
    if (libraryMatch) {
      return libraryMatch;
    }
    
    // Manual intent detection
    const intent = {
      raw: userInput,
      type: 'unknown',
      entities: {},
      urgency: 'normal',
      capabilities: []
    };

    // Crisis detection
    if (input.includes('crisis') || input.includes('urgent') || input.includes('emergency')) {
      intent.type = 'crisis';
      intent.urgency = 'high';
    }
    
    // Intelligence requests
    else if (input.includes('competitor') || input.includes('intelligence') || input.includes('analyze')) {
      intent.type = 'intelligence';
    }
    
    // Opportunity detection
    else if (input.includes('opportunity') || input.includes('pr opportunity') || input.includes('trending')) {
      intent.type = 'opportunity';
    }
    
    // Content generation
    else if (input.includes('write') || input.includes('generate') || input.includes('create') || input.includes('draft')) {
      intent.type = 'content';
    }
    
    // Media/journalist requests
    else if (input.includes('journalist') || input.includes('media') || input.includes('reporter') || input.includes('pitch')) {
      intent.type = 'media';
    }
    
    // Morning briefing
    else if (input.includes('briefing') || input.includes('summary') || input.includes('update')) {
      intent.type = 'briefing';
    }
    
    // Extract entities (companies, timeframes, etc.)
    intent.entities = this.extractEntities(userInput);
    
    return intent;
  }

  /**
   * Determine which capabilities are needed based on intent
   */
  determineCapabilities(intent) {
    const capabilities = [];
    
    switch (intent.type) {
      case 'crisis':
        capabilities.push('crisis', 'intelligence', 'content');
        break;
        
      case 'intelligence':
        capabilities.push('intelligence');
        if (intent.raw.includes('opportunity')) {
          capabilities.push('opportunities');
        }
        break;
        
      case 'opportunity':
        capabilities.push('opportunities', 'intelligence');
        break;
        
      case 'content':
        capabilities.push('content');
        if (intent.raw.includes('data') || intent.raw.includes('insight')) {
          capabilities.push('intelligence');
        }
        break;
        
      case 'media':
        capabilities.push('media');
        if (intent.raw.includes('pitch')) {
          capabilities.push('content');
        }
        break;
        
      case 'briefing':
        capabilities.push('intelligence', 'opportunities', 'crisis');
        break;
        
      default:
        // Try to be smart about it
        capabilities.push('intelligence'); // Default to intelligence
    }
    
    return capabilities;
  }

  /**
   * Orchestrate capabilities to fulfill the request
   */
  async orchestrate(intent, requiredCapabilities, organization) {
    const results = {};
    
    // Handle different orchestration patterns
    
    // PATTERN 1: Crisis Response
    if (requiredCapabilities.includes('crisis')) {
      results.crisis = await this.capabilities.crisis.assess(intent.entities);
      results.intelligence = await this.capabilities.intelligence.quickScan(organization);
      results.response = await this.capabilities.content.generateCrisisResponse(results.crisis);
      return results;
    }
    
    // PATTERN 2: Intelligence + Opportunities
    if (requiredCapabilities.includes('intelligence') && requiredCapabilities.includes('opportunities')) {
      results.intelligence = await this.capabilities.intelligence.runFullPipeline(organization);
      results.opportunities = await this.capabilities.opportunities.detectOpportunities(results.intelligence);
      return results;
    }
    
    // PATTERN 3: Media Outreach
    if (requiredCapabilities.includes('media')) {
      results.journalists = await this.capabilities.media.findJournalists(intent.entities);
      
      if (requiredCapabilities.includes('content')) {
        results.pitches = await this.capabilities.content.generatePitches(
          results.journalists,
          intent.entities.topic
        );
      }
      return results;
    }
    
    // PATTERN 4: Content Generation with Intelligence
    if (requiredCapabilities.includes('content') && requiredCapabilities.includes('intelligence')) {
      results.intelligence = await this.capabilities.intelligence.gatherContext(organization);
      results.content = await this.capabilities.content.generateWithContext(
        intent.entities.contentType,
        results.intelligence
      );
      return results;
    }
    
    // PATTERN 5: Morning Briefing
    if (intent.type === 'briefing') {
      results.overnight = await this.capabilities.intelligence.getRecentDevelopments(organization);
      results.opportunities = await this.capabilities.opportunities.getTodaysOpportunities();
      results.risks = await this.capabilities.crisis.scanForRisks();
      results.briefing = await this.formatBriefing(results);
      return results;
    }
    
    // Default: Run requested capabilities independently
    for (const capability of requiredCapabilities) {
      if (this.capabilities[capability]) {
        results[capability] = await this.capabilities[capability].process(intent, organization);
      }
    }
    
    return results;
  }

  /**
   * Format the response based on results and intent
   */
  formatResponse(results, intent) {
    // Crisis response format
    if (intent.type === 'crisis') {
      return {
        type: 'crisis_response',
        urgency: 'high',
        summary: results.response.holdingStatement,
        actions: {
          immediate: results.response.immediate,
          within24h: results.response.day1,
          within72h: results.response.day3
        },
        intelligence: results.intelligence,
        fullResponse: results.response
      };
    }
    
    // Briefing format
    if (intent.type === 'briefing') {
      return {
        type: 'briefing',
        briefing: results.briefing,
        details: {
          developments: results.overnight,
          opportunities: results.opportunities,
          risks: results.risks
        }
      };
    }
    
    // Media outreach format
    if (results.journalists && results.pitches) {
      return {
        type: 'media_outreach',
        journalists: results.journalists,
        pitches: results.pitches,
        summary: `Found ${results.journalists.length} relevant journalists with personalized pitches`
      };
    }
    
    // Intelligence + Opportunities format
    if (results.intelligence && results.opportunities) {
      return {
        type: 'strategic_intelligence',
        summary: this.generateExecutiveSummary(results),
        intelligence: results.intelligence,
        opportunities: results.opportunities,
        recommendations: this.generateRecommendations(results)
      };
    }
    
    // Default format
    return {
      type: 'response',
      results: results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Extract entities from user input
   */
  extractEntities(userInput) {
    const entities = {};
    
    // Extract timeframes
    const timeframes = {
      'today': '24h',
      'this week': '7d',
      'last week': '7d',
      'this month': '30d',
      'last month': '30d',
      '48 hours': '48h',
      '24 hours': '24h'
    };
    
    for (const [phrase, value] of Object.entries(timeframes)) {
      if (userInput.toLowerCase().includes(phrase)) {
        entities.timeframe = value;
        break;
      }
    }
    
    // Extract competitor names (would be enhanced with NER)
    const knownCompetitors = ['nike', 'adidas', 'google', 'meta', 'apple', 'microsoft'];
    entities.competitors = knownCompetitors.filter(comp => 
      userInput.toLowerCase().includes(comp)
    );
    
    // Extract content types
    const contentTypes = ['blog', 'press release', 'social', 'email', 'report', 'pitch'];
    entities.contentType = contentTypes.find(type => 
      userInput.toLowerCase().includes(type)
    );
    
    return entities;
  }

  /**
   * Generate executive summary from results
   */
  generateExecutiveSummary(results) {
    const summary = [];
    
    if (results.intelligence) {
      summary.push(`Intelligence gathering complete: ${Object.keys(results.intelligence).length} data points analyzed`);
    }
    
    if (results.opportunities) {
      summary.push(`${results.opportunities.length} strategic opportunities identified`);
    }
    
    if (results.content) {
      summary.push(`Content generated: ${results.content.type}`);
    }
    
    return summary.join('. ');
  }

  /**
   * Generate strategic recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.opportunities && results.opportunities.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Act on PR opportunities',
        details: results.opportunities[0]
      });
    }
    
    if (results.intelligence && results.intelligence.risks) {
      recommendations.push({
        priority: 'medium',
        action: 'Monitor identified risks',
        details: results.intelligence.risks
      });
    }
    
    return recommendations;
  }

  /**
   * Format morning briefing
   */
  async formatBriefing(results) {
    return {
      date: new Date().toLocaleDateString(),
      executive_summary: 'Your strategic intelligence briefing',
      sections: [
        {
          title: 'Overnight Developments',
          items: results.overnight || []
        },
        {
          title: "Today's Opportunities",
          items: results.opportunities || []
        },
        {
          title: 'Risk Indicators',
          items: results.risks || []
        },
        {
          title: 'Recommended Actions',
          items: [
            'Review competitive intelligence',
            'Act on identified opportunities',
            'Monitor risk indicators'
          ]
        }
      ]
    };
  }

  /**
   * Handle errors gracefully
   */
  handleError(error) {
    return {
      type: 'error',
      message: "I encountered an issue processing your request. Let me try a different approach.",
      error: error.message,
      suggestions: [
        "Try rephrasing your request",
        "Be more specific about what you need",
        "Break down complex requests into smaller parts"
      ]
    };
  }

  /**
   * Generate summary from any results
   */
  generateSummary(results) {
    const parts = [];
    
    for (const [key, value] of Object.entries(results)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.length} items`);
      } else if (typeof value === 'object') {
        parts.push(`${key}: completed`);
      }
    }
    
    return parts.join(', ');
  }
}

export default NivMasterBrain;