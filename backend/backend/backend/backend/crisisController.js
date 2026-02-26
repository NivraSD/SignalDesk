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
    description: "Sophisticated cyber attack compromising systems, encrypting data, or demanding ransom payment, potentially paralyzing operations",
    likelihood: "High",
    impact: "Critical",
    isUniversal: true
  },
  {
    title: "Executive Misconduct",
    description: "Senior leadership accused of illegal, unethical, or inappropriate behavior requiring immediate action and public response",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  },
  {
    title: "Workplace Violence Incident",
    description: "Active threat or violent incident at company facilities requiring immediate safety response and crisis management",
    likelihood: "Low",
    impact: "Critical",
    isUniversal: true
  },
  {
    title: "Financial Fraud or Embezzlement",
    description: "Discovery of internal financial misconduct, accounting irregularities, or embezzlement affecting company finances and credibility",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  },
  {
    title: "Pandemic/Health Emergency",
    description: "Widespread health crisis requiring business continuity measures, remote work protocols, and employee safety procedures",
    likelihood: "Medium",
    impact: "Major",
    isUniversal: true
  }
];

// Fallback data
const getFallbackData = (industry) => ({
  scenarios: [
    {
      title: "Major Data Security Breach",
      description: `Unauthorized access to sensitive ${industry} data affecting customer records and proprietary information`,
      likelihood: "High",
      impact: "Critical",
      isUniversal: false
    },
    {
      title: "Regulatory Compliance Violation",
      description: `Significant breach of ${industry} regulations resulting in potential fines and operational restrictions`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Supply Chain Disruption",
      description: `Critical supplier failure or logistics breakdown affecting ${industry} operations and service delivery`,
      likelihood: "Medium",
      impact: "Major",
      isUniversal: false
    },
    {
      title: "Reputation Crisis",
      description: `Negative media coverage or social media backlash damaging ${industry} brand and customer trust`,
      likelihood: "High",
      impact: "Moderate",
      isUniversal: false
    },
    {
      title: "Natural Disaster Impact",
      description: `Severe weather or natural disaster affecting ${industry} facilities and business continuity`,
      likelihood: "Low",
      impact: "Critical",
      isUniversal: false
    },
    ...getUniversalScenarios()
  ],
  stakeholders: [
    {
      name: "Customers/Clients",
      description: `Primary users of ${industry} products or services`,
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
    }
  ],
  communicationPlans: [
    {
      stakeholder: "Customers/Clients",
      primaryChannel: "Email and company website",
      secondaryChannel: "Customer service hotline",
      keyMessages: [
        "Acknowledgment of issue and commitment to resolution",
        "Specific steps being taken to address concerns",
        "Timeline for service restoration or issue resolution"
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
    }
  ]
});

exports.generatePlan = async (req, res) => {
  try {
    const { industry } = req.body;
    const userId = req.userId;

    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }

    try {
      // Try using Claude API
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

      const scenariosResponse = await ClaudeService.generateContent(scenariosPrompt);
      const scenarios = JSON.parse(cleanJsonResponse(scenariosResponse));

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
      const stakeholders = JSON.parse(cleanJsonResponse(stakeholderResponse));

      const commPlanPrompt = `For the ${industry} industry crisis management, create a communication plan for the top 5 stakeholder groups.

Respond ONLY with a valid JSON object in this format:
{
  "communicationPlans": [
    {
      "stakeholder": "Stakeholder name",
      "primaryChannel": "Communication channel",
      "secondaryChannel": "Backup channel",
      "keyMessages": ["message1", "message2", "message3"],
      "timing": "When to communicate",
      "spokesperson": "Who should communicate"
    }
  ]
}`;

      const commResponse = await ClaudeService.generateContent(commPlanPrompt);
      const communicationPlans = JSON.parse(cleanJsonResponse(commResponse));

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

      res.json({ ...crisisPlan, id: result.rows[0].id });
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

      res.json({ ...crisisPlan, id: result.rows[0].id });
    }
  } catch (error) {
    console.error('Generate plan error:', error);
    res.status(500).json({ error: 'Failed to generate crisis plan' });
  }
};

