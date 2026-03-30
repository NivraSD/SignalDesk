# Executive Summary Generation - Complete Documentation Index

## Overview
This collection of documents provides a comprehensive analysis of how executive summaries are generated in SignalDesk V3, including the code, prompts, logic, and prioritization rules.

## Documents Included

### 1. EXECUTIVE_SUMMARY_QUICK_REFERENCE.md
**Best for:** Quick lookup, understanding key facts at a glance

**Contains:**
- What gets included (80/20 rule)
- Competitor vs other news prioritization
- Recency rules
- Discovery targets
- Content categorization (competitive vs stakeholder)
- Prompt system overview
- JSON output structure
- Data flow diagram
- Critical insights

**Start here if:** You have limited time and need the essentials

---

### 2. EXECUTIVE_SUMMARY_GENERATION_ANALYSIS.md
**Best for:** Complete understanding of the architecture and logic

**Contains:**
- Overview of the entire system
- Data preparation and context structuring
- Event filtering and weighting logic (80/20 rule)
- Intelligence target loading from database
- User prompt structure and components
- System prompt with recency prioritization
- JSON output structure explanation
- Secondary synthesis functions (GEO, goal-aligned)
- Data extraction layer details
- Key logic decisions and prioritization
- Summary of the generation process

**Start here if:** You want comprehensive understanding of how everything works

---

### 3. EXECUTIVE_SUMMARY_CODE_SNIPPETS.md
**Best for:** Finding exact code locations and implementing changes

**Contains:**
- File location and line numbers for all key sections
- Event prioritization code (80/20 rule)
- Discovery target loading code
- Full system prompt
- Full user prompt
- JSON output template
- Data structure preparation code
- Date formatting logic
- Claude API call configuration
- Response parsing logic
- Database storage logic
- Quick reference table

**Start here if:** You need to modify code or find specific implementations

---

## Quick Navigation

### By Question

**"How does competitor news get weighted vs other news?"**
- QUICK_REFERENCE.md: Section 2 (80/20 Rule)
- ANALYSIS.md: Section "Stage 2: Event Filtering & Weighting"
- CODE_SNIPPETS.md: Section 1 (Lines 410-463)

**"What instructions does Claude receive?"**
- ANALYSIS.md: "The Generation Prompts" sections
- CODE_SNIPPETS.md: Sections 3 & 4 (System & User Prompts)

**"How does recency prioritization work?"**
- QUICK_REFERENCE.md: Section 3
- ANALYSIS.md: "CRITICAL: RECENCY PRIORITIZATION"
- CODE_SNIPPETS.md: Section 7 (Date Formatting)

**"Who and what gets tracked?"**
- QUICK_REFERENCE.md: Section 4 (Discovery Targets)
- ANALYSIS.md: "Stage 3: Intelligence Target Loading"
- CODE_SNIPPETS.md: Section 2 (Lines 223-301)

**"What's the JSON output format?"**
- QUICK_REFERENCE.md: Section 7
- ANALYSIS.md: "JSON Output Structure"
- CODE_SNIPPETS.md: Section 5 (Lines 602-636)

**"How does the entire pipeline work?"**
- QUICK_REFERENCE.md: Section 9 (Data Flow)
- ANALYSIS.md: "Summary: The Generation Process"

---

## Key File Location
**Main Code File:** 
`/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-executive-synthesis/index.ts`

**Secondary Functions:**
- `geo-executive-synthesis/index.ts` - GEO visibility analysis
- `claude-intelligence-synthesizer/index.ts` - Goal-aligned synthesis
- `monitoring-stage-2-enrichment/index.ts` - Data extraction

---

## Key Numbers to Remember

