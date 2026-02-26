# SignalDesk V3: Aligned Onboarding Experience
## Proper 2-Step Flow with Intelligence Pipeline Integration

**Core Understanding:** SignalDesk is NOT a monitoring platform - it's an opportunity detection and campaign execution platform  
**Pipeline Reality:** Intelligence pipeline takes 2-3 minutes to complete  
**Alert Focus:** Opportunities, Crisis, Deadlines only (not general monitoring)

---

## THE PROPER 2-STEP ONBOARDING FLOW

### Step 1: Profile & Goals Setup (2-3 minutes)
**Gather everything needed before running intelligence**

```typescript
interface Step1_ProfileAndGoals {
  // A. User Information
  userProfile: {
    name: string
    email: string
    role: 'CEO' | 'CMO' | 'PR Director' | 'Marketing Manager' | 'Other'
    timezone: string
  }
  
  // B. Organization Information
  organization: {
    name: string
    website: string // For entity recognition
    industry: string
    size: 'startup' | 'smb' | 'mid-market' | 'enterprise'
    headquarters: string
  }
  
  // C. Strategic Goals (These directly influence opportunity detection)
  goals: {
    primary: {
      // Pick ONE primary goal that shapes opportunity scoring
      goal: 'thought_leadership' | 'media_coverage' | 'crisis_protection' | 
            'competitive_positioning' | 'funding_support' | 'talent_acquisition'
      
      // This becomes the lens for opportunity detection
      impact: "Opportunities will be scored based on {goal} potential"
    }
    
    secondary: string[] // Up to 3 additional goals
    
    // Specific objectives that affect opportunity detection
    objectives: {
      targetMediaTier: 'tier1' | 'tier2' | 'any' // WSJ/NYT vs trade pubs
      responseSpeed: 'immediate' | 'same_day' | 'next_day'
      riskTolerance: 'aggressive' | 'balanced' | 'conservative'
      campaignFrequency: 'daily' | 'weekly' | 'monthly'
    }
  }
  
  // D. Asset Upload & MemoryVault Population
  assets: {
    // These get stored in MemoryVault for pattern learning
    uploads: [
      {
        type: 'press_release' | 'bio' | 'case_study' | 'crisis_plan' | 'brand_guide',
        file: File,
        purpose: "Used for campaign generation and pattern learning"
      }
    ]
    
    // Key information for context
    keyMessages: string[] // Core messages to maintain
    differentiators: string[] // Unique value props
    competitors: string[] // Direct competitors to track
    avoidTopics: string[] // Topics to avoid
  }
}
```

### Step 2: Intelligence Pipeline Execution (2-3 minutes)
**Run the full 7-stage pipeline with goals integrated**

```typescript
interface Step2_IntelligencePipeline {
  // Show pipeline progress with accurate timing
  pipelineStages: {
    stage1: {
      name: "Organization Discovery",
      duration: "20 seconds",
      status: "Extracting entity information from {website}"
    },
    stage2: {
      name: "Competitive Intelligence",
      duration: "25 seconds",
      status: "Analyzing competitive landscape"
    },
    stage3: {
      name: "Stakeholder Analysis",
      duration: "20 seconds",
      status: "Mapping key stakeholders and influencers"
    },
    stage4: {
      name: "Media Landscape",
      duration: "25 seconds",
      status: "Identifying media opportunities"
    },
    stage5: {
      name: "Regulatory Environment",
      duration: "20 seconds",
      status: "Checking compliance requirements"
    },
    stage6: {
      name: "Market Trends",
      duration: "25 seconds",
      status: "Detecting trending topics and narratives"
    },
    stage7: {
      name: "Strategic Synthesis",
      duration: "25 seconds",
      status: "Consolidating intelligence and detecting opportunities"
    }
  }
  
  // Total time: ~2.5 minutes
  totalTime: "2-3 minutes"
  
  // While pipeline runs, show progress
  display: {
    type: "Progress visualization with stage details",
    message: "We're building your strategic intelligence profile...",
    showPreview: false // Don't show incomplete data
  }
}
```

---

## HOW GOALS INFLUENCE OPPORTUNITY DETECTION

