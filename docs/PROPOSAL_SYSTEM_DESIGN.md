# Business Development Proposal System Design

## Overview
Design for a comprehensive proposal management system that enables intelligent retrieval of past proposals and strategic creation of new proposals.

## 1. Database Schema

### Proposal Metadata Table
```sql
-- Proposals table extending Memory Vault
CREATE TABLE IF NOT EXISTS proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Core identification
    title TEXT NOT NULL,
    client_name TEXT,
    industry TEXT NOT NULL, -- e.g., "Financial Services", "Healthcare", "Technology"
    sector TEXT, -- More specific: e.g., "Commercial Banking", "Investment Banking"

    -- Proposal details
    proposal_type TEXT NOT NULL CHECK (proposal_type IN (
        'new_business',
        'renewal',
        'rfp_response',
        'unsolicited_pitch',
        'partnership',
        'other'
    )),
    services_offered TEXT[], -- Array of services proposed
    deal_value_range TEXT, -- e.g., "100k-250k", "250k-500k", "500k-1M", "1M+"

    -- Content & structure
    file_path TEXT, -- Path to uploaded proposal file (if any)
    file_type TEXT, -- pdf, docx, etc.
    proposal_sections JSONB, -- { "executive_summary": "...", "technical_approach": "...", etc. }
    key_differentiators TEXT[], -- What made this unique

    -- Outcome tracking
    outcome TEXT CHECK (outcome IN ('won', 'lost', 'pending', 'no_decision', 'unknown')),
    outcome_date TIMESTAMPTZ,
    outcome_notes TEXT, -- Why won/lost, lessons learned
    win_probability INTEGER CHECK (win_probability >= 0 AND win_probability <= 100),

    -- Context & intelligence
    competitive_landscape JSONB, -- Who else was competing, why we won/lost
    client_requirements JSONB, -- Specific requirements they had
    decision_criteria JSONB, -- What they cared about most
    pricing_strategy TEXT, -- How we priced it

    -- Performance data
    proposal_date TIMESTAMPTZ,
    submission_deadline TIMESTAMPTZ,
    decision_date TIMESTAMPTZ,
    team_members TEXT[], -- Who worked on it

    -- Memory Vault integration
    memory_vault_id UUID REFERENCES memory_vault(id), -- Link to Memory Vault entry
    embeddings vector(1536), -- For semantic search

    -- Metadata
    tags TEXT[], -- Custom tags
    notes TEXT, -- Internal notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,

    -- Indexes
    INDEX idx_proposals_org_industry (organization_id, industry),
    INDEX idx_proposals_outcome (organization_id, outcome, outcome_date DESC),
    INDEX idx_proposals_type (organization_id, proposal_type),
    INDEX idx_proposals_services (organization_id, services_offered),
    INDEX idx_proposals_embeddings USING ivfflat(embeddings vector_cosine_ops)
);

-- Trigger to update Memory Vault when proposal changes
CREATE OR REPLACE FUNCTION sync_proposal_to_memory_vault()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update in memory_vault
    INSERT INTO memory_vault (
        id,
        organization_id,
        domain,
        type,
        data,
        embeddings,
        confidence_score
    )
    VALUES (
        COALESCE(NEW.memory_vault_id, uuid_generate_v4()),
        NEW.organization_id,
        'execution', -- Proposals are part of execution domain
        'proposal',
        jsonb_build_object(
            'title', NEW.title,
            'client_name', NEW.client_name,
            'industry', NEW.industry,
            'sector', NEW.sector,
            'proposal_type', NEW.proposal_type,
            'services_offered', NEW.services_offered,
            'outcome', NEW.outcome,
            'key_differentiators', NEW.key_differentiators,
            'proposal_sections', NEW.proposal_sections
        ),
        NEW.embeddings,
        CASE
            WHEN NEW.outcome = 'won' THEN 1.0
            WHEN NEW.outcome = 'lost' THEN 0.5
            ELSE 0.7
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data,
        embeddings = EXCLUDED.embeddings,
        confidence_score = EXCLUDED.confidence_score;

    -- Update the memory_vault_id reference
    IF NEW.memory_vault_id IS NULL THEN
        NEW.memory_vault_id := (
            SELECT id FROM memory_vault
            WHERE organization_id = NEW.organization_id
            AND type = 'proposal'
            AND data->>'title' = NEW.title
            ORDER BY created_at DESC LIMIT 1
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_proposal_to_memory_vault_trigger
    BEFORE INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION sync_proposal_to_memory_vault();
```

