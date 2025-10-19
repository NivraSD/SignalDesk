// campaignIntelligenceController.js - Enhanced controller for Campaign Intelligence
const claudeService = require("../../config/claude");
const pool = require("../../config/database");

// Generate comprehensive McKinsey-style market analysis
const generateMarketAnalysis = async (req, res) => {
  try {
    const { brief, campaignType, template } = req.body;
    const userId = req.user.id;

    if (!brief) {
      return res.status(400).json({
        success: false,
        message: "Campaign details are required",
      });
    }

    // Parse out key information from the master prompt
    const analysisPrompt = `You are a McKinsey senior partner creating a comprehensive market intelligence report.
      
      Campaign Type: ${campaignType}
      Campaign Details: ${brief}
      
      Analyze the provided information and create a detailed market intelligence report with these sections:
      
      1. EXECUTIVE SUMMARY
      - 3-4 paragraph synthesis of key findings
      - Critical insights and strategic implications
      - Clear recommendations for moving forward
      
      2. MARKET CONTEXT & DYNAMICS
      - Market size: Specific TAM/SAM/SOM with numbers
      - Growth rate: CAGR and projections
      - Key trends: 5-7 major trends shaping the market
      - Market drivers: Forces creating opportunity
      - Regulatory environment
      - Technology disruptions
      
      3. COMPETITIVE LANDSCAPE
      - Major players and market share
      - Competitive positioning matrix
      - Strengths and weaknesses of key competitors
      - White space opportunities
      - Competitive moats and barriers
      
      4. TARGET AUDIENCE INSIGHTS
      - Detailed buyer personas (3-4 types)
      - Decision-making process and criteria
      - Pain points and unmet needs
      - Budget allocation patterns
      - Channel preferences and media consumption
      - Psychographic profiles
      
      5. STRATEGIC OPPORTUNITIES
      - 5-7 specific opportunities ranked by impact
      - Market gaps to exploit
      - Partnership possibilities
      - Innovation areas
      - Geographic expansion options
      
      6. RISK ASSESSMENT
      - Major risks and probability/impact matrix
      - Market headwinds
      - Competitive threats
      - Execution challenges
      - Mitigation strategies for each risk
      
      7. CHANNEL ANALYSIS
      - Channel effectiveness by audience segment
      - Cost per acquisition by channel
      - Channel saturation levels
      - Emerging channels to consider
      - Integrated channel strategies
      
      8. STRATEGIC RECOMMENDATIONS
      - Top 5 strategic imperatives
      - Quick wins vs. long-term plays
      - Resource allocation guidance
      - Success metrics framework
      
      Format as a detailed JSON object with rich, specific content. Include data points, percentages, and concrete examples throughout. Make it feel like a real McKinsey report with depth and insight.
    `;

    console.log('Calling Claude service for market analysis...');
    const analysisResponse = await claudeService.sendMessage(analysisPrompt);
    console.log('Claude response received, length:', analysisResponse?.length);

    // Parse the response
    let analysis;
    try {
      analysis = JSON.parse(analysisResponse);
    } catch (e) {
      // Create structured fallback
      analysis = {
        executiveSummary: analysisResponse.substring(0, 500),
        marketContext: {
          size: "Market size analysis based on available data",
          growth: "Growth projections and trends",
          trends: "Key market trends identified",
          drivers: "Primary market drivers",
        },
        competitiveLandscape: {
          overview: "Competitive market analysis",
          keyPlayers: ["Competitor 1", "Competitor 2", "Competitor 3"],
          opportunities: "White space opportunities identified",
        },
        targetAudience: {
          personas: "Detailed buyer personas",
          painPoints: "Key pain points and needs",
          preferences: "Channel and content preferences",
        },
        opportunities: ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
        risks: {
          major: "Key risks identified",
          mitigation: "Risk mitigation strategies",
        },
        recommendations: [
          "Recommendation 1",
          "Recommendation 2",
          "Recommendation 3",
        ],
      };
    }

    res.json({
      success: true,
      analysis,
      message: "Market analysis generated successfully",
    });
  } catch (error) {
    console.error("Error in generateMarketAnalysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate market analysis",
      error: error.message,
    });
  }
};

