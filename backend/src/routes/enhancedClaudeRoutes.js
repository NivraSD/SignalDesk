// Enhanced Claude Routes - Comprehensive implementation for ALL SignalDesk features
// This file provides intelligent Claude-powered endpoints for every platform feature

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const claudeService = require("../../config/claude");
const pool = require("../../config/database");

console.log("🚀 Loading Enhanced Claude Routes - Full Feature Implementation");

// ========================================
// CRISIS COMMAND CENTER ENHANCEMENTS
// ========================================

// Enhanced Crisis Scenario Analysis
router.post("/crisis/analyze-scenario", authMiddleware, async (req, res) => {
  try {
    const { scenario, industry, companySize, currentStatus, elapsedTime } = req.body;
    
    const prompt = `You are an expert crisis management consultant analyzing a developing crisis situation.

Scenario: ${scenario}
Industry: ${industry}
Company Size: ${companySize}
Current Status: ${currentStatus}
Time Elapsed: ${elapsedTime}

Provide a comprehensive crisis analysis with:

1. **Severity Assessment**: Rate 1-10 with detailed justification
2. **Immediate Actions** (Next 1-2 hours):
   - 5 specific, prioritized actions with owners
   - Communication protocols to activate
   - Team members to mobilize

3. **Stakeholder Impact Analysis**:
   - Customers: Impact level and concerns
   - Employees: Morale and retention risks
   - Investors: Market confidence implications
   - Media: Coverage prediction and tone
   - Regulators: Compliance and investigation risks

4. **Timeline Projections**:
   - Hour 1-6: Critical window actions
   - Day 1-3: Stabilization phase
   - Week 1-2: Recovery phase
   - Month 1-3: Reputation rebuilding

5. **Communication Strategy**:
   - Key messages for each stakeholder group
   - Spokesperson assignments
   - Media talking points
   - Social media response framework

6. **Risk Cascades**: Secondary risks that could emerge
7. **Success Metrics**: How to measure crisis resolution
8. **Lessons from Similar Crises**: Reference 2-3 comparable situations

Format as detailed, actionable advice that a crisis team can immediately implement.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      timestamp: new Date().toISOString(),
      scenarioId: `crisis-${Date.now()}`
    });
  } catch (error) {
    console.error("Crisis scenario analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze crisis scenario"
    });
  }
});

// Real-time Crisis Decision Support
router.post("/crisis/decision-support", authMiddleware, async (req, res) => {
  try {
    const { decision, context, options, constraints, urgency } = req.body;
    
    const prompt = `Provide immediate decision support for this crisis management decision:

Decision Required: ${decision}
Context: ${context}
Options Being Considered: ${JSON.stringify(options)}
Constraints: ${constraints}
Urgency Level: ${urgency}

Analyze each option and provide:

1. **Recommended Action**: Clear recommendation with rationale
2. **Risk-Benefit Analysis** for each option:
   - Potential positive outcomes
   - Potential negative consequences
   - Probability of success
   - Resource requirements

3. **Implementation Roadmap**:
   - Step-by-step execution plan
   - Timeline for each step
   - Success indicators
   - Fallback options

4. **Stakeholder Reactions**: Predicted responses from key groups
5. **Legal/Regulatory Considerations**: Compliance requirements
6. **Long-term Implications**: Impact beyond immediate crisis

Provide a clear, executive-ready recommendation that can be acted upon immediately.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      recommendation: response,
      decisionId: `decision-${Date.now()}`
    });
  } catch (error) {
    console.error("Decision support error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate decision support"
    });
  }
});

// ========================================
// CAMPAIGN INTELLIGENCE ENHANCEMENTS
// ========================================

