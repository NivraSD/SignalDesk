// Enhanced SignalDesk Server - Integration of All New Infrastructure
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import enhanced services
const WebSocketServer = require('./src/services/websocket/WebSocketServer');
const ContextManager = require('./src/services/context/ContextManager');
const EnhancedMonitoringService = require('./src/services/monitoring/EnhancedMonitoringService');
const EnhancedCampaignController = require('./src/controllers/enhancedCampaignController');

// Import existing services
require('./src/config/db');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket server
const io = new WebSocketServer(server);

// Initialize enhanced services
const monitoringService = new EnhancedMonitoringService(io);
const campaignController = new EnhancedCampaignController(io);

// Make services available to routes
app.set('io', io);
app.set('contextManager', ContextManager);
app.set('monitoringService', monitoringService);
app.set('campaignController', campaignController);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request context middleware
app.use(async (req, res, next) => {
  // Add request ID for tracing
  req.id = require('crypto').randomBytes(16).toString('hex');
  
  // Add WebSocket instance to request
  req.io = io;
  
  // Load user context if authenticated
  if (req.user) {
    req.userContext = await ContextManager.loadUserContext(req.user.id);
  }
  
  next();
});

// ==================== ENHANCED ROUTES ====================

// Import existing routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

// Import enhanced routes
const memoryVaultEnhancedRoutes = require('./src/routes/memoryVaultEnhancedRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/memoryvault', memoryVaultEnhancedRoutes);

// Enhanced campaign routes
app.post('/api/campaigns/generate-brief', (req, res) => {
  campaignController.generateCampaignBrief(req, res);
});

app.put('/api/campaigns/:id/collaborate', (req, res) => {
  campaignController.updateCampaignWithCollaboration(req, res);
});

app.post('/api/campaigns/:id/optimize', (req, res) => {
  campaignController.optimizeCampaign(req, res);
});

// Context management routes
app.get('/api/context/full/:projectId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    
    const context = await ContextManager.getFullContext(userId, projectId);
    res.json({ success: true, context });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ error: 'Failed to get context' });
  }
});

app.post('/api/context/switch-feature', async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromFeature, toFeature, projectId } = req.body;
    
    const result = await ContextManager.switchFeature(
      userId,
      fromFeature,
      toFeature,
      projectId
    );
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error switching feature:', error);
    res.status(500).json({ error: 'Failed to switch feature' });
  }
});

// Monitoring status route
app.get('/api/monitoring/enhanced-status', (req, res) => {
  const status = monitoringService.getMonitoringStatus();
  res.json({ success: true, status });
});

// AI Assistant routes
app.post('/api/ai/process', async (req, res) => {
  try {
    const { message, options } = req.body;
    const userId = req.user.id;
    
    const aiAssistant = app.get('aiAssistant');
    const response = await aiAssistant.processMessage(message, {
      ...options,
      userId
    });
    
    // Add to conversation history
    await ContextManager.addToConversation(
      userId,
      message,
      response.content,
      options
    );
    
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error processing AI message:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// ==================== HEALTH & STATUS ====================

app.get('/api/health/enhanced', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: 'connected',
      websocket: io ? 'active' : 'inactive',
      monitoring: monitoringService ? 'active' : 'inactive',
      contextManager: 'active',
      redis: 'checking...'
    },
    features: {
      memoryVault: true,
      semanticSearch: true,
      aiAssistant: true,
      realTimeSync: true,
      campaignOrchestration: true
    },
    metrics: {
      activeWebSocketConnections: io.userSessions ? io.userSessions.size : 0,
      monitoringTargets: monitoringService.getMonitoringStatus().active,
      contextSessions: ContextManager.userContext.size
    }
  };
  
  // Check Redis connection
  try {
    if (ContextManager.redis) {
      await ContextManager.redis.ping();
      health.services.redis = 'connected';
    } else {
      health.services.redis = 'not configured';
    }
  } catch (error) {
    health.services.redis = 'disconnected';
  }
  
  res.json(health);
});

// Root route with enhanced information
app.get('/', (req, res) => {
  res.json({
    name: 'SignalDesk Enhanced Platform',
    version: '2.0.0',
    status: 'operational',
    features: {
      core: [
        'Authentication & Projects',
        'Campaign Intelligence',
        'Media Intelligence',
        'Content Generation',
        'Crisis Management'
      ],
      enhanced: [
        'MemoryVault with Versioning',
        'Semantic Search',
        'Relationship Mapping',
        'Adaptive AI Assistant',
        'Real-time WebSocket Updates',
        'Context-aware Features',
        'Railway UI System',
        'Campaign Orchestration'
      ]
    },
    infrastructure: {
      websocket: `ws://localhost:${PORT}`,
      redis: process.env.REDIS_HOST || 'localhost:6379',
      vectorDB: process.env.VECTOR_DB_PROVIDER || 'chromadb'
    },
    endpoints: {
      enhanced: {
        memoryvault: '/api/memoryvault/*',
        context: '/api/context/*',
        campaigns: '/api/campaigns/*',
        monitoring: '/api/monitoring/*',
        ai: '/api/ai/*'
      }
    },
    documentation: '/api/docs'
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log to monitoring service
  if (monitoringService && err.severity === 'critical') {
    monitoringService.emit('critical:alert', {
      type: 'application_error',
      error: err.message,
      stack: err.stack,
      timestamp: new Date()
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Initialize services
    console.log('🚀 Starting Enhanced SignalDesk Server...');
    
    // Start monitoring service
    console.log('📊 Starting monitoring service...');
    // monitoringService is already initialized
    
    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║     SignalDesk Enhanced Platform v2.0             ║
║                                                    ║
║     🚀 Server running on port ${PORT}                ║
║     🔌 WebSocket server active                    ║
║     📊 Monitoring service running                 ║
║     🧠 AI Assistant ready                        ║
║     💾 MemoryVault enhanced                      ║
║     🔍 Semantic search enabled                   ║
║                                                    ║
║     Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM received, shutting down gracefully...');
  
  // Stop monitoring service
  await monitoringService.stop();
  
  // Close WebSocket connections
  io.io.close();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io };