// Generate comprehensive campaign strategy with strategic pillars
const generateCampaignConcept = async (req, res) => {
  try {
    const { brief, analysis, template } = req.body;
    const userId = req.user.id;

    if (!brief || !analysis) {
      return res.status(400).json({
        success: false,
        message: "Brief and analysis are required",
      });
    }

    // Parse budget and timeline from the master prompt
    const budgetMatch = brief.match(
      /\$?([\d,]+k?)\s*(-|to)?\s*\$?([\d,]+k?)?/i
    );
    const timelineMatch = brief.match(
      /(\d+)\s*(weeks?|months?|quarters?|years?)/i
    );

    const budget = budgetMatch
      ? budgetMatch[1].replace(/[^\d]/g, "") *
        (budgetMatch[1].includes("k") ? 1000 : 1)
      : 50000;
    const timeline = timelineMatch
      ? `${timelineMatch[1]} ${timelineMatch[2]}`
      : "3 months";

    const strategyPrompt = `
      Based on the market analysis, create a comprehensive campaign strategy.
      
      Market Analysis: ${JSON.stringify(analysis)}
      Campaign Brief: ${brief}
      Template: ${JSON.stringify(template)}
      
      Develop a strategic campaign plan with:
      
      1. CAMPAIGN OVERVIEW
      - Campaign name (creative and memorable)
      - Compelling description (2-3 sentences)
      - Primary goal (specific and measurable)
      - Target audience (detailed description)
      - Unique value proposition
      
      2. STRATEGIC PILLARS (4-5 pillars)
      For each pillar provide:
      - Title: Clear, action-oriented name
      - Description: What this pillar encompasses
      - Key Initiatives: 3-4 specific initiatives
      - Success Metrics: How we measure this pillar
      - Resources Required: What's needed to execute
      
      3. CAMPAIGN PHASES
      Create detailed phases with:
      - Phase name and duration
      - Objectives for each phase
      - Key activities and deliverables
      - Success criteria
      - Dependencies and prerequisites
      
      4. DETAILED TASK BREAKDOWN
      For each phase, create 5-7 specific tasks with:
      - Task name and description
      - Priority (critical/high/medium/low)
      - Estimated duration
      - Required deliverables (list 2-3 per task)
      - Dependencies
      - Assignee role (e.g., "Content Manager", "PR Lead")
      - Tags (e.g., "content", "media", "analytics")
      
      5. CHANNEL STRATEGY
      For each channel:
      - Channel rationale
      - Specific tactics (3-5 per channel)
      - Content requirements
      - Budget allocation percentage
      - Expected outcomes
      
      6. BUDGET ALLOCATION
      - Detailed breakdown by category
      - Phase-wise distribution
      - ROI expectations
      - Contingency planning (10%)
      
      7. MEASUREMENT FRAMEWORK
      - Primary KPIs (5-7 metrics)
      - Secondary metrics
      - Tracking methodology
      - Reporting cadence
      - Success benchmarks
      
      Format as a comprehensive JSON object. Make everything specific, actionable, and data-driven.
    `;

    const strategyResponse = await claudeService.sendMessage(strategyPrompt);

    // Parse the response
    let concept;
    try {
      concept = JSON.parse(strategyResponse);
    } catch (e) {
      // Enhanced fallback structure
      concept = {
        name: `Strategic ${template.name} Campaign`,
        description:
          "A comprehensive campaign to achieve market leadership and drive measurable business results through integrated marketing efforts.",
        primaryGoal: `Generate ${Math.round(
          budget / 500
        )} qualified leads and achieve 25% market share growth`,
        targetAudience:
          "Decision makers and influencers in target market segments",
        valueProposition: "Unique value that sets us apart from competitors",
        budget: budget,
        timeline: timeline,

        strategicPillars: [
          {
            title: "Thought Leadership & Authority",
            description: "Establish dominant voice in industry conversations",
            initiatives: [
              "Executive speaking program",
              "Industry research publication",
              "Expert content series",
              "Media commentary program",
            ],
            metrics: "Media mentions, speaking invitations, content engagement",
            resources: "Content team, PR agency, executive time",
          },
          {
            title: "Digital-First Engagement",
            description: "Build scalable digital presence across key channels",
            initiatives: [
              "SEO content strategy",
              "Social media activation",
              "Email nurture campaigns",
              "Webinar series",
            ],
            metrics: "Web traffic, engagement rate, lead quality score",
            resources: "Digital team, marketing automation, content creators",
          },
          {
            title: "Strategic Partnerships",
            description: "Leverage ecosystem for accelerated growth",
            initiatives: [
              "Technology partner integrations",
              "Co-marketing campaigns",
              "Channel partner enablement",
              "Industry association engagement",
            ],
            metrics:
              "Partner-sourced leads, co-marketing reach, integration adoption",
            resources:
              "Partnership team, co-marketing budget, enablement materials",
          },
          {
            title: "Customer Success Amplification",
            description: "Turn customers into advocates and growth drivers",
            initiatives: [
              "Case study development",
              "Customer advisory board",
              "Referral program",
              "Success story amplification",
            ],
            metrics: "NPS score, referral rate, case study production",
            resources: "Customer success team, incentive budget, content team",
          },
        ],

        budgetAllocation: {
          "Paid Media": "35%",
          "Content Creation": "25%",
          "Events & Experiences": "20%",
          "Technology & Tools": "10%",
          Partnerships: "5%",
          Contingency: "5%",
        },
      };
    }

    res.json({
      success: true,
      concept,
      message: "Campaign strategy generated successfully",
    });
  } catch (error) {
    console.error("Error in generateCampaignConcept:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate campaign concept",
      error: error.message,
    });
  }
};

