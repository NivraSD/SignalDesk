// Enhanced Niv State Manager with Supabase Persistence
// Maintains existing architecture while adding conversation persistence

import supabaseApiService from '../../services/supabaseApiService';

class NivStateManagerPersistent {
  constructor() {
    // Core state (kept for immediate UI responsiveness)
    this.chatMessages = [];
    this.workItems = new Map(); 
    this.activeWorkspaceId = null;
    
    // Persistence state
    this.currentConversationId = null;
    this.conversationPhase = 'discovery';
    this.strategicContext = {};
    this.isLoading = false;
    this.syncStatus = 'idle'; // 'idle', 'syncing', 'error', 'synced'
    
    // Subscribers for different components
    this.subscribers = {
      chat: new Set(),
      workItems: new Set(),
      workspace: new Set(),
      sync: new Set() // New: sync status updates
    };
    
    // Auto-sync configuration
    this.autoSaveEnabled = true;
    this.saveDelay = 2000; // 2 second delay before auto-saving
    this.saveTimeout = null;
    
    // Debug mode
    this.debug = true;
    
    this.log('Enhanced Niv State Manager initialized with persistence');
  }

  // ============= CONVERSATION PERSISTENCE =============
  
  async startNewConversation() {
    try {
      this.setSyncStatus('syncing');
      
      // Clear current state
      this.chatMessages = [];
      this.workItems.clear();
      this.activeWorkspaceId = null;
      this.currentConversationId = null;
      this.conversationPhase = 'discovery';
      this.strategicContext = {};
      
      this.log('Started new conversation');
      this.notifyAll({ type: 'conversation_reset' });
      this.setSyncStatus('synced');
      
      return true;
    } catch (error) {
      this.log('Error starting new conversation:', error);
      this.setSyncStatus('error');
      return false;
    }
  }
  
  async loadConversation(conversationId) {
    try {
      this.setSyncStatus('syncing');
      this.log('Loading conversation:', conversationId);
      
      // Load conversation data from Supabase
      const conversationData = await this.callSupabaseFunction('load-conversation', {
        conversationId
      });
      
      if (!conversationData) {
        throw new Error('Conversation not found');
      }
      
      // Update state with loaded data
      this.currentConversationId = conversationId;
      this.conversationPhase = conversationData.conversation_phase || 'discovery';
      this.strategicContext = conversationData.strategic_context || {};
      
      // Load messages
      this.chatMessages = (conversationData.messages || []).map(msg => ({
        id: msg.id,
        type: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata || {}
      }));
      
      // Load work items
      this.workItems.clear();
      (conversationData.work_items || []).forEach(item => {
        this.workItems.set(item.id, {
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.work_item_type,
          generatedContent: item.generated_content,
          status: item.status,
          timestamp: new Date(item.created_at),
          metadata: item.metadata || {}
        });
      });
      
      this.log('Conversation loaded successfully');
      this.notifyAll({ type: 'conversation_loaded', conversationId });
      this.setSyncStatus('synced');
      
      return true;
    } catch (error) {
      this.log('Error loading conversation:', error);
      this.setSyncStatus('error');
      return false;
    }
  }
  
  async saveConversationState(immediate = false) {
    if (!this.autoSaveEnabled && !immediate) return;
    
    // Debounce saves
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    if (immediate) {
      await this.performSave();
    } else {
      this.saveTimeout = setTimeout(async () => {
        await this.performSave();
      }, this.saveDelay);
    }
  }
  
  async performSave() {
    if (!this.currentConversationId) return;
    
    try {
      this.setSyncStatus('syncing');
      
      const saveData = {
        conversationId: this.currentConversationId,
        messages: this.chatMessages,
        workItems: Array.from(this.workItems.values()),
        strategicContext: this.strategicContext,
        conversationPhase: this.conversationPhase
      };
      
      await this.callSupabaseFunction('save-conversation-state', saveData);
      
      this.log('Conversation state saved');
      this.setSyncStatus('synced');
    } catch (error) {
      this.log('Error saving conversation state:', error);
      this.setSyncStatus('error');
    }
  }

  // ============= ENHANCED CHAT MANAGEMENT =============
  
  addChatMessage(message) {
    const fullMessage = {
      id: message.id || Date.now(),
      timestamp: new Date(),
      conversationId: this.currentConversationId,
      ...message
    };
    
    this.chatMessages.push(fullMessage);
    
    this.log('Chat message added:', message);
    this.notify('chat', { type: 'message_added', message: fullMessage });
    
    // Auto-save after message added
    this.saveConversationState();
  }

  getChatMessages() {
    return [...this.chatMessages];
  }
  
  getConversationHistory() {
    return {
      id: this.currentConversationId,
      phase: this.conversationPhase,
      messageCount: this.chatMessages.length,
      workItemCount: this.workItems.size,
      strategicContext: this.strategicContext,
      lastActivity: this.chatMessages.length > 0 ? 
        this.chatMessages[this.chatMessages.length - 1].timestamp : null
    };
  }

  // ============= ENHANCED WORK ITEM MANAGEMENT =============
  
