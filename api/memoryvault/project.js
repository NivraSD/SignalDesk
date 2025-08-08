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
  
  // Get project ID from query parameter
  const { projectId: projectIdParam } = req.query;
  const projectId = parseInt(projectIdParam);
  
  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }
  
  // GET - List memory vault items for project
  if (req.method === 'GET') {
    const projectItems = memoryVaultItems.filter(item => item.project_id === projectId);
    
    // Define default folders structure
    const folders = [
      { id: 1, name: 'Campaign Intelligence', folder_type: 'campaign-intelligence', count: 0 },
      { id: 2, name: 'Crisis Management', folder_type: 'crisis-management', count: 0 },
      { id: 3, name: 'Media Relations', folder_type: 'media-relations', count: 0 },
      { id: 4, name: 'Content Library', folder_type: 'content-library', count: 0 },
      { id: 5, name: 'Analytics', folder_type: 'analytics', count: 0 },
      { id: 6, name: 'Research', folder_type: 'research', count: 0 }
    ];
    
    // Count items per folder
    projectItems.forEach(item => {
      const folder = folders.find(f => f.folder_type === item.folder_type);
      if (folder) folder.count++;
    });
    
    return res.status(200).json({
      success: true,
      items: projectItems,
      folders: folders,
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