// Generate full campaign execution plan with Kanban-ready tasks
const generateFromConcept = async (req, res) => {
  try {
    const { templateId, template, brief, analysis, concept } = req.body;
    const userId = req.user.id;

    if (!concept || !brief) {
      return res.status(400).json({
        success: false,
        message: "Campaign concept and brief are required",
      });
    }

    const executionPrompt = `
      Create a detailed campaign execution plan based on the strategy.
      
      Strategy: ${JSON.stringify(concept)}
      Brief: ${brief}
      
      Generate a comprehensive execution plan with:
      
      1. ENHANCED PHASES
      For each phase, create:
      - Detailed phase information
      - 7-10 specific tasks per phase
      - Clear deliverables and outcomes
      
      2. KANBAN-READY TASKS
      Each task must include:
      - name: Clear task title
      - description: Detailed description
      - priority: critical/high/medium/low
      - assignee: Role responsible (e.g., "Marketing Manager")
      - dueDate: Relative timing (e.g., "Week 2")
      - tags: Relevant labels (e.g., ["content", "urgent", "media"])
      - status: Default to "backlog"
      - deliverables: Array of 2-3 specific deliverables
      - dependencies: Array of related task IDs
      - estimatedHours: Number of hours
      
      3. RESOURCES
      Create 8-10 campaign resources:
      - Templates and toolkits
      - Brand guidelines
      - Training materials
      - Measurement dashboards
      - Process documentation
      
      4. CONTENT BRIEFS
      Create 6-8 detailed content briefs:
      - Various content types
      - Clear objectives
      - Target audience
      - Key messages
      - Distribution strategy
      
      5. PERFORMANCE METRICS
      Detailed metrics framework:
      - Real-time tracking metrics
      - Performance benchmarks
      - Alert thresholds
      - Reporting templates
      
      6. CHANNEL-SPECIFIC PLANS
      For each channel:
      - Detailed execution timeline
      - Content calendar
      - Budget allocation
      - Performance targets
      
      Format as a comprehensive JSON object optimized for the Kanban board and performance tracking.
    `;

    const executionResponse = await claudeService.sendMessage(executionPrompt);

    // Parse the response
    let campaign;
    try {
      campaign = JSON.parse(executionResponse);
    } catch (e) {
      // Create comprehensive fallback
      campaign = {
        id: Date.now(),
        name: concept.name,
        description: concept.description,
        status: "Active",
        duration: concept.timeline,
        budget: {
          total: concept.budget || 50000,
          allocated: 0,
          remaining: concept.budget || 50000,
        },

        phases: [
          {
            name: "Research & Planning",
            duration: "2 weeks",
            description:
              "Conduct market research and finalize campaign strategy",
            tasks: [
              {
                name: "Competitive Analysis Deep Dive",
                description:
                  "Analyze top 10 competitors' campaigns and strategies",
                priority: "high",
                assignee: "Strategy Lead",
                dueDate: "Week 1",
                tags: ["research", "strategy"],
                status: "backlog",
                deliverables: [
                  "Competitive analysis report",
                  "SWOT analysis matrix",
                  "Opportunity map",
                ],
                estimatedHours: 16,
              },
              {
                name: "Audience Research & Personas",
                description:
                  "Develop detailed buyer personas based on research",
                priority: "high",
                assignee: "Research Analyst",
                dueDate: "Week 1",
                tags: ["research", "audience"],
                status: "backlog",
                deliverables: [
                  "3-4 detailed buyer personas",
                  "Journey mapping documentation",
                  "Interview insights report",
                ],
                estimatedHours: 20,
              },
              {
                name: "Messaging Framework Development",
                description: "Create core messaging and value propositions",
                priority: "critical",
                assignee: "Content Strategist",
                dueDate: "Week 2",
                tags: ["content", "strategy"],
                status: "backlog",
                deliverables: [
                  "Messaging framework document",
                  "Value proposition canvas",
                  "Elevator pitch variations",
                ],
                estimatedHours: 12,
              },
            ],
          },
          {
            name: "Content & Creative Development",
            duration: "3 weeks",
            description: "Develop all campaign content and creative assets",
            tasks: [
              {
                name: "Hero Content Creation",
                description: "Develop flagship content pieces for campaign",
                priority: "critical",
                assignee: "Content Manager",
                dueDate: "Week 4",
                tags: ["content", "creative"],
                status: "backlog",
                deliverables: [
                  "Hero video script and production",
                  "Pillar content pieces (3-5)",
                  "Interactive content assets",
                ],
                estimatedHours: 40,
              },
              {
                name: "Design System & Templates",
                description: "Create visual design system and templates",
                priority: "high",
                assignee: "Creative Director",
                dueDate: "Week 3",
                tags: ["design", "creative"],
                status: "backlog",
                deliverables: [
                  "Brand guidelines for campaign",
                  "Design template library",
                  "Social media asset kit",
                ],
                estimatedHours: 32,
              },
            ],
          },
          {
            name: "Launch & Amplification",
            duration: "2 weeks",
            description: "Execute campaign launch and initial amplification",
            tasks: [
              {
                name: "Media Outreach Campaign",
                description: "Execute comprehensive media relations program",
                priority: "critical",
                assignee: "PR Manager",
                dueDate: "Week 6",
                tags: ["media", "launch"],
                status: "backlog",
                deliverables: [
                  "Media list with 100+ contacts",
                  "Customized pitch templates",
                  "Press kit and materials",
                ],
                estimatedHours: 24,
              },
              {
                name: "Influencer Activation",
                description: "Engage and activate influencer partners",
                priority: "high",
                assignee: "Influencer Manager",
                dueDate: "Week 6",
                tags: ["influencer", "social"],
                status: "backlog",
                deliverables: [
                  "Influencer partnership agreements",
                  "Content collaboration briefs",
                  "Tracking and measurement setup",
                ],
                estimatedHours: 20,
              },
            ],
          },
          {
            name: "Optimization & Scale",
            duration: "4 weeks",
            description: "Optimize performance and scale successful tactics",
            tasks: [
              {
                name: "Performance Analysis & Optimization",
                description: "Analyze campaign performance and optimize",
                priority: "high",
                assignee: "Analytics Lead",
                dueDate: "Week 8",
                tags: ["analytics", "optimization"],
                status: "backlog",
                deliverables: [
                  "Performance analysis report",
                  "Optimization recommendations",
                  "A/B test results",
                ],
                estimatedHours: 16,
              },
            ],
          },
        ],

        resources: [
          {
            title: "Campaign Playbook",
            description: "Complete guide to executing the campaign",
            type: "document",
            url: "#",
          },
          {
            title: "Brand Asset Library",
            description: "All creative assets and templates",
            type: "creative",
            url: "#",
          },
          {
            title: "Analytics Dashboard",
            description: "Real-time campaign performance tracking",
            type: "dashboard",
            url: "#",
          },
          {
            title: "Media Kit",
            description: "Press materials and media resources",
            type: "media",
            url: "#",
          },
          {
            title: "Training Videos",
            description: "Team training and enablement content",
            type: "video",
            url: "#",
          },
        ],

        contentBriefs: [
          {
            id: "brief-1",
            type: "thought-leadership",
            title: "Industry Vision Whitepaper",
            brief:
              "Establish thought leadership with comprehensive industry analysis",
            audience: "C-suite executives and decision makers",
            dueDate: "Week 3",
            assignee: "Content Strategist",
          },
          {
            id: "brief-2",
            type: "video",
            title: "Hero Campaign Video",
            brief: "Create emotional connection with target audience",
            audience: "Primary target segments",
            dueDate: "Week 4",
            assignee: "Video Producer",
          },
          {
            id: "brief-3",
            type: "social-campaign",
            title: "Social Media Campaign Series",
            brief: "Drive engagement and amplification across social channels",
            audience: "Social media followers and influencers",
            dueDate: "Week 5",
            assignee: "Social Media Manager",
          },
          {
            id: "brief-4",
            type: "email-series",
            title: "Nurture Email Campaign",
            brief: "Convert leads through targeted email journey",
            audience: "Qualified leads and prospects",
            dueDate: "Week 5",
            assignee: "Email Marketing Manager",
          },
        ],

        metrics: [
          {
            metric: "Campaign Reach",
            target: "2.5M impressions",
            current: 0,
            unit: "impressions",
            category: "Awareness",
          },
          {
            metric: "Engagement Rate",
            target: "4.5%",
            current: 0,
            unit: "percentage",
            category: "Engagement",
          },
          {
            metric: "Lead Generation",
            target: "1,000 MQLs",
            current: 0,
            unit: "leads",
            category: "Conversion",
          },
          {
            metric: "Media Mentions",
            target: "50 placements",
            current: 0,
            unit: "mentions",
            category: "PR",
          },
          {
            metric: "Pipeline Value",
            target: "$500K",
            current: 0,
            unit: "currency",
            category: "Revenue",
          },
        ],

        measurementFramework: {
          primaryKPIs: [
            {
              metric: "Lead Generation",
              target: "1,000 qualified leads",
              measurement: "Marketing automation tracking",
              frequency: "Daily",
              category: "Conversion",
            },
            {
              metric: "Brand Awareness Lift",
              target: "25% increase",
              measurement: "Brand study survey",
              frequency: "Monthly",
              category: "Awareness",
            },
            {
              metric: "Engagement Rate",
              target: "4.5% average",
              measurement: "Platform analytics",
              frequency: "Weekly",
              category: "Engagement",
            },
          ],
          tracking:
            "Comprehensive tracking through marketing automation, analytics platforms, and custom dashboards with real-time reporting.",
        },
      };
    }

    // Calculate initial task counts
    let totalTasks = 0;
    campaign.phases?.forEach((phase) => {
      totalTasks += phase.tasks?.length || 0;
    });

    campaign.taskCount = totalTasks;
    campaign.tasks = campaign.phases?.flatMap((phase) => phase.tasks) || [];

    res.json({
      success: true,
      campaign,
      message: "Campaign execution plan generated successfully",
    });
  } catch (error) {
    console.error("Error in generateFromConcept:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate campaign plan",
      error: error.message,
    });
  }
};

