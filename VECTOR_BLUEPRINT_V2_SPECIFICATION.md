# VECTOR Campaign Blueprint v2 - Complete Specification

## Overview
VECTOR campaigns orchestrate multi-stakeholder influence through coordinated content across 4 pillars. This blueprint generates executable strategies that SignalDesk can create and users can deploy.

---

## Core Philosophy

**Not "faster PR" but "orchestrated system states"**
- Don't send messages → Engineer discovery
- Don't broadcast → Create convergence
- Don't compete → Own narrative voids

**SignalDesk's Role**: Generate all content assets that make the strategy executable
**User's Role**: Deploy content, build relationships, execute outreach

---

## Blueprint Structure

### Part 1: Goal Framework
Standard (keep as-is):
- Primary objective
- Behavioral goals per stakeholder
- KPIs
- Success criteria
- Risk assessment

### Part 2: Stakeholder Mapping
Standard (keep as-is):
- Stakeholder groups with psychology
- Information diet
- Decision triggers
- Current vs target perception
- Relationships between groups

### Part 3: Four-Pillar Orchestration Strategy
**NEW STRUCTURE** - Replace sequential tactics with channel-based orchestration

```json
{
  "part3_orchestrationStrategy": {
    "pattern": "CASCADE|MIRROR|CHORUS|TROJAN|NETWORK",
    "pattern_rationale": "Why this pattern fits the goal and stakeholders",

    "phases": {
      "phase1_awareness": {
        "objective": "Phase goal",
        "duration": "Weeks 1-3",
        "stakeholderFocus": ["Primary stakeholders this phase"],
        "messageTheme": "The ONE narrative we're establishing",
        "messagingLayers": [
          "How message appears through owned content",
          "How message appears through relationships",
          "How message appears through media"
        ],

        "pillar1_ownedActions": {
          "organizational_voice": [
            {
              "who": "CEO / CTO / Marketing Team",
              "why": "Their credibility with which stakeholder",
              "platforms": ["LinkedIn", "Company blog", "Email"],
              "contentNeeds": [
                {
                  "contentType": "blog-post",
                  "topic": "Specific topic aligned to message theme",
                  "coreMessage": "What this piece conveys",
                  "targetStakeholder": "Who this reaches",
                  "timing": "Week 1, Monday",
                  "signaldesk_generates": "Full blog post draft",
                  "user_executes": "Publish on blog, share in X communities",
                  "successMetric": "50+ shares in target communities"
                },
                {
                  "contentType": "linkedin-article",
                  "cadence": "3 posts/week for 3 weeks",
                  "topics": ["Post 1 topic", "Post 2 topic", "Post 3 topic"],
                  "signaldesk_generates": "All 9 post drafts with variations",
                  "user_executes": "Post to LinkedIn, engage with comments",
                  "successMetric": "500+ engagements across posts"
                }
              ]
            }
          ],

          "distributionStrategy": {
            "owned_channels": ["Company blog", "LinkedIn", "Newsletter"],
            "engagement_channels": [
              {
                "platform": "Reddit r/TargetAudience",
                "engagement_type": "Comment on threads about topic X",
                "cadence": "3-5 comments/week",
                "tone": "Helpful peer, not promotional",
                "signaldesk_generates": "Comment templates based on thread context"
              }
            ]
          }
        },

        "pillar2_relationshipOrchestration": {
          "tier1_influencers": [
            {
              "stakeholder_segment": "Policy makers / Industry experts",
              "discovery_criteria": [
                "Role: State board member / Published author",
                "Reach: 10,000+ followers",
                "Recent activity: Published in last 6 months"
              ],
              "example_targets": [
                {
                  "name": "Dr. [Real Name from journalist_registry if available]",
                  "source": "journalist_registry",
                  "relevance_score": 0.92
                },
                {
                  "name": "[MOCK] State official with K-12 policy influence",
                  "criteria_met": "Board member + active social + recent pubs",
                  "source": "mock_recommendation",
                  "why_mock": "Limited real-time data on state officials",
                  "user_action": "Search master_source_registry: 'education AND board AND state'"
                }
              ],

              "engagement_strategy": {
                "objective": "Get them to cite our research in policy discussions",
                "approach": "Value-first relationship building",
                "no_ask_period": "4-6 weeks of value provision first",

                "content_to_create_for_them": [
                  {
                    "contentType": "white-paper",
                    "topic": "Topic they care about (their key issue)",
                    "why": "They need data to support policy positions",
                    "signaldesk_generates": "White paper draft with citations",
                    "user_executes": "Send via LinkedIn with personalized note",
                    "timing": "Week 1"
                  },
                  {
                    "contentType": "infographic",
                    "topic": "Visual data they can share",
                    "why": "Shareable, makes them look informed",
                    "signaldesk_generates": "Infographic with data viz",
                    "user_executes": "Share and tag them",
                    "timing": "Week 3"
                  }
                ],

                "touchpoint_cadence": [
                  "Week 1: Send white paper",
                  "Week 2: Comment on their post with value-add",
                  "Week 4: Invite to webinar as expert panelist",
                  "Week 6: Share their article with thoughtful commentary"
                ],

                "successMetric": "They cite our research OR mention our tool within 8 weeks"
              }
            }
          ],

          "tier2_amplifiers": [
            {
              "stakeholder_segment": "Community influencers / Practitioners",
              "discovery_criteria": [
                "5,000+ followers on relevant platform",
                "Regular posting about our topic",
                "Not promoting competitors"
              ],
              "discovery_method": "social_listening + opportunity_detector",

              "engagement_strategy": {
                "objective": "Get organic shares of our stories",
                "approach": "Make them heroes, not spokespeople",

                "content_to_create_for_them": [
                  {
                    "contentType": "case-study",
                    "topic": "Success story they can discover",
                    "why": "They share as 'found this' not 'sponsored'",
                    "signaldesk_generates": "Shareable case study",
                    "timing": "Week 2"
                  },
                  {
                    "contentType": "toolkit",
                    "topic": "Free resource they can share",
                    "why": "Sharing = social credit for them",
                    "signaldesk_generates": "PDF toolkit + social graphics",
                    "timing": "Week 4"
                  }
                ]
              }
            }
          ]
        },

        "pillar3_eventOrchestration": {
          "tier1_events": [
            {
              "event": "Major Industry Conference",
              "date": "Month Year",
              "source": "master_source_registry",
              "relevance_score": 0.95,
              "attendance": "600+ decision makers",

              "why_attend": "Sets annual narrative tone, media presence, decision makers",

              "presence_strategy": {
                "official_participation": "Submit panel proposal on topic X",
                "social_strategy": "Live-tweet 10+ sessions with hashtag",
                "networking_targets": ["C-level from Fortune 500", "Media covering event"],

                "content_signaldesk_generates": [
                  "panel-proposal: Session description + talking points",
                  "social-posts: 20 pre-written tweet templates",
                  "one-pager: Research summary handout",
                  "email-templates: Follow-up for connections made"
                ]
              },

              "pre_event_content": {
                "blog-post": "5 trends to watch at [Event]",
                "social-campaign": "Daily countdown posts",
                "why": "Position as thought leader BEFORE event"
              },

              "post_event_content": {
                "blog-post": "Key takeaways from [Event]",
                "social-posts": "Photo recap + insights",
                "media-pitch": "Pitch journalists on trend story",
                "why": "Extract maximum value from attendance"
              }
            }
          ],

          "tier2_events": {
            "event_type": "Regional conferences / Meetups",
            "source": "mock_recommendation",
            "why_mock": "Limited real-time regional event data",
            "criteria": "200+ target audience, focus on our topic, accessible location",
            "user_action": "Query master_source_registry: 'industry conferences 2025 AND attendance > 200'",

            "presence_strategy": "Sponsor resource booth, not main stage"
          },

          "virtual_events": [
            {
              "event_type": "Host own webinar",
              "topic": "Panel discussion on our topic",
              "why": "Control narrative, capture leads, create content asset",

              "content_signaldesk_generates": [
                "webinar-script: Moderator questions + structure",
                "email-sequence: Promotional emails",
                "social-posts: Promotion + registration campaign",
                "blog-post: Post-event recap with recording",
                "video-clips: Social snippets with captions"
              ]
            }
          ]
        },

        "pillar4_mediaEngagement": {
          "strategic_purpose": "Third-party validation that makes other pillars more credible",
          "message_architecture": "What narrative each tier of media validates",

          "outlet_strategy": [
            {
              "outlet_tier": "Tier 1 - National/Major Industry Media",
              "outlets": [
                {
                  "name": "Major Publication",
                  "journalist": "[Real name from journalist_registry]",
                  "beat": "Their coverage area",
                  "source": "journalist_registry",
                  "recent_coverage": ["Recent topics they covered"],
                  "why_this_outlet": "Reaches decision makers and policy makers"
                }
              ],

              "stories_to_pitch": [
                {
                  "story_angle": "Data story: Quantifiable trend/result",
                  "message_pillar": "Time savings / Efficiency / Innovation",
                  "hook": "New data from X sources shows Y impact",
                  "timing": "Week 2 (after case studies published)",
                  "outlets": ["Publication 1", "Publication 2"],

                  "content_signaldesk_generates": {
                    "media-pitch": "Full pitch email with subject, lede, data",
                    "press-kit": "One-pager with stats, quotes, infographic",
                    "talking-points": "If they want executive interview",
                    "follow-up-templates": "2 follow-up emails"
                  },

                  "supporting_assets": [
                    "case-study: Already published customer results",
                    "white-paper: Research document",
                    "infographic: Before/after visualization"
                  ],

                  "successMetric": "1 story placement in Tier 1 by Week 4",

                  "how_this_supports_strategy": "Validates claims that community is sharing organically (Pillar 1). Policy makers see coverage and become receptive to white paper (Pillar 2)."
                }
              ]
            },

            {
              "outlet_tier": "Tier 2 - Trade Publications & Regional",
              "purpose": "Reach specific decision-maker segments",

              "outlets": [
                {
                  "name": "Trade Magazine",
                  "journalist": "[MOCK] Staff writer covering operations",
                  "why_mock": "Trade pubs have rotating contributors",
                  "beat": "Operations & efficiency"
                }
              ],

              "stories_to_pitch": [
                {
                  "story_angle": "ROI story: Budget impact with hard numbers",
                  "message_pillar": "Financial efficiency for decision makers",
                  "timing": "Week 6",

                  "how_this_supports_strategy": "While practitioners care about TIME (Pillar 1), decision makers care about BUDGET. This reaches buyers with their message."
                }
              ]
            },

            {
              "outlet_tier": "Tier 3 - Tech & Business Media",
              "purpose": "Investor/partner awareness, market validation",
              "timing": "Week 8+ (after Tier 1/2 establish credibility)",

              "stories_to_pitch": [
                {
                  "story_angle": "Growth/traction story: Market momentum",
                  "message_pillar": "Market validation + timing",

                  "how_this_supports_strategy": "Previous coverage gave credibility. Now translate to business legitimacy for investors and partners."
                }
              ]
            }
          ],

          "ongoing_media_tactics": {
            "reactive_opportunities": {
              "newsjacking": {
                "trigger": "Opportunity detector flags topic spike",
                "action": "Rapid response pitch within 4 hours",
                "content_signaldesk_generates": "rapid-response-pitch + expert-quote"
              }
            },

            "proactive_relationships": {
              "journalist_nurturing": [
                {
                  "journalist": "[Name from journalist_registry]",
                  "relationship_stage": "Cold → Warm",
                  "touchpoints": [
                    "Week 1: Send relevant research",
                    "Week 3: Comment on their LinkedIn post",
                    "Week 5: Pitch the data story",
                    "Week 7: Share early survey results"
                  ],
                  "content_signaldesk_generates": "email-templates for each touchpoint",
                  "objective": "Become go-to source for our topic"
                }
              ]
            }
          }
        },

        "convergenceStrategy": {
          "how_pillars_work_together": "Owned content → Influencers share → Events legitimize → Media validates = Multiple independent-seeming sources create perception of 'everyone talking about this'",
          "target_system_state": "By end of phase, stakeholders encountering message theme from 4 different angles without realizing coordination",
          "transition_to_next_phase": "Once awareness established (media coverage + social proof), shift to deeper messaging"
        }
      },

      "phase2_consideration": {
        // Same structure but different message theme and tactics
      },

      "phase3_conversion": {
        // Same structure
      },

      "phase4_advocacy": {
        // Same structure
      }
    }
  }
}
```

