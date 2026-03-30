# GEO-VECTOR Blueprint Structure V2
**Date:** November 2, 2025
**Changes:** Industry-adaptive content types, removed Reddit AMAs, added 12+ high-citation options

---

## Blueprint Structure

### Part 1: Strategic Foundation (Same as VECTOR)

```typescript
{
  campaign_goal: string
  campaign_pattern: string  // CASCADE, CONVERGENCE, etc.
  target_stakeholders: Stakeholder[]
  positioning: {
    name: string
    tagline: string
    key_messages: string[]
    differentiators: string[]
  }
  timeline: {
    duration: string  // "12 weeks"
    phases: Phase[]
  }
  success_metrics: string[]
}
```

---

### Part 2: GEO Intelligence Analysis (NEW)

```typescript
{
  target_queries: [
    {
      query: "best CRM for small business",
      intent: "comparison",
      priority: "critical",
      current_ranking: {
        chatgpt: "not_mentioned",
        claude: "rank_7",
        perplexity: "not_mentioned",
        gemini: "rank_4"
      },
      sources_cited: {
        chatgpt: ["G2", "Capterra", "Forbes"],
        claude: ["TechCrunch", "Documentation"],
        perplexity: ["G2", "Reddit", "TechCrunch"],
        gemini: ["Documentation", "Comparison sites"]
      },
      opportunity_score: 87  // Based on importance × gap
    }
  ],

  platform_priorities: {
    chatgpt: {
      importance: "critical",
      rationale: "60% of SaaS searches start here",
      current_visibility: "weak",
      optimization_focus: ["comparison_sites", "documentation", "case_studies"]
    },
    claude: {
      importance: "high",
      rationale: "Developer-heavy audience",
      current_visibility: "moderate",
      optimization_focus: ["technical_docs", "github", "blog"]
    },
    perplexity: {
      importance: "medium",
      rationale: "Citation-focused",
      current_visibility: "weak",
      optimization_focus: ["news", "research", "documentation"]
    },
    gemini: {
      importance: "medium",
      rationale: "Growing market share",
      current_visibility: "moderate",
      optimization_focus: ["documentation", "youtube"]
    }
  },

  source_analysis: {
    high_impact: [
      {
        source: "G2/Capterra Profiles",
        citation_rate: 65,
        current_presence: "weak",
        gap_severity: "critical",
        opportunity_score: 92
      },
      {
        source: "Product Documentation",
        citation_rate: 75,
        current_presence: "moderate",
        gap_severity: "high",
        opportunity_score: 85
      }
    ],
    medium_impact: [
      {
        source: "LinkedIn Thought Leadership",
        citation_rate: 45,
        current_presence: "weak",
        gap_severity: "medium",
        opportunity_score: 68
      }
    ],
    low_impact: [
      {
        source: "Reddit",
        citation_rate: 15,
        current_presence: "none",
        gap_severity: "low",
        opportunity_score: 23
      }
    ]
  },

  competitive_analysis: {
    competitor: "Competitor X",
    their_presence: {
      "G2": "strong (4.5★, 500+ reviews)",
      "Documentation": "excellent (comprehensive API docs)",
      "Case Studies": "strong (20+ published)",
      "LinkedIn": "moderate (weekly posts)"
    },
    our_presence: {
      "G2": "weak (4.1★, 50 reviews)",
      "Documentation": "moderate (basic docs)",
      "Case Studies": "weak (3 published)",
      "LinkedIn": "none"
    },
    gaps: [
      "Need 200+ G2 reviews to be competitive",
      "Documentation missing advanced use cases",
      "No LinkedIn presence vs competitor's weekly posts"
    ]
  }
}
```

---

### Part 3: Three-Tier Content Strategy (ADAPTIVE)

#### Tier 1: Automated Content (SignalDesk Executes)

