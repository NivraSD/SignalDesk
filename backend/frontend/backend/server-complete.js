const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for testing
const storage = {
  organizations: new Map(),
  targets: new Map(),
  findings: [],
  opportunities: [],
  monitoringStatus: new Map(),
  projects: new Map(),
  todos: [],
  memoryVault: new Map(),
  mediaContacts: [],
  mediaLists: [],
  contentHistory: [],
  templates: [],
  crisisPlans: new Map()
};

// Initialize with demo data
const mockOrgId = 'org-demo-123';
storage.organizations.set(mockOrgId, {
  id: mockOrgId,
  name: 'Demo Organization',
  metadata: { monitoring: false }
});

// Create demo projects
const demoProjects = [
  {
    id: 1,
    name: 'Q1 Product Launch Campaign',
    description: 'PR campaign for new product launch in Q1 2025',
    client: 'Demo Company',
    status: 'active',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Brand Reputation Management',
    description: 'Ongoing brand monitoring and reputation management',
    client: 'Demo Company',
    status: 'active',
    created_at: new Date('2024-12-15').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Crisis Response Plan',
    description: 'Crisis management protocols and response strategies',
    client: 'Demo Company',
    status: 'planning',
    created_at: new Date('2024-12-01').toISOString(),
    updated_at: new Date().toISOString()
  }
];