### Part 4: Counter-Narrative Strategy
**NEW SECTION** - Defensive playbook

```json
{
  "part4_counterNarrative": {
    "purpose": "Protect gains from threats and attacks",

    "threat_scenarios": [
      {
        "threat": "Competitor releases negative study / attacks our category",
        "early_warning": "Opportunity detector flags negative sentiment spike",
        "response_sla": "4 hours to draft counter-narrative",

        "response_playbook": {
          "pillar1_owned": {
            "contentType": "blog-post + qa-document",
            "topic": "Our methodology / accuracy data",
            "timing": "Within 24 hours",
            "signaldesk_generates": "Response blog + Q&A doc + talking points"
          },
          "pillar2_relationships": {
            "activation": "Alert tier1 advocates to share positive experiences",
            "contentType": "case-study testimonials",
            "signaldesk_generates": "Testimonial scripts for advocates"
          },
          "pillar4_media": {
            "action": "Proactive pitch to key journalists",
            "story_angle": "Here's the real data on [topic]",
            "signaldesk_generates": "Rapid response media pitch"
          }
        },

        "escalation_trigger": "If negative narrative reaches 10K+ mentions, activate full response across all channels"
      },

      {
        "threat": "Industry group opposes our approach",
        "response_playbook": {
          "message_pivot": "Reframe positioning (assist not replace, empower not eliminate)",
          "pillar2_activation": "Community members (who are group members) share positive stories",
          "contentType": "thought-leadership from industry insiders"
        }
      }
    ]
  }
}
```