### Win Rate Analytics View
```sql
CREATE OR REPLACE VIEW proposal_analytics AS
SELECT
    organization_id,
    industry,
    proposal_type,
    COUNT(*) as total_proposals,
    COUNT(*) FILTER (WHERE outcome = 'won') as wins,
    COUNT(*) FILTER (WHERE outcome = 'lost') as losses,
    COUNT(*) FILTER (WHERE outcome = 'pending') as pending,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0)) * 100,
        2
    ) as win_rate,
    AVG(EXTRACT(EPOCH FROM (decision_date - proposal_date)) / 86400) as avg_decision_time_days
FROM proposals
GROUP BY organization_id, industry, proposal_type;
```

## 2. Content Type Definition

### Add to src/types/content.ts
```typescript
export type ContentType =
  | 'press-release'
  | 'crisis-response'
  | 'social-post'
  | 'media-pitch'
  | 'exec-statement'
  | 'qa-doc'
  | 'messaging'
  | 'thought-leadership'
  | 'presentation'
  | 'email'
  | 'proposal' // NEW
  | 'market-research' // NEW
  | 'competitive-analysis' // NEW
  | 'partnership-brief' // NEW
  | 'strategic-recommendation' // NEW

// Proposal-specific types
export interface ProposalMetadata {
  clientName?: string
  industry: string
  sector?: string
  proposalType: 'new_business' | 'renewal' | 'rfp_response' | 'unsolicited_pitch' | 'partnership' | 'other'
  servicesOffered: string[]
  dealValueRange?: string
  keyDifferentiators?: string[]
  outcome?: 'won' | 'lost' | 'pending' | 'no_decision' | 'unknown'
  outcomeDate?: Date
  outcomeNotes?: string
  competitiveLandscape?: {
    competitors: string[]
    whyWeWon?: string
    whyWeLost?: string
  }
  referencedProposals?: string[] // IDs of proposals used as reference
}

export interface ProposalSearchCriteria {
  industry?: string
  sector?: string
  servicesOffered?: string[]
  outcomePreference?: 'won_only' | 'successful_and_pending' | 'all'
  recencyWeight?: number // 0-1, higher = prefer recent
  minWinRate?: number // Minimum win rate for similar proposals
}
```

### Add to CONTENT_TYPE_CONFIG
```typescript
'proposal': {
  label: 'Business Proposal',
  icon: '📋',
  description: 'Business development proposal with intelligent reference retrieval',
  defaultTone: 'professional',
  typicalLength: '2000-5000 words',
  guidelines: 'Executive summary, technical approach, team credentials, pricing, case studies'
},
'market-research': {
  label: 'Market Research',
  icon: '📊',
  description: 'Market analysis and opportunity assessment',
  defaultTone: 'analytical',
  typicalLength: '1500-3000 words',
  guidelines: 'Market size, trends, competitive landscape, opportunities, recommendations'
},
'competitive-analysis': {
  label: 'Competitive Analysis',
  icon: '🎯',
  description: 'Detailed competitor analysis and positioning',
  defaultTone: 'analytical',
  typicalLength: '1000-2000 words',
  guidelines: 'Competitor profiles, SWOT analysis, positioning map, strategic recommendations'
},
'partnership-brief': {
  label: 'Partnership Brief',
  icon: '🤝',
  description: 'Partnership opportunity and framework',
  defaultTone: 'collaborative',
  typicalLength: '1000-1500 words',
  guidelines: 'Partnership rationale, mutual benefits, structure, terms, next steps'
},
'strategic-recommendation': {
  label: 'Strategic Recommendation',
  icon: '💡',
  description: 'Strategic guidance and tactical recommendations',
  defaultTone: 'strategic',
  typicalLength: '1500-2500 words',
  guidelines: 'Situation analysis, strategic options, recommended approach, implementation plan'
}
```