```typescript
{
  automated_actions: [
    // ALWAYS INCLUDED
    {
      id: "schema_optimization",
      type: "schema_update",
      priority: "critical",
      timeline: "Week 1",

      actions: [
        {
          schema_type: "Product",
          changes: {
            add_fields: ["aggregateRating", "review", "offers"],
            enhance_fields: ["description", "featureList"],
            reasoning: "Missing rating/review schema - all competitors have this"
          },
          execution: "one_click"  // User clicks Execute in UI
        },
        {
          schema_type: "FAQPage",
          create_new: true,
          questions: [
            "What makes [product] different from competitors?",
            "How much does [product] cost?",
            "What integrations does [product] support?",
            "Is there a free trial?",
            "What's the implementation timeline?"
          ],
          execution: "auto_generate"  // SignalDesk generates entire schema
        },
        {
          schema_type: "Organization",
          enhance_fields: ["knowsAbout", "awards", "sameAs"],
          execution: "one_click"
        }
      ],

      deliverables: [
        "Updated Product schema with ratings/reviews",
        "New FAQPage schema with 15 common questions",
        "Enhanced Organization schema"
      ],

      success_metrics: [
        "Schemas indexed by AI platforms within 2 weeks",
        "Appear in structured results",
        "Cited in FAQ-style queries"
      ],

      estimated_impact: "15-25% visibility increase"
    },

    // INDUSTRY/OBJECTIVE ADAPTIVE
    // Included based on content selection algorithm
    {
      id: "product_documentation",
      type: "documentation",
      priority: "critical",
      timeline: "Weeks 1-2",
      included_when: {
        objectives: ["drive_sales", "technical_adoption"],
        industries: ["B2B SaaS", "Developer Tools", "Technical Services"]
      },

      actions: [
        {
          doc_type: "feature_documentation",
          content_source: "Product info from Memory Vault",
          generation: "AI-generated from product details",
          sections: [
            "Overview",
            "Key Features",
            "Use Cases by Industry",
            "Integration Guide",
            "Best Practices",
            "Troubleshooting"
          ]
        },
        {
          doc_type: "api_reference",
          content_source: "Existing API docs or user provides",
          generation: "Enhanced/formatted by SignalDesk"
        },
        {
          doc_type: "comparison_guide",
          content: "Feature comparison with competitors",
          generation: "AI-generated from competitive intelligence"
        }
      ],

      deliverables: [
        "Comprehensive product documentation (20-30 pages)",
        "API reference (if applicable)",
        "Feature comparison guide",
        "Use case library (5-10 scenarios)"
      ],

      deployment: {
        method: "Hosted on user's domain",
        url_structure: "/docs/[feature-name]",
        indexing: "Submitted to Google, Bing for fast indexing"
      },

      success_metrics: [
        "Indexed within 2 weeks",
        "Cited in 'how to use [product]' queries",
        "Appears in technical query results"
      ],

      estimated_impact: "25-35% visibility increase for product queries"
    },

    {
      id: "case_studies",
      type: "case_study",
      priority: "high",
      timeline: "Weeks 2-3",
      included_when: {
        objectives: ["drive_sales", "thought_leadership"],
        industries: ["B2B SaaS", "Services", "Financial Services", "Healthcare"]
      },

      actions: [
        {
          case_study_count: 3-5,
          content_source: "Customer data from user + Memory Vault",
          generation: "AI-generated narratives",
          format: "Problem → Solution → Results",
          includes: [
            "Customer background",
            "Challenge faced",
            "Solution implemented",
            "Quantified results (ROI, time saved, etc.)",
            "Customer quote"
          ]
        },
        {
          roi_calculator: true,
          generation: "Interactive calculator based on case study data"
        }
      ],

      deliverables: [
        "3-5 detailed case studies",
        "ROI calculator",
        "Results summary page",
        "Industry-specific success metrics"
      ],

      success_metrics: [
        "Cited in '[product] results' queries",
        "Appears in ROI/value queries",
        "Each case study viewed 500+ times"
      ],

      estimated_impact: "20-30% increase in conversion-intent queries"
    },

    {
      id: "linkedin_thought_leadership",
      type: "linkedin_content",
      priority: "critical",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["Financial Services", "Consulting", "B2B Services", "Investment"]
      },

      actions: [
        {
          frequency: "2-3 posts per week",
          content_types: [
            "Market analysis (data-driven)",
            "Trend commentary",
            "Investment thesis breakdowns",
            "Industry predictions",
            "Original research sharing"
          ],
          generation: "AI-written, user reviews/approves",
          length: "500-1,000 words per post"
        }
      ],

      deliverables: [
        "24-36 LinkedIn posts over 12 weeks",
        "Content calendar",
        "Performance tracking"
      ],

      success_metrics: [
        "1,000+ views per post",
        "Cited in 'investment trends' queries",
        "Appears in 'top [industry] experts' queries"
      ],

      estimated_impact: "30-40% increase in authority-based queries"
    },

    {
      id: "research_reports",
      type: "original_research",
      priority: "high",
      timeline: "Weeks 4-8",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["Financial Services", "Consulting", "Investment", "Research"]
      },

      actions: [
        {
          report_type: "Market analysis",
          data_source: "User provides data + SignalDesk researches",
          generation: "AI-written report with charts/graphs",
          length: "15-30 pages",
          includes: [
            "Executive summary",
            "Market overview",
            "Trend analysis",
            "Data visualizations",
            "Predictions",
            "Methodology"
          ]
        }
      ],

      deliverables: [
        "Quarterly market report",
        "Press release announcing report",
        "Executive summary (1-pager)",
        "Social media assets"
      ],

      success_metrics: [
        "1,000+ downloads",
        "Cited in market analysis queries",
        "Referenced by other analysts"
      ],

      estimated_impact: "40-50% increase in research-based queries"
    },

    {
      id: "technical_blog",
      type: "blog_content",
      priority: "high",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["technical_adoption", "thought_leadership"],
        industries: ["Developer Tools", "B2B SaaS", "Technical Services"]
      },

      actions: [
        {
          frequency: "1-2 posts per week",
          content_types: [
            "Architecture deep-dives",
            "Performance optimization guides",
            "Best practices",
            "Migration guides",
            "Technical comparisons",
            "How-to tutorials"
          ],
          generation: "AI-written with code examples",
          length: "1,000-2,000 words per post"
        }
      ],

      deliverables: [
        "12-24 technical blog posts",
        "Code examples repository",
        "Content calendar"
      ],

      success_metrics: [
        "500+ views per post",
        "Cited in technical queries",
        "Shared in developer communities"
      ],

      estimated_impact: "25-35% increase in technical query visibility"
    },

    {
      id: "press_distribution",
      type: "press_release",
      priority: "medium",
      timeline: "Weeks 2, 6, 10",
      included_when: {
        objectives: ["all"],  // Universal
        industries: ["all"]
      },

      actions: [
        {
          release_count: 3,
          topics: [
            "Product launch/update",
            "Partnership announcement",
            "Market research findings"
          ],
          generation: "AI-written",
          distribution: "PR Newswire / Business Wire"
        }
      ],

      deliverables: [
        "3 press releases",
        "Distribution to tier 1-2 outlets",
        "Media monitoring"
      ],

      success_metrics: [
        "Picked up by 10+ publications",
        "Cited in news queries"
      ],

      estimated_impact: "10-20% increase in brand queries"
    }
  ]
}
```