### Goal-Driven Opportunity Scoring
```typescript
interface GoalIntegratedOpportunities {
  // Each goal type changes what we look for
  goalFilters: {
    thought_leadership: {
      prioritize: [
        "Speaking opportunities",
        "Expert commentary requests",
        "Industry trend discussions",
        "Panel invitations"
      ],
      scoreBoost: "+20 for expertise-based opportunities"
    },
    
    media_coverage: {
      prioritize: [
        "Reporter queries",
        "News hooks",
        "Trending topics alignment",
        "Exclusive opportunities"
      ],
      scoreBoost: "+20 for tier-1 media opportunities"
    },
    
    crisis_protection: {
      prioritize: [
        "Reputation threats",
        "Negative sentiment shifts",
        "Competitor attacks",
        "Regulatory risks"
      ],
      scoreBoost: "+30 for early warning signals"
    },
    
    competitive_positioning: {
      prioritize: [
        "Competitor weaknesses",
        "Market gaps",
        "Differentiation moments",
        "Head-to-head opportunities"
      ],
      scoreBoost: "+25 for competitive advantages"
    }
  }
  
  // Opportunities are scored based on goal alignment
  scoringFormula: {
    base: "Opportunity relevance score (0-100)",
    goalAlignment: "+20-30 if matches primary goal",
    urgency: "+10-20 based on time window",
    impact: "+10-20 based on potential reach",
    final: "Sum of all factors (max 100)"
  }
}
```

---

## MEMORYVAULT WITH ATTACHMENTS

### Enhanced MemoryVault Schema
```sql
-- Add attachment support to MemoryVault
CREATE TABLE memoryvault_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT, -- 'pdf', 'docx', 'pptx', 'jpg', etc
  file_size INTEGER,
  file_url TEXT, -- Supabase storage URL
  
  -- Metadata from analysis
  content_type TEXT, -- 'press_release', 'bio', 'case_study', etc
  extracted_text TEXT, -- For searchability
  key_points JSONB, -- AI-extracted key information
  
  -- Usage tracking
  used_in_campaigns UUID[], -- Campaign IDs
  success_patterns JSONB, -- What worked from this asset
  
  -- Embeddings for semantic search
  embedding vector(1536),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

-- Link to main memoryvault
ALTER TABLE memoryvault ADD COLUMN attachment_ids UUID[];
```

### Attachment Processing During Onboarding
```typescript
// supabase/functions/process-attachments/
export async function processOnboardingAttachments(files: File[]) {
  for (const file of files) {
    // 1. Upload to Supabase Storage
    const { data: upload } = await supabase.storage
      .from('attachments')
      .upload(`${orgId}/${file.name}`, file)
    
    // 2. Extract text (if document)
    const text = await extractText(file)
    
    // 3. AI Analysis
    const analysis = await analyzeContent({
      text,
      type: detectContentType(file.name),
      goals: userGoals // Use goals to focus analysis
    })
    
    // 4. Generate embeddings
    const embedding = await generateEmbedding(text)
    
    // 5. Store in MemoryVault
    await supabase.from('memoryvault_attachments').insert({
      organization_id: orgId,
      file_name: file.name,
      file_url: upload.path,
      extracted_text: text,
      key_points: analysis.keyPoints,
      content_type: analysis.type,
      embedding
    })
    
    // 6. Learn patterns for future campaigns
    await extractPatterns(analysis)
  }
}
```

---

## FOCUSED ALERT SYSTEM

