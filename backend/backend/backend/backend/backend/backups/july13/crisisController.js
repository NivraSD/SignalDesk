const pool = require('../config/db');
const ClaudeService = require('../../config/claude');

// Helper function to clean JSON response from Claude
const cleanJsonResponse = (response) => {
  return response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};

// Default crisis team structure
const getDefaultCrisisTeam = () => [
  {
    role: 'Crisis Response Leader',
    title: 'Chief Executive Officer or designated senior executive',
    name: '',
    contact: '',
    responsibilities: [
      'Overall crisis response authority and decision-making',
      'External stakeholder communications approval',
      'Resource allocation and strategic direction'
    ]
  },
  {
    role: 'Communications Director',
    title: 'Head of Communications/PR or senior communications executive',
    name: '',
    contact: '',
    responsibilities: [
      'Develop and implement communication strategies',
      'Media relations and press release coordination',
      'Message consistency across all channels'
    ]
  },
  {
    role: 'Operations Manager',
    title: 'Chief Operating Officer or senior operations executive',
    name: '',
    contact: '',
    responsibilities: [
      'Operational impact assessment and mitigation',
      'Business continuity plan activation',
      'Internal coordination and resource management'
    ]
  },
  {
    role: 'Legal Counsel',
    title: 'General Counsel or senior legal advisor',
    name: '',
    contact: '',
    responsibilities: [
      'Legal risk assessment and compliance guidance',
      'Regulatory notification requirements',
      'Litigation risk management'
    ]
  },
  {
    role: 'Human Resources Lead',
    title: 'Chief Human Resources Officer or senior HR executive',
    name: '',
    contact: '',
    responsibilities: [
      'Employee communications and support',
      'Staff safety and welfare coordination',
      'Union and labor relations management'
    ]
  }
];

// Universal scenarios
const getUniversalScenarios = () => [
  {
    title: "Cyber Attack / Ransomware",
    description: "Sophisticated cyber attack compromising systems, encrypting data, or demanding ransom payment",
    likelihood: "High",
    impact: "Critical",
    isUniversal: true
  },
  {
    title: "Executive Misconduct",
    description: "Senior leadership accused of illegal, unethical, or inappropriate behavior",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  },
  {
    title: "Workplace Violence Incident",
    description: "Active threat or violent incident at company facilities",
    likelihood: "Low",
    impact: "Critical",
    isUniversal: true
  },
  {
    title: "Financial Fraud or Embezzlement",
    description: "Discovery of internal financial misconduct or accounting irregularities",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  },
  {
    title: "Pandemic/Health Emergency",
    description: "Widespread health crisis requiring business continuity measures",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  }
];

// Simplified fallback data function
const getFallbackData = (industry) => ({
  scenarios: [
    {
      title: "Major Data Security Breach",
      description: `Unauthorized access to sensitive ${industry} data affecting customer records`,
      likelihood: "High",
      impact: "Critical",
      isUniversal: false
    },
    {
      title: "Regulatory Compliance Violation",
      description: `Significant breach of ${industry} regulations resulting in potential fines`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Supply Chain Disruption",
      description: `Critical supplier failure affecting ${industry} operations`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Product/Service Quality Crisis",
      description: `Major quality issues affecting ${industry} products or services`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Reputation Crisis",
      description: `Negative publicity significantly impacting ${industry} brand reputation`,
      likelihood: "High",
      impact: "Major",
      isUniversal: false
    }
  ],
  stakeholders: [
    {
      name: "Customers/Clients",
      description: "Primary users of products/services",
      impactLevel: "High",
      concerns: ["Service continuity", "Data security", "Communication transparency"]
    },
    {
      name: "Employees",
      description: "Internal workforce and contractors",
      impactLevel: "High",
      concerns: ["Job security", "Safety measures", "Clear guidance"]
    },
    {
      name: "Shareholders/Investors",
      description: "Financial stakeholders and board members",
      impactLevel: "High",
      concerns: ["Financial impact", "Recovery timeline", "Leadership response"]
    },
    {
      name: "Regulatory Bodies",
      description: `Government agencies overseeing ${industry} compliance`,
      impactLevel: "Medium",
      concerns: ["Compliance status", "Corrective actions", "Reporting requirements"]
    },
    {
      name: "Media",
      description: "News outlets and industry publications",
      impactLevel: "Medium",
      concerns: ["Accurate information", "Company response", "Public impact"]
    },
    {
      name: "Business Partners",
      description: "Suppliers, vendors, and strategic partners",
      impactLevel: "Medium",
      concerns: ["Business continuity", "Contract obligations", "Partnership stability"]
    },
    {
      name: "Local Community",
      description: "Communities where the company operates",
      impactLevel: "Low",
      concerns: ["Environmental impact", "Economic effects", "Safety concerns"]
    },
    {
      name: "Industry Competitors",
      description: "Other companies in the same market",
      impactLevel: "Low",
      concerns: ["Market dynamics", "Industry reputation", "Competitive advantages"]
    }
  ],
  communicationPlans: [
    {
      stakeholder: "Customers/Clients",
      primaryChannel: "Email and company website",
      secondaryChannel: "Social media and call center",
      keyMessages: [
        "We are aware of the situation and taking immediate action",
        "Your safety and security are our top priorities",
        "Here's what we're doing to resolve the issue"
      ],
      timing: "Within 2 hours of crisis confirmation",
      spokesperson: "CEO or Chief Customer Officer"
    },
    {
      stakeholder: "Employees",
      primaryChannel: "Internal communication system",
      secondaryChannel: "Emergency text messaging",
      keyMessages: [
        "Clear instructions for immediate actions",
        "Safety and security protocols",
        "Updates on business continuity plans"
      ],
      timing: "Within 1 hour of crisis identification",
      spokesperson: "CEO or Crisis Response Leader"
    },
    {
      stakeholder: "Shareholders/Investors",
      primaryChannel: "Investor relations portal",
      secondaryChannel: "Direct email to major shareholders",
      keyMessages: [
        "Financial impact assessment",
        "Management response and mitigation strategies",
        "Long-term recovery outlook"
      ],
      timing: "Within 4 hours or per regulatory requirements",
      spokesperson: "CEO and CFO"
    },
    {
      stakeholder: "Regulatory Bodies",
      primaryChannel: "Official regulatory filings",
      secondaryChannel: "Direct communication with regulators",
      keyMessages: [
        "Full disclosure of incident details",
        "Compliance measures being taken",
        "Timeline for resolution"
      ],
      timing: "As required by regulations",
      spokesperson: "Legal Counsel and Compliance Officer"
    },
    {
      stakeholder: "Media",
      primaryChannel: "Press release and press conference",
      secondaryChannel: "Media relations team outreach",
      keyMessages: [
        "Facts about the situation",
        "Company response and actions",
        "Commitment to transparency"
      ],
      timing: "Within 4 hours of crisis becoming public",
      spokesperson: "CEO or designated media spokesperson"
    }
  ]
});

