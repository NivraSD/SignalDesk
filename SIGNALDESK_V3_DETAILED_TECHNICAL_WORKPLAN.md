# SignalDesk V3: Detailed Technical Workplan
## From Current State to Production Launch

### Executive Summary
You have 80% of components built. This plan focuses on consolidation, integration, and filling critical gaps.

---

# PHASE 0: TECHNICAL DEBT CLEANUP (Week -1)
## Must Complete Before V3 Development

### Day 1-2: Function Consolidation
**CRITICAL: Reduce 100+ edge functions to ~30 production functions**

```bash
# 1. Archive duplicates
mkdir -p supabase/functions/_archive
mkdir -p supabase/functions/_archive/niv-versions
mkdir -p supabase/functions/_archive/intelligence-versions

# 2. Move all except chosen versions
mv supabase/functions/niv-* supabase/functions/_archive/niv-versions/ 
# EXCEPT: Keep niv-orchestrator-robust

mv supabase/functions/intelligence-*-v[1-2] supabase/functions/_archive/intelligence-versions/
mv supabase/functions/claude-intelligence-synthesizer-v[1-6] supabase/functions/_archive/

# 3. Document production functions
echo "Production Functions:" > PRODUCTION_FUNCTIONS.md
echo "- niv-orchestrator-robust" >> PRODUCTION_FUNCTIONS.md
echo "- intelligence-discovery-v3" >> PRODUCTION_FUNCTIONS.md
echo "- intelligence-stage-[1-5]-*" >> PRODUCTION_FUNCTIONS.md
echo "- opportunity-orchestrator" >> PRODUCTION_FUNCTIONS.md
```

**Deliverables:**
- [ ] 17 Niv versions → 1 (niv-orchestrator-robust)
- [ ] Multiple intelligence versions → Production set only
- [ ] Document function mapping
- [ ] Update all references

### Day 3: Fix Intelligence Pipeline UI Bug
**Fix MultiStageIntelligence.js rendering issue**

```javascript
// The issue: completionRef.current preventing final render
// src/components/MultiStageIntelligence.js

// FIND THIS PROBLEMATIC CODE:
if (isComplete || completionRef.current) {
  console.log('Pipeline already complete or completing, skipping');
  return;
}

// REPLACE WITH:
if (completionRef.current) {
  console.log('Pipeline completion in progress');
  return;
}

// Ensure state updates trigger re-render
setIsComplete(true);
setForceRender(prev => prev + 1); // Force re-render
```

**Deliverables:**
- [ ] Fix completion handler bug
- [ ] Test full pipeline flow
- [ ] Verify results display
- [ ] Confirm 2-3 minute execution

### Day 4-5: Database Schema Consolidation
**Ensure all tables exist with proper structure**

```sql
-- Run these migrations in order:
-- 1. Core tables (already exist)
organizations, profiles, projects

-- 2. Intelligence tables (check/create)
intelligence_runs, intelligence_results, intelligence_cache

-- 3. Opportunity tables (check/create)  
opportunities, opportunity_scores, opportunity_executions

-- 4. MemoryVault tables (check/create)
memoryvault, memoryvault_attachments

-- 5. Monitoring alerts (NEW)
CREATE TABLE monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('opportunity', 'crisis', 'deadline')),
  organization_id UUID REFERENCES organizations(id),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Deliverables:**
- [ ] Verify all existing tables
- [ ] Create missing tables
- [ ] Enable RLS on all tables
- [ ] Test data persistence

---

# PHASE 1: FOUNDATION (Week 1)
## Next.js 14 Setup & Core Infrastructure

### Day 1: Next.js 14 Project Setup
**Clean slate with App Directory**

```bash
# Create new Next.js 14 project
npx create-next-app@latest signaldesk-v3 \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd signaldesk-v3

# Install core dependencies
npm install @supabase/supabase-js@latest
npm install zustand @tanstack/react-query
npm install framer-motion lucide-react
npm install react-window react-draggable
```

**Deliverables:**
- [ ] Next.js 14 with App Directory
- [ ] TypeScript configured
- [ ] Tailwind CSS setup
- [ ] Environment variables

### Day 2: Supabase Integration
**Connect to existing Supabase project**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: cookieStore.get, set: cookieStore.set } }
  )
}
```

**Deliverables:**
- [ ] Supabase client setup
- [ ] Auth helpers configured
- [ ] RLS policies verified
- [ ] Test connection

### Day 3: Authentication Flow
**Implement auth with existing Supabase Auth**

```typescript
// app/(auth)/login/page.tsx
// app/(auth)/register/page.tsx
// app/(auth)/layout.tsx
// middleware.ts - Protected routes
```