#### Tier 2: User-Assisted Content (SignalDesk Provides, User Executes)

```typescript
{
  user_assisted_actions: [
    {
      id: "comparison_site_optimization",
      type: "review_platform",
      priority: "critical",
      timeline: "Weeks 1-4",
      included_when: {
        objectives: ["drive_sales"],
        industries: ["B2B SaaS", "Software", "Technology"]
      },

      actions: [
        {
          platform: "G2",
          optimization: [
            "Profile optimization (SignalDesk writes copy)",
            "Feature list enhancement",
            "Customer review generation campaign",
            "Competitive comparison update"
          ],
          review_target: "50+ reviews in first quarter",
          review_template: "SignalDesk provides email templates"
        },
        {
          platform: "Capterra",
          optimization: "Similar to G2"
        },
        {
          platform: "TrustRadius",
          optimization: "Similar to G2"
        }
      ],

      deliverables: [
        "Optimized G2 profile copy",
        "Review solicitation email templates",
        "Customer outreach sequence",
        "Review response templates"
      ],

      user_tasks: [
        "Submit profile updates to platforms",
        "Send review request emails to customers",
        "Respond to reviews"
      ],

      time_estimate: "2-3 hours initial setup + 1 hour/week maintenance",

      success_metrics: [
        "4.5+ star rating",
        "50+ reviews within 3 months",
        "Cited in 65% of 'best [category]' queries"
      ],

      estimated_impact: "30-40% increase in comparison query visibility"
    },

    {
      id: "youtube_content",
      type: "video",
      priority: "high",
      timeline: "Weeks 2-6",
      included_when: {
        objectives: ["drive_sales", "technical_adoption"],
        industries: ["B2B SaaS", "Developer Tools", "Consumer Products"]
      },

      actions: [
        {
          video_count: 3-5,
          video_types: [
            {
              type: "Product demo",
              length: "5-10 minutes",
              script: "SignalDesk provides",
              talking_points: [
                "Problem statement",
                "Solution walkthrough",
                "Key features demo",
                "Results/benefits"
              ]
            },
            {
              type: "Feature tutorial",
              length: "3-7 minutes",
              script: "SignalDesk provides",
              includes: "Step-by-step walkthrough"
            },
            {
              type: "Comparison video",
              length: "8-12 minutes",
              script: "SignalDesk provides",
              includes: "Feature-by-feature comparison with competitors"
            }
          ]
        }
      ],

      deliverables: [
        "3-5 video scripts",
        "Thumbnail designs",
        "SEO-optimized titles/descriptions",
        "Talking points",
        "B-roll suggestions"
      ],

      user_tasks: [
        "Record videos (or hire videographer)",
        "Upload to YouTube",
        "Publish according to schedule"
      ],

      time_estimate: "1 day per video (recording + editing)",

      success_metrics: [
        "1,000+ views per video",
        "Embedded in 'how to [task]' queries",
        "Appears in AI video results"
      ],

      estimated_impact: "20-30% increase in visual query visibility"
    },

    {
      id: "stackoverflow_contributions",
      type: "technical_forum",
      priority: "high",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["technical_adoption"],
        industries: ["Developer Tools", "B2B SaaS (technical)"]
      },

      actions: [
        {
          question_monitoring: "SignalDesk monitors relevant tags",
          answer_suggestions: "AI generates suggested answers",
          frequency: "2-3 answers per week",
          includes: [
            "Code examples",
            "Links to documentation",
            "Best practices"
          ]
        }
      ],

      deliverables: [
        "Weekly digest of relevant questions",
        "Pre-written answer templates",
        "Code examples",
        "Documentation links"
      ],

      user_tasks: [
        "Review suggested answers",
        "Customize for authenticity",
        "Post to Stack Overflow"
      ],

      time_estimate: "30-60 minutes per week",

      success_metrics: [
        "20+ upvoted answers per quarter",
        "Cited in technical queries",
        "Documentation links clicked"
      ],

      estimated_impact: "25-35% increase in technical query visibility"
    },

    {
      id: "quora_expert_answers",
      type: "q_and_a",
      priority: "medium",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["thought_leadership", "drive_sales"],
        industries: ["Services", "Consulting", "B2B"]
      },

      actions: [
        {
          question_monitoring: "SignalDesk monitors industry topics",
          answer_generation: "AI writes detailed answers",
          frequency: "3-5 answers per week",
          answer_length: "500-1,000 words",
          includes: [
            "Expert perspective",
            "Data/examples",
            "Subtle product mention (if relevant)"
          ]
        }
      ],

      deliverables: [
        "Weekly question opportunities",
        "Pre-written answers",
        "Supporting data/examples"
      ],

      user_tasks: [
        "Review/customize answers",
        "Post to Quora"
      ],

      time_estimate: "30-45 minutes per week",

      success_metrics: [
        "1,000+ answer views per month",
        "Cited in informational queries"
      ],

      estimated_impact: "15-25% increase in Q&A query visibility"
    },

    {
      id: "github_examples",
      type: "code_repository",
      priority: "critical",
      timeline: "Weeks 1-4",
      included_when: {
        objectives: ["technical_adoption"],
        industries: ["Developer Tools"]
      },

      actions: [
        {
          repository_type: "Code examples",
          includes: [
            "Integration examples",
            "SDK/library",
            "Sample applications",
            "Documentation"
          ],
          generation: "SignalDesk provides structure + examples"
        }
      ],

      deliverables: [
        "GitHub repository setup",
        "README with examples",
        "Code samples",
        "Documentation"
      ],

      user_tasks: [
        "Create repository",
        "Upload code",
        "Maintain/update"
      ],

      time_estimate: "1 day initial setup + 1 hour/month maintenance",

      success_metrics: [
        "100+ stars",
        "Cited in code example queries",
        "Linked from Stack Overflow"
      ],

      estimated_impact: "30-40% increase in code example visibility"
    },

    {
      id: "medium_articles",
      type: "blog_platform",
      priority: "medium",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["all"]
      },

      actions: [
        {
          frequency: "1-2 articles per week",
          article_length: "1,000-2,000 words",
          content_types: [
            "Industry analysis",
            "Trend predictions",
            "Personal insights",
            "Lessons learned"
          ],
          generation: "AI-written, user reviews"
        }
      ],

      deliverables: [
        "12-24 Medium articles",
        "Content calendar",
        "SEO optimization"
      ],

      user_tasks: [
        "Review/edit articles",
        "Publish to Medium",
        "Share on social"
      ],

      time_estimate: "15-30 minutes per article",

      success_metrics: [
        "500+ views per article",
        "Cited in analysis queries"
      ],

      estimated_impact: "15-25% increase in thought leadership visibility"
    },

    {
      id: "news_commentary",
      type: "media_relations",
      priority: "high",
      timeline: "Ongoing (Weeks 1-12)",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["Financial Services", "Consulting", "Executive"]
      },

      actions: [
        {
          opportunity_type: "Expert quotes",
          monitoring: "SignalDesk monitors HARO, journalist requests",
          response_generation: "AI drafts responses",
          frequency: "2-3 responses per week"
        },
        {
          opportunity_type: "Op-ed pitches",
          pitch_generation: "SignalDesk drafts pitches + articles",
          target_outlets: "Industry publications",
          frequency: "1-2 per month"
        }
      ],

      deliverables: [
        "Weekly HARO opportunities",
        "Pre-written expert quotes",
        "Op-ed pitches + drafts",
        "Media contact list"
      ],

      user_tasks: [
        "Review/approve quotes",
        "Submit to journalists",
        "Build media relationships"
      ],

      time_estimate: "1-2 hours per week",

      success_metrics: [
        "10+ media mentions per quarter",
        "Quoted in tier 1-2 publications",
        "Cited in news queries"
      ],

      estimated_impact: "25-35% increase in authority query visibility"
    }
  ]
}
```