// Advanced Campaign Strategy Generator
router.post("/campaigns/advanced-strategy", authMiddleware, async (req, res) => {
  try {
    const { campaignType, objectives, targetAudience, budget, timeline, competitors, marketContext } = req.body;
    
    const prompt = `Create a comprehensive, McKinsey-quality campaign strategy:

Campaign Type: ${campaignType}
Objectives: ${objectives}
Target Audience: ${targetAudience}
Budget: ${budget}
Timeline: ${timeline}
Key Competitors: ${competitors}
Market Context: ${marketContext}

Deliver a detailed strategic plan including:

1. **Executive Summary**
   - Strategic thesis (2-3 sentences)
   - Expected ROI and success metrics
   - Key differentiators from competition

2. **Market Intelligence**
   - Competitive landscape analysis
   - Market opportunity sizing (TAM/SAM/SOM)
   - Trend analysis and timing rationale
   - White space opportunities

3. **Audience Segmentation**
   - Primary, secondary, tertiary audiences
   - Detailed personas with psychographics
   - Customer journey mapping
   - Message-market fit analysis

4. **Strategic Pillars** (4-5 core strategies)
   For each pillar:
   - Objective and rationale
   - Key tactics (5-7 per pillar)
   - Success metrics and KPIs
   - Budget allocation
   - Risk mitigation

5. **Creative Strategy**
   - Core creative concept
   - Campaign narrative arc
   - Visual identity guidelines
   - Content themes and formats
   - Channel-specific adaptations

6. **Media Strategy**
   - Paid media mix and rationale
   - Earned media approach
   - Owned media optimization
   - Influencer strategy
   - Budget allocation by channel

7. **Implementation Roadmap**
   - Pre-launch phase (preparation)
   - Launch phase (activation)
   - Sustain phase (optimization)
   - Amplify phase (scaling)
   - Measure phase (analysis)

8. **Measurement Framework**
   - Leading indicators
   - Lagging indicators
   - Attribution model
   - Reporting cadence
   - Optimization triggers

9. **Risk Analysis**
   - Top 5 risks with probability/impact
   - Mitigation strategies
   - Crisis scenarios
   - Contingency plans

10. **Budget Breakdown**
    - Line-item budget by category
    - Phased spending plan
    - ROI projections
    - Cost-per-outcome estimates

Provide specific, actionable recommendations with real examples and benchmarks where relevant.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      strategy: response,
      strategyId: `strategy-${Date.now()}`
    });
  } catch (error) {
    console.error("Advanced strategy generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate advanced strategy"
    });
  }
});

// Campaign Performance Prediction
router.post("/campaigns/predict-performance", authMiddleware, async (req, res) => {
  try {
    const { campaignDetails, historicalData, marketConditions } = req.body;
    
    const prompt = `Analyze this campaign and predict its performance:

Campaign Details: ${JSON.stringify(campaignDetails)}
Historical Performance Data: ${JSON.stringify(historicalData)}
Current Market Conditions: ${marketConditions}

Provide detailed performance predictions:

1. **Success Probability**: Overall chance of meeting objectives (0-100%)
2. **Expected Outcomes**:
   - Reach projections
   - Engagement estimates
   - Conversion predictions
   - ROI forecast

3. **Timeline Analysis**:
   - Week 1: Expected metrics
   - Month 1: Cumulative results
   - Quarter 1: Full impact assessment

4. **Channel Performance**:
   - Predict performance by channel
   - Identify strongest/weakest channels
   - Optimization opportunities

5. **Risk Factors**:
   - What could reduce performance
   - External factors to monitor
   - Early warning indicators

6. **Optimization Recommendations**:
   - Pre-launch improvements
   - In-flight optimization triggers
   - Budget reallocation suggestions

7. **Comparative Analysis**:
   - Benchmark against similar campaigns
   - Industry performance standards
   - Competitive implications

Provide confidence levels for each prediction and explain the reasoning.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      predictions: response,
      analysisId: `prediction-${Date.now()}`
    });
  } catch (error) {
    console.error("Performance prediction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to predict campaign performance"
    });
  }
});

// ========================================
// MEDIA LIST BUILDER ENHANCEMENTS
// ========================================