**Deliverables:**
- [ ] Login/Register pages
- [ ] Protected route middleware
- [ ] Session management
- [ ] Auth state in Zustand

### Day 4: Infinite Canvas UI Foundation
**Build the core canvas system**

```typescript
// components/InfiniteCanvas/InfiniteCanvas.tsx
interface CanvasState {
  components: Map<string, CanvasComponent>
  scale: number
  offset: { x: number, y: number }
}

// components/InfiniteCanvas/DraggableComponent.tsx
// components/InfiniteCanvas/TabBar.tsx
```

**Deliverables:**
- [ ] Infinite canvas container
- [ ] 5-tab navigation bar
- [ ] Draggable component wrapper
- [ ] Grid system (optional snap)

### Day 5: State Management
**Zustand store with persistence**

```typescript
// stores/useAppStore.ts
interface AppState {
  // Auth
  user: User | null
  organization: Organization | null
  
  // Canvas
  canvasComponents: Map<string, CanvasComponent>
  activeTab: TabType
  
  // Intelligence
  intelligenceData: IntelligenceData | null
  pipelineStatus: PipelineStatus
  
  // Actions
  addComponent: (type: TabType) => void
  focusComponent: (id: string) => void
  runIntelligence: () => Promise<void>
}
```

**Deliverables:**
- [ ] Zustand store setup
- [ ] localStorage persistence
- [ ] Canvas state management
- [ ] Intelligence state management

---

# PHASE 2: INTELLIGENCE & OPPORTUNITIES (Week 2)
## Wire Existing Backend to New Frontend

### Day 1-2: Intelligence Module UI
**Connect to existing pipeline**

```typescript
// app/(dashboard)/intelligence/page.tsx
// components/Intelligence/PipelineProgress.tsx
// components/Intelligence/ResultsDisplay.tsx

// Fix the existing pipeline connection
const runPipeline = async () => {
  // Uses existing intelligence-discovery-v3 → stage-5-synthesis
  const stages = [
    'intelligence-discovery-v3',
    'intelligence-stage-1-competitors',
    'intelligence-stage-2-media',
    'intelligence-stage-3-regulatory', 
    'intelligence-stage-4-trends',
    'intelligence-stage-5-synthesis'
  ];
  
  // Run through existing orchestrator
  // Takes 2-3 minutes total
}
```

**Deliverables:**
- [ ] Intelligence tab UI
- [ ] Pipeline progress display
- [ ] Results rendering (FIX EXISTING BUG)
- [ ] 2-3 minute execution confirmed

### Day 3-4: Opportunity Module
**Wire existing opportunity detection**

```typescript
// components/Opportunities/OpportunityCenter.tsx
// Uses existing:
// - opportunity-orchestrator (no fallbacks)
// - signaldesk-opportunities MCP
// - assess-opportunities-simple

interface OpportunityCard {
  id: string
  title: string
  score: number // 0-100
  urgency: 'high' | 'medium' | 'low'
  timeWindow: string
  executeButton: () => void // One-click
}
```

**Deliverables:**
- [ ] Opportunity cards UI
- [ ] Score display
- [ ] Time window indicators
- [ ] Execute button wired

### Day 5: Integration Testing
**Ensure data flows correctly**

```typescript
// Intelligence → Opportunities flow
intelligenceComplete → detectOpportunities → displayCards
```

**Deliverables:**
- [ ] Intelligence feeds opportunities
- [ ] Opportunities scored by goals
- [ ] Canvas components work together
- [ ] Data persistence verified

---

# PHASE 3: EXECUTION & CONTENT (Week 3)
## Build Missing Components & Wire MCPs

### Day 1-2: Visual Content System (NEW)
**Critical gap - must build**

```typescript
// supabase/functions/visual-generator/index.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// DALL-E 3 integration
export async function generateImage(prompt: string) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024"
  })
  return response.data[0].url
}

// Synthesia integration (if API available)
export async function generateVideo(script: string) {
  // Synthesia API integration
}
```

**Deliverables:**
- [ ] DALL-E 3 edge function
- [ ] Image generation working
- [ ] Video generation (if possible)
- [ ] Storage in Supabase

### Day 3: Export System (CRITICAL - LIABILITY)
**No direct posting allowed**

```typescript
// supabase/functions/export-system/index.ts
interface ExportOptions {
  format: 'pdf' | 'word' | 'csv' | 'social-draft'
  watermark: true // Always
  audit: true // Track all exports
}

// NEVER post directly to platforms
// ALWAYS watermark as "DRAFT"
// LOG all exports for liability protection
```