## 3. File Upload & Auto-Extraction Flow

### When User Uploads Proposal File

```typescript
// Extraction pipeline
interface ProposalExtractionPipeline {
  // Step 1: Basic file analysis
  extractFileMetadata(file: File): {
    fileName: string
    fileType: string
    fileSize: number
    createdDate?: Date
  }

  // Step 2: Text extraction
  extractTextContent(file: File): Promise<string>

  // Step 3: Intelligent parsing with Claude
  parseProposalContent(text: string): Promise<{
    detectedClient?: string
    detectedIndustry?: string
    detectedSector?: string
    detectedServices: string[]
    proposalSections: {
      executiveSummary?: string
      technicalApproach?: string
      teamCredentials?: string
      caseStudies?: string
      pricing?: string
      timeline?: string
    }
    keyDifferentiators: string[]
    confidenceScores: {
      client: number
      industry: number
      services: number
    }
  }>

  // Step 4: Prompt user for validation/missing info
  promptUserForMetadata(extractedData: any): Promise<ProposalMetadata>
}
```

### User Prompt Flow

```typescript
interface ProposalMetadataPrompt {
  // Show extracted data with confidence indicators
  preFilledFields: {
    field: string
    value: any
    confidence: number // 0-1
    editable: boolean
  }[]

  // Required fields user must provide
  requiredFields: {
    field: 'outcome' | 'outcomeDate' | 'industry'
    prompt: string
    type: 'select' | 'text' | 'date' | 'multiselect'
    options?: string[]
  }[]

  // Optional but valuable fields
  optionalFields: {
    field: string
    prompt: string
    helpText: string
  }[]
}

// Example prompt flow
const promptFlow = {
  step1: {
    title: "Proposal Upload - Basic Information",
    fields: [
      {
        field: "clientName",
        label: "Client Name",
        prefilled: "Wells Fargo", // Auto-detected
        confidence: 0.95,
        editable: true
      },
      {
        field: "industry",
        label: "Industry",
        prefilled: "Financial Services", // Auto-detected
        confidence: 0.90,
        type: "select",
        options: ["Financial Services", "Healthcare", "Technology", "Energy", ...]
      },
      {
        field: "proposalType",
        label: "Proposal Type",
        type: "select",
        required: true,
        options: ["New Business", "Renewal", "RFP Response", ...]
      }
    ]
  },
  step2: {
    title: "Outcome & Learnings",
    description: "Help us learn from this proposal by sharing the outcome",
    fields: [
      {
        field: "outcome",
        label: "What was the outcome?",
        type: "select",
        required: true,
        options: [
          { value: "won", label: "Won 🎉", description: "We secured the business" },
          { value: "lost", label: "Lost", description: "They chose a competitor" },
          { value: "pending", label: "Pending", description: "Still waiting for decision" },
          { value: "no_decision", label: "No Decision", description: "They didn't move forward" },
          { value: "unknown", label: "Unknown", description: "Outcome not tracked" }
        ]
      },
      {
        field: "outcomeNotes",
        label: "Why did we win/lose? (Optional but valuable)",
        type: "textarea",
        helpText: "This helps NIV learn what works and recommend better approaches",
        conditionalOn: { outcome: ["won", "lost"] }
      },
      {
        field: "competitiveInfo",
        label: "Who were we competing against? (Optional)",
        type: "tags",
        helpText: "Name the competitors you were up against"
      }
    ]
  },
  step3: {
    title: "Services & Differentiation",
    fields: [
      {
        field: "servicesOffered",
        label: "Services Proposed",
        prefilled: ["Threat Intelligence", "Executive Protection"], // Auto-detected
        type: "multiselect",
        options: [] // From org's service catalog
      },
      {
        field: "keyDifferentiators",
        label: "What made this proposal unique?",
        type: "tags",
        helpText: "Unique value props, methodologies, or capabilities highlighted"
      }
    ]
  }
}
```

