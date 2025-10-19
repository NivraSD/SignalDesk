# SignalDesk V4 NIV Platform - End-to-End Workflow Test

## Test Date: 2025-10-10

## Architecture Overview

V4 implements a **Total-Spectrum Communications** platform where NIV (Narrative Intelligence Vector) is embedded directly into campaign workflows, similar to how Execute and Crisis modules work.

### Key Components:
1. **NIV Panel** (`/src/components/niv/NIVPanel.tsx`) - Chat interface with AI assistant
2. **Campaign Planner** (`/src/components/prototype/StrategicCampaignPlanner.tsx`) - Embedded NIV as sidebar
3. **NIV Orchestrator** - Backend edge function (`niv-orchestrator-robust`)
4. **V4 Patterns** - CASCADE, MIRROR, CHORUS, TROJAN, NETWORK

### Architecture Pattern:
- **40% NIV Sidebar** + **60% Campaign Content**
- NIV generates campaigns automatically (no form filling required)
- Blueprint appears in main content area when generated
- User can switch between V4 (NIV-generated) and V3 (manual form) modes

## Test Plan

### 1. Open Campaign Planner

**Steps:**
1. Navigate to http://localhost:3001
2. Open the Campaign Planner from the canvas or header
3. **Expected:** Campaign Planner opens with NIV sidebar visible on the left (40% width)
4. **Expected:** NIV greeting message appears with action buttons

**NIV Greeting Should Say:**
```
Hi, I'm NIV - your Narrative Intelligence Vector assistant.

I can help you with:
• CASCADE campaigns - Viral multi-vector influence
• MIRROR strategies - Pre-position before crises
• Intelligence research - Deep market analysis
• Opportunity detection - Find PR opportunities
• Content generation - Multi-channel execution

What would you like to work on?
```

**Action Buttons Should Include:**
- "Create CASCADE campaign" (primary, with TrendingUp icon)
- "Find opportunities" (secondary, with Target icon)
- "Research landscape" (secondary, with Brain icon)

### 2. Generate CASCADE Campaign

**Test Input:** "Help me create a CASCADE viral campaign for a new AI product launch"

**Steps:**
1. Click "Create CASCADE campaign" button OR type the message
2. **Expected:** NIV shows "Processing with NIV orchestrator..." message
3. **Expected:** After 10-80 seconds, NIV responds with campaign blueprint
4. **Expected:** Action buttons appear: "Open Campaign Planner" and "View Blueprint"

**NIV Response Should Include:**
- Pattern type: CASCADE
- Objective summary
- Narrative overview
- Number of vectors (stakeholder groups)
- Number of content types
- Total pieces
- Timeline duration

**Example Response:**
```
I've created a CASCADE campaign for your AI product launch.

## CASCADE Campaign Blueprint

**Objective:** Viral amplification through coordinated multi-vector messaging

**Narrative:** [Generated narrative]

**Key Messages:**
1. [Message 1]
2. [Message 2]
3. [Message 3]

**Vectors:** 5 stakeholder groups
**Content Types:** 6 types
**Total Pieces:** 32
**Timeline:** 6 weeks

[Action Buttons:]
- Open Campaign Planner
- View Blueprint
```

### 3. View Blueprint

**Steps:**
1. Click "View Blueprint" button
2. **Expected:** New message appears with formatted blueprint data
3. **Expected:** Blueprint shows pattern, strategy, vectors, content types

**Blueprint Format:**
```markdown
## CASCADE Campaign Blueprint

**Objective:** [Generated objective]

**Narrative:** [Generated narrative]

**Key Messages:**
1. [Key message 1]
2. [Key message 2]
3. [Key message 3]

**Vectors:** [Number] stakeholder groups
**Content Types:** [Number] types
**Total Pieces:** [Number]

**Timeline:** [Duration]
```

### 4. Switch to Blueprint View

