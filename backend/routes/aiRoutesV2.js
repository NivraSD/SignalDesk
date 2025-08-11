const express = require("express");
const router = express.Router();
const claudeService = require("../config/claude");
const authMiddleware = require("../src/middleware/authMiddleware");

router.use(authMiddleware);

// Store conversation state per user/session
const conversationStates = new Map();

// World-class PR Consultant AI endpoint
router.post("/unified-chat", async (req, res) => {
  try {
    const { message, mode, context } = req.body;
    const userId = req.user.id;
    const sessionId = context?.sessionId || 'default';
    const sessionKey = `${userId}-${sessionId}`;

    // Initialize or get conversation state
    if (!conversationStates.has(sessionKey)) {
      conversationStates.set(sessionKey, {
        phase: 'discovery',
        contentType: null,
        businessContext: {},
        questionsAsked: 0,
        conversationHistory: [],
        readyToGenerate: false,
        lastActivity: Date.now()
      });
    }

    const state = conversationStates.get(sessionKey);
    state.lastActivity = Date.now();

    // Store content type if provided
    if (context?.contentTypeId) {
      state.contentType = {
        id: context.contentTypeId,
        name: context.contentTypeName
      };
    }

    // Add user message to history
    state.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    console.log('[PR CONSULTANT AI] State:', {
      sessionKey,
      phase: state.phase,
      contentType: state.contentType,
      questionsAsked: state.questionsAsked,
      historyLength: state.conversationHistory.length,
      message: message.substring(0, 50)
    });

    // Determine response based on conversation phase
    let response = '';
    let isGeneratedContent = false;

    // Check if user is explicitly requesting generation
    const lowerMessage = message.toLowerCase();
    const isGenerationRequest = 
      state.questionsAsked >= 3 && (
        lowerMessage === 'yes' ||
        lowerMessage === 'yes please' ||
        lowerMessage === 'yes, generate' ||
        lowerMessage === 'generate' ||
        lowerMessage === 'create it' ||
        lowerMessage === 'go ahead' ||
        lowerMessage === 'please generate' ||
        (lowerMessage.includes('yes') && state.readyToGenerate)
      );

    // Check if this is initial content type selection
    const isInitialSelection = 
      state.questionsAsked === 0 && 
      message.toLowerCase().includes('i want to create');

    if (isInitialSelection && state.contentType) {
      // Initial greeting and first question
      response = await getInitialResponse(state.contentType.name);
      state.phase = 'discovery';
      state.questionsAsked = 1;

    } else if (isGenerationRequest && state.contentType) {
      // Generate actual content
      response = await generateContent(state);
      isGeneratedContent = true; // CRITICAL: This makes content appear in workspace
      
      // Reset state after generation
      state.questionsAsked = 0;
      state.readyToGenerate = false;
      state.phase = 'discovery';

    } else if (state.phase === 'discovery') {
      // Continue discovery conversation
      response = await getDiscoveryQuestion(state, message);
      state.questionsAsked++;

      // After enough questions, offer to generate
      if (state.questionsAsked >= 4) {
        response += `\n\nI think I have a good understanding of your needs. Would you like me to generate a ${state.contentType?.name || 'piece of content'} based on our conversation?`;
        state.readyToGenerate = true;
      }

    } else {
      // Fallback conversational response
      response = await getContinuationResponse(state, message);
      state.questionsAsked++;
    }

    // Add AI response to history
    state.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      isGeneratedContent
    });

    // Clean up old sessions (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, session] of conversationStates.entries()) {
      if (session.lastActivity < oneHourAgo) {
        conversationStates.delete(key);
      }
    }

    console.log('[PR CONSULTANT AI] Response:', {
      isGeneratedContent,
      responseLength: response.length,
      phase: state.phase,
      readyToGenerate: state.readyToGenerate
    });

    res.json({
      success: true,
      response: response,
      isGeneratedContent: isGeneratedContent, // This flag routes content to workspace
      mode: mode,
      sessionId: sessionId,
      contentType: state.contentType
    });

  } catch (error) {
    console.error('Error in PR Consultant AI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

// Helper functions for PR Consultant personality
async function getInitialResponse(contentType) {
  const responses = {
    'Press Release': `Excellent choice! A well-crafted press release can be incredibly powerful for getting your story out there. 

The key to a great press release is starting with truly newsworthy information, using a compelling headline, and including strong quotes that add human perspective.

To help me create something impactful for you, tell me about your business - what do you do and who do you serve?`,
    
    'Thought Leadership': `Great decision! Thought leadership content positions you as an expert and builds trust with your audience.

The best thought leadership provides unique insights, challenges conventional thinking, and offers practical value that readers can apply.

To craft something meaningful, I'd love to understand your expertise. What's your area of focus, and what unique perspective do you bring to your industry?`,
    
    'Social Media Post': `Perfect! Social media is where authentic conversations happen and where you can really connect with your audience.

Effective social posts are concise, engaging, and encourage interaction - whether that's likes, shares, or meaningful comments.

Let me understand your social media goals. What message are you trying to get across, and which platforms are most important to you?`,
    
    'Media Pitch': `Smart choice! A compelling media pitch can open doors to valuable coverage and help you reach new audiences.

The secret to a successful pitch is making it immediately relevant to the journalist's beat and their readers' interests.

To create a pitch that resonates, tell me about your story. What's happening with your business that would interest media outlets?`,
    
    'Q&A Document': `Great thinking! Q&A documents are excellent for addressing common questions and controlling your narrative.

The best Q&As anticipate real concerns, provide clear answers, and reinforce your key messages throughout.

To make this valuable, what topic or situation are we addressing? What questions are you hearing most often?`,
    
    'Crisis Response': `I understand this might be a challenging time. A well-crafted crisis response can protect your reputation and rebuild trust.

Effective crisis communication acknowledges the situation, shows empathy, outlines concrete actions, and provides a path forward.

Help me understand the situation. What's happened, and who are the key stakeholders we need to address?`,
    
    'Corporate Messaging': `Excellent! Clear corporate messaging ensures everyone in your organization tells the same compelling story.

Strong corporate messaging aligns with your values, resonates with multiple stakeholders, and differentiates you from competitors.

Let's start with the foundation. What's your company's mission, and what makes you different from others in your space?`
  };

  return responses[contentType] || responses['Press Release'];
}

async function getDiscoveryQuestion(state, userResponse) {
  // Store user's response in context
  if (state.questionsAsked === 1) {
    state.businessContext.description = userResponse;
  } else if (state.questionsAsked === 2) {
    state.businessContext.currentSituation = userResponse;
  } else if (state.questionsAsked === 3) {
    state.businessContext.audience = userResponse;
  }

  // Return next question based on what we know
  const questions = [
    '', // Skip index 0
    '', // Question 1 is asked in initial response
    `That's really helpful context. ${getAcknowledgment(userResponse)}

What's happening in your business right now that brought you to think about ${state.contentType?.name || 'this content'}? Any specific announcement, milestone, or message you need to communicate?`,
    
    `I can see why that's important. ${getInsight(state.businessContext)}

Who are the key audiences you need to reach with this? Think about customers, partners, investors, media - anyone who matters to your success.`,
    
    `Perfect, that gives me a clear picture of your stakeholders. ${getStrategicAdvice(state.businessContext)}

What would success look like for this ${state.contentType?.name || 'content'}? How will you know if it's working?`
  ];

  return questions[state.questionsAsked + 1] || getContinuationResponse(state, userResponse);
}

async function getContinuationResponse(state, userResponse) {
  // Continue natural conversation
  return `Thank you for sharing that. ${getAcknowledgment(userResponse)}

Based on everything you've told me, I can see some interesting opportunities here. What specific angle or message do you think would resonate most with your audience?`;
}

async function generateContent(state) {
  const contentType = state.contentType?.name || 'content';
  const context = state.businessContext;
  
  // Generate actual content based on type
  let content = '';
  
  if (contentType === 'Press Release') {
    content = generatePressRelease(context);
  } else if (contentType === 'Thought Leadership') {
    content = generateThoughtLeadership(context);
  } else if (contentType === 'Social Media Post') {
    content = generateSocialPost(context);
  } else {
    content = generateGenericContent(context, contentType);
  }
  
  return content;
}

// Content generation functions
function generatePressRelease(context) {
  return `FOR IMMEDIATE RELEASE

${context.description || '[Company Name]'} Announces ${context.currentSituation || 'Major Milestone'}

[City, Date] — ${context.description || '[Company description]'} today announced ${context.currentSituation || '[announcement details]'}.

${context.audience ? `This development is particularly significant for ${context.audience}, who will benefit from enhanced capabilities and improved outcomes.` : '[Impact statement]'}

"${getExecutiveQuote(context)}," said [Executive Name], [Title] at [Company Name]. "This represents a pivotal moment in our journey to ${context.goals || 'transform our industry'}."

Key highlights include:
• [Specific achievement or feature]
• [Impact metric or benefit]
• [Future opportunity or growth area]

${context.additionalContext || 'The company continues to focus on innovation and customer success as core drivers of growth.'}

About [Company Name]
${context.description || '[Company description]'}

Contact:
[Name]
[Email]
[Phone]

###`;
}

function generateThoughtLeadership(context) {
  return `${context.currentSituation ? `The Future of ${extractIndustry(context)}` : 'Transforming Industries Through Innovation'}

${context.description ? `As ${context.description}, we're witnessing a fundamental shift in how businesses operate and create value.` : 'The business landscape is evolving at an unprecedented pace.'}

${context.currentSituation || 'Recent developments'} highlight a critical truth: success in today's market requires more than incremental improvement—it demands reimagining what's possible.

**The Current Challenge**

${context.audience ? `For ${context.audience}, the stakes have never been higher.` : 'Organizations face mounting pressure to adapt.'} Traditional approaches are no longer sufficient to meet evolving expectations and competitive pressures.

**A New Paradigm**

${getStrategicInsight(context)}

**Practical Applications**

Leaders who embrace this shift are already seeing results:
• Enhanced operational efficiency through strategic innovation
• Deeper stakeholder engagement and trust
• Sustainable competitive advantages in crowded markets

**Looking Ahead**

${context.goals ? `The path to ${context.goals} requires bold action and clear vision.` : 'The future belongs to those who act decisively today.'} Organizations that recognize and respond to these trends will not just survive—they'll define the next era of their industries.

The question isn't whether to transform, but how quickly you can begin.`;
}

function generateSocialPost(context) {
  return `🚀 ${context.currentSituation || 'Big news!'} 

${context.description ? `At ${extractCompanyName(context)}, we're` : "We're"} ${context.currentSituation || 'excited to share this milestone with our community'}.

${getKeyMessage(context)}

${context.audience ? `This means ${getAudienceBenefit(context)} for ${context.audience}.` : ''}

${context.goals ? `Our goal: ${context.goals}` : 'This is just the beginning.'}

What questions do you have? Let's discuss in the comments! 👇

#Innovation #${extractIndustry(context) || 'Business'} #${context.currentSituation ? 'Announcement' : 'News'} #GrowthMindset`;
}

function generateGenericContent(context, contentType) {
  return `[${contentType} Content]

${context.description || '[Your organization]'} ${context.currentSituation || 'is making important strides'}.

${context.audience ? `This matters to ${context.audience} because it represents a significant advancement in how we deliver value.` : ''}

Key Points:
• ${context.currentSituation || 'Recent developments show strong momentum'}
• ${context.goals || 'Clear vision for future growth'}
• ${context.audience ? `Direct benefits for ${context.audience}` : 'Stakeholder value creation'}

${getCallToAction(context)}

[This content has been generated based on our conversation and appears in your Content Creator workspace for editing and refinement.]`;
}

// Helper functions for natural responses
function getAcknowledgment(response) {
  const acknowledgments = [
    "That's fascinating",
    "I can see why that's important",
    "That makes perfect sense",
    "That's a compelling angle",
    "I appreciate you sharing that"
  ];
  return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
}

function getInsight(context) {
  if (context.description && context.description.includes('tech')) {
    return "Technology companies like yours often have amazing stories that just need the right framing";
  } else if (context.description && context.description.includes('health')) {
    return "Healthcare organizations have such impactful stories - it's about making the complex accessible";
  } else {
    return "Every business has unique value - it's about finding the angle that resonates";
  }
}

function getStrategicAdvice(context) {
  return "Based on what you've shared, I'm already seeing several compelling angles we could take";
}

function getExecutiveQuote(context) {
  return context.currentSituation ? 
    `This ${context.currentSituation} represents everything we've been working toward` :
    "This milestone reflects our commitment to innovation and excellence";
}

function getStrategicInsight(context) {
  return context.description ?
    `The key insight from our experience: ${context.currentSituation || 'transformation'} isn't just about technology or process—it's about reimagining value creation from the ground up.` :
    "The organizations succeeding today share one trait: they've moved beyond traditional thinking to embrace new possibilities.";
}

function extractCompanyName(context) {
  // Simple extraction - would be more sophisticated in production
  return context.description?.split(' ')[0] || '[Company]';
}

function extractIndustry(context) {
  if (context.description?.includes('tech')) return 'Technology';
  if (context.description?.includes('health')) return 'Healthcare';
  if (context.description?.includes('finance')) return 'Finance';
  if (context.description?.includes('retail')) return 'Retail';
  return 'Business';
}

function getKeyMessage(context) {
  return context.currentSituation || "We're pushing boundaries and creating new possibilities";
}

function getAudienceBenefit(context) {
  if (context.audience?.includes('customer')) return 'better experiences and outcomes';
  if (context.audience?.includes('investor')) return 'sustainable growth and returns';
  if (context.audience?.includes('partner')) return 'new opportunities for collaboration';
  return 'meaningful value';
}

function getCallToAction(context) {
  if (context.goals) {
    return `Next Steps: ${context.goals}`;
  }
  return "Learn more about how we're making a difference.";
}

module.exports = router;