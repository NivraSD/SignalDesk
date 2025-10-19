 Key Tables for Opportunity Engine:

  1. intelligence_stage_results - Store enriched data from pipeline stages
  2. opportunities - Store detected opportunities
  3. intelligence_runs - Track pipeline executions

  Proposed Architecture Changes:

  1. Store Enriched Data Separately

  After monitorstage2enrichment, store the enriched data in intelligence_stage_results:

  // In intelligence-orchestrator-v2
  const storeEnrichedData = async (runId, enrichedData) => {
    await supabase.from('intelligence_stage_results').insert({
      run_id: runId,
      stage_name: 'enriched_data_pool',
      stage_index: 4,
      status: 'completed',
      data: {
        entities: enrichedData.entities,
        events: enrichedData.events,
        articles: enrichedData.articles,
        sentiment: enrichedData.sentiment,
        trends: enrichedData.trends
      }
    });
  };

  2. Create Parallel Opportunity Detection

  Build a new mcp-opportunity-detector that runs independently:

  // New edge function: mcp-opportunity-detector
  const detectOpportunities = async (organizationId) => {
    // Get latest enriched data
    const { data: enrichedData } = await supabase
      .from('intelligence_stage_results')
      .select('*')
      .eq('stage_name', 'enriched_data_pool')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Run multiple detection strategies
    const opportunities = await Promise.all([
      detectCrisisOpportunities(enrichedData),
      detectTrendingOpportunities(enrichedData),
      detectCompetitorWeakness(enrichedData),
      detectRegulatoryFirst(enrichedData),
      detectMilestoneOpportunities(enrichedData)
    ]);

    // Store in opportunities table
    for (const opp of opportunities.flat()) {
      await supabase.from('opportunities').insert({
        organization_id: organizationId,
        title: opp.title,
        description: opp.description,
        score: opp.score,
        urgency: opp.urgency,
        time_window: opp.timeWindow,
        category: opp.type,
        data: opp.context,
        expires_at: opp.expiresAt
      });
    }
  };



  4. Create Opportunity Scoring Algorithm

  // In mcp-opportunities
  const scoreOpportunity = (opportunity) => {
    const scores = {
      urgency: calculateUrgency(opportunity), // 0-100 based on time window
      impact: calculateImpact(opportunity),    // 0-100 based on potential reach
      effort: calculateEffort(opportunity),    // 0-100 (inverse - lower effort = higher score)
      uniqueness: calculateUniqueness(opportunity), // 0-100 based on competitor activity
      confidence: calculateConfidence(opportunity)  // 0-100 based on data quality
    };

    // Weighted scoring
    const totalScore =
      (scores.urgency * 0.30) +
      (scores.impact * 0.25) +
      (scores.effort * 0.15) +
      (scores.uniqueness * 0.20) +
      (scores.confidence * 0.10);

    return {
      ...scores,
      total: Math.round(totalScore)
    };
  };

  5. Update Pipeline Flow

  // Modified intelligence-orchestrator-v2
  const runPipeline = async (organizationId) => {
    const runId = await createRun(organizationId);

    // Stages 1-4: Collect and enrich
    const discovery = await mcpDiscovery(organizationId);
    const monitored1 = await monitorStage1(discovery);
    const relevant = await monitorStage2Relevance(monitored1);
    const enriched = await monitorStage2Enrichment(relevant);

    // Store enriched data for parallel processing
    await storeEnrichedData(runId, enriched);

    // Parallel processing
    const [synthesis, opportunities] = await Promise.all([
      // Track 1: Executive Intelligence
      mcpExecutiveSynthesis(enriched),

      // Track 2: Opportunity Detection (NEW)
      mcpOpportunityDetector(organizationId, runId)
    ]);

    return { synthesis, opportunities };
  };

  6. Add Real-time Opportunity Monitoring

  // Create monitoring_alerts when high-score opportunities detected
  const createOpportunityAlert = async (opportunity) => {
    if (opportunity.score >= 85 || opportunity.urgency === 'high') {
      await supabase.from('monitoring_alerts').insert({
        organization_id: opportunity.organization_id,
        type: 'opportunity',
        severity: opportunity.urgency === 'high' ? 'critical' : 'high',
        title: `High-Value Opportunity: ${opportunity.title}`,
        message: opportunity.description,
        data: opportunity
      });
    }
  };


      channels: Channel[]            // Where to execute
      markets: string[]              // Geographic/demographic targets
      platforms: Platform[]          // Digital/physical locations
    }

    when: {
      start_immediately: boolean
      ideal_launch: string           // Optimal timing
      milestones: Milestone[]        // Key dates and deadlines
      duration: string               // How long the campaign runs
    }

    why: {
      strategic_rationale: string    // Why this matters now
      expected_outcomes: string[]    // What we'll achieve
      risks_if_not_done: string[]    // Cost of inaction
    }

    how: {
      approach: string               // Strategy/methodology
      resources_required: Resource[]
      budget_estimate?: string
      execution_steps: Step[]        // Detailed playbook
    }

    how_much: {
      effort_level: 'low' | 'medium' | 'high'
      resource_hours: number
      budget_range?: string
      expected_roi: string
    }
  }

  Specific Recommendation Types

  1. Crisis Response Recommendations

  {
    what: {
      primary_action: "Issue CEO statement within 2 hours",
      specific_tasks: [
        "Draft empathetic response acknowledging the issue",
        "Get legal review of statement",
        "Prepare Q&A document for media inquiries",
        "Update website crisis communications page"
      ],
      deliverables: [
        "CEO video statement (2 minutes)",
        "Written press release (400 words)",
        "Internal employee communication",
        "Social media response templates"
      ]
    },
    who: {
      owner: "Chief Communications Officer",
      team: ["CEO", "Legal Counsel", "Head of Social Media"],
      external_partners: ["Crisis PR firm - Weber Shandwick"],
      approvals_needed: ["CEO", "Board Chair", "Legal"]
    },
    where: {
      channels: ["Company blog", "Twitter/X", "LinkedIn", "Email to stakeholders"],
      platforms: ["Earned media through PR outreach", "Owned website", "Employee intranet"]
    },
    when: {
      start_immediately: true,
      milestones: [
        { time: "0-2 hours", action: "Initial statement" },
        { time: "2-6 hours", action: "Media outreach" },
        { time: "6-24 hours", action: "Stakeholder communications" },
        { time: "24-48 hours", action: "Follow-up with updates" }
      ]
    }
  }

  2. Competitive Response Recommendations

  {
    what: {
      primary_action: "Launch comparative campaign highlighting our advantages",
      specific_tasks: [
        "Create comparison matrix of features vs competitor",
        "Develop 'switch to us' incentive program",
        "Prepare sales battlecards for team",
        "Schedule analyst briefings"
      ]
    },
    who: {
      owner: "VP of Marketing",
      team: ["Product Marketing Manager", "Sales Enablement Lead", "Content Team"],
      external_partners: ["Digital agency for campaign creative"],
      approvals_needed: ["CMO", "Legal (for comparative claims)"]
    },
    where: {
      channels: ["Google Ads targeting competitor keywords", "Industry publications", "Sales collateral"],
      markets: ["Primary: Enterprise accounts", "Secondary: Mid-market"]
    }
  }

  3. Thought Leadership Recommendations

  {
    what: {
      primary_action: "Position CEO as industry expert on emerging trend",
      specific_tasks: [
        "Ghost-write op-ed for Wall Street Journal",
        "Book speaking slot at industry conference",
        "Create research report with proprietary data",
        "Pitch for podcast interviews"
      ]
    },
    who: {
      owner: "VP of Communications",
      team: ["CEO", "Research team", "PR agency"],
      external_partners: ["Speaker bureau", "PR firm for media relations"]
    },
    where: {
      channels: ["Tier 1 media", "Industry conferences", "LinkedIn thought leadership"],
      platforms: ["WSJ", "TechCrunch", "Industry podcasts"]
    }
  }

  Implementation Approach

  1. Create mcp-recommendation-engine

  // New edge function
  const generateRecommendations = async (opportunity) => {
    // Determine opportunity type
    const oppType = classifyOpportunity(opportunity);

    // Get organization context
    const orgContext = await getOrganizationContext(opportunity.organization_id);

    // Generate specific recommendations based on type
    const recommendations = await generateByType(oppType, opportunity, orgContext);

    // Add execution templates
    const withTemplates = await addExecutionTemplates(recommendations);

    // Calculate resource requirements
    const withResources = calculateResources(withTemplates);

    return {
      opportunity,
      recommendations: withResources,
      execution_ready: true
    };
  };

  2. Recommendation Templates by Opportunity Type

  const recommendationTemplates = {
    CRISIS: {
      what: ["Immediate response", "Stakeholder comms", "Media management"],
      who: ["Crisis team", "CEO", "Legal"],
      when: "0-24 hours",
      where: ["All channels", "Priority on owned media"],
      how: "Crisis response protocol"
    },

    COMPETITIVE_THREAT: {
      what: ["Defensive positioning", "Customer retention", "Counter-narrative"],
      who: ["Marketing", "Sales", "Product"],
      when: "1-2 weeks",
      where: ["Customer channels", "Trade media"],
      how: "Competitive response playbook"
    },

    TRENDING_TOPIC: {
      what: ["Content creation", "Social engagement", "Newsjacking"],
      who: ["Social team", "Content team", "SMEs"],
      when: "0-6 hours",
      where: ["Social media", "Blog", "Earned media"],
      how: "Rapid response content protocol"
    },

    REGULATORY_CHANGE: {
      what: ["Compliance assessment", "Public position", "Customer communication"],
      who: ["Legal", "Compliance", "Government affairs"],
      when: "Before effective date",
      where: ["Regulatory filings", "Customer comms", "Media"],
      how: "Regulatory response framework"
    }
  }

  3. Dynamic Task Generation

  const generateSpecificTasks = (opportunity, template, orgContext) => {
    // Use AI to make tasks specific to the organization
    const prompt = `
      Given this opportunity: ${opportunity.description}
      For organization: ${orgContext.name} in ${orgContext.industry}
      Using template: ${template}
      
      Generate specific, actionable tasks:
      1. What exact content to create (headlines, key messages)
      2. Which specific people/roles to involve
      3. Exact channels and platforms to use
      4. Specific timelines with hours/days
      5. Measurable success metrics
    `;

    return await generateWithAI(prompt);
  };

  4. Resource Calculation

  const calculateResources = (recommendation) => {
    const resources = {
      human: {
        internal_hours: 0,
        external_hours: 0,
        key_people: []
      },
      financial: {
        min_budget: 0,
        max_budget: 0,
        breakdown: {}
      },
      time: {
        setup_time: "",
        execution_time: "",
        total_duration: ""
      },
      tools: {
        required: [],
        optional: []
      }
    };

    // Calculate based on tasks
    recommendation.what.specific_tasks.forEach(task => {
      resources.human.internal_hours += estimateHours(task);
    });

    // Add channel costs
    recommendation.where.channels.forEach(channel => {
      resources.financial.breakdown[channel] = estimateCost(channel);
    });

    return resources;
  };

  5. Success Metrics & Tracking

  const defineSuccessMetrics = (opportunity, recommendation) => {
    return {
      immediate: [  // 0-48 hours
        "Statement published",
        "Media coverage secured",
        "Stakeholder notifications sent"
      ],
      short_term: [  // 1 week
        "Sentiment improvement",
        "Share of voice increase",
        "Customer retention rate"
      ],
      long_term: [  // 1 month
        "Brand perception scores",
        "Market share impact",
        "Revenue protection/growth"
      ],
      tracking: {
        dashboards: ["Google Analytics", "Brandwatch", "Salesforce"],
        reports: ["Daily media summary", "Weekly sentiment report"],
        alerts: ["Mention spike", "Sentiment shift", "Competitor action"]
      }
    };
  };