### Part 5: Resource Requirements & Execution Guidance
**NEW SECTION** - What does user need to execute?

```json
{
  "part5_executionRequirements": {
    "team_bandwidth": {
      "minimum_viable": {
        "roles": [
          "1 person: SignalDesk content creation (10 hrs/week)",
          "1 person: Outreach & distribution (10 hrs/week)",
          "0.5 executive: Interviews & events (2-3 hrs/week)"
        ],
        "total_commitment": "22-23 hours/week team effort"
      },

      "optimal_setup": {
        "roles": [
          "1 campaign manager: Strategy oversight",
          "1 content coordinator: SignalDesk execution",
          "1 outreach coordinator: Relationships + media",
          "0.25 executive: High-value touchpoints"
        ],
        "total_commitment": "25-30 hours/week"
      }
    },

    "budget_considerations": {
      "signaldesk_platform": "Included",

      "optional_paid_amplification": {
        "use_cases": [
          "Boost influencer posts to broader audience",
          "Promote white paper to LinkedIn audience segment",
          "Amplify media coverage on social"
        ],
        "estimated_budget": "$2-5K over 12 weeks",
        "note": "Optional but can accelerate results"
      },

      "event_costs": {
        "tier1_events": "$5-10K (travel, booth, sponsorship)",
        "virtual_events": "$0-500 (webinar platform)",
        "recommendation": "Prioritize 1-2 tier1 vs many tier2"
      }
    },

    "adaptation_strategy": {
      "leading_indicators": [
        {
          "checkpoint": "Week 2",
          "metric": "Organic shares from target community",
          "target": "10+ shares",
          "if_miss": "Content not resonating → Survey 5 users → Adjust messaging"
        },
        {
          "checkpoint": "Week 4",
          "metric": "Media engagement with pitches",
          "target": "2+ journalist replies",
          "if_miss": "Wrong angle → Research their recent stories → Repitch"
        }
      ],

      "pivot_scenarios": [
        {
          "trigger": "Primary message <5% engagement after 4 weeks",
          "action": "Test secondary positioning (quality vs. efficiency)",
          "signaldesk_regenerates": "All content for new angle"
        },
        {
          "trigger": "One pillar performing 2x better than others",
          "action": "Double down on working channel, reduce underperforming"
        }
      ],

      "success_indicators": {
        "working_signs": [
          "Media quotes our owned content",
          "Influencers share media coverage",
          "Event speakers cite our research"
        ],
        "threshold": "50%+ of mentions NOT directly from us = system state achieved"
      }
    }
  }
}
```