#### Tier 3: Strategic Guidance (SignalDesk Provides Strategy)

```typescript
{
  strategic_guidance: [
    {
      id: "podcast_strategy",
      type: "podcast_appearances",
      priority: "medium",
      timeline: "3-6 months",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["all"]
      },

      strategy: {
        rationale: "Podcast transcripts are indexed by AI but require 3-6 month lead time for booking",
        target_shows: [
          {
            show: "Invest Like the Best",
            audience: "Institutional investors",
            relevance: "High for investment firms",
            how_to_pitch: "Unique market perspective angle"
          },
          {
            show: "The SaaStr Podcast",
            audience: "SaaS founders/executives",
            relevance: "High for B2B SaaS",
            how_to_pitch: "Growth/scaling insights"
          },
          {
            show: "a16z Podcast",
            audience: "Tech/startup community",
            relevance: "High for tech companies",
            how_to_pitch: "Emerging tech trends"
          }
        ],

        approach: {
          positioning: "Position as [industry] expert with [unique perspective]",
          pitch_template: `
            Subject: [Unique Hook] for [Podcast Name]

            Hi [Host Name],

            I'm [Name], [Title] at [Company]. I've been following [Podcast] for [reason] and wanted to reach out about a potential episode.

            [Unique insight/data point that would interest their audience]

            I think your audience would find value in discussing:
            - [Topic 1 with specific angle]
            - [Topic 2 with data/insight]
            - [Topic 3 that ties to current trends]

            [Social proof - previous appearances, media, expertise]

            Would you be open to a conversation about this?

            Best,
            [Name]
          `,
          talking_points: [
            "[Contrarian or unique perspective]",
            "[Data/research you can share exclusively]",
            "[Actionable advice for their audience]",
            "[Stories/examples that illustrate points]"
          ]
        },

        timeline: {
          month_1: "Research target shows, craft pitches",
          month_2: "Send pitches, follow up",
          month_3_6: "Book appearances, prepare talking points"
        },

        estimated_impact: "15-20% increase in brand awareness queries over 12 months"
      },

      deliverables: [
        "Target podcast list (10-15 shows)",
        "Personalized pitch templates",
        "Talking points for each show",
        "Pre-interview prep guide",
        "Post-interview promotion plan"
      ],

      user_responsibility: "Research shows, send pitches, record episodes"
    },

    {
      id: "wikipedia_strategy",
      type: "wikipedia",
      priority: "high",
      timeline: "6-12 months",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["Established companies with notability"],
        requirements: "Must meet Wikipedia notability guidelines"
      },

      strategy: {
        rationale: "Wikipedia is cited in 80% of factual queries but requires meeting strict notability criteria",

        notability_assessment: {
          requirements: [
            "Significant coverage in reliable, independent sources",
            "Multiple substantial news articles (not press releases)",
            "Academic citations or industry recognition",
            "Industry awards or notable achievements"
          ],
          your_status: "Assessment based on company profile"
        },

        approach: {
          step_1: "Build notability (if needed)",
          actions: [
            "Earn tier 1 media coverage",
            "Publish research that gets cited",
            "Win industry awards",
            "Speak at notable conferences"
          ],

          step_2: "Draft article",
          guidelines: [
            "Neutral point of view (NPOV)",
            "Cite all claims with reliable sources",
            "Avoid promotional language",
            "Focus on notability and impact"
          ],

          step_3: "Submit and maintain",
          process: "Articles for Creation (AfC) or direct draft",
          timeline: "2-4 months for approval",
          maintenance: "Monitor for edits, update with new achievements"
        },

        estimated_impact: "50-60% increase in factual query visibility"
      },

      deliverables: [
        "Notability assessment",
        "Source gathering (news articles, citations)",
        "Article draft (if notable)",
        "Submission strategy",
        "Maintenance guidelines"
      ],

      user_responsibility: "Build notability (if needed), review draft, submit article"
    },

    {
      id: "academic_partnerships",
      type: "research_collaboration",
      priority: "low",
      timeline: "6-12 months",
      included_when: {
        objectives: ["thought_leadership"],
        industries: ["Financial Services", "Healthcare", "Technology", "Research"]
      },

      strategy: {
        rationale: "Academic citations add significant credibility to AI responses but require long-term commitment",

        opportunities: [
          {
            type: "Sponsor research study",
            approach: "Fund university research in your industry",
            benefit: "Cited as research sponsor",
            timeline: "12-18 months",
            cost: "$10k-$50k"
          },
          {
            type: "Co-author whitepaper",
            approach: "Collaborate with professor on industry analysis",
            benefit: "Academic credibility",
            timeline: "6-9 months",
            cost: "Time investment"
          },
          {
            type: "Present at academic conference",
            approach: "Submit papers to industry conferences",
            benefit: "Conference proceedings citation",
            timeline: "6-12 months",
            cost: "Travel + time"
          },
          {
            type: "Industry-academic consortium",
            approach: "Join or create research consortium",
            benefit: "Ongoing citation opportunities",
            timeline: "Ongoing",
            cost: "$5k-$25k/year"
          }
        ],

        target_institutions: "SignalDesk researches relevant universities/professors",

        estimated_impact: "20-30% increase in research-based query visibility over 18 months"
      },

      deliverables: [
        "Target institutions list",
        "Collaboration opportunities",
        "Outreach templates",
        "Partnership proposal template"
      ],

      user_responsibility: "Initiate partnerships, provide funding/data, participate in research"
    },

    {
      id: "forum_strategy",
      type: "forum_engagement",
      priority: "low",
      timeline: "Ongoing (optional)",
      included_when: {
        objectives: ["technical_adoption", "thought_leadership"],
        industries: ["Developer Tools", "Technical"]
      },

      strategy: {
        rationale: "Forums have declining AI influence but still valuable for technical communities",

        target_forums: [
          {
            forum: "HackerNews",
            approach: "Technical, data-driven contributions",
            content_types: ["Show HN posts", "Thoughtful comments on energy/tech"],
            guidelines: [
              "No self-promotion",
              "Add genuine value to discussions",
              "Share technical insights"
            ]
          },
          {
            forum: "Industry-specific forums",
            approach: "Expert advice and problem-solving",
            guidelines: [
              "Build reputation over time",
              "Help others without expectation",
              "Link to resources when genuinely helpful"
            ]
          }
        ],

        estimated_impact: "5-10% increase in niche technical visibility"
      },

      deliverables: [
        "Forum engagement guidelines",
        "Content suggestions",
        "Community best practices"
      ],

      user_responsibility: "Participate authentically in communities"
    }
  ]
}
```