// Intelligent Journalist Discovery
router.post("/media/intelligent-discovery", authMiddleware, async (req, res) => {
  try {
    const { topic, announcement, companyContext, targetPublications, geographic } = req.body;
    
    const prompt = `Discover the most relevant journalists for this PR opportunity:

Topic/Announcement: ${topic}
${announcement ? `Full Announcement: ${announcement}` : ''}
Company Context: ${companyContext}
Target Publications: ${targetPublications || 'Open to all relevant'}
Geographic Focus: ${geographic || 'National'}

Generate a list of 20 highly relevant journalists with:

For each journalist provide:
1. **Name**: Full name
2. **Publication**: Current outlet
3. **Beat**: Primary coverage area
4. **Relevance Score**: 1-100 based on fit
5. **Recent Coverage**: 2-3 recent relevant articles they've written
6. **Pitch Angle**: Specific angle that would interest them
7. **Contact Preference**: Email/Twitter/LinkedIn
8. **Engagement Tips**: How to best approach them
9. **Competitive Intel**: If they've covered competitors
10. **Timing**: Best time to reach out

Focus on journalists who:
- Have recently covered similar topics
- Write for publications reaching your target audience
- Have shown interest in your industry
- Are currently active and responsive

Make the list diverse across:
- Tier 1 (major outlets)
- Trade publications
- Digital-first media
- Broadcast opportunities
- Podcast hosts

Provide actionable insights for each journalist that increase pitch success probability.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      journalists: response,
      searchId: `search-${Date.now()}`
    });
  } catch (error) {
    console.error("Intelligent discovery error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover journalists"
    });
  }
});

// Pitch Personalization Engine
router.post("/media/personalize-pitch", authMiddleware, async (req, res) => {
  try {
    const { journalist, announcement, companyInfo, previousCoverage } = req.body;
    
    const prompt = `Create a personalized pitch for this journalist:

Journalist Details: ${JSON.stringify(journalist)}
Announcement: ${announcement}
Company Info: ${companyInfo}
Their Previous Coverage: ${previousCoverage}

Generate a highly personalized pitch that includes:

1. **Subject Line**: Compelling, personalized subject line
2. **Opening Hook**: Reference their recent work or interest
3. **The Pitch**: 
   - Why this matters to THEIR audience
   - Exclusive angle just for them
   - Data/insights they can't get elsewhere
4. **Supporting Points**: 3 key facts that support the story
5. **Call to Action**: Specific next step
6. **Additional Resources**: What you can provide
7. **Timing**: Why this is timely for them

Also provide:
- **Success Probability**: Rate 1-100
- **Best Time to Send**: Day and time recommendation
- **Follow-up Strategy**: When and how to follow up
- **Alternative Angles**: 2 backup angles if main pitch doesn't land
- **Red Flags**: What to avoid with this journalist

Make it authentic, not templated. Show you understand their work and audience.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      pitch: response,
      pitchId: `pitch-${Date.now()}`
    });
  } catch (error) {
    console.error("Pitch personalization error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to personalize pitch"
    });
  }
});

// ========================================
// STAKEHOLDER INTELLIGENCE ENHANCEMENTS
// ========================================

