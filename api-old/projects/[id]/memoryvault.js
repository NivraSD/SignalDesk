// In-memory storage for MemoryVault items
let memoryVaultItems = [];
let nextItemId = 1;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  const projectId = parseInt(id);
  
  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }
  
  // GET - List memory vault items for project
  if (req.method === 'GET') {
    const projectItems = memoryVaultItems.filter(item => item.project_id === projectId);
    
    return res.status(200).json({
      success: true,
      items: projectItems,
      count: projectItems.length
    });
  }
  
  // POST - Add item to memory vault
  if (req.method === 'POST') {
    const { 
      title, 
      content, 
      folder_type, 
      type, 
      tags, 
      preview,
      source,
      metadata 
    } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    const newItem = {
      id: nextItemId++,
      project_id: projectId,
      title: title.trim(),
      content: content,
      folder_type: folder_type || 'content',
      type: type || 'general',
      tags: tags || [],
      preview: preview || content.substring(0, 200),
      source: source || 'manual',
      metadata: metadata || {},
      author: metadata?.author || 'SignalDesk User',
      status: metadata?.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    memoryVaultItems.push(newItem);
    
    return res.status(201).json({
      success: true,
      item: newItem,
      message: 'Item saved to MemoryVault'
    });
  }
  
  // DELETE - Remove item from memory vault
  if (req.method === 'DELETE') {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const itemIndex = memoryVaultItems.findIndex(
      item => item.id === itemId && item.project_id === projectId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    const deletedItem = memoryVaultItems.splice(itemIndex, 1)[0];
    
    return res.status(200).json({
      success: true,
      message: 'Item deleted from MemoryVault',
      item: deletedItem
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}