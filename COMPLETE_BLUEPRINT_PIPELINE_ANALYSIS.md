# Complete Blueprint Pipeline Analysis

**Date:** 2025-10-13
**Purpose:** Comprehensive documentation of ENTIRE blueprint generation system
**Status:** FORENSIC ANALYSIS - Understanding what exists before making changes

---

## TABLE OF CONTENTS

1. [THE COMPLETE PIPELINE FLOW](#the-complete-pipeline-flow)
2. [STAGE 1: RESEARCH GENERATION](#stage-1-research-generation)
3. [STAGE 2: POSITIONING GENERATION](#stage-2-positioning-generation)
4. [STAGE 3: BLUEPRINT GENERATION](#stage-3-blueprint-generation)
5. [THE COMPLETE BLUEPRINT STRUCTURE](#the-complete-blueprint-structure)
6. [DATA FLOW ANALYSIS](#data-flow-analysis)
7. [CURRENT PROBLEMS](#current-problems)
8. [WHAT NEEDS TO BE FIXED](#what-needs-to-be-fixed)

---

## THE COMPLETE PIPELINE FLOW

### User Journey

```
User enters campaign goal
  ↓
STAGE 1: Research Generation (60s)
  ↓ Produces: CampaignIntelligenceBrief
  ↓
STAGE 2: Positioning Generation (20s)
  ↓ Produces: 3 PositioningOptions
  ↓ User selects positioning
  ↓
STAGE 3: Blueprint Generation (??s - BROKEN)
  ↓ Should produce: Complete 6-part VECTOR Blueprint
  ↓
STAGE 4: Execution
```

---

## STAGE 1: RESEARCH GENERATION

### Edge Function: `niv-campaign-builder-research`

**Purpose:** Generate complete intelligence brief for campaign planning

**Input:**
```typescript
{
  sessionId: string
  campaignGoal: string  // e.g., "position sora 2 as leader in AI video"
  orgId: string
}
```

**Process:**
1. **Organization Discovery** (`mcp-discovery`)
   - Gets org profile, industry context

2. **Parallel Intelligence Gathering** (4 simultaneous calls):
   - **Stakeholder Intel** (`niv-fireplexity`): Find target audiences
   - **Narrative Intel** (`niv-fireplexity`): Industry trends, narratives
   - **Channel Intel** (`journalist-registry`): Find journalists covering space
   - **Historical Intel** (`knowledge-library-registry`): Successful campaign patterns

3. **Synthesis** (`niv-campaign-research-synthesis`)
   - Claude Sonnet 4 (8000 tokens max)
   - Takes ALL gathered data
   - Produces structured `CampaignIntelligenceBrief`

**Output Structure: `CampaignIntelligenceBrief`**
```json
{
  "stakeholders": [
    {
      "name": "Enterprise CTOs",
      "size": 50000,
      "psychology": {
        "values": ["Innovation", "Risk mitigation"],
        "fears": ["Being replaced by AI", "Budget waste"],
        "aspirations": ["Lead digital transformation"],
        "biases": ["Authority bias", "Bandwagon effect"]
      },
      "informationDiet": {
        "primarySources": ["TechCrunch", "LinkedIn"],
        "trustedVoices": ["Gartner analysts", "CTO peers"],
        "consumptionPatterns": "Morning LinkedIn scrolling",
        "shareDrivers": ["Data-driven insights", "Peer validation"]
      },
      "currentPerceptions": {
        "ofOrganization": "Innovative but unproven",
        "ofIndustry": "Hype-driven",
        "ofTopic": "Skeptical of AI video"
      },
      "decisionJourney": {
        "currentStage": "Awareness",
        "movementTriggers": ["ROI proof", "Peer adoption"],
        "validationNeeds": ["Case studies", "Third-party reviews"],
        "socialProofRequirements": ["Industry analyst endorsement"]
      },
      "influencePathways": {
        "directInfluencers": ["Gartner analysts", "Tech journalists"],
        "peerNetworks": ["CTO LinkedIn groups"],
        "authorityFigures": ["McKinsey consultants"]
      },
      "decisionTriggers": ["Q4 budget cycle", "Competitor moves"],
      "objectionPatterns": ["Too expensive", "Security concerns"]
    }
    // 2-4 more stakeholder groups...
  ],

  "narrativeLandscape": {
    "dominantNarratives": [
      {
        "narrative": "AI will replace creative jobs",
        "source": "Media consensus",
        "resonance": "High fear-driven"
      }
    ],
    "narrativeVacuums": [
      {
        "opportunity": "AI as augmentation tool",
        "rationale": "Counter-narrative to replacement fear",
        "potential": "High - unowned space"
      }
    ],
    "competitivePositioning": [
      {
        "competitor": "Runway",
        "positioning": "Professional filmmakers only",
        "strengths": ["High quality", "Industry credibility"],
        "vulnerabilities": ["Complex", "Expensive", "Slow"]
      }
    ],
    "culturalContext": "2025 AI anxiety peak"
  },

  "channelIntelligence": {
    "byStakeholder": [
      {
        "stakeholder": "Enterprise CTOs",
        "channels": [
          {
            "name": "LinkedIn",
            "type": "Social",
            "trustLevel": "high",
            "reach": "90%",
            "engagement": "medium"
          }
        ],
        "optimalTiming": "Tuesday 8-10am ET",
        "contentPreferences": ["Data-driven", "Peer testimonials"],
        "amplificationOpportunities": ["CTO communities", "Tech influencers"]
      }
    ],
    "journalists": [
      {
        "name": "Sarah Johnson",
        "outlet": "TechCrunch",
        "beat": "Enterprise AI",
        "tier": "tier1",
        "relevance": "Covers video AI regularly"
      }
      // 10-20 more journalists...
    ],
    "publications": [
      {
        "name": "TechCrunch",
        "type": "Tech news",
        "audience": "Tech professionals",
        "trustLevel": "High"
      }
    ]
  },

  "historicalInsights": {
    "successfulCampaigns": [
      {
        "campaign": "Slack's 'Email killer' positioning",
        "context": "2014 crowded collaboration market",
        "approach": "Owned narrative vacuum around async communication",
        "results": "Market leader in 2 years",
        "keyLessons": ["Own uncontested narrative space", "Target influencers first"]
      }
    ],
    "successFactors": [
      {
        "factor": "Multi-channel convergence",
        "why": "Message from 3+ sources = inevitability",
        "application": "Coordinate owned + influencer + media layers"
      }
    ],
    "patternRecommendations": [
      {
        "pattern": "CASCADE",
        "rationale": "Build authority top-down via influencers",
        "implementation": "Start with analysts, cascade to practitioners"
      }
    ],
    "riskFactors": [
      {
        "risk": "Overpromising capabilities",
        "context": "AI products often underwhelm",
        "mitigation": "Lead with realistic use cases + proof"
      }
    ]
  },

  "keyInsights": [
    {
      "insight": "CTOs fear replacement narrative but aspire to lead transformation",
      "category": "stakeholder",
      "significance": "critical",
      "actionImplication": "Position AI video as augmentation tool that makes teams more creative"
    }
  ],

  "synthesisQuality": {
    "completeness": 85,
    "confidence": 80,
    "dataGaps": ["Limited competitor pricing data"],
    "recommendedAdditionalResearch": ["Survey CTOs on video use cases"]
  }
}
```

**Saves to database:**
- `campaign_builder_sessions.research_findings = CampaignIntelligenceBrief`

---

## STAGE 2: POSITIONING GENERATION

### Edge Function: `niv-campaign-positioning`

**Purpose:** Generate 3 strategic positioning options based on research

**Input:**
```typescript
{
  researchData: CampaignIntelligenceBrief,  // From Stage 1
  campaignGoal: string,
  refinementRequest?: string
}
```

**Process:**
- Claude Sonnet 4 (4000 tokens max)
- Analyzes research findings
- Generates 3 distinct strategic approaches

**Output Structure:**
```json
{
  "options": [
    {
      "id": 1,
      "name": "The Augmentation Pioneer",
      "tagline": "AI video that amplifies creative teams, not replaces them",
      "description": "Position as tool that makes creative teams 10x more productive while preserving human creativity",
      "rationale": "Directly addresses CTOs' replacement fear while triggering transformation aspiration",
      "targetAudiences": ["Enterprise CTOs", "Creative Directors"],
      "keyMessages": [
        "Augmentation, not automation: Keep creative control",
        "10x team output without 10x budget",
        "Enterprise-grade security and control"
      ],
      "differentiators": [
        "Only enterprise-focused AI video platform",
        "Designed for team collaboration, not solo creators",
        "Workflow integration (Adobe, Final Cut)"
      ],
      "risks": [
        "May seem less innovative than competitors",
        "Requires proof of ROI claims"
      ],
      "opportunities": [
        "Own 'augmentation' narrative vacuum",
        "Counter dominant 'replacement' narrative",
        "Appeal to both tech buyers and creative users"
      ],
      "confidenceScore": 85
    },
    {
      "id": 2,
      "name": "The Speed-to-Market Champion",
      "tagline": "Ship video content 10x faster without sacrificing quality",
      // ... similar structure
    },
    {
      "id": 3,
      "name": "The Data-Driven Storyteller",
      "tagline": "Turn data into visual stories that drive decisions",
      // ... similar structure
    }
  ],
  "recommendation": "Option 1 (Augmentation Pioneer) recommended because it directly addresses the #1 stakeholder fear (replacement) while owning an uncontested narrative space. Research shows 'augmentation' vocabulary has 3x higher engagement than 'automation' in enterprise contexts."
}
```

**User selects one positioning (e.g., Option 1)**

**Saves to database:**
- `campaign_builder_sessions.positioning_options = all 3 options`
- `campaign_builder_sessions.selected_positioning = selected option`

---

## STAGE 3: BLUEPRINT GENERATION

### THE PROBLEM: This is where everything breaks

**Current Approach (BROKEN):**

#### Option A: Single Monolithic Function
- **Function:** `niv-campaign-vector-blueprint`
- **Token limit:** 10,000
- **Problem:** Tries to generate entire 6-part blueprint in ONE call
- **Result:** Either times out (504) OR gets truncated after Part 2
- **User sees:** "Every section after stakeholders is basically blank"

#### Option B: Granular Multi-Function (500 ERRORS)
- **Functions:**
  1. `niv-campaign-blueprint-base` → Parts 1-2
  2. `niv-campaign-orchestration-phases-1-2` → Part 3A (500 error)
  3. `niv-campaign-orchestration-phases-3-4` → Part 3B (500 error)
  4. `niv-campaign-pattern-generator` → Part 6
  5. `niv-campaign-execution-generator` → Part 5
  6. `niv-campaign-counter-narrative-generator` → Part 4

- **Problem:** Orchestration functions REQUIRE `blueprintBase` parameter
- **Frontend doesn't send it** → 500 errors
- **Result:** Blueprint missing Parts 3A, 3B (the critical orchestration strategy!)

---

## THE COMPLETE BLUEPRINT STRUCTURE

### What the final blueprint SHOULD contain:

```json
{
  "overview": {
    "campaignName": "Sora 2: The Augmentation Revolution",
    "pattern": "CASCADE",
    "patternRationale": "Build authority top-down from industry analysts to practitioners",
    "duration": "12 weeks",
    "complexity": "High",
    "objective": "Get 1000+ enterprises to trial Sora 2 for team workflows"
  },

  "part1_goalFramework": {
    "primaryObjective": "Drive 1000 enterprise trials of Sora 2 within 12 weeks",
    "behavioralGoals": [
      {
        "stakeholder": "Enterprise CTOs",
        "desiredBehavior": "Request Sora 2 demo for their creative team",
        "currentState": "Unaware or skeptical of AI video for enterprise",
        "successMetric": "500 demo requests from Fortune 2000 CTOs"
      },
      {
        "stakeholder": "Creative Directors",
        "desiredBehavior": "Advocate for Sora 2 adoption to their CTO",
        "currentState": "Fear AI will replace their team",
        "successMetric": "200 documented internal champion cases"
      }
    ],
    "kpis": [
      "1000 enterprise trials started",
      "500 CTO demo requests",
      "50 case studies generated",
      "10 tier-1 media placements"
    ],
    "successCriteria": "Sora 2 becomes default AI video consideration for enterprise creative teams",
    "riskAssessment": [
      {
        "risk": "Competitor launches free tier targeting same audience",
        "probability": "Medium",
        "impact": "Significant trial volume loss",
        "mitigation": "Emphasize enterprise features (security, integration, support) that free tier lacks"
      }
    ]
  },

  "part2_stakeholderMapping": {
    "groups": [
      {
        "name": "Enterprise CTOs",
        "size": "50,000",
        "psychologicalProfile": {
          "values": ["Innovation leadership", "Risk mitigation"],
          "fears": ["AI replacing teams", "Budget waste on hype"],
          "aspirations": ["Lead digital transformation", "10x team productivity"],
          "decisionDrivers": ["ROI data", "Peer adoption", "Analyst endorsement"]
        },
        "informationDiet": {
          "primarySources": ["TechCrunch", "LinkedIn", "Gartner reports"],
          "trustedVoices": ["Gartner analysts", "CTO peers", "McKinsey"],
          "consumptionHabits": "Morning LinkedIn scroll, weekly analyst briefings"
        },
        "decisionTriggers": ["Q4 budget cycles", "Competitor moves", "Board pressure"],
        "currentPerception": "AI video is for YouTubers, not enterprise",
        "targetPerception": "AI video is essential enterprise productivity tool",
        "barriers": ["Security concerns", "Integration complexity", "ROI uncertainty"]
      },
      {
        "name": "Creative Directors",
        "size": "100,000",
        // ... similar structure
      }
    ],
    "stakeholderRelationships": "CTOs control budget but rely on Creative Directors' technical validation. Creative Directors influence CTOs through demonstrated value.",
    "priorityOrder": ["Creative Directors (Champions)", "Enterprise CTOs (Buyers)", "Marketing VPs (Influencers)"]
  },

  "part3_orchestrationStrategy": {
    "phases": {
      "phase1_awareness": {
        "objective": "Move Enterprise CTOs from 'unaware' to 'intrigued by augmentation narrative'",
        "duration": "Weeks 1-3",
        "stakeholderFocus": ["Enterprise CTOs", "Creative Directors"],
        "messageTheme": "AI video as team augmentation tool (not replacement)",

        "psychologicalStrategy": {
          "primaryFear": "AI replacing creative teams",
          "fearMitigation": "Show AI enhancing human creativity, not automating it",
          "aspirationTrigger": "Lead digital transformation",
          "biasToLeverage": "Authority bias (analyst endorsement)"
        },

        "narrativeApproach": {
          "counterNarrative": "'AI replaces creators' dominant narrative",
          "vacuumToOwn": "'AI augmentation' unowned space",
          "positioningAlignment": "Augmentation Pioneer positioning",
          "competitiveDifferentiation": "Runway = complex/expensive, we = team-friendly/integrated"
        },

        "messagingLayers": {
          "ownedLayer": "CEO blog: 'Why we built Sora 2 for teams, not soloists'",
          "relationshipLayer": "Analysts share: 'Enterprise AI video maturity model'",
          "eventLayer": "Panel at Web Summit: 'AI in creative workflows'",
          "mediaLayer": "TechCrunch: 'How enterprises use AI video without replacing teams'"
        },

        "pillar1_ownedActions": {
          "stakeholderTarget": "Enterprise CTOs at awareness stage",
          "psychologicalObjective": "Address replacement fear by showing augmentation proof",
          "channelStrategy": {
            "primary": "LinkedIn (90% CTO reach, high trust, optimal: Tue 8-10am)",
            "rationale": "Primary source + high engagement time from research",
            "contentType": "Data-driven case studies + peer testimonials"
          },
          "contentThemes": [
            "10x creative output with same team size",
            "Security and control in AI workflows",
            "Integration with existing tools (Adobe, Final Cut)"
          ],
          "voiceStrategy": "CEO (authenticity) + customer CTOs (peer validation)",
          "timingWindows": "Tuesday/Thursday mornings per consumption patterns",
          "organizationalVoice": [
            {
              "who": "CEO",
              "why": "Authenticity with enterprise buyers, thought leadership credibility",
              "platforms": ["LinkedIn", "Company blog"],
              "contentNeeds": [
                {
                  "contentType": "blog-post",
                  "topic": "Why we built Sora 2 for teams, not soloists",
                  "coreMessage": "AI video should augment creative teams, not replace them",
                  "targetStakeholder": "Enterprise CTOs",
                  "timing": "Week 1, Tuesday 8am",
                  "signaldeskGenerates": "Full blog post draft with customer quotes and ROI data",
                  "userExecutes": "Publish to blog + share on LinkedIn + engage in comments",
                  "successMetric": "50+ CTO shares, 200+ saves"
                },
                {
                  "contentType": "linkedin-article",
                  "topic": "The augmentation vs automation choice in AI video",
                  "coreMessage": "Augmentation preserves creativity while scaling output",
                  "targetStakeholder": "Creative Directors",
                  "timing": "Week 2, Thursday 8am",
                  "signaldeskGenerates": "LinkedIn article with creative team case study",
                  "userExecutes": "Publish + tag relevant Creative Directors + reply to comments",
                  "successMetric": "30+ Creative Director engagements"
                }
              ]
            },
            {
              "who": "Head of Product",
              "why": "Technical credibility, workflow integration expertise",
              "platforms": ["Twitter", "LinkedIn"],
              "contentNeeds": [
                {
                  "contentType": "twitter-thread",
                  "topic": "How Sora 2 integrates with existing creative workflows",
                  "coreMessage": "Integration removes adoption friction",
                  "targetStakeholder": "Creative Directors",
                  "timing": "Week 2, Wednesday 2pm",
                  "signaldeskGenerates": "10-tweet thread with workflow diagrams",
                  "userExecutes": "Post thread + engage with replies",
                  "successMetric": "100+ retweets from creative professionals"
                }
              ]
            }
          ],
          "distributionStrategy": {
            "ownedChannels": ["Blog", "LinkedIn", "Twitter"],
            "engagementChannels": [
              {
                "platform": "Reddit r/CTO",
                "engagementType": "Answer workflow automation questions",
                "cadence": "3-5 comments/week",
                "tone": "Helpful peer (not promotional)",
                "signaldeskGenerates": "Comment templates based on common CTO questions"
              },
              {
                "platform": "HackerNews",
                "engagementType": "Participate in AI discussion threads",
                "cadence": "2-3/week",
                "tone": "Technical depth, transparent about limitations",
                "signaldeskGenerates": "Technical talking points"
              }
            ]
          }
        },

        "pillar2_relationshipOrchestration": {
          "tier1Influencers": [
            {
              "stakeholderSegment": "Industry Analysts (Gartner, Forrester)",
              "discoveryCriteria": [
                "Cover enterprise AI or creative tools",
                "Tier 1 analyst firms",
                "Active on LinkedIn"
              ],
              "exampleTargets": [
                {
                  "name": "Jane Smith",
                  "source": "journalist_registry",
                  "relevanceScore": 0.95,
                  "outlet": "Gartner",
                  "whyTarget": "Covers enterprise AI adoption, trusted by CTOs"
                },
                {
                  "name": "[MOCK] Forrester creative tech analyst",
                  "source": "mock_recommendation",
                  "whyMock": "Journalist registry didn't have Forrester contacts",
                  "userAction": "Search LinkedIn: 'Forrester analyst creative technology'"
                }
              ],
              "engagementStrategy": {
                "objective": "Get mentioned in Q1 2025 Enterprise AI reports",
                "approach": "Value-first: Provide exclusive data before asking coverage",
                "contentToCreateForThem": [
                  {
                    "contentType": "white-paper",
                    "topic": "Enterprise AI video adoption maturity model (5 stages)",
                    "why": "Analysts need frameworks for client guidance",
                    "signaldeskGenerates": "20-page white paper with enterprise data",
                    "userExecutes": "Send via LinkedIn with no-ask message",
                    "timing": "Week 1"
                  },
                  {
                    "contentType": "case-study",
                    "topic": "Fortune 500 company ROI case study",
                    "why": "Analysts cite case studies in reports",
                    "signaldeskGenerates": "Detailed ROI analysis with metrics",
                    "userExecutes": "Offer exclusive early access",
                    "timing": "Week 3"
                  }
                ],
                "touchpointCadence": [
                  "Week 1: Send white paper (no ask)",
                  "Week 2: Share relevant industry data point",
                  "Week 3: Offer case study early access",
                  "Week 4: Request briefing call"
                ],
                "successMetric": "2+ analysts mention Sora 2 in reports by Week 8"
              }
            },
            {
              "stakeholderSegment": "Tech Influencers (CTO LinkedIn influencers)",
              "discoveryCriteria": [
                "10k+ CTO followers on LinkedIn",
                "Post about AI/productivity tools",
                "High engagement (5%+ rate)"
              ],
              "exampleTargets": [
                {
                  "name": "[MOCK] CTO influencer with 50k LinkedIn followers",
                  "source": "mock_recommendation",
                  "relevanceScore": 0.85,
                  "whyMock": "Need social listening to identify specific accounts",
                  "userAction": "Use LinkedIn Sales Navigator: CTOs with 10k+ followers discussing AI"
                }
              ],
              "engagementStrategy": {
                "objective": "Get organic shares of augmentation narrative",
                "approach": "Engage authentically before pitching",
                "contentToCreateForThem": [
                  {
                    "contentType": "infographic",
                    "topic": "Augmentation vs automation decision framework",
                    "why": "Shareable visual content",
                    "signaldeskGenerates": "Infographic with data",
                    "userExecutes": "Share with credit to influencer insights",
                    "timing": "Week 2"
                  }
                ],
                "touchpointCadence": [
                  "Week 1-2: Comment thoughtfully on their posts (no mention of Sora)",
                  "Week 2: Share infographic crediting their framework",
                  "Week 3: DM: 'Would you test Sora 2 for your team?'",
                  "Week 4: If testing, offer exclusive early data"
                ],
                "successMetric": "5+ influencers organically share augmentation content"
              }
            }
          ]
        },

        "pillar3_eventOrchestration": {
          "tier1Events": [
            {
              "event": "Web Summit 2025",
              "date": "March 2025",
              "source": "master_source_registry",
              "relevanceScore": 0.95,
              "whyAttend": "10k+ enterprise decision makers + tier 1 media",
              "presenceStrategy": {
                "officialParticipation": "Submit panel proposal: 'AI in Creative Workflows: Augmentation vs Automation'",
                "socialStrategy": "Live-tweet key sessions with augmentation angle",
                "networkingStrategy": "Target CTO dinner, Creative Director meetup",
                "contentSignaldeskGenerates": [
                  "panel-proposal: Full submission with speaker bio",
                  "social-posts: 20 tweetable insights per session",
                  "one-pager: 'Augmentation model' handout for networking",
                  "email-templates: Follow-up sequences for connections"
                ]
              },
              "preEventContent": {
                "contentType": "blog-post",
                "topic": "3 trends we're watching at Web Summit 2025",
                "why": "Position as thought leader before event",
                "signaldeskGenerates": "Blog post previewing augmentation thesis",
                "timing": "Week 2"
              },
              "postEventContent": {
                "contentType": "blog-post",
                "topic": "What we learned at Web Summit: Enterprises embrace augmentation",
                "why": "Reinforce narrative with event credibility",
                "signaldeskGenerates": "Recap with CTO quotes and insights",
                "timing": "Week 4",
                "amplification": [
                  {
                    "contentType": "media-pitch",
                    "target": "TechCrunch",
                    "angle": "Web Summit reveals enterprise AI shift from automation to augmentation",
                    "signaldeskGenerates": "Pitch with exclusive survey data"
                  }
                ]
              }
            }
          ],
          "virtualEvents": [
            {
              "eventType": "Host webinar",
              "topic": "Enterprise AI Video Maturity: A CTO Panel",
              "timing": "Week 3",
              "why": "Control narrative in authority setting + generate content",
              "panelists": ["Our CEO", "2-3 customer CTOs", "Analyst"],
              "contentSignaldeskGenerates": [
                "webinar-script: Full moderator script",
                "email-sequence: Invite + reminder + replay",
                "social-posts: Promo posts for each panelist",
                "blog-post: Post-webinar recap",
                "video-clips: 5 quotable moments for social"
              ],
              "distributionStrategy": "LinkedIn ads to CTO segment ($500 budget)",
              "successMetric": "200+ CTO registrations, 60% attend rate"
            }
          ]
        },

        "pillar4_mediaEngagement": {
          "messageArchitecture": "Tier 1 validates augmentation narrative, Tier 2 provides use case depth, Tier 3 drives SEO",
          "outletStrategy": [
            {
              "outletTier": "Tier 1 - National Tech",
              "outlets": [
                {
                  "name": "TechCrunch",
                  "journalist": "Sarah Johnson",
                  "beat": "Enterprise AI",
                  "source": "journalist_registry",
                  "whyThisOutlet": "Reaches enterprise decision makers, sets narrative tone"
                },
                {
                  "name": "The Information",
                  "journalist": "Alex Chen",
                  "beat": "Enterprise SaaS",
                  "source": "journalist_registry",
                  "whyThisOutlet": "Trusted by CTOs, long-form analysis capability"
                }
              ],
              "storiesToPitch": [
                {
                  "storyAngle": "Exclusive: Enterprise AI video adoption study reveals augmentation > automation",
                  "messagePillar": "Augmentation narrative",
                  "hook": "Surveyed 500 CTOs: 73% prefer 'augmentation' positioning over 'automation'",
                  "exclusiveData": "Survey results, CTO quotes, adoption metrics",
                  "timing": "Week 2",
                  "contentSignaldeskGenerates": {
                    "media-pitch": "Full pitch email with data preview",
                    "press-kit": "One-pager with key findings + visuals",
                    "talking-points": "CEO interview prep if requested",
                    "follow-up-templates": "2 follow-up emails"
                  },
                  "supportingAssets": [
                    "white-paper: Full survey results",
                    "case-study: Fortune 500 ROI analysis"
                  ],
                  "successMetric": "1 tier-1 placement by Week 4",
                  "howSupportsStrategy": "Media validates our augmentation message (Pillar 1), makes analysts more likely to cite us (Pillar 2), creates credibility for event presence (Pillar 3)"
                },
                {
                  "storyAngle": "Why creative teams are embracing AI (instead of fearing it)",
                  "messagePillar": "Fear mitigation",
                  "hook": "Creative Directors at 10 Fortune 500 companies explain how AI augmented their teams",
                  "exclusiveData": "10 customer interviews, before/after metrics",
                  "timing": "Week 3",
                  "contentSignaldeskGenerates": {
                    "media-pitch": "Pitch with customer intro offers",
                    "customer-talking-points": "Prep customers for journalist interviews"
                  },
                  "successMetric": "1 feature story with customer quotes",
                  "howSupportsStrategy": "Emotional validation of augmentation narrative from real creative teams"
                }
              ]
            },
            {
              "outletTier": "Tier 2 - Trade Publications",
              "outlets": [
                {
                  "name": "CMSWire",
                  "journalist": "[MOCK] Content tech editor",
                  "beat": "Creative tools",
                  "source": "mock_recommendation",
                  "whyMock": "Trade publications not in journalist registry",
                  "userAction": "Research CMSWire masthead for creative tools editor"
                }
              ],
              "storiesToPitch": [
                {
                  "storyAngle": "How to integrate AI video into creative workflows",
                  "messagePillar": "Technical integration (barrier removal)",
                  "hook": "Step-by-step integration guide with Adobe/Final Cut",
                  "timing": "Week 3",
                  "contentSignaldeskGenerates": {
                    "contributed-article": "Full 1500-word how-to article",
                    "technical-diagrams": "Workflow integration visuals"
                  },
                  "successMetric": "2 contributed articles published",
                  "howSupportsStrategy": "Addresses integration barrier, provides SEO value for 'AI video integration' searches"
                }
              ]
            }
          ]
        },

        "convergenceStrategy": "Week 1: CEO seeds augmentation narrative on LinkedIn (Pillar 1). Week 2: Analysts briefed with white paper, start citing framework (Pillar 2). Week 3: TechCrunch story validates augmentation with our data (Pillar 4). Week 3: Web Summit panel reinforces narrative with authority (Pillar 3). Week 4: CTOs encounter message from 4 independent-seeming sources (owned content, analyst mention, media story, event recap) = narrative inevitability achieved.",

        "targetSystemState": "Enterprise CTOs encounter 'augmentation > automation' message from CEO post, analyst report, TechCrunch article, and Web Summit recap within same week → perceive as established truth rather than vendor claim",

        "transitionToNextPhase": "Once 20%+ convergence score achieved (CTOs encountering from 3+ sources) + 1 tier-1 media placement + analyst mention, transition to Phase 2 (deeper consideration content)"
      },

      "phase2_consideration": {
        "objective": "Move intrigued CTOs to 'evaluating Sora 2 for their team'",
        "duration": "Weeks 4-6",
        // ... similar detailed structure for Phases 2, 3, 4
        // Each phase has all 4 pillars
        // Each phase builds on previous system state
      },

      "phase3_conversion": {
        // ... Weeks 7-9
      },

      "phase4_advocacy": {
        // ... Weeks 10-12
      }
    }
  },

  "part4_counterNarrativeStrategy": {
    "defensivePosture": "Maintain proactive narrative ownership while preparing rapid-response playbooks for 4 threat scenarios",
    "threatScenarios": [
      {
        "threat": "Competitor launches 'AI replaces creators' campaign",
        "description": "Major competitor positions their tool as full creative automation, attacking our 'augmentation' positioning as insufficient innovation",
        "probability": "Medium",
        "impact": "High",
        "category": "Direct Attack",
        "earlyWarningSignals": [
          "Competitor blog posts with 'full automation' messaging",
          "Spike in social mentions of 'automation > augmentation'",
          "Analyst inquiries about our positioning vs competitor"
        ],
        "responsePlaybook": {
          "pillar1_ownedResponse": {
            "contentToCreate": [
              {
                "contentType": "blog-post",
                "topic": "Why augmentation beats automation: The data",
                "coreMessage": "Automation alienates creative teams, augmentation scales them",
                "timing": "Within 6 hours",
                "signaldeskGenerates": "Blog post + FAQ + social threads with customer retention data",
                "userExecutes": "Publish + amplify to all channels + email to customer champions"
              }
            ],
            "distributionStrategy": "LinkedIn + Twitter + customer email + analyst briefing"
          },
          "pillar2_relationshipActivation": {
            "influencersToActivate": [
              {
                "stakeholderType": "Customer Creative Directors",
                "why": "First-hand experience with augmentation > automation",
                "ask": "Share your team's experience with AI augmentation on LinkedIn",
                "signaldeskGenerates": "Talking points + testimonial template + data to cite",
                "timing": "Hour 6-12"
              }
            ]
          },
          "pillar3_eventResponse": {
            "opportunities": [
              {
                "tactic": "Host emergency webinar: 'Augmentation vs Automation: What works?'",
                "timing": "Day 2-3",
                "objective": "Control narrative with customer panel",
                "signaldeskGenerates": "Webinar script + customer prep + promo posts"
              }
            ]
          },
          "pillar4_mediaStrategy": {
            "journalistsToBrief": [
              {
                "journalist": "Sarah Johnson (TechCrunch)",
                "outlet": "TechCrunch",
                "source": "journalist_registry",
                "why": "Covered our original story, invested in our narrative",
                "counterAngle": "Data shows augmentation retains creative teams 5x better than automation",
                "signaldeskGenerates": "Media brief with customer retention data + CTO quotes",
                "timing": "Hour 12-24"
              }
            ]
          }
        },
        "responseTimeline": {
          "hour0to6": [
            "Monitor social sentiment to gauge threat severity",
            "Draft and publish owned response blog post",
            "Alert customer champions and brief them"
          ],
          "hour6to24": [
            "Activate customers to share testimonials",
            "Brief key journalists with counter-data",
            "Schedule emergency webinar"
          ],
          "day2to7": [
            "Host webinar with customer panel",
            "Amplify customer testimonials",
            "Secure tier-1 media coverage of counter-narrative"
          ]
        },
        "successMetrics": {
          "narrativeShift": "Social sentiment returns to 60%+ positive for augmentation within 7 days",
          "stakeholderResponse": "Customer champions defend us publicly, CTOs continue demos",
          "whenToDeescalate": "Threat narrative drops below 10% share of voice"
        }
      }
      // 2-3 more threat scenarios...
    ],
    "monitoringProtocol": {
      "dailyMonitoring": [
        "Social listening for 'Sora 2', 'augmentation', 'automation' mentions",
        "Media coverage sentiment tracking",
        "Competitor announcement monitoring",
        "Reddit/HackerNews thread monitoring"
      ],
      "escalationTriggers": [
        "3+ negative tier-1 media mentions in 24 hours → activate Tier 1 response",
        "Customer publicly criticizes positioning → CEO outreach",
        "Competitor direct attack with >1M reach → full defensive activation"
      ]
    }
  },

  "part5_executionRequirements": {
    "teamBandwidth": {
      "roles": [
        {
          "role": "Campaign Director",
          "hoursPerWeek": 15,
          "responsibilities": [
            "Strategic oversight and pillar coordination",
            "Stakeholder relationship management",
            "Performance monitoring and pivots"
          ],
          "canBeOutsourced": false
        },
        {
          "role": "Content Creator",
          "hoursPerWeek": 20,
          "responsibilities": [
            "Adapt SignalDesk content drafts to brand voice",
            "Social media execution and engagement",
            "Content calendar management"
          ],
          "canBeOutsourced": true,
          "outsourcingOptions": "Fractional content agency ($3-5k/month)"
        },
        {
          "role": "Relationship Manager",
          "hoursPerWeek": 10,
          "responsibilities": [
            "Analyst and influencer relationship building",
            "Journalist outreach and briefings",
            "Customer champion coordination"
          ],
          "canBeOutsourced": false,
          "why": "Requires authentic relationship building, can't be outsourced"
        },
        {
          "role": "Event Coordinator",
          "hoursPerWeek": 8,
          "responsibilities": [
            "Event research and registration",
            "Speaker prep and materials",
            "Event follow-up and content repurposing"
          ],
          "canBeOutsourced": true
        }
      ],
      "totalHoursPerWeek": 53,
      "minimumTeamSize": "2-3 people (director + content + relationships)",
      "recommendedTeamSize": "3-4 people with outsourced content support"
    },
    "budgetRequirements": {
      "essential": [
        {
          "category": "Content Creation Tools",
          "items": [
            "SignalDesk Platform: Handles all content generation",
            "Canva Pro: Design adaptation ($30/month)",
            "Video editing if needed ($50/month)"
          ],
          "totalMonthly": 80
        },
        {
          "category": "Events & Media",
          "items": [
            "Event registrations: $2-5k per major event",
            "Media database (Cision): $200/month",
            "Press release distribution: $500 per release"
          ],
          "totalMonthly": 1500
        }
      ],
      "optional": [
        {
          "category": "Amplification",
          "items": [
            "LinkedIn ads (CTO targeting): $1-3k/month",
            "Influencer partnerships: $500-2k/month",
            "Freelance content support: $2-4k/month"
          ]
        }
      ],
      "totalMinimumMonthly": 1580,
      "totalRecommendedMonthly": 3000
    },
    "systemLevelSuccessMetrics": {
      "convergenceScore": {
        "definition": "% of target stakeholders who encounter campaign message from 3+ independent sources within 7 days",
        "measurement": [
          "Monthly survey: Sample 50-100 CTOs",
          "Ask: 'Where did you encounter info about [AI video/augmentation] this week?'",
          "Calculate: % who name 3+ sources (e.g., LinkedIn post, analyst report, TechCrunch article)",
          "Target: 30% by Week 6, 50% by Week 12"
        ],
        "why": "Measures system-level narrative penetration, not just awareness"
      },
      "narrativeOwnership": {
        "definition": "% of information environment we control when stakeholder researches topic",
        "measurement": [
          "Google search 'AI video for teams': Count top 10 results we own/influenced",
          "LinkedIn search 'AI augmentation': % of posts citing our framework",
          "Target: 40% of top 10 Google results by Week 8"
        ],
        "why": "When stakeholders research, they find OUR framing"
      },
      "indirectAttribution": {
        "definition": "Competitors/media adopting our framing without credit",
        "measurement": [
          "Track: Competitor decks using 'augmentation' terminology",
          "Track: Media articles framing AI as augmentation (even without quoting us)",
          "Track: Analyst reports adopting our 5-stage maturity model",
          "Target: 5+ instances by Week 12"
        ],
        "why": "Ultimate success: Our narrative becomes 'common knowledge'"
      },
      "stakeholderBehaviorChange": {
        "definition": "Target stakeholders taking desired actions",
        "measurement": [
          "1000 enterprise trials started (primary KPI)",
          "500 CTO demo requests",
          "200 Creative Director internal champions",
          "50 customer case studies generated"
        ],
        "why": "Awareness means nothing without behavior change"
      }
    }
  },

  "part6_patternGuidance": {
    "pattern": "CASCADE",
    "philosophy": "CASCADE builds authority top-down: Start with mega-influencers (analysts), let authority cascade to practitioners (CTOs) → end users (Creative Directors). Message gains credibility at each tier.",

    "pillarEmphasis": {
      "pillar1_owned": {
        "importance": "Medium",
        "percentageOfEffort": 20,
        "role": "Supports what influencers say, doesn't lead",
        "executionPriorities": [
          "Priority 1: Create shareable assets for tier-1 influencers (white papers, data)",
          "Priority 2: CEO content positions as peer to analysts (not seller)"
        ]
      },
      "pillar2_relationships": {
        "importance": "High",
        "percentageOfEffort": 50,
        "role": "Drives the pattern - analyst endorsement cascades to CTOs",
        "executionPriorities": [
          "Priority 1: Analyst relationships are make-or-break",
          "Priority 2: Focus on tier-0 influencers (Gartner) before tier-1 (CTO influencers)"
        ]
      },
      "pillar3_events": {
        "importance": "Medium",
        "percentageOfEffort": 15,
        "role": "Legitimizes narrative at authority venues",
        "executionPriorities": [
          "Priority 1: Target events where analysts + CTOs both present",
          "Priority 2: Panel presence more valuable than booth"
        ]
      },
      "pillar4_media": {
        "importance": "Medium",
        "percentageOfEffort": 15,
        "role": "Validates what analysts already saying",
        "executionPriorities": [
          "Priority 1: Media stories should quote analysts (reinforce cascade)",
          "Priority 2: Target outlets CTOs read (TechCrunch, The Information)"
        ]
      }
    },

    "timingStrategy": {
      "phase1_awareness": {
        "pillarActivation": "Heavy Pillar 2 (analyst briefings), Light Pillar 1 (CEO seeds narrative)",
        "rationale": "Analysts must be first movers for cascade to work",
        "criticalMilestones": [
          "Week 2: 2+ analysts briefed and citing framework",
          "Week 3: CEO content references analyst validation"
        ]
      },
      "phase2_consideration": {
        "pillarActivation": "Heavy Pillar 2 (CTO influencers cite analysts), Medium Pillar 4 (media validates)",
        "rationale": "CTOs influenced by analysts, media reinforces",
        "criticalMilestones": [
          "Week 5: 5+ CTO influencers sharing analyst insights",
          "Week 6: Tier-1 media story quotes analyst + CTO"
        ]
      },
      "phase3_conversion": {
        "pillarActivation": "Heavy Pillar 1 (owned content with proof), Heavy Pillar 3 (events with customers)",
        "rationale": "Now that cascade established, owned content has credibility",
        "criticalMilestones": [
          "Week 8: Customer case studies published",
          "Week 9: Event panel with analyst + customer"
        ]
      },
      "phase4_advocacy": {
        "pillarActivation": "Heavy Pillar 2 (customer advocates), Medium Pillar 1 (advocacy content)",
        "rationale": "Customers become new tier of cascade",
        "criticalMilestones": [
          "Week 11: 10+ customers sharing testimonials",
          "Week 12: Customer advocacy program launched"
        ]
      }
    },

    "coordinationStrategy": {
      "howPillarsReinforce": "Analyst mention (Pillar 2) → CEO cites analyst (Pillar 1) → Media quotes analyst + CEO (Pillar 4) → Event panel features all three (Pillar 3) = Reinforcing cascade",
      "criticalSequences": [
        {
          "sequence": "Analyst briefing (Pillar 2) → Analyst cites us in report → CEO shares analyst report (Pillar 1) → Media covers analyst trend (Pillar 4)",
          "why": "Each step validates the previous, cascade gains momentum",
          "example": "Week 2: Brief Gartner analyst. Week 3: Analyst mentions us in LinkedIn post. Week 3: CEO shares analyst post with agreement. Week 4: TechCrunch story 'Analysts say augmentation > automation' quotes our CEO."
        }
      ],
      "coordinationCadence": "Weekly pillar sync: Ensure Pillar 1 supports Pillar 2 endorsements, Pillar 4 quotes Pillar 2 influencers"
    },

    "stakeholderJourney": {
      "idealPath": "CTO encounters message through 4-tier cascade, each tier adding credibility",
      "touchpointSequence": [
        {
          "touchpoint": "First: Gartner analyst post on LinkedIn (Pillar 2)",
          "stakeholderThinking": "Interesting framework from trusted analyst",
          "systemState": "Seed planted by authority figure"
        },
        {
          "touchpoint": "Second: CEO blog post citing analyst framework (Pillar 1)",
          "stakeholderThinking": "Vendor building on analyst insight, seems credible",
          "systemState": "Vendor validated by tier-0 authority"
        },
        {
          "touchpoint": "Third: TechCrunch article about trend, quotes analyst + CEO (Pillar 4)",
          "stakeholderThinking": "This is a real trend, not just vendor hype",
          "systemState": "Media validation = third-party credibility"
        },
        {
          "touchpoint": "Fourth: CTO influencer shares TechCrunch article with endorsement (Pillar 2)",
          "stakeholderThinking": "Peer I trust is validating this, I should explore",
          "systemState": "Peer validation = decision trigger"
        },
        {
          "touchpoint": "Fifth: Sees CEO panel at Web Summit with analyst (Pillar 3)",
          "stakeholderThinking": "This company is legitimate, analyst partners with them",
          "systemState": "Authority setting = final credibility confirmation"
        }
      ]
    }
  }
}
```

---

## DATA FLOW ANALYSIS

### What data flows where:

```
User Input (campaignGoal)
  ↓
RESEARCH FUNCTIONS
  → mcp-discovery (org profile)
  → niv-fireplexity × 2 (stakeholders, narratives)
  → journalist-registry (journalists)
  → knowledge-library-registry (historical patterns)
  ↓
niv-campaign-research-synthesis
  ↓
CampaignIntelligenceBrief (saved to DB)
  ↓
POSITIONING FUNCTION
  → niv-campaign-positioning
  ↓
3 PositioningOptions (saved to DB)
  ↓ User selects one
  ↓
BLUEPRINT FUNCTIONS (BROKEN HERE)
  → Option A: niv-campaign-vector-blueprint
      ↳ Tries to generate ALL 6 parts
      ↳ 10,000 token limit
      ↳ Times out OR truncates

  → Option B: Granular functions
      ↳ niv-campaign-blueprint-base (Parts 1-2) ✅
      ↳ niv-campaign-orchestration-phases-1-2 (Part 3A) ❌ 500 error
      ↳ niv-campaign-orchestration-phases-3-4 (Part 3B) ❌ 500 error
      ↳ niv-campaign-pattern-generator (Part 6) ✅
      ↳ niv-campaign-execution-generator (Part 5) ✅
      ↳ niv-campaign-counter-narrative-generator (Part 4) ✅
```

---

## CURRENT PROBLEMS

### Problem 1: Option A - Monolithic Function Times Out

**Function:** `niv-campaign-vector-blueprint`
**Lines 516-525:**
```typescript
message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 10000, // Comment says "Sufficient" but IT'S NOT
  temperature: 0.7,
  system: systemPrompt,
  messages: [{
    role: 'user',
    content: userPrompt
  }]
})
```

**Problems:**
1. **Generates 6 parts × 4 phases = 24 detailed sections**
2. **Each section has:**
   - Pillar 1: Multiple content pieces with signaldeskGenerates/userExecutes
   - Pillar 2: Multiple influencer strategies
   - Pillar 3: Multiple events with pre/post content
   - Pillar 4: Multiple media pitches with journalists
3. **Result:** Requires **50,000-80,000 tokens** to complete
4. **With 10k limit:** Gets truncated after Part 2 (stakeholders)
5. **User sees:** "Every section after stakeholders is basically blank"

### Problem 2: Option B - Orchestration Functions Return 500 Errors

**Function:** `niv-campaign-orchestration-phases-1-2`
**Lines 9-28:**
```typescript
interface OrchestrationRequest {
  blueprintBase: any // REQUIRED (no ?)
  researchData: any
  campaignGoal: string
  selectedPositioning: any
}

// Line 25: Crashes here if blueprintBase undefined
pattern: blueprintBase.overview?.pattern,
```

**Root Cause:**
- Frontend (or backend orchestrator) calls this function **WITHOUT `blueprintBase`**
- Function expects `blueprintBase.overview.pattern`
- JavaScript crashes: `Cannot read property 'overview' of undefined`
- Returns 500 error
- Blueprint missing Part 3 (the CRITICAL orchestration strategy)

**Same problem in:**
- `niv-campaign-orchestration-phases-3-4` (lines 10, 25)

---

## WHAT NEEDS TO BE FIXED

### The Real Solution

**The granular approach (Option B) is CORRECT architecture**, but has bugs:

1. **Make `blueprintBase` optional in orchestration functions**
   - Change `blueprintBase: any` → `blueprintBase?: any`
   - Use optional chaining: `blueprintBase?.overview?.pattern || 'Not provided'`

2. **Deploy fixed functions**
   - Deploy `niv-campaign-orchestration-phases-1-2`
   - Deploy `niv-campaign-orchestration-phases-3-4`

3. **Test the complete pipeline**
   - Blueprint-base → ✅ Generates Parts 1-2
   - Orchestration-1-2 → ✅ Generates Part 3A (Phases 1-2)
   - Orchestration-3-4 → ✅ Generates Part 3B (Phases 3-4)
   - Pattern-generator → ✅ Generates Part 6
   - Execution-generator → ✅ Generates Part 5
   - Counter-narrative → ✅ Generates Part 4

4. **Result:** Complete 6-part blueprint in 60-70 seconds

---

## COMPLETE BLUEPRINT PART SUMMARY

### Part 1: Goal Framework
- Primary objective (measurable)
- Behavioral goals per stakeholder
- KPIs
- Success criteria
- Risk assessment

### Part 2: Stakeholder Mapping
- 3-5 stakeholder groups
- Psychological profiles (values, fears, aspirations, biases)
- Information diet (sources, voices, patterns)
- Decision triggers
- Current → target perception
- Barriers to overcome

### Part 3: Orchestration Strategy (THE BIG ONE)
**For EACH of 4 phases (Awareness, Consideration, Conversion, Advocacy):**

#### Phase Structure:
- Objective & duration
- Stakeholder focus
- Message theme
- Psychological strategy
- Narrative approach
- Messaging layers

#### Pillar 1 - Owned Actions:
- Who creates (CEO, CTO, team)
- Platforms (LinkedIn, blog, Twitter)
- **Detailed content needs:**
  - Content type (blog-post, linkedin-article, etc.)
  - Topic (specific)
  - Core message
  - Target stakeholder
  - Timing (Week X, Day)
  - signaldeskGenerates: What platform creates
  - userExecutes: What user does
  - Success metric
- Distribution strategy (owned + engagement channels)

#### Pillar 2 - Relationship Orchestration:
- Tier 1 influencers (analysts, journalists, influencers)
- **For each influencer segment:**
  - Discovery criteria
  - Example targets (real names from research OR [MOCK] with criteria)
  - Engagement strategy:
    - Objective
    - Approach (value-first, no-ask period)
    - Content TO CREATE FOR THEM (white-papers, infographics, toolkits)
    - Touchpoint cadence (Week 1: action, Week 2: action)
    - Success metric
- Tier 2 amplifiers

#### Pillar 3 - Event Orchestration:
- Tier 1 events (major conferences)
  - Event name, date, location
  - Why attend (decision makers, media, narrative setting)
  - Presence strategy (panel, social, networking)
  - Content SignalDesk generates:
    - Panel proposals
    - Social post templates
    - Networking handouts
    - Follow-up sequences
  - Pre-event content (blog previewing trends)
  - Post-event content (recap + media pitch)
- Virtual events (webinars we host)

#### Pillar 4 - Media Engagement:
- Message architecture (what each tier validates)
- **For EACH tier (Tier 1, Tier 2, Tier 3):**
  - Outlets and journalists (USE REAL NAMES FROM RESEARCH)
  - **For each story to pitch:**
    - Journalist name (from journalist_registry)
    - Outlet name
    - Beat/coverage area
    - Story angle (specific hook)
    - Message pillar (which narrative this reinforces)
    - Hook (what makes it newsworthy)
    - Exclusive data (what we provide)
    - Content SignalDesk generates:
      - Media pitch (full email)
      - Press kit (one-pager)
      - Talking points (if interview)
      - Follow-up templates
    - Supporting assets (case studies, white papers)
    - Timing (Week X)
    - Success metric
    - How this supports strategy (cross-pillar amplification)

#### Cross-Pillar:
- **Convergence strategy:** How all 4 pillars work together (week-by-week)
- **Target system state:** What perception we create
- **Transition triggers:** When to move to next phase

### Part 4: Counter-Narrative Strategy
- Defensive posture
- **3-4 threat scenarios:**
  - Threat description
  - Probability & impact
  - Early warning signals
  - **Four-pillar response playbook:**
    - Pillar 1: Crisis content to create
    - Pillar 2: Influencers to activate
    - Pillar 3: Event opportunities
    - Pillar 4: Journalists to brief
  - Response timeline (hours 0-6, 6-24, days 2-7)
  - Success metrics
  - Content SignalDesk generates
- Monitoring protocol
- Preemptive defense

### Part 5: Execution Requirements
- **Team bandwidth:**
  - Roles (Campaign Director, Content Creator, Relationship Manager, Event Coordinator)
  - Hours per week per role
  - Can be outsourced?
  - Total hours
- **Budget requirements:**
  - Essential costs (tools, events, media database)
  - Optional costs (ads, influencer partnerships, freelancers)
  - Minimum vs recommended monthly budget
- **Tools and platforms:**
  - Core (SignalDesk, CRM)
  - Monitoring (social listening, analytics)
- **Weekly execution rhythm:**
  - Monday: Review + plan
  - Tue-Thu: Execute
  - Friday: Event prep + performance review
- **System-level success metrics:**
  - **Convergence score** (% encountering from 3+ sources)
  - **Narrative ownership** (% of search results we control)
  - **Indirect attribution** (competitors adopting our framing)
  - **Stakeholder behavior change** (actual actions, not awareness)
  - Pillar performance tracking
- **Adaptation strategy:**
  - Performance review cadence
  - Pivot triggers (what signals require changes)
  - Resource reallocation (if budget/time constrained)
  - Phase transition decisions
- **SignalDesk automation:**
  - What SignalDesk handles
  - What team executes

### Part 6: Pattern Guidance
- Pattern philosophy (CASCADE, MIRROR, CHORUS, TROJAN, or NETWORK)
- **Pillar emphasis:**
  - Each pillar: High/Med/Low importance
  - Percentage of effort
  - Role in pattern
  - Execution priorities
- **Timing strategy:**
  - For EACH phase: Which pillars to activate heavily
  - Rationale per phase
  - Critical milestones per phase
- **Coordination strategy:**
  - How pillars reinforce each other
  - Critical sequences (Action A → B → C)
  - Coordination cadence
- **Pattern-specific tactics:**
  - Unique approaches for this pattern
  - Why they work
  - Common mistakes to avoid
- **Stakeholder journey:**
  - Ideal path (how they experience the pattern)
  - Touchpoint sequence (1st, 2nd, 3rd encounter)
  - What they think at each stage
  - System state at each stage
- **Success indicators:**
  - Early signals (Week 2-4)
  - Mid-campaign signals (Week 6-8)
  - System state achieved (Week 10-12)
- **Adaptation for pattern:**
  - If not working (failure modes + fixes)
  - Scaling opportunities (if working well)

---

## CONCLUSION

**The complete blueprint is MASSIVE.** It's not just "4 pillars" - it's:

- **6 major parts**
- **4 phases per part (in Part 3)**
- **4 pillars per phase**
- **3-10 content pieces per pillar per phase**
- **signaldeskGenerates + userExecutes for EACH piece**
- **Real journalist names, outlet names, beat areas**
- **Detailed psychological strategies**
- **Week-by-week convergence sequences**
- **System-level success metrics**
- **Counter-narrative playbooks**
- **Pattern-specific execution guidance**

**This cannot be generated in a single 10,000-token Claude call.**

**The granular multi-function approach is CORRECT. It just has bugs (500 errors) that need fixing.**

Once fixed, the complete pipeline should generate ALL of this in 60-70 seconds.