---

### Part 4: Content Selection Algorithm

```typescript
interface ContentSelectionInput {
  industry: string
  objective: 'drive_sales' | 'thought_leadership' | 'technical_adoption'
  organization_profile: {
    company_size: 'startup' | 'smb' | 'enterprise'
    budget: 'low' | 'medium' | 'high'
    team_size: number
    technical_capability: 'low' | 'medium' | 'high'
    current_presence: {
      website_traffic: number
      social_following: number
      media_mentions: number
    }
  }
  constraints: {
    timeline: 'urgent' | 'normal' | 'long_term'  // < 4 weeks | 2-3 months | 6+ months
    resources: 'limited' | 'moderate' | 'ample'
  }
  target_queries: string[]
}

function selectOptimalContent(input: ContentSelectionInput): ContentType[] {
  // Step 1: Score all content types
  const scoredContent = ALL_CONTENT_TYPES.map(ct => ({
    ...ct,
    score: calculateScore(ct, input)
  }))

  // Step 2: Filter by constraints
  let filtered = scoredContent
    .filter(ct => ct.industry_fit.includes(input.industry))
    .filter(ct => ct.objective_fit.includes(input.objective))

  if (input.constraints.timeline === 'urgent') {
    filtered = filtered.filter(ct => ct.time_to_impact <= 4) // weeks
  }

  if (input.constraints.resources === 'limited') {
    filtered = filtered.filter(ct =>
      ct.execution_type === 'automated' ||
      (ct.execution_type === 'user_assisted' && ct.effort <= 'medium')
    )
  }

  // Step 3: Prioritize by score
  filtered.sort((a, b) => b.score - a.score)

  // Step 4: Select top 5-8 content types
  const automated = filtered.filter(ct => ct.execution_type === 'automated').slice(0, 4)
  const userAssisted = filtered.filter(ct => ct.execution_type === 'user_assisted').slice(0, 3)
  const strategic = filtered.filter(ct => ct.execution_type === 'strategic').slice(0, 2)

  return [...automated, ...userAssisted, ...strategic]
}

function calculateScore(
  contentType: ContentType,
  input: ContentSelectionInput
): number {
  // Base score = citation rate
  let score = contentType.citation_rate

  // Boost for control level (higher control = higher score)
  score *= contentType.control_level

  // Penalize for time to impact (faster = higher score)
  score /= contentType.time_to_impact_weeks

  // Penalize for effort (lower effort = higher score)
  const effortMultiplier = {
    'low': 1.0,
    'medium': 0.8,
    'high': 0.6,
    'very_high': 0.4
  }
  score *= effortMultiplier[contentType.effort]

  // Boost for budget fit
  if (input.organization_profile.budget === 'low' && contentType.cost === 'low') {
    score *= 1.2
  }

  // Boost for technical fit
  if (contentType.requires_technical && input.organization_profile.technical_capability === 'high') {
    score *= 1.3
  }

  // Boost for existing presence
  if (contentType.leverages_existing_content && input.organization_profile.current_presence.website_traffic > 10000) {
    score *= 1.2
  }

  return score
}
```

