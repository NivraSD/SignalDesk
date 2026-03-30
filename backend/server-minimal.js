// Minimal server for Railway debugging
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

console.log("Starting minimal SignalDesk server...");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL exists:", \!\!process.env.DATABASE_URL);
console.log("ANTHROPIC_API_KEY exists:", \!\!process.env.ANTHROPIC_API_KEY);

// Basic middleware
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    port: PORT,
    env: process.env.NODE_ENV 
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "SignalDesk Minimal Server",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Minimal server running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
EOF < /dev/null