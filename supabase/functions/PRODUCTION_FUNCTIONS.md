# Production Edge Functions
## After Consolidation - 71 Functions (from 97)

### ✅ Core Intelligence Pipeline (7 Functions)
- `intelligence-discovery-v3` - Organization extraction
- `intelligence-stage-1-competitors` - Competitive analysis
- `intelligence-stage-2-media` - Media landscape
- `intelligence-stage-3-regulatory` - Regulatory environment
- `intelligence-stage-4-trends` - Market trends
- `intelligence-stage-5-synthesis` - Final consolidation
- `intelligence-persistence` - Data storage

### ✅ Niv System (1 Function - PRODUCTION)
- `niv-orchestrator-robust` - Main Niv orchestrator

### ✅ Opportunity System (5 Functions)
- `opportunity-orchestrator` - Real detection
- `opportunity-detector-v3` - Pattern detection
- `opportunity-detector-v2` - Legacy (consider archiving)
- `opportunity-enhancer` - Enhancement
- `opportunity-executor` - Campaign generation

### ✅ Content & Media (4 Functions)
- `content-intelligence` - Content generation
- `media-intelligence` - Media lists
- `campaigns-intelligence` - Campaign orchestration
- `social-intelligence` - Social monitoring

### ✅ Supporting Functions
- `organization-discovery` - Entity extraction
- `intelligence-orchestrator` - Pipeline coordination
- `intelligence-memory` - Memory operations
- `crisis-intelligence` - Crisis detection
- `claude-intelligence-synthesizer-v7` - Latest synthesizer
- `intelligence-synthesis-v4` - Latest synthesis

### 📦 Archived (26 Functions)
- 15 Niv versions → `_archive/niv-versions/`
- 5 Claude synthesizer versions → `_archive/claude-synthesizer-versions/`
- 6 Intelligence versions → `_archive/intelligence-versions/`

### 🎯 Next Cleanup Targets
Consider archiving these duplicates:
- `opportunity-detector-v2` (have v3)
- `claude-intelligence-synthesizer` (have v7)
- `intelligence-synthesis` (have v4)
- Various test functions (health-check, test-*)

Target: ~30-40 production functions