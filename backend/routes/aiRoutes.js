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

    console.log("Generate-with-context request:", { prompt: prompt?.substring(0, 100), projectId });

    // Check if Claude service is initialized
    if (!claudeService.client) {
      console.log("Claude service not initialized - using fallback content");
      
      // Generate fallback content based on prompt
      let fallbackContent = "";
      
      if (prompt.toLowerCase().includes("press release")) {
        fallbackContent = `FOR IMMEDIATE RELEASE

[Company Name] Announces Revolutionary Innovation in Technology Sector

[City, Date] - [Company Name], a leader in innovative technology solutions, today announced the launch of its groundbreaking new platform that promises to transform how businesses operate in the digital age.

This revolutionary solution addresses key challenges faced by modern enterprises, offering unprecedented efficiency gains and cost savings. Early adopters have reported up to 40% improvement in operational efficiency within the first month of implementation.

"We're incredibly excited to bring this innovation to market," said [Executive Name], CEO of [Company Name]. "Our platform represents a paradigm shift in how technology can empower businesses to achieve their goals while reducing complexity and costs."

Key features include:
• Advanced AI-powered automation capabilities
• Seamless integration with existing systems
• Real-time analytics and insights
• Enterprise-grade security and compliance
• Scalable architecture for businesses of all sizes

The platform is now available for enterprise customers, with plans to expand to small and medium businesses in Q2 2025.

About [Company Name]:
[Company Name] is a pioneering technology company dedicated to creating innovative solutions that drive business transformation. Founded in [Year], the company serves thousands of customers worldwide.

Contact:
[Contact Name]
[Email]
[Phone]`;
      } else if (prompt.toLowerCase().includes("social media") || prompt.toLowerCase().includes("social post")) {
        fallbackContent = `🚀 Exciting news! We're thrilled to announce our latest innovation that's set to revolutionize the industry! 

💡 Key highlights:
✅ Cutting-edge technology
✅ User-friendly design
✅ Proven results
✅ Available now

Join thousands of satisfied customers who are already experiencing the difference. Don't miss out on this game-changing opportunity!

Learn more: [link]

#Innovation #Technology #BusinessGrowth #DigitalTransformation #FutureOfWork`;
      } else if (prompt.toLowerCase().includes("q&a") || prompt.toLowerCase().includes("q and a")) {
        fallbackContent = `Q&A Document: Product Launch

Q: What is being announced today?
A: We're launching an innovative new platform designed to help businesses streamline their operations and achieve better results through advanced technology.

Q: Who is the target audience?
A: Our solution is designed for forward-thinking businesses of all sizes who want to leverage technology to gain a competitive advantage.

Q: What makes this different from existing solutions?
A: Our platform combines cutting-edge AI technology with intuitive design and seamless integration capabilities, offering a unique combination of power and ease of use.

Q: When will it be available?
A: The platform is available immediately for enterprise customers, with broader availability planned for Q2 2025.

Q: What are the key benefits?
A: Customers can expect improved efficiency, reduced costs, better insights, and enhanced scalability to support business growth.

Q: How can interested parties learn more?
A: Visit our website or contact our sales team for a personalized demonstration and consultation.`;
      } else if (prompt.toLowerCase().includes("crisis")) {
        fallbackContent = `Statement Regarding Recent Developments

We are aware of recent concerns raised regarding [situation]. We take these matters extremely seriously and are committed to addressing them with transparency and accountability.

Our immediate priorities are:
1. Ensuring the safety and well-being of all stakeholders
2. Conducting a thorough investigation of the circumstances
3. Implementing corrective measures to prevent recurrence
4. Maintaining open communication with all affected parties

We have already taken the following actions:
• Initiated a comprehensive internal review
• Engaged independent experts to assist in our investigation
• Established a dedicated response team
• Implemented additional safeguards

We understand the impact this situation has had and sincerely apologize for any concern or inconvenience caused. We are committed to learning from this experience and emerging stronger.

We will provide regular updates as more information becomes available. In the meantime, please direct any questions to our dedicated response team.`;
      } else if (prompt.toLowerCase().includes("thought leadership")) {
        fallbackContent = `The Future of Business: Embracing Digital Transformation

As we stand at the precipice of a new era in business innovation, leaders must recognize that digital transformation is no longer optional—it's imperative for survival and growth.

The convergence of artificial intelligence, cloud computing, and data analytics has created unprecedented opportunities for organizations willing to embrace change. However, success requires more than just technology adoption; it demands a fundamental shift in mindset and culture.

Key insights for modern leaders:

1. **Customer-Centricity is Paramount**: Today's consumers expect personalized, seamless experiences across all touchpoints. Organizations must leverage data and AI to anticipate needs and deliver value proactively.

2. **Agility Over Perfection**: The pace of change demands rapid iteration and continuous improvement. Leaders must foster cultures that embrace experimentation and learn from failure.

3. **Ecosystem Thinking**: No organization operates in isolation. Success comes from building strategic partnerships and participating in broader innovation ecosystems.

4. **Ethical Technology Use**: As technology becomes more powerful, responsible innovation becomes critical. Leaders must balance innovation with privacy, security, and societal impact.

5. **Human-Machine Collaboration**: The future belongs to organizations that effectively combine human creativity and judgment with machine efficiency and scale.

The path forward requires bold leadership, strategic vision, and unwavering commitment to continuous evolution. Organizations that successfully navigate this transformation will not just survive—they will define the future of their industries.`;
      } else if (prompt.toLowerCase().includes("corporate messaging")) {
        fallbackContent = `Our Vision for Tomorrow

At [Company Name], we believe in the power of innovation to create positive change. Our mission extends beyond business success to encompass our responsibility to customers, employees, communities, and the planet.

**Our Core Values:**
• **Innovation**: We constantly push boundaries to deliver breakthrough solutions
• **Integrity**: We operate with transparency and ethical excellence
• **Impact**: We measure success by the positive change we create
• **Inclusion**: We celebrate diversity and foster belonging
• **Sustainability**: We're committed to a better future for all

**Our Commitment:**
We're dedicated to empowering our customers with tools and technologies that drive meaningful progress. Through strategic partnerships, continuous innovation, and unwavering focus on customer success, we're building a future where technology serves humanity's highest aspirations.

**Moving Forward:**
As we evolve and grow, our commitment to these principles remains steadfast. We invite all stakeholders to join us in creating a more innovative, equitable, and sustainable future.

Together, we're not just adapting to change—we're driving it.`;
      } else {
        // Generic content
        fallbackContent = `Strategic Communication: Driving Business Success

In today's rapidly evolving business landscape, effective communication has become a critical differentiator for successful organizations. The ability to craft compelling narratives, engage stakeholders authentically, and respond dynamically to market changes determines whether companies thrive or merely survive.

Modern communication strategies must embrace multiple channels, diverse audiences, and real-time engagement. Organizations that master this complex orchestration position themselves as industry leaders, building trust, driving engagement, and creating lasting value.

Key elements of successful communication:
• Clear, consistent messaging across all platforms
• Authentic storytelling that resonates with audiences
• Data-driven insights to inform strategy
• Agile response capabilities for emerging opportunities
• Measurable outcomes tied to business objectives

The future belongs to organizations that view communication not as a support function, but as a strategic driver of business success. By investing in robust communication capabilities and embracing innovative approaches, companies can build stronger relationships, enhance reputation, and achieve sustainable growth.`;
      }
      
      res.json({
        success: true,
        content: fallbackContent,
        projectId: projectId,
        note: "Generated using fallback templates - Claude API not configured"
      });
      return;
    }

    // Get project context - handle both numeric IDs and demo-project
    let projectContext = "";
    if (projectId === 'demo-project') {
      // For demo project, use generic context
      projectContext = "Project: Demo Project, Industry: Technology. ";
    } else if (projectId && !isNaN(projectId)) {
      // Only query database if projectId is a valid number
      const projectResult = await pool.query(
        "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
        [parseInt(projectId), userId]
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
      message: "Failed to generate content: " + error.message,
    });
  }
});

