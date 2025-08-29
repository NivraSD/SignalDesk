# SignalDesk V3: Simple Aligned Onboarding
## Leveraging the Intelligence Pipeline's Power

**Key Understanding:** The intelligence pipeline only needs company name and URL to extract EVERYTHING  
**Pipeline Capability:** It discovers industry, competitors, stakeholders, media landscape, trends - all automatically

---

## THE ACTUAL SIMPLE 2-STEP ONBOARDING

### Step 1: Minimal Setup (1 minute)
**Just the essentials - pipeline does the rest**

```typescript
interface Step1_MinimalSetup {
  // A. User Info (for account)
  user: {
    name: string
    email: string
    password: string
  }
  
  // B. Organization (ALL WE NEED!)
  organization: {
    name: string  // e.g., "Tesla"
    url: string   // e.g., "tesla.com"
    // THAT'S IT! Pipeline extracts everything else
  }
  
  // C. Goals (to shape opportunity scoring)
  goals: {
    primary: 'thought_leadership' | 'media_coverage' | 'crisis_protection' | 
             'competitive_positioning' | 'funding_support' | 'talent_acquisition'
    
    // Optional: for additional context
    secondary?: string[]
  }
  
  // D. Optional Assets (for MemoryVault)
  assets?: {
    // User CAN upload if they want, but not required
    files?: File[]
    // These enhance campaign generation but pipeline works without them
  }
}
```

### Step 2: Intelligence Pipeline Magic (2-3 minutes)
**Pipeline extracts EVERYTHING from just name and URL**

```typescript
interface Step2_PipelineExtraction {
  // What the pipeline discovers automatically:
  
  stage1_discovery: {
    input: "tesla.com",
    extracts: {
      fullName: "Tesla, Inc.",
      industry: "Electric Vehicles, Clean Energy",
      headquarters: "Austin, Texas",
      size: "140,000 employees",
      founded: "2003",
      publiclyTraded: true,
      ticker: "TSLA",
      socialProfiles: {
        twitter: "@tesla",
        linkedin: "tesla-motors",
        youtube: "tesla"
      }
    }
  }
  
  stage2_competitors: {
    finds: [
      "Rivian", "Lucid Motors", "BYD", "NIO", 
      "Traditional: Ford, GM, Volkswagen"
    ],
    analysis: "Competitive positioning and weaknesses"
  }
  
  stage3_stakeholders: {
    identifies: [
      "Customers", "Investors", "Regulators",
      "Environmental Groups", "Auto Industry Analysts"
    ]
  }
  
  stage4_media: {
    discovers: [
      "127 journalists covering Tesla",
      "Key publications: WSJ, Bloomberg, Reuters",
      "Recent coverage sentiment and themes"
    ]
  }
  
  stage5_regulatory: {
    tracks: [
      "NHTSA regulations",
      "EPA standards",
      "State EV incentives"
    ]
  }
  
  stage6_trends: {
    detects: [
      "EV adoption acceleration",
      "Autonomous driving debates",
      "Charging infrastructure"
    ]
  }
  
  stage7_synthesis: {
    generates: "Complete strategic intelligence profile",
    identifies: "PR opportunities based on all above data + user goals"
  }
}
```

---

## THE STREAMLINED UI

### Super Simple Onboarding Flow
```typescript
// components/onboarding/SimpleOnboarding.tsx
export function SimpleOnboarding() {
  const [step, setStep] = useState<'setup' | 'pipeline' | 'complete'>('setup')
  const [pipelineProgress, setPipelineProgress] = useState(0)
  
  const handleStart = async (data: MinimalSetupData) => {
    // Save user account
    await createUser(data.user)
    
    // Save goals to influence scoring
    await saveGoals(data.goals)
    
    // Process any uploaded assets
    if (data.assets) {
      await processAssetsToMemoryVault(data.assets)
    }
    
    // Start pipeline - IT ONLY NEEDS NAME AND URL!
    setStep('pipeline')
    const intelligence = await runIntelligencePipeline({
      organization: data.organization.name,
      domain: data.organization.url
      // Pipeline figures out EVERYTHING else
    })
    
    // Opportunities scored based on goals
    const opportunities = await detectOpportunities(intelligence, data.goals)
    
    setStep('complete')
  }
  
  return (
    <>
      {step === 'setup' && (
        <SimpleSetupForm>
          {/* User fields */}
          <input name="email" placeholder="Your email" required />
          <input name="password" type="password" required />
          
          {/* Organization - JUST TWO FIELDS! */}
          <input name="company" placeholder="Company name" required />
          <input name="website" placeholder="Company website" required />
          
          {/* Goals */}
          <select name="goal" required>
            <option>What's your primary PR goal?</option>
            <option value="thought_leadership">Thought Leadership</option>
            <option value="media_coverage">Media Coverage</option>
            <option value="crisis_protection">Crisis Protection</option>
            <option value="competitive_positioning">Competitive Edge</option>
          </select>
          
          {/* Optional uploads */}
          <div className="optional">
            <label>Have existing materials? (Optional)</label>
            <input type="file" multiple />
          </div>
          
          <button onClick={handleStart}>Start Intelligence Analysis</button>
        </SimpleSetupForm>
      )}
      
      {step === 'pipeline' && (
        <PipelineProgress>
          <h2>Discovering Intelligence for {organizationName}</h2>
          <p>Our AI is analyzing your complete business landscape...</p>
          
          {/* Show real progress through 7 stages */}
          <StageProgress 
            stages={[
              "Extracting company profile...",
              "Identifying competitors...",
              "Mapping stakeholders...",
              "Analyzing media landscape...",
              "Checking regulatory environment...",
              "Detecting market trends...",
              "Synthesizing opportunities..."
            ]}
            currentProgress={pipelineProgress}
          />
          
          <p className="time">This takes 2-3 minutes</p>
        </PipelineProgress>
      )}
      
      {step === 'complete' && (
        <EnterPlatform />
      )}
    </>
  )
}
```

---

## WHAT MAKES THIS BETTER

### 1. Respects Pipeline Intelligence
- We don't ask for industry, size, competitors, etc.
- Pipeline extracts ALL of that from just name + URL
- More accurate than user input anyway

### 2. Truly Simple
- 5 required fields total (name, email, password, company, url)
- 1 goal selection
- Optional file uploads
- That's it!

### 3. Honest Timing
- Setup: 1 minute
- Pipeline: 2-3 minutes (real time, real progress)
- Total: Under 5 minutes

### 4. Goal-Driven Opportunities
- User's goal selection shapes opportunity scoring
- But pipeline finds ALL opportunities regardless
- Goals just influence priority/scoring

---

## THE USER EXPERIENCE

1. **User enters:** "Tesla" and "tesla.com"
2. **Selects goal:** "Competitive Positioning"  
3. **Clicks:** "Start Intelligence Analysis"
4. **Watches:** Real pipeline progress (2-3 min)
5. **Enters platform with:**
   - Complete company profile (extracted)
   - All competitors identified
   - Media landscape mapped
   - Opportunities detected and scored by their goal
   - Ready to execute campaigns

---

## WHY THIS WORKS

- **Trust the pipeline** - It's incredibly good at extraction
- **Don't over-ask** - Users hate long forms
- **Be honest** - Show real progress, real timing
- **Deliver value** - They enter with actionable opportunities

The intelligence pipeline is the star here. We just need to give it a company name and URL, then get out of its way!