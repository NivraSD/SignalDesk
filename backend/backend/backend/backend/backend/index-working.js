// SIGNALDESK MAIN SERVER - Working Version
// Version 2.0 - Core functionality with import fixes
console.log('🚀🚀🚀 STARTING SIGNALDESK SERVER v2.0 - WORKING VERSION 🚀🚀🚀');
console.log('📍 This is index-working.js with CORE functionality');
console.log('⏰ Deploy time:', new Date().toISOString());

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
const PORT = process.env.PORT || 3000;

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
    message: "🚀 SignalDesk Platform API v2.0 - WORKING VERSION",
    version: "2.0.0",
    status: "operational",
    serverFile: "index-working.js",
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
        verify: "GET|POST /api/auth/verify"
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
        content: {
          generate: "POST /api/content/ai-generate",
          history: "GET /api/content/history",
          templates: "GET /api/content/templates"
        },
        crisis: {
          analyze: "POST /api/crisis/analyze",
          command: "POST /api/crisis/command-center"
        },
        campaigns: {
          analyze: "POST /api/campaigns/analyze"
        },
        media: {
          search: "POST /api/media/search-reporters",
          generate: "POST /api/media/generate-pitch"
        },
        ai: "POST /api/ai/*"
      }
    },
    database: "PostgreSQL with fallback to mock data",
    notes: [
      "Core functionality enabled - advanced monitoring temporarily disabled",
      "All CORS restrictions removed for maximum compatibility",
      "Demo user works with both demo123 and password",
      "All endpoints have comprehensive error handling",
      "Database failures return mock data to keep frontend working"
    ]
  });
});

// Load routes that are known to work (safely handle import errors)
let authRoutes, projectRoutes, todoRoutes, assistantRoutes, claudeDiagnosticsRoutes;
let campaignRoutes, contentRoutes, crisisRoutes, mediaRoutes, aiRoutes, memoryvaultRoutes;
let missingEndpointsRoutes, healthCheckRoutes, enhancedClaudeRoutes;

try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ Loaded authRoutes");
} catch (error) {
  console.error("❌ Failed to load authRoutes:", error.message);
}

try {
  projectRoutes = require("./routes/projectRoutes");
  console.log("✅ Loaded projectRoutes");
} catch (error) {
  console.error("❌ Failed to load projectRoutes:", error.message);
}

try {
  todoRoutes = require("./routes/todoRoutes");
  console.log("✅ Loaded todoRoutes");
} catch (error) {
  console.error("❌ Failed to load todoRoutes:", error.message);
}

try {
  assistantRoutes = require("./src/routes/assistantRoutes");
  console.log("✅ Loaded assistantRoutes");
} catch (error) {
  console.error("❌ Failed to load assistantRoutes:", error.message);
}

try {
  claudeDiagnosticsRoutes = require("./src/routes/claudeDiagnosticsRoutes");
  console.log("✅ Loaded claudeDiagnosticsRoutes");
} catch (error) {
  console.error("❌ Failed to load claudeDiagnosticsRoutes:", error.message);
}

try {
  campaignRoutes = require("./src/routes/campaignRoutes");
  console.log("✅ Loaded campaignRoutes");
} catch (error) {
  console.error("❌ Failed to load campaignRoutes:", error.message);
}

try {
  contentRoutes = require("./src/routes/contentRoutes");
  console.log("✅ Loaded contentRoutes");
} catch (error) {
  console.error("❌ Failed to load contentRoutes:", error.message);
}

try {
  crisisRoutes = require("./src/routes/crisisRoutes");
  console.log("✅ Loaded crisisRoutes");
} catch (error) {
  console.error("❌ Failed to load crisisRoutes:", error.message);
}

try {
  mediaRoutes = require("./src/routes/mediaRoutes");
  console.log("✅ Loaded mediaRoutes");
} catch (error) {
  console.error("❌ Failed to load mediaRoutes:", error.message);
}

try {
  aiRoutes = require("./routes/aiRoutes");
  console.log("✅ Loaded aiRoutes");
} catch (error) {
  console.error("❌ Failed to load aiRoutes:", error.message);
}