**Steps:**
1. In NIV sidebar, click "Open Campaign Planner" button
2. **Expected:** Main content area (60% width) switches from welcome screen to blueprint view
3. **Expected:** Blueprint displays with:
   - Pattern badge (CASCADE)
   - Objective
   - Narrative
   - Vectors list with stakeholders
   - Content strategy
   - Execution plan
   - Timeline

**Blueprint View Should Show:**
- ✅ Pattern indicator (CASCADE, MIRROR, etc.)
- ✅ Core Strategy section
- ✅ Target Vectors with stakeholders
- ✅ Content Strategy with types
- ✅ Execution Plan with scheduling
- ✅ Timeline visualization

### 5. Test Other Patterns

**Test MIRROR Pattern:**
- Input: "Create a MIRROR strategy for crisis pre-positioning"
- Expected: Blueprint with MIRROR pattern, anticipatory messaging, crisis scenarios

**Test CHORUS Pattern:**
- Input: "Design a CHORUS grassroots campaign"
- Expected: Blueprint with CHORUS pattern, community activation, bottom-up approach

**Test TROJAN Pattern:**
- Input: "Build a TROJAN campaign with hidden messaging"
- Expected: Blueprint with TROJAN pattern, surface vs. deep messaging layers

**Test NETWORK Pattern:**
- Input: "Create a NETWORK influence campaign"
- Expected: Blueprint with NETWORK pattern, indirect influence paths, connector mapping

### 6. Test Opportunity Detection

**Steps:**
1. Click "Find opportunities" button OR type: "What PR opportunities are available right now?"
2. **Expected:** NIV calls opportunity detection tools
3. **Expected:** NIV responds with opportunities found
4. **Expected:** "View Opportunities" button appears
5. Click button
6. **Expected:** Opportunities tab/window opens with detected opportunities

### 7. Test Intelligence Research

**Steps:**
1. Click "Research landscape" button OR type: "Analyze the current market landscape for AI startups"
2. **Expected:** NIV calls research tools (Fireplexity, etc.)
3. **Expected:** NIV responds with market analysis
4. **Expected:** Research data is displayed or action offered

### 8. Test V3 Mode (Manual Form)

**Steps:**
1. In Campaign Planner main area, find V3 mode toggle or form
2. Switch to V3 mode
3. **Expected:** Traditional campaign form appears
4. **Expected:** Can manually fill out campaign details
5. **Expected:** Can switch back to V4 NIV mode

## Expected Edge Function Calls

### NIV Orchestrator (`niv-orchestrator-robust`)
- **Endpoint:** `${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`
- **Request Body:**
```json
{
  "message": "User's message",
  "conversationId": "niv-panel-{timestamp}",
  "organizationId": "1",
  "organizationContext": {
    "name": "Organization Name",
    "industry": "Technology"
  },
  "framework": null
}
```

- **Response:**
```json
{
  "response": "NIV's response text",
  "action": {
    "type": "campaign_ready" | "opportunities_found" | "content_ready",
    "data": {
      "blueprint": { /* V4 blueprint structure */ }
    }
  },
  "tools_used": ["tool1", "tool2"],
  "opportunities": [ /* if type is opportunities_found */ ]
}
```

### Campaign Orchestrator (`niv-campaign-orchestrator`)
- Called by orchestrator-robust when generating campaigns
- Returns V4 blueprint structure

### Execution Orchestrator (`campaign-execution-orchestrator`)
- Called when executing content from blueprint
- Generates actual content pieces

## Known Issues & Expected Behavior

### WorkspaceCanvasComponent Errors
- **Issue:** Missing `useMemoryVault` hook and `react-markdown` dependency
- **Impact:** None - WorkspaceCanvasComponent is separate, doesn't affect Campaign Planner
- **Status:** Pre-existing issue, not related to V4 implementation

### NIV Orchestrator Timeouts
- **Issue:** Some orchestrator calls timeout (504 errors)
- **Cause:** Complex tool chains take >2 minutes
- **Expected:** NIV will show timeout error, user can retry
- **Improvement:** Consider async processing for long-running operations