---

### Part 5: Resource Requirements

```typescript
{
  content_summary: {
    automated_actions: 6,
    user_assisted_actions: 5,
    strategic_guidance: 3,
    total_deliverables: 47
  },

  time_estimates: {
    automated: "SignalDesk handles (user clicks Execute)",
    user_assisted: "8-12 hours/week",
    strategic: "2-4 hours/month"
  },

  cost_estimates: {
    signaldesk_execution: "$0 (included in platform)",
    external_costs: {
      comparison_sites: "$0 (free listings)",
      video_production: "$0-$2,000 (DIY to professional)",
      podcast_travel: "$0-$1,000 (if remote, $0)",
      research_sponsorship: "$10,000-$50,000 (optional)"
    },
    total_range: "$0-$53,000 (most scenarios $0-$2,000)"
  },

  team_requirements: {
    signaldesk_handles: [
      "Content writing",
      "Research",
      "Strategy",
      "Schema optimization",
      "Documentation generation"
    ],
    user_handles: [
      "Video recording (optional - can skip)",
      "Platform account management",
      "Relationship building",
      "Final approval/customization"
    ]
  }
}
```

---

### Part 6: Execution Roadmap

```typescript
{
  week_by_week: [
    {
      week: 1,
      phase: "Foundation",
      automated: [
        "Execute schema updates",
        "Generate FAQ schema",
        "Begin documentation generation"
      ],
      user_assisted: [
        "Set up G2/Capterra accounts",
        "Upload profile content (SignalDesk provides)"
      ],
      strategic: [
        "Review podcast target list",
        "Begin Wikipedia notability assessment"
      ],
      milestones: [
        "All schemas deployed",
        "Comparison site profiles live"
      ]
    },
    {
      week: 2,
      phase: "Content Launch",
      automated: [
        "Publish documentation",
        "Generate case studies",
        "First LinkedIn post"
      ],
      user_assisted: [
        "Send review request emails",
        "Script first YouTube video"
      ],
      strategic: [
        "Send podcast pitches"
      ],
      milestones: [
        "Documentation indexed",
        "First case study published"
      ]
    },
    {
      week: 3,
      phase: "Momentum Building",
      automated: [
        "2-3 LinkedIn posts",
        "Blog content",
        "Press release #1"
      ],
      user_assisted: [
        "Record YouTube video #1",
        "First Stack Overflow answer"
      ],
      milestones: [
        "Video published",
        "10+ G2 reviews collected"
      ]
    },
    // ... weeks 4-12 ...
  ],

  critical_path: [
    "Week 1: Schema deployment (enables all schema-based visibility)",
    "Week 2: Documentation live (enables 'how to' queries)",
    "Week 3: Comparison site reviews (enables 'best X' queries)",
    "Week 4: First content citations (validates strategy)"
  ]
}
```