// Stakeholder Relationship Mapping
router.post("/stakeholder/relationship-map", authMiddleware, async (req, res) => {
  try {
    const { company, industry, objectives, knownStakeholders } = req.body;
    
    const prompt = `Create a comprehensive stakeholder relationship map:

Company: ${company}
Industry: ${industry}
Strategic Objectives: ${objectives}
Known Stakeholders: ${JSON.stringify(knownStakeholders)}

Provide a detailed stakeholder ecosystem analysis:

1. **Primary Stakeholders** (Direct impact on success):
   For each:
   - Name/Group
   - Current Relationship Status (1-10)
   - Influence Level (High/Medium/Low)
   - Interest in Our Success (1-10)
   - Key Concerns
   - Engagement Strategy
   - Success Metrics

2. **Secondary Stakeholders** (Indirect but important):
   - Same details as above
   - Connection to primary stakeholders

3. **Hidden Influencers** (Often overlooked):
   - Industry analysts
   - Academic researchers  
   - Community leaders
   - Social media influencers
   - Policy makers

4. **Relationship Dynamics**:
   - Power dynamics between stakeholders
   - Conflicting interests to manage
   - Coalition opportunities
   - Risk relationships

5. **Engagement Prioritization**:
   - Top 5 to engage immediately
   - Quarterly engagement calendar
   - Resource allocation recommendations

6. **Communication Strategy**:
   - Messaging framework for each group
   - Channel preferences
   - Frequency recommendations
   - Content types that resonate

7. **Risk Assessment**:
   - Hostile stakeholders
   - Neutral parties that could turn negative
   - Mitigation strategies

8. **Opportunity Analysis**:
   - Potential champions
   - Collaboration opportunities
   - Advocacy potential

Provide specific, actionable recommendations for building and maintaining each relationship.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      mapping: response,
      mapId: `stakeholder-map-${Date.now()}`
    });
  } catch (error) {
    console.error("Stakeholder mapping error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to map stakeholder relationships"
    });
  }
});

// Stakeholder Sentiment Prediction
router.post("/stakeholder/predict-sentiment", authMiddleware, async (req, res) => {
  try {
    const { action, stakeholders, context, timeline } = req.body;
    
    const prompt = `Predict stakeholder reactions to this action:

Proposed Action: ${action}
Key Stakeholders: ${JSON.stringify(stakeholders)}
Context: ${context}
Timeline: ${timeline}

Provide detailed sentiment predictions:

1. **Immediate Reactions** (0-48 hours):
   For each stakeholder group:
   - Likely sentiment (Positive/Neutral/Negative)
   - Confidence level (0-100%)
   - Specific concerns or praise points
   - Communication they'll expect
   - Actions they might take

2. **Short-term Impact** (1-4 weeks):
   - Sentiment evolution
   - Behavioral changes
   - Business impact
   - Relationship implications

3. **Long-term Consequences** (1-6 months):
   - Lasting perception changes
   - Strategic implications
   - Trust impact
   - Future engagement difficulty

4. **Wild Cards**:
   - Unexpected reactions to prepare for
   - Cascade effects
   - Media amplification risks
   - Social media virality potential

5. **Mitigation Strategies**:
   - Pre-emptive communications
   - Stakeholder preparation
   - Risk reduction tactics
   - Relationship preservation

6. **Optimization Opportunities**:
   - How to maximize positive reactions
   - Converting neutrals to supporters
   - Building advocacy

Provide confidence levels and reasoning for each prediction.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      predictions: response,
      predictionId: `sentiment-${Date.now()}`
    });
  } catch (error) {
    console.error("Sentiment prediction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to predict stakeholder sentiment"
    });
  }
});

// ========================================
// OPPORTUNITY ENGINE ENHANCEMENTS
// ========================================