// Save campaign to database
const saveCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      brief,
      strategy,
      campaignConcept,
      plan,
      type,
      duration,
      budget,
      status,
    } = req.body;

    // Insert campaign
    const query = `
      INSERT INTO campaigns 
      (user_id, name, brief, strategy, campaign_concept, plan, type, duration, budget, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      userId,
      name,
      brief,
      JSON.stringify(strategy),
      JSON.stringify(campaignConcept),
      JSON.stringify(plan),
      type,
      duration,
      budget,
      status || "active",
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      campaign: result.rows[0],
      message: "Campaign saved successfully",
    });
  } catch (error) {
    console.error("Error saving campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save campaign",
      error: error.message,
    });
  }
};

// Get user's campaigns
const getCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, name, type, status, budget, duration, created_at, updated_at
      FROM campaigns
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      campaigns: result.rows,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const campaignId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "user_id" && key !== "created_at") {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(
          typeof updates[key] === "object"
            ? JSON.stringify(updates[key])
            : updates[key]
        );
        paramCount++;
      }
    });

    values.push(userId, campaignId);

    const query = `
      UPDATE campaigns 
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE user_id = $${paramCount} AND id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      campaign: result.rows[0],
      message: "Campaign updated successfully",
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update campaign",
      error: error.message,
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const campaignId = req.params.id;

    const query = `
      DELETE FROM campaigns 
      WHERE user_id = $1 AND id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [userId, campaignId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign",
      error: error.message,
    });
  }
};

// Function 1: generateStrategicReport
// REPLACE your entire generateStrategicReport function with this code
const generateStrategicReport = async (req, res) => {
  try {
    const { campaignType, campaignCategory, brief, includeBrief } = req.body;
    const userId = req.user.id;

    if (!campaignType || !brief) {
      return res.status(400).json({
        success: false,
        message: "Campaign type and brief are required",
      });
    }

    // Import campaign type configurations
    const campaignTypeConfigs = require("../config/campaignTypeConfigs");
    const typeConfig = campaignTypeConfigs[campaignType];

    if (!typeConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign type",
      });
    }

    // Add creative boost
    const creativeBoost = campaignTypeConfigs.generateCreativeBoost
      ? campaignTypeConfigs.generateCreativeBoost(campaignType, brief)
      : "";

    // Step 1: Parse and extract all requirements from the brief
    const requirementsPrompt = `Analyze this campaign brief and extract EVERY SINGLE requirement, objective, deliverable, and constraint mentioned. Be extremely thorough - miss nothing.

