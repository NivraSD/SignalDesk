# SignalDesk Intelligence Pipeline - Complete Flow Architecture
## The Actual Working System (2025-08-27)

---

## 🎯 Overview
The system uses a **6-stage elaborate intelligence pipeline** that takes ~2-3 minutes to complete, providing deep PR-focused analysis through Claude AI at each stage, culminating in a comprehensive synthesis that generates the final tabbed display.

---

## 📊 Component Architecture

```
User → OnboardingV3 → RailwayV2 → MultiStageIntelligence → intelligenceOrchestratorV4 
                                        ↓
                              6 Edge Functions (Stages 1-5 + Synthesis)
                                        ↓
                              Final Tabbed Display (6 Tabs)
```

---

## 🔄 Complete Data Flow

### Phase 1: Organization Setup
```
1. User enters organization name in OnboardingV3
   ↓
2. OnboardingV3 calls → organization-discovery (Edge Function)
   - Claude AI enhances organization profile
   - Identifies competitors, stakeholders, keywords
   ↓
3. Saves to BOTH:
   - localStorage (quick access)
   - intelligence-persistence (Edge Function - primary storage)
   ↓
4. Navigate to → RailwayV2
```

### Phase 2: Intelligence Pipeline Initialization
```
5. RailwayV2 loads organization data
   - First tries localStorage (fast)
   - Falls back to intelligence-persistence
   ↓
6. RailwayV2 renders → MultiStageIntelligence component
   - NOT IntelligenceHubV8 (that was the quick 2-phase version)
   ↓
7. MultiStageIntelligence starts elaborate pipeline
```

### Phase 3: 6-Stage Intelligence Analysis

#### Stage 1: Organization Data Extraction (30s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runOrganizationExtraction()
                     ↓
        intelligence-collection-v1 (Edge Function)
                     ↓
        - Calls monitor-intelligence for comprehensive monitoring
        - Aggregates: RSS feeds + Firecrawl + APIs
        - Returns raw signals
                     ↓
        Saves to intelligence-persistence (saveStageData)
```

#### Stage 2: Competitive Intelligence (45s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runCompetitiveStage()
                     ↓
        intelligence-stage-1-competitors (Edge Function)
                     ↓
        - Claude AI Competitive Analyst personality
        - Analyzes competitors from monitoring data
        - Creates battle cards, threat assessments
                     ↓
        Saves to intelligence-persistence
```

#### Stage 3: Media Analysis (40s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runMediaStage()
                     ↓
        intelligence-stage-2-media (Edge Function)
                     ↓
        - Claude AI Media Analyst personality
        - Sentiment analysis, narrative tracking
        - PR opportunities identification
                     ↓
        Saves to intelligence-persistence
```

#### Stage 4: Regulatory Analysis (35s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runRegulatoryStage()
                     ↓
        intelligence-stage-3-regulatory (Edge Function)
                     ↓
        - Claude AI Regulatory Analyst personality
        - Compliance monitoring, risk assessment
        - Stakeholder implications
                     ↓
        Saves to intelligence-persistence
```

#### Stage 5: Trends Analysis (30s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runTrendsStage()
                     ↓
        intelligence-stage-4-trends (Edge Function)
                     ↓
        - Claude AI Trend Analyst personality
        - Market dynamics, emerging opportunities
        - Technology disruptions
                     ↓
        Saves to intelligence-persistence
```

#### Stage 6: Strategic Synthesis (50s)
```javascript
MultiStageIntelligence → intelligenceOrchestratorV4.runSynthesisStage()
                     ↓
        intelligence-stage-5-synthesis (Edge Function)
                     ↓
        Receives ALL previous stage data:
        {
          previousResults: {
            stage1: competitors data,
            stage2: media data,
            stage3: regulatory data,
            stage4: trends data,
            extraction: organization data
          },
          allStageData: complete results,
          intelligence: monitoring data
        }
                     ↓
        Claude AI Executive Synthesizer:
        - Cross-dimensional insights
        - Pattern recognition
        - Consolidated opportunities
        - PR implications
        - Creates final tab structure
```

### Phase 4: Final Display

```javascript
MultiStageIntelligence.synthesizeElaborateResults()
                     ↓
        Processes synthesis response into 6 tabs:
        
        1. Executive Summary
           - Key developments (what happened)
           - Comparative position (vs competitors)
           - Narrative health (perception)
           - PR implications (what it means)
           
        2. Competitive
           - Direct/indirect/emerging competitors
           - Battle cards
           - Competitive dynamics
           
        3. Market
           - Market trends
           - Emerging narratives
           - Environmental assessment
           
        4. Regulatory
           - Compliance status
           - Regulatory developments
           - Stakeholder implications
           
        5. Media
           - Coverage analysis
           - Sentiment tracking
           - Key narratives
           
        6. Forward Looking
           - Early signals
           - Cross-dimensional insights
           - Watch items
                     ↓
        Displays in MultiStageIntelligence UI with:
        - Stage progress animation during analysis
        - Tabbed interface after completion
        - Opportunities section
