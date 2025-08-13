const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const claudeService = require("../../config/claude");
const { getClaudeJSON } = require("../utils/claudeJsonHelper");
const db = require("../../config/database");

// All routes require authentication
router.use(authMiddleware);

// Generate Crisis Plan with Claude - WORKING VERSION
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

    // Build a simpler prompt that works better with Claude
    const prompt = `Create a comprehensive crisis management plan for a ${industry || projectIndustry} company.

Company: ${projectName || "the company"}
Size: ${companySize || "medium"}
${teamMembers?.length ? `Team: ${teamMembers.length} members` : ""}
${keyConcerns?.length ? `Key Concerns: ${keyConcerns.join(", ")}` : ""}

Generate a crisis plan with exactly this JSON structure:
{
  "objectives": [5 clear crisis management objectives as strings],
  "crisisTeam": [
    {
      "role": "Crisis Team Leader",
      "title": "CEO or equivalent",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": [3 key responsibilities]
    }
  ],
  "responseProcess": [
    {
      "phase": "Phase name",
      "description": "What happens in this phase",
      "actions": [3-5 specific actions]
    }
  ],
  "scenarios": [
    {
      "title": "Scenario name",
      "description": "Detailed description",
      "likelihood": "High/Medium/Low",
      "impact": "Critical/Major/Minor",
      "responseStrategy": "How to respond"
    }
  ],
  "stakeholders": [
    {
      "group": "Stakeholder group name",
      "concerns": [2-3 main concerns],
      "communicationPlan": {
        "primary": "Primary communication method",
        "frequency": "How often",
        "keyMessages": [2-3 key messages]
      }
    }
  ]
}`;

    // Use the helper to get guaranteed JSON
    const fallbackPlan = {
      objectives: [
        "Protect stakeholder safety and well-being",
        "Maintain operational continuity",
        "Preserve organizational reputation",
        "Ensure regulatory compliance",
        "Minimize financial impact"
      ],
      crisisTeam: [
        {
          role: "Crisis Team Leader",
          title: "CEO/Executive Director",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Overall coordination", "External communications", "Board liaison"]
        }
      ],
      responseProcess: [
        {
          phase: "Immediate Response (0-24 hours)",
          description: "Initial crisis containment",
          actions: ["Activate crisis team", "Assess situation", "Initial communications"]
        }
      ],
      scenarios: [
        {
          title: "Data Breach",
          description: "Unauthorized access to customer data",
          likelihood: "Medium",
          impact: "Critical",
          responseStrategy: "Immediate containment, forensic analysis, customer notification"
        }
      ],
      stakeholders: [
        {
          group: "Customers",
          concerns: ["Data security", "Service continuity"],
          communicationPlan: {
            primary: "Email and website updates",
            frequency: "As needed",
            keyMessages: ["We take this seriously", "Steps we're taking", "How we're protecting you"]
          }
        }
      ]
    };

    const planData = await getClaudeJSON(prompt, fallbackPlan);

    // Ensure we have all required fields
    const completePlan = {
      objectives: planData.objectives || fallbackPlan.objectives,
      crisisTeam: planData.crisisTeam || fallbackPlan.crisisTeam,
      responseProcess: planData.responseProcess || fallbackPlan.responseProcess,
      scenarios: planData.scenarios || fallbackPlan.scenarios,
      stakeholders: planData.stakeholders || fallbackPlan.stakeholders,
      metadata: {
        generatedAt: new Date().toISOString(),
        industry: industry || projectIndustry,
        company: projectName,
        isAIGenerated: true
      }
    };

    // Save to database if we have a project
    if (projectId && userId) {
      try {
        await db.query(
          `INSERT INTO crisis_plans (project_id, user_id, plan_data, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (project_id) 
           DO UPDATE SET plan_data = $3, updated_at = NOW()`,
          [projectId, userId, JSON.stringify(completePlan)]
        );
      } catch (dbError) {
        console.error("Failed to save crisis plan:", dbError);
        // Continue anyway - don't fail the whole request
      }
    }

    res.json({
      success: true,
      plan: completePlan,
      message: "Crisis plan generated successfully"
    });

  } catch (error) {
    console.error("Crisis plan generation error:", error);
    
    // Return a basic plan even on error
    res.json({
      success: false,
      plan: {
        objectives: ["Address the crisis", "Protect stakeholders", "Maintain operations", "Preserve reputation", "Learn and improve"],
        crisisTeam: [{
          role: "Crisis Leader",
          title: "Senior Executive",
          responsibilities: ["Lead response", "Make decisions", "Communicate"]
        }],
        responseProcess: [{
          phase: "Immediate",
          description: "First 24 hours",
          actions: ["Assess", "Respond", "Communicate"]
        }],
        scenarios: [{
          title: "General Crisis",
          description: "Unexpected event",
          likelihood: "Medium",
          impact: "Major",
          responseStrategy: "Follow crisis protocol"
        }],
        stakeholders: [{
          group: "All Stakeholders",
          concerns: ["Impact", "Response"],
          communicationPlan: {
            primary: "Direct communication",
            frequency: "As needed",
            keyMessages: ["We're responding", "Your safety matters"]
          }
        }]
      },
      message: "Basic plan provided due to generation error",
      error: error.message
    });
  }
});

// Analyze crisis situation - SIMPLIFIED
router.post("/analyze", async (req, res) => {
  try {
    const { situation, urgency, context } = req.body;
    
    if (!situation) {
      return res.status(400).json({
        success: false,
        error: "Situation description is required"
      });
    }

    // Simple prompt that gets text response
    const prompt = `As a crisis management expert, analyze this situation:

Situation: ${situation}
Urgency: ${urgency || "medium"}
Context: ${context || "business crisis"}

Provide:
1. Severity assessment
2. Immediate actions (first 24 hours)
3. Key stakeholders to notify
4. Communication strategy
5. Risks if not addressed

Be concise and actionable.`;

    const analysis = await claudeService.sendMessage(prompt);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Crisis analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze crisis",
      analysis: "1. Assess the situation\n2. Activate crisis team\n3. Communicate with stakeholders\n4. Monitor and respond\n5. Document everything"
    });
  }
});

module.exports = router;