---

## Example: Full Blueprint for B2B SaaS Driving Sales

```json
{
  "campaign_goal": "Increase visibility in AI search results for 'best CRM' queries by 60% over 12 weeks",

  "geoIntelligenceAnalysis": {
    "target_queries": [
      "best CRM for small business",
      "CRM software comparison",
      "alternatives to Salesforce"
    ],
    "platform_priorities": {
      "chatgpt": {"importance": "critical", "current_visibility": "weak"},
      "claude": {"importance": "high", "current_visibility": "moderate"}
    },
    "source_analysis": {
      "high_impact": [
        {"source": "G2/Capterra", "citation_rate": 65, "gap_severity": "critical"},
        {"source": "Documentation", "citation_rate": 75, "gap_severity": "high"}
      ]
    }
  },

  "threeTierContentStrategy": {
    "automated": [
      {
        "id": "schema_optimization",
        "priority": "critical",
        "timeline": "Week 1",
        "deliverables": ["Product schema with ratings", "FAQPage schema", "Enhanced Org schema"]
      },
      {
        "id": "product_documentation",
        "priority": "critical",
        "timeline": "Weeks 1-2",
        "deliverables": ["30-page feature docs", "API reference", "Comparison guide"]
      },
      {
        "id": "case_studies",
        "priority": "high",
        "timeline": "Weeks 2-3",
        "deliverables": ["5 customer success stories", "ROI calculator"]
      }
    ],

    "user_assisted": [
      {
        "id": "comparison_site_optimization",
        "priority": "critical",
        "timeline": "Weeks 1-4",
        "user_tasks": ["Upload profile content", "Send review requests"],
        "time_estimate": "3 hours setup + 1 hour/week"
      },
      {
        "id": "youtube_content",
        "priority": "high",
        "timeline": "Weeks 2-6",
        "user_tasks": ["Record 3 videos", "Upload to YouTube"],
        "time_estimate": "1 day per video"
      }
    ],

    "strategic": [
      {
        "id": "podcast_strategy",
        "priority": "medium",
        "timeline": "3-6 months",
        "deliverables": ["Target list", "Pitch templates", "Talking points"]
      }
    ]
  },

  "resourceRequirements": {
    "automated_actions": 3,
    "user_assisted_actions": 2,
    "time_per_week": "4-6 hours",
    "cost": "$0-$2,000 (video production)"
  },

  "executionRoadmap": {
    "week_1": {
      "automated": ["Schema updates", "Begin docs"],
      "user_assisted": ["Set up G2 account"],
      "milestones": ["Schemas deployed"]
    }
  }
}
```

