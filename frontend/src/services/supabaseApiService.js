/**
 * Supabase-Only API Service for SignalDesk
 * All backend functionality through Supabase Edge Functions and Database
 */

import { supabase } from '../config/supabase';

class SupabaseApiService {
  constructor() {
    this.supabase = supabase;
    console.log('✅ Supabase API Service initialized');
    console.log('🚀 Using Supabase for ALL backend operations');
  }

  /**
   * Get current user session
   */
  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Call Supabase Edge Function
   */
  async callEdgeFunction(functionName, payload = {}) {
    try {
      console.log(`Calling Edge Function: ${functionName}`, payload);
      
      const { data, error } = await this.supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Edge Function error (${functionName}):`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Failed to call Edge Function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Database Operations
   */
  async dbQuery(table, operation, params = {}) {
    let query = this.supabase.from(table);
    
    switch(operation) {
      case 'select':
        query = query.select(params.columns || '*');
        if (params.filter) query = query.match(params.filter);
        if (params.limit) query = query.limit(params.limit);
        if (params.orderBy) query = query.order(params.orderBy.column, { ascending: params.orderBy.ascending });
        break;
      
      case 'insert':
        query = query.insert(params.data);
        break;
      
      case 'update':
        query = query.update(params.data);
        if (params.filter) query = query.match(params.filter);
        break;
      
      case 'delete':
        query = query.delete();
        if (params.filter) query = query.match(params.filter);
        break;
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(`Database error (${table}/${operation}):`, error);
      throw error;
    }
    
    return data;
  }

  // Authentication methods
  async login(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signup(email, password, metadata = {}) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Organization methods
  async getOrganizations() {
    return this.dbQuery('organizations', 'select');
  }

  async createOrganization(orgData) {
    return this.dbQuery('organizations', 'insert', { data: orgData });
  }

  async updateOrganization(id, updates) {
    return this.dbQuery('organizations', 'update', {
      data: updates,
      filter: { id }
    });
  }

  // Project methods  
  async getProjects(organizationId = null) {
    const params = organizationId 
      ? { filter: { organization_id: organizationId } }
      : {};
    return this.dbQuery('projects', 'select', params);
  }

  async createProject(projectData) {
    return this.dbQuery('projects', 'insert', { data: projectData });
  }

  // Intelligence/Monitoring methods (via Edge Functions)
  async getIntelligenceFindings(organizationId) {
    return this.callEdgeFunction('monitor-intelligence', {
      action: 'getFindings',
      organizationId
    });
  }

  async startMonitoring(organizationId, sources) {
    return this.callEdgeFunction('monitor-intelligence', {
      action: 'startMonitoring',
      organizationId,
      sources
    });
  }

  async stopMonitoring(organizationId) {
    return this.callEdgeFunction('monitor-intelligence', {
      action: 'stopMonitoring',
      organizationId
    });
  }

  // Claude AI methods (via Edge Functions)
  async sendClaudeMessage(message, context = {}) {
    return this.callEdgeFunction('claude-chat', {
      prompt: message,  // Edge Function expects 'prompt' not 'message'
      system: context.systemPrompt,
      model: context.model || 'claude-sonnet-4-20250514',
      max_tokens: context.max_tokens || 1000,
      temperature: context.temperature || 0.7
    });
  }

  async generateContent(type, params) {
    // Build a comprehensive prompt for content generation
    const prompt = `Generate ${type} content with the following parameters:
Type: ${type}
${params.prompt || ''}
Company: ${params.companyName || 'the company'}
Industry: ${params.industry || 'technology'}
Tone: ${params.tone || 'professional'}
${params.context ? `Additional context: ${JSON.stringify(params.context)}` : ''}`;
    
    return this.callEdgeFunction('claude-chat', {
      prompt,
      system: "You are Niv, an experienced PR strategist with 20 years of expertise. Generate high-quality PR content that is strategic, compelling, and tailored to the target audience.",
      model: params.model || 'claude-sonnet-4-20250514',
      max_tokens: params.max_tokens || 2000,
      temperature: params.temperature || 0.7
    });
  }

  async analyzeOpportunity(opportunityData) {
    const prompt = `Analyze this PR opportunity and provide strategic recommendations:
${JSON.stringify(opportunityData, null, 2)}

Provide analysis including:
1. Strategic value (1-10)
2. Timing recommendations
3. Key angles to pursue
4. Potential risks
5. Action steps`;

    return this.callEdgeFunction('claude-chat', {
      prompt,
      system: "You are Niv, a senior PR strategist. Analyze opportunities with deep strategic insight.",
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500
    });
  }

  // Niv Strategic Orchestrator - Main interface
  async callNivChat({ message, context = {}, mode = 'strategic_orchestration', sessionId = null }) {
    return this.callEdgeFunction('niv-orchestrator', {
      message,
      context,
      mode,
      conversationId: sessionId
    });
  }

  // Legacy Niv Chat - Keep for backward compatibility
  async callNivChatLegacy({ message, context = {}, mode = 'chat', sessionId = null }) {
    return this.callEdgeFunction('niv-chat', {
      message,
      context,
      mode,
      conversationId: sessionId
    });
  }

  // Campaign methods
  async analyzeCampaign(campaignData) {
    const prompt = `Analyze this PR campaign and provide strategic guidance:
${JSON.stringify(campaignData, null, 2)}

Provide comprehensive campaign analysis including messaging, targeting, and execution strategy.`;

    return this.callEdgeFunction('claude-chat', {
      prompt,
      system: "You are Niv, an expert PR strategist with 20 years of experience running successful campaigns.",
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000
    });
  }

  // Crisis management
  async analyzeCrisis(crisisData) {
    const prompt = `URGENT: Analyze this crisis situation and provide immediate strategic guidance:
${JSON.stringify(crisisData, null, 2)}

Provide crisis response plan including:
1. Immediate actions (first hour)
2. Key stakeholders to address
3. Core messaging framework
4. Media response strategy
5. Timeline for updates`;

    return this.callEdgeFunction('claude-chat', {
      prompt,
      system: "You are Niv, a crisis management expert. Time is critical. Be direct, strategic, and action-oriented.",
      model: 'claude-sonnet-4-20250514',  // Use Claude Sonnet 4 for crisis
      max_tokens: 2000,
      temperature: 0.3  // Lower temperature for more consistent crisis response
    });
  }

  // Real-time subscriptions
  subscribeToFindings(organizationId, callback) {
    return this.supabase
      .channel(`findings:${organizationId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'intelligence_findings',
          filter: `organization_id=eq.${organizationId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToOpportunities(organizationId, callback) {
    return this.supabase
      .channel(`opportunities:${organizationId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_queue',
          filter: `organization_id=eq.${organizationId}`
        },
        callback
      )
      .subscribe();
  }

  // Utility methods
  async uploadFile(bucket, path, file) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket, path) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}

// Create singleton instance
const supabaseApiService = new SupabaseApiService();

// Export both the class and instance
export { SupabaseApiService };
export default supabaseApiService;