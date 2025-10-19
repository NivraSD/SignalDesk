const pool = require("../config/db");
const claudeService = require("../../config/claude");

// Helper function to clean JSON response from Claude
const cleanJsonResponse = (response) => {
  return response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

// Default crisis team structure
const getDefaultCrisisTeam = () => [
  {
    role: "Crisis Response Leader",
    title: "Chief Executive Officer or designated senior executive",
    name: "",
    contact: "",
    responsibilities: [
      "Overall crisis response authority and decision-making",
      "External stakeholder communications approval",
      "Resource allocation and strategic direction",
    ],
  },
  {
    role: "Communications Director",
    title: "Head of Communications/PR or senior communications executive",
    name: "",
    contact: "",
    responsibilities: [
      "Develop and implement communication strategies",
      "Media relations and press release coordination",
      "Message consistency across all channels",
    ],
  },
  {
    role: "Operations Manager",
    title: "Chief Operating Officer or senior operations executive",
    name: "",
    contact: "",
    responsibilities: [
      "Operational impact assessment and mitigation",
      "Business continuity plan activation",
      "Internal coordination and resource management",
    ],
  },
  {
    role: "Legal Counsel",
    title: "General Counsel or senior legal advisor",
    name: "",
    contact: "",
    responsibilities: [
      "Legal risk assessment and compliance guidance",
      "Regulatory notification requirements",
      "Litigation risk management",
    ],
  },
  {
    role: "Human Resources Lead",
    title: "Chief Human Resources Officer or senior HR executive",
    name: "",
    contact: "",
    responsibilities: [
      "Employee communications and support",
      "Staff safety and welfare coordination",
      "Union and labor relations management",
    ],
  },
];

// Universal scenarios
const getUniversalScenarios = () => [
  {
    title: "Cyber Attack / Ransomware",
    description:
      "Sophisticated cyber attack compromising systems, encrypting data, or demanding ransom payment",
    likelihood: "High",
    impact: "Critical",
    isUniversal: true,
  },
  {
    title: "Executive Misconduct",
    description:
      "Senior leadership accused of illegal, unethical, or inappropriate behavior",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true,
  },
  {
    title: "Workplace Violence Incident",
    description: "Active threat or violent incident at company facilities",
    likelihood: "Low",
    impact: "Critical",
    isUniversal: true,
  },
  {
    title: "Financial Fraud or Embezzlement",
    description:
      "Discovery of internal financial misconduct or accounting irregularities",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true,
  },
  {
    title: "Pandemic/Health Emergency",
    description:
      "Widespread health crisis requiring business continuity measures",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true,
  },
];

// Simplified fallback data function
const getFallbackData = (industry) => ({
  scenarios: [
    {
      title: "Major Data Security Breach",
      description: `Unauthorized access to sensitive ${industry} data affecting customer records`,
      likelihood: "High",
      impact: "Critical",
      isUniversal: false,
    },
    {
      title: "Regulatory Compliance Violation",
      description: `Significant breach of ${industry} regulations resulting in potential fines`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false,
    },
    {
      title: "Supply Chain Disruption",
      description: `Critical supplier failure affecting ${industry} operations`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false,
    },
    {
      title: "Product/Service Quality Crisis",
      description: `Major quality issues affecting ${industry} products or services`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false,
    },
    {
      title: "Reputation Crisis",
      description: `Negative publicity significantly impacting ${industry} brand reputation`,
      likelihood: "High",
      impact: "Major",
      isUniversal: false,
    },
  ],
  stakeholders: [
    {
      name: "Customers/Clients",
      description: "Primary users of products/services",
      impactLevel: "High",
      concerns: [
        "Service continuity",
        "Data security",
        "Communication transparency",
      ],
    },
    {
      name: "Employees",
      description: "Internal workforce and contractors",
      impactLevel: "High",
      concerns: ["Job security", "Safety measures", "Clear guidance"],
    },
    {
      name: "Shareholders/Investors",
      description: "Financial stakeholders and board members",
      impactLevel: "High",
      concerns: [
        "Financial impact",
        "Recovery timeline",
        "Leadership response",
      ],
    },
    {
      name: "Regulatory Bodies",
      description: `Government agencies overseeing ${industry} compliance`,
      impactLevel: "Medium",
      concerns: [
        "Compliance status",
        "Corrective actions",
        "Reporting requirements",
      ],
    },
    {
      name: "Media",
      description: "News outlets and industry publications",
      impactLevel: "Medium",
      concerns: ["Accurate information", "Company response", "Public impact"],
    },
    {
      name: "Business Partners",
      description: "Suppliers, vendors, and strategic partners",
      impactLevel: "Medium",
      concerns: [
        "Business continuity",
        "Contract obligations",
        "Partnership stability",
      ],
    },
    {
      name: "Local Community",
      description: "Communities where the company operates",
      impactLevel: "Low",
      concerns: ["Environmental impact", "Economic effects", "Safety concerns"],
    },
    {
      name: "Industry Competitors",
      description: "Other companies in the same market",
      impactLevel: "Low",
      concerns: [
        "Market dynamics",
        "Industry reputation",
        "Competitive advantages",
      ],
    },
  ],
  communicationPlans: [
    {
      stakeholder: "Customers/Clients",
      primaryChannel: "Email and company website",
      secondaryChannel: "Social media and call center",
      keyMessages: [
        "We are aware of the situation and taking immediate action",
        "Your safety and security are our top priorities",
        "Here's what we're doing to resolve the issue",
      ],
      timing: "Within 2 hours of crisis confirmation",
      spokesperson: "CEO or Chief Customer Officer",
    },
    {
      stakeholder: "Employees",
      primaryChannel: "Internal communication system",
      secondaryChannel: "Emergency text messaging",
      keyMessages: [
        "Clear instructions for immediate actions",
        "Safety and security protocols",
        "Updates on business continuity plans",
      ],
      timing: "Within 1 hour of crisis identification",
      spokesperson: "CEO or Crisis Response Leader",
    },
    {
      stakeholder: "Shareholders/Investors",
      primaryChannel: "Investor relations portal",
      secondaryChannel: "Direct email to major shareholders",
      keyMessages: [
        "Financial impact assessment",
        "Management response and mitigation strategies",
        "Long-term recovery outlook",
      ],
      timing: "Within 4 hours or per regulatory requirements",
      spokesperson: "CEO and CFO",
    },
    {
      stakeholder: "Regulatory Bodies",
      primaryChannel: "Official regulatory filings",
      secondaryChannel: "Direct communication with regulators",
      keyMessages: [
        "Full disclosure of incident details",
        "Compliance measures being taken",
        "Timeline for resolution",
      ],
      timing: "As required by regulations",
      spokesperson: "Legal Counsel and Compliance Officer",
    },
    {
      stakeholder: "Media",
      primaryChannel: "Press release and press conference",
      secondaryChannel: "Media relations team outreach",
      keyMessages: [
        "Facts about the situation",
        "Company response and actions",
        "Commitment to transparency",
      ],
      timing: "Within 4 hours of crisis becoming public",
      spokesperson: "CEO or designated media spokesperson",
    },
  ],
});

// Generate crisis plan
exports.generatePlan = async (req, res) => {
  try {
    const { industry } = req.body;
    const userId = req.user.id;

    if (!industry) {
      return res.status(400).json({ error: "Industry is required" });
    }

    // Declare variables at the top
    let scenarios, stakeholders, communicationPlans;

    try {
      // Generate scenarios
      const scenariosPrompt = `For the ${industry} industry, generate 5 specific crisis scenarios that could realistically occur. Each scenario should be unique to this industry. Do NOT include generic scenarios like cyber attacks or executive misconduct - focus only on industry-specific crises.

Respond ONLY with a valid JSON object in this format:
{
  "scenarios": [
    {
      "title": "Scenario name",
      "description": "Brief description of the crisis",
      "likelihood": "High/Medium/Low",
      "impact": "Critical/Major/Moderate/Minor"
    }
  ]
}

Your entire response MUST be a single, valid JSON object. DO NOT include any text outside of the JSON structure.`;

      console.log("DEBUG: Calling Claude for crisis scenarios...");
      const scenariosResponse = await claudeService.sendMessage(
        scenariosPrompt
      );
      console.log(
        "DEBUG: Received scenarios response, length:",
        scenariosResponse?.length
      );

      try {
        const cleanedResponse = cleanJsonResponse(scenariosResponse);
        scenarios = JSON.parse(cleanedResponse);
        console.log(
          "✅ Scenarios parsed successfully:",
          scenarios.scenarios?.length,
          "scenarios"
        );
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError.message);
        throw parseError;
      }

      // Generate stakeholders
      const stakeholderPrompt = `For the ${industry} industry, identify 8 key stakeholders and analyze the impact of a crisis on each group.

Respond ONLY with a valid JSON object in this format:
{
  "stakeholders": [
    {
      "name": "Stakeholder group name",
      "description": "Role and importance",
      "impactLevel": "High/Medium/Low",
      "concerns": ["concern1", "concern2", "concern3"]
    }
  ]
}`;

      const stakeholderResponse = await claudeService.sendMessage(
        stakeholderPrompt
      );
      console.log(
        "DEBUG: Received stakeholder response, length:",
        stakeholderResponse?.length
      );

      try {
        const cleanedStakeholder = cleanJsonResponse(stakeholderResponse);
        stakeholders = JSON.parse(cleanedStakeholder);
        console.log(
          "✅ Stakeholders parsed successfully:",
          stakeholders.stakeholders?.length,
          "stakeholders"
        );
      } catch (parseError) {
        console.error("❌ Stakeholder JSON Parse Error:", parseError.message);
        throw parseError;
      }

      // Generate communication plans
      const commPlanPrompt = `For the ${industry} industry crisis management, create a communication plan for the top 5 stakeholder groups.

Respond ONLY with a valid JSON object in this format:
{
  "communicationPlans": [
    {
      "stakeholder": "Stakeholder name",
      "primaryChannel": "Main communication method",
      "secondaryChannel": "Backup communication method",
      "keyMessages": ["message1", "message2", "message3"],
      "timing": "When to communicate"
    }
  ]
}`;

      const commResponse = await claudeService.sendMessage(commPlanPrompt);
      console.log(
        "DEBUG: Received comm plan response, length:",
        commResponse?.length
      );

      try {
        const cleanedComm = cleanJsonResponse(commResponse);
        communicationPlans = JSON.parse(cleanedComm);
        console.log("✅ Communication plans parsed successfully");
      } catch (parseError) {
        console.error("❌ Comm Plan JSON Parse Error:", parseError.message);
        throw parseError;
      }

      // Create the crisis plan
      const crisisPlan = {
        industry,
        generatedDate: new Date().toLocaleDateString(),
        scenarios: [
          ...scenarios.scenarios.map((s) => ({ ...s, isUniversal: false })),
          ...getUniversalScenarios(),
        ],
        stakeholders: stakeholders.stakeholders,
        communicationPlans: communicationPlans.communicationPlans,
        crisisTeam: getDefaultCrisisTeam(),
        objectives: null,
        isAIGenerated: true,
      };

      // Save to database
      const result = await pool.query(
        "INSERT INTO crisis_plans (user_id, industry, plan_data) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET industry = $2, plan_data = $3, updated_at = CURRENT_TIMESTAMP RETURNING *",
        [userId, industry, JSON.stringify(crisisPlan)]
      );

      // Return response in the format the frontend expects
      res.json({
        success: true,
        plan: {
          plan_data: crisisPlan,
          id: result.rows[0].id,
        },
      });
    } catch (error) {
      console.error("Claude API error:", error);

      // Use fallback data
      const fallbackData = getFallbackData(industry);
      const crisisPlan = {
        industry,
        generatedDate: new Date().toLocaleDateString(),
        ...fallbackData,
        crisisTeam: getDefaultCrisisTeam(),
        objectives: null,
        isAIGenerated: false,
      };

      // Save to database
      const result = await pool.query(
        "INSERT INTO crisis_plans (user_id, industry, plan_data) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET industry = $2, plan_data = $3, updated_at = CURRENT_TIMESTAMP RETURNING *",
        [userId, industry, JSON.stringify(crisisPlan)]
      );

      res.json({
        success: true,
        plan: {
          plan_data: crisisPlan,
          id: result.rows[0].id,
        },
      });
    }
  } catch (error) {
    console.error("Error generating crisis plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate crisis plan",
      message: error.message,
    });
  }
};