Brief: ${brief}

List each requirement in detail with:
1. The specific requirement/ask
2. Any constraints or parameters mentioned
3. Success criteria if mentioned
4. Timeline if mentioned

Format as a detailed JSON array of requirements.`;

    console.log("Extracting requirements from brief...");
    const requirementsResponse = await claudeService.sendMessage(
      requirementsPrompt
    );

    let extractedRequirements;
    try {
      extractedRequirements = JSON.parse(requirementsResponse);
    } catch (e) {
      extractedRequirements = [
        { requirement: brief, constraint: "Full brief to address" },
      ];
    }

    // Step 2: Generate creative concepts based on campaign type
    const creativityPrompt = `You are a visionary ${
      typeConfig.name
    } strategist known for breakthrough campaigns.

Campaign Type: ${typeConfig.name}
Client Requirements: ${JSON.stringify(extractedRequirements)}

Generate 3 WILDLY CREATIVE and COMPLETELY DIFFERENT strategic approaches for this ${
      typeConfig.name
    } campaign. 

For each approach:
1. Give it a memorable campaign name
2. Describe the core creative concept
3. Explain why it's perfect for ${typeConfig.name}
4. List 3-5 signature tactics that have never been done before
5. Predict the impact

Be bold, unexpected, and push boundaries. Think like the most awarded agencies in the world.

Format as JSON array of creative concepts.`;

    console.log("Generating creative concepts...");
    const creativityResponse = await claudeService.sendMessage(
      creativityPrompt
    );

    let creativeConceptsArray;
    try {
      creativeConceptsArray = JSON.parse(creativityResponse);
    } catch (e) {
      creativeConceptsArray = [];
    }

    // Step 3: Generate the comprehensive report
    // REPLACE the masterPrompt variable with this enhanced version
    // REPLACE your masterPrompt with this version that forces JSON-only output

    const masterPrompt = `CRITICAL INSTRUCTION: Return ONLY a valid JSON object. No other text before or after the JSON. Start with { and end with }

You are creating a ${typeConfig.name} strategy for:
${brief}

Requirements to address: ${extractedRequirements.length} items
Creative concepts needed: 3 different approaches

Return this EXACT JSON structure with all sections filled:

