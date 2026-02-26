const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for testing
const storage = {
  organizations: new Map(),
  targets: new Map(),
  findings: [],
  opportunities: [],
  monitoringStatus: new Map()
};

// Mock organization for testing
const mockOrgId = 'org-demo-123';
storage.organizations.set(mockOrgId, {
  id: mockOrgId,
  name: 'Demo Organization',
  metadata: { monitoring: false }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// Authentication Routes
// ============================================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo credentials check
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

// Verify token endpoint
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // For demo, any token starting with 'demo-token-' is valid
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
// Monitoring Routes
// ============================================

// Get monitoring status
app.get('/api/intelligence/monitor/status/:orgId', (req, res) => {
  const { orgId } = req.params;
  const isMonitoring = storage.monitoringStatus.get(orgId) || false;
  
  // Calculate metrics
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

// Start monitoring
app.post('/api/intelligence/monitor/start', (req, res) => {
  const { organizationId } = req.body;
  storage.monitoringStatus.set(organizationId, true);
  
  // Update organization
  const org = storage.organizations.get(organizationId);
  if (org) {
    org.metadata.monitoring = true;
  }
  
  res.json({ 
    status: 'started', 
    organizationId,
    nextRun: new Date(Date.now() + 30 * 60000).toISOString()
  });
});

// Stop monitoring
app.post('/api/intelligence/monitor/stop', (req, res) => {
  const { organizationId } = req.body;
  storage.monitoringStatus.set(organizationId, false);
  
  // Update organization
  const org = storage.organizations.get(organizationId);
  if (org) {
    org.metadata.monitoring = false;
  }
  
  res.json({ status: 'stopped', organizationId });
});

// ============================================
// Intelligence Targets Routes
// ============================================

// Get organization targets
app.get('/api/intelligence/organizations/:orgId/targets', (req, res) => {
  const { orgId } = req.params;
  const targets = Array.from(storage.targets.values())
    .filter(t => t.organization_id === orgId);
  
  // Add some demo targets if none exist
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
});

// ============================================
// Findings Routes
// ============================================

// Get findings
app.get('/api/intelligence/findings', (req, res) => {
  const { organizationId, limit = 20 } = req.query;
  
  // Generate some demo findings
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
});

// ============================================
// Opportunities Routes
// ============================================

// Get opportunities
app.get('/api/opportunities/organization/:orgId', (req, res) => {
  const { orgId } = req.params;
  const { status = 'identified', limit = 10 } = req.query;
  
  // Generate demo opportunities
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
});

// Identify opportunities
app.post('/api/opportunities/identify', (req, res) => {
  const { organizationId } = req.body;
  
  // Simulate finding new opportunities
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

// Update opportunity status
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
// Monitoring Metrics
// ============================================

app.get('/api/monitoring/metrics/:orgId', (req, res) => {
  const { days = 7 } = req.query;
  
  // Generate demo metrics
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
});

// Trigger monitoring
app.post('/api/monitoring/trigger/:orgId', (req, res) => {
  const { orgId } = req.params;
  
  // Simulate adding new findings
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
// Organizations (for demo)
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SignalDesk Backend running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check at http://localhost:${PORT}/health`);
  console.log(`\n📝 Demo Organization ID: ${mockOrgId}`);
  console.log('   Use this ID when testing the Intelligence Dashboard\n');
});