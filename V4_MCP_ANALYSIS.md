# V4 MCP & Edge Function Analysis

## What V4 Needs for Psychological PR Patterns

### 1. CASCADE Pattern
**Needs**:
- Find niche communities (100+ at scale)
- Generate personalized seed content (20-50 variations)
- Monitor pattern emergence (convergence detection)
- Track "discovery" mentions vs. "marketing" mentions

**Existing Tools**:
✅ **niv-fireplexity** - Can search for communities, topics
✅ **niv-content-intelligent-v2** - Content generation with routing
✅ **monitor-stage-1** - Real-time monitoring
✅ **mcp-social-intelligence** - Social signal detection
❓ **Gap**: Community-specific research (Discord, Reddit, niche forums)
❓ **Gap**: "Discovery" vs "Marketing" sentiment analysis

### 2. VOID Pattern
**Needs**:
- Monitor expectation windows (when people expect you to speak)
- Track speculation velocity (how fast silence builds curiosity)
- Detect optimal entry point (peak curiosity)
- Generate perfectly-timed response

**Existing Tools**:
✅ **monitor-stage-1** - Real-time article monitoring
✅ **mcp-social-intelligence** - Social signals
✅ **niv-content-intelligent-v2** - Response generation
❌ **Gap**: Expectation tracking (predict when silence is notable)
❌ **Gap**: Speculation velocity analysis
❌ **Gap**: Void window detection

### 3. MIRROR Pattern
**Needs**:
- Predict likely crises (pattern analysis)
- Pre-position content (safety messaging)
- Crisis detection (when predicted event happens)
- Rapid activation (deploy pre-positioned content)

**Existing Tools**:
✅ **mcp-crisis** - Crisis detection and response
✅ **monitor-stage-1** - Real-time crisis monitoring
✅ **niv-crisis-consultant** - Crisis advisory
✅ **niv-content-intelligent-v2** - Crisis content generation
❓ **Gap**: Crisis prediction (statistical analysis of patterns)
✅ **Mostly covered** - Crisis response is strong

### 4. TROJAN Pattern
**Needs**:
- Research audience desires (what they want)
- Design experiences (contests, tools, events)
- Embed messaging naturally (learning through participation)
- Track experience-based learning

**Existing Tools**:
✅ **niv-fireplexity** - Research audience interests
✅ **mcp-discovery** - Audience profile research
✅ **niv-content-intelligent-v2** - Content generation
❌ **Gap**: Experience design (contests, interactive content)
❌ **Gap**: Learning outcome tracking

### 5. NETWORK Pattern
**Needs**:
- Map influence networks (who influences who)
- Trace influence paths (researcher → blogger → analyst → decision-maker)
- Generate content for each network level
- Track citation chains (who cited what)

**Existing Tools**:
✅ **journalist-registry** - Media relationships
✅ **mcp-relationships** - Relationship mapping
✅ **mcp-media** - Media intelligence
✅ **niv-fireplexity** - Research network nodes
❓ **Gap**: Multi-level network mapping (influencer of influencer)
❓ **Gap**: Citation chain tracking

## Analysis Summary

### 🟢 Strongly Covered (Can Use Immediately)
1. **CASCADE**: 80% covered
   - Community research: ✅ niv-fireplexity
   - Content generation: ✅ niv-content-intelligent-v2
   - Monitoring: ✅ monitor-stage-1, mcp-social-intelligence
   - Need: Better community-specific targeting

2. **MIRROR**: 90% covered
   - Crisis detection: ✅ mcp-crisis
   - Crisis response: ✅ niv-crisis-consultant
   - Content generation: ✅ niv-content-intelligent-v2
   - Need: Predictive crisis patterns

### 🟡 Partially Covered (Need Enhancement)
3. **NETWORK**: 60% covered
   - Have: Basic relationship mapping
   - Need: Multi-level network analysis
   - Need: Citation chain tracking

4. **TROJAN**: 60% covered
   - Have: Audience research, content generation
   - Need: Experience design framework
   - Need: Participation/learning tracking

### 🔴 Needs New Tools
5. **VOID**: 40% covered
   - Have: Real-time monitoring
   - Need: Expectation window detection
   - Need: Speculation velocity analysis
   - Need: Optimal entry point calculation

## Recommended Approach

### Phase 1: Use What We Have (MVP)
**Build with existing tools only**:
- CASCADE and MIRROR patterns work NOW
- Use niv-strategic-framework + niv-content-intelligent-v2
- Create campaign planner that routes to existing tools
- Focus on 80% solution with zero new infrastructure

**MVP Features**:
```typescript
// Pattern support in MVP
patterns: {
  cascade: 'full',      // 80% covered, good enough to ship
  mirror: 'full',       // 90% covered, excellent
  network: 'basic',     // 60% covered, manual network mapping
  trojan: 'basic',      // 60% covered, manual experience design
  void: 'manual'        // 40% covered, user tracks manually
}
```

### Phase 2: Strategic Enhancements (If Needed)
**Only build NEW tools if users demand these patterns**:

