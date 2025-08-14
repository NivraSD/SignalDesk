// SIGNALDESK MAIN SERVER - index.js
// Version 2.0 - With ALL routes including Campaign, Opportunity, Media
console.log('🚀🚀🚀 STARTING SIGNALDESK SERVER v2.0 🚀🚀🚀');
console.log('📍 This is index.js with FULL server implementation');
console.log('⏰ Deploy time:', new Date().toISOString());
console.log('🔄 Redeployed with CONVERSATION STATE FIX - ', new Date().toISOString());
console.log('✅ Persistent conversation state management active');
console.log('🔄 DEPLOYMENT TRIGGER:', Date.now());
console.log('🚨 CRITICAL FIXES APPLIED - BUILD ID:', Math.random());

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables BEFORE using them (only in development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

// Initialize Claude service IMMEDIATELY after environment setup
const claudeInit = require('./src/utils/claudeInit');
if (!claudeInit.isInitialized) {
  console.error('⚠️  WARNING: Claude service not properly initialized!');
  console.error('   SignalDesk will run but AI features will not work.');
  console.error('   Fix: Set ANTHROPIC_API_KEY in Railway Dashboard');
}

// Add this near the top of server.js
require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 3000; // Railway standard default

// MOST PERMISSIVE CORS CONFIGURATION - Allows everything
console.log('🔓 Setting up PERMISSIVE CORS - allowing ALL origins');
const corsOptions = {
  origin: true, // Allow ALL origins
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Allow all HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'], // Allow common headers
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'], // Expose additional headers if needed
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers middleware for maximum compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled for:', req.path);
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import middleware
const authMiddleware = require("./src/middleware/authMiddleware");

// Root route - COMPREHENSIVE ENDPOINT LISTING
app.get('/', (req, res) => {
  console.log("🏠 Root endpoint accessed from:", req.headers.origin || 'direct');
  res.json({
    message: "🚀 SignalDesk Platform API v2.0 - BULLETPROOF SERVER",
    version: "2.0.0",
    status: "operational",
    serverFile: "index.js",
    deployTime: new Date().toISOString(),
    cors: "PERMISSIVE - All origins allowed",
    authentication: {
      demo: {
        email: "demo@signaldesk.com",
        password: "demo123 OR password",
        note: "Both passwords work for demo user"
      }
    },
    endpoints: {
      public: {
        health: "GET /api/health",
        test: "GET|POST /api/test",
        login: "POST /api/auth/login",
        verify: "GET|POST /api/auth/verify",
        verifyManual: "GET|POST /api/auth/verify-manual"
      },
      protected: {
        projects: {
          list: "GET /api/projects",
          create: "POST /api/projects",
          get: "GET /api/projects/:id",
          update: "PUT /api/projects/:id",
          delete: "DELETE /api/projects/:id"
        },
        todos: {
          list: "GET /api/todos",
          create: "POST /api/todos", 
          update: "PUT /api/todos/:id",
          delete: "DELETE /api/todos/:id"
        },
        ai: "POST /api/content/ai-generate",
        crisis: "POST /api/crisis/analyze",
        campaigns: "POST /api/campaigns/analyze",
        monitoring: "GET /api/monitoring/status"
      }
    },
    database: "PostgreSQL with fallback to mock data",
    monitoring: "Active - Processing 5,000+ articles every 5 minutes",
    notes: [
      "All CORS restrictions removed for maximum compatibility",
      "Demo user works with both demo123 and password",
      "All endpoints have comprehensive error handling",
      "Database failures return mock data to keep frontend working",
      "Enhanced logging for all requests and responses"
    ]
  });
});

// Import routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const todoRoutes = require("./routes/todoRoutes");
const assistantRoutes = require("./src/routes/assistantRoutes");
const claudeDiagnosticsRoutes = require("./src/routes/claudeDiagnosticsRoutes");
const campaignRoutes = require("./src/routes/campaignRoutes");
const contentRoutes = require("./src/routes/contentRoutes");
// const crisisRoutes = require("./src/routes/crisisRoutes"); // OLD - doesn't parse Claude responses properly
// const crisisRoutes = require("./src/routes/crisisRoutesFix"); // FIXED but incomplete
const crisisRoutes = require("./src/routes/crisisRoutesComplete"); // COMPLETE - full crisis plans with all sections
const monitoringRoutes = require("./src/routes/monitoringRoutes");
// const mediaRoutes = require("./src/routes/mediaRoutes"); // OLD - doesn't work with Claude
// const mediaRoutes = require("./src/routes/mediaRoutesFix"); // FIXED - but basic
const mediaRoutes = require("./src/routes/mediaIntelligenceRoutes"); // NEW - Full Media Intelligence Platform with agents
// const aiRoutes = require("./routes/aiRoutes"); // OLD BROKEN VERSION
// const aiRoutes = require("./routes/aiRoutesFixed"); // HARDCODED VERSION
const aiRoutes = require("./routes/aiRoutesClaudeFix"); // CLAUDE NATURAL - Proper AI with constraints
const memoryvaultRoutes = require("./routes/memoryvaultRoutes");
const stakeholderRoutes = require("./src/routes/stakeholderRoutes");
const intelligenceRoutes = require("./src/routes/intelligenceRoutes");
const stakeholderIntelligenceRoutes = require("./src/routes/stakeholderIntelligenceRoutes");
const opportunitiesRoutes = require("./src/routes/opportunitiesRoutes");
const opportunityRoutes = require("./src/routes/opportunityRoutes");
const proxyRoutes = require("./src/routes/proxy");
const organizationRoutes = require("./src/routes/organizationRoutes");
const sourceConfigRoutes = require("./src/routes/sourceConfigRoutes");
const missingEndpointsRoutes = require("./src/routes/missingEndpointsRoutes");
const enhancedClaudeRoutes = require("./src/routes/enhancedClaudeRoutes");
const healthCheckRoutes = require("./src/routes/healthCheckRoutes");
const mcpRoutes = require("./src/routes/mcpRoutes");
const nivRoutes = require("./src/routes/nivRoutes");
const aiClaudeRoutes = require("./src/routes/aiClaudeRoutes"); // Main Claude API endpoints

// Database initialization routes (MUST BE BEFORE AUTH FOR PUBLIC ACCESS)
const databaseInitRoutes = require("./src/routes/databaseInit");
app.use("/api", databaseInitRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SignalDesk API is running",
    timestamp: new Date().toISOString(),
  });
});

