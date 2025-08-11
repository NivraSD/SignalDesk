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
// Store conversation sessions in memory (in production, use Redis or database)
const conversationSessions = new Map();

router.post("/chat", async (req, res) => {
  try {
    const { message, mode, context, sessionId } = req.body;
    const userId = req.user.id;
    
    // Get or create session
    const sessionKey = `${userId}-${sessionId || 'default'}`;
    if (!conversationSessions.has(sessionKey)) {
      conversationSessions.set(sessionKey, {
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }
    
    const session = conversationSessions.get(sessionKey);
    session.lastActivity = Date.now();
    
    // Add current message to session history
    session.messages.push({ role: 'user', content: message });

    console.log("[AI CHAT] Request received:", { 
      mode, 
      sessionId, 
      message: message,
      folder: context?.folder,
      hasCurrentContent: !!context?.currentContent,
      userRequestedGeneration: context?.userRequestedGeneration,
      userRequestedEdit: context?.userRequestedEdit,
      contentTypeId: context?.contentTypeId,
      contentTypeName: context?.contentTypeName
    });

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
      lowerMessage.includes('announce') ||
      lowerMessage.includes('post') ||
      lowerMessage.includes('tweet') ||
      lowerMessage.includes('share') ||
      lowerMessage.includes('publish') ||
      context?.userRequestedGeneration;
    
    // Check if this is just a content type selection (start conversation, don't generate yet)
    const isContentTypeSelection = lowerMessage.startsWith('i want to create a') && !lowerMessage.includes('about') && !lowerMessage.includes('for');

    // Determine system prompt based on mode
    let systemPrompt = "";
    if (mode === 'content' && context?.folder === 'content-generator') {
      if (isContentTypeSelection) {
        // User just selected a content type - start conversational flow
        const contentType = context?.contentTypeName || 'content';
        systemPrompt = `You are Claude, a helpful AI assistant for content creation. The user wants to create ${contentType}. 
        
Start a friendly conversation to gather the information needed. Ask one question at a time to understand:
- What they want to announce/communicate
- Key details about their company/product
- Target audience
- Any specific requirements

Be conversational and helpful. Once you have enough information, you can generate the actual content.`;
        
      } else if (isDirectGenerationRequest && !isEditingContent) {
        // User is explicitly requesting content generation
        // Use explicit content type if provided, otherwise detect from message
        const contentTypeId = context?.contentTypeId;
        const contentTypeName = context?.contentTypeName;
        const msgLower = message.toLowerCase();
        
        console.log("[CONTENT GENERATION] Content type info:", { contentTypeId, contentTypeName, message });
        
        let contentTypeInstruction = "";
        let detectedType = contentTypeId || "unknown";
        
        // Use explicit content type ID if provided, otherwise fall back to message detection
        if (contentTypeId === 'press-release' || contentTypeId === 'Press Release' || (!contentTypeId && msgLower.includes('press release'))) {
          detectedType = "press-release";
          contentTypeInstruction = "Create a complete press release with FOR IMMEDIATE RELEASE header, headline, dateline, body paragraphs, boilerplate, and contact information.";
        } else if (contentTypeId === 'social-post' || contentTypeId === 'Social Media Post' || (!contentTypeId && msgLower.includes('social media post'))) {
          detectedType = "social-media";
          contentTypeInstruction = "Create social media posts suitable for multiple platforms (Twitter/X, LinkedIn, Facebook). Include appropriate hashtags, emojis, and keep within platform character limits. Provide versions for different platforms.";
        } else if (contentTypeId === 'thought-leadership' || contentTypeId === 'Thought Leadership' || (!contentTypeId && msgLower.includes('thought leadership'))) {
          detectedType = "thought-leadership";
          contentTypeInstruction = "Create a thought leadership article with strategic insights, industry analysis, data-driven arguments, and forward-looking perspectives. Include a compelling headline and executive summary.";
        } else if (contentTypeId === 'media-pitch' || contentTypeId === 'Media Pitch' || (!contentTypeId && msgLower.includes('media pitch'))) {
          contentTypeInstruction = "Create a media pitch email targeted at journalists. Include subject line, personalized greeting, news hook, story angle, supporting points, and contact information.";
        } else if (contentTypeId === 'qa-doc' || contentTypeId === 'Q&A Document' || (!contentTypeId && (msgLower.includes('q&a document') || msgLower.includes('q and a document')))) {
          contentTypeInstruction = "Create a Q&A document with 5-7 relevant questions and comprehensive answers. Format with clear Q: and A: labels.";
        } else if (contentTypeId === 'crisis-response' || contentTypeId === 'Crisis Response' || (!contentTypeId && msgLower.includes('crisis response'))) {
          contentTypeInstruction = "Create a crisis response statement that acknowledges the situation, expresses appropriate concern, outlines actions being taken, and provides next steps. Keep tone professional and empathetic.";
        } else if (contentTypeId === 'corporate-messaging' || contentTypeId === 'Corporate Messaging' || (!contentTypeId && msgLower.includes('corporate messaging'))) {
          contentTypeInstruction = "Create corporate messaging that aligns with company values, speaks to multiple stakeholders, and reinforces key brand messages. Include main message and supporting points.";
        } else if (contentTypeId === 'Email' || msgLower.includes('email') || msgLower.includes('newsletter')) {
          contentTypeInstruction = "Create a complete email with subject line, greeting, body content, call-to-action, and signature.";
        } else if (contentTypeId === 'blog' || contentTypeId === 'Blog Post' || msgLower.includes('blog') || msgLower.includes('article')) {
          contentTypeInstruction = "Create a complete blog post with title, introduction, main sections with headers, and conclusion.";
        } else if (contentTypeId) {
          // Generic content type handling - use the contentTypeId as a guide
          console.log("[CONTENT GENERATION] Using generic handler for type:", contentTypeId);
          contentTypeInstruction = `Create professional ${contentTypeId} content based on the user's request. Make it complete, well-structured, and ready to use.`;
        } else if (msgLower.includes('announce') || msgLower.includes('announcement')) {
          // Default to social media post for announcements without specific type
          detectedType = "social-media";
          contentTypeInstruction = "Create a professional social media announcement post for X/Twitter. Keep it concise, engaging, and include relevant hashtags.";
        } else {
          // If no content type specified but we're in content generator mode, default to social post
          if (mode === 'content' && context?.folder === 'content-generator') {
            detectedType = "social-media";
            contentTypeInstruction = "Create professional social media content based on the user's request. Make it engaging and suitable for LinkedIn or Twitter/X.";
          } else {
            console.log("[CONTENT GENERATION] No content type detected - asking user to select");
            systemPrompt = "I'd be happy to generate content for you! Please select a content type from the options in the Content Generator panel (Press Release, Social Media Post, Thought Leadership, etc.) and I'll create the appropriate content for you.";
            // Skip the generation instruction
            contentTypeInstruction = "";
          }
        }
        
        console.log("[CONTENT GENERATION] Type detected:", detectedType);
        console.log("[CONTENT GENERATION] Instruction:", contentTypeInstruction.substring(0, 100));
        
        if (contentTypeInstruction) {
          systemPrompt = `IMPORTANT: Generate actual PR/marketing content NOW. Do not ask questions or have a conversation.

${contentTypeInstruction}

The user said: "${message}"

Create the ACTUAL CONTENT based on the user's request, not a description of what you would create.`;
        }
        // systemPrompt is already set if no content type (asks user to select)
      } else if (isEditingContent && context?.currentContent) {
        // User wants to EDIT existing content - we have the content in context
        systemPrompt = `You need to edit the following content based on the user's request. Here is the current content:

${context.currentContent}

Make the requested edits and return the COMPLETE edited version. Do not explain what you're doing, just provide the edited content.`;
      } else if (isDirectGenerationRequest && context?.contentContext) {
        // User has provided context and wants content generated
        systemPrompt = `Generate the requested PR/marketing content immediately based on the context provided. Create actual, complete content - not a conversation about it. Be comprehensive and professional.`;
      } else {
        // General conversation mode
        systemPrompt = "You are Claude, an AI assistant for the SignalDesk PR platform. You're helping with content creation. Ask one question at a time, be conversational.";  
      }
    } else if (mode === 'campaign') {
      systemPrompt = "You are Claude, a strategic campaign advisor for the SignalDesk PR platform.";
    } else if (mode === 'media') {
      systemPrompt = "You are Claude, a media relations expert for the SignalDesk PR platform.";
    } else {
      // Default mode - check if generation is requested
      if (isDirectGenerationRequest) {
        systemPrompt = `Generate the requested PR/marketing content immediately. Create a complete, professional piece of content. Default to a press release format with FOR IMMEDIATE RELEASE header if the type is unclear.`;
      } else {
        systemPrompt = "You are Claude, an AI assistant for the SignalDesk PR platform.";
      }
    }

    // Build full prompt
    let fullPrompt;
    if (isDirectGenerationRequest) {
      // For direct generation requests, put the instruction at the end for emphasis
      fullPrompt = `${conversationContext}User: ${message}\n\n${systemPrompt}\n\nGenerate the content now:`;
    } else {
      fullPrompt = `${systemPrompt}\n\n${conversationContext}User: ${message}\n\nAssistant:`;
    }

    // Include session history in the prompt for context
    let messagesForClaude = [];
    let response;
    
    if (session && session.messages.length > 1) {
      // We have conversation history - use it
      // Include last 10 messages for context (excluding current message which is already added)
      messagesForClaude = session.messages.slice(-11, -1);
      // Add current message to the array
      messagesForClaude.push({ role: 'user', content: message });
      
      // Pass empty prompt since we're using messagesForClaude
      // The claudeService will use the messages array directly when conversationHistory.length > 0
      response = await claudeService.sendMessage('', messagesForClaude);
    } else {
      // First message in session - use the fullPrompt  
      // Pass empty array so claudeService uses the prompt
      response = await claudeService.sendMessage(fullPrompt, []);
    }
    
    // Add AI response to session
    if (session) {
      session.messages.push({ role: 'assistant', content: response });
      
      // Clean up old sessions (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [key, sess] of conversationSessions.entries()) {
        if (sess.lastActivity < oneHourAgo) {
          conversationSessions.delete(key);
        }
      }
    }

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

    // Mark as generated content if it's a direct generation request, edit request, or looks like content
    // Don't mark conversational responses as generated content
    const isGeneratedContent = (isDirectGenerationRequest || isGeneratingContent || isEditingContent || (context?.currentContent && detectGeneratedContent(response))) && !isContentTypeSelection;

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
