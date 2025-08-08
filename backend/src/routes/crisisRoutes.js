const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const claudeService = require("../../config/claude");
const db = require("../../config/database");
const { callClaude, successResponse, errorResponse } = require("../middleware/claudeResponseHandler");

// All routes require authentication
router.use(authMiddleware);

// Generate Crisis Plan with Claude
router.post("/generate-plan", async (req, res) => {
  try {
    const {
      industry,
      companySize,
      teamMembers,
      keyConcerns,
      existingProtocols,
      additionalContext,
      projectId,
      projectName,
      projectIndustry,
    } = req.body;
    const userId = req.user?.userId || req.user?.id;

    console.log("Generating crisis plan for:", {
      industry,
      projectName,
      userId,
    });

    // Build comprehensive prompt
    let prompt = `You are an expert crisis management consultant. Generate a comprehensive crisis management plan for a ${
      industry || projectIndustry
    } company.

Company Details:
- Industry: ${industry || projectIndustry}
- Company Name: ${projectName || "the company"}
${companySize ? `- Company Size: ${companySize}` : ""}

${
  teamMembers && teamMembers.length > 0
    ? `
Existing Crisis Team Members:
${teamMembers.map((m) => `- ${m.name} (${m.role}): ${m.contact}`).join("\n")}
`
    : ""
}

${
  keyConcerns && keyConcerns.length > 0
    ? `
Key Concerns to Address:
${keyConcerns.map((concern) => `- ${concern}`).join("\n")}
`
    : ""
}

${
  existingProtocols
    ? `
Existing Protocols:
${existingProtocols}
`
    : ""
}

${
  additionalContext
    ? `
Additional Context:
${additionalContext}
`
    : ""
}

Please create a detailed crisis management plan with the following structure in JSON format:

{
  "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4", "Objective 5"],
  "crisisTeam": [
    {
      "role": "Role Title",
      "title": "Department/Position Description", 
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"]
    }
  ],
  "responseProcess": [
    {
      "phase": "Phase Name",
      "description": "Phase description",
      "actions": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "scenarios": [
    {
      "title": "Scenario Name",
      "description": "Detailed description",
      "likelihood": "High/Medium/Low",
      "impact": "Critical/Major/Moderate/Minor",
      "isUniversal": false
    }
  ],
  "stakeholders": [
    {
      "name": "Stakeholder Group",
      "description": "Who they are",
      "impactLevel": "High/Medium/Low", 
      "concerns": ["Concern 1", "Concern 2", "Concern 3"]
    }
  ],
  "communicationPlans": [
    {
      "stakeholder": "Stakeholder Group Name",
      "primaryChannel": "Primary communication method",
      "secondaryChannel": "Backup communication method",
      "timing": "When to communicate",
      "spokesperson": "Who will communicate",
      "keyMessages": ["Message 1", "Message 2", "Message 3"]
    }
  ],
  "eventMonitoring": {
    "tools": ["Tool 1", "Tool 2"],
    "responsibilities": ["Responsibility 1", "Responsibility 2"],
    "alertThresholds": ["Threshold 1", "Threshold 2"]
  },
  "postIncidentEvaluation": {
    "process": ["Step 1", "Step 2"],
    "keyQuestions": ["Question 1", "Question 2"],
    "documentationRequirements": ["Requirement 1", "Requirement 2"]
  }
}

Include ALL sections above. Generate:
- 5-7 objectives
- 5 crisis team roles
- 5-6 response process phases
- 5-7 industry-specific scenarios + 5 universal scenarios
- 5-7 stakeholder groups
- Communication plans for each stakeholder
- Comprehensive monitoring and evaluation sections

Make the plan specific to the ${industry || projectIndustry} industry.
`;

    const claudeResponse = await claudeService.sendMessage(prompt);

    // Parse the response
    let planData;
    try {
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      // Return a basic plan structure
      return res.status(500).json({
        success: false,
        error: "Failed to parse crisis plan. Please try again.",
      });
    }

    // Add universal scenarios if not included
    const universalScenarios = [
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

    // Ensure scenarios include universal ones
    planData.scenarios = [
      ...(planData.scenarios || []).filter((s) => !s.isUniversal),
      ...universalScenarios,
    ];

    // Save to database
    const query = `
      INSERT INTO crisis_plans (user_id, project_id, industry, plan_data, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (project_id) DO UPDATE
      SET plan_data = $4, updated_at = NOW()
      RETURNING id
    `;

    const values = [
      userId,
      projectId || null,
      industry || projectIndustry,
      JSON.stringify(planData),
    ];

    const result = await db.query(query, values);

    res.json({
      success: true,
      plan: {
        id: result.rows[0].id,
        industry: industry || projectIndustry,
        plan_data: planData,
        isAIGenerated: true,
      },
    });
  } catch (error) {
    console.error("Crisis plan generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate crisis plan",
      message: error.message,
    });
  }
});