{
  "title": "Strategic ${typeConfig.name} Transformation",
  "subtitle": "Comprehensive Strategy for [Client from brief]",
  "executiveSummary": "[4-5 paragraphs of executive summary here]",
  "creativeConcepts": [
    {
      "name": "[Memorable concept name 1]",
      "description": "[2-3 sentence description]",
      "keyTactics": ["[Tactic 1]", "[Tactic 2]", "[Tactic 3]", "[Tactic 4]"],
      "expectedImpact": "[Specific measurable impact]"
    },
    {
      "name": "[Different concept name 2]",
      "description": "[2-3 sentence description]",
      "keyTactics": ["[Tactic 1]", "[Tactic 2]", "[Tactic 3]", "[Tactic 4]"],
      "expectedImpact": "[Different measurable impact]"
    },
    {
      "name": "[Bold concept name 3]",
      "description": "[2-3 sentence description]",
      "keyTactics": ["[Tactic 1]", "[Tactic 2]", "[Tactic 3]", "[Tactic 4]"],
      "expectedImpact": "[Transformational impact]"
    }
  ],
  "requirementsAddressed": [${extractedRequirements
    .map(
      () => `
    {
      "requirement": "[Requirement from brief]",
      "solution": "[How we'll address this]",
      "tactics": ["[Tactic 1]", "[Tactic 2]", "[Tactic 3]"],
      "metrics": ["[Success metric]"]
    }`
    )
    .join(",")}
  ],
  "sections": [
    {
      "id": "market-intelligence",
      "title": "Market Intelligence & Landscape",
      "icon": "TrendingUp",
      "content": "[2-3 paragraphs of market analysis]",
      "subsections": [
        {
          "title": "Industry Analysis",
          "content": "[Detailed industry analysis with data]"
        },
        {
          "title": "Competitive Landscape",
          "content": "[Competitor analysis and opportunities]"
        },
        {
          "title": "Target Audience",
          "content": "[Detailed audience insights]"
        }
      ],
      "recommendations": ["[Recommendation 1]", "[Recommendation 2]", "[Recommendation 3]"],
      "metrics": [
        {"label": "Market Size", "value": "$[X]B"},
        {"label": "Growth Rate", "value": "[X]%"}
      ]
    },
    {
      "id": "strategy",
      "title": "Strategic Framework",
      "icon": "Target",
      "content": "[2-3 paragraphs explaining strategy]",
      "subsections": [
        {
          "title": "Core Messaging",
          "content": "[Key messages and positioning]"
        },
        {
          "title": "Channel Strategy",
          "content": "[Which channels and why]"
        },
        {
          "title": "Content Strategy",
          "content": "[Content approach and calendar]"
        }
      ],
      "recommendations": ["[Strategy rec 1]", "[Strategy rec 2]", "[Strategy rec 3]"]
    },
    {
      "id": "execution",
      "title": "Execution Roadmap",
      "icon": "Zap",
      "content": "[2-3 paragraphs about execution]",
      "subsections": [
        {
          "title": "30-Day Quick Wins",
          "content": "[5-7 immediate actions with outcomes]"
        },
        {
          "title": "90-Day Milestones",
          "content": "[Major initiatives for first quarter]"
        },
        {
          "title": "6-Month Vision",
          "content": "[Transformation goals and metrics]"
        }
      ]
    },
    {
      "id": "measurement",
      "title": "Measurement Framework",
      "icon": "BarChart3",
      "content": "[How we'll measure success]",
      "subsections": [
        {
          "title": "KPIs and Metrics",
          "content": "[8-10 specific KPIs with targets]"
        },
        {
          "title": "Reporting Structure",
          "content": "[Dashboards and reporting cadence]"
        }
      ]
    }
  ],
  "implementationRoadmap": {
    "phases": [
      {
        "name": "Phase 1: Foundation (Month 1)",
        "duration": "30 days",
        "objectives": ["[Objective 1]", "[Objective 2]", "[Objective 3]"],
        "deliverables": ["[Deliverable 1]", "[Deliverable 2]"],
        "milestones": ["[Milestone 1]", "[Milestone 2]"],
        "resources": ["[Team needed]", "[Budget required]"]
      },
      {
        "name": "Phase 2: Growth (Months 2-3)",
        "duration": "60 days",
        "objectives": ["[Growth objective 1]", "[Growth objective 2]"],
        "deliverables": ["[Major deliverable 1]", "[Major deliverable 2]"],
        "milestones": ["[Growth milestone 1]", "[Growth milestone 2]"],
        "resources": ["[Expanded team]", "[Additional budget]"]
      }
    ]
  },
  "keyMetrics": [
    {"metric": "${
      typeConfig.keyMetrics[0]
    }", "target": "[Specific number]", "timeline": "By [date]"},
    {"metric": "${
      typeConfig.keyMetrics[1]
    }", "target": "[Specific number]", "timeline": "By [date]"},
    {"metric": "${
      typeConfig.keyMetrics[2]
    }", "target": "[Specific number]", "timeline": "By [date]"},
    {"metric": "${
      typeConfig.keyMetrics[3]
    }", "target": "[Specific number]", "timeline": "By [date]"}
  ],
  "nextSteps": [
    "[Immediate action with deadline]",
    "[Week 1 action with owner]",
    "[Week 2 action with owner]",
    "[Week 3 action with owner]",
    "[Month 1 milestone]"
  ]
}

