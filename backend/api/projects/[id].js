// In-memory storage (shared with index.js in production this would be a database)
let projects = [
  { id: 1, name: 'Demo Project', description: 'Your first SignalDesk project', user_id: 1, created_at: new Date().toISOString() }
];

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
  
  const projectIndex = projects.findIndex(p => p.id === projectId);
  
  // GET - Get single project
  if (req.method === 'GET') {
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      project: projects[projectIndex]
    });
  }
  
  // PUT - Update project
  if (req.method === 'PUT') {
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const { name, description, industry, campaign } = req.body;
    
    if (name && typeof name === 'string') {
      projects[projectIndex].name = name.trim();
    }
    if (description !== undefined) {
      projects[projectIndex].description = description;
    }
    if (industry !== undefined) {
      projects[projectIndex].industry = industry;
    }
    if (campaign !== undefined) {
      projects[projectIndex].campaign = campaign;
    }
    
    projects[projectIndex].updated_at = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      project: projects[projectIndex],
      message: 'Project updated successfully'
    });
  }
  
  // DELETE - Delete project
  if (req.method === 'DELETE') {
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const deletedProject = projects.splice(projectIndex, 1)[0];
    
    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      project: deletedProject
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}