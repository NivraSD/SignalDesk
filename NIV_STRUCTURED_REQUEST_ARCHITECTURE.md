# NIV Structured Request Architecture

## Problem
User requests with explicit structure like:
```
Create a comprehensive strategic framework for [OBJECTIVE]. Include:
1) Clear measurable objective
2) Core narrative and proof points
3) Target audience segments and messages
4) Content needs and distribution strategy
5) Media targets by tier
6) Timeline with immediate actions and milestones
7) Success metrics and KPIs
```

Were being sent to Claude in one giant prompt, causing:
- API errors (context limit exceeded)
- Generic responses (ignoring user's specific structure)
- Missing contentStrategy and executionPlan fields

## Solution: Multi-Step Agentic Architecture

### Flow for Structured Requests

```
1. USER REQUEST → niv-orchestrator-robust
   ↓
2. DETECT STRUCTURED REQUEST
   - Pattern match: "Include: 1) ... 2) ..."
   - Extract sections user wants
   ↓
3. DO RESEARCH (if needed)
   - Call niv-fireplexity for background info
   - Gather competitive data, market insights
   ↓
4. BUILD RESPONSE SECTION-BY-SECTION
   - For each section user requested:
     * Extract relevant data from research
     * Format according to section type
     * Use Claude for specific section if complex
   ↓
5. PACKAGE FOR EXECUTION
   - Call niv-strategic-framework (simplified)
   - Just packages structured data
   - Adds contentStrategy and executionPlan
   ↓
6. RETURN TO USER
   - Formatted response matching their structure
   - Execute Campaign button ready
```

### Key Changes

**niv-orchestrator-robust**:
- ✅ Added `detectStructuredRequest()` function
- 🔄 TODO: Add `buildStructuredResponse()` function
- 🔄 TODO: Route structured requests differently
- Goal: Be the "brain" - understand intent, orchestrate steps

**niv-strategic-framework**:
- ✅ Simplified prompt to be flexible
- ✅ Added contentStrategy and executionPlan to schema
- 🔄 TODO: Remove massive example prompt
- Goal: Be a "packaging service" - format data for execution

### Architecture Principles

1. **Orchestrator = Brain**
   - Understands user intent
   - Plans multi-step execution
   - Calls appropriate tools/MCPs
   - Builds response incrementally

2. **Strategic Framework = Packager**
   - Takes structured data
   - Formats for downstream execution
   - Adds contentStrategy and executionPlan
   - Returns executable framework

3. **Like Claude Desktop + MCPs**
   - Each tool does one thing well
   - Orchestrator coordinates between tools
   - Results accumulate across steps
   - Final output combines all insights

## Example: Sora 2 Launch Request

**Request**: "Create a comprehensive strategic framework for our launch of sora 2. Include: 1) Clear measurable objective, 2) Core narrative and proof points..."

**Execution**:
1. Orchestrator detects 7 structured sections
2. Calls niv-fireplexity: "sora 2 launch competitors market positioning"
3. Gets back: articles, competitive landscape
4. Builds response:
   - Section 1 (Objective): Extract from research → "Capture 35% market share..."
   - Section 2 (Narrative): Synthesize articles → "Sora 2 represents..."
   - Section 3 (Audiences): Extract stakeholders → "Creative professionals, enterprises..."
   - Section 4 (Content): Map to MCP types → [press-release, blog-post, ...]
   - Section 5 (Media): Build tier list → {tier1: [TechCrunch], tier2: [...]}
   - Section 6 (Timeline): Create milestones → {week1: [...], month1: [...]}
   - Section 7 (Metrics): Define KPIs → ["Market share", "Media coverage"...]
5. Packages into framework with contentStrategy and executionPlan
6. Returns formatted response

**Result**: User gets exactly the 7 sections they asked for, populated with research data, ready for execution.

## Implementation Status

### ✅ Completed
- Flexible prompt in niv-strategic-framework
- contentStrategy and executionPlan in prompt schema
- detectStructuredRequest() function

### 🔄 In Progress
- buildStructuredResponse() function
- Routing logic for structured requests
- Simplified strategic-framework packaging

### ⏳ Next Steps
1. Complete buildStructuredResponse()
2. Add routing in orchestrator main flow
3. Simplify strategic-framework to pure packaging
4. Test end-to-end with Sora 2 example
5. Test Execute Campaign flow