### Only What Matters - No Noise
```typescript
interface FocusedAlerts {
  // ONLY these three types of alerts
  alertTypes: {
    // 1. OPPORTUNITIES
    opportunities: {
      trigger: "Score > 80 or time-sensitive",
      channels: ['in-app', 'email'],
      frequency: "Immediate if urgent, daily digest otherwise",
      examples: [
        "🎯 High-value opportunity: Reuters seeking comment (2 hrs)",
        "🎯 Competitor vulnerability detected (48 hr window)",
        "🎯 Speaking opportunity at TechCrunch (apply by Friday)"
      ]
    },
    
    // 2. CRISIS
    crisis: {
      trigger: "Threat detected or sentiment shift",
      channels: ['all'], // Email, SMS, Slack, in-app
      frequency: "IMMEDIATE - always",
      examples: [
        "🚨 Crisis detected: Negative story publishing in 1 hour",
        "🚨 Reputation threat: Competitor attack detected",
        "🚨 Regulatory risk: New compliance requirement"
      ]
    },
    
    // 3. DEADLINES
    deadlines: {
      trigger: "Approaching deadlines for opportunities/campaigns",
      channels: ['in-app', 'email'],
      frequency: "24hr warning, 2hr warning",
      examples: [
        "⏰ Deadline: Award submission due tomorrow",
        "⏰ Expiring: Media opportunity closes in 2 hours",
        "⏰ Campaign scheduled to launch at 9 AM"
      ]
    }
  }
  
  // NO alerts for:
  neverAlert: [
    "General market news",
    "Non-urgent competitor updates", 
    "Trend reports",
    "Analytics updates",
    "System notifications"
  ]
}
```

---

## THE ACTUAL ONBOARDING FLOW

### Complete User Journey
```typescript
interface ActualOnboardingFlow {
  // 1. Welcome (10 seconds)
  welcome: {
    message: "Let's set up your PR command center",
    subtext: "This takes about 5 minutes total"
  }
  
  // 2. Profile & Goals (2-3 minutes)
  profileSetup: {
    steps: [
      "Your information",
      "Company details", 
      "Strategic goals",
      "Upload materials (optional)"
    ],
    saveToMemoryVault: true,
    immediateValue: "Goals shape how we score opportunities"
  }
  
  // 3. Pipeline Execution (2-3 minutes)
  pipelineRun: {
    message: "Building your intelligence profile...",
    showProgress: true,
    accurate: "This takes 2-3 minutes",
    result: "Complete intelligence data with opportunities"
  }
  
  // 4. Platform Entry
  complete: {
    transition: "Seamless entry to main platform",
    firstView: "Opportunity Center with scored opportunities",
    readyToUse: {
      opportunities: "Detected and scored based on your goals",
      campaigns: "Templates ready from your uploads",
      intelligence: "Complete competitive and market analysis"
    }
  }
}
```

---

## UI COMPONENTS

### Step 1 UI: Clean Form with Purpose
```typescript
// components/onboarding/AlignedOnboarding.tsx
export function AlignedOnboarding() {
  const [step, setStep] = useState<'profile' | 'pipeline' | 'complete'>('profile')
  const [profileData, setProfileData] = useState<ProfileData>()
  const [pipelineProgress, setPipelineProgress] = useState(0)
  
  const handleProfileComplete = async (data: ProfileData) => {
    // Save profile and goals
    await saveToMemoryVault(data)
    
    // Start pipeline with goal integration
    setStep('pipeline')
    await runIntelligencePipeline({
      organization: data.organization,
      goals: data.goals, // Goals influence opportunity detection
      assets: data.assets
    })
  }
  
  return (
    <>
      {step === 'profile' && (
        <ProfileAndGoalsForm 
          onComplete={handleProfileComplete}
          includeAttachments={true}
        />
      )}
      
      {step === 'pipeline' && (
        <PipelineProgress 
          progress={pipelineProgress}
          stages={PIPELINE_STAGES}
          estimatedTime="2-3 minutes"
        />
      )}
      
      {step === 'complete' && (
        <Redirect to="/opportunities" />
      )}
    </>
  )
}
```

---

## SUCCESS METRICS

### Realistic Onboarding KPIs
- **Completion Rate:** > 90% (simple 2-step process)
- **Time to Complete:** 5-6 minutes total
- **Profile Completeness:** 80% fill all fields
- **Asset Upload Rate:** 40% upload at least one asset
- **First Opportunity Action:** 50% act within first hour

---

## KEY DIFFERENCES FROM V1

1. **No fake real-time** - Pipeline takes 2-3 minutes, we show accurate progress
2. **Goals drive opportunities** - User goals directly affect scoring
3. **MemoryVault from start** - Attachments stored for pattern learning
4. **Focused alerts** - Only opportunities, crisis, deadlines
5. **Simple 2-step flow** - Profile/Goals → Pipeline → Platform

This is honest, accurate, and aligned with what SignalDesk actually does - finds opportunities and enables rapid campaign execution, not continuous monitoring.