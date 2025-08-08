// Crisis Event Logging
let crisisEvents = [];
let nextEventId = 1;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST - Save crisis event
  if (req.method === 'POST') {
    const { 
      projectId,
      crisisId,
      type,
      title,
      description,
      severity,
      actions,
      metadata
    } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        error: 'Title and type are required'
      });
    }
    
    const newEvent = {
      id: nextEventId++,
      projectId: projectId || null,
      crisisId: crisisId || null,
      type,
      title,
      description: description || '',
      severity: severity || 'medium',
      actions: actions || [],
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    crisisEvents.push(newEvent);
    
    return res.status(201).json({
      success: true,
      event: newEvent,
      message: 'Crisis event logged successfully'
    });
  }
  
  // GET - Get crisis events
  if (req.method === 'GET') {
    const { projectId, crisisId, limit = 50 } = req.query;
    
    let filteredEvents = crisisEvents;
    
    if (projectId) {
      filteredEvents = filteredEvents.filter(e => e.projectId === parseInt(projectId));
    }
    
    if (crisisId) {
      filteredEvents = filteredEvents.filter(e => e.crisisId === parseInt(crisisId));
    }
    
    // Sort by timestamp descending and limit
    filteredEvents = filteredEvents
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}