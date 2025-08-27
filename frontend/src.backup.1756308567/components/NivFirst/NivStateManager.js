// Central State Manager for Niv System
// This is the SINGLE SOURCE OF TRUTH for all Niv-generated content

class NivStateManager {
  constructor() {
    // Core state
    this.chatMessages = [];
    this.workItems = new Map(); // id -> workItem
    this.activeWorkspaceId = null;
    
    // Subscribers for different components
    this.subscribers = {
      chat: new Set(),
      workItems: new Set(),
      workspace: new Set()
    };
    
    // Debug mode
    this.debug = true;
  }

  // ============= CHAT MANAGEMENT =============
  addChatMessage(message) {
    this.chatMessages.push({
      id: Date.now(),
      timestamp: new Date(),
      ...message
    });
    
    this.log('Chat message added:', message);
    this.notify('chat', { type: 'message_added', message });
  }

  getChatMessages() {
    return [...this.chatMessages];
  }

  // ============= WORK ITEM MANAGEMENT =============
  addWorkItem(workItem) {
    // Ensure each work item has a unique ID
    const id = workItem.id || `work_${Date.now()}_${Math.random()}`;
    
    const fullWorkItem = {
      id,
      timestamp: new Date(),
      status: 'ready',
      ...workItem,
      // Ensure generatedContent is at the right level
      generatedContent: workItem.generatedContent || workItem.content
    };
    
    this.workItems.set(id, fullWorkItem);
    
    this.log('Work item added:', fullWorkItem);
    this.notify('workItems', { type: 'item_added', item: fullWorkItem });
    
    return id;
  }

  getWorkItems() {
    return Array.from(this.workItems.values());
  }

  getWorkItem(id) {
    return this.workItems.get(id);
  }

  // ============= WORKSPACE MANAGEMENT =============
  openWorkspace(workItemId) {
    const workItem = this.workItems.get(workItemId);
    
    if (!workItem) {
      console.error('Work item not found:', workItemId);
      return false;
    }
    
    this.activeWorkspaceId = workItemId;
    
    this.log('Opening workspace for:', workItem);
    this.notify('workspace', { 
      type: 'workspace_opened', 
      workItem 
    });
    
    return true;
  }

  closeWorkspace() {
    this.activeWorkspaceId = null;
    this.notify('workspace', { type: 'workspace_closed' });
  }

  getActiveWorkspace() {
    if (!this.activeWorkspaceId) return null;
    return this.workItems.get(this.activeWorkspaceId);
  }

  // ============= NIV RESPONSE HANDLER =============
  // This is the KEY method that handles Niv's responses
  handleNivResponse(response) {
    this.log('Handling Niv response:', response);
    
    // 1. Always add the chat message (Niv's conversational response)
    if (response.response) {
      this.addChatMessage({
        type: 'assistant',
        content: response.response
      });
    }
    
    // 2. Check for work items in various formats (handle different response structures)
    let workItemsToProcess = [];
    
    // Check for workItems array
    if (response.workItems && Array.isArray(response.workItems)) {
      workItemsToProcess = response.workItems;
    }
    // Check for artifacts array (older format)
    else if (response.artifacts && Array.isArray(response.artifacts)) {
      workItemsToProcess = response.artifacts;
    }
    // Check for workCards array (another format)
    else if (response.workCards && Array.isArray(response.workCards)) {
      workItemsToProcess = response.workCards;
    }
    // Check if the response itself contains material generation
    else if (response.type && response.generatedContent) {
      // Single work item embedded in response
      workItemsToProcess = [{
        type: response.type,
        title: response.title,
        description: response.description,
        generatedContent: response.generatedContent
      }];
    }
    
    // Process work items if we found any
    if (workItemsToProcess.length > 0) {
      const workItemIds = [];
      
      workItemsToProcess.forEach(item => {
        // Extract content from various possible structures
        let content = item.generatedContent || item.content || item.data;
        
        // If content is nested in data.generatedContent
        if (item.data && item.data.generatedContent) {
          content = item.data.generatedContent;
        }
        
        // Create a properly structured work item
        const workItem = {
          type: item.type || 'content-draft',
          title: item.title || item.data?.title || this.getTitleForType(item.type),
          description: item.description || item.data?.description || '',
          generatedContent: content,
          metadata: {
            source: 'niv',
            generatedAt: new Date(),
            ...item.metadata
          }
        };
        
        const id = this.addWorkItem(workItem);
        workItemIds.push(id);
      });
      
      // Notify that Niv created work items
      this.notify('chat', { 
        type: 'work_items_created', 
        ids: workItemIds,
        count: workItemIds.length 
      });
      
      return {
        messageAdded: true,
        workItemsCreated: workItemIds.length
      };
    }
    
    return {
      messageAdded: true,
      workItemsCreated: 0
    };
  }

  // ============= SUBSCRIPTION MANAGEMENT =============
  subscribe(channel, callback) {
    if (!this.subscribers[channel]) {
      console.error('Invalid channel:', channel);
      return null;
    }
    
    this.subscribers[channel].add(callback);
    
    // Return unsubscribe function
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

  // ============= UTILITY METHODS =============
  getTitleForType(type) {
    const titles = {
      'media-list': 'Media List',
      'content-draft': 'Press Release',
      'strategy-plan': 'Strategic Plan',
      'key-messaging': 'Key Messaging',
      'social-content': 'Social Media Content',
      'faq-document': 'FAQ Document'
    };
    return titles[type] || 'Generated Content';
  }

  log(...args) {
    if (this.debug) {
      console.log('[NivStateManager]', ...args);
    }
  }

  // ============= STATE RESET (for testing) =============
  reset() {
    this.chatMessages = [];
    this.workItems.clear();
    this.activeWorkspaceId = null;
    this.notify('chat', { type: 'reset' });
    this.notify('workItems', { type: 'reset' });
    this.notify('workspace', { type: 'reset' });
  }

  // ============= STATE EXPORT (for debugging) =============
  exportState() {
    return {
      chatMessages: this.chatMessages,
      workItems: Array.from(this.workItems.entries()),
      activeWorkspaceId: this.activeWorkspaceId,
      timestamp: new Date()
    };
  }
}

// Create singleton instance
const nivStateManager = new NivStateManager();

export default nivStateManager;