// Get saved crisis plan
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM crisis_plans WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ plan: null });
    }

    const plan = result.rows[0];
    res.json({
      plan: {
        id: plan.id,
        plan_data: plan.plan_data,
        industry: plan.industry,
        created_at: plan.created_at,
        updated_at: plan.updated_at,
      },
    });
  } catch (error) {
    console.error("Get plan error:", error);
    res.status(500).json({ error: "Failed to retrieve crisis plan" });
  }
};

// Update crisis plan
exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planData } = req.body;

    const result = await pool.query(
      "UPDATE crisis_plans SET plan_data = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *",
      [userId, JSON.stringify(planData)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Crisis plan not found" });
    }

    res.json({
      plan: {
        id: result.rows[0].id,
        plan_data: result.rows[0].plan_data,
      },
    });
  } catch (error) {
    console.error("Update plan error:", error);
    res.status(500).json({ error: "Failed to update crisis plan" });
  }
};

// Delete crisis plan
exports.deletePlan = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query("DELETE FROM crisis_plans WHERE user_id = $1", [userId]);

    res.json({ message: "Crisis plan deleted successfully" });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ error: "Failed to delete crisis plan" });
  }
};

// AI Crisis Advisor with Auto-Detection
exports.getAIAdvice = async (req, res) => {
  try {
    const { query, context } = req.body;
    const userId = req.user.id;

    console.log("=== AI Crisis Advisor called ===");
    console.log("Query:", query);
    console.log("Context:", context);

    // Crisis type detection patterns
    const crisisPatterns = {
      dataBreach: {
        keywords: [
          "data breach",
          "hacked",
          "ransomware",
          "cyber attack",
          "stolen data",
          "compromised",
          "encrypted",
          "malware",
          "phishing",
        ],
        name: "Data Security Breach",
      },
      prCrisis: {
        keywords: [
          "negative press",
          "bad publicity",
          "viral",
          "social media backlash",
          "reputation",
          "scandal",
          "trending",
          "boycott",
        ],
        name: "Public Relations Crisis",
      },
      financial: {
        keywords: [
          "fraud",
          "embezzlement",
          "financial loss",
          "accounting",
          "insider trading",
          "SEC",
          "audit",
          "misappropriation",
        ],
        name: "Financial Crisis",
      },
      safety: {
        keywords: [
          "accident",
          "injury",
          "workplace incident",
          "safety",
          "OSHA",
          "fatality",
          "hospitalized",
          "emergency",
        ],
        name: "Safety Incident",
      },
      leadership: {
        keywords: [
          "executive",
          "misconduct",
          "resignation",
          "scandal",
          "CEO",
          "harassment",
          "discrimination",
          "ethics violation",
        ],
        name: "Leadership Crisis",
      },
      product: {
        keywords: [
          "recall",
          "defect",
          "quality issue",
          "contamination",
          "malfunction",
          "consumer complaint",
          "FDA",
          "CPSC",
        ],
        name: "Product Crisis",
      },
      legal: {
        keywords: [
          "lawsuit",
          "investigation",
          "regulatory",
          "compliance",
          "subpoena",
          "litigation",
          "class action",
          "indictment",
        ],
        name: "Legal/Regulatory Crisis",
      },
      operational: {
        keywords: [
          "system down",
          "outage",
          "disruption",
          "supply chain",
          "facility",
          "power failure",
          "network",
          "downtime",
        ],
        name: "Operational Crisis",
      },
    };

    // Detect crisis type from query
    let detectedCrisisType = null;
    let detectedCrisisName = null;
    const queryLower = query.toLowerCase();

    for (const [type, config] of Object.entries(crisisPatterns)) {
      if (config.keywords.some((keyword) => queryLower.includes(keyword))) {
        detectedCrisisType = type;
        detectedCrisisName = config.name;
        console.log(`✅ Detected crisis type: ${detectedCrisisName}`);
        break;
      }
    }

    // Get immediate actions based on crisis type
    const getImmediateActions = (type) => {
      const actions = {
        dataBreach: [
          "Isolate affected systems immediately to prevent further damage",
          "Activate IT security team and begin forensic investigation",
          "Document timeline: when discovered, how detected, initial scope",
          "Notify legal counsel to assess disclosure obligations",
          "Prepare breach notification templates for required parties",
        ],
        prCrisis: [
          "Set up social media monitoring for real-time sentiment tracking",
          "Draft initial holding statement acknowledging awareness",
          "Designate single spokesperson for all communications",
          "Brief leadership team on situation and messaging",
          "Identify and reach out to key influencers/supporters",
        ],
        financial: [
          "Secure all financial records and freeze affected accounts",
          "Notify internal audit and compliance teams immediately",
          "Contact external auditors and legal counsel",
          "Prepare initial disclosure for board of directors",
          "Review insurance policies for coverage",
        ],
        safety: [
          "Ensure all personnel are safe and accounted for",
          "Secure the incident scene and preserve evidence",
          "Contact emergency services if not already notified",
          "Notify regulatory bodies per reporting requirements",
          "Begin documenting witness statements and conditions",
        ],
        leadership: [
          "Convene emergency board/leadership meeting",
          "Engage employment law counsel immediately",
          "Review all related documentation and communications",
          "Prepare internal communication for employees",
          "Consider placing individual on administrative leave",
        ],
        product: [
          "Stop distribution/sales of affected products immediately",
          "Identify scope: batch numbers, distribution, units affected",
          "Prepare customer notification and recall procedures",
          "Contact regulatory agencies (FDA, CPSC, etc.)",
          "Set up customer hotline and FAQ resources",
        ],
        legal: [
          "Implement litigation hold on all related documents",
          "Notify insurance carriers of potential claim",
          "Engage appropriate legal counsel for jurisdiction",
          "Identify and preserve all relevant evidence",
          "Brief leadership on communication restrictions",
        ],
        operational: [
          "Activate business continuity/disaster recovery plan",
          "Assess impact on critical operations and customers",
          "Implement workarounds for critical processes",
          "Communicate status to affected stakeholders",
          "Document all decisions and recovery efforts",
        ],
      };
      return actions[type] || [];
    };

    // First, try to retrieve the user's crisis plan
    let crisisPlan = null;
    let planContext = "";

    try {
      const planResult = await pool.query(
        "SELECT plan_data FROM crisis_plans WHERE user_id = $1",
        [userId]
      );

      if (planResult.rows.length > 0) {
        crisisPlan = planResult.rows[0].plan_data;
        console.log("✅ Crisis plan found for user");

        // Build crisis plan context
        planContext = `\n\nThe organization has an existing crisis plan for the ${
          crisisPlan.industry || "Not specified"
        } industry with:`;
        planContext += `\n- ${
          crisisPlan.scenarios?.length || 0
        } identified crisis scenarios`;
        planContext += `\n- ${
          crisisPlan.stakeholders?.length || 0
        } key stakeholders`;
        planContext += `\n- ${
          crisisPlan.communicationPlans?.length || 0
        } communication plans`;
        planContext += `\n- Designated crisis team with ${
          crisisPlan.crisisTeam?.filter((m) => m.name).length || 0
        } assigned members`;

        // Check if detected crisis matches any planned scenarios
        if (detectedCrisisType && crisisPlan.scenarios) {
          const matchingScenario = crisisPlan.scenarios.find(
            (s) =>
              s.title.toLowerCase().includes(detectedCrisisType) ||
              s.description.toLowerCase().includes(detectedCrisisType)
          );
          if (matchingScenario) {
            planContext += `\n\n⚠️ This matches your planned scenario: "${matchingScenario.title}"`;
            planContext += `\nLikelihood: ${matchingScenario.likelihood}, Impact: ${matchingScenario.impact}`;
          }
        }
      } else {
        console.log("⚠️ No crisis plan found for user");
      }
    } catch (planError) {
      console.error("Error retrieving crisis plan:", planError);
    }

    // Build the comprehensive AI prompt
    let prompt = `You are an expert AI Crisis Advisor with deep knowledge of crisis management best practices across all industries. Provide actionable, specific guidance.`;

    if (detectedCrisisType) {
      prompt += `\n\n🚨 DETECTED CRISIS TYPE: ${detectedCrisisName}`;
      prompt += `\n\nIMMEDIATE ACTIONS REQUIRED:`;
      const immediateActions = getImmediateActions(detectedCrisisType);
      immediateActions.forEach((action, index) => {
        prompt += `\n${index + 1}. ${action}`;
      });
    }

    // Add general crisis management framework
    prompt += `\n\n📋 GENERAL CRISIS RESPONSE FRAMEWORK:`;
    prompt += `\n\n⏱️ IMMEDIATE (First 60 minutes):`;
    prompt += `\n• Ensure safety of all personnel`;
    prompt += `\n• Activate crisis team or designate response leader`;
    prompt += `\n• Assess scope, severity, and potential escalation`;
    prompt += `\n• Secure evidence and stop ongoing damage`;
    prompt += `\n• Brief leadership and legal counsel`;

    prompt += `\n\n📅 SHORT-TERM (First 24 hours):`;
    prompt += `\n• Develop and approve external messaging`;
    prompt += `\n• Notify affected stakeholders per legal requirements`;
    prompt += `\n• Issue initial public statement if needed`;
    prompt += `\n• Establish regular update cadence`;
    prompt += `\n• Monitor media and social sentiment`;

    prompt += `\n\n🔄 ONGOING MANAGEMENT:`;
    prompt += `\n• Conduct thorough investigation`;
    prompt += `\n• Implement corrective actions`;
    prompt += `\n• Maintain stakeholder communications`;
    prompt += `\n• Document all decisions and actions`;
    prompt += `\n• Plan for recovery and prevention`;

    // Add specific guidance based on crisis type
    if (detectedCrisisType) {
      const crisisGuidance = {
        dataBreach:
          "\n\n🔐 DATA BREACH SPECIFIC: Remember GDPR 72-hour notification requirement. Consider cyber insurance activation. Prepare for potential litigation.",
        prCrisis:
          "\n\n📱 PR CRISIS SPECIFIC: Monitor sentiment hourly. Consider influencer outreach. Prepare CEO video response if severity escalates.",
        financial:
          "\n\n💰 FINANCIAL CRISIS SPECIFIC: SEC disclosure requirements may apply. Prepare 8-K filing if material. Consider trading halt.",
        safety:
          "\n\n⚠️ SAFETY SPECIFIC: OSHA reporting within 8 hours for fatalities, 24 hours for hospitalizations. Coordinate with HR on family notifications.",
        leadership:
          "\n\n👔 LEADERSHIP CRISIS SPECIFIC: Review D&O insurance. Consider independent investigation. Prepare succession planning.",
        product:
          "\n\n📦 PRODUCT CRISIS SPECIFIC: CPSC reporting within 24 hours. Coordinate recall strategy. Prepare retailer communications.",
        legal:
          "\n\n⚖️ LEGAL SPECIFIC: Strict communication protocols. All external communications through legal counsel. Prepare privilege log.",
        operational:
          "\n\n🏭 OPERATIONAL SPECIFIC: Customer impact assessment critical. SLA obligations review. Vendor/partner notifications.",
      };
      prompt += crisisGuidance[detectedCrisisType] || "";
    }

    // Include crisis plan context if available
    prompt += planContext;

    // Add the specific query context
    prompt += `\n\n🎯 CURRENT SITUATION/CONTEXT: ${
      context || "General crisis management inquiry"
    }`;
    prompt += `\n\n❓ USER'S SPECIFIC QUESTION: ${query}`;

    prompt += `\n\n📝 PROVIDE YOUR RESPONSE:`;
    prompt += `\n1. Address their specific question directly`;
    prompt += `\n2. Reference their crisis plan if available`;
    prompt += `\n3. Give 3-5 immediate action items`;
    prompt += `\n4. Identify key stakeholders to notify`;
    prompt += `\n5. Suggest preventive measures for the future`;
    prompt += `\n6. Be specific and actionable, not generic`;

    console.log("=== Sending enhanced prompt to Claude ===");

    const advice = await claudeService.sendMessage(prompt);

    if (!advice) {
      throw new Error("No advice generated from Claude");
    }

    console.log("✅ AI advice generated successfully");

    res.json({
      success: true,
      advice: advice,
      detectedCrisisType: detectedCrisisType,
      detectedCrisisName: detectedCrisisName,
      immediateActions: detectedCrisisType
        ? getImmediateActions(detectedCrisisType)
        : null,
      hasCrisisPlan: !!crisisPlan,
      planSummary: crisisPlan
        ? {
            industry: crisisPlan.industry,
            scenarioCount: crisisPlan.scenarios?.length || 0,
            stakeholderCount: crisisPlan.stakeholders?.length || 0,
            teamMembersAssigned:
              crisisPlan.crisisTeam?.filter((m) => m.name).length || 0,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in AI advisor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate AI advice",
      details: error.message,
    });
  }
}; // <-- THIS CLOSES getAIAdvice!

// NOW add the other functions OUTSIDE:

// Draft crisis response
exports.draftResponse = async (req, res) => {
  try {
    const { stakeholder, scenario, tone, keyPoints } = req.body;

    if (!stakeholder || !scenario) {
      return res
        .status(400)
        .json({ error: "Stakeholder and scenario are required" });
    }

    try {
      const prompt = `Draft a crisis communication message for the following:
Stakeholder: ${stakeholder}
Crisis Scenario: ${scenario}
Tone: ${tone || "professional and empathetic"}
Key Points to Address: ${
        keyPoints?.join(", ") || "General update and reassurance"
      }

Create a clear, concise message appropriate for this stakeholder group. Include:
1. Acknowledgment of the situation
2. Current actions being taken
3. Commitment to resolution
4. Next steps or timeline
5. Contact information for questions`;

      const response = await claudeService.sendMessage(prompt);
      res.json({ draft: response });
    } catch (error) {
      console.error("Claude API error:", error);
      res.json({
        draft: `[Draft Communication for ${stakeholder}]

We are aware of the current situation regarding ${scenario} and want to assure you that we are taking immediate action.

Our team is fully engaged in addressing this matter and we are committed to resolving it as quickly and effectively as possible. Your [safety/security/interests] remain our top priority.

We will provide regular updates as the situation develops. In the meantime, please don't hesitate to contact us if you have any questions or concerns.

Thank you for your patience and understanding.

[Contact Information]`,
      });
    }
  } catch (error) {
    console.error("Draft response error:", error);
    res.status(500).json({ error: "Failed to draft response" });
  }
};

// Save event log
exports.saveEventLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_data } = req.body;

    const result = await pool.query(
      "INSERT INTO crisis_event_logs (user_id, event_data) VALUES ($1, $2) RETURNING *",
      [userId, JSON.stringify(event_data)]
    );

    res.json({
      success: true,
      eventLog: result.rows[0],
    });
  } catch (error) {
    console.error("Save event log error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save event log",
    });
  }
};

// Get event logs
exports.getEventLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM crisis_event_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );

    res.json({
      success: true,
      eventLogs: result.rows,
    });
  } catch (error) {
    console.error("Get event logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve event logs",
    });
  }
};
