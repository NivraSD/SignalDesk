#!/usr/bin/env node

// Wrapper script to ensure proper module loading
import('./index.js').catch(error => {
  console.error('Failed to load MCP server:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});