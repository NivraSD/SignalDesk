const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const intelligenceMonitoringController = require('../controllers/intelligenceMonitoringController');
const pool = require('../config/db');

// Auth middleware is applied at app level in index.js

// Legacy endpoints (keep for compatibility)
router.get('/organization/:organizationId', intelligenceMonitoringController.getOpportunities);
router.post('/identify', intelligenceMonitoringController.identifyOpportunities);
router.patch('/:opportunityId/status', intelligenceMonitoringController.updateOpportunityStatus);

// New Opportunity Engine endpoints
router.get('/discover', async (req, res) => {
  try {
    const { keywords, type, limit = 10 } = req.query;
    
    // Mock opportunities for now - in production, integrate with news APIs
    const opportunities = [
      {
        id: 1,
        type: 'trending',
        title: 'AI Regulation Discussion Heating Up',
        description: 'Senate hearings on AI safety creating media opportunities',
        score: 95,
        urgency: 'high',
        relevantJournalists: ['Sarah Chen - TechCrunch', 'Michael Roberts - The Verge'],
        suggestedAction: 'Prepare thought leadership piece on responsible AI',
        deadline: '2 days',
        keywords: ['AI safety', 'regulation', 'ethics']
      },
      {
        id: 2,
        type: 'news_hook',
        title: 'Competitor DataCo Announces Layoffs',
        description: 'Opportunity to highlight your company stability and growth',
        score: 88,
        urgency: 'medium',
        relevantJournalists: ['Lisa Martinez - Forbes'],
        suggestedAction: 'Pitch story about sustainable growth in tough market',
        deadline: '1 week',
        keywords: ['growth', 'stability', 'market leadership']
      },
      {
        id: 3,
        type: 'award',
        title: 'TechCrunch Startup Awards - Nominations Open',
        description: 'Annual awards recognizing innovative startups',
        score: 82,
        urgency: 'medium',
        relevantJournalists: [],
        suggestedAction: 'Submit nomination by deadline',
        deadline: '3 weeks',
        keywords: ['awards', 'recognition', 'innovation']
      },
      {
        id: 4,
        type: 'speaking',
        title: 'AI Summit 2025 - Speaker Applications',
        description: 'Major conference seeking expert speakers on AI applications',
        score: 90,
        urgency: 'high',
        relevantJournalists: ['Industry analysts will attend'],
        suggestedAction: 'Apply with CEO as keynote speaker',
        deadline: '5 days',
        keywords: ['conference', 'thought leadership', 'visibility']
      },
      {
        id: 5,
        type: 'journalist_interest',
        title: 'Emily Johnson Seeking Cybersecurity Sources',
        description: 'Wired journalist working on data privacy feature',
        score: 78,
        urgency: 'high',
        relevantJournalists: ['Emily Johnson - Wired'],
        suggestedAction: 'Reach out with security expertise angle',
        deadline: '3 days',
        keywords: ['cybersecurity', 'privacy', 'feature story']
      }
    ];
    
    // Filter by type if specified
    let filtered = opportunities;
    if (type) {
      filtered = filtered.filter(opp => opp.type === type);
    }
    
    // Filter by keywords if specified
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase());
      filtered = filtered.filter(opp => 
        opp.keywords.some(k => keywordArray.some(kw => k.toLowerCase().includes(kw)))
      );
    }
    
    // Apply limit
    filtered = filtered.slice(0, parseInt(limit));
    
    res.json({ opportunities: filtered });
  } catch (error) {
    console.error('Error discovering opportunities:', error);
    res.status(500).json({ error: 'Failed to discover opportunities' });
  }
});

// Track an opportunity
router.post('/:id/track', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // In production, save to database
    res.json({ 
      success: true, 
      message: `Tracking opportunity ${id}`,
      tracking: {
        opportunityId: id,
        notes,
        status: 'tracking',
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error tracking opportunity:', error);
    res.status(500).json({ error: 'Failed to track opportunity' });
  }
});

// Get opportunity trends
router.get('/trends', async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Mock trends data
    const trends = {
      timeframe,
      topTypes: [
        { type: 'trending', count: 15, avgScore: 85 },
        { type: 'news_hook', count: 12, avgScore: 78 },
        { type: 'journalist_interest', count: 8, avgScore: 72 }
      ],
      topKeywords: [
        { keyword: 'AI', frequency: 25 },
        { keyword: 'sustainability', frequency: 18 },
        { keyword: 'cybersecurity', frequency: 15 }
      ],
      urgencyBreakdown: {
        high: 35,
        medium: 45,
        low: 20
      }
    };
    
    res.json({ trends });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});
=======
const intelligenceMonitoringController = require('../src/controllers/intelligenceMonitoringController');

// Get opportunities for an organization
router.get('/organization/:organizationId', intelligenceMonitoringController.getOpportunities);
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb

module.exports = router;