// SIGNALDESK MAIN SERVER - index.js
// Version 2.0 - With ALL routes including Campaign, Opportunity, Media
console.log('🚀🚀🚀 STARTING SIGNALDESK SERVER v2.0 🚀🚀🚀');
console.log('📍 This is index.js with FULL server implementation');
console.log('⏰ Deploy time:', new Date().toISOString());

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables BEFORE using them (only in development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

// Add this near the top of server.js
require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 3001; // Railway default

// Middleware - configure CORS for both local and Railway
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Railway domains
    if (origin.includes('railway.app') || origin.includes('up.railway.app')) {
      return callback(null, true);
    }
    
    // Allow all origins in production for now (you can restrict this later)
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import middleware
const authMiddleware = require("./src/middleware/authMiddleware");

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "🚀 SignalDesk Platform API v2.0 - FULL SERVER",
    version: "2.0.0",
    status: "operational",
    serverFile: "index.js",
    deployTime: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      auth: {
        login: "POST /api/auth/login",
        register: "POST /api/auth/register"
      },
      monitoring: {
        opportunities: "GET /api/monitoring/v2/opportunities",
        status: "GET /api/monitoring/v2/status"
      },
      documentation: "https://signaldesk.com/docs"
    },
    database: "Connected to PostgreSQL",
    monitoring: "Active - Processing 5,000+ articles every 5 minutes"
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
const crisisRoutes = require("./src/routes/crisisRoutes");
const monitoringRoutes = require("./src/routes/monitoringRoutes");
const mediaRoutes = require("./src/routes/mediaRoutes");
const aiRoutes = require("./routes/aiRoutes");
const memoryvaultRoutes = require("./routes/memoryvaultRoutes");
const stakeholderRoutes = require("./src/routes/stakeholderRoutes");
const intelligenceRoutes = require("./src/routes/intelligenceRoutes");
const stakeholderIntelligenceRoutes = require("./src/routes/stakeholderIntelligenceRoutes");
const opportunitiesRoutes = require("./src/routes/opportunitiesRoutes");
const opportunityRoutes = require("./src/routes/opportunityRoutes");
const proxyRoutes = require("./src/routes/proxy");
const organizationRoutes = require("./src/routes/organizationRoutes");
const sourceConfigRoutes = require("./src/routes/sourceConfigRoutes");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SignalDesk API is running",
    timestamp: new Date().toISOString(),
  });
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
// ⚡ Public routes (NO auth required)
app.use("/api/auth", authRoutes);
app.use("/api/proxy", proxyRoutes); // Proxy routes for external APIs (CORS avoidance)
app.use("/api/claude-diagnostics", claudeDiagnosticsRoutes); // Claude diagnostics for debugging

// ⚡ Protected routes (auth REQUIRED)
app.use("/api/organizations", authMiddleware, organizationRoutes);
app.use("/api/assistant", authMiddleware, assistantRoutes);
app.use("/api/projects", authMiddleware, projectRoutes);
app.use("/api/todos", authMiddleware, todoRoutes);
app.use("/api/content", authMiddleware, contentRoutes);
app.use("/api/crisis", crisisRoutes);
app.use("/api/monitoring", authMiddleware, monitoringRoutes);
app.use("/api/source-config", authMiddleware, sourceConfigRoutes);
const monitoringRoutesV2 = require("./src/routes/monitoringRoutesV2");
app.use("/api/monitoring/v2", authMiddleware, monitoringRoutesV2);
const ultimateMonitoringRoutes = require("./src/routes/ultimateMonitoringRoutes");
app.use("/api/ultimate-monitoring", authMiddleware, ultimateMonitoringRoutes);
const sourceIndexRoutes = require("./src/routes/sourceIndexRoutes");
app.use("/api/source-index", authMiddleware, sourceIndexRoutes);
app.use("/api/campaigns", authMiddleware, campaignRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/stakeholder", authMiddleware, stakeholderRoutes);
app.use("/api/intelligence", authMiddleware, intelligenceRoutes);
app.use("/api/stakeholder-intelligence", authMiddleware, stakeholderIntelligenceRoutes);
app.use("/api/opportunities", authMiddleware, opportunitiesRoutes);
app.use("/api/opportunity", authMiddleware, opportunityRoutes);

// Intelligence Index Routes (pre-indexed data) - Public access for browsing
// MUST come before the catch-all memoryvault route
const intelligenceIndexRoutes = require("./src/routes/intelligenceIndexRoutes");
app.use("/api/intelligence-index", intelligenceIndexRoutes); // No auth middleware here - handled per route

// Memory vault routes - this is a catch-all for /api so must come last
app.use("/api", authMiddleware, memoryvaultRoutes);

// ONLY ONE media routes registration
app.use("/api/media", authMiddleware, mediaRoutes);

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

// Start server only if not in Vercel environment
if (!process.env.VERCEL) {
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
  
  // Export server for testing
  module.exports = server;
} else {
  // Export app for Vercel
  module.exports = app;
}
// Force rebuild at Fri Aug  8 08:32:25 EDT 2025
