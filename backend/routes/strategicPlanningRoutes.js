const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ClaudeService = require('../config/claude');
const claudeService = new ClaudeService();

// Generate strategic plan
router.post('/generate-plan', auth, async (req, res) => {
  try {
    const { objective, context, constraints, timeline } = req.body;
    
    if (!objective) {
      return res.status(400).json({ 
        success: false, 
        error: 'Objective is required' 
      });
    }

    const prompt = `As a strategic planning expert, create a comprehensive strategic plan:

OBJECTIVE: ${objective}

${context ? `CONTEXT: ${context}` : ''}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}
${timeline ? `TIMELINE: ${timeline}` : ''}

Provide a structured strategic plan with:
1. Executive Summary (2-3 sentences)
2. Strategic Pillars (3-4 key focus areas)
3. Evidence & Research Needs (specific data/insights required)
4. Implementation Phases (clear milestones)
5. Success Metrics (measurable KPIs)
6. Risk Mitigation (top 3 risks and strategies)

Format as JSON with these exact keys: executive_summary, strategic_pillars, evidence_needs, implementation_phases, success_metrics, risk_mitigation`;

    const response = await claudeService.sendMessage(prompt);
    
    // Parse the response
    let strategicPlan;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      strategicPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch (parseError) {
      // Fallback structure if parsing fails
      strategicPlan = {
        executive_summary: response.substring(0, 200),
        strategic_pillars: [],
        evidence_needs: [],
        implementation_phases: [],
        success_metrics: [],
        risk_mitigation: []
      };
    }

    res.json({
      success: true,
      data: {
        ...strategicPlan,
        objective,
        created_at: new Date().toISOString(),
        status: 'draft'
      }
    });

  } catch (error) {
    console.error('Strategic planning error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate strategic plan' 
    });
  }
});

// Execute campaign from strategic plan
router.post('/execute-campaign', auth, async (req, res) => {
  try {
    const { planId, pillarIndex, executionType } = req.body;
    
    // This would integrate with existing campaign execution logic
    const executionPlan = {
      id: `exec-${Date.now()}`,
      planId,
      pillarIndex,
      executionType,
      status: 'pending',
      tasks: [
        {
          id: 'task-1',
          name: 'Content Creation',
          status: 'pending',
          assignee: 'Content Generator MCP'
        },
        {
          id: 'task-2', 
          name: 'Media Outreach',
          status: 'pending',
          assignee: 'Media Intelligence MCP'
        },
        {
          id: 'task-3',
          name: 'Performance Monitoring',
          status: 'pending',
          assignee: 'Analytics MCP'
        }
      ],
      created_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: executionPlan
    });

  } catch (error) {
    console.error('Campaign execution error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute campaign' 
    });
  }
});

// Get evidence for strategic planning
router.post('/gather-evidence', auth, async (req, res) => {
  try {
    const { topic, sources = ['market', 'competitors', 'trends'] } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic is required' 
      });
    }

    // This would integrate with MCPs for real data gathering
    const evidence = {
      market_analysis: {
        size: '$50B market opportunity',
        growth_rate: '15% YoY',
        key_players: ['Company A', 'Company B', 'Company C']
      },
      competitor_insights: {
        strengths: ['Brand recognition', 'Distribution network'],
        weaknesses: ['Innovation gap', 'Customer service'],
        opportunities: ['Digital transformation', 'New markets']
      },
      trend_analysis: {
        emerging: ['AI integration', 'Sustainability focus'],
        declining: ['Traditional methods', 'Legacy systems'],
        stable: ['Core services', 'Customer base']
      },
      recommendations: [
        'Focus on digital transformation initiatives',
        'Leverage AI for competitive advantage',
        'Expand into emerging markets'
      ]
    };

    res.json({
      success: true,
      data: {
        topic,
        sources,
        evidence,
        gathered_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Evidence gathering error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to gather evidence' 
    });
  }
});

// Update strategic plan
router.put('/update-plan/:planId', auth, async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    // In production, this would update the database
    const updatedPlan = {
      id: planId,
      ...updates,
      updated_at: new Date().toISOString(),
      status: 'updated'
    };

    res.json({
      success: true,
      data: updatedPlan
    });

  } catch (error) {
    console.error('Plan update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update strategic plan' 
    });
  }
});

// Get strategic plan status
router.get('/plan-status/:planId', auth, async (req, res) => {
  try {
    const { planId } = req.params;

    // Mock status - would query database in production
    const status = {
      id: planId,
      status: 'in_progress',
      completion: 65,
      active_campaigns: 2,
      completed_tasks: 8,
      total_tasks: 12,
      last_activity: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get plan status' 
    });
  }
});

module.exports = router;