## 4. Intelligent Proposal Creation Flow

### Smart Proposal Discovery

```typescript
interface ProposalDiscoveryService {
  // When user starts creating a proposal
  async suggestRelevantProposals(
    criteria: ProposalSearchCriteria
  ): Promise<ProposalSuggestion[]>

  // Ranking algorithm
  rankProposals(
    proposals: Proposal[],
    criteria: ProposalSearchCriteria
  ): ProposalSuggestion[]
}

interface ProposalSuggestion {
  proposalId: string
  title: string
  clientName: string
  industry: string
  outcome: 'won' | 'lost' | 'pending'
  matchScore: number // 0-100
  matchReasons: string[] // ["Same industry", "Similar services", "Recent (2024)", "Won"]
  relevantSections: string[] // Which sections are most useful
  winRate: number // Success rate for similar proposals
}

// Ranking factors
const RANKING_WEIGHTS = {
  industryMatch: 0.30,      // Exact industry match
  sectorMatch: 0.15,        // More specific sector match
  servicesOverlap: 0.20,    // Services offered overlap
  outcomeSuccess: 0.20,     // Won > Pending > Lost
  recency: 0.10,           // More recent = better
  dealValueSimilarity: 0.05 // Similar deal size
}
```

### NIV Intelligent Proposal Creation

```typescript
// Supabase Edge Function: niv-proposal-intelligent
interface ProposalCreationRequest {
  // User's new proposal requirements
  clientName?: string
  industry: string
  sector?: string
  servicesOffered: string[]
  proposalType: string

  // User preferences
  useReferences: boolean // Auto-query Memory Vault?
  specificReferences?: string[] // User-specified proposal IDs
  sectionReferences?: {
    [section: string]: string[] // e.g., { "technicalApproach": ["proposal-123", "proposal-456"] }
  }

  // Additional context
  clientRequirements?: string
  competitiveContext?: string
  budgetConstraints?: string
  timeline?: string
}

interface ProposalCreationFlow {
  // Step 1: Query Memory Vault for relevant proposals
  async findRelevantProposals(): Promise<ProposalSuggestion[]>

  // Step 2: Present suggestions to user
  async getUserReferenceChoices(): Promise<{
    selectedProposals: string[]
    sectionMapping?: { [section: string]: string[] }
  }>

  // Step 3: Retrieve selected proposal content
  async retrieveProposalSections(
    proposalIds: string[],
    sections: string[]
  ): Promise<Map<string, any>>

  // Step 4: Generate new proposal with context
  async generateProposal(
    request: ProposalCreationRequest,
    referenceContent: Map<string, any>
  ): Promise<{
    proposal: string
    sections: { [key: string]: string }
    metadata: ProposalMetadata
  }>
}
```

### Example User Experience

```
User: "I need to create a proposal for Chase Bank for cybersecurity services"

NIV: "I found 3 relevant proposals from your Memory Vault:

📋 Wells Fargo Threat Intelligence (2024) ✅ Won
   Match: Financial Services, Cybersecurity, Enterprise client
   Sections available: Executive Summary, Technical Approach, Team Credentials, Case Studies

📋 Bank of America Security Assessment (2023) ❌ Lost
   Match: Financial Services, Cybersecurity
   Note: Lost to Mandiant - see outcome notes for lessons learned

📋 JPMorgan Incident Response (2024) ⏳ Pending
   Match: Financial Services, Security Services

Would you like to:
1. Use Wells Fargo proposal as primary reference (recommended - won, recent, similar scope)
2. Reference specific sections from multiple proposals
3. See why the BofA proposal lost (lessons learned)
4. Start fresh without references

You can also tell me things like:
- 'Use Wells Fargo for the technical approach and BofA for the pricing section'
- 'Show me what worked in the Wells Fargo proposal'
- 'What's our win rate for financial services cybersecurity proposals?'
"

User: "Use Wells Fargo for technical approach and team sections, but make it specific to Chase's focus on fraud prevention"

NIV: "Perfect. I'm pulling:
- Technical Approach from Wells Fargo proposal (won 2024)
- Team Credentials from Wells Fargo proposal
- Adapting focus to fraud prevention vs threat intelligence

I'll also include relevant case studies from our Memory Vault showing fraud prevention success.

Let me create this proposal for you..."

[NIV generates proposal with intelligent references]

NIV: "I've created your Chase proposal. Here's what I included:
✅ Executive Summary - tailored to Chase's fraud prevention focus
✅ Technical Approach - adapted from Wells Fargo with fraud prevention methodology
✅ Team Credentials - using our proven financial services team
✅ Case Studies - 2 fraud prevention success stories
✅ Pricing - based on similar enterprise banking engagements

Would you like me to:
- Adjust any sections?
- Add more detail anywhere?
- Include additional differentiators?
- Generate executive presentation slides?"
```