// Chat endpoint for Railway UI AI Assistant
router.post("/chat", async (req, res) => {
  try {
    const { message, mode, context, sessionId } = req.body;
    const userId = req.user.id;

    console.log("AI chat request:", { mode, sessionId, messageLength: message?.length });

    // Check for content generation or edit requests
    const isGeneratingContent = context?.userRequestedGeneration;
    const isEditingContent = context?.userRequestedEdit;
    
    // Build conversation history context
    let conversationContext = "";
    if (context?.previousMessages && Array.isArray(context.previousMessages)) {
      conversationContext = "Previous conversation:\n";
      context.previousMessages.forEach(msg => {
        conversationContext += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    // Check if user is explicitly requesting content generation
    const lowerMessage = message.toLowerCase();
    const isDirectGenerationRequest = 
      lowerMessage.includes('generate') || 
      lowerMessage.includes('create') || 
      lowerMessage.includes('write') ||
      lowerMessage.includes('draft') ||
      lowerMessage.includes('make me') ||
      lowerMessage.includes('i need a') ||
      lowerMessage.includes('i want a') ||
      context?.userRequestedGeneration;

    // Determine system prompt based on mode
    let systemPrompt = "You are Claude, an AI assistant for the SignalDesk PR platform. ";
    if (mode === 'content' && context?.folder === 'content-generator') {
      if (isDirectGenerationRequest && context?.contentContext) {
        // User has provided context and wants content generated
        systemPrompt += `Generate the requested content based on the context provided. Be comprehensive and professional.`;
      } else if (isDirectGenerationRequest) {
        // User wants content - generate it directly if we can detect the type
        systemPrompt += "The user is requesting content generation. Generate the requested content immediately. If the content type is unclear, generate a press release by default. Format the content professionally with proper structure.";
      } else {
        // General conversation mode
        systemPrompt += "You're helping with content creation. Ask one question at a time, be conversational.";  
      }
    } else if (mode === 'campaign') {
      systemPrompt += "You're a strategic campaign advisor.";
    } else if (mode === 'media') {
      systemPrompt += "You're a media relations expert.";
    }

    // Build full prompt
    const fullPrompt = `${systemPrompt}\n\n${conversationContext}User: ${message}\n\nAssistant:`;

    // Send to Claude
    const response = await claudeService.sendMessage(fullPrompt);

    // Check if this should be marked as generated content
    const detectGeneratedContent = (text) => {
      if (!text || text.length < 150) return false;
      const indicators = [
        'FOR IMMEDIATE RELEASE', 
        'Subject:', 
        'Dear ', 
        '###', 
        'Q:', 
        'A:',
        'Headline:',
        'Title:',
        'We are',
        'I am writing',
        '[Company',
        'FOR IMMEDIATE',
        'PRESS RELEASE'
      ];
      // Also check for structured content patterns
      const hasStructure = text.includes('\n\n') && text.length > 300;
      return indicators.some(ind => text.includes(ind)) || hasStructure;
    };

    // Mark as generated content if it's a direct generation request and looks like content
    const isGeneratedContent = (isDirectGenerationRequest || isGeneratingContent || isEditingContent) && detectGeneratedContent(response);

    res.json({
      success: true,
      response: response,
      isGeneratedContent: isGeneratedContent,
      mode: mode,
      sessionId: sessionId
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message
    });
  }
});

// Unified chat endpoint for AI Assistant
router.post("/unified-chat", async (req, res) => {
  try {
    const { message, mode, context } = req.body;
    const userId = req.user.id;

    console.log("Unified chat request:", { mode, context, messageLength: message?.length });

    // Build context-aware prompt based on mode
    let systemPrompt = "";
    
    if (mode === 'content' && context?.folder === 'content-generator') {
      systemPrompt = `You are Claude, a helpful writing assistant for PR content.

CRITICAL CONVERSATION FLOW:
1. When user first says "I need a press release" (or any content type):
   - Give 2-3 helpful tips for writing that type of content
   - Then ask ONE specific question to start gathering info
   - Never ask multiple questions at once

2. For follow-ups:
   - Ask only ONE question at a time  
   - Keep it conversational and natural
   - No bullet points, no numbered lists, no overwhelming options
   - Wait for their answer before asking the next question

3. Generate content when you have enough information

Example response to "I need a press release":
"Great! Here are the key elements of an effective press release: Start with a compelling headline, lead with your most newsworthy angle, and include a strong quote from leadership. 

What's the main announcement you're making?"

Be conversational like the real Claude - one question at a time, no lists!`;
    } else if (mode === 'campaign') {
      systemPrompt = "You are a strategic campaign advisor helping plan and analyze PR campaigns.";
    } else if (mode === 'media') {
      systemPrompt = "You are a media relations expert helping identify journalists and media opportunities.";
    } else if (mode === 'crisis') {
      systemPrompt = "You are a crisis management advisor helping navigate challenging situations.";
    } else {
      systemPrompt = "You are an AI assistant for the SignalDesk PR platform.";
    }

    // Include previous messages for context if available
    let fullPrompt = systemPrompt + "\n\n";
    
    if (context?.previousMessages && context.previousMessages.length > 0) {
      fullPrompt += "Previous conversation:\n";
      context.previousMessages.forEach(msg => {
        fullPrompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      fullPrompt += "\n";
    }
    
    fullPrompt += `User: ${message}\n\nAssistant:`;

    // Send to Claude with custom system prompt
    const response = await claudeService.sendMessage(fullPrompt, [], {
      systemPrompt: systemPrompt
    });

    // No suggestions - let Claude handle everything naturally
    let suggestions = [];

    res.json({
      success: true,
      response: response,
      suggestions: suggestions,
      mode: mode
    });
  } catch (error) {
    console.error("Error in unified chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message
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
