// Media Contacts Management
let mediaContacts = [];
let nextContactId = 1;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // GET - Get contacts
  if (req.method === 'GET') {
    const { projectId } = req.query;
    const filtered = projectId 
      ? mediaContacts.filter(c => c.projectId === parseInt(projectId))
      : mediaContacts;
    
    return res.status(200).json({
      success: true,
      contacts: filtered,
      total: filtered.length
    });
  }
  
  // POST - Save contacts
  if (req.method === 'POST') {
    const { contacts = [], projectId } = req.body;
    
    const newContacts = contacts.map(contact => ({
      id: nextContactId++,
      ...contact,
      projectId: projectId || null,
      created_at: new Date().toISOString()
    }));
    
    mediaContacts.push(...newContacts);
    
    return res.status(201).json({
      success: true,
      contacts: newContacts,
      message: `Saved ${newContacts.length} contacts`
    });
  }
  
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}