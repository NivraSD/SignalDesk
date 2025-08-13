const express = require("express");
const router = express.Router();
const claudeService = require("../config/claude");
const pool = require("../config/database");
const authMiddleware = require("../src/middleware/authMiddleware");

router.use(authMiddleware);

// Process natural language request
router.post("/process-request", async (req, res) => {
  try {
    const { query, projectId } = req.body;
    const userId = req.user.id;

    // Simple intent detection
    const lowerQuery = query.toLowerCase();

    let result = {
      type: "general",
      content: "",
      action: "response",
    };

    if (
      lowerQuery.includes("write") ||
      lowerQuery.includes("draft") ||
      lowerQuery.includes("create")
    ) {
      // Content generation request
      const prompt = `Generate professional content based on this request: ${query}`;
      const content = await claudeService.sendMessage(prompt);

      result = {
        type: "content",
        content: content,
        title: "Generated Content",
        action: "generated",
      };
    } else if (
      lowerQuery.includes("journalist") ||
      lowerQuery.includes("reporter") ||
      lowerQuery.includes("media")
    ) {
      // Media list request
      const searchPrompt = `Find journalists for: ${query}`;
      const results = await claudeService.sendMessage(searchPrompt);

      result = {
        type: "media-list",
        content: results,
        query: query,
        action: "searched",
      };
    } else {
      // General research
      const researchPrompt = `Provide information about: ${query}`;
      const research = await claudeService.sendMessage(researchPrompt);

      result = {
        type: "research",
        content: research,
        query: query,
        action: "researched",
      };
    }

    res.json({
      success: true,
      result: result,
      projectId: projectId,
    });
  } catch (error) {
    console.error("Error processing AI request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: error.message,
    });
  }
});

// Generate with project context
router.post("/generate-with-context", async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    const userId = req.user.id;

    // Get project context
    let projectContext = "";
    if (projectId) {
      const projectResult = await pool.query(
        "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
        [projectId, userId]
      );

      if (projectResult.rows.length > 0) {
        const project = projectResult.rows[0];
        projectContext = `Project: ${project.name}, Industry: ${project.industry}. `;
      }
    }

    const fullPrompt = projectContext + prompt;
    const response = await claudeService.sendMessage(fullPrompt);

    res.json({
      success: true,
      content: response,
      projectId: projectId,
    });
  } catch (error) {
    console.error("Error generating with context:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate content",
    });
  }
});

// Analyze endpoint for stakeholder intelligence
router.post("/analyze", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const userId = req.user.id;

    console.log("AI Analyze request received:", { context, promptLength: prompt?.length });

    // Send to Claude for analysis
    const response = await claudeService.sendMessage(prompt);

    console.log("Claude response received, length:", response?.length);

    res.json({
      success: true,
      response: response,
      analysis: response, // Some frontend code expects 'analysis' field
      context: context,
    });
  } catch (error) {
    console.error("Error in AI analyze:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze",
      error: error.message,
    });
  }
});

// Stakeholder AI Advisor endpoint
router.post("/advisor", async (req, res) => {
  try {
    const { query, context, conversationHistory } = req.body;
    const userId = req.user.id;

    console.log("Stakeholder AI Advisor request:", { query, contextKeys: Object.keys(context || {}) });

    // Build context-aware prompt
    let systemPrompt = `You are an expert stakeholder relationship advisor. You help organizations understand, engage with, and manage relationships with their stakeholders effectively.`;
    
    if (context) {
      systemPrompt += `\n\nContext about the organization:`;
      if (context.company) systemPrompt += `\nCompany: ${context.company}`;
      if (context.industry) systemPrompt += `\nIndustry: ${context.industry}`;
      if (context.overview) systemPrompt += `\nOverview: ${JSON.stringify(context.overview)}`;
      
      if (context.stakeholders && context.stakeholders.length > 0) {
        systemPrompt += `\n\nKey stakeholders:`;
        context.stakeholders.slice(0, 10).forEach(s => {
          systemPrompt += `\n- ${s.name}: ${s.reason || 'Key stakeholder'}`;
        });
      }
      
      if (context.priorityStakeholders && context.priorityStakeholders.length > 0) {
        systemPrompt += `\n\nPriority stakeholders: ${context.priorityStakeholders.join(', ')}`;
      }
      
      if (context.recentFindings && context.recentFindings.length > 0) {
        systemPrompt += `\n\nRecent intelligence:`;
        context.recentFindings.forEach(f => {
          systemPrompt += `\n- ${f.stakeholder}: ${f.findings || f.content} (${f.sentiment || 'neutral'})`;
        });
      }
    }
    
    // Add conversation history if provided
    let fullPrompt = systemPrompt;
    if (conversationHistory && conversationHistory.length > 0) {
      fullPrompt += `\n\nConversation history:`;
      conversationHistory.slice(-5).forEach(msg => {
        fullPrompt += `\n${msg.role}: ${msg.content}`;
      });
    }
    
    fullPrompt += `\n\nUser question: ${query}\n\nProvide helpful, actionable advice about stakeholder relationships. Be specific and practical.`;

    // Send to Claude
    const response = await claudeService.sendMessage(fullPrompt);

    res.json({
      success: true,
      response: response,
      message: response
    });
  } catch (error) {
    console.error("Error in stakeholder advisor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get advisor response",
      error: error.message,
    });
  }
});