### Part 6: Pattern-Specific Emphasis
**NEW SECTION** - How pattern choice affects execution

```json
{
  "part6_patternGuidance": {
    "[Selected Pattern Name]": {
      "pattern_description": "What this pattern does",
      "when_to_use": "Situation where this pattern excels",

      "pillar_emphasis": {
        "pillar1_owned": "Heavy|Medium|Light + why",
        "pillar2_relationships": "Heavy|Medium|Light + why",
        "pillar3_events": "Heavy|Medium|Light + why",
        "pillar4_media": "Heavy|Medium|Light + why"
      },

      "timing_strategy": "Slow build vs. rapid deployment vs. coordinated launch",

      "execution_adjustments": [
        "Specific tactics that change based on this pattern",
        "Content timing differences",
        "Relationship approach differences"
      ]
    }
  }
}
```

---

## Content Handoff to niv-content-intelligent-v2

### How Blueprint Feeds Execution Tab

Each content piece in the blueprint includes:

```json
{
  "contentType": "blog-post|social-post|white-paper|media-pitch|etc",
  "topic": "Specific topic/headline",
  "targetStakeholder": "Who this reaches",
  "coreMessage": "What it conveys",
  "timing": "Week X, Day",
  "phase": "1-4",

  // These feed directly into niv-content-intelligent-v2 tools:
  "generation_params": {
    "tool": "generate_blog_post|generate_social_post|etc",
    "params": {
      "topic": "...",
      "angle": "...",
      "tone": "...",
      // Any other params the tool needs
    }
  }
}
```