try {
  memoryvaultRoutes = require("./routes/memoryvaultRoutes");
  console.log("✅ Loaded memoryvaultRoutes");
} catch (error) {
  console.error("❌ Failed to load memoryvaultRoutes:", error.message);
}

try {
  missingEndpointsRoutes = require("./src/routes/missingEndpointsRoutes");
  console.log("✅ Loaded missingEndpointsRoutes");
} catch (error) {
  console.error("❌ Failed to load missingEndpointsRoutes:", error.message);
}

try {
  healthCheckRoutes = require("./src/routes/healthCheckRoutes");
  console.log("✅ Loaded healthCheckRoutes");
} catch (error) {
  console.error("❌ Failed to load healthCheckRoutes:", error.message);
}

try {
  enhancedClaudeRoutes = require("./src/routes/enhancedClaudeRoutes");
  console.log("✅ Loaded enhancedClaudeRoutes");
} catch (error) {
  console.error("❌ Failed to load enhancedClaudeRoutes:", error.message);
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SignalDesk API is running",
    timestamp: new Date().toISOString(),
  });
});

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

// API Routes - Only load routes that imported successfully
console.log("🔧 Loading API routes...");

// Public routes (NO auth required)
if (healthCheckRoutes) {
  app.use("/api", healthCheckRoutes);
  console.log("✅ Registered health check routes");
}

if (authRoutes) {
  app.use("/api/auth", authRoutes);
  console.log("✅ Registered auth routes");
}

if (claudeDiagnosticsRoutes) {
  app.use("/api/claude-diagnostics", claudeDiagnosticsRoutes);
  console.log("✅ Registered Claude diagnostics routes");
}

// Protected routes (auth required)
if (assistantRoutes) {
  app.use("/api/assistant", authMiddleware, assistantRoutes);
  console.log("✅ Registered assistant routes");
}

if (projectRoutes) {
  app.use("/api/projects", authMiddleware, projectRoutes);
  console.log("✅ Registered project routes");
}

if (todoRoutes) {
  app.use("/api/todos", authMiddleware, todoRoutes);
  console.log("✅ Registered todo routes");
}

if (contentRoutes) {
  app.use("/api/content", authMiddleware, contentRoutes);
  console.log("✅ Registered content routes");
}

if (crisisRoutes) {
  app.use("/api/crisis", authMiddleware, crisisRoutes);
  console.log("✅ Registered crisis routes");
}

if (mediaRoutes) {
  app.use("/api/media", authMiddleware, mediaRoutes);
  console.log("✅ Registered media routes");
}

if (campaignRoutes) {
  app.use("/api/campaigns", authMiddleware, campaignRoutes);
  console.log("✅ Registered campaign routes");
}

if (aiRoutes) {
  app.use("/api/ai", authMiddleware, aiRoutes);
  console.log("✅ Registered AI routes");
}

// Missing endpoints fallback
if (missingEndpointsRoutes) {
  app.use("/api", missingEndpointsRoutes);
  console.log("✅ Registered missing endpoints fallback");
}

// Memory vault routes - this is a catch-all for /api so must come last
if (memoryvaultRoutes) {
  app.use("/api", authMiddleware, memoryvaultRoutes);
  console.log("✅ Registered memory vault routes");
}

console.log("All available routes registered successfully");

// 404 handler - must come AFTER all routes
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.url);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
    note: "This is the working version - some advanced features may be temporarily disabled"
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SignalDesk Backend running on port ${PORT}`);
  console.log(`📱 Frontend expected at http://localhost:3000`);
  console.log("\n✅ Core features available:");
  console.log("  - Authentication (login/logout)");
  console.log("  - Project management");
  console.log("  - Content generation with Claude AI");
  console.log("  - Crisis management");
  console.log("  - Media outreach");
  console.log("  - Campaign analysis");
  console.log("\n⚠️  Advanced monitoring features temporarily disabled");
  console.log("    (Will be restored after fixing import dependencies)");
});

// Export app for compatibility
module.exports = app;