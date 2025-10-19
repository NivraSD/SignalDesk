const claudeService = require('../../config/claude');

// AI Strategy Chat endpoint
exports.strategyChat = async (req, res) => {
  try {
    const { phase, message, context, questions } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== STRATEGY CHAT REQUEST ===');
    console.log('Phase:', phase);
    console.log('Message:', message);
    
    // Build intelligent prompt based on phase
    const prompt = buildPhasePrompt(phase, message, context, questions);
    
    // Send to Claude for analysis
    const response = await claudeService.sendMessage(prompt);
    
    // Parse and structure response
    const analysis = parseStrategyResponse(response, phase, message, context);
    
    res.json({
      success: true,
      response: analysis.response,
      insights: analysis.insights,
      nextSteps: analysis.nextSteps,
      strategyUpdate: analysis.strategyUpdate,
      phaseComplete: analysis.phaseComplete
    });
    
  } catch (error) {
    console.error('Error in strategy chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process strategy chat'
    });
  }
};

function buildPhasePrompt(phase, message, context, questions) {
  const basePrompt = `You are an expert Stakeholder Intelligence Strategist helping develop a comprehensive stakeholder strategy.

Current Phase: ${phase}
Phase Questions: ${questions.join('\n')}
Current Context: ${JSON.stringify(context, null, 2)}
User Response: ${message}

Based on the user's response:
1. Provide helpful guidance and follow-up questions
2. Extract key strategic information
3. Identify insights that will help build their strategy
4. Determine if the phase is complete (all questions addressed)

Response format:
{
  "response": "Your conversational response with follow-up questions if needed",
  "insights": ["Insight 1", "Insight 2"],
  "nextSteps": "What happens next",
  "strategyUpdate": {
    // Any updates to strategy based on this response
  },
  "phaseComplete": false // true when all phase questions are answered
}`;

  // Add phase-specific guidance
  const phaseGuidance = {
    discovery: `
Focus on understanding:
- Business objectives and priorities
- Key stakeholder groups and their importance
- Current reputation challenges
- Success metrics`,
    
    mapping: `
Focus on mapping:
- All stakeholder groups (investors, customers, employees, media, etc.)
- Influence levels (1-10 scale)
- Current sentiment/relationship status
- Key influencers within each group`,
    
    goalSetting: `
Focus on setting SMART goals:
- Specific outcomes for each stakeholder group
- Measurable targets (e.g., "increase investor confidence from 65% to 85%")
- Achievable within timeframes
- Relevant to business objectives
- Time-bound milestones`,
    
    strategyDesign: `
Focus on strategy components:
- Key messages that resonate with each group
- Engagement tactics and channels
- Influence pathways between stakeholders
- Risk mitigation plans`
  };

  return basePrompt + '\n\nPhase-specific guidance:\n' + phaseGuidance[phase];
}

function parseStrategyResponse(response, phase, message, context) {
  try {
    // Try to parse as JSON first
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      // Extract JSON from response if wrapped in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to creating structured response
        parsed = {
          response: response,
          insights: extractInsights(response),
          nextSteps: "Continue with strategy development",
          strategyUpdate: extractStrategyUpdate(phase, message, context),
          phaseComplete: false
        };
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing strategy response:', error);
    return {
      response: "I understand. Let me help you develop your stakeholder strategy. " + response,
      insights: [],
      nextSteps: "Let's continue building your strategy",
      strategyUpdate: {},
      phaseComplete: false
    };
  }
}

function extractInsights(response) {
  // Simple insight extraction - would be more sophisticated in production
  const insights = [];
  
  if (response.includes('investor') || response.includes('shareholder')) {
    insights.push('Investor relations is a key focus area');
  }
  
  if (response.includes('employee') || response.includes('team')) {
    insights.push('Internal stakeholder alignment is important');
  }
  
  if (response.includes('customer') || response.includes('client')) {
    insights.push('Customer perception drives business success');
  }
  
  return insights;
}

function extractStrategyUpdate(phase, message, context) {
  const update = {};
  
  switch(phase) {
    case 'discovery':
      // Extract business objectives
      if (message.toLowerCase().includes('objective') || message.toLowerCase().includes('goal')) {
        update.businessObjectives = extractObjectives(message);
      }
      break;
      
    case 'mapping':
      // Extract stakeholder groups
      if (message.toLowerCase().includes('stakeholder') || message.toLowerCase().includes('group')) {
        update.stakeholderGroups = extractStakeholders(message);
      }
      break;
      
    case 'goalSetting':
      // Extract SMART goals
      if (message.includes('%') || message.includes('increase') || message.includes('improve')) {
        update.smartGoals = extractGoals(message);
      }
      break;
      
    case 'strategyDesign':
      // Extract strategy elements
      update.strategyElements = {
        messages: extractMessages(message),
        tactics: extractTactics(message)
      };
      break;
  }
  
  return update;
}

function extractObjectives(text) {
  // Simple extraction - would use NLP in production
  const objectives = [];
  const lines = text.split(/[.!?\n]/);
  
  lines.forEach(line => {
    if (line.includes('objective') || line.includes('goal') || line.includes('achieve')) {
      objectives.push(line.trim());
    }
  });
  
  return objectives;
}

function extractStakeholders(text) {
  // Common stakeholder groups to look for
  const commonGroups = [
    'investors', 'shareholders', 'customers', 'clients', 'employees', 'team',
    'media', 'press', 'analysts', 'partners', 'suppliers', 'regulators',
    'community', 'activists', 'influencers'
  ];
  
  const found = [];
  commonGroups.forEach(group => {
    if (text.toLowerCase().includes(group)) {
      found.push({
        name: group.charAt(0).toUpperCase() + group.slice(1),
        influence: 7, // Default
        currentSentiment: 5, // Default
        mentioned: true
      });
    }
  });
  
  return found;
}

function extractGoals(text) {
  const goals = [];
  const patterns = [
    /increase (\w+) from (\d+)% to (\d+)%/gi,
    /improve (\w+) by (\d+)%/gi,
    /achieve (\d+)% (\w+)/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      goals.push({
        metric: match[1],
        current: match[2],
        target: match[3] || match[2],
        text: match[0]
      });
    }
  });
  
  return goals;
}

function extractMessages(text) {
  // Extract key messaging themes
  const themes = [];
  const keywords = ['message', 'communicate', 'emphasize', 'highlight', 'focus'];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      themes.push(`Key messaging around ${keyword}`);
    }
  });
  
  return themes;
}

function extractTactics(text) {
  // Extract engagement tactics
  const tactics = [];
  const channels = ['email', 'meeting', 'call', 'event', 'webinar', 'report', 'update'];
  
  channels.forEach(channel => {
    if (text.toLowerCase().includes(channel)) {
      tactics.push(`${channel} engagement`);
    }
  });
  
  return tactics;
}

module.exports = exports;