  addWorkItem(workItem) {
    const id = workItem.id || `work_${Date.now()}_${Math.random()}`;
    
    const fullWorkItem = {
      id,
      timestamp: new Date(),
      status: 'ready',
      conversationId: this.currentConversationId,
      ...workItem,
      generatedContent: workItem.generatedContent || workItem.content
    };
    
    this.workItems.set(id, fullWorkItem);
    
    this.log('Work item added:', fullWorkItem);
    this.notify('workItems', { type: 'item_added', item: fullWorkItem });
    
    // Auto-save after work item added
    this.saveConversationState();
    
    return id;
  }

  async updateWorkItem(id, updates) {
    const workItem = this.workItems.get(id);
    if (!workItem) {
      this.log('Work item not found:', id);
      return false;
    }
    
    const updatedItem = {
      ...workItem,
      ...updates,
      updatedAt: new Date()
    };
    
    this.workItems.set(id, updatedItem);
    
    this.log('Work item updated:', updatedItem);
    this.notify('workItems', { type: 'item_updated', item: updatedItem });
    
    // Save updates to Supabase
    try {
      await this.callSupabaseFunction('update-work-item', {
        workItemId: id,
        updates
      });
      this.log('Work item update saved to database');
    } catch (error) {
      this.log('Error saving work item update:', error);
    }
    
    return true;
  }

  getWorkItems() {
    return Array.from(this.workItems.values());
  }

  getWorkItem(id) {
    return this.workItems.get(id);
  }

  // ============= ENHANCED NIV RESPONSE HANDLER =============
  
  async handleNivResponse(response) {
    this.log('Handling enhanced Niv response:', response);
    
    // Extract conversation metadata
    if (response.conversationId) {
      this.currentConversationId = response.conversationId;
    }
    
    if (response.conversationPhase) {
      this.conversationPhase = response.conversationPhase;
    }
    
    if (response.strategicContext) {
      this.strategicContext = { ...this.strategicContext, ...response.strategicContext };
    }
    
    // Handle chat message
    if (response.response) {
      this.addChatMessage({
        type: 'assistant',
        content: response.response,
        metadata: {
          phase: this.conversationPhase,
          workItemsGenerated: response.workItems?.length || 0
        }
      });
    }
    
    // Handle work items
    let workItemIds = [];
    if (response.workItems && Array.isArray(response.workItems)) {
      response.workItems.forEach(item => {
        const workItem = {
          type: item.type,
          title: item.title,
          description: item.description,
          generatedContent: item.generatedContent,
          metadata: {
            source: 'niv',
            generatedAt: new Date(),
            conversationPhase: this.conversationPhase,
            prompt: item.prompt,
            ...item.metadata
          }
        };
        
        const id = this.addWorkItem(workItem);
        workItemIds.push(id);
      });
      
      if (workItemIds.length > 0) {
        this.notify('chat', { 
          type: 'work_items_created', 
          ids: workItemIds,
          count: workItemIds.length 
        });
      }
    }
    
    // Save conversation state with new data
    await this.saveConversationState();
    
    return {
      messageAdded: true,
      workItemsCreated: workItemIds.length,
      conversationId: this.currentConversationId,
      conversationPhase: this.conversationPhase,
      strategicContext: this.strategicContext
    };
  }

  // ============= ENHANCED WORKSPACE MANAGEMENT =============
  
  openWorkspace(workItemId) {
    const workItem = this.workItems.get(workItemId);
    
    if (!workItem) {
      console.error('Work item not found:', workItemId);
      return false;
    }
    
    this.activeWorkspaceId = workItemId;
    
    // Track workspace opening for analytics
    this.updateWorkItem(workItemId, { 
      lastOpened: new Date(),
      openCount: (workItem.openCount || 0) + 1
    });
    
    this.log('Opening workspace for:', workItem);
    this.notify('workspace', { 
      type: 'workspace_opened', 
      workItem,
      conversationContext: {
        phase: this.conversationPhase,
        strategicContext: this.strategicContext
      }
    });
    
    return true;
  }

  closeWorkspace() {
    if (this.activeWorkspaceId) {
      const workItem = this.workItems.get(this.activeWorkspaceId);
      if (workItem) {
        this.updateWorkItem(this.activeWorkspaceId, { 
          lastClosed: new Date()
        });
      }
    }
    
    this.activeWorkspaceId = null;
    this.notify('workspace', { type: 'workspace_closed' });
  }

  getActiveWorkspace() {
    if (!this.activeWorkspaceId) return null;
    return this.workItems.get(this.activeWorkspaceId);
  }

  // ============= CONVERSATION ANALYTICS =============
  
  getConversationAnalytics() {
    const messages = this.chatMessages;
    const userMessages = messages.filter(m => m.type === 'user');
    const assistantMessages = messages.filter(m => m.type === 'assistant');
    
    return {
      conversationId: this.currentConversationId,
      phase: this.conversationPhase,
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      workItemsGenerated: this.workItems.size,
      conversationDuration: messages.length > 1 ? 
        messages[messages.length - 1].timestamp - messages[0].timestamp : 0,
      strategicContextExtracted: Object.keys(this.strategicContext).length,
      averageMessageLength: userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length || 0
    };
  }
  