REMEMBER: Output ONLY the JSON object above with all brackets filled with relevant content. No explanations, no text before or after.`;

    console.log(`Generating comprehensive ${typeConfig.name} report...`);
    const finalResponse = await claudeService.sendMessage(masterPrompt);
    console.log("Claude response received");
    console.log("Claude raw response length:", finalResponse?.length);
    console.log(
      "First 500 chars of response:",
      finalResponse?.substring(0, 500)
    );

    if (!finalResponse) {
      throw new Error("No response from AI service");
    }

    // Parse the response
    // REPLACE the parsing section in your generateStrategicReport function with this:

    // Parse the response
    let report;
    try {
      // First, try to find JSON in the response
      let jsonString = finalResponse;

      // Method 1: Look for JSON object pattern
      const jsonMatch = finalResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      // Method 2: If the response contains both text and JSON, extract just the JSON
      const jsonStartIndex = finalResponse.indexOf("{");
      const jsonEndIndex = finalResponse.lastIndexOf("}");
      if (
        jsonStartIndex !== -1 &&
        jsonEndIndex !== -1 &&
        jsonEndIndex > jsonStartIndex
      ) {
        jsonString = finalResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      // Clean the response
      const cleanedResponse = jsonString
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/[\u0000-\u001F]+/g, "")
        .trim();

      // Log what we're trying to parse
      console.log(
        "Attempting to parse JSON of length:",
        cleanedResponse.length
      );
      console.log("First 200 chars:", cleanedResponse.substring(0, 200));

      report = JSON.parse(cleanedResponse);

      // Validate that we got the expected structure
      if (!report.sections || report.sections.length === 0) {
        console.warn("Parsed JSON but sections are missing, using fallback");
        throw new Error("Invalid report structure");
      }

      // Add campaign type info and metadata to report
      report.campaignType = campaignType;
      report.typeConfig = typeConfig;
      report.briefWordCount = brief.split(" ").length;
      report.requirementsCount = extractedRequirements.length;
      report.generatedAt = new Date().toISOString();

      console.log(
        "Successfully parsed report with sections:",
        report.sections.map((s) => s.title)
      );
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw response preview:", finalResponse.substring(0, 500));

      // Try to extract what we can from the response
      const executiveSummaryMatch = finalResponse.match(
        /"executiveSummary":\s*"([^"]+)"/
      );
      const titleMatch = finalResponse.match(/"title":\s*"([^"]+)"/);

      // Enhanced fallback with any extracted content
      report = {
        title: titleMatch
          ? titleMatch[1]
          : `Strategic ${typeConfig.name} Report`,
        subtitle: `${campaignCategory} - ${campaignType}`,
        campaignType: campaignType,
        typeConfig: typeConfig,
        executiveSummary: executiveSummaryMatch
          ? executiveSummaryMatch[1]
          : `This ${
              typeConfig.name
            } campaign requires focus on: ${typeConfig.focusAreas.join(
              ", "
            )}. Key success metrics include: ${typeConfig.keyMetrics.join(
              ", "
            )}.`,
        creativeConcepts: creativeConceptsArray || [],
        requirementsAddressed: extractedRequirements.map((req) => ({
          requirement: req.requirement || req,
          solution: "Detailed solution in full report",
          tactics: ["See complete strategy above"],
          metrics: ["Success metrics defined"],
        })),
        sections: [
          {
            id: "analysis",
            title: `${typeConfig.name} Analysis`,
            icon: "FileText",
            content: finalResponse,
            subsections: [],
          },
        ],
        keyMetrics: typeConfig.keyMetrics.slice(0, 4).map((metric) => ({
          metric: metric,
          target: "To be determined",
          timeline: "Based on campaign timeline",
        })),
        nextSteps: [
          `Finalize ${typeConfig.name} strategy`,
          `Identify key ${typeConfig.focusAreas[0]}`,
          `Develop ${typeConfig.criticalElements[0]}`,
        ],
      };
    }

    res.json({
      success: true,
      report: report,
      message: "Strategic report generated successfully",
    });
  } catch (error) {
    console.error("Error in generateStrategicReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate strategic report",
      error: error.message,
    });
  }
};

// Function 2: saveStrategicReport
const saveStrategicReport = async (req, res) => {
  try {
    const { campaignType, campaignCategory, brief, report } = req.body;
    const userId = req.user.id;

    if (!report) {
      return res.status(400).json({
        success: false,
        message: "Report data is required",
      });
    }

    const query = `
      INSERT INTO strategic_reports 
      (user_id, campaign_type, campaign_category, brief, report_data, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [
      userId,
      campaignType,
      campaignCategory,
      brief,
      JSON.stringify(report),
    ]);

    res.json({
      success: true,
      reportId: result.rows[0].id,
      message: "Report saved successfully",
    });
  } catch (error) {
    console.error("Error saving strategic report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save report",
      error: error.message,
    });
  }
};