### Dev Server Port
- **Note:** Running on port 3001 (3000 was in use)
- **Access:** http://localhost:3001

## Success Criteria

✅ **Campaign Planner opens with NIV sidebar embedded**
- NIV visible as 40% width sidebar
- Main content area is 60% width
- No separate NIV window/tab

✅ **NIV generates campaigns from natural language**
- User types or clicks action button
- NIV responds with blueprint
- Blueprint contains V4 pattern structure

✅ **Blueprint displays in main content area**
- Clicking "Open Campaign Planner" switches view
- Blueprint shows pattern, vectors, content strategy
- User can navigate blueprint sections

✅ **Multiple patterns supported**
- CASCADE (viral)
- MIRROR (crisis pre-positioning)
- CHORUS (grassroots)
- TROJAN (hidden messaging)
- NETWORK (indirect influence)

✅ **NIV integrates with other modules**
- Opens Opportunities when opportunities detected
- Opens Execute when content ready
- Stores blueprints to Memory Vault

## Test Results

### Test Environment
- **Date:** 2025-10-10
- **Dev Server:** http://localhost:3001
- **Backend:** Supabase Edge Functions
- **Frontend:** Next.js 15 + React 18

### Test Execution
_[To be filled in during testing]_

**Test 1: Open Campaign Planner**
- Status: ⏳ Pending
- Notes:

**Test 2: Generate CASCADE Campaign**
- Status: ⏳ Pending
- Notes:

**Test 3: View Blueprint**
- Status: ⏳ Pending
- Notes:

**Test 4: Switch to Blueprint View**
- Status: ⏳ Pending
- Notes:

**Test 5: Test Other Patterns**
- Status: ⏳ Pending
- Notes:

**Test 6: Test Opportunity Detection**
- Status: ⏳ Pending
- Notes:

**Test 7: Test Intelligence Research**
- Status: ⏳ Pending
- Notes:

**Test 8: Test V3 Mode**
- Status: ⏳ Pending
- Notes:

## Next Steps After Testing

1. **Fix any UI/UX issues** discovered during testing
2. **Optimize orchestrator timeout** handling
3. **Add blueprint editing** capabilities
4. **Implement campaign execution** flow
5. **Add Memory Vault** integration for saving blueprints
6. **Create onboarding** guide for V4 patterns
7. **Build analytics** dashboard for campaign performance

## Files Modified in V4 Implementation

### Frontend Components
1. `/src/components/niv/NIVPanel.tsx` - Main NIV chat interface
2. `/src/components/niv/NivCanvasComponentV4.tsx` - Canvas wrapper for NIV
3. `/src/components/prototype/StrategicCampaignPlanner.tsx` - Embedded NIV sidebar

### API Routes
1. `/src/app/api/niv-orchestrator/route.ts` - Proxy to edge function

### Edge Functions (Supabase)
1. `niv-orchestrator-robust` - Main orchestrator with tools
2. `niv-campaign-orchestrator` - Campaign generation
3. `campaign-execution-orchestrator` - Content execution
4. `knowledge-library-registry` - Knowledge base access
5. `opportunity-orchestrator-v2` - Opportunity detection with patterns

### Canvas Integration
1. `/src/components/canvas/InfiniteCanvas.tsx` - Canvas system
   - Line 60: Registered `campaign-planner` component type
   - Line 333: Renders StrategicCampaignPlanner with nivBlueprint prop
   - Lines 152-155: Listens for NIV blueprint data from CustomEvents

## Documentation

- **V4 Patterns:** See `SIGNALDESK_V3_COMPLETE_TECHNICAL_SPECIFICATION.md`
- **Architecture:** See `AGENTS_MIGRATION_COMPLETE.md`
- **Edge Functions:** Deployed to Supabase, see deployment logs
- **Implementation:** See `AGENT_SUMMARY.md` for Week 1-3 summary

## Contact

For questions or issues with V4 implementation, refer to:
- Technical Specification documents
- Edge function source code in Supabase dashboard
- Component source files listed above