demoProjects.forEach(p => storage.projects.set(p.id, p));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// Authentication Routes
// ============================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'demo@signaldesk.com' && password === 'password') {
    const token = 'demo-token-' + Date.now();
    const user = {
      id: 'user-1',
      email: 'demo@signaldesk.com',
      name: 'Demo User',
      role: 'admin'
    };
    
    res.json({
      success: true,
      token,
      user
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token && token.startsWith('demo-token-')) {
    res.json({
      valid: true,
      user: {
        id: 'user-1',
        email: 'demo@signaldesk.com',
        name: 'Demo User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================
// Projects Routes
// ============================================

app.get('/api/projects', (req, res) => {
  const projects = Array.from(storage.projects.values());
  res.json({
    success: true,
    projects
  });
});

app.get('/api/projects/:id', (req, res) => {
  const project = storage.projects.get(parseInt(req.params.id));
  if (project) {
    res.json({
      success: true,
      project
    });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.post('/api/projects', (req, res) => {
  const { name, description, client } = req.body;
  const newProject = {
    id: storage.projects.size + 1,
    name,
    description,
    client,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  storage.projects.set(newProject.id, newProject);
  
  res.json({
    success: true,
    project: newProject
  });
});

app.put('/api/projects/:id', (req, res) => {
  const project = storage.projects.get(parseInt(req.params.id));
  if (project) {
    const updated = {
      ...project,
      ...req.body,
      updated_at: new Date().toISOString()
    };
    storage.projects.set(parseInt(req.params.id), updated);
    res.json({
      success: true,
      project: updated
    });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (storage.projects.has(id)) {
    storage.projects.delete(id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

// ============================================
// Todos Routes
// ============================================

app.get('/api/todos', (req, res) => {
  res.json({
    success: true,
    todos: storage.todos
  });
});

app.post('/api/todos', (req, res) => {
  const newTodo = {
    id: storage.todos.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  storage.todos.push(newTodo);
  res.json({
    success: true,
    todo: newTodo
  });
});

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = storage.todos.findIndex(t => t.id === id);
  if (todoIndex !== -1) {
    storage.todos[todoIndex] = {
      ...storage.todos[todoIndex],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    res.json({
      success: true,
      todo: storage.todos[todoIndex]
    });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = storage.todos.findIndex(t => t.id === id);
  if (todoIndex !== -1) {
    storage.todos.splice(todoIndex, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Todo not found' });
  }
});

// ============================================
// Memory Vault Routes
// ============================================

app.get('/api/projects/:projectId/memoryvault', (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const items = storage.memoryVault.get(projectId) || [];
  res.json({
    success: true,
    items
  });
});

app.post('/api/projects/:projectId/memoryvault', (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const items = storage.memoryVault.get(projectId) || [];
  const newItem = {
    id: items.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  items.push(newItem);
  storage.memoryVault.set(projectId, items);
  res.json({
    success: true,
    item: newItem
  });
});

// ============================================
// Stakeholder Intelligence Routes
// ============================================

app.post('/api/stakeholder-intelligence/discover-sources', async (req, res) => {
  const { stakeholderName, stakeholderType } = req.body;
  
  // Mock source discovery
  const sources = [
    {
      type: 'rss',
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(stakeholderName)}`,
      name: 'Google News',
      active: true
    },
    {
      type: 'twitter',
      handle: stakeholderName.toLowerCase().replace(/\s+/g, ''),
      name: 'Twitter/X',
      active: true
    },
    {
      type: 'website',
      url: `https://www.${stakeholderName.toLowerCase().replace(/\s+/g, '')}.com`,
      name: 'Official Website',
      active: true
    }
  ];
  
  res.json({ success: true, sources });
});
// Also support without /api prefix
app.post('/stakeholder-intelligence/discover-sources', async (req, res) => {
  const { stakeholderName, stakeholderType } = req.body;
  
  // Mock source discovery
  const sources = [
    {
      type: 'rss',
      url: `https://news.google.com/rss/search?q=${encodeURIComponent(stakeholderName)}`,
      name: 'Google News',
      active: true
    },
    {
      type: 'twitter',
      handle: stakeholderName.toLowerCase().replace(/\s+/g, ''),
      name: 'Twitter/X',
      active: true
    },
    {
      type: 'website',
      url: `https://www.${stakeholderName.toLowerCase().replace(/\s+/g, '')}.com`,
      name: 'Official Website',
      active: true
    }
  ];
  
  res.json({ success: true, sources });
});

app.post('/api/stakeholder-intelligence/configure', async (req, res) => {
  const { organizationId, stakeholders } = req.body;
  
  // Store configuration
  if (!storage.stakeholderConfigs) {
    storage.stakeholderConfigs = new Map();
  }
  storage.stakeholderConfigs.set(organizationId, stakeholders);
  
  res.json({ 
    success: true, 
    message: 'Stakeholder configuration saved',
    configuredCount: stakeholders.length 
  });
});
// Also support without /api prefix
app.post('/stakeholder-intelligence/configure', async (req, res) => {
  const { organizationId, stakeholders } = req.body;
  
  // Store configuration
  if (!storage.stakeholderConfigs) {
    storage.stakeholderConfigs = new Map();
  }
  storage.stakeholderConfigs.set(organizationId, stakeholders);
  
  res.json({ 
    success: true, 
    message: 'Stakeholder configuration saved',
    configuredCount: stakeholders.length 
  });
});

// Validate source endpoint
app.post('/api/stakeholder-intelligence/validate-source', async (req, res) => {
  const { url, type } = req.body;
  
  // Simple validation - just check if URL is valid
  try {
    new URL(url);
    res.json({ 
      valid: true, 
      message: 'Source is valid',
      type: type || 'website',
      reachable: true 
    });
  } catch (error) {
    res.json({ 
      valid: false, 
      message: 'Invalid URL format',
      error: error.message 
    });
  }
});
app.post('/stakeholder-intelligence/validate-source', async (req, res) => {
  const { url, type } = req.body;
  
  // Simple validation - just check if URL is valid
  try {
    new URL(url);
    res.json({ 
      valid: true, 
      message: 'Source is valid',
      type: type || 'website',
      reachable: true 
    });
  } catch (error) {
    res.json({ 
      valid: false, 
      message: 'Invalid URL format',
      error: error.message 
    });
  }
});

// ============================================
// Intelligence Discovery Routes - Real Data
// ============================================

app.post('/api/intelligence/discover-competitors', async (req, res) => {
  const { company, url } = req.body;
  
  try {
    // In a real implementation, this would:
    // 1. Scrape the company website
    // 2. Search news articles
    // 3. Query industry databases
    // 4. Use AI to identify competitors
    
    // For now, return intelligent defaults based on company
    const competitors = await discoverCompetitors(company, url);
    
    res.json({
      success: true,
      competitors,
      sources: ['Company website', 'Industry reports', 'News analysis', 'Market research']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/intelligence/discover-topics', async (req, res) => {
  const { company, url, industry } = req.body;
  
  try {
    // In production, this would analyze:
    // 1. Industry trends from news sources
    // 2. Regulatory filings
    // 3. Social media discussions
    // 4. Academic research
    
    const topics = await discoverTopics(company, url, industry);
    
    res.json({
      success: true,
      topics,
      trending: topics.slice(0, 3).map(t => ({ topic: t, momentum: 'rising' }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for discovery
async function discoverCompetitors(company, url) {
  const companyLower = company.toLowerCase();
  
  // Enhanced competitor discovery with more real-world data
  const competitorMap = {
    'openai': ['Anthropic', 'Google DeepMind', 'Microsoft AI', 'Cohere', 'Stability AI', 'Inflection AI', 'Character.AI'],
    'anthropic': ['OpenAI', 'Google DeepMind', 'Microsoft AI', 'Cohere', 'Meta AI', 'Mistral AI'],
    'microsoft': ['Google', 'Amazon', 'Apple', 'Meta', 'Salesforce', 'Oracle', 'IBM'],
    'google': ['Microsoft', 'Apple', 'Amazon', 'Meta', 'OpenAI', 'Baidu'],
    'apple': ['Samsung', 'Google', 'Microsoft', 'Amazon', 'Sony', 'Huawei'],
    'tesla': ['Rivian', 'Lucid Motors', 'Ford', 'GM', 'Volkswagen', 'BYD', 'NIO'],
    'amazon': ['Microsoft Azure', 'Google Cloud', 'Alibaba', 'Walmart', 'Target', 'eBay'],
    'netflix': ['Disney+', 'HBO Max', 'Amazon Prime', 'Apple TV+', 'Hulu', 'Paramount+'],
    'uber': ['Lyft', 'DoorDash', 'Grab', 'Didi', 'Bolt', 'Ola'],
    'airbnb': ['Booking.com', 'Vrbo', 'Hotels.com', 'Expedia', 'TripAdvisor'],
    'spotify': ['Apple Music', 'YouTube Music', 'Amazon Music', 'Tidal', 'Pandora'],
    'zoom': ['Microsoft Teams', 'Google Meet', 'Slack', 'WebEx', 'GoToMeeting'],
    'salesforce': ['Microsoft Dynamics', 'HubSpot', 'Oracle CRM', 'SAP', 'Zoho'],
    'shopify': ['WooCommerce', 'BigCommerce', 'Square', 'Wix', 'Magento'],
    'stripe': ['PayPal', 'Square', 'Adyen', 'Braintree', 'Razorpay'],
    'slack': ['Microsoft Teams', 'Discord', 'Zoom', 'Google Chat', 'Notion']
  };
  
  // Check for exact matches
  for (const [key, competitors] of Object.entries(competitorMap)) {
    if (companyLower.includes(key)) {
      return competitors;
    }
  }
  
  // Industry-based fallbacks
  if (companyLower.includes('ai') || companyLower.includes('artificial')) {
    return ['OpenAI', 'Google AI', 'Microsoft AI', 'Meta AI', 'Amazon AI'];
  }
  if (companyLower.includes('bank') || companyLower.includes('financial')) {
    return ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs'];
  }
  if (companyLower.includes('health') || companyLower.includes('medical')) {
    return ['UnitedHealth', 'Anthem', 'CVS Health', 'Kaiser Permanente', 'Cigna'];
  }
  
  // Default to generic competitors
  return ['Market Leader', 'Primary Competitor', 'Emerging Player', 'Industry Disruptor'];
}

async function discoverTopics(company, url, industry) {
  const companyLower = company.toLowerCase();
  
  // Industry-specific topics with real trending issues
  const topicMap = {
    'ai': [
      'AI Regulation & Governance',
      'AGI Development Timeline',
      'AI Safety & Alignment',
      'Large Language Models',
      'AI Ethics & Bias',
      'Generative AI Applications',
      'AI Chip Development',
      'Open Source vs Closed AI'
    ],
    'tech': [
      'Cloud Computing Trends',
      'Cybersecurity Threats',
      'Digital Transformation',
      'Privacy Regulations (GDPR/CCPA)',
      'Antitrust Investigations',
      'Remote Work Technology',
      'Quantum Computing',
      'Web3 & Blockchain'
    ],
    'finance': [
      'Digital Banking Innovation',
      'Cryptocurrency Regulation',
      'ESG Investing',
      'Fintech Disruption',
      'Interest Rate Changes',
      'CBDC Development',
      'Open Banking',
      'AI in Finance'
    ],
    'healthcare': [
      'Telehealth Adoption',
      'Drug Pricing Reform',
      'AI in Diagnostics',
      'Healthcare Data Privacy',
      'Personalized Medicine',
      'Mental Health Tech',
      'Medical Device Innovation',
      'Healthcare Accessibility'
    ],
    'retail': [
      'E-commerce Growth',
      'Supply Chain Resilience',
      'Sustainable Retail',
      'Social Commerce',
      'Retail Automation',
      'Customer Experience Tech',
      'Last-Mile Delivery',
      'Omnichannel Strategy'
    ],
    'automotive': [
      'EV Market Growth',
      'Autonomous Driving',
      'Battery Technology',
      'Charging Infrastructure',
      'Sustainability Standards',
      'Supply Chain Issues',
      'Connected Vehicles',
      'Alternative Fuels'
    ]
  };
  
  // Determine industry from company name or URL
  let selectedTopics = [];
  
  if (companyLower.includes('ai') || companyLower.includes('openai') || companyLower.includes('anthropic')) {
    selectedTopics = topicMap['ai'];
  } else if (companyLower.includes('bank') || companyLower.includes('capital') || companyLower.includes('financial')) {
    selectedTopics = topicMap['finance'];
  } else if (companyLower.includes('health') || companyLower.includes('medical') || companyLower.includes('pharma')) {
    selectedTopics = topicMap['healthcare'];
  } else if (companyLower.includes('retail') || companyLower.includes('shop') || companyLower.includes('commerce')) {
    selectedTopics = topicMap['retail'];
  } else if (companyLower.includes('car') || companyLower.includes('auto') || companyLower.includes('tesla')) {
    selectedTopics = topicMap['automotive'];
  } else {
    // Default to tech topics
    selectedTopics = topicMap['tech'];
  }
  
  // Return top 6 most relevant topics
  return selectedTopics.slice(0, 6);
}

// ============================================
// AI Assistant Routes
// ============================================

app.post('/api/ai/chat', (req, res) => {
  const { message, projectId } = req.body;
  
  // Simulate AI response
  const responses = [
    "I understand your request. Let me help you with that PR strategy.",
    "Based on your project goals, I recommend focusing on thought leadership content.",
    "Here's a data-driven approach to improve your media outreach.",
    "I've analyzed your campaign metrics. Here are my recommendations."
  ];
  
  res.json({
    success: true,
    response: responses[Math.floor(Math.random() * responses.length)],
    suggestions: [
      "Consider expanding your media list",
      "Review your key messaging",
      "Schedule a press release"
    ]
  });
});

// ============================================
// Content Generator Routes
// ============================================

app.post('/api/content/generate', (req, res) => {
  const { type, topic, tone } = req.body;
  
  res.json({
    success: true,
    content: {
      title: `Generated ${type} about ${topic}`,
      body: `This is a professionally crafted ${type} with a ${tone} tone about ${topic}. It engages the audience effectively and delivers key messages clearly.`,
      wordCount: 250,
      readingTime: "1 min"
    }
  });
});

app.get('/api/content/history', (req, res) => {
  res.json({
    success: true,
    history: storage.contentHistory
  });
});

app.post('/api/content/save', (req, res) => {
  const newContent = {
    id: storage.contentHistory.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  storage.contentHistory.push(newContent);
  res.json({
    success: true,
    content: newContent
  });
});

app.get('/api/content/templates', (req, res) => {
  res.json({
    success: true,
    templates: storage.templates.length > 0 ? storage.templates : [
      { id: 1, name: 'Press Release Template', type: 'press_release' },
      { id: 2, name: 'Media Pitch Template', type: 'pitch' },
      { id: 3, name: 'Crisis Statement Template', type: 'crisis' }
    ]
  });
});

// ============================================
// Media List Routes
// ============================================

app.post('/api/media/search-reporters', (req, res) => {
  const { beat, outlet } = req.body;
  
  const mockReporters = [
    {
      id: 1,
      name: 'Jane Smith',
      outlet: 'TechCrunch',
      beat: 'AI & Machine Learning',
      email: 'jane@techcrunch.com',
      twitter: '@janesmith'
    },
    {
      id: 2,
      name: 'John Doe',
      outlet: 'The Verge',
      beat: 'Consumer Tech',
      email: 'john@theverge.com',
      twitter: '@johndoe'
    }
  ];
  
  res.json({
    success: true,
    reporters: mockReporters
  });
});

app.get('/api/media/contacts', (req, res) => {
  res.json({
    success: true,
    contacts: storage.mediaContacts
  });
});

app.post('/api/media/contacts', (req, res) => {
  const newContact = {
    id: storage.mediaContacts.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  storage.mediaContacts.push(newContact);
  res.json({
    success: true,
    contact: newContact
  });
});

app.get('/api/media/lists', (req, res) => {
  res.json({
    success: true,
    lists: storage.mediaLists
  });
});

app.post('/api/media/lists', (req, res) => {
  const newList = {
    id: storage.mediaLists.length + 1,
    ...req.body,
    created_at: new Date().toISOString()
  };
  storage.mediaLists.push(newList);
  res.json({
    success: true,
    list: newList
  });
});

// ============================================
// Monitoring Routes (Intelligence) - Fixed paths
// ============================================

// Note: apiService.js calls these without /api prefix, but adds it via API_BASE_URL
app.get('/api/intelligence/monitor/status/:orgId', (req, res) => {
  const { orgId } = req.params;
  const isMonitoring = storage.monitoringStatus.get(orgId) || false;
  
  const targets = Array.from(storage.targets.values()).filter(t => t.organization_id === orgId);
  const recentFindings = storage.findings.filter(f => {
    const findingTime = new Date(f.created_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return findingTime > dayAgo;
  });
  const recentOpportunities = storage.opportunities.filter(o => {
    const oppTime = new Date(o.created_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return o.organization_id === orgId && oppTime > dayAgo;
  });
  
  res.json({
    monitoring: isMonitoring,
    active_targets: targets.filter(t => t.active).length,
    active_sources: targets.reduce((sum, t) => sum + (t.sources?.length || 0), 0),
    findings_24h: recentFindings.length,
    opportunities_24h: recentOpportunities.length,
    health: isMonitoring ? 85 : 25,
    lastCheck: new Date().toISOString()
  });
});
// Also support without /api prefix  
app.get('/intelligence/monitor/status/:orgId', (req, res) => {
  const { orgId } = req.params;
  const isMonitoring = storage.monitoringStatus.get(orgId) || false;
  
  const targets = Array.from(storage.targets.values()).filter(t => t.organization_id === orgId);
  const recentFindings = storage.findings.filter(f => {
    const findingTime = new Date(f.created_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return findingTime > dayAgo;
  });
  const recentOpportunities = storage.opportunities.filter(o => {
    const oppTime = new Date(o.created_at);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return o.organization_id === orgId && oppTime > dayAgo;
  });
  
  res.json({
    monitoring: isMonitoring,
    active_targets: targets.filter(t => t.active).length,
    active_sources: targets.reduce((sum, t) => sum + (t.sources?.length || 0), 0),
    findings_24h: recentFindings.length,
    opportunities_24h: recentOpportunities.length,
    health: isMonitoring ? 85 : 25,
    lastCheck: new Date().toISOString()
  });
});

// Support both with and without /api prefix for compatibility
app.post('/api/intelligence/monitor/start', handleMonitorStart);
app.post('/intelligence/monitor/start', handleMonitorStart);

function handleMonitorStart(req, res) {
  const { organizationId } = req.body;
  storage.monitoringStatus.set(organizationId, true);
  
  const org = storage.organizations.get(organizationId);
  if (org) {
    org.metadata.monitoring = true;
  }
  
  res.json({ 
    status: 'started', 
    organizationId,
    nextRun: new Date(Date.now() + 30 * 60000).toISOString()
  });
}

app.post('/api/intelligence/monitor/stop', (req, res) => {
  const { organizationId } = req.body;
  storage.monitoringStatus.set(organizationId, false);
  
  const org = storage.organizations.get(organizationId);
  if (org) {
    org.metadata.monitoring = false;
  }
  
  res.json({ status: 'stopped', organizationId });
});

// ============================================
// Intelligence Targets Routes - Support both paths
// ============================================

// Create target endpoint
app.post('/api/intelligence/targets', (req, res) => {
  const target = {
    id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...req.body,
    created_at: new Date().toISOString(),
    active: true
  };
  
  storage.targets.set(target.id, target);
  console.log('Created target:', target.id, target.name);
  res.json(target);
});
app.post('/intelligence/targets', (req, res) => {
  const target = {
    id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...req.body,
    created_at: new Date().toISOString(),
    active: true
  };
  
  storage.targets.set(target.id, target);
  console.log('Created target:', target.id, target.name);
  res.json(target);
});

// Support routes without /api prefix (called by apiService)
app.get('/intelligence/organizations/:orgId/targets', handleGetTargets);
app.get('/api/intelligence/organizations/:orgId/targets', handleGetTargets);

function handleGetTargets(req, res) {
  const { orgId } = req.params;
  const targets = Array.from(storage.targets.values())
    .filter(t => t.organization_id === orgId);
  
  if (targets.length === 0 && orgId === mockOrgId) {
    const demoTargets = [
      {
        id: 'target-1',
        organization_id: orgId,
        name: 'OpenAI',
        type: 'competitor',
        active: true,
        priority: 'high',
        threat_level: 75,
        findings_count: 12,
        avg_sentiment: 0.3
      },
      {
        id: 'target-2',
        organization_id: orgId,
        name: 'AI Regulation',
        type: 'topic',
        active: true,
        priority: 'medium',
        findings_count: 8,
        avg_sentiment: -0.1
      },
      {
        id: 'target-3',
        organization_id: orgId,
        name: 'Microsoft',
        type: 'competitor',
        active: true,
        priority: 'high',
        threat_level: 68,
        findings_count: 15,
        avg_sentiment: 0.5
      }
    ];
    
    demoTargets.forEach(t => storage.targets.set(t.id, t));
    return res.json(demoTargets);
  }
  
  res.json(targets);
}

// ============================================
// Findings Routes - Support both paths
// ============================================

app.get('/intelligence/findings', handleGetFindings);
app.get('/api/intelligence/findings', handleGetFindings);

function handleGetFindings(req, res) {
  const { organizationId, limit = 20 } = req.query;
  
  if (storage.findings.length === 0) {
    const demoFindings = [
      {
        id: 'finding-1',
        target_id: 'target-1',
        target_name: 'OpenAI',
        title: 'OpenAI Announces New GPT-5 Model',
        content: 'OpenAI has revealed details about their upcoming GPT-5 model...',
        sentiment_score: 0.7,
        relevance_score: 0.95,
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'finding-2',
        target_id: 'target-2',
        target_name: 'AI Regulation',
        title: 'EU Proposes Stricter AI Guidelines',
        content: 'The European Union is considering new regulations...',
        sentiment_score: -0.3,
        relevance_score: 0.88,
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'finding-3',
        target_id: 'target-3',
        target_name: 'Microsoft',
        title: 'Microsoft Integrates AI Across Office Suite',
        content: 'Microsoft announces comprehensive AI integration...',
        sentiment_score: 0.5,
        relevance_score: 0.82,
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    storage.findings.push(...demoFindings);
  }
  
  const findings = storage.findings.slice(0, parseInt(limit));
  res.json(findings);
}

// ============================================
// Opportunities Routes - Support both paths
// ============================================

app.get('/opportunities/organization/:orgId', handleGetOpportunities);
app.get('/api/opportunities/organization/:orgId', handleGetOpportunities);

function handleGetOpportunities(req, res) {
  const { orgId } = req.params;
  const { status = 'identified', limit = 10 } = req.query;
  
  if (storage.opportunities.length === 0 && orgId === mockOrgId) {
    const demoOpportunities = [
      {
        id: 'opp-1',
        organization_id: orgId,
        title: 'AI Ethics Content Gap',
        description: 'Competitors haven\'t addressed AI ethics concerns in their messaging',
        nvs_score: 82,
        urgency: 'high',
        opportunity_type: 'content',
        status: 'identified',
        recommended_actions: JSON.stringify([
          'Create thought leadership content on AI ethics',
          'Host webinar on responsible AI development',
          'Partner with ethics organizations'
        ]),
        created_at: new Date().toISOString()
      },
      {
        id: 'opp-2',
        organization_id: orgId,
        title: 'Enterprise AI Integration Services',
        description: 'Market demand for enterprise AI integration is underserved',
        nvs_score: 75,
        urgency: 'medium',
        opportunity_type: 'product',
        status: 'identified',
        recommended_actions: JSON.stringify([
          'Develop enterprise integration package',
          'Create case studies from current clients',
          'Target Fortune 500 companies'
        ]),
        created_at: new Date().toISOString()
      }
    ];
    
    storage.opportunities.push(...demoOpportunities);
  }
  
  const opportunities = storage.opportunities
    .filter(o => o.organization_id === orgId && o.status === status)
    .slice(0, parseInt(limit));
    
  res.json(opportunities);
}

app.post('/api/opportunities/identify', (req, res) => {
  const { organizationId } = req.body;
  
  const newOpp = {
    id: `opp-${Date.now()}`,
    organization_id: organizationId,
    title: 'Emerging Market Opportunity',
    description: 'New market segment showing interest in AI solutions',
    nvs_score: Math.floor(Math.random() * 30) + 70,
    urgency: Math.random() > 0.5 ? 'high' : 'medium',
    opportunity_type: 'market',
    status: 'identified',
    created_at: new Date().toISOString()
  };
  
  storage.opportunities.push(newOpp);
  
  res.json({
    identified: 1,
    opportunities: [newOpp]
  });
});

app.patch('/api/opportunities/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const opp = storage.opportunities.find(o => o.id === id);
  if (opp) {
    opp.status = status;
    opp.updated_at = new Date().toISOString();
  }
  
  res.json(opp || { error: 'Opportunity not found' });
});

// ============================================
// Monitoring Metrics - Support both paths
// ============================================

app.get('/monitoring/metrics/:orgId', handleGetMetrics);
app.get('/api/monitoring/metrics/:orgId', handleGetMetrics);

function handleGetMetrics(req, res) {
  const { days = 7 } = req.query;
  
  const metrics = [];
  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    metrics.push({
      metric_date: date.toISOString().split('T')[0],
      findings_count: Math.floor(Math.random() * 20) + 5,
      opportunities_identified: Math.floor(Math.random() * 3),
      average_relevance: Math.random() * 0.3 + 0.7,
      average_sentiment: Math.random() * 0.4 - 0.2,
      source_coverage: Math.random() * 0.2 + 0.8
    });
  }
  
  res.json(metrics);
}

app.post('/api/monitoring/trigger/:orgId', (req, res) => {
  const { orgId } = req.params;
  
  const newFinding = {
    id: `finding-${Date.now()}`,
    target_id: 'target-1',
    target_name: 'OpenAI',
    title: `New Development at ${new Date().toLocaleTimeString()}`,
    content: 'Latest monitoring cycle discovered new activity...',
    sentiment_score: Math.random() * 2 - 1,
    relevance_score: Math.random() * 0.5 + 0.5,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  storage.findings.unshift(newFinding);
  
  res.json({
    status: 'completed',
    findings: 1,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Crisis Management Routes
// ============================================

app.post('/api/crisis/generate-plan', (req, res) => {
  const { projectId, scenario } = req.body;
  
  const plan = {
    id: `crisis-${Date.now()}`,
    projectId,
    scenario,
    steps: [
      'Assess the situation immediately',
      'Convene crisis response team',
      'Draft initial statement',
      'Monitor media and social channels',
      'Prepare detailed response strategy'
    ],
    created_at: new Date().toISOString()
  };
  
  storage.crisisPlans.set(projectId, plan);
  
  res.json({
    success: true,
    plan
  });
});

app.get('/api/crisis/plan/:projectId', (req, res) => {
  const plan = storage.crisisPlans.get(parseInt(req.params.projectId));
  if (plan) {
    res.json({ success: true, plan });
  } else {
    res.json({ 
      success: true, 
      plan: null,
      message: 'No crisis plan found for this project'
    });
  }
});

// ============================================
// Organizations
// ============================================

app.get('/api/organizations', (req, res) => {
  res.json(Array.from(storage.organizations.values()));
});

app.get('/api/organizations/:id', (req, res) => {
  const org = storage.organizations.get(req.params.id);
  if (org) {
    res.json(org);
  } else {
    res.status(404).json({ error: 'Organization not found' });
  }
});

// ============================================
// Campaign Intelligence Routes
// ============================================

app.get('/api/campaign/insights/:projectId', (req, res) => {
  res.json({
    success: true,
    insights: {
      reach: 125000,
      engagement: 8.5,
      sentiment: 0.72,
      topPerformingContent: 'Product Launch Announcement',
      recommendations: [
        'Increase social media frequency',
        'Focus on video content',
        'Engage with industry influencers'
      ]
    }
  });
});

// ============================================
// Monitoring (Sentiment) Routes
// ============================================

app.get('/api/monitoring/sentiment', (req, res) => {
  res.json({
    success: true,
    data: {
      overall: 0.65,
      trend: 'improving',
      mentions: 234,
      sources: {
        twitter: 120,
        news: 56,
        reddit: 38,
        linkedin: 20
      }
    }
  });
});

app.post('/api/monitoring/config', (req, res) => {
  // Store config in memory (would be in database in production)
  res.json({
    success: true,
    message: 'Monitoring configuration saved'
  });
});

app.get('/api/monitoring/config', (req, res) => {
  res.json({
    success: true,
    config: {
      keywords: ['AI', 'machine learning', 'automation'],
      sources: ['twitter', 'news', 'reddit'],
      alertThreshold: 0.3
    }
  });
});

// ============================================
// Reports Routes
// ============================================

app.post('/api/reports/generate', (req, res) => {
  const { projectId, type, dateRange } = req.body;
  
  res.json({
    success: true,
    report: {
      id: `report-${Date.now()}`,
      projectId,
      type,
      dateRange,
      url: `/reports/download/report-${Date.now()}.pdf`,
      created_at: new Date().toISOString()
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler - must be last
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SignalDesk Complete Backend running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check at http://localhost:${PORT}/health`);
  console.log(`\n📝 Demo Credentials: demo@signaldesk.com / password`);
  console.log(`📝 Demo Organization ID: ${mockOrgId}`);
  console.log('\n✨ All platform features are now available!');
});