// Strategic Opportunity Discovery
router.post("/opportunity/discover-strategic", authMiddleware, async (req, res) => {
  try {
    const { company, industry, strengths, weaknesses, marketTrends, competitorActions } = req.body;
    
    const prompt = `Identify strategic PR and market opportunities:

Company: ${company}
Industry: ${industry}
Strengths: ${strengths}
Weaknesses: ${weaknesses}
Market Trends: ${marketTrends}
Recent Competitor Actions: ${competitorActions}

Discover and analyze opportunities:

1. **Immediate Opportunities** (Next 30 days):
   For each opportunity:
   - Opportunity name and description
   - Strategic rationale
   - Effort required (1-10)
   - Impact potential (1-10)
   - Success probability (0-100%)
   - First-mover advantage assessment
   - Implementation roadmap
   - Required resources

2. **Emerging Opportunities** (30-90 days):
   - Trend-based opportunities
   - Market gaps to exploit
   - Partnership possibilities
   - Content/thought leadership angles
   - Event/speaking opportunities

3. **Strategic Initiatives** (90+ days):
   - Major positioning opportunities
   - Category creation possibilities
   - Market expansion options
   - Innovation showcases
   - Industry leadership plays

4. **Competitive Opportunities**:
   - Competitor weaknesses to exploit
   - Differentiation angles
   - Counter-positioning strategies
   - Market share capture tactics

5. **Risk-Adjusted Prioritization**:
   - Top 5 opportunities ranked
   - Risk-reward analysis
   - Resource requirements
   - Timeline dependencies
   - Success metrics

6. **Execution Triggers**:
   - Signals to watch for
   - Optimal timing indicators
   - Go/no-go criteria
   - Preparation requirements

Provide specific, actionable opportunities with clear implementation paths.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      opportunities: response,
      discoveryId: `opportunity-${Date.now()}`
    });
  } catch (error) {
    console.error("Opportunity discovery error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover opportunities"
    });
  }
});

// Opportunity Impact Analysis
router.post("/opportunity/analyze-impact", authMiddleware, async (req, res) => {
  try {
    const { opportunity, company, resources, timeline, goals } = req.body;
    
    const prompt = `Analyze the potential impact of this opportunity:

Opportunity: ${opportunity}
Company Context: ${company}
Available Resources: ${resources}
Timeline: ${timeline}
Strategic Goals: ${goals}

Provide comprehensive impact analysis:

1. **Business Impact**:
   - Revenue implications
   - Market position changes
   - Brand value impact
   - Competitive advantages gained
   - Strategic goal alignment

2. **Stakeholder Impact**:
   - Customer perception changes
   - Employee morale effects
   - Investor confidence
   - Partner relationships
   - Media coverage potential

3. **Market Impact**:
   - Industry positioning
   - Thought leadership potential
   - Market share implications
   - Category dynamics
   - Competitive responses

4. **Execution Analysis**:
   - Resource requirements vs. available
   - Timeline feasibility
   - Key dependencies
   - Critical success factors
   - Potential roadblocks

5. **ROI Projection**:
   - Investment required
   - Expected returns (tangible)
   - Intangible benefits
   - Payback period
   - Long-term value creation

6. **Risk Assessment**:
   - Execution risks
   - Market risks
   - Competitive risks
   - Reputation risks
   - Mitigation strategies

7. **Alternative Scenarios**:
   - Best case outcome
   - Expected outcome
   - Worst case outcome
   - Probability of each

8. **Go/No-Go Recommendation**:
   - Clear recommendation
   - Key decision factors
   - Success criteria
   - Exit strategies if needed

Provide a data-driven assessment with confidence levels.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      analysisId: `impact-${Date.now()}`
    });
  } catch (error) {
    console.error("Impact analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze opportunity impact"
    });
  }
});

// ========================================
// INTELLIGENCE DASHBOARD ENHANCEMENTS
// ========================================