// Version endpoint for deployment verification
app.get('/api/version', (req, res) => {
  res.json({
    version: process.env.RAILWAY_DEPLOYMENT_ID || 'local',
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    timestamp: new Date().toISOString(),
    cache_buster: Date.now(),
    build_id: process.env.BUILD_ID || Math.random().toString(36).substring(7),
    deployment_time: process.env.DEPLOYMENT_TIME || new Date().toISOString()
  });
});

// Add deployment monitoring
const deploymentMonitor = require('./src/routes/deploymentMonitor');
app.use('/api', deploymentMonitor);

// Test endpoint for CORS and connectivity
app.get("/api/test", (req, res) => {
  console.log("🧪 Test endpoint called from origin:", req.headers.origin || 'no-origin');
  res.json({
    success: true,
    message: "CORS and connectivity test successful",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'no-origin',
    method: req.method,
    userAgent: req.headers['user-agent'] || 'unknown'
  });
});

// Test POST endpoint
app.post("/api/test", (req, res) => {
  console.log("🧪 POST test endpoint called with body:", Object.keys(req.body));
  res.json({
    success: true,
    message: "POST test successful",
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Enhanced logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'no-origin';
  const userAgent = req.headers['user-agent'] || 'no-user-agent';
  const authHeader = req.headers.authorization ? 'with-auth' : 'no-auth';
  
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${origin}`);
  console.log(`  Auth: ${authHeader}`);
  console.log(`  Body keys: ${Object.keys(req.body || {}).join(', ') || 'none'}`);
  
  // Log error responses
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`❌ Error Response ${res.statusCode} for ${req.method} ${req.path}:`, data);
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ Success Response ${res.statusCode} for ${req.method} ${req.path}`);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

// API Routes
// ⚡ Public routes (NO auth required) - LOAD FIRST
app.use("/api", healthCheckRoutes); // Health check and monitoring - MUST BE FIRST
app.use("/api/auth", authRoutes);
app.use("/api/proxy", proxyRoutes); // Proxy routes for external APIs (CORS avoidance)
app.use("/api/claude-diagnostics", claudeDiagnosticsRoutes); // Claude diagnostics for debugging
app.use("/api", aiClaudeRoutes); // Main Claude API endpoints - MUST BE EARLY for /ai/claude/message

// ⚡ ORIGINAL SOPHISTICATED ROUTES - Load BEFORE generic Claude routes
// CRITICAL: These MUST load before enhancedClaudeRoutes to prevent override
// These have industry-specific prompts and detailed implementations
app.use("/api/organizations", authMiddleware, organizationRoutes);
app.use("/api/assistant", authMiddleware, assistantRoutes);
app.use("/api/projects", authMiddleware, projectRoutes);
app.use("/api/todos", authMiddleware, todoRoutes);
app.use("/api/content", authMiddleware, contentRoutes);  // Sophisticated content analysis - MUST BE BEFORE generic
app.use("/api/crisis", authMiddleware, crisisRoutes);  // Detailed crisis plan structure - MUST BE BEFORE generic
app.use("/api/media", authMiddleware, mediaRoutes);  // Journalist discovery with Claude - MUST BE BEFORE generic
app.use("/api/campaigns", authMiddleware, campaignRoutes);  // Campaign strategy - MUST BE BEFORE generic
app.use("/api/monitoring", authMiddleware, monitoringRoutes);
app.use("/api/source-config", authMiddleware, sourceConfigRoutes);
const monitoringRoutesV2 = require("./src/routes/monitoringRoutesV2");
app.use("/api/monitoring/v2", authMiddleware, monitoringRoutesV2);
const ultimateMonitoringRoutes = require("./src/routes/ultimateMonitoringRoutes");
app.use("/api/ultimate-monitoring", authMiddleware, ultimateMonitoringRoutes);
const sourceIndexRoutes = require("./src/routes/sourceIndexRoutes");
app.use("/api/source-index", authMiddleware, sourceIndexRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/stakeholder", authMiddleware, stakeholderRoutes);  // Stakeholder analysis
app.use("/api/intelligence", authMiddleware, intelligenceRoutes);
app.use("/api/stakeholder-intelligence", authMiddleware, stakeholderIntelligenceRoutes);
app.use("/api/opportunities", authMiddleware, opportunitiesRoutes);
app.use("/api/opportunity", authMiddleware, opportunityRoutes);  // Opportunity finding
app.use("/api/mcp", authMiddleware, mcpRoutes);  // MCP integration routes
app.use("/api/niv", authMiddleware, nivRoutes);  // Niv PR Strategist routes

// Intelligence Index Routes (pre-indexed data) - Public access for browsing
const intelligenceIndexRoutes = require("./src/routes/intelligenceIndexRoutes");
app.use("/api/intelligence-index", intelligenceIndexRoutes); // No auth middleware here - handled per route

// ⚡ ENHANCED CLAUDE ROUTES - PERMANENTLY DISABLED
// WARNING: DO NOT ENABLE - These routes conflict with and override the sophisticated implementations
// The original routes in contentRoutes.js, crisisRoutes.js, mediaRoutes.js, and campaignRoutes.js
// have industry-specific prompts and detailed implementations that work correctly
// app.use("/api", enhancedClaudeRoutes); // DISABLED - conflicts with specific routes

// CLAUDE TEST ROUTES - For verifying Claude integration
const claudeTestRoute = require("./src/routes/claudeTestRoute");
app.use("/api", claudeTestRoute);

// TEST ENDPOINT - Verify deployment
const testEndpoint = require("./testEndpoint");
app.use("/api", testEndpoint);

// 🔧 MISSING ENDPOINTS ROUTES - Comprehensive solution for all 404 errors
// Add ALL missing endpoints that frontend calls but don't exist in backend
app.use("/api", missingEndpointsRoutes);

// Memory vault routes - this is a catch-all for /api so must come last
app.use("/api", authMiddleware, memoryvaultRoutes);

console.log("All routes registered successfully");

// 404 handler - must come AFTER all routes
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.url);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start server - Always start for Railway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SignalDesk Backend running on port ${PORT}`);
  console.log(`📱 Frontend expected at http://localhost:3000`);
  console.log("\n✅ Available endpoints:");
  console.log("  Public:");
  console.log("   - POST /api/auth/login");
  console.log("   - POST /api/auth/register");
  console.log("   - GET  /api/auth/verify");
  console.log("  Protected (requires token):");
  console.log("   - /api/projects/*");
  console.log("   - /api/todos/*");
  console.log("   - /api/assistant/*");
  console.log("   - /api/content/*");
  console.log("   - /api/media/*");
  console.log("   - /api/ai/*");
  console.log("   - ... and more");
});

// Export app for compatibility
module.exports = app;
// Force rebuild at Fri Aug  8 20:21:00 EDT 2025
// FORCE DEPLOY: 20250813-164927
