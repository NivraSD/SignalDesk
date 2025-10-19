#!/bin/bash

# SignalDesk AI Presentation Builder - Setup Script
# This script installs all required dependencies

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SignalDesk AI Presentation Builder Setup               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js version OK: $(node -v)"
echo ""

# Check npm
echo "📋 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi
echo "✓ npm version: $(npm -v)"
echo ""

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✓ Node.js dependencies installed"
echo ""

# Check if html2pptx is installed
echo "📋 Checking html2pptx..."
if npm list -g @ant/html2pptx &> /dev/null; then
    echo "✓ html2pptx is already installed"
else
    echo "📦 Installing html2pptx..."
    if [ -f "/mnt/skills/public/pptx/html2pptx.tgz" ]; then
        npm install -g /mnt/skills/public/pptx/html2pptx.tgz
        echo "✓ html2pptx installed successfully"
    else
        echo "⚠️  Warning: html2pptx package not found at expected path"
        echo "   You may need to install it manually"
    fi
fi
echo ""

# Check API keys
echo "🔑 Checking environment variables..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set"
    echo "   Set it with: export ANTHROPIC_API_KEY='your-key-here'"
    echo "   Or create a .env file"
else
    echo "✓ ANTHROPIC_API_KEY is set"
fi

if [ -z "$VERTEX_AI_ENDPOINT" ]; then
    echo "ℹ️  VERTEX_AI_ENDPOINT not set (optional)"
    echo "   Set it for image generation: export VERTEX_AI_ENDPOINT='your-endpoint'"
else
    echo "✓ VERTEX_AI_ENDPOINT is set"
fi
echo ""

# Create output directory
echo "📁 Creating output directory..."
mkdir -p output
mkdir -p output/slides
echo "✓ Output directories created"
echo ""

# Run a quick test
echo "🧪 Running quick test..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⏭️  Skipping test (ANTHROPIC_API_KEY not set)"
else
    echo "   This will make a test API call to Claude..."
    node -e "
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 100,
  messages: [{ role: 'user', content: 'Say hello' }]
}).then(() => {
  console.log('✓ Claude API connection successful');
}).catch(err => {
  console.error('❌ Claude API test failed:', err.message);
  process.exit(1);
});
" || echo "⚠️  API test failed - check your ANTHROPIC_API_KEY"
fi
echo ""

# Setup complete
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   ✅ SETUP COMPLETE                                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Set your API key (if not already set):"
echo "     export ANTHROPIC_API_KEY='your-key-here'"
echo ""
echo "  2. Run the demo:"
echo "     npm run demo"
echo ""
echo "  3. Create your first presentation:"
echo "     node index.js \"Your presentation topic\""
echo ""
echo "  4. See all options:"
echo "     node index.js --help"
echo ""
echo "Documentation:"
echo "  • README.md - Complete guide"
echo "  • GAMMA_COMPARISON.md - Gamma vs SignalDesk comparison"
echo ""
echo "🎉 Happy presenting!"
echo ""