// Comprehensive Intelligence Synthesis
router.post("/intelligence/synthesize", authMiddleware, async (req, res) => {
  try {
    const { dataPoints, timeframe, focusAreas, company } = req.body;
    
    const prompt = `Synthesize intelligence data into actionable insights:

Data Points: ${JSON.stringify(dataPoints)}
Timeframe: ${timeframe}
Focus Areas: ${focusAreas}
Company Context: ${company}

Provide executive-level intelligence synthesis:

1. **Executive Summary**:
   - 3 most critical insights
   - Immediate action items
   - Strategic implications

2. **Trend Analysis**:
   - Emerging patterns
   - Accelerating trends
   - Declining indicators
   - Anomaly detection

3. **Competitive Intelligence**:
   - Competitor movements
   - Market positioning shifts
   - Threat assessment
   - Opportunity windows

4. **Market Signals**:
   - Customer sentiment shifts
   - Industry dynamics
   - Regulatory changes
   - Technology disruptions

5. **Predictive Insights**:
   - Next 30-day predictions
   - Scenario probabilities
   - Early warning indicators
   - Tipping points to watch

6. **Strategic Recommendations**:
   - Priority actions (ranked)
   - Resource allocation
   - Timing considerations
   - Success metrics

7. **Risk Radar**:
   - Emerging threats
   - Vulnerability assessment
   - Mitigation priorities
   - Contingency triggers

8. **Opportunity Spotlight**:
   - Top 3 opportunities
   - Window of opportunity
   - Required capabilities
   - First steps

Provide confidence levels and data sources for each insight.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      synthesis: response,
      synthesisId: `intel-${Date.now()}`
    });
  } catch (error) {
    console.error("Intelligence synthesis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to synthesize intelligence"
    });
  }
});

// Predictive Analytics Engine
router.post("/intelligence/predict", authMiddleware, async (req, res) => {
  try {
    const { historicalData, currentConditions, variables, predictionHorizon } = req.body;
    
    const prompt = `Generate predictive analytics for strategic planning:

Historical Data: ${JSON.stringify(historicalData)}
Current Conditions: ${currentConditions}
Key Variables: ${variables}
Prediction Horizon: ${predictionHorizon}

Provide detailed predictions:

1. **Market Predictions**:
   - Industry direction (30/60/90 days)
   - Competitive landscape evolution
   - Customer behavior shifts
   - Technology adoption curves
   - Regulatory environment changes

2. **Company Performance**:
   - Brand sentiment trajectory
   - Market share projections
   - Stakeholder engagement forecast
   - Crisis probability assessment
   - Opportunity emergence likelihood

3. **Scenario Planning**:
   - Most likely scenario (60-70% probability)
   - Optimistic scenario (20-30% probability)
   - Pessimistic scenario (10-20% probability)
   - Black swan events to monitor

4. **Leading Indicators**:
   - Metrics to track
   - Threshold values
   - Alert triggers
   - Decision points

5. **Strategic Implications**:
   - Preparation requirements
   - Investment priorities
   - Capability gaps to address
   - Partnership opportunities

6. **Action Triggers**:
   - When to accelerate
   - When to pivot
   - When to defend
   - When to withdraw

Provide confidence intervals and key assumptions for each prediction.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      predictions: response,
      predictionId: `predict-${Date.now()}`
    });
  } catch (error) {
    console.error("Predictive analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate predictions"
    });
  }
});

// ========================================
// AUTOMATED ORGANIZATION SETUP
// ========================================