exports.getPlan = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await pool.query(
      'SELECT * FROM crisis_plans WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No crisis plan found' });
    }

    const plan = result.rows[0];
    res.json({
      id: plan.id,
      ...plan.plan_data,
      industry: plan.industry,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Failed to retrieve crisis plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const userId = req.userId;
    const planData = req.body;

    const result = await pool.query(
      'UPDATE crisis_plans SET plan_data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [JSON.stringify(planData), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crisis plan not found' });
    }

    res.json({
      id: result.rows[0].id,
      ...result.rows[0].plan_data,
      industry: result.rows[0].industry,
      updatedAt: result.rows[0].updated_at
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update crisis plan' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const userId = req.userId;

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

exports.getAIAdvice = async (req, res) => {
  try {
    const { message, crisisPlan, selectedScenario } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      const context = crisisPlan ? `
        You are a crisis management advisor. The user has a crisis plan for the ${crisisPlan.industry} industry with:
        
        Industry-Specific Scenarios: ${crisisPlan.scenarios.filter(s => !s.isUniversal).map(s => s.title).join(', ')}
        
        Universal Scenarios: ${crisisPlan.scenarios.filter(s => s.isUniversal).map(s => s.title).join(', ')}
        
        Key Stakeholders: ${crisisPlan.stakeholders.map(s => s.name).join(', ')}
        
        Communication Plans for: ${crisisPlan.communicationPlans.map(p => p.stakeholder).join(', ')}
        
        ${selectedScenario ? `Active Crisis Scenario: ${selectedScenario.title}` : ''}
        
        Based on the user's crisis description, identify which scenario (industry-specific or universal) applies and provide specific guidance.
      ` : 'You are a crisis management advisor. The user does not have a crisis plan yet.';

      const prompt = `${context}
      
      User's crisis: "${message}"
      
      Respond with JSON:
      {
        "advice": "Detailed advice with specific steps",
        "immediateActions": ["Action 1", "Action 2", "Action 3"],
        "relevantScenario": "Matching scenario name or null",
        "urgencyLevel": "high/medium/low",
        "keyStakeholders": ["Stakeholder 1", "Stakeholder 2"],
        "suggestedMessage": "Brief holding statement"
      }
      
      ONLY valid JSON, no other text.`;

      const response = await ClaudeService.generateContent(prompt);
      const advice = JSON.parse(cleanJsonResponse(response));
      
      res.json(advice);
    } catch (error) {
      console.error('Claude API error:', error);
      
      // Fallback response
      res.json({
        advice: crisisPlan 
          ? "Based on your crisis plan, I recommend: 1) Activate your crisis response team immediately, 2) Assess which scenario from your plan best matches this situation, 3) Begin stakeholder notifications according to your communication protocols."
          : "Without a crisis plan, I recommend: 1) Establish a crisis response team immediately, 2) Assess the scope and impact of the situation, 3) Begin notifying key stakeholders.",
        immediateActions: [
          "Convene crisis response team",
          "Assess situation severity",
          "Prepare stakeholder communications"
        ],
        relevantScenario: null,
        urgencyLevel: "medium",
        keyStakeholders: ["Employees", "Customers"],
        suggestedMessage: "We are aware of the situation and are actively investigating. We will provide updates as more information becomes available."
      });
    }
  } catch (error) {
    console.error('AI advice error:', error);
    res.status(500).json({ error: 'Failed to get AI advice' });
  }
};

exports.draftResponse = async (req, res) => {
  try {
    const { stakeholder, plan, scenario, industry } = req.body;

    if (!stakeholder || !plan) {
      return res.status(400).json({ error: 'Stakeholder and plan are required' });
    }

    try {
      const prompt = `You are drafting a crisis communication for ${stakeholder} during a ${scenario ? scenario.title : 'crisis situation'} in the ${industry || 'business'} industry.

Key messages to include:
${plan.keyMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Communication channel: ${plan.primaryChannel}
Spokesperson: ${plan.spokesperson}
Timing requirement: ${plan.timing}

Draft a professional, empathetic, and clear communication that:
1. Addresses the crisis situation
2. Incorporates ALL the key messages listed above
3. Is appropriate for ${stakeholder}
4. Maintains trust and transparency
5. Provides clear next steps or actions

The tone should be appropriate for the stakeholder group and the severity of the situation.

Respond with ONLY the drafted message text, no other commentary.`;

      const response = await ClaudeService.generateContent(prompt);
      
      res.json({ message: response });
    } catch (error) {
      console.error('Claude API error:', error);
      
      // Fallback template
      const template = `Dear ${stakeholder},

We are writing to inform you about ${scenario ? scenario.title : 'a situation'} that may affect our operations.

${plan.keyMessages.map(msg => `• ${msg}`).join('\n')}

We are committed to keeping you informed as the situation develops. Please don't hesitate to reach out through ${plan.primaryChannel} if you have any questions or concerns.

Thank you for your patience and understanding.

Sincerely,
${plan.spokesperson}`;

      res.json({ message: template });
    }
  } catch (error) {
    console.error('Draft response error:', error);
    res.status(500).json({ error: 'Failed to draft response' });
  }
};

exports.saveEventLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { event } = req.body;

    const result = await pool.query(
      'INSERT INTO crisis_event_logs (user_id, event_data) VALUES ($1, $2) RETURNING *',
      [userId, JSON.stringify(event)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Save event log error:', error);
    res.status(500).json({ error: 'Failed to save event log' });
  }
};

exports.getEventLogs = async (req, res) => {
  try {
    const userId = req.userId;

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