// Generate crisis plan
exports.generatePlan = async (req, res) => {
  try {
    const { industry } = req.body;
    const userId = req.user.id;

    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
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

      console.log('DEBUG: Calling Claude for crisis scenarios...');
      const scenariosResponse = await ClaudeService.generateContent(scenariosPrompt);
      console.log('DEBUG: Received scenarios response, length:', scenariosResponse?.length);

      try {
        const cleanedResponse = cleanJsonResponse(scenariosResponse);
        scenarios = JSON.parse(cleanedResponse);
        console.log('✅ Scenarios parsed successfully:', scenarios.scenarios?.length, 'scenarios');
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError.message);
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

      const stakeholderResponse = await ClaudeService.generateContent(stakeholderPrompt);
      console.log('DEBUG: Received stakeholder response, length:', stakeholderResponse?.length);

      try {
        const cleanedStakeholder = cleanJsonResponse(stakeholderResponse);
        stakeholders = JSON.parse(cleanedStakeholder);
        console.log('✅ Stakeholders parsed successfully:', stakeholders.stakeholders?.length, 'stakeholders');
      } catch (parseError) {
        console.error('❌ Stakeholder JSON Parse Error:', parseError.message);
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

      const commResponse = await ClaudeService.generateContent(commPlanPrompt);
      console.log('DEBUG: Received comm plan response, length:', commResponse?.length);

      try {
        const cleanedComm = cleanJsonResponse(commResponse);
        communicationPlans = JSON.parse(cleanedComm);
        console.log('✅ Communication plans parsed successfully');
      } catch (parseError) {
        console.error('❌ Comm Plan JSON Parse Error:', parseError.message);
        throw parseError;
      }

      // Create the crisis plan
      const crisisPlan = {
        industry,
        generatedDate: new Date().toLocaleDateString(),
        scenarios: [...scenarios.scenarios.map(s => ({...s, isUniversal: false})), ...getUniversalScenarios()],
        stakeholders: stakeholders.stakeholders,
        communicationPlans: communicationPlans.communicationPlans,
        crisisTeam: getDefaultCrisisTeam(),
        objectives: null,
        isAIGenerated: true
      };

      // Save to database
      const result = await pool.query(
        'INSERT INTO crisis_plans (user_id, industry, plan_data) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET industry = $2, plan_data = $3, updated_at = CURRENT_TIMESTAMP RETURNING *',
        [userId, industry, JSON.stringify(crisisPlan)]
      );

      // Return response in the format the frontend expects
      res.json({ 
        success: true,
        plan: {
          plan_data: crisisPlan,
          id: result.rows[0].id
        }
      });

    } catch (error) {
      console.error('Claude API error:', error);
      
      // Use fallback data
      const fallbackData = getFallbackData(industry);
      const crisisPlan = {
        industry,
        generatedDate: new Date().toLocaleDateString(),
        ...fallbackData,
        crisisTeam: getDefaultCrisisTeam(),
        objectives: null,
        isAIGenerated: false
      };

      // Save to database
      const result = await pool.query(
        'INSERT INTO crisis_plans (user_id, industry, plan_data) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET industry = $2, plan_data = $3, updated_at = CURRENT_TIMESTAMP RETURNING *',
        [userId, industry, JSON.stringify(crisisPlan)]
      );

      res.json({ 
        success: true,
        plan: {
          plan_data: crisisPlan,
          id: result.rows[0].id
        }
      });
    }
  } catch (error) {
    console.error('Error generating crisis plan:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate crisis plan',
      message: error.message 
    });
  }
};