// Function 3: getStrategicReports
const getStrategicReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, campaign_type, campaign_category, 
             report_data->>'title' as title,
             report_data->>'subtitle' as subtitle,
             created_at
      FROM strategic_reports
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      reports: result.rows,
    });
  } catch (error) {
    console.error("Error fetching strategic reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

// Simplified version that makes multiple calls for better results
const generateStrategicReportSimple = async (req, res) => {
  try {
    const { campaignType, campaignCategory, brief, includeBrief } = req.body;
    const userId = req.user.id;

    if (!campaignType || !brief) {
      return res.status(400).json({
        success: false,
        message: "Campaign type and brief are required",
      });
    }

    const campaignTypeConfigs = require("../config/campaignTypeConfigs");
    const typeConfig = campaignTypeConfigs[campaignType];

    console.log("Generating comprehensive report for:", typeConfig.name);

    // Make multiple focused calls for better content
    const sections = [];

    // Call 1: Executive Summary and Strategy
    const strategyPrompt = `Create an executive summary and strategic overview for this ${typeConfig.name} campaign:
${brief}

Provide:
1. Executive Summary (4-5 detailed paragraphs)
2. Strategic approach and rationale
3. Expected outcomes and success metrics`;

    const strategyResponse = await claudeService.sendMessage(strategyPrompt);

    // Call 2: Creative Concepts
    const creativePrompt = `Generate 3 innovative creative concepts for this ${typeConfig.name} campaign:
${brief}

For each concept provide:
- A memorable name
- Description (2-3 sentences)
- 4-5 key tactics
- Expected impact`;

    const creativeResponse = await claudeService.sendMessage(creativePrompt);

    // Call 3: Market Analysis
    const marketPrompt = `Provide market intelligence for this ${typeConfig.name} campaign:
${brief}

Include:
1. Industry landscape and trends
2. Competitor analysis
3. Target audience insights
4. Market opportunities`;

    const marketResponse = await claudeService.sendMessage(marketPrompt);

    // Call 4: Tactical Execution
    const tacticalPrompt = `Create a tactical execution plan for this ${typeConfig.name} campaign:
${brief}

Include:
1. 30-day quick wins
2. 90-day milestones  
3. 6-month transformation goals
4. Channel strategies
5. Budget recommendations`;

    const tacticalResponse = await claudeService.sendMessage(tacticalPrompt);

    // Build the report structure
    const report = {
      title: `Strategic ${typeConfig.name} Campaign`,
      subtitle: "Comprehensive Strategy and Execution Plan",
      campaignType: campaignType,
      typeConfig: typeConfig,
      executiveSummary: strategyResponse.substring(0, 2000),

      creativeConcepts: [
        {
          name: "Innovative Concept #1",
          description: "First creative approach from the campaign",
          keyTactics: ["Tactic 1", "Tactic 2", "Tactic 3", "Tactic 4"],
          expectedImpact: "Significant market impact",
        },
        {
          name: "Breakthrough Concept #2",
          description: "Second creative approach",
          keyTactics: ["Tactic 1", "Tactic 2", "Tactic 3", "Tactic 4"],
          expectedImpact: "Strong audience engagement",
        },
        {
          name: "Disruptive Concept #3",
          description: "Third creative approach",
          keyTactics: ["Tactic 1", "Tactic 2", "Tactic 3", "Tactic 4"],
          expectedImpact: "Category leadership",
        },
      ],

      sections: [
        {
          id: "strategy",
          title: "Strategic Overview",
          icon: "Target",
          content: strategyResponse,
          subsections: [],
        },
        {
          id: "creative",
          title: "Creative Concepts",
          icon: "Lightbulb",
          content: creativeResponse,
          subsections: [],
        },
        {
          id: "market",
          title: "Market Intelligence",
          icon: "TrendingUp",
          content: marketResponse,
          subsections: [],
        },
        {
          id: "tactical",
          title: "Tactical Execution",
          icon: "Zap",
          content: tacticalResponse,
          subsections: [],
        },
      ],

      keyMetrics: typeConfig.keyMetrics.slice(0, 4).map((metric) => ({
        metric: metric,
        target: "Industry-leading performance",
        timeline: "Within campaign timeline",
      })),

      nextSteps: [
        "Finalize campaign strategy and get approval",
        "Assemble core team and assign roles",
        "Develop detailed project timeline",
        "Initiate market research phase",
        "Create initial campaign assets",
      ],

      requirementsAddressed: [],
    };

    res.json({
      success: true,
      report: report,
      message: "Strategic report generated successfully",
    });
  } catch (error) {
    console.error("Error in generateStrategicReportSimple:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate strategic report",
      error: error.message,
    });
  }
};

// Add this function to your campaignIntelligenceController.js file

const expandReport = async (req, res) => {
  try {
    const { campaignType, originalBrief, currentReport, expansionPrompt } =
      req.body;
    const userId = req.user.id;

    if (!expansionPrompt || !currentReport) {
      return res.status(400).json({
        success: false,
        message: "Expansion prompt and current report are required",
      });
    }

    console.log("Expanding report with prompt:", expansionPrompt);

    // Create a comprehensive prompt that includes context
    const expandPrompt = `You are expanding on a strategic ${
      campaignType || "PR"
    } campaign report.

Original Campaign Brief:
${originalBrief}

Current Report Summary:
- Title: ${currentReport.title}
- Sections: ${currentReport.sections?.map((s) => s.title).join(", ")}

User's Specific Request:
${expansionPrompt}

Please provide a detailed, comprehensive response that:
1. Directly addresses the user's specific request
2. Includes concrete examples and specifics
3. Provides actionable recommendations
4. Uses data points and metrics where relevant
5. Maintains consistency with the original report's strategy

If the user is asking about creative concepts, provide detailed examples.
If asking about budgets, provide specific breakdowns.
If asking about timelines, provide detailed schedules.
If asking about metrics, provide specific KPIs and measurement methods.

Make your response thorough, professional, and immediately actionable.`;

    // Call Claude for the expansion
    const expansionResponse = await claudeService.sendMessage(expandPrompt);

    if (!expansionResponse) {
      throw new Error("No response from AI service");
    }

    // Create structured expansion object
    const expansion = {
      prompt: expansionPrompt,
      content: expansionResponse,
      timestamp: new Date().toISOString(),
      relatedSections: identifyRelatedSections(expansionPrompt, currentReport),
    };

    res.json({
      success: true,
      expansion: expansion,
      message: "Report expansion generated successfully",
    });
  } catch (error) {
    console.error("Error in expandReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to expand report",
      error: error.message,
    });
  }
};

// Helper function to identify which sections the expansion relates to
const identifyRelatedSections = (prompt, report) => {
  const promptLower = prompt.toLowerCase();
  const relatedSections = [];

  if (!report.sections) return relatedSections;

  // Keywords that might indicate which sections are relevant
  const sectionKeywords = {
    market: ["market", "industry", "competitor", "landscape"],
    strategy: ["strategy", "strategic", "approach", "framework"],
    creative: ["creative", "concept", "campaign", "idea"],
    execution: ["execution", "timeline", "phase", "milestone"],
    measurement: ["metric", "kpi", "measure", "analytics", "roi"],
    budget: ["budget", "cost", "investment", "spend"],
  };

  report.sections.forEach((section) => {
    const sectionId = section.id.toLowerCase();
    if (sectionKeywords[sectionId]) {
      for (const keyword of sectionKeywords[sectionId]) {
        if (promptLower.includes(keyword)) {
          relatedSections.push(section.id);
          break;
        }
      }
    }
  });

  return relatedSections;
};

module.exports = {
  generateMarketAnalysis,
  generateCampaignConcept,
  generateFromConcept,
  saveCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  generateStrategicReport,
  saveStrategicReport,
  getStrategicReports,
  generateStrategicReportSimple,
  expandReport,
};
