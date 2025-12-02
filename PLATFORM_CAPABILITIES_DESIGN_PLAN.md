# Platform Capabilities Page - Comprehensive Design Plan

## Overview

This document outlines a detailed, visually rich design for each section of the Platform Capabilities page. Each section should showcase the **actual platform UI patterns** and convey the power of the feature, not generic placeholders.

---

## 1. INTELLIGENCE HUB

### What It Actually Is
The Intelligence module generates Executive Intelligence Briefs with:
- Executive Summary (serif font, rich prose)
- Key Developments (cards with category badges, recency tags)
- Strategic Implications
- Competitive Analysis (dominant players, success patterns, gaps)
- Competitive Moves (immediate threats, opportunities, narrative gaps)
- Risk Monitoring (crisis signals, reputation threats)
- PR Action Items (immediate 24-48h, this week, strategic)
- Watching Closely items

### Visual Design (Mockup)
**Layout:** Two-panel mockup showing an Intelligence Brief

**Left side - Brief Header:**
```
┌─────────────────────────────────────────────────────────┐
│  EXECUTIVE INTELLIGENCE BRIEF                           │
│  December 2, 2024  •  47 signals analyzed               │
├─────────────────────────────────────────────────────────┤
│  ◉ EXECUTIVE SUMMARY                                    │
│  ─────────────────────                                  │
│  "Market conditions have shifted significantly this     │
│  quarter with three major competitors announcing AI     │
│  partnerships. Your positioning as an innovation        │
│  leader creates a 72-hour window to establish thought   │
│  leadership before the narrative solidifies..."         │
│                                                         │
│  ◉ KEY DEVELOPMENTS                                     │
│  ─────────────────────                                  │
│  ┌─────────────────────────────────────────┐           │
│  │ [COMPETITIVE]  [TODAY]                   │           │
│  │ TechRival announces AI partnership       │           │
│  │ Impact: Threatens market position        │           │
│  └─────────────────────────────────────────┘           │
│  ┌─────────────────────────────────────────┐           │
│  │ [INDUSTRY]  [2 DAYS AGO]                 │           │
│  │ Regulatory framework published           │           │
│  │ Impact: Creates compliance opportunity   │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

**Right side - Priority Signals panel:**
```
┌─────────────────────────────────┐
│  PRIORITY SIGNALS               │
│  ─────────────────              │
│                                 │
│  🔴 IMMEDIATE THREATS           │
│  • Competitor narrative gaining │
│    traction in Tier-1 media     │
│  • Key analyst shifting view    │
│                                 │
│  🟠 WATCHING CLOSELY            │
│  • Senate hearing on Thursday   │
│  • Earnings call next week      │
│                                 │
│  🟢 OPPORTUNITIES               │
│  • Industry award nominations   │
│  • Speaking slot available      │
└─────────────────────────────────┘
```

**Key Visual Elements:**
- Charcoal background with grey-900 cards
- Burnt orange accents for important items
- Serif font for executive summary prose
- Category badges with muted background colors
- Proper section headers with icons

---

## 2. OPPORTUNITY ENGINE

### What It Actually Is
Opportunities are scored strategic moments with:
- Score (prominent, color-coded: 85+ green, 70-84 yellow, below orange/red)
- Title and description
- Urgency badge (HIGH/MEDIUM/LOW with color coding)
- Strategic Context:
  - Trigger Events (bulleted list)
  - WHY NOW explanation
  - Competitive Advantage
  - Expected Impact
  - Risk if Missed
  - Time Window
- Media Targeting Strategy (journalist types, outlets, beat keywords)
- Execution Plan with Stakeholder Campaigns
- Content to be generated list (by stakeholder, with content type badges)

### Visual Design (Mockup)
**Layout:** Single expanded opportunity card showing full context

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────┐  AI Partnership Response Strategy        [HIGH] EXECUTED  │
│  │  92  │  ────────────────────────────────────                    │
│  │      │  Position as the established leader in enterprise AI     │
│  └──────┘  before competitor narrative solidifies                  │
│                                                                     │
│  leadership • 12 content items                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STRATEGIC CONTEXT                                                  │
│  ──────────────────                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  TRIGGER EVENTS                                             │    │
│  │  → TechRival announces Azure AI integration                 │    │
│  │  → Industry report shows 40% AI adoption increase           │    │
│  │  → Key analyst publishes competitive comparison             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  WHY NOW                                                    │    │
│  │  72-hour window before competitor narrative becomes the     │    │
│  │  default industry framing. Early movers will shape the      │    │
│  │  conversation and capture media attention.                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  CONTENT TO BE GENERATED                                            │
│  ──────────────────────────                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📰 Press Release     → Industry Analysts    [immediate]    │   │
│  │  💬 Social Thread     → Tech Community       [immediate]    │   │
│  │  📧 Media Pitch       → Tier-1 Journalists   [this_week]    │   │
│  │  📑 Thought Leadership → Enterprise Buyers   [this_week]    │   │
│  │  🎯 Talking Points    → Executive Team       [immediate]    │   │
│  │  📊 Presentation      → Board/Investors      [this_month]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ▶ Execute Campaign                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Large score number in colored box (gradient background)
- Orange left border for high-priority items
- Urgency badges with appropriate colors
- Nested cards for strategic context sections
- Content list showing type icons, stakeholder targets, and timing badges
- Prominent Execute button with burnt orange background

---

## 3. STUDIO

### What It Actually Is
Studio has 35+ content types organized by category:
- **Written:** Press Release, Blog Post, Thought Leadership, Case Study, White Paper, eBook, Q&A Document
- **Social:** Social Media Post, LinkedIn Article, Twitter Thread, Instagram, Facebook
- **Email:** Email Campaign, Newsletter, Drip Sequence, Cold Outreach
- **Executive:** Executive Statement, Board Presentation, Investor Update, Crisis Response
- **Media:** Media Pitch, Media List, Podcast Pitch, TV Interview Prep
- **Strategy:** Messaging Framework, Brand Narrative, Value Proposition
- **Visual:** Infographic, Presentation, Video

### Visual Design (Mockup)
**Layout:** Split view showing content types sidebar + actual content examples

**Left Panel - Content Type Categories:**
```
┌──────────────────────────────┐
│  CONTENT TYPES               │
│  ────────────────            │
│                              │
│  ▼ WRITTEN                   │
│    📄 Press Release          │
│    📖 Blog Post              │
│    📈 Thought Leadership ●   │
│    📋 Case Study             │
│                              │
│  ▼ SOCIAL                    │
│    # Social Media Post       │
│    💼 LinkedIn Article       │
│    🧵 Twitter Thread         │
│                              │
│  ► EXECUTIVE                 │
│  ► MEDIA                     │
│  ► VISUAL                    │
└──────────────────────────────┘
```

**Right Panel - ACTUAL Content Preview Cards (3 examples):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PRESS RELEASE                                                │  │
│  │  ────────────────                                             │  │
│  │                                                               │  │
│  │  FOR IMMEDIATE RELEASE                                        │  │
│  │                                                               │  │
│  │  Acme Corp Announces Industry-First AI Integration           │  │
│  │  Platform, Transforming Enterprise Workflows                  │  │
│  │                                                               │  │
│  │  SAN FRANCISCO – December 2, 2024 – Acme Corp, the           │  │
│  │  leading provider of enterprise automation solutions,         │  │
│  │  today announced the launch of AIFlow, a groundbreaking      │  │
│  │  platform that seamlessly integrates artificial...           │  │
│  │                                                               │  │
│  │  "This represents a fundamental shift in how enterprises     │  │
│  │  approach automation," said Jane Smith, CEO of Acme Corp.    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐             │
│  │  LINKEDIN POST        │  │  EXECUTIVE STATEMENT  │             │
│  │  ────────────────     │  │  ────────────────     │             │
│  │                       │  │                       │             │
│  │  🚀 Excited to share  │  │  "Our commitment to   │             │
│  │  that we've just      │  │  innovation has never │             │
│  │  launched AIFlow -    │  │  been stronger. Today │             │
│  │  transforming how     │  │  marks a pivotal      │             │
│  │  enterprises work.    │  │  moment in our        │             │
│  │                       │  │  company's journey..."│             │
│  │  After 18 months of   │  │                       │             │
│  │  development with     │  │  — Jane Smith, CEO    │             │
│  │  Fortune 500 beta...  │  │                       │             │
│  └───────────────────────┘  └───────────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- White sidebar with category accordions (light theme)
- Dark workspace showing actual content text
- Multiple content type examples with realistic placeholder text
- Shows the actual document structure (FOR IMMEDIATE RELEASE header, quotes, etc.)
- Different formatting for different content types (press release formal, LinkedIn casual)

---

## 4. CAMPAIGN BUILDER (VECTOR)

### What It Actually Is
VECTOR = Multi-stakeholder psychological influence campaigns with:
- **4 Phases:** AWARENESS → CONSIDERATION → CONVERSION → ADVOCACY
- **4 Pillars per stakeholder:**
  - Psychographic Profile (values, fears, aspirations, cognitive biases)
  - Information Ecosystem (sources, trusted voices, consumption patterns)
  - Current State (awareness level, perception, beliefs, objections)
  - Decision Journey (stage, movement triggers, validation needs)
- **Sequential orchestration** across stakeholder groups
- **Automatic pattern selection** (CASCADE, MIRROR, CHORUS, TROJAN, NETWORK)

### Visual Design (Mockup)
**Layout:** 4×4 Matrix showing stakeholders × phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VECTOR CAMPAIGN: AI Leadership Positioning                                  │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  CAMPAIGN PATTERN: CASCADE                                                   │
│  "Influencer groups shift first, creating validation for mass adoption"     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │           │  AWARENESS   │ CONSIDERATION│  CONVERSION  │  ADVOCACY   │   │
│  │           │   Week 1-2   │   Week 3-4   │   Week 5-6   │   Week 7+   │   │
│  ├───────────┼──────────────┼──────────────┼──────────────┼─────────────┤   │
│  │           │              │              │              │             │   │
│  │ INDUSTRY  │  ● Thought   │  ● Deep-dive │  ● Case      │ ● Speaking  │   │
│  │ ANALYSTS  │    leadership│    briefings │    studies   │   circuit   │   │
│  │           │  ● Embargo   │  ● 1:1 calls │  ● Demo      │ ● Quotes    │   │
│  │           │    briefings │              │    access    │             │   │
│  │           │              │              │              │             │   │
│  ├───────────┼──────────────┼──────────────┼──────────────┼─────────────┤   │
│  │           │              │              │              │             │   │
│  │ ENTERPRISE│  ● PR        │  ● Webinar   │  ● ROI       │ ● Customer  │   │
│  │ BUYERS    │    coverage  │    series    │    calculator│   stories   │   │
│  │           │  ● LinkedIn  │  ● White     │  ● Free      │ ● Reference │   │
│  │           │    campaign  │    papers    │    trial     │   program   │   │
│  │           │              │              │              │             │   │
│  ├───────────┼──────────────┼──────────────┼──────────────┼─────────────┤   │
│  │           │              │              │              │             │   │
│  │ TECH      │  ● Social    │  ● Technical │  ● GitHub    │ ● Community │   │
│  │ COMMUNITY │    threads   │    blog posts│    access    │   champions │   │
│  │           │  ● Reddit    │  ● API docs  │  ● Beta      │ ● Open      │   │
│  │           │    AMA       │              │    program   │   source    │   │
│  │           │              │              │              │             │   │
│  └───────────┴──────────────┴──────────────┴──────────────┴─────────────┘   │
│                                                                              │
│  PSYCHOLOGICAL LEVERAGE                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Analysts: Authority bias, early-adopter identity                      │ │
│  │  Buyers: Loss aversion, social proof from analysts                     │ │
│  │  Community: Technical credibility, innovation identity                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  23 content pieces • 3 stakeholder groups • 8-week timeline                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Matrix grid showing stakeholders × phases
- Each cell shows specific tactics for that stakeholder/phase intersection
- Pattern name prominently displayed with explanation
- Psychological leverage section showing cognitive biases being targeted
- Timeline indicators per phase
- Summary metrics at bottom

---

## 5. GEO INTELLIGENCE

### What It Actually Is
GEO = Generative Engine Optimization for AI visibility:
- Schema.org structured data generation (Organization, Person, Article, FAQ, Product)
- AI platform visibility tracking (ChatGPT, Gemini, Perplexity, Claude)
- Competitive visibility analysis
- Recommendation engine for improvements

### Visual Design (Mockup)
**Layout:** Split view - Schema on left, AI visibility scores on right

**Left Panel - Schema Preview:**
```
┌─────────────────────────────────────────────────────────────────┐
│  GENERATED SCHEMA                                                │
│  ─────────────────                                               │
│                                                                  │
│  <script type="application/ld+json">                            │
│  {                                                               │
│    "@context": "https://schema.org",                            │
│    "@type": "Organization",                                      │
│    "name": "Acme Corp",                                         │
│    "description": "Enterprise AI automation leader",            │
│    "url": "https://acme.com",                                   │
│    "logo": "https://acme.com/logo.png",                        │
│    "founder": {                                                  │
│      "@type": "Person",                                          │
│      "name": "Jane Smith",                                       │
│      "jobTitle": "CEO"                                          │
│    },                                                            │
│    "knowsAbout": [                                               │
│      "Artificial Intelligence",                                  │
│      "Enterprise Automation",                                    │
│      "Machine Learning"                                          │
│    ],                                                            │
│    "award": "2024 Innovation Award"                             │
│  }                                                               │
│  </script>                                                       │
│                                                                  │
│  ✓ Schema validated                                              │
│  ✓ 12 entities defined                                           │
│  ✓ Rich snippets eligible                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Right Panel - AI Platform Visibility:**
```
┌─────────────────────────────────────────────────────────────────┐
│  AI PLATFORM VISIBILITY                                          │
│  ─────────────────────                                           │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │   [ChatGPT]     │  │    [Gemini]     │                       │
│  │   ●●●●●●●○○○    │  │   ●●●●●●○○○○    │                       │
│  │      72%        │  │      58%        │                       │
│  │   ▲ +12% MTD    │  │   ▲ +8% MTD     │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  [Perplexity]   │  │    [Claude]     │                       │
│  │   ●●●●●●●●○○    │  │   ●●●●●○○○○○    │                       │
│  │      84%        │  │      45%        │                       │
│  │   ▲ +23% MTD    │  │   ▼ -3% MTD     │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                  │
│  VISIBILITY TREND                                                │
│  ───────────────                                                 │
│  [Sparkline chart showing 30-day trend]                         │
│                                                                  │
│  TOP QUERIES WHERE YOU APPEAR:                                   │
│  • "best enterprise AI tools" - Position #3                      │
│  • "AI automation platforms" - Position #5                       │
│  • "machine learning for business" - Not ranking                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Actual JSON-LD schema code (styled with syntax highlighting)
- LLM platform logos/icons (recognizable brand representations)
- Percentage scores with progress bars
- Trend indicators (up/down arrows with percentages)
- Query rankings showing where the org appears in AI responses

---

## 6. CRISIS COMMAND

### What It Actually Is
Crisis management system with:
- Pre-generated crisis scenarios (severity-coded)
- Crisis Plan with sections: Overview, Scenarios, Crisis Team, Stakeholders, Communications
- Real-time AI assistant for crisis guidance
- Timeline/checklist for crisis response
- Pre-drafted holding statements and Q&A

### Visual Design (Mockup)
**Layout:** Crisis readiness dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRISIS COMMAND                                                              │
│  ─────────────────                                                          │
│                                                                              │
│  READINESS STATUS: ████████████░░░░ 78%                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  CRISIS SCENARIOS                                                     │   │
│  │  ─────────────────                                                   │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────┐ ┌────────────────────────────────┐│   │
│  │  │ 🔴 CRITICAL                    │ │ 🟠 HIGH                        ││   │
│  │  │                                │ │                                ││   │
│  │  │ Data Breach Response           │ │ Executive Misconduct           ││   │
│  │  │ ────────────────────           │ │ ────────────────────           ││   │
│  │  │ Unauthorized access to         │ │ Allegations of improper        ││   │
│  │  │ customer data detected.        │ │ conduct by senior leader.      ││   │
│  │  │                                │ │                                ││   │
│  │  │ Likelihood: HIGH               │ │ Likelihood: MEDIUM             ││   │
│  │  │ [View Playbook]                │ │ [View Playbook]                ││   │
│  │  └────────────────────────────────┘ └────────────────────────────────┘│   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────┐ ┌────────────────────────────────┐│   │
│  │  │ 🟠 HIGH                        │ │ 🟡 MODERATE                    ││   │
│  │  │                                │ │                                ││   │
│  │  │ Product Safety Recall          │ │ Social Media Backlash          ││   │
│  │  │ ────────────────────           │ │ ────────────────────           ││   │
│  │  │ Product defect requiring       │ │ Viral negative content         ││   │
│  │  │ public recall announcement.    │ │ threatening brand reputation.  ││   │
│  │  │                                │ │                                ││   │
│  │  │ Likelihood: LOW                │ │ Likelihood: HIGH               ││   │
│  │  │ [View Playbook]                │ │ [View Playbook]                ││   │
│  │  └────────────────────────────────┘ └────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  CRISIS TEAM READINESS                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Crisis Lead (CEO) ............... Assigned                        │   │
│  │  ✓ Comms Lead (VP Comms) ........... Assigned                        │   │
│  │  ✓ Legal Counsel ................... Assigned                        │   │
│  │  ○ Technical Lead .................. Not Assigned                    │   │
│  │  ○ HR Representative ............... Not Assigned                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Generate Crisis Plan]  [Run Simulation]  [View Full Plan]                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Readiness percentage bar at top
- Scenario cards with severity color coding (🔴 CRITICAL, 🟠 HIGH, 🟡 MODERATE)
- Brief scenario descriptions with likelihood indicators
- Crisis team checklist with assigned/unassigned status
- Action buttons for crisis plan operations

---

## 7. NIV ADVISOR

### What It Actually Is
NIV = Neural Intelligence Vehicle - The conversational AI interface that:
- Routes to specialized functions (Intelligence, Campaigns, Content, Crisis)
- Maintains organizational context
- Can generate any content type
- Answers strategic questions
- Remembers past interactions via Memory Vault

### Visual Design (Mockup)
**Layout:** Chat interface with NIV branding

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌────┐                                                   │  │
│  │  │NIV │  NIV ADVISOR                                      │  │
│  │  │    │  Neural Intelligence Vehicle                      │  │
│  │  └────┘  ─────────────────────                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  USER                                                │ │  │
│  │  │  ────                                                │ │  │
│  │  │  "What opportunities should I prioritize this week?" │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  NIV                                          ●●●    │ │  │
│  │  │  ────                                                │ │  │
│  │  │  Based on my analysis of 47 signals from the past   │ │  │
│  │  │  48 hours, I recommend prioritizing:                │ │  │
│  │  │                                                      │ │  │
│  │  │  1. **AI Partnership Response** (Score: 92)          │ │  │
│  │  │     → 72-hour window before narrative solidifies     │ │  │
│  │  │     → Execute now for maximum impact                 │ │  │
│  │  │                                                      │ │  │
│  │  │  2. **Earnings Narrative Setup** (Score: 78)         │ │  │
│  │  │     → Q4 results release in 2 weeks                  │ │  │
│  │  │     → Begin analyst briefings this week              │ │  │
│  │  │                                                      │ │  │
│  │  │  Should I generate a campaign for the AI response?   │ │  │
│  │  │                                                      │ │  │
│  │  │  [Generate Campaign]  [Show Details]  [Other]        │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💬 Ask NIV anything about your organization...          │  │
│  │                                                    [Send] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- NIV logo/badge prominently displayed (the angular badge from the user's screenshot)
- Clear user/assistant message distinction
- Structured response with numbered recommendations
- Inline action buttons for quick actions
- Score badges within the response
- Conversational but substantive tone

---

## 8. MEMORY VAULT

### What It Actually Is
Organizational knowledge repository with:
- Semantic search (powered by Voyage AI embeddings)
- Folder organization
- Content types: campaigns, blueprints, generated content, intelligence briefs, crisis plans
- Fingerprinting for deduplication
- Salience scoring (frequently accessed items rank higher)

### Visual Design (Mockup)
**Layout:** Search interface + folder structure + content preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MEMORY VAULT                                                                │
│  ─────────────                                                              │
│  Everything NIV learns about your organization                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search your organizational knowledge...                           │   │
│  │                                                                       │   │
│  │  [Semantic search powered by AI]                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌────────────────────┐  ┌──────────────────────────────────────────────┐   │
│  │  FOLDERS           │  │  RECENT & HIGH-SALIENCE                      │   │
│  │  ─────────         │  │  ──────────────────────                      │   │
│  │                    │  │                                              │   │
│  │  📁 Campaigns      │  │  ┌────────────────────────────────────────┐ │   │
│  │     └ Q4 Launch    │  │  │ 📄 AI Partnership Response Blueprint   │ │   │
│  │     └ AI Response  │  │  │    campaign • 2 hours ago • Score: 92  │ │   │
│  │                    │  │  └────────────────────────────────────────┘ │   │
│  │  📁 Intelligence   │  │                                              │   │
│  │     └ Daily Briefs │  │  ┌────────────────────────────────────────┐ │   │
│  │     └ Competitors  │  │  │ 📊 Executive Intelligence Brief        │ │   │
│  │                    │  │  │    intelligence • today • 47 signals   │ │   │
│  │  📁 Content        │  │  └────────────────────────────────────────┘ │   │
│  │     └ Press        │  │                                              │   │
│  │     └ Social       │  │  ┌────────────────────────────────────────┐ │   │
│  │     └ Exec Comms   │  │  │ 📝 Q4 Launch Press Release             │ │   │
│  │                    │  │  │    press-release • yesterday           │ │   │
│  │  📁 Crisis Plans   │  │  └────────────────────────────────────────┘ │   │
│  │                    │  │                                              │   │
│  │  📁 Org Profile    │  │  ┌────────────────────────────────────────┐ │   │
│  │                    │  │  │ 🛡️ Crisis Management Plan              │ │   │
│  └────────────────────┘  │  │    crisis-plan • last week              │ │   │
│                          │  └────────────────────────────────────────┘ │   │
│                          │                                              │   │
│                          │  234 items • 12 folders • 1.2GB             │   │
│                          └──────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**
- Prominent search bar with semantic search callout
- Folder tree structure on left
- Content cards with type badges, timestamps, and metadata
- Recent/high-salience items prominently displayed
- Storage statistics at bottom

---

## Design System Notes

### Colors
- **Burnt Orange:** #c75d3a (primary accent)
- **Charcoal:** #1a1a1a (backgrounds)
- **Grey-900:** #212121 (cards)
- **Grey-800:** #2e2e2e (borders, secondary bg)

### Typography
- **Display:** Space Grotesk (headers, labels)
- **Serif:** Playfair Display (executive content, headlines)
- **Body:** Inter (general text)

### Component Patterns
- Section headers: ALL CAPS, letter-spacing, small font, burnt orange icon
- Cards: grey-900 background, grey-800 border, rounded-xl
- Badges: Muted background with matching text color
- Buttons: Burnt orange for primary actions

### Interaction Hints
- Hover states should show border color change to burnt-orange
- Cards should have subtle transform on hover
- Active/selected states use burnt-orange muted background

---

## Implementation Priority

1. **Intelligence Hub** - Executive brief mockup is core to platform value
2. **Opportunity Engine** - Shows the "one-click execute" value proposition
3. **VECTOR Campaign Builder** - Differentiating feature, needs the matrix visual
4. **NIV Advisor** - Must include the NIV badge, shows AI assistant capability
5. **Studio** - Show actual content examples, not just type labels
6. **GEO Intelligence** - Schema code + AI platform scores
7. **Crisis Command** - Readiness dashboard with scenarios
8. **Memory Vault** - Search + folder structure