// Claude message endpoint for direct AI interactions
router.post("/claude/message", async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const userId = req.user.id;

    console.log("Claude message request received, prompt length:", prompt?.length);

    // Send to Claude for analysis
    const response = await claudeService.sendMessage(prompt);

    console.log("Claude response received, length:", response?.length);

    res.json({
      success: true,
      message: response,
      content: response
    });
  } catch (error) {
    console.error("Error in Claude message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process Claude message",
      error: error.message
    });
  }
});

// Stakeholder discovery endpoint for AI Strategy Advisor
router.post("/stakeholder-discovery", async (req, res) => {
  try {
    const { message, stage, organizationInfo, selectedStakeholders, conversationHistory } = req.body;
    const userId = req.user.id;

    console.log("Stakeholder discovery request:", { stage, message: message?.substring(0, 100) });

    if (stage === 'initial') {
      // Extract organization info and suggest stakeholders
      const prompt = `You are an expert stakeholder relationship advisor helping identify key stakeholders.

User input: "${message}"

From this input, extract:
1. Organization name
2. Industry/sector
3. Any mentioned stakeholders or concerns

Then suggest relevant stakeholder groups for this organization. Consider standard groups like:
- Customers/Clients
- Employees/Staff
- Investors/Shareholders
- Partners/Suppliers
- Regulators (if relevant)
- Media/Press (if relevant)
- Community (if relevant)

For each stakeholder, provide:
- A clear name
- Brief description
- Priority level (high/medium/low)

Format your response as JSON with this structure:
{
  "organizationInfo": {
    "company": "extracted company name",
    "industry": "extracted industry",
    "description": "original user input"
  },
  "stakeholders": [
    {
      "id": "unique_id",
      "name": "Stakeholder Name",
      "description": "Brief description",
      "priority": "high/medium/low"
    }
  ],
  "message": "A friendly message introducing the stakeholder suggestions"
}`;

      const response = await claudeService.sendMessage(prompt);
      
      // Try to parse as JSON, fallback to structured response
      try {
        const parsed = JSON.parse(response);
        res.json({
          success: true,
          type: 'stakeholder_suggestions',
          ...parsed
        });
      } catch (parseError) {
        // Fallback response if Claude doesn't return valid JSON
        res.json({
          success: true,
          type: 'text',
          message: response
        });
      }
    } else if (stage === 'topic_configuration') {
      // This stage is now handled client-side with clickable topics
      // Just return a simple acknowledgment
      res.json({
        success: true,
        type: 'text',
        message: 'Topic configuration is handled through the interactive interface.'
      });
    } else {
      // General conversation about stakeholders
      let contextPrompt = `You are an expert stakeholder relationship advisor. `;
      
      if (organizationInfo) {
        contextPrompt += `\nOrganization: ${organizationInfo.company || 'Unknown'} in ${organizationInfo.industry || 'Unknown industry'}.`;
      }
      
      if (selectedStakeholders && selectedStakeholders.length > 0) {
        contextPrompt += `\nSelected stakeholders: ${selectedStakeholders.map(s => s.name).join(', ')}.`;
      }
      
      if (conversationHistory && conversationHistory.length > 0) {
        contextPrompt += `\n\nRecent conversation:`;
        conversationHistory.forEach(msg => {
          contextPrompt += `\n${msg.role}: ${msg.content}`;
        });
      }
      
      contextPrompt += `\n\nUser: ${message}\n\nProvide helpful advice about stakeholder management, relationships, and intelligence gathering.`;
      
      const response = await claudeService.sendMessage(contextPrompt);
      
      res.json({
        success: true,
        type: 'text',
        message: response
      });
    }
  } catch (error) {
    console.error("Error in stakeholder discovery:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process stakeholder discovery request",
      error: error.message
    });
  }
});

module.exports = router;
