// Media Lists Management
let mediaLists = [];
let nextListId = 1;

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // GET - Get media lists
  if (req.method === 'GET') {
    const { projectId } = req.query;
    const filtered = projectId 
      ? mediaLists.filter(l => l.projectId === parseInt(projectId))
      : mediaLists;
    
    return res.status(200).json({
      success: true,
      lists: filtered,
      total: filtered.length
    });
  }
  
  // POST - Create new list
  if (req.method === 'POST') {
    const { name, projectId, contacts = [] } = req.body;
    
    const newList = {
      id: nextListId++,
      name: name || 'New Media List',
      projectId: projectId || null,
      contacts,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mediaLists.push(newList);
    
    return res.status(201).json({
      success: true,
      list: newList
    });
  }
  
  // PUT - Update list
  if (req.method === 'PUT') {
    const { listId } = req.query;
    const index = mediaLists.findIndex(l => l.id === parseInt(listId));
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    mediaLists[index] = {
      ...mediaLists[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    return res.status(200).json({
      success: true,
      list: mediaLists[index]
    });
  }
  
  // DELETE - Delete list
  if (req.method === 'DELETE') {
    const { listId } = req.query;
    const index = mediaLists.findIndex(l => l.id === parseInt(listId));
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'List not found' });
    }
    
    const deleted = mediaLists.splice(index, 1)[0];
    
    return res.status(200).json({
      success: true,
      deleted
    });
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}