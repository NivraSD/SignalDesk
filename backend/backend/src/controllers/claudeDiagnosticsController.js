// Claude Diagnostics Controller - Test Claude connectivity for all features
const claudeService = require('../../config/claude');

const claudeDiagnosticsController = {
  // Test basic Claude connectivity
  testConnection: async (req, res) => {
    try {
      console.log('Testing Claude connection...');
      
      const testPrompt = 'Respond with exactly: "Claude API is working"';
      const response = await claudeService.sendMessage(testPrompt);
      
      res.json({
        success: true,
        message: 'Claude API is connected',
        response: response,
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Claude connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Claude API connection failed',
        error: error.message,
        details: {
          hasApiKey: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY,
          model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
        }
      });
    }
  },

  // Test all feature-specific Claude integrations
  testAllFeatures: async (req, res) => {
    const results = {
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      features: {}
    };

    // Test Content Generator
    try {
      const contentPrompt = 'Generate a one-sentence press release headline about AI.';
      const contentResponse = await claudeService.sendMessage(contentPrompt);
      results.features.contentGenerator = {
        status: 'working',
        response: contentResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.contentGenerator = {
        status: 'failed',
        error: error.message
      };
    }

    // Test Crisis Advisor
    try {
      const crisisPrompt = 'Provide one crisis management tip in 10 words or less.';
      const crisisResponse = await claudeService.sendMessage(crisisPrompt);
      results.features.crisisAdvisor = {
        status: 'working',
        response: crisisResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.crisisAdvisor = {
        status: 'failed',
        error: error.message
      };
    }

    // Test Campaign Intelligence
    try {
      const campaignPrompt = 'Name one key element of a PR campaign in 5 words.';
      const campaignResponse = await claudeService.sendMessage(campaignPrompt);
      results.features.campaignIntelligence = {
        status: 'working',
        response: campaignResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.campaignIntelligence = {
        status: 'failed',
        error: error.message
      };
    }

    // Test Opportunity Engine
    try {
      const opportunityPrompt = 'Define PR opportunity in exactly 5 words.';
      const opportunityResponse = await claudeService.sendMessage(opportunityPrompt);
      results.features.opportunityEngine = {
        status: 'working',
        response: opportunityResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.opportunityEngine = {
        status: 'failed',
        error: error.message
      };
    }

    // Test Media List Builder
    try {
      const mediaPrompt = 'Name one type of journalist in 3 words.';
      const mediaResponse = await claudeService.sendMessage(mediaPrompt);
      results.features.mediaListBuilder = {
        status: 'working',
        response: mediaResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.mediaListBuilder = {
        status: 'failed',
        error: error.message
      };
    }

    // Test Monitoring AI Analysis
    try {
      const monitoringPrompt = 'What is brand sentiment monitoring? Answer in 10 words.';
      const monitoringResponse = await claudeService.sendMessage(monitoringPrompt);
      results.features.monitoringAnalysis = {
        status: 'working',
        response: monitoringResponse.substring(0, 100)
      };
    } catch (error) {
      results.features.monitoringAnalysis = {
        status: 'failed',
        error: error.message
      };
    }

    // Calculate summary
    const workingFeatures = Object.values(results.features).filter(f => f.status === 'working').length;
    const totalFeatures = Object.keys(results.features).length;
    
    results.summary = {
      workingFeatures,
      totalFeatures,
      percentWorking: Math.round((workingFeatures / totalFeatures) * 100),
      overallStatus: workingFeatures === totalFeatures ? 'all_working' : 
                     workingFeatures > 0 ? 'partial' : 'none_working'
    };

    res.json(results);
  },

  // Test specific feature
  testFeature: async (req, res) => {
    const { feature } = req.params;
    
    const featureTests = {
      content: {
        prompt: 'Write a press release headline about innovation.',
        expectedLength: 50
      },
      crisis: {
        prompt: 'List 3 crisis response steps.',
        expectedLength: 100
      },
      campaign: {
        prompt: 'Describe a product launch campaign strategy in one paragraph.',
        expectedLength: 200
      },
      opportunity: {
        prompt: 'Identify a PR opportunity from this: "Company launches green initiative"',
        expectedLength: 150
      },
      media: {
        prompt: 'Suggest 3 journalist beats for a tech startup story.',
        expectedLength: 100
      }
    };

    const test = featureTests[feature];
    if (!test) {
      return res.status(400).json({
        success: false,
        message: `Unknown feature: ${feature}. Valid features: ${Object.keys(featureTests).join(', ')}`
      });
    }

    try {
      console.log(`Testing Claude for feature: ${feature}`);
      const response = await claudeService.sendMessage(test.prompt);
      
      res.json({
        success: true,
        feature,
        prompt: test.prompt,
        response,
        responseLength: response.length,
        expectedMinLength: test.expectedLength,
        meetsExpectation: response.length >= test.expectedLength
      });
    } catch (error) {
      console.error(`Claude test failed for feature ${feature}:`, error);
      res.status(500).json({
        success: false,
        feature,
        error: error.message,
        troubleshooting: {
          checkApiKey: 'Ensure CLAUDE_API_KEY or ANTHROPIC_API_KEY is set in .env',
          checkModel: 'Verify CLAUDE_MODEL is set correctly (default: claude-sonnet-4-20250514)',
          checkNetwork: 'Ensure server can reach api.anthropic.com',
          checkLogs: 'Review server logs for detailed error messages'
        }
      });
    }
  },

  // Get Claude configuration info
  getConfig: async (req, res) => {
    res.json({
      configured: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      keySource: process.env.CLAUDE_API_KEY ? 'CLAUDE_API_KEY' : 
                  process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY' : 'none',
      keyLength: (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '').length,
      environment: process.env.NODE_ENV || 'development',
      features: {
        contentGenerator: 'Configured',
        crisisAdvisor: 'Configured',
        campaignIntelligence: 'Configured',
        opportunityEngine: 'Configured',
        mediaListBuilder: 'Configured',
        monitoringAnalysis: 'Configured'
      }
    });
  }
};

module.exports = claudeDiagnosticsController;