### Batch Generation Support

User can say: **"Generate all Phase 1 content"**

System extracts all Phase 1 content needs:
- 5 blog posts → `generate_blog_post` x5
- 15 social posts → `generate_social_post` x15
- 3 case studies → `generate_case_study` x3
- 2 white papers → `generate_white_paper` x2
- 10 media pitches → `generate_media_pitch` x10

All queued and ready to execute on schedule.

---

## Data Sources & Mock Data Strategy

### Hybrid Approach

**Use Real Data When Available:**
- Journalists: `journalist_registry`
- Events: `master_source_registry`
- Trending topics: `opportunity_detector`
- Social listening: Real-time monitoring

**Use Mock Data With Criteria When Not:**
- Industry-specific influencers (we don't know their vertical)
- Recent niche events not in registry
- Emerging platforms/communities

**Mock Data Format:**
```json
{
  "name": "[MOCK] Role description matching criteria",
  "criteria_met": "Board member + 10K+ followers + recent publications",
  "source": "mock_recommendation",
  "why_mock": "Limited real-time data on [specific area]",
  "user_action": "Query master_source_registry: 'search terms' OR manually research based on criteria"
}
```

**Query Recommendations:**
Suggest specific queries user can run:
- `"education conferences 2025 AND attendance > 500"`
- `"journalists AND fintech AND tier1"`

---

## Pattern Implementations

### CASCADE Pattern
- **When**: Build momentum over time, create movement feeling
- **Emphasis**: Heavy Owned early → Heavy Media late
- **Timing**: Slow build → sudden visibility

### MIRROR Pattern
- **When**: Predictable crisis coming, position as solution
- **Emphasis**: Heavy Relationships pre-crisis → Heavy Media during crisis
- **Timing**: Pre-position → crisis → we're the answer

### TROJAN Pattern
- **When**: Audience doesn't want direct message
- **Emphasis**: Heavy Events + Relationships (value vehicles)
- **Timing**: Valuable content embeds our message naturally

### NETWORK Pattern
- **When**: Target hard to reach, need indirect influence
- **Emphasis**: HEAVY Relationships (this IS the pattern)
- **Timing**: 3-6 months, influence the influencers

### CHORUS Pattern
- **When**: Multiple voices saying similar things
- **Emphasis**: Heavy Relationships (coordinate without seeming coordinated)
- **Timing**: Parallel execution, converge at target date

---

## Success Metrics

### Traditional Metrics (Track)
- Impressions / Reach
- Engagement rate
- Media placements
- Sentiment score

### System-Level Metrics (The Real Goal)
- **Convergence Score**: % of mentions NOT directly from us
- **Narrative Ownership**: Are journalists using OUR framing?
- **Indirect Attribution**: Influencers sharing without prompting
- **System State Achievement**: Target stakeholders encountering message from 3+ independent sources

### Leading Indicators
- Week 2: Organic community shares
- Week 4: Journalist engagement
- Week 6: Influencer amplification
- Week 8: Event/speaking invitations

---

## Blueprint Generation Prompt Guidance

When generating blueprint, Claude should:

1. **Map CASCADE/MIRROR/etc patterns** to stakeholder relationships and goals
2. **Identify real data** from research (journalists, events) and use it
3. **Generate mock data WITH CRITERIA** when real data unavailable
4. **Balance 4 pillars** based on pattern (not equal emphasis)
5. **Make content EXECUTABLE** - specific enough for niv-content-intelligent-v2
6. **Show convergence** - explain how pillars amplify each other
7. **Include defensive playbook** - at least 2 threat scenarios
8. **Resource guidance** - realistic time/budget expectations

---

## Example Phase Structure (Complete)

See JSON examples above for complete phase structure including:
- All 4 pillars with specific tactics
- Content needs with signaldesk_generates + user_executes
- Real vs mock data handling
- Convergence strategy
- Transition to next phase

This structure repeats for all 4 phases with different:
- Message themes
- Stakeholder focus
- Content tactics
- Timing