#### New Edge Function 1: `mcp-network-mapper`
```typescript
// Multi-level influence network mapping
Purpose: "Map who influences who, 3-5 levels deep"

Functions:
- mapInfluenceNetwork(targetAudience, depth)
- traceInfluencePath(from, to)
- findAccessibleNodes(targetNetwork)
- trackCitationChains(content, network)

Example:
mapInfluenceNetwork("Fortune 500 CTOs", 3)
→ [
  Level 1: CTOs
  Level 2: Gartner analysts, IT consultants
  Level 3: Tech bloggers, industry researchers
  Level 4: Academic researchers (accessible!)
]
```

#### New Edge Function 2: `mcp-void-detector`
```typescript
// Strategic silence opportunity detection
Purpose: "Detect when silence creates more impact than speech"

Functions:
- detectExpectationWindows(organization, event)
- measureSpeculationVelocity(silence_duration)
- calculateOptimalEntry(void_metrics)
- generateTimedResponse(void_context)

Example:
detectExpectationWindows("OpenAI", "competitor_announcement")
→ {
  expected_response_window: "0-4 hours",
  speculation_begins: "2 hours",
  peak_curiosity: "48 hours",
  optimal_entry: "42-50 hours"
}
```

#### Enhancement: `niv-fireplexity-communities`
```typescript
// Enhanced community-specific research
Purpose: "Find and analyze niche communities at scale"

New capabilities:
- searchDiscordServers(topic)
- searchRedditCommunities(topic)
- searchNicheForums(topic)
- analyzeCommunityPsychology(community)
- generateCommunityContent(community, message)

Example:
searchNicheForums("AI art")
→ [
  {name: "Stable Diffusion Artists", members: 15K, psychology: "technical, experimental"},
  {name: "AI Art Collective", members: 8K, psychology: "philosophical, boundary-pushing"},
  ...
]
```

## Recommendation: START WITH MVP

### Why Build MVP First:
1. **Validate patterns**: See if users actually want CASCADE/MIRROR/NETWORK
2. **Test workflow**: Campaign planner → Blueprint → NIV execution
3. **Prove value**: Show psychological PR works before investing in new tools
4. **Fast launch**: Use existing 80% solution, ship in days not weeks

### MVP Architecture:
```typescript
// Strategic Campaign Planner (new component)
├── Objective Intake Form
├── Pattern Recommendation Engine (uses Claude directly)
├── Campaign Blueprint Generator (uses Claude directly)
└── Routes to Existing Tools:
    ├── niv-fireplexity (research)
    ├── niv-content-intelligent-v2 (content generation)
    ├── monitor-stage-1 (monitoring)
    ├── mcp-crisis (mirror pattern)
    └── mcp-discovery (audience research)
```

### What We DON'T Build Yet:
- ❌ mcp-network-mapper (wait for user demand)
- ❌ mcp-void-detector (can track manually first)
- ❌ Enhanced community research (niv-fireplexity works for MVP)

## MVP Implementation Plan

### Day 1: Strategic Campaign Planner Component
```typescript
// /src/components/prototype/StrategicCampaignPlanner.tsx

1. Objective Intake Form
   - PR objective input
   - Target audience selection
   - Psychology analysis
   - Constraint inputs

2. Pattern Recommendation System
   - Use Claude API directly (no new edge function)
   - Analyze objective + audience + psychology
   - Recommend pattern (CASCADE, MIRROR, etc.)
   - Explain rationale

3. Campaign Blueprint Generator
   - Use Claude API directly
   - Generate phased tactical plan
   - Classify tactics (auto/semi/manual)
   - Create content generation queue
```

### Day 2: Integration with Existing Tools
```typescript
4. NIV Content Orchestrator Integration
   - Pass auto-executable content queue
   - Route to niv-content-intelligent-v2
   - Track generation progress

5. Memory Vault Integration
   - Save campaign blueprint
   - Organize by campaign name
   - Link generated content
```

### Day 3: Polish & Testing
```typescript
6. Campaign Dashboard (basic)
   - Phase tracking
   - Content generation status
   - Manual action checklist

7. Test with real scenario
   - "Make creative community see us as champion" (CASCADE)
   - Generate campaign blueprint
   - Execute content generation
   - Verify workflow
```

## Summary

**Answer: We DON'T need new MCPs for MVP!**

We have 80% of what we need:
- ✅ Research: niv-fireplexity
- ✅ Content: niv-content-intelligent-v2
- ✅ Monitoring: monitor-stage-1, mcp-social-intelligence
- ✅ Crisis: mcp-crisis, niv-crisis-consultant
- ✅ Relationships: mcp-relationships, journalist-registry

We can build Strategic Campaign Planner that:
1. Takes PR objective
2. Recommends psychological pattern (using Claude directly)
3. Generates campaign blueprint (using Claude directly)
4. Routes auto-executable content to existing NIV orchestrator
5. Saves to Memory Vault

Launch MVP in 3 days, then enhance based on user feedback.

Want me to start building the Strategic Campaign Planner component now?
