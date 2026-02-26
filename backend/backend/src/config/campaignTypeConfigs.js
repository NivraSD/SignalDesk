// Campaign type-specific configurations for SignalDesk
const campaignTypeConfigs = {
  // PRODUCT LAUNCH CAMPAIGNS
  "b2b-saas": {
    name: "B2B SaaS Launch",
    focusAreas: [
      "Technical decision makers (CTOs, VPs of Engineering)",
      "Business decision makers (CFOs, COOs)",
      "End users and administrators",
      "IT procurement teams",
    ],
    criticalElements: [
      "ROI calculator and business case",
      "Security and compliance documentation",
      "Integration capabilities and API docs",
      "Proof of concept program",
      "Customer success stories",
    ],
    specificPromptAdditions: `
  Think like a SaaS unicorn founder. You're not just launching software - you're starting a movement.
  
  Channel the strategies of Slack (workplace transformation), Notion (productivity revolution), 
  Figma (collaborative design), and Zoom (connection redefined).
  
  For this B2B SaaS launch, create strategies for:
  
  1. PRODUCT-LED GROWTH TACTICS
  - Viral loops within the product
  - Free tier that's impossible to resist
  - Expansion triggers built into UX
  - Community-driven feature requests
  
  2. DEVELOPER EVANGELISM (if applicable)
  - API documentation that developers love
  - Hackathon sponsorship strategy  
  - Open source contribution plan
  - Developer hero program
  
  3. CATEGORY CREATION
  - Why this isn't just another [category] tool
  - New vocabulary you're introducing
  - Market education strategy
  - Analyst briefing campaign
  
  4. ENTERPRISE LAND & EXPAND
  - Bottom-up adoption tactics
  - IT security champion program
  - Executive business case development
  - Fortune 500 pilot program design
  
  5. CONTENT & COMMUNITY
  - SaaS Academy educational content
  - User conference planning (virtual and IRL)
  - Certification program design
  - Template and integration marketplace
  
  Include specific tactics for each stage of the SaaS funnel:
  - Awareness: How to break through the noise (be specific)
  - Interest: Content that technical buyers actually want
  - Consideration: Proof points that matter to different stakeholders
  - Trial: Activation strategies that drive "aha moments"
  - Purchase: Removing friction from procurement
  - Expansion: Land and expand playbooks
  - Advocacy: Turning customers into evangelists
  
  Remember: B2B buyers are humans too. Make it memorable, make it shareable, make it inevitable.
`,
    keyMetrics: [
      "Qualified demos scheduled",
      "Free trial sign-ups",
      "Trial-to-paid conversion rate",
      "Average deal size",
      "Sales cycle length",
      "Feature adoption rate",
    ],
  },

  "consumer-tech": {
    name: "Consumer Tech Launch",
    focusAreas: [
      "Early adopters and tech enthusiasts",
      "Mainstream consumers",
      "Tech reviewers and influencers",
      "Retail partners",
    ],
    criticalElements: [
      "Unboxing experience",
      "User-friendly setup process",
      "Compelling product demos",
      "Influencer seeding program",
      "Retail display strategy",
    ],
    specificPromptAdditions: `
      For this consumer tech launch, analyze:
      - Consumer purchase behaviors and price sensitivity
      - Seasonal buying patterns and gift-giving opportunities
      - Competitor products and feature comparisons
      - Retail vs. direct-to-consumer strategies
      - Return rates and common pain points
      
      Focus tactical recommendations on:
      - YouTube tech reviewer outreach (MKBHD, Unbox Therapy, etc.)
      - Instagram and TikTok unboxing campaigns
      - Best Buy and Amazon retail strategies
      - Black Friday/Cyber Monday planning
      - Customer support and FAQ preparation
      - User community building
    `,
    keyMetrics: [
      "Pre-order numbers",
      "First month sales",
      "Amazon review ratings",
      "Social media mentions",
      "Return/exchange rate",
      "Customer satisfaction score",
    ],
  },

  "medical-device": {
    name: "Medical Device Launch",
    focusAreas: [
      "Healthcare providers (doctors, nurses)",
      "Hospital administrators",
      "Insurance companies",
      "Patient advocacy groups",
    ],
    criticalElements: [
      "Clinical trial data",
      "FDA approval status",
      "Reimbursement codes",
      "KOL endorsements",
      "Patient outcome stories",
    ],
    specificPromptAdditions: `
      For this medical device launch, analyze:
      - FDA regulatory pathway and approval timeline
      - Clinical evidence and peer-reviewed publications
      - Reimbursement landscape and payer requirements
      - Competitive clinical advantages
      - Training requirements for healthcare providers
      
      Focus tactical recommendations on:
      - Key Opinion Leader (KOL) advisory board
      - Medical conference presence (specific conferences)
      - Peer-reviewed journal placements
      - Hospital system pilot programs
      - Patient education materials
      - CME/CE credit programs for training
    `,
    keyMetrics: [
      "Hospital system adoptions",
      "Provider training completions",
      "Patient procedures performed",
      "Reimbursement approval rate",
      "Clinical outcome improvements",
      "Adverse event rate",
    ],
  },

  "cpg-product": {
    name: "CPG Product Launch",
    focusAreas: [
      "Retail buyers",
      "End consumers by demographic",
      "Food/lifestyle bloggers",
      "Retail merchandisers",
    ],
    criticalElements: [
      "Shelf placement strategy",
      "Packaging design impact",
      "Sampling programs",
      "Coupon/promotion strategy",
      "Supply chain readiness",
    ],
    specificPromptAdditions: `
      For this CPG product launch, analyze:
      - Retail category dynamics and shelf space competition
      - Consumer purchase triggers and loyalty drivers
      - Price point optimization and margin requirements
      - Seasonal sales patterns and promotional calendars
      - Sustainability and clean label trends
      
      Focus tactical recommendations on:
      - Retail buyer pitch decks and category reviews
      - In-store demo and sampling programs
      - Digital coupon and loyalty app strategies
      - Instagram food influencer campaigns
      - Amazon Prime placement strategies
      - Trade publication coverage
    `,
    keyMetrics: [
      "Retail door count",
      "Velocity (units per store per week)",
      "Repeat purchase rate",
      "Coupon redemption rate",
      "Market share growth",
      "Distribution gains",
    ],
  },

  fintech: {
    name: "Fintech Product Launch",
    focusAreas: [
      "Financial decision makers",
      "Compliance officers",
      "End users by segment",
      "Financial advisors/brokers",
    ],
    criticalElements: [
      "Security features",
      "Regulatory compliance",
      "Trust indicators",
      "Fee transparency",
      "Mobile experience",
    ],
    specificPromptAdditions: `
      For this fintech launch, analyze:
      - Regulatory requirements by jurisdiction
      - Security concerns and trust barriers
      - Competitor fee structures and features
      - API and integration requirements
      - User onboarding friction points
      
      Focus tactical recommendations on:
      - Financial media relations (WSJ, Bloomberg, CNBC)
      - Compliance and security messaging
      - Partnership strategies with banks/institutions
      - Trust-building through transparency
      - Mobile-first user experience demos
      - Financial advisor enablement programs
    `,
    keyMetrics: [
      "Account openings",
      "Assets under management",
      "Transaction volume",
      "Customer acquisition cost",
      "Regulatory approvals obtained",
      "App store ratings",
    ],
  },

  // BRAND & REPUTATION CAMPAIGNS
  "brand-reposition": {
    name: "Brand Repositioning",
    focusAreas: [
      "Current brand perceptions",
      "Desired brand attributes",
      "Key stakeholder groups",
      "Employee ambassadors",
    ],
    criticalElements: [
      "Brand perception research",
      "Visual identity evolution",
      "Messaging framework",
      "Internal alignment",
      "Proof points",
    ],
    specificPromptAdditions: `
      For this brand repositioning, analyze:
      - Current brand perception gaps
      - Competitive positioning landscape
      - Cultural and market shifts driving change
      - Internal culture alignment needs
      - Customer sentiment and loyalty risks
      
      Focus tactical recommendations on:
      - Employee ambassador program launch
      - CEO thought leadership campaign
      - Visual identity rollout strategy
      - Customer communication plan
      - Media narrative shifting tactics
      - Brand experience touchpoint updates
    `,
    keyMetrics: [
      "Brand perception lift",
      "Employee engagement scores",
      "Media sentiment shift",
      "Customer retention rate",
      "Share of voice",
      "Brand consideration scores",
    ],
  },

  "thought-leadership": {
    name: "Thought Leadership",
    focusAreas: [
      "Industry media and journalists",
      "Conference organizers",
      "Peer executives",
      "LinkedIn audience",
    ],
    criticalElements: [
      "Unique perspective/thesis",
      "Supporting data/research",
      "Speaking topics",
      "Content calendar",
      "Media training",
    ],
    specificPromptAdditions: `
      For this thought leadership campaign, analyze:
      - Current industry conversations and gaps
      - Executive's unique expertise and perspectives
      - Controversial or contrarian viewpoints
      - Speaking circuit opportunities
      - Competitor executive positioning
      
      Focus tactical recommendations on:
      - Tier 1 media relationships (specific reporters)
      - LinkedIn content strategy and cadence
      - Podcast tour targeting (name specific shows)
      - Conference keynote opportunities
      - Op-ed and byline placements
      - Executive peer networking events
    `,
    keyMetrics: [
      "Speaking invitations",
      "Media quotes as expert",
      "LinkedIn follower growth",
      "Engagement rate on content",
      "Byline placements",
      "Podcast appearances",
    ],
  },

  "corporate-reputation": {
    name: "Corporate Reputation",
    focusAreas: [
      "Investors and analysts",
      "Employees and recruits",
      "Community stakeholders",
      "Industry partners",
    ],
    criticalElements: [
      "Corporate values proof",
      "Leadership visibility",
      "Community impact",
      "Employee stories",
      "Awards and recognition",
    ],
    specificPromptAdditions: `
      For this corporate reputation campaign, analyze:
      - Stakeholder perception mapping
      - Reputation risks and vulnerabilities
      - Corporate citizenship opportunities
      - Employee advocacy potential
      - Industry award landscapes
      
      Focus tactical recommendations on:
      - Investor relations enhancement
      - Employee storytelling program
      - Community partnership activation
      - Awards submission strategy
      - Corporate content hub development
      - Executive visibility program
    `,
    keyMetrics: [
      "Reputation score improvement",
      "Employee NPS",
      "Investor confidence index",
      "Media favorability",
      "Award wins",
      "Recruitment metrics",
    ],
  },

  "esg-sustainability": {
    name: "ESG/Sustainability",
    focusAreas: [
      "ESG investors",
      "Sustainability advocates",
      "Employees",
      "Regulatory bodies",
    ],
    criticalElements: [
      "Measurable impact data",
      "Third-party validation",
      "Transparency reports",
      "Progress milestones",
      "Stakeholder engagement",
    ],
    specificPromptAdditions: `
      For this ESG campaign, analyze:
      - ESG rating agency requirements
      - Peer company ESG benchmarks
      - Greenwashing risks and mitigation
      - Impact measurement frameworks
      - Stakeholder materiality priorities
      
      Focus tactical recommendations on:
      - ESG report publication strategy
      - Rating agency engagement plan
      - Sustainability media relations
      - Employee green team activation
      - Partnership with environmental NGOs
      - Impact storytelling campaign
    `,
    keyMetrics: [
      "ESG rating improvements",
      "Sustainability report downloads",
      "Carbon footprint reduction",
      "Employee participation rate",
      "Media coverage tone",
      "Investor ESG inquiries",
    ],
  },

  "employer-branding": {
    name: "Employer Branding",
    focusAreas: [
      "Target talent pools",
      "Current employees",
      "University relations",
      "Recruitment partners",
    ],
    criticalElements: [
      "Employee value proposition",
      "Culture proof points",
      "Career growth stories",
      "Benefits differentiation",
      "Diversity commitment",
    ],
    specificPromptAdditions: `
      For this employer branding campaign, analyze:
      - Talent competitor landscape
      - Employee satisfaction drivers
      - Recruitment pain points
      - Diversity and inclusion gaps
      - Remote work positioning
      
      Focus tactical recommendations on:
      - Glassdoor and Indeed optimization
      - Employee ambassador program
      - University partnership strategy
      - LinkedIn talent brand content
      - Recruitment event strategy
      - Employee referral campaign
    `,
    keyMetrics: [
      "Application volume increase",
      "Quality of hire scores",
      "Employee referral rate",
      "Glassdoor rating",
      "Time to fill positions",
      "Offer acceptance rate",
    ],
  },

  // MARKETING CAMPAIGNS
  "integrated-marketing": {
    name: "Integrated Marketing",
    focusAreas: [
      "Multi-channel coordination",
      "Consistent messaging",
      "Customer journey mapping",
      "Attribution modeling",
    ],
    criticalElements: [
      "Channel integration plan",
      "Creative consistency",
      "Journey orchestration",
      "Measurement framework",
      "Budget allocation",
    ],
    specificPromptAdditions: `
      For this integrated marketing campaign, analyze:
      - Customer journey touchpoints
      - Channel performance benchmarks
      - Message resonance by channel
      - Attribution challenges
      - Creative production needs
      
      Focus tactical recommendations on:
      - Omnichannel creative strategy
      - Marketing automation setup
      - Cross-channel attribution model
      - Unified reporting dashboard
      - Channel budget optimization
      - Testing and learning agenda
    `,
    keyMetrics: [
      "Cross-channel conversion rate",
      "Customer journey completion",
      "Marketing qualified leads",
      "Cost per acquisition",
      "Brand lift across channels",
      "Attribution accuracy",
    ],
  },

  "influencer-campaign": {
    name: "Influencer Campaign",
    focusAreas: [
      "Influencer identification",
      "Audience alignment",
      "Content authenticity",
      "Performance tracking",
    ],
    criticalElements: [
      "Influencer vetting process",
      "Content guidelines",
      "FTC compliance",
      "Performance metrics",
      "Relationship management",
    ],
    specificPromptAdditions: `
      For this influencer campaign, analyze:
      - Influencer landscape by tier
      - Audience overlap and authenticity
      - Content performance benchmarks
      - Compliance requirements
      - Competitor influencer strategies
      
      Focus tactical recommendations on:
      - Micro vs macro influencer mix
      - Platform-specific strategies
      - Content collaboration frameworks
      - Performance tracking setup
      - Long-term ambassador programs
      - UGC amplification strategy
    `,
    keyMetrics: [
      "Reach and impressions",
      "Engagement rate",
      "Click-through rate",
      "Conversion attribution",
      "Content quality score",
      "Cost per engagement",
    ],
  },

  "content-marketing": {
    name: "Content Marketing",
    focusAreas: [
      "Content pillars",
      "SEO optimization",
      "Distribution strategy",
      "Audience engagement",
    ],
    criticalElements: [
      "Editorial calendar",
      "Content types mix",
      "SEO strategy",
      "Distribution channels",
      "Performance metrics",
    ],
    specificPromptAdditions: `
      For this content marketing campaign, analyze:
      - Content gap analysis
      - SEO keyword opportunities
      - Competitor content strategies
      - Audience content preferences
      - Distribution channel effectiveness
      
      Focus tactical recommendations on:
      - Pillar content development
      - SEO-driven topic clusters
      - Guest posting strategy
      - Content repurposing plan
      - Email nurture sequences
      - Content performance optimization
    `,
    keyMetrics: [
      "Organic traffic growth",
      "Content engagement rate",
      "Lead generation",
      "SEO rankings improvement",
      "Social shares",
      "Content ROI",
    ],
  },

  "event-marketing": {
    name: "Event Marketing",
    focusAreas: [
      "Event experience design",
      "Attendee acquisition",
      "Sponsor value",
      "Content capture",
    ],
    criticalElements: [
      "Event positioning",
      "Speaker lineup",
      "Sponsor packages",
      "Attendee journey",
      "Follow-up strategy",
    ],
    specificPromptAdditions: `
      For this event marketing campaign, analyze:
      - Competitive event landscape
      - Attendee persona mapping
      - Sponsor value propositions
      - Virtual/hybrid considerations
      - Content monetization opportunities
      
      Focus tactical recommendations on:
      - Early bird promotion strategy
      - Speaker recruitment and promotion
      - Sponsor acquisition campaign
      - Social media event strategy
      - Live content creation plan
      - Post-event nurture campaign
    `,
    keyMetrics: [
      "Registration numbers",
      "Attendance rate",
      "Sponsor satisfaction",
      "Lead quality score",
      "Content engagement",
      "Net promoter score",
    ],
  },

  "partnership-launch": {
    name: "Partnership Launch",
    focusAreas: [
      "Partner alignment",
      "Co-marketing plans",
      "Channel enablement",
      "Joint messaging",
    ],
    criticalElements: [
      "Partnership value prop",
      "Co-branded assets",
      "Launch timeline",
      "Success metrics",
      "Governance model",
    ],
    specificPromptAdditions: `
      For this partnership launch, analyze:
      - Partner audience overlap
      - Co-marketing opportunities
      - Channel conflict risks
      - Joint value proposition
      - Competitive partnership landscape
      
      Focus tactical recommendations on:
      - Joint press release strategy
      - Co-branded content creation
      - Partner enablement materials
      - Customer communication plan
      - Trade media coverage
      - Success story development
    `,
    keyMetrics: [
      "Partner-sourced leads",
      "Co-marketing reach",
      "Joint customer acquisition",
      "Partner satisfaction",
      "Revenue attribution",
      "Market perception lift",
    ],
  },

  // AGENCY SERVICES
  "new-business-proposal": {
    name: "New Business Proposal",
    focusAreas: [
      "Client pain points",
      "Competitive advantage",
      "Team expertise",
      "Case study relevance",
    ],
    criticalElements: [
      "Insight-led strategy",
      "Creative concepts",
      "Budget justification",
      "Team bios",
      "Success metrics",
    ],
    specificPromptAdditions: `
  You are creating a WINNING agency proposal that will beat all competitors. This isn't about meeting requirements - it's about winning hearts and minds.
  
  CRITICAL: Parse the entire RFP/brief and create a SPECIFIC solution for EVERY SINGLE requirement mentioned. Miss nothing.
  
  For EVERY requirement in the RFP:
  1. Show you understood it better than they expressed it
  2. Provide a solution that exceeds expectations  
  3. Back it up with proof from similar work
  4. Explain why your approach is uniquely effective
  5. Connect it to business outcomes they care about
  6. Suggest metrics to measure success
  
  Structure your proposal with:
  
  1. EXECUTIVE SUMMARY
  - The big insight that changes everything
  - Why you're the only agency that can do this
  - What success looks like in year 1, 2, and 3
  
  2. UNDERSTANDING OF THEIR BUSINESS
  - Industry dynamics they might not have considered
  - Competitor moves they should worry about
  - Opportunities they haven't seen yet
  
  3. STRATEGIC APPROACH
  - Your proprietary methodology for their challenge
  - How you'll measure success differently
  - Quick wins in first 90 days
  
  4. CREATIVE DEMONSTRATION
  - Sample creative concepts to show your thinking
  - Channel innovations they haven't considered
  - Partnership ideas that multiply impact
  
  5. TEAM PRESENTATION
  - Why your team is perfectly suited
  - Similar challenges you've solved
  - Chemistry indicators and cultural fit
  
  6. PRICING INNOVATION
  - Value-based pricing models
  - Performance incentives
  - Efficiency guarantees
  
  7. WHY YOU'LL WIN TOGETHER
  - Your vision for their success
  - How you'll make them look like heroes
  - The legacy you'll build together
  
  Remember: They're not buying services, they're buying transformation. Show them the future.
`,
    keyMetrics: [
      "Proposal win rate",
      "Presentation scores",
      "Budget approval rate",
      "Contract value",
      "Client feedback scores",
      "Time to contract",
    ],
  },

  "campaign-pitch": {
    name: "Campaign Pitch Deck",
    focusAreas: [
      "Campaign big idea",
      "Creative execution",
      "Media strategy",
      "Measurement plan",
    ],
    criticalElements: [
      "Strategic insight",
      "Creative concepts",
      "Channel strategy",
      "Budget allocation",
      "Success metrics",
    ],
    specificPromptAdditions: `
      For this campaign pitch, analyze:
      - Client brief requirements
      - Target audience insights
      - Creative territory options
      - Media mix optimization
      - Competitive campaigns
      
      Focus tactical recommendations on:
      - Big idea development
      - Creative concept testing
      - Media plan innovation
      - Influencer integration
      - Measurement framework
      - Presentation flow
    `,
    keyMetrics: [
      "Pitch win rate",
      "Creative approval score",
      "Budget efficiency",
      "Projected campaign ROI",
      "Client enthusiasm level",
      "Concept memorability",
    ],
  },

  "annual-planning": {
    name: "Annual PR Planning",
    focusAreas: [
      "Year-long narrative",
      "Milestone mapping",
      "Budget allocation",
      "Team resourcing",
    ],
    criticalElements: [
      "Annual themes",
      "Quarterly focuses",
      "Tentpole moments",
      "Contingency plans",
      "Success metrics",
    ],
    specificPromptAdditions: `
      For this annual planning, analyze:
      - Previous year performance
      - Upcoming business milestones
      - Industry event calendar
      - Competitive activities
      - Budget constraints
      
      Focus tactical recommendations on:
      - Annual narrative arc
      - Quarterly theme development
      - Tentpole moment planning
      - Always-on program design
      - Crisis preparedness
      - Measurement dashboard
    `,
    keyMetrics: [
      "Annual reach goals",
      "Quarterly milestones",
      "Budget utilization",
      "Media coverage quality",
      "Executive visibility",
      "Team productivity",
    ],
  },

  "quarterly-review": {
    name: "Quarterly Review",
    focusAreas: [
      "Performance analysis",
      "Goal achievement",
      "Learnings captured",
      "Next quarter planning",
    ],
    criticalElements: [
      "KPI performance",
      "Win stories",
      "Challenge analysis",
      "Optimization plans",
      "Budget status",
    ],
    specificPromptAdditions: `
      For this quarterly review, analyze:
      - KPI performance vs goals
      - Campaign effectiveness
      - Budget burn rate
      - Team utilization
      - Client satisfaction
      
      Focus tactical recommendations on:
      - Performance visualization
      - Success story packaging
      - Learning documentation
      - Optimization opportunities
      - Next quarter priorities
      - Resource reallocation
    `,
    keyMetrics: [
      "Goal achievement rate",
      "Budget variance",
      "Client satisfaction score",
      "Team utilization rate",
      "Quality scores",
      "Efficiency improvements",
    ],
  },

  "budget-justification": {
    name: "Budget Justification",
    focusAreas: [
      "ROI demonstration",
      "Value creation",
      "Competitive benchmarks",
      "Future opportunities",
    ],
    criticalElements: [
      "Historical ROI",
      "Benchmark data",
      "Value metrics",
      "Growth potential",
      "Risk mitigation",
    ],
    specificPromptAdditions: `
      For this budget justification, analyze:
      - Historical program ROI
      - Competitive spend levels
      - Missed opportunities from underfunding
      - Value creation potential
      - Risk of budget cuts
      
      Focus tactical recommendations on:
      - ROI calculation methodology
      - Competitive benchmarking
      - Value story development
      - Visual data presentation
      - Scenario planning
      - Executive presentation prep
    `,
    keyMetrics: [
      "Program ROI",
      "Cost per outcome",
      "Competitive spend index",
      "Value metrics achieved",
      "Efficiency gains",
      "Budget approval rate",
    ],
  },
};