  async saveConversationAnalytics() {
    if (!this.currentConversationId) return;
    
    try {
      const analytics = this.getConversationAnalytics();
      await this.callSupabaseFunction('save-conversation-analytics', analytics);
      this.log('Conversation analytics saved');
    } catch (error) {
      this.log('Error saving conversation analytics:', error);
    }
  }

  // ============= CONVERSATION MANAGEMENT =============
  
  async getRecentConversations(limit = 10) {
    try {
      const conversations = await this.callSupabaseFunction('get-recent-conversations', {
        limit
      });
      return conversations || [];
    } catch (error) {
      this.log('Error loading recent conversations:', error);
      return [];
    }
  }
  
  async searchConversations(query, filters = {}) {
    try {
      const results = await this.callSupabaseFunction('search-conversations', {
        query,
        filters
      });
      return results || [];
    } catch (error) {
      this.log('Error searching conversations:', error);
      return [];
    }
  }

  // ============= SYNC STATUS MANAGEMENT =============
  
  setSyncStatus(status) {
    if (this.syncStatus !== status) {
      this.syncStatus = status;
      this.notify('sync', { type: 'status_changed', status });
      this.log('Sync status changed to:', status);
    }
  }
  
  getSyncStatus() {
    return this.syncStatus;
  }
  
  // Force sync - manual save
  async forcSync() {
    await this.saveConversationState(true);
  }

  // ============= SUPABASE INTEGRATION =============
  
  async callSupabaseFunction(functionName, data) {
    try {
      // For now, integrate with existing Edge Function
      if (functionName === 'niv-chat') {
        return await supabaseApiService.callNivChat({
          message: data.message,
          messages: data.messages || this.getChatMessages(),
          context: data.context || {},
          conversationId: this.currentConversationId
        });
      }
      
      // Placeholder for other functions - would call specific Edge Functions
      this.log(`Calling ${functionName} with:`, data);
      return null;
    } catch (error) {
      this.log(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // ============= SUBSCRIPTION MANAGEMENT =============
  
  subscribe(channel, callback) {
    if (!this.subscribers[channel]) {
      console.error('Invalid channel:', channel);
      return null;
    }
    
    this.subscribers[channel].add(callback);
    
    return () => {
      this.subscribers[channel].delete(callback);
    };
  }

  notify(channel, event) {
    if (!this.subscribers[channel]) return;
    
    this.subscribers[channel].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }
  
  notifyAll(event) {
    Object.keys(this.subscribers).forEach(channel => {
      this.notify(channel, event);
    });
  }

  // ============= UTILITY METHODS =============
  
  getTitleForType(type) {
    const titles = {
      'media-list': 'Strategic Media Plan',
      'content-draft': 'Press Release',
      'strategy-plan': 'Strategic Communications Plan',
      'key-messaging': 'Key Messaging Framework',
      'social-content': 'Social Media Content',
      'faq-document': 'FAQ Document',
      'pitch-templates': 'Pitch Email Templates',
      'executive-briefing': 'Executive Briefing Document'
    };
    return titles[type] || 'Generated Content';
  }

  log(...args) {
    if (this.debug) {
      console.log('[NivStateManagerPersistent]', ...args);
    }
  }

  // ============= STATE MANAGEMENT =============
  
  reset() {
    this.chatMessages = [];
    this.workItems.clear();
    this.activeWorkspaceId = null;
    this.currentConversationId = null;
    this.conversationPhase = 'discovery';
    this.strategicContext = {};
    
    this.notifyAll({ type: 'reset' });
  }

  exportState() {
    return {
      chatMessages: this.chatMessages,
      workItems: Array.from(this.workItems.entries()),
      activeWorkspaceId: this.activeWorkspaceId,
      currentConversationId: this.currentConversationId,
      conversationPhase: this.conversationPhase,
      strategicContext: this.strategicContext,
      syncStatus: this.syncStatus,
      timestamp: new Date()
    };
  }
  
  // Import state (for testing or migration)
  importState(state) {
    this.chatMessages = state.chatMessages || [];
    this.workItems = new Map(state.workItems || []);
    this.activeWorkspaceId = state.activeWorkspaceId;
    this.currentConversationId = state.currentConversationId;
    this.conversationPhase = state.conversationPhase || 'discovery';
    this.strategicContext = state.strategicContext || {};
    
    this.notifyAll({ type: 'state_imported' });
  }
  
  // Get conversation summary for UI
  getConversationSummary() {
    return {
      id: this.currentConversationId,
      phase: this.conversationPhase,
      messageCount: this.chatMessages.length,
      workItemCount: this.workItems.size,
      lastActivity: this.chatMessages.length > 0 ? 
        this.chatMessages[this.chatMessages.length - 1].timestamp : null,
      strategicInsights: Object.keys(this.strategicContext).length,
      syncStatus: this.syncStatus
    };
  }
}

// Create singleton instance
const nivStateManagerPersistent = new NivStateManagerPersistent();

export default nivStateManagerPersistent;