// Intelligent Organization Analysis
router.post("/organization/analyze-setup", authMiddleware, async (req, res) => {
  try {
    const { companyName, industry, size, stage, objectives, challenges } = req.body;
    
    const prompt = `Analyze this organization and provide comprehensive setup recommendations:

Company: ${companyName}
Industry: ${industry}
Size: ${size}
Stage: ${stage}
Objectives: ${objectives}
Challenges: ${challenges}

Provide detailed analysis and setup recommendations:

1. **Organization Assessment**:
   - Maturity level (1-10) with justification
   - Strengths to leverage
   - Gaps to address
   - Quick wins available
   - Long-term priorities

2. **PR/Communications Infrastructure**:
   - Team structure recommendations
   - Role definitions needed
   - Skill gaps to fill
   - Process requirements
   - Technology stack suggestions

3. **Strategic Priorities**:
   - Top 5 initiatives for first 90 days
   - Quarter-by-quarter roadmap
   - Resource allocation guidance
   - Success metrics framework

4. **Stakeholder Ecosystem**:
   - Priority stakeholder groups
   - Engagement strategies for each
   - Communication channels to establish
   - Relationship building timeline

5. **Content & Messaging**:
   - Core messaging framework
   - Content pillars (4-5)
   - Editorial calendar structure
   - Channel strategy
   - Voice and tone guidelines

6. **Media Relations Setup**:
   - Media list building priorities
   - Pitch angles to develop
   - Spokesperson preparation
   - Press kit requirements
   - Relationship cultivation plan

7. **Crisis Preparedness**:
   - Risk assessment
   - Crisis team structure
   - Response protocols needed
   - Scenario planning priorities
   - Training requirements

8. **Measurement Framework**:
   - KPIs to track
   - Reporting structure
   - Dashboard requirements
   - Attribution model
   - ROI measurement approach

9. **Budget Allocation**:
   - Recommended budget breakdown
   - Investment priorities
   - Cost-saving opportunities
   - ROI expectations

10. **Implementation Roadmap**:
    - Week 1: Immediate actions
    - Month 1: Foundation building
    - Quarter 1: Momentum building
    - Year 1: Full deployment

Provide specific, actionable recommendations tailored to their industry and stage.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      analysis: response,
      setupId: `setup-${Date.now()}`
    });
  } catch (error) {
    console.error("Organization analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze organization setup"
    });
  }
});

// Custom Playbook Generator
router.post("/organization/generate-playbook", authMiddleware, async (req, res) => {
  try {
    const { organization, scenario, objectives, constraints } = req.body;
    
    const prompt = `Generate a custom PR playbook for this specific scenario:

Organization: ${JSON.stringify(organization)}
Scenario: ${scenario}
Objectives: ${objectives}
Constraints: ${constraints}

Create a detailed, actionable playbook:

1. **Situation Analysis**:
   - Current state assessment
   - Opportunity/threat evaluation
   - Stakeholder landscape
   - Competitive context

2. **Strategic Approach**:
   - Overall strategy
   - Key messages
   - Positioning strategy
   - Differentiation approach

3. **Tactical Playbook**:
   - Day 1-7: Immediate actions
   - Week 2-4: Building phase
   - Month 2-3: Amplification
   - Ongoing: Sustaining momentum

4. **Communication Plans**:
   For each stakeholder group:
   - Key messages
   - Channels to use
   - Timing/frequency
   - Success metrics

5. **Content Strategy**:
   - Content types needed
   - Production schedule
   - Distribution plan
   - Amplification tactics

6. **Risk Mitigation**:
   - Potential obstacles
   - Contingency plans
   - Crisis scenarios
   - Response protocols

7. **Resource Plan**:
   - Team assignments
   - Budget allocation
   - External resources
   - Timeline dependencies

8. **Success Metrics**:
   - Leading indicators
   - Lagging indicators
   - Milestone markers
   - ROI measurement

9. **Adaptation Triggers**:
   - When to accelerate
   - When to pivot
   - When to pause
   - When to exit

Provide specific examples, templates, and scripts where applicable.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      playbook: response,
      playbookId: `playbook-${Date.now()}`
    });
  } catch (error) {
    console.error("Playbook generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate playbook"
    });
  }
});

// ========================================
// UNIFIED INTELLIGENCE API
// ========================================

// Master Intelligence Query - Can answer any strategic question
router.post("/intelligence/query", authMiddleware, async (req, res) => {
  try {
    const { query, context, dataPoints, constraints } = req.body;
    
    const prompt = `You are SignalDesk's master intelligence analyst. Answer this strategic query with comprehensive, actionable intelligence:

Query: ${query}
Context: ${JSON.stringify(context)}
Available Data: ${JSON.stringify(dataPoints)}
Constraints: ${constraints}

Provide a thorough, executive-ready response that includes:

1. **Direct Answer**: Clear, concise response to the query
2. **Supporting Analysis**: Data and reasoning behind the answer
3. **Strategic Implications**: What this means for the organization
4. **Recommended Actions**: Specific next steps to take
5. **Risk Considerations**: What to watch out for
6. **Alternative Perspectives**: Other ways to view this issue
7. **Success Metrics**: How to measure outcomes
8. **Timeline**: When to act and expected results

Be specific, actionable, and confidence-rated in your response.`;

    const response = await claudeService.sendMessage(prompt);
    
    res.json({
      success: true,
      intelligence: response,
      queryId: `query-${Date.now()}`
    });
  } catch (error) {
    console.error("Intelligence query error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process intelligence query"
    });
  }
});

module.exports = router;