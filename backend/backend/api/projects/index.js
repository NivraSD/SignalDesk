// In-memory storage for demo (replace with database in production)
let projects = [
  { id: 1, name: 'Demo Project', description: 'Your first SignalDesk project', user_id: 1, created_at: new Date().toISOString() }
];
let nextProjectId = 2;

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET - List all projects
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      projects: projects
    });
  }
  
  // POST - Create new project
  if (req.method === 'POST') {
    const { name, description, industry, campaign } = req.body;
    
    // Validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    const newProject = {
      id: nextProjectId++,
      name: name.trim(),
      description: description || '',
      industry: industry || '',
      campaign: campaign || '',
      user_id: 1, // Demo user
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    projects.push(newProject);
    
    return res.status(201).json({
      success: true,
      project: newProject,
      message: 'Project created successfully'
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}