---

## Summary: What's Different in V2

### Removed
- ❌ Reddit AMAs (low citation rate 10-20%)
- ❌ Generic social media (Facebook/Instagram - <5% citation)
- ❌ Low-value activities

### Added
- ✅ 12 high-citation content types (30-80% citation rates)
- ✅ Industry-adaptive selection algorithm
- ✅ Objective-based prioritization (sales vs thought leadership vs technical)
- ✅ Documentation (75% citation, full control)
- ✅ Comparison site optimization (65% citation, easy)
- ✅ LinkedIn thought leadership (45% citation, fast)
- ✅ Case studies (60% citation, automated)
- ✅ Stack Overflow/GitHub (70%+ citation, technical)
- ✅ YouTube tutorials (50% citation, visual)
- ✅ Quora expert answers (35% citation, Q&A)
- ✅ Medium articles (35% citation, thought leadership)
- ✅ News commentary (60% citation, authority)

### Improved
- ✅ Content types selected based on industry + objective
- ✅ Scoring algorithm prioritizes high-citation + low-effort
- ✅ Clear execution tiers (automated vs user-assisted vs strategic)
- ✅ Realistic time estimates
- ✅ Controllable content (you own/create most of it)

---

*Blueprint V2 Complete: November 2, 2025*
*Focus: High-citation, industry-adaptive, objective-driven content*