## 5. Analytics & Learning

### Win Rate Dashboard

```typescript
interface ProposalAnalytics {
  overallStats: {
    totalProposals: number
    winRate: number
    avgDealValue: string
    avgDecisionTime: number // days
  }

  byIndustry: {
    industry: string
    proposals: number
    winRate: number
    avgDealSize: string
  }[]

  byProposalType: {
    type: string
    winRate: number
    proposals: number
  }[]

  trends: {
    winRateTrend: 'improving' | 'declining' | 'stable'
    recentWins: Proposal[]
    recentLosses: Proposal[]
  }

  insights: string[] // AI-generated insights
  // e.g., "Your win rate for financial services is 75%, significantly higher than your 45% overall rate"
  // e.g., "Proposals with case studies have a 20% higher win rate"
  // e.g., "You haven't won an RFP response in 6 months - consider reviewing your RFP strategy"
}
```

### Pattern Recognition

```sql
-- Identify winning patterns
SELECT
    unnest(key_differentiators) as differentiator,
    COUNT(*) as times_used,
    COUNT(*) FILTER (WHERE outcome = 'won') as wins,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         COUNT(*))::NUMERIC * 100,
        1
    ) as win_rate_when_used
FROM proposals
WHERE key_differentiators IS NOT NULL
GROUP BY differentiator
HAVING COUNT(*) >= 3
ORDER BY win_rate_when_used DESC;
```

## 6. Implementation Phases

### Phase 1: Database & Core Types
- [ ] Create proposals table migration
- [ ] Add proposal types to content.ts
- [ ] Set up Memory Vault sync trigger

### Phase 2: File Upload & Extraction
- [ ] Build file upload component
- [ ] Implement text extraction (PDF, DOCX)
- [ ] Create Claude-powered content parser
- [ ] Build metadata prompt flow UI

### Phase 3: Intelligent Retrieval
- [ ] Build proposal search/ranking algorithm
- [ ] Create Memory Vault query service
- [ ] Implement proposal suggestion UI

### Phase 4: Proposal Creation
- [ ] Build ProposalCreationIntelligent edge function
- [ ] Implement reference-aware generation
- [ ] Add section-level reference control

### Phase 5: Analytics & Learning
- [ ] Build analytics dashboard
- [ ] Implement win rate tracking
- [ ] Add pattern recognition queries
- [ ] Create insights generation

## 7. Key Features Summary

✅ **Smart Upload**: Auto-extract metadata from uploaded proposals
✅ **Intelligent Discovery**: Automatically find relevant past proposals
✅ **Granular References**: Reference specific sections from multiple proposals
✅ **Outcome Tracking**: Track wins/losses to learn what works
✅ **Win Rate Analytics**: See performance by industry, type, services
✅ **Pattern Recognition**: Identify what differentiators win deals
✅ **Continuous Learning**: Every proposal improves future recommendations
✅ **Memory Vault Integration**: Seamless access to all proposal knowledge

## 8. Example Queries NIV Can Answer

- "What's our win rate for financial services proposals?"
- "Show me proposals we won in healthcare"
- "Why did we lose the BofA deal?"
- "What differentiators work best for enterprise clients?"
- "Find proposals with similar services to what this client needs"
- "What's the average time to decision for RFP responses?"
- "Show me our best-performing case studies for [industry]"
- "Which team members have the highest proposal win rates?"