| Aspect | Number | Location |
|--------|--------|----------|
| Competitor events selected | 40 (of 50 total) | CODE_SNIPPETS.md Sec 1 |
| Organization events selected | 10 (of 50 total) | CODE_SNIPPETS.md Sec 1 |
| Min entities in summary | 10 different companies | ANALYSIS.md Sec "User Prompt" |
| Competitor/Org weighting | 4:1 (80/20) | All docs |
| Recent event priority window | 7 days | QUICK_REFERENCE.md Sec 3 |
| Medium priority window | 1-2 weeks | QUICK_REFERENCE.md Sec 3 |
| Low priority window | 2 weeks+ | QUICK_REFERENCE.md Sec 3 |
| Maximum prompt characters | 100,000 | CODE_SNIPPETS.md Sec 4 |
| Claude model | claude-sonnet-4-20250514 | CODE_SNIPPETS.md Sec 8 |
| Temperature setting | 0.3 | CODE_SNIPPETS.md Sec 8 |
| Max tokens | 4000 | CODE_SNIPPETS.md Sec 8 |

---

## Critical Concepts Explained

### 1. The 80/20 Rule
**What:** Competitor/market news is weighted 4x more heavily than org's own news
**Why:** Executives need to understand competitive landscape more than their own context
**How:** 40 competitor events selected vs 10 org events out of 50 total
**Code:** CODE_SNIPPETS.md Section 1, Lines 446-454

### 2. Recency Prioritization
**What:** Recent events (today/yesterday) are emphasized over old events (months ago)
**Why:** Executives care about what's happening NOW, not historical context
**How:** Implemented at 3 levels (system prompt, user prompt, explicit rules)
**Code:** CODE_SNIPPETS.md Sections 3, 4, 7

### 3. Competitive vs Stakeholder Distinction
**What:** Regulatory news goes in "stakeholder_dynamics", not "competitive_moves"
**Why:** These are different types of intelligence requiring different responses
**How:** Content categorization rules in user prompt with examples
**Code:** CODE_SNIPPETS.md Section 4, Lines 593-598

### 4. Source-Based Synthesis
**What:** All claims must trace back to articles/events provided
**Why:** Prevents hallucination and ensures accuracy
**How:** User prompt explicitly states "Your ONLY source", no external knowledge
**Code:** CODE_SNIPPETS.md Section 4, Multiple locations

### 5. Variety Requirement
**What:** Must mention 10+ different companies/entities
**Why:** Ensures broad competitive perspective, not focused on one competitor
**How:** Explicit requirement in synthesis rules
**Code:** CODE_SNIPPETS.md Section 4, Lines 586-591

---

## How to Use These Documents

### For Understanding the System
1. Start with QUICK_REFERENCE.md for overview
2. Read ANALYSIS.md for complete logic
3. Use CODE_SNIPPETS.md for implementation details

### For Troubleshooting
1. Identify the problem (e.g., "old news is in summary")
2. Search relevant section in QUICK_REFERENCE.md
3. Get full details from ANALYSIS.md
4. Find code in CODE_SNIPPETS.md

### For Implementation
1. Find what needs to change in CODE_SNIPPETS.md
2. Understand the context in ANALYSIS.md
3. Check implications in QUICK_REFERENCE.md
4. Modify in actual file

### For Teaching/Explaining
1. Use QUICK_REFERENCE.md for overview
2. Use CODE_SNIPPETS.md for specific examples
3. Use ANALYSIS.md for deep explanation

---

## Summary

The executive summary generation system is designed to answer:
**"What should this organization pay attention to RIGHT NOW based on today's news?"**

It achieves this through:
1. **Heavy competitor weighting** (80% of content)
2. **Recency prioritization** (recent events emphasized)
3. **Source control** (only from provided data)
4. **Structured output** (consistent JSON format)
5. **Variety enforcement** (10+ entities required)

These three documents provide everything needed to understand, modify, or explain the system.

---

## Document Metadata

| Document | Size | Sections | Focus |
|----------|------|----------|-------|
| QUICK_REFERENCE.md | 1 page | 10 | Lookup, facts, essentials |
| GENERATION_ANALYSIS.md | 4 pages | 11 | Architecture, logic, flow |
| CODE_SNIPPETS.md | 6 pages | 10 | Implementation, code, details |

**Total Coverage:** Complete system documentation with architecture, logic, prompts, code, and quick reference.