**Deliverables:**
- [ ] PDF export with watermark
- [ ] Word document generation
- [ ] Social media draft exports
- [ ] Complete audit trail

### Day 4: Wire Content MCPs
**Connect existing content generation**

```typescript
// Wire these existing MCPs:
// - signaldesk-content (5 content types)
// - signaldesk-media (list building)
// - signaldesk-campaigns (orchestration)
// - signaldesk-social (social content)

// To execution module:
// components/Execution/ExecutionHub.tsx
```

**Deliverables:**
- [ ] Content generation connected
- [ ] Media list builder working
- [ ] Campaign orchestration wired
- [ ] Social content generation

### Day 5: One-Click Execution Flow
**The killer feature**

```typescript
// Opportunity → Execute → Complete Campaign
async function executeOpportunity(id: string) {
  // 1. Generate strategy (2 sec)
  const strategy = await generateStrategy(opportunity)
  
  // 2. Create content (10 sec)
  const content = await generateContent(strategy)
  
  // 3. Generate visuals (15 sec)
  const visuals = await generateVisuals(content)
  
  // 4. Build media list (5 sec)
  const media = await buildMediaList(strategy)
  
  // 5. Create social (3 sec)
  const social = await createSocialCampaign(content)
  
  // Total: ~35 seconds
  return { strategy, content, visuals, media, social }
}
```

**Deliverables:**
- [ ] One-click execution working
- [ ] <60 second generation
- [ ] All components integrated
- [ ] Export-only (no posting)

---

# PHASE 4: MEMORYVAULT & NIV (Week 4)
## Learning System & AI Assistant

### Day 1-2: MemoryVault Enhancement
**Add attachment support**

```typescript
// components/MemoryVault/MemoryVault.tsx
// Wire existing signaldesk-memory MCP

// Add attachment support
interface Attachment {
  id: string
  file: File
  analysis: any // AI-extracted insights
  embedding: number[] // Vector for search
}
```

**Deliverables:**
- [ ] MemoryVault UI
- [ ] Attachment upload
- [ ] Pattern display
- [ ] Learning metrics

### Day 3-4: Niv Integration
**Use niv-orchestrator-robust**

```typescript
// components/Niv/NivOverlay.tsx
// Uses: supabase/functions/niv-orchestrator-robust

interface NivContext {
  visibleComponents: CanvasComponent[]
  activeTab: TabType
  currentData: any
  
  // Context-aware suggestions
  suggest(): string[]
  
  // Execute commands
  execute(command: string): void
}
```

**Deliverables:**
- [ ] Niv overlay component
- [ ] Context awareness
- [ ] Command execution
- [ ] Floating assistant mode

### Day 5: Alert System (NEW)
**Focused alerts only**

```typescript
// supabase/functions/alert-manager/index.ts
type AlertType = 'opportunity' | 'crisis' | 'deadline'

// NO general monitoring
// NO news alerts
// ONLY actionable items
```

**Deliverables:**
- [ ] Alert manager function
- [ ] In-app notifications
- [ ] Email alerts (optional)
- [ ] Alert preferences UI

---

# PHASE 5: ONBOARDING (Week 5)
## The Wow Factor Experience

### Day 1-2: Onboarding Flow UI
**5-phase experience**

```typescript
// app/(onboarding)/onboarding/page.tsx
// components/Onboarding/WowOnboarding.tsx

const PHASES = [
  'instant-start',     // 30 sec - Company + URL only
  'goal-setting',      // 45 sec - While pipeline starts
  'asset-upload',      // 45 sec - Optional
  'live-preview',      // 60 sec - Watch intelligence build
  'magic-reveal'       // 30 sec - Show opportunities
]
```

**Deliverables:**
- [ ] 5-phase UI flow
- [ ] Live intelligence sidebar
- [ ] Progress indicators
- [ ] Asset upload handling

### Day 3-4: Onboarding Intelligence (NEW)
**Live extraction during setup**

```typescript
// supabase/functions/onboarding-intelligence/index.ts
export async function extractDuringOnboarding(domain: string) {
  // Start pipeline immediately
  // Show live updates
  // Extract company info from URL
  // Begin opportunity detection
}
```

**Deliverables:**
- [ ] Live extraction function
- [ ] Real-time updates
- [ ] Goal integration
- [ ] Asset analysis

### Day 5: Onboarding Testing
**Ensure wow factor**

- [ ] 3-4 minute total time
- [ ] Live updates working
- [ ] Pipeline starts immediately
- [ ] Opportunities ready at end

---

# PHASE 6: PLAN MODULE & CRISIS (Week 6)
## Strategic Planning & Crisis Management

### Day 1-2: Plan Module
**Strategic planning interface**