// Get Crisis Plan
router.get("/plan/:projectId", async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { projectId } = req.params;

    const query = `
      SELECT * FROM crisis_plans 
      WHERE project_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [projectId, userId]);

    if (result.rows.length > 0) {
      res.json({
        success: true,
        plan: result.rows[0],
      });
    } else {
      res.json({
        success: true,
        plan: null,
      });
    }
  } catch (error) {
    console.error("Error fetching crisis plan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch crisis plan",
    });
  }
});

// AI Crisis Advisor - Updated to handle conversation history
router.post("/advisor", async (req, res) => {
  try {
    const { query, context, conversationHistory } = req.body;
    const userId = req.user?.userId || req.user?.id;

    console.log("Crisis advisor query:", {
      query,
      context,
      hasHistory: !!conversationHistory,
    });

    // Check if user has a crisis plan
    let crisisPlan = null;
    if (context.projectId) {
      const planQuery = `
        SELECT plan_data, industry FROM crisis_plans 
        WHERE project_id = $1 AND user_id = $2
        LIMIT 1
      `;
      const planResult = await db.query(planQuery, [context.projectId, userId]);
      if (planResult.rows.length > 0) {
        crisisPlan = planResult.rows[0];
      }
    }

    // Build conversation history for Claude
    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = `
Previous conversation:
${conversationHistory
  .map(
    (msg, idx) =>
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
  )
  .join("\n\n")}

Now the user asks: ${query}
`;
    } else {
      conversationContext = `User Query: ${query}`;
    }

    // Build context-aware prompt
    let prompt = `You are an expert crisis management advisor helping manage an ongoing crisis. 

${conversationContext}

Current Context:
- Crisis Status: ${context.crisisStatus || "monitoring"}
- Active Scenario: ${context.scenario ? context.scenario.title : "None"}
- Time Elapsed: ${context.elapsedTime || "N/A"}
- Company: ${context.projectName || "Unknown"}
- Industry: ${context.industry || crisisPlan?.industry || "Unknown"}
${crisisPlan ? "- Has Crisis Plan: Yes" : "- Has Crisis Plan: No"}

${
  crisisPlan
    ? `
Crisis Plan Summary:
- Industry: ${crisisPlan.industry}
- Team Members: ${
        crisisPlan.plan_data.crisisTeam
          ? crisisPlan.plan_data.crisisTeam.length
          : 0
      }
- Scenarios Mapped: ${
        crisisPlan.plan_data.scenarios
          ? crisisPlan.plan_data.scenarios.length
          : 0
      }
`
    : ""
}

Important: You have access to the full conversation history above. Reference previous discussions when relevant.
Analyze the user's query and:
1. Consider the conversation context and build upon previous advice
2. Identify if they're describing a specific crisis type
3. Provide immediate, actionable advice
4. Reference their crisis plan if applicable
5. Suggest specific actions based on best practices

If you detect a crisis type, identify it clearly. Be concise but thorough in your guidance.

Respond in a conversational but professional tone. Focus on practical, immediate actions they can take.`;

    const claudeResponse = await claudeService.sendMessage(prompt);

    // Rest of the function remains the same...
    // Analyze response for crisis detection
    let detectedCrisisType = null;
    let detectedCrisisName = null;
    const crisisKeywords = {
      cyber: ["hack", "breach", "ransomware", "cyber", "data leak", "security"],
      executive: ["executive", "ceo", "misconduct", "scandal", "leadership"],
      workplace: [
        "violence",
        "threat",
        "shooting",
        "assault",
        "workplace safety",
      ],
      financial: ["fraud", "embezzlement", "financial", "accounting", "money"],
      reputation: ["reputation", "pr crisis", "media", "viral", "social media"],
      operational: [
        "accident",
        "injury",
        "explosion",
        "facility",
        "operational",
      ],
    };

    const lowerQuery = query.toLowerCase();
    for (const [type, keywords] of Object.entries(crisisKeywords)) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        detectedCrisisType = type;
        detectedCrisisName =
          type.charAt(0).toUpperCase() + type.slice(1) + " Crisis";
        break;
      }
    }

    // Extract immediate actions if mentioned
    const immediateActions = [];
    const actionPhrases = claudeResponse.match(
      /(?:immediately|first|right away|urgent(?:ly)?)[^.]*\./gi
    );
    if (actionPhrases) {
      immediateActions.push(...actionPhrases.map((action) => action.trim()));
    }

    // Use 'response' field for frontend compatibility
    res.json({
      success: true,
      response: claudeResponse,  // Changed from 'advice' to 'response'
      advice: claudeResponse,     // Keep both for backward compatibility
      detectedCrisisType,
      detectedCrisisName,
      immediateActions: immediateActions.slice(0, 5),
      hasCrisisPlan: !!crisisPlan,
      planSummary: crisisPlan
        ? {
            industry: crisisPlan.industry,
            teamMembersAssigned:
              crisisPlan.plan_data.crisisTeam?.filter((m) => m.name).length ||
              0,
            scenarioCount: crisisPlan.plan_data.scenarios?.length || 0,
          }
        : null,
    });
  } catch (error) {
    console.error("Crisis advisor error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get crisis advice",
      message: error.message,
    });
  }
});

// Draft Crisis Response with Claude
router.post("/draft-response", async (req, res) => {
  try {
    const { prompt, stakeholder, scenario, projectId } = req.body;
    const userId = req.user?.userId || req.user?.id;

    console.log("Drafting crisis response for:", stakeholder);

    const claudeResponse = await claudeService.sendMessage(prompt);

    // Log the draft
    const logQuery = `
      INSERT INTO crisis_communications 
      (user_id, project_id, stakeholder, scenario, draft_content, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await db.query(logQuery, [
      userId,
      projectId || null,
      stakeholder,
      scenario?.title || "Unknown",
      claudeResponse,
    ]);

    res.json({
      success: true,
      draft: claudeResponse,
    });
  } catch (error) {
    console.error("Draft response error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to draft response",
      message: error.message,
    });
  }
});

// Save Crisis Event
router.post("/save-event", async (req, res) => {
  try {
    const { eventData, projectId } = req.body;
    const userId = req.user?.userId || req.user?.id;

    const query = `
      INSERT INTO crisis_events 
      (user_id, project_id, event_data, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;

    const values = [
      userId,
      projectId || null,
      JSON.stringify(eventData),
      eventData.status || "active",
    ];

    const result = await db.query(query, values);

    res.json({
      success: true,
      eventId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Save crisis event error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save crisis event",
    });
  }
});

module.exports = router;
