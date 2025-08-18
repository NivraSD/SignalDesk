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

  // ============= NIV CONVERSATION PERSISTENCE METHODS =============

  // Enhanced Niv Strategic Orchestrator with conversation persistence
  async callNivChat({ message, messages = [], context = {}, mode = 'strategic_orchestration', conversationId = null }) {
    console.log('🔍 [supabaseApiService] Calling Niv Backend Orchestrator:', {
      message,
      messagesCount: messages.length,
      context,
      mode,
      conversationId
    });
    
    // Get current user for conversation tracking
    const session = await this.getSession();
    const userId = session?.user?.id;
    const sessionId = conversationId || `session-${Date.now()}`;
    const organizationId = context.organizationId || null;
    
    try {
      // Determine backend URL based on environment
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                        (process.env.NODE_ENV === 'production' 
                          ? 'https://backend-orchestrator.vercel.app'
                          : 'https://backend-orchestrator.vercel.app');
      
      // Call backend orchestrator (using multi-mode endpoint)
      const response = await fetch(`${backendUrl}/api/niv-multimode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messages,
          sessionId,
          userId,
          organizationId,
          mode
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('✅ [supabaseApiService] Backend Orchestrator response:', {
        hasResponse: !!data?.response,
        shouldSave: data?.shouldSave,
        artifactCreated: !!data?.artifact,
        mcpsTriggered: data?.mcpsTriggered || [],
        conversationId: sessionId
      });
      
      // Format response to match expected structure (supports multi-mode)
      return {
        response: data.response,
        message: data.message || data.response,
        chatMessage: data.chatMessage || data.response,
        shouldSave: data.shouldSave || false,
        conversationId: sessionId,
        workItems: data.workItems || [],
        artifacts: data.artifacts || [],
        scope: data.scope,
        metadata: data.metadata,
        mcpsTriggered: data.mcpsTriggered,
        mcpInsights: data.mcpInsights
      };
    } catch (error) {
      console.error('Failed to call backend orchestrator:', error);
      // Return a helpful fallback response
      return {
        response: `I understand you need help with: ${message}. As your AI PR strategist, I can assist with press releases, media strategies, and campaign planning.`,
        message: 'Niv is ready to help!',
        chatMessage: 'How can I assist with your PR needs today?',
        shouldSave: false,
        conversationId: sessionId
      };
    }
  }

  // Load conversation history and context
  async loadNivConversation(conversationId) {
    try {
      const { data: conversation, error } = await this.supabase
        .from('niv_conversations')
        .select(`
          *,
          niv_conversation_messages (
            id, role, content, message_type, metadata, created_at
          ),
          niv_work_items (
            id, title, description, work_item_type, generated_content, 
            status, metadata, created_at, updated_at
          ),
          niv_strategic_context (
            context_type, extracted_data, confidence_score, validated
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error loading conversation:', error);
        throw error;
      }

      return {
        conversation,
        messages: conversation.niv_conversation_messages || [],
        workItems: conversation.niv_work_items || [],
        strategicContext: conversation.niv_strategic_context || []
      };
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }

  // Get recent conversations for a user
  async getRecentNivConversations(limit = 10) {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: conversations, error } = await this.supabase
        .from('niv_conversations')
        .select(`
          id, title, description, conversation_phase, status,
          created_at, updated_at, last_message_at,
          niv_conversation_messages (count),
          niv_work_items (count)
        `)
        .eq('user_id', session.user.id)
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent conversations:', error);
        throw error;
      }

      return conversations || [];
    } catch (error) {
      console.error('Failed to get recent conversations:', error);
      throw error;
    }
  }

  // Search conversations by content or metadata
  async searchNivConversations(query, filters = {}) {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      let queryBuilder = this.supabase
        .from('niv_conversations')
        .select(`
          id, title, description, conversation_phase, status,
          created_at, updated_at, last_message_at,
          niv_conversation_messages (
            id, content, created_at
          ),
          niv_work_items (
            id, title, work_item_type
          )
        `)
        .eq('user_id', session.user.id);

      // Add text search if query provided
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Add filters
      if (filters.phase) {
        queryBuilder = queryBuilder.eq('conversation_phase', filters.phase);
      }
      
      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      const { data: conversations, error } = await queryBuilder
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching conversations:', error);
        throw error;
      }

      return conversations || [];
    } catch (error) {
      console.error('Failed to search conversations:', error);
      throw error;
    }
  }

  // Update conversation metadata
  async updateNivConversation(conversationId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('niv_conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update conversation:', error);
      throw error;
    }
  }

  // Delete conversation and all associated data
  async deleteNivConversation(conversationId) {
    try {
      const { error } = await this.supabase
        .from('niv_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // ============= NIV WORK ITEM MANAGEMENT =============

  // Update work item content
  async updateNivWorkItem(workItemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('niv_work_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', workItemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating work item:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update work item:', error);
      throw error;
    }
  }

  // Create work item revision
  async createWorkItemRevision(workItemId, revisionData) {
    try {
      const session = await this.getSession();
      const { data, error } = await this.supabase
        .from('niv_work_item_revisions')
        .insert({
          work_item_id: workItemId,
          user_id: session?.user?.id,
          ...revisionData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating work item revision:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create work item revision:', error);
      throw error;
    }
  }

  // Get work item revisions
  async getWorkItemRevisions(workItemId) {
    try {
      const { data: revisions, error } = await this.supabase
        .from('niv_work_item_revisions')
        .select('*')
        .eq('work_item_id', workItemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching work item revisions:', error);
        throw error;
      }

      return revisions || [];
    } catch (error) {
      console.error('Failed to get work item revisions:', error);
      throw error;
    }
  }

  // ============= NIV USER PREFERENCES =============

  // Get user preferences for Niv
  async getNivUserPreferences() {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: preferences, error } = await this.supabase
        .from('niv_user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user preferences:', error);
        throw error;
      }

      return preferences || null;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw error;
    }
  }

  // Update user preferences for Niv
  async updateNivUserPreferences(preferences) {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('niv_user_preferences')
        .upsert({
          user_id: session.user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // ============= NIV ANALYTICS =============

  // Save conversation analytics
  async saveNivConversationAnalytics(conversationId, analytics) {
    try {
      const session = await this.getSession();
      const { data, error } = await this.supabase
        .from('niv_conversation_analytics')
        .upsert({
          conversation_id: conversationId,
          user_id: session?.user?.id,
          ...analytics,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving conversation analytics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save conversation analytics:', error);
      throw error;
    }
  }

  // Get user analytics summary
  async getNivUserAnalytics(timeframe = '30d') {
    try {
      const session = await this.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Calculate date filter
      const daysAgo = parseInt(timeframe.replace('d', ''));
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysAgo);

      const { data: analytics, error } = await this.supabase
        .from('niv_conversation_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user analytics:', error);
        throw error;
      }

      return analytics || [];
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      throw error;
    }
  }

  // ============= ORGANIZATION CONTEXT =============

  // Get organization Niv context
  async getOrganizationNivContext(organizationId) {
    try {
      const { data: context, error } = await this.supabase
        .from('niv_organization_context')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization context:', error);
        throw error;
      }

      return context || null;
    } catch (error) {
      console.error('Failed to get organization context:', error);
      throw error;
    }
  }

  // Update organization Niv context
  async updateOrganizationNivContext(organizationId, context) {
    try {
      const { data, error } = await this.supabase
        .from('niv_organization_context')
        .upsert({
          organization_id: organizationId,
          ...context,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating organization context:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update organization context:', error);
      throw error;
    }
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