// Add a creative prompt generator for extra uniqueness
campaignTypeConfigs.generateCreativeBoost = (campaignType, brief) => {
  const briefLength = brief.split(" ").length;
  const isComplexBrief = briefLength > 500;

  const creativeBoosts = {
    "b2b-saas": `
      Additional creative angles:
      - What if this was marketed like a consumer product (think Spotify or Netflix)?
      - How would a16z portfolio companies launch this?
      - What would Product Hunt launch day look like?
      - Channel the strategies of Slack, Notion, or Airtable
      ${
        isComplexBrief
          ? "- Create a detailed response matrix for each requirement in the brief"
          : ""
      }
    `,
    "consumer-tech": `
      Think like Apple's "Think Different" campaign:
      - What emotion are we really selling?
      - How do we create an unboxing experience people film?
      - What would make MKBHD say "This is dope"?
      ${
        isComplexBrief
          ? "- Address each feature with a unique marketing angle"
          : ""
      }
    `,
    "thought-leadership": `
      Provocative angles to explore:
      - What sacred cow should this executive slaughter?
      - What future prediction would grab headlines?
      - What manifesto would start a movement?
      - What's their "Start with Why" moment?
      ${
        isComplexBrief
          ? "- Address each speaking topic and content theme mentioned"
          : ""
      }
    `,
    "new-business-proposal": `
      Winning strategies:
      - What's the "room reading" insight about this client?
      - How do we show chemistry before we meet?
      - What's the unexpected creative demonstration?
      - What would make them say "Why didn't we think of that?"
      ${
        isComplexBrief
          ? "- Create a detailed solution for EVERY requirement in the RFP"
          : ""
      }
    `,
    "brand-reposition": `
      Transformation thinking:
      - What's the defining tagline moment for this brand?
      - How do we make employees cry (in a good way)?
      - What would make competitors jealous?
      ${
        isComplexBrief
          ? "- Address each stakeholder group with specific strategies"
          : ""
      }
    `,
  };

  return creativeBoosts[campaignType] || "";
};
module.exports = campaignTypeConfigs;
