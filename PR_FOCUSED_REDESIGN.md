# PR-Focused Intelligence Redesign

## Core Problem
Current system is unfocused, repetitive, and not actionable for PR professionals. We need to redesign around PR workflows and real outcomes.

## New Structure: 4 Core PR Tabs

### 1. **NOW: Immediate Actions** (Executive Dashboard)
- **Active Media Conversations** (what journalists are talking about RIGHT NOW)
- **Competitor Moves** (announcements in last 48 hours we need to respond to)
- **Trending Topics** (what's gaining momentum we can newsjack)
- **Crisis Signals** (anything that could blow up)

### 2. **OPPORTUNITIES: PR Wins**
- **Media Pitching** 
  - Journalists writing about our space
  - Recent articles missing our perspective  
  - Trending stories we can contribute to
- **Thought Leadership**
  - Topics where no one owns the narrative yet
  - Data/insights we could uniquely provide
  - Speaking/podcast opportunities
- **Competitive Positioning**
  - Competitor weaknesses to exploit
  - Narrative gaps we can fill
  - Differentiation angles

### 3. **INTEL: Competitive & Market**
- **Competitor Activity**
  - Recent announcements/launches
  - Executive moves/hiring
  - Media coverage analysis
  - Messaging shifts
- **Market Dynamics** 
  - Industry trends affecting narrative
  - Regulatory changes requiring response
  - Technology shifts creating news angles
- **Stakeholder Sentiment**
  - What investors are saying
  - Customer feedback themes
  - Employee/glassdoor signals

### 4. **EXECUTE: Action Plans**
- **Active Campaigns** (what we're executing now)
- **Content Calendar** (what's coming up)
- **Media Relationships** (who to engage)
- **Message Testing** (what's resonating)

## Data Collection Strategy

### What We Should Be Gathering:
1. **Media Coverage** (via Firecrawl/RSS)
   - Competitor mentions
   - Industry articles  
   - Journalist bylines
   - Publication patterns

2. **Social Signals** (Twitter/LinkedIn/Reddit)
   - Trending conversations
   - Influencer discussions
   - Sentiment shifts
   - Viral content

3. **Company Signals**
   - Press releases
   - Executive changes
   - Product launches
   - Funding announcements

4. **Market Intelligence**
   - Industry reports
   - Regulatory filings
   - Patent applications
   - Conference presentations

### How We Should Process It:

```javascript
// Each piece of intelligence should answer:
{
  what: "What happened",
  who: "Who's involved", 
  when: "Timeline/urgency",
  why_care: "Why this matters for PR",
  action: "What to do about it",
  angle: "How to leverage it",
  contacts: "Who to reach out to"
}
```

## Synthesis Approach

### Phase 1: Categorize
- Sort into: Urgent/Important/Interesting/Noise
- Tag by PR relevance: Media Opp/Crisis Risk/Competitive/Thought Leadership

### Phase 2: Connect Dots
- Link related signals (competitor move + market trend = narrative opportunity)
- Identify patterns (multiple competitors doing X = industry shift)
- Spot gaps (everyone talking about X but missing Y angle)

### Phase 3: Generate Actions
- For each signal, generate 1-3 specific PR actions
- Include: WHO to contact, WHAT to say, WHEN to act
- Provide actual templates/talking points

## Implementation Plan

### New Data Flow:
1. **Gathering** → Get EVERYTHING, cast wide net
2. **Filtering** → Keep only PR-relevant signals  
3. **Enriching** → Add context, find journalists, identify angles
4. **Synthesizing** → Generate specific PR actions
5. **Presenting** → Clear, actionable, prioritized

### Key Principles:
- **Actionable over Comprehensive** - Better to have 5 things we can act on than 50 things to read
- **Specific over Generic** - Name names, give exact angles, provide templates
- **Timely over Perfect** - 80% accuracy delivered fast beats 100% delivered late
- **PR-first Lens** - Everything through the filter of "how does this help us win media coverage?"

## Success Metrics
- Can a PR person open this and immediately know what to do?
- Does each opportunity have a clear media angle?
- Are we catching competitor moves before they dominate narrative?
- Can we generate 3-5 quality pitches per week from this intel?