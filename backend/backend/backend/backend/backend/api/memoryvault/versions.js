// In-memory storage for version control
let versions = [];
let nextVersionId = 1;

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET - Get version history for an item
  if (req.method === 'GET') {
    const { itemId } = req.query;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const itemVersions = versions
      .filter(v => v.item_id === parseInt(itemId))
      .sort((a, b) => b.version_number - a.version_number);
    
    return res.status(200).json({
      success: true,
      versions: itemVersions,
      count: itemVersions.length
    });
  }
  
  // POST - Create a new version
  if (req.method === 'POST') {
    const { 
      item_id, 
      content, 
      change_type = 'edit',
      changed_by = 'user',
      diff = null 
    } = req.body;
    
    if (!item_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Item ID and content are required'
      });
    }
    
    // Get the latest version number
    const latestVersion = versions
      .filter(v => v.item_id === item_id)
      .reduce((max, v) => Math.max(max, v.version_number), 0);
    
    const newVersion = {
      id: nextVersionId++,
      item_id: parseInt(item_id),
      version_number: latestVersion + 1,
      content,
      change_type,
      changed_by,
      diff,
      created_at: new Date().toISOString()
    };
    
    versions.push(newVersion);
    
    return res.status(201).json({
      success: true,
      version: newVersion,
      message: 'Version created successfully'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}