// Get saved crisis plan
exports.getPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM crisis_plans WHERE user_id = $1',
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
        updated_at: plan.updated_at
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Failed to retrieve crisis plan' });
  }
};

// Update crisis plan
exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planData } = req.body;
    
    const result = await pool.query(
      'UPDATE crisis_plans SET plan_data = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
      [userId, JSON.stringify(planData)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crisis plan not found' });
    }
    
    res.json({
      plan: {
        id: result.rows[0].id,
        plan_data: result.rows[0].plan_data
      }
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update crisis plan' });
  }
};

// Delete crisis plan
exports.deletePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.query(
      'DELETE FROM crisis_plans WHERE user_id = $1',
      [userId]
    );
    
    res.json({ message: 'Crisis plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete crisis plan' });
  }
};

// Get AI advice
exports.getAIAdvice = async (req, res) => {
  try {
    const { message, crisisPlan, selectedScenario } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const context = crisisPlan ? `
        You are a crisis management advisor. The user has a crisis plan for the ${crisisPlan.industry} industry with:
        - ${crisisPlan.scenarios?.length || 0} identified scenarios
        - ${crisisPlan.stakeholders?.length || 0} key stakeholders
        - ${crisisPlan.communicationPlans?.length || 0} communication plans
        ${selectedScenario ? `They are specifically asking about: "${selectedScenario.title}"` : ''}
      ` : 'You are a crisis management advisor helping with crisis planning and response.';

      const prompt = `${context}
      
User question: ${message}

Provide practical, actionable advice. Be specific and consider the industry context.`;

      const response = await ClaudeService.generateContent(prompt);
      res.json({ response });
    } catch (error) {
      console.error('Claude API error:', error);
      res.json({ 
        response: "I apologize, but I'm having trouble processing your request right now. Here's some general advice: " +
                 "Focus on clear communication, stakeholder management, and maintaining operational continuity. " +
                 "Please try again in a moment."
      });
    }
  } catch (error) {
    console.error('AI advice error:', error);
    res.status(500).json({ error: 'Failed to get AI advice' });
  }
};

// Draft crisis response
exports.draftResponse = async (req, res) => {
  try {
    const { stakeholder, scenario, tone, keyPoints } = req.body;

    if (!stakeholder || !scenario) {
      return res.status(400).json({ error: 'Stakeholder and scenario are required' });
    }

    try {
      const prompt = `Draft a crisis communication message for the following:
Stakeholder: ${stakeholder}
Crisis Scenario: ${scenario}
Tone: ${tone || 'professional and empathetic'}
Key Points to Address: ${keyPoints?.join(', ') || 'General update and reassurance'}

Create a clear, concise message appropriate for this stakeholder group. Include:
1. Acknowledgment of the situation
2. Current actions being taken
3. Commitment to resolution
4. Next steps or timeline
5. Contact information for questions`;

      const response = await ClaudeService.generateContent(prompt);
      res.json({ draft: response });
    } catch (error) {
      console.error('Claude API error:', error);
      res.json({ 
        draft: `[Draft Communication for ${stakeholder}]

We are aware of the current situation regarding ${scenario} and want to assure you that we are taking immediate action.

Our team is fully engaged in addressing this matter and we are committed to resolving it as quickly and effectively as possible. Your [safety/security/interests] remain our top priority.

We will provide regular updates as the situation develops. In the meantime, please don't hesitate to contact us if you have any questions or concerns.

Thank you for your patience and understanding.

[Contact Information]`
      });
    }
  } catch (error) {
    console.error('Draft response error:', error);
    res.status(500).json({ error: 'Failed to draft response' });
  }
};

// Save event log
exports.saveEventLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_type, description, severity } = req.body;

    const result = await pool.query(
      'INSERT INTO crisis_event_logs (user_id, event_type, description, severity) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, event_type, description, severity]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Save event log error:', error);
    res.status(500).json({ error: 'Failed to save event log' });
  }
};

// Get event logs
exports.getEventLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM crisis_event_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get event logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve event logs' });
  }
};
