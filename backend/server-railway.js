// Railway-optimized server for SignalDesk
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection with Railway support
let db;
try {
  db = require("./src/config/db");
  console.log("✅ Database module loaded");
} catch (error) {
  console.warn("⚠️ Database module not loaded:", error.message);
  // Continue without database for now
}

// Middleware
app.use(cors({
  origin: true, // Allow all origins in production
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (CRITICAL for Railway)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: PORT
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚀 SignalDesk Platform API",
    version: "2.0.0",
    status: "operational",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      content: "/api/content",
      projects: "/api/projects",
      campaigns: "/api/campaigns",
      crisis: "/api/crisis",
      opportunity: "/api/opportunity",
      media: "/api/media"
    },
    timestamp: new Date().toISOString()
  });
});

// Load routes with error handling
const loadRoutes = () => {
  try {
    // Auth routes
    try {
      const authRoutes = require("./src/routes/authRoutes");
      app.use("/api/auth", authRoutes);
      console.log("✅ Auth routes loaded");
    } catch (e) {
      console.warn("⚠️ Auth routes not loaded:", e.message);
    }

    // Content routes
    try {
      const contentRoutes = require("./src/routes/contentRoutes");
      app.use("/api/content", contentRoutes);
      console.log("✅ Content routes loaded");
    } catch (e) {
      console.warn("⚠️ Content routes not loaded:", e.message);
    }

    // Project routes
    try {
      const projectRoutes = require("./src/routes/projectRoutes");
      app.use("/api/projects", projectRoutes);
      console.log("✅ Project routes loaded");
    } catch (e) {
      console.warn("⚠️ Project routes not loaded:", e.message);
    }

    // Campaign routes
    try {
      const campaignRoutes = require("./src/routes/campaignRoutes");
      app.use("/api/campaigns", campaignRoutes);
      console.log("✅ Campaign routes loaded");
    } catch (e) {
      console.warn("⚠️ Campaign routes not loaded:", e.message);
    }

    // Crisis routes
    try {
      const crisisRoutes = require("./src/routes/crisisRoutes");
      app.use("/api/crisis", crisisRoutes);
      console.log("✅ Crisis routes loaded");
    } catch (e) {
      console.warn("⚠️ Crisis routes not loaded:", e.message);
    }

    // Opportunity routes
    try {
      const opportunityRoutes = require("./src/routes/opportunityRoutes");
      app.use("/api/opportunity", opportunityRoutes);
      console.log("✅ Opportunity routes loaded");
    } catch (e) {
      console.warn("⚠️ Opportunity routes not loaded:", e.message);
    }

    // Media routes
    try {
      const mediaRoutes = require("./src/routes/mediaRoutes");
      app.use("/api/media", mediaRoutes);
      console.log("✅ Media routes loaded");
    } catch (e) {
      console.warn("⚠️ Media routes not loaded:", e.message);
    }

    // Claude diagnostics routes
    try {
      const claudeDiagnosticsRoutes = require("./src/routes/claudeDiagnosticsRoutes");
      app.use("/api/claude-diagnostics", claudeDiagnosticsRoutes);
      console.log("✅ Claude diagnostics routes loaded");
    } catch (e) {
      console.warn("⚠️ Claude diagnostics routes not loaded:", e.message);
    }
  } catch (error) {
    console.error("Error loading routes:", error);
  }
};

// Load routes
loadRoutes();

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log("🛑 Received shutdown signal, closing server gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    if (db && db.end) {
      db.end(() => {
        console.log("✅ Database connections closed");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("⚠️ Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
========================================
🚀 SignalDesk Server Started
========================================
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
⏰ Started: ${new Date().toISOString()}
✅ Health: http://localhost:${PORT}/api/health
========================================
  `);
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

module.exports = app;