```

---

## 🗄️ Data Persistence Architecture

### Edge Function: intelligence-persistence
Handles all data storage with actions:
- `saveProfile` - Save organization profile
- `getProfile` - Retrieve organization profile
- `saveStageData` - Save individual stage results
- `getLatestProfile` - Get most recent profile
- `clearProfile` - Clear organization data

### Database Tables
```sql
organization_profiles - Complete org profiles with discovery data
intelligence_findings - Raw monitoring data
monitoring_alerts - Active monitoring status
stage_results - Results from each analysis stage (proposed)
```

---

## 🚀 Key Edge Functions

### Data Collection
- `organization-discovery` - AI-powered org profiling
- `monitor-intelligence` - Aggregates RSS + Firecrawl + APIs
- `intelligence-collection-v1` - Fast collection orchestrator
- `source-registry` - RSS feed management

### 5-Stage Analysis Pipeline
1. `intelligence-stage-1-competitors` - Competitive analysis
2. `intelligence-stage-2-media` - Media sentiment
3. `intelligence-stage-3-regulatory` - Compliance & regulation
4. `intelligence-stage-4-trends` - Market trends
5. `intelligence-stage-5-synthesis` - Final synthesis & tabs

### Support Functions
- `intelligence-persistence` - Data storage/retrieval
- `test-api-key` - Claude API validation

---

## 🔑 Critical Configuration

### Frontend Components
```javascript
// Main Components Flow
/src/components/OnboardingV3.js          → Organization discovery
/src/components/RailwayV2.js             → Main dashboard container
/src/components/MultiStageIntelligence.js → 6-stage pipeline UI
/src/services/intelligenceOrchestratorV4.js → Pipeline orchestration
```

### Why NOT IntelligenceHubV8?
```javascript
IntelligenceHubV8 → Calls orchestrate() without stage config
                 → Defaults to runComprehensiveAnalysis()
                 → Only 2 phases (quick collection + synthesis)
                 → Missing the elaborate 6-stage analysis
                 
MultiStageIntelligence → Calls each stage explicitly
                      → Shows progress for each stage
                      → Ensures all data flows to synthesis
                      → Proper loading animations
```

---

## 🐛 Common Issues & Solutions

### Issue: "Pipeline is broken"
**Symptom**: Only seeing 2 phases instead of 6 stages
**Cause**: Using IntelligenceHubV8 instead of MultiStageIntelligence
**Fix**: RailwayV2 must render MultiStageIntelligence

### Issue: "Synthesis not getting all data"
**Symptom**: Final tabs missing information
**Cause**: Synthesis only receiving entity_actions and topic_trends
**Fix**: Pass ALL stage results to synthesis:
```javascript
previousResults: {
  stage1: competitors,
  stage2: media,
  stage3: regulatory,
  stage4: trends,
  extraction: organization
}
```

### Issue: "Tabs not showing Claude analysis"
**Symptom**: Generic content instead of AI insights
**Cause**: Synthesis response not properly mapped to tabs
**Fix**: Extract from Claude's response structure:
```javascript
executive_summary → executive tab
cross_dimensional_insights → forward tab
consolidated_opportunities → opportunities
```

---

## ✅ Verification Checklist

- [ ] OnboardingV3 saves to BOTH localStorage and Supabase
- [ ] RailwayV2 renders MultiStageIntelligence (NOT IntelligenceHubV8)
- [ ] MultiStageIntelligence shows 6 stages with progress bars
- [ ] Each stage takes 30-50 seconds (total ~3 minutes)
- [ ] intelligenceOrchestratorV4 saves each stage to persistence
- [ ] Stage 5 synthesis receives ALL previous stage data
- [ ] Final display shows 6 tabs with Claude-generated content
- [ ] Opportunities are extracted and displayed

---

## 📝 Testing the Pipeline

1. Clear localStorage and start fresh
2. Enter organization name in OnboardingV3
3. Watch for 6 stages to run sequentially:
   - Organization Data Extraction
   - Competitive Intelligence
   - Media Analysis  
   - Regulatory Analysis
   - Trends Analysis
   - Strategic Synthesis
4. Verify each stage shows progress 0-100%
5. Check final tabs contain AI-generated insights
6. Verify data persists in Supabase

---

## 🎯 The Core Truth

**The system is designed for ELABORATE ANALYSIS, not quick results.**

- Takes 2-3 minutes for complete analysis
- Each stage runs Claude AI with specialized personality
- All stages build on each other
- Final synthesis needs ALL stage data
- Results in comprehensive PR-focused intelligence

This is NOT a quick lookup system - it's a deep intelligence pipeline that provides actionable PR insights based on comprehensive analysis of multiple data sources and AI reasoning.

---

*Last verified working: 2025-08-27*
*Pipeline stages: 6*
*Total duration: ~3 minutes*
*Claude AI calls: 6 (one per stage)*