```typescript
// components/Plan/StrategicPlanning.tsx
// Wire existing planning components
```

**Deliverables:**
- [ ] Planning UI
- [ ] Timeline view
- [ ] Goal tracking
- [ ] Resource allocation

### Day 3-4: Crisis Integration
**Use existing CrisisCommandCenter.js**

```typescript
// components/Crisis/CrisisCommandCenter.tsx
// Wire existing signaldesk-crisis MCP (complete)
```

**Deliverables:**
- [ ] Crisis UI integrated
- [ ] War room functionality
- [ ] Cascade prediction
- [ ] Response templates

### Day 5: Complete MCP Integration
**Finish remaining MCPs**

- [ ] Complete signaldesk-regulatory (7 tools)
- [ ] Complete signaldesk-orchestrator (coordination)
- [ ] Wire all remaining MCPs
- [ ] Test cross-MCP communication

---

# PHASE 7: TESTING & OPTIMIZATION (Week 7)
## Quality Assurance & Performance

### Day 1-2: Integration Testing
```typescript
// tests/integration/
- pipeline.test.ts
- opportunities.test.ts
- execution.test.ts
- memoryvault.test.ts
```

**Deliverables:**
- [ ] All modules tested
- [ ] Data flow validated
- [ ] Edge cases handled
- [ ] Error recovery tested

### Day 3-4: Performance Optimization
- [ ] Bundle size < 500KB
- [ ] Lighthouse score > 90
- [ ] Pipeline < 3 minutes
- [ ] Campaign generation < 60 seconds

### Day 5: UI/UX Polish
- [ ] Responsive design
- [ ] Accessibility (WCAG 2.1)
- [ ] Loading states
- [ ] Error messages

---

# PHASE 8: DEPLOYMENT (Week 8)
## Production Launch

### Day 1-2: Staging Deployment
```bash
# Deploy to Vercel staging
vercel --env=staging

# Deploy edge functions
supabase functions deploy --project=staging
```

**Deliverables:**
- [ ] Frontend on Vercel
- [ ] Edge functions deployed
- [ ] Database migrations run
- [ ] Environment variables set

### Day 3-4: Beta Testing
- [ ] 10 beta users
- [ ] Feedback collection
- [ ] Bug fixes
- [ ] Performance monitoring

### Day 5: Production Launch
```bash
# Production deployment
vercel --prod
supabase functions deploy --project=production
```

**Deliverables:**
- [ ] Production deployment
- [ ] Monitoring active
- [ ] Support ready
- [ ] Documentation complete

---

# TECHNICAL DEPENDENCIES

## Critical Path Items
1. **Fix Pipeline UI Bug** - Blocks everything
2. **Function Consolidation** - Reduces complexity
3. **Visual Content System** - New development
4. **Export System** - Liability protection
5. **Onboarding Intelligence** - User experience

## Integration Sequence
```
1. Intelligence Pipeline (exists) → Fix UI bug
2. Opportunities (exists) → Wire to UI
3. Content MCPs (exist) → Connect to execution
4. Visual System (NEW) → Build and integrate
5. Export System (NEW) → Critical for liability
6. MemoryVault (exists) → Add attachments
7. Niv (exists) → Use niv-orchestrator-robust
8. Crisis (exists) → Wire CrisisCommandCenter.js
```

## Risk Mitigation
- **Biggest Risk:** Direct posting liability → Export-only system
- **Technical Risk:** Too many functions → Consolidate first
- **Time Risk:** Visual content APIs → Start early
- **Quality Risk:** No testing → Dedicate Week 7

---

# SUCCESS METRICS

## Technical Targets
- Pipeline execution: 2-3 minutes ✓
- Campaign generation: <60 seconds
- Bundle size: <500KB
- Test coverage: >80%
- Zero runtime errors

## Business Metrics  
- Onboarding: 3-4 minutes
- Time to first opportunity: <5 minutes
- One-click execution: Working
- Export system: Complete
- No direct posting: Enforced

---

# DAILY STANDUP FORMAT

```markdown
Date: [DATE]
Phase: [PHASE] Day [N]

✅ Completed Yesterday:
- [ ] Specific deliverable

🎯 Today's Goal:
- [ ] Specific deliverable

🚧 Blockers:
- None / [Specific issue]

📊 Progress:
- On track / Ahead / Behind
```

---

# CONCLUSION

You have 80% of the components. Focus on:
1. **Consolidation** (Week -1)
2. **Integration** (Weeks 1-4)
3. **Gap Filling** (Weeks 3-5)
4. **Testing** (Week 7)
5. **Launch** (Week 8)

The path is clear. Start with cleanup, then systematically build V3.