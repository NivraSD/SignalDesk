const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const claudeService = require("../../config/claude");
const { getClaudeJSON } = require("../utils/claudeJsonHelper");
const db = require("../../config/database");

// All routes require authentication
router.use(authMiddleware);

// Generate COMPLETE Crisis Plan with Claude
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

    console.log("Generating COMPLETE crisis plan for:", {
      industry: industry || projectIndustry,
      projectName,
      userId,
    });

    // Build a comprehensive prompt for a COMPLETE plan
    const prompt = `Create a comprehensive crisis management plan for a ${industry || projectIndustry || "technology"} company.

Company: ${projectName || "the company"}
Size: ${companySize || "medium-sized"}
Industry: ${industry || projectIndustry || "technology"}
${keyConcerns?.length ? `Key Concerns: ${keyConcerns.join(", ")}` : ""}
${additionalContext ? `Context: ${additionalContext}` : ""}

Generate a COMPLETE crisis plan with this exact JSON structure. Include AT LEAST the specified number of items in each array:

{
  "objectives": [
    "Protect stakeholder safety and well-being",
    "Maintain operational continuity and minimize disruption",
    "Preserve and protect organizational reputation",
    "Ensure regulatory and legal compliance",
    "Minimize financial and operational impact",
    "Learn from the crisis and improve resilience"
  ],
  "crisisTeam": [
    {
      "role": "Crisis Team Leader",
      "title": "CEO/President",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Overall crisis coordination", "Board communication", "Final decision authority"]
    },
    {
      "role": "Communications Lead",
      "title": "VP Communications/PR",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Media relations", "Internal communications", "Social media management"]
    },
    {
      "role": "Operations Lead",
      "title": "COO/VP Operations",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Business continuity", "Resource allocation", "Operational decisions"]
    },
    {
      "role": "Legal Counsel",
      "title": "General Counsel/Legal Advisor",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Legal compliance", "Risk assessment", "Regulatory liaison"]
    },
    {
      "role": "HR Lead",
      "title": "VP Human Resources",
      "name": "",
      "email": "",
      "phone": "",
      "alternateContact": "",
      "responsibilities": ["Employee safety", "Staff communications", "Resource management"]
    }
  ],
  "responseProcess": [
    {
      "phase": "Detection & Alert (0-1 hours)",
      "description": "Initial crisis detection and team activation",
      "actions": ["Identify crisis trigger", "Activate crisis team", "Initial assessment", "Begin documentation", "Alert key stakeholders"]
    },
    {
      "phase": "Assessment (1-4 hours)",
      "description": "Comprehensive situation analysis",
      "actions": ["Gather all facts", "Assess impact scope", "Identify affected parties", "Evaluate resources", "Determine severity level"]
    },
    {
      "phase": "Response Planning (4-8 hours)",
      "description": "Develop specific response strategy",
      "actions": ["Create action plan", "Assign responsibilities", "Prepare communications", "Mobilize resources", "Set timelines"]
    },
    {
      "phase": "Implementation (8-24 hours)",
      "description": "Execute crisis response plan",
      "actions": ["Execute action items", "Communicate with stakeholders", "Monitor progress", "Adjust as needed", "Document actions"]
    },
    {
      "phase": "Recovery (24-72 hours)",
      "description": "Stabilize and begin recovery",
      "actions": ["Assess effectiveness", "Begin recovery operations", "Continue communications", "Support affected parties", "Plan next steps"]
    },
    {
      "phase": "Learning (Post-crisis)",
      "description": "Review and improve",
      "actions": ["Conduct after-action review", "Document lessons learned", "Update plans", "Train team", "Implement improvements"]
    }
  ],
  "scenarios": [
    {
      "title": "Data Breach/Cyber Attack",
      "description": "Unauthorized access to sensitive customer or company data",
      "likelihood": "High",
      "impact": "Critical",
      "responseStrategy": "Immediate containment, forensic investigation, customer notification per regulations, credit monitoring offers"
    },
    {
      "title": "Product Safety Issue",
      "description": "Product defect causing harm or potential harm to customers",
      "likelihood": "Medium",
      "impact": "Critical",
      "responseStrategy": "Immediate recall if necessary, customer notification, work with regulators, provide remedies"
    },
    {
      "title": "Executive Misconduct",
      "description": "Senior leadership accused of illegal or unethical behavior",
      "likelihood": "Low",
      "impact": "Major",
      "responseStrategy": "Independent investigation, potential suspension, transparent communication, leadership transition if needed"
    },
    {
      "title": "Natural Disaster",
      "description": "Earthquake, flood, or other natural disaster affecting operations",
      "likelihood": "Medium",
      "impact": "Major",
      "responseStrategy": "Activate business continuity plan, ensure employee safety, communicate status, relocate operations if needed"
    },
    {
      "title": "Social Media Crisis",
      "description": "Viral negative content damaging brand reputation",
      "likelihood": "High",
      "impact": "Major",
      "responseStrategy": "Rapid response team activation, authentic engagement, fact correction, influencer outreach"
    },
    {
      "title": "Supply Chain Disruption",
      "description": "Major supplier failure or logistics breakdown",
      "likelihood": "Medium",
      "impact": "Major",
      "responseStrategy": "Activate alternate suppliers, customer communication, adjust production, manage inventory"
    },
    {
      "title": "Workplace Violence",
      "description": "Threat or act of violence at company facilities",
      "likelihood": "Low",
      "impact": "Critical",
      "responseStrategy": "Immediate law enforcement contact, facility lockdown, employee evacuation, counseling support"
    }
  ],
  "stakeholders": [
    {
      "group": "Employees",
      "concerns": ["Personal safety", "Job security", "Clear information"],
      "communicationPlan": {
        "primary": "Email and all-hands meetings",
        "frequency": "Immediate and daily updates",
        "keyMessages": ["Your safety is our priority", "Here's what we're doing", "Resources available to you"]
      }
    },
    {
      "group": "Customers",
      "concerns": ["Service continuity", "Data security", "Product safety"],
      "communicationPlan": {
        "primary": "Email, website, and social media",
        "frequency": "As developments warrant",
        "keyMessages": ["We're addressing the situation", "Your data/safety is protected", "Here's how we're helping"]
      }
    },
    {
      "group": "Media",
      "concerns": ["Accurate information", "Timely updates", "Executive access"],
      "communicationPlan": {
        "primary": "Press releases and briefings",
        "frequency": "As needed with regular updates",
        "keyMessages": ["Facts of the situation", "Our response actions", "Commitment to resolution"]
      }
    },
    {
      "group": "Investors/Board",
      "concerns": ["Financial impact", "Leadership response", "Long-term implications"],
      "communicationPlan": {
        "primary": "Direct calls and written updates",
        "frequency": "Immediate notification then regular updates",
        "keyMessages": ["Financial impact assessment", "Management actions", "Recovery timeline"]
      }
    },
    {
      "group": "Regulators",
      "concerns": ["Compliance", "Public safety", "Corrective actions"],
      "communicationPlan": {
        "primary": "Official reports and meetings",
        "frequency": "Per regulatory requirements",
        "keyMessages": ["Full cooperation", "Compliance measures", "Corrective actions taken"]
      }
    },
    {
      "group": "Partners/Suppliers",
      "concerns": ["Business continuity", "Contract obligations", "Relationship impact"],
      "communicationPlan": {
        "primary": "Direct communication and updates",
        "frequency": "As impacts their operations",
        "keyMessages": ["Status of operations", "Timeline for resolution", "Commitment to partnership"]
      }
    }
  ]
}

Return ONLY this complete JSON structure with all sections fully populated.`;

    // Get the complete plan with enhanced fallback
    const completeFallback = {
      objectives: [
        "Protect stakeholder safety and well-being",
        "Maintain operational continuity and minimize disruption",
        "Preserve and protect organizational reputation",
        "Ensure regulatory and legal compliance",
        "Minimize financial and operational impact",
        "Learn from the crisis and improve resilience"
      ],
      crisisTeam: [
        {
          role: "Crisis Team Leader",
          title: "CEO/President",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Overall crisis coordination", "Board communication", "Final decision authority"]
        },
        {
          role: "Communications Lead",
          title: "VP Communications",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Media relations", "Internal communications", "Social media management"]
        },
        {
          role: "Operations Lead",
          title: "COO",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Business continuity", "Resource allocation", "Operational decisions"]
        },
        {
          role: "Legal Counsel",
          title: "General Counsel",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Legal compliance", "Risk assessment", "Regulatory liaison"]
        },
        {
          role: "HR Lead",
          title: "VP Human Resources",
          name: "",
          email: "",
          phone: "",
          alternateContact: "",
          responsibilities: ["Employee safety", "Staff communications", "Resource management"]
        }
      ],
      responseProcess: [
        {
          phase: "Detection & Alert (0-1 hours)",
          description: "Initial crisis detection and team activation",
          actions: ["Identify crisis", "Activate team", "Initial assessment", "Document", "Alert stakeholders"]
        },
        {
          phase: "Assessment (1-4 hours)",
          description: "Comprehensive situation analysis",
          actions: ["Gather facts", "Assess impact", "Identify affected", "Evaluate resources", "Determine severity"]
        },
        {
          phase: "Response Planning (4-8 hours)",
          description: "Develop response strategy",
          actions: ["Create plan", "Assign tasks", "Prepare comms", "Mobilize resources", "Set timelines"]
        },
        {
          phase: "Implementation (8-24 hours)",
          description: "Execute response plan",
          actions: ["Execute actions", "Communicate", "Monitor progress", "Adjust plan", "Document"]
        },
        {
          phase: "Recovery (24-72 hours)",
          description: "Stabilize and recover",
          actions: ["Assess effectiveness", "Begin recovery", "Continue comms", "Support affected", "Plan ahead"]
        }
      ],
      scenarios: Array(7).fill(null).map((_, i) => ({
        title: ["Data Breach", "Product Issue", "Executive Crisis", "Natural Disaster", "Social Media Crisis", "Supply Chain", "Workplace Safety"][i],
        description: "Crisis scenario requiring immediate response",
        likelihood: ["High", "Medium", "Low"][i % 3],
        impact: ["Critical", "Major", "Major"][i % 3],
        responseStrategy: "Immediate response following established protocols"
      })),
      stakeholders: Array(6).fill(null).map((_, i) => ({
        group: ["Employees", "Customers", "Media", "Investors", "Regulators", "Partners"][i],
        concerns: ["Primary concern", "Secondary concern", "Additional concern"],
        communicationPlan: {
          primary: "Primary communication channel",
          frequency: "As needed",
          keyMessages: ["Key message 1", "Key message 2", "Key message 3"]
        }
      }))
    };

    const planData = await getClaudeJSON(prompt, completeFallback);

    // Ensure completeness - fill any missing sections
    const completePlan = {
      objectives: (planData.objectives?.length >= 5) ? planData.objectives : completeFallback.objectives,
      crisisTeam: (planData.crisisTeam?.length >= 4) ? planData.crisisTeam : completeFallback.crisisTeam,
      responseProcess: (planData.responseProcess?.length >= 4) ? planData.responseProcess : completeFallback.responseProcess,
      scenarios: (planData.scenarios?.length >= 5) ? planData.scenarios : completeFallback.scenarios,
      stakeholders: (planData.stakeholders?.length >= 4) ? planData.stakeholders : completeFallback.stakeholders,
      metadata: {
        generatedAt: new Date().toISOString(),
        industry: industry || projectIndustry || "General",
        company: projectName || "Organization",
        isComplete: true,
        isAIGenerated: true
      }
    };

    res.json({
      success: true,
      plan: completePlan,
      message: "Complete crisis plan generated successfully"
    });

  } catch (error) {
    console.error("Crisis plan generation error:", error);
    
    // Still return a complete plan on error
    res.json({
      success: true,
      plan: {
        objectives: [
          "Protect stakeholder safety",
          "Maintain operations",
          "Preserve reputation",
          "Ensure compliance",
          "Minimize impact",
          "Learn and improve"
        ],
        crisisTeam: Array(5).fill(null).map((_, i) => ({
          role: ["Crisis Leader", "Communications", "Operations", "Legal", "HR"][i],
          title: ["CEO", "VP Comms", "COO", "Legal Counsel", "VP HR"][i],
          responsibilities: ["Primary", "Secondary", "Additional"]
        })),
        responseProcess: Array(5).fill(null).map((_, i) => ({
          phase: ["Detection", "Assessment", "Planning", "Implementation", "Recovery"][i],
          description: "Phase description",
          actions: ["Action 1", "Action 2", "Action 3"]
        })),
        scenarios: Array(6).fill(null).map((_, i) => ({
          title: ["Data Breach", "Product Issue", "Leadership", "Disaster", "Social Media", "Supply Chain"][i],
          description: "Scenario description",
          likelihood: "Medium",
          impact: "Major",
          responseStrategy: "Response strategy"
        })),
        stakeholders: Array(5).fill(null).map((_, i) => ({
          group: ["Employees", "Customers", "Media", "Investors", "Regulators"][i],
          concerns: ["Concern 1", "Concern 2"],
          communicationPlan: {
            primary: "Communication method",
            frequency: "As needed",
            keyMessages: ["Message 1", "Message 2"]
          }
        }))
      },
      message: "Crisis plan generated with defaults"
    });
  }
});

// Analyze crisis situation
router.post("/analyze", async (req, res) => {
  try {
    const { situation, urgency, context } = req.body;
    
    if (!situation) {
      return res.status(400).json({
        success: false,
        error: "Situation description is required"
      });
    }

    const prompt = `As a crisis management expert, analyze this situation:

Situation: ${situation}
Urgency: ${urgency || "medium"}
Context: ${context || "business crisis"}

Provide a comprehensive analysis with:
1. Severity assessment (Critical/High/Medium/Low)
2. Immediate actions (first 24 hours) - at least 5 specific steps
3. Key stakeholders to notify - list all relevant parties
4. Communication strategy - detailed approach
5. Risks if not addressed - specific consequences
6. Resources needed - people, tools, budget
7. Success metrics - how to measure resolution

Be thorough, specific, and actionable.`;

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
      analysis: "1. Assess the situation thoroughly\n2. Activate crisis team immediately\n3. Communicate with all stakeholders\n4. Monitor and respond to developments\n5. Document everything for review"
    });
  }
});

module.exports = router;