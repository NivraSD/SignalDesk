// AI Context Session Management
let contextSessions = [];
let nextSessionId = 1;

// Global memory vault items reference
global.memoryVaultItems = global.memoryVaultItems || [];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST - Add items to AI context
  if (req.method === 'POST' && req.url.includes('/add-to-context')) {
    const { 
      item_ids, 
      feature = 'general',
      session_id = null 
    } = req.body;
    
    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Item IDs array is required'
      });
    }
    
    // Find or create session
    let session;
    if (session_id) {
      session = contextSessions.find(s => s.id === session_id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }
    } else {
      // Create new session
      session = {
        id: nextSessionId++,
        user_id: 1, // Demo user
        feature,
        context_items: [],
        conversation_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      contextSessions.push(session);
    }
    
    // Add items to context (avoid duplicates)
    const newItems = item_ids.filter(id => !session.context_items.includes(id));
    session.context_items.push(...newItems);
    session.updated_at = new Date().toISOString();
    
    // Get the actual items for response
    const contextItems = global.memoryVaultItems.filter(item => 
      session.context_items.includes(item.id)
    );
    
    return res.status(200).json({
      success: true,
      session_id: session.id,
      context_items: contextItems,
      total_items: session.context_items.length,
      message: `Added ${newItems.length} items to AI context`
    });
  }
  
  // GET - Get current AI context session
  if (req.method === 'GET') {
    const { sessionId, feature } = req.query;
    
    let session;
    if (sessionId) {
      session = contextSessions.find(s => s.id === parseInt(sessionId));
    } else if (feature) {
      // Get most recent session for feature
      session = contextSessions
        .filter(s => s.feature === feature)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    } else {
      // Get most recent session
      session = contextSessions
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    }
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No context session found'
      });
    }
    
    // Get the actual items
    const contextItems = global.memoryVaultItems.filter(item => 
      session.context_items.includes(item.id)
    );
    
    // Calculate context statistics
    const stats = {
      total_items: contextItems.length,
      total_characters: contextItems.reduce((sum, item) => 
        sum + (item.content?.length || 0), 0
      ),
      folder_types: [...new Set(contextItems.map(item => item.folder_type))],
      tags: [...new Set(contextItems.flatMap(item => item.tags || []))],
      estimated_tokens: Math.ceil(
        contextItems.reduce((sum, item) => sum + (item.content?.length || 0), 0) / 4
      )
    };
    
    return res.status(200).json({
      success: true,
      session,
      context_items: contextItems,
      stats,
      can_add_more: stats.estimated_tokens < 100000 // Token limit check
    });
  }
  
  // PUT - Update conversation history
  if (req.method === 'PUT') {
    const { session_id, message, role = 'user' } = req.body;
    
    if (!session_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
    }
    
    const session = contextSessions.find(s => s.id === session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Add message to conversation history
    session.conversation_history.push({
      role,
      message,
      timestamp: new Date().toISOString()
    });
    session.updated_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      session,
      message: 'Conversation updated'
    });
  }
  
  // DELETE - Clear context session
  if (req.method === 'DELETE') {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const index = contextSessions.findIndex(s => s.id === session_id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const deleted = contextSessions.splice(index, 1)[0];
    
    return res.status(200).json({
      success: true,
      deleted,
      message: 'Context session cleared'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}