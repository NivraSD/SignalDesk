// Adaptive AI Service - Natural Language Understanding and Feature Control
// This service provides intelligent assistance with automatic feature activation

class AdaptiveAIService {
  constructor() {
    this.conversationState = {
      mode: 'general',
      activeFeature: null,
      contentContext: {
        type: null,
        topic: null,
        objective: null,
        audience: null,
        competitive: null,
        credibility: null,
        tone: null,
        keyRequirements: null,
        keyPoints: [],
        readyToGenerate: false
      }
    };

    // Content type patterns for detection
    this.contentTypePatterns = {
      'press-release': ['press release', 'announcement', 'news release', 'pr statement', 'media release', 'media announcement', 'company announcement'],
      'thought-leadership': ['thought leadership', 'opinion piece', 'editorial', 'industry insight', 'white paper', 'analysis', 'expert perspective', 'industry perspective'],
      'social-post': ['social media', 'twitter', 'linkedin', 'facebook', 'social post', 'tweet', 'post', 'instagram', 'social content', 'social media post'],
      'media-pitch': ['media pitch', 'pitch', 'journalist', 'reporter', 'story pitch', 'media outreach', 'press pitch'],
      'qa-doc': ['q&a', 'faq', 'questions and answers', 'q and a', 'interview', 'frequently asked questions', 'qa document'],
      'crisis-response': ['crisis', 'crisis response', 'crisis communication', 'emergency', 'urgent', 'damage control', 'reputation management'],
      'corporate-messaging': ['corporate messaging', 'internal communication', 'company messaging', 'corporate communication', 'internal memo', 'company memo', 'employee communication']
    };

    // Feature activation patterns
    this.featurePatterns = {
      'content-generator': [
        ...Object.values(this.contentTypePatterns).flat(),
        'write', 'create', 'draft', 'compose', 'content', 'copy'
      ],
      'media-intelligence': [
        'journalist', 'reporter', 'media contact', 'press list', 
        'media outreach', 'find journalist', 'media database'
      ],
      'campaign-intelligence': [
        'campaign', 'strategy', 'campaign plan', 'pr strategy', 
        'strategic planning', 'campaign intelligence'
      ],
      'crisis-command': [
        'crisis', 'emergency', 'urgent situation', 'damage control', 
        'crisis management', 'reputation issue'
      ]
    };

    // Content creation tips - World-class PR executive approach
    this.contentTips = {
      'press-release': {
        title: "Press Release Best Practices",
        tips: [
          "📰 Craft a headline that passes the 'so what?' test - make it immediately newsworthy",
          "🎯 Lead with the strongest news angle in the first paragraph",
          "💬 Include executive quotes that add strategic insight, not just enthusiasm",
          "📊 Support claims with credible data and third-party validation",
          "🔗 Position your story within larger industry trends",
          "📍 Consider multiple distribution strategies and target outlets"
        ]
      },
      'thought-leadership': {
        title: "Thought Leadership Excellence",
        tips: [
          "🧠 Take a contrarian or unique angle that challenges conventional wisdom",
          "📈 Ground insights in real data, case studies, and market trends",
          "🎯 Address the strategic challenges your audience faces daily",
          "💡 Provide frameworks or models that readers can apply",
          "🔮 Include future predictions based on your expertise",
          "📢 Establish your credibility without being self-promotional"
        ]
      },
      'corporate-messaging': {
        title: "Corporate Messaging Excellence",
        tips: [
          "🎯 Align messaging with company values and strategic objectives",
          "👥 Consider all stakeholder groups - employees, customers, investors",
          "📢 Ensure consistency across all communication channels",
          "💼 Balance transparency with appropriate confidentiality",
          "🔗 Connect individual messages to broader company narrative",
          "📊 Include clear next steps or actionable information"
        ]
      },
      'social-post': {
        title: "Social Media Strategy",
        tips: [
          "🎯 Lead with value - what's in it for your audience?",
          "📱 Optimize for each platform's unique format and culture",
          "#️⃣ Research and use hashtags that your audience actually follows",
          "👥 Engage authentically - social media is about relationships",
          "🔗 Include clear next steps that align with your goals",
          "📸 Use visuals that stop the scroll and reinforce your message"
        ]
      },
      'email': {
        title: "Email Campaign Excellence",
        tips: [
          "📧 Subject lines should create curiosity while delivering on the promise",
          "👋 Personalization goes beyond first names - segment by behavior",
          "🎯 Focus on one primary goal per email to avoid decision fatigue",
          "💡 Use storytelling to make your message memorable and relatable",
          "🔗 Make your CTA impossible to miss and action-oriented",
          "📱 Design mobile-first since most emails are read on phones"
        ]
      },
      'qa-doc': {
        title: "Q&A Document Strategy",
        tips: [
          "❓ Anticipate the questions your audience is actually asking",
          "🎯 Structure answers to address underlying concerns, not just surface questions",
          "💬 Use empathetic language that acknowledges the questioner's perspective",
          "📊 Include specific examples and data when possible",
          "🔍 Organize by customer journey stage or topic priority",
          "📝 Update regularly based on real customer feedback and questions"
        ]
      },
      'crisis-response': {
        title: "Crisis Communication Principles",
        tips: [
          "⚡ Respond quickly but thoughtfully - speed matters in crisis",
          "💯 Take responsibility where appropriate, avoid defensiveness",
          "🎯 Address stakeholder concerns directly and specifically",
          "📢 Communicate through multiple channels to ensure message reach",
          "🔄 Provide regular updates, even if just to say you're working on it",
          "🛡️ Focus on solutions and preventive measures, not just apologies"
        ]
      },
      'media-pitch': {
        title: "Media Pitch Mastery",
        tips: [
          "📰 Research the journalist's beat and recent stories thoroughly",
          "🎯 Lead with why this matters to THEIR audience specifically",
          "⏰ Tie your story to current events or trending topics when relevant",
          "📊 Offer exclusive data, access, or expert perspectives",
          "🔗 Make it easy - provide quotes, images, and supporting materials",
          "📱 Keep initial pitch concise but follow up with comprehensive resources"
        ]
      }
    };
  }

  // Detect content type from message
  detectContentType(message) {
    const lower = message.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    // Score each content type based on pattern matches
    for (const [type, patterns] of Object.entries(this.contentTypePatterns)) {
      let score = 0;
      let matches = 0;
      
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          matches++;
          // Give higher score for longer, more specific patterns
          score += pattern.length;
        }
      }
      
      // Normalize score by number of patterns and add bonus for multiple matches
      if (matches > 0) {
        const normalizedScore = (score / patterns.length) + (matches * 10);
        if (normalizedScore > highestScore) {
          highestScore = normalizedScore;
          bestMatch = type;
        }
      }
    }
    
    return bestMatch;
  }

  // Detect which feature should be activated
  detectFeature(message) {
    const lower = message.toLowerCase();
    let bestMatch = null;
    let highestCount = 0;
    
    for (const [feature, patterns] of Object.entries(this.featurePatterns)) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          matchCount++;
        }
      }
      
      if (matchCount > highestCount) {
        highestCount = matchCount;
        bestMatch = feature;
      }
    }
    
    return highestCount > 0 ? bestMatch : null;
  }

  // Process user message and determine response - simplified for natural conversation
  processMessage(message, hasGeneratedContent = false) {
    // If content is already generated, let Claude handle editing naturally
    if (hasGeneratedContent && this.conversationState.activeFeature === 'content-generator') {
      return {
        action: 'chat',
        response: {
          type: 'content_editing',
          message: null // Let Claude handle naturally with content context
        }
      };
    }
    
    // If we're already working on content in the content generator, don't detect new content types
    if (this.conversationState.activeFeature === 'content-generator' && this.conversationState.contentContext.type) {
      return {
        action: 'chat',
        response: {
          type: 'natural',
          message: null // Let Claude handle the conversation naturally
        }
      };
    }
    
    // Check for content type mention (only if not already working on content)
    const contentType = this.detectContentType(message);
    
    if (contentType && !hasGeneratedContent && !this.conversationState.contentContext.type) {
      // User mentioned a content type - activate Content Generator and set context
      this.conversationState.contentContext.type = contentType;
      
      // Show tips briefly, then let Claude take over the conversation
      const tips = this.contentTips[contentType];
      return {
        action: 'activate_feature',
        feature: 'content-generator',
        contentType: contentType,
        response: {
          type: 'tips_and_natural_conversation',
          title: tips.title,
          tips: tips.tips,
          message: `I'll help you create a ${contentType.replace('-', ' ')}. Here are some quick tips:`,
          followUp: null
        }
      };
    }
    
    // Check for other feature activation
    const feature = this.detectFeature(message);
    if (feature && feature !== 'content-generator') {
      return {
        action: 'activate_feature',
        feature: feature,
        response: {
          type: 'feature_activation',
          message: this.getFeatureActivationMessage(feature)
        }
      };
    }
    
    // Default: Let Claude handle the conversation naturally
    return {
      action: 'chat',
      response: {
        type: 'natural',
        message: null // Claude handles this
      }
    };
  }

  // Process content creation conversation like a world-class PR executive
  processContentCreationConversation(message) {
    const lower = message.toLowerCase();
    const context = this.conversationState.contentContext;
    
    // Check if user wants to generate now
    if (this.shouldGenerateContent(message)) {
      return this.prepareContentGeneration();
    }
    
    // Strategic information gathering - comprehensive like a PR executive
    if (!context.topic) {
      context.topic = message;
      
      // Content-type specific strategic questions
      const strategicQuestions = {
        'press-release': "Excellent topic. Before we craft this press release, I need to understand your news angle. What makes this announcement newsworthy right now? Are you breaking new ground, responding to industry trends, or announcing a significant milestone?",
        'thought-leadership': "Great subject for thought leadership. To position you as an industry authority, I need to understand your unique perspective. What contrarian view or fresh insight do you bring to this topic that challenges conventional wisdom?",
        'blog-post': "Perfect blog topic. To create content that drives engagement and SEO performance, what's your primary objective - educating prospects, nurturing leads, establishing expertise, or driving conversions?",
        'social-post': "Good social content idea. Social media success depends on platform strategy. Which platform is this for, and what action do you want your audience to take - engage, share, click-through, or convert?",
        'email': "Smart email campaign topic. Email success is all about audience segmentation and timing. Who's your target segment, and where are they in your customer journey - awareness, consideration, or decision stage?",
        'qa-doc': "Solid Q&A topic. Effective Q&As anticipate real concerns and objections. What are the most pressing questions or concerns your audience has about this subject?",
        'crisis-response': "Critical situation. In crisis communications, speed and authenticity are paramount. What are the key facts we need to address, and what's your primary stakeholder concern right now?",
        'media-pitch': "Interesting pitch angle. Media success requires perfect journalist-audience fit. Which specific journalists or publications are you targeting, and why will their readers care about this story right now?"
      };
      
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: strategicQuestions[context.type] || "Excellent topic. To create the most effective piece, I need to understand your strategic objectives. What's the primary goal - awareness, thought leadership, lead generation, crisis management, or something else?"
        }
      };
    }
    
    if (!context.objective) {
      context.objective = message;
      
      // Content-type specific audience questions
      const audienceQuestions = {
        'press-release': "Perfect news angle. Now, who's your primary media target? Are we pitching to trade publications, mainstream business media, or specialized beat reporters? Different audiences require different story angles.",
        'thought-leadership': "Excellent positioning. Who's your target audience for this thought leadership - fellow industry executives, practitioners implementing solutions, or investors evaluating market opportunities? Your expertise angle will vary significantly.",
        'blog-post': "Great objective clarity. Who's your ideal reader - prospects researching solutions, customers seeking implementation guidance, or industry peers evaluating trends? This affects our content depth and technical level.",
        'social-post': "Perfect platform strategy. Who's your target audience on this platform - existing customers, potential leads, industry influencers, or job candidates? Each group responds to different messaging approaches.",
        'email': "Smart segmentation thinking. Who specifically is receiving this email - existing customers, qualified leads, cold prospects, or partners? Your relationship stage determines our tone and approach.",
        'qa-doc': "Good concern identification. Who will be reading this Q&A - confused prospects, existing customers, internal teams, or media? Different audiences have different information needs.",
        'crisis-response': "Critical stakeholder focus. Who are your primary audiences during this crisis - customers, employees, investors, regulators, or media? We need to prioritize our messaging sequence.",
        'media-pitch': "Excellent targeting strategy. Beyond the journalists, who's their audience that will ultimately read this story - your customers, industry peers, or potential investors? This affects our story angle."
      };
      
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: audienceQuestions[context.type] || "Perfect. Now, who is your primary audience? Please be specific - are we talking C-suite executives, technical practitioners, general consumers, investors, or media? The more targeted, the better."
        }
      };
    }
    
    if (!context.audience) {
      context.audience = message;
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: "Great audience targeting. What's the competitive landscape like? Are there any key messages your competitors are pushing that we should differentiate from, or industry conversations we should join?"
        }
      };
    }
    
    if (!context.competitive) {
      context.competitive = message;
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: "Valuable context. Do you have any supporting data, case studies, or credibility elements we should incorporate? Numbers and proof points make content significantly more impactful."
        }
      };
    }
    
    if (!context.credibility) {
      context.credibility = message;
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: "Excellent supporting material. What tone and style will resonate most with your audience - authoritative expert, conversational thought partner, or data-driven analyst?"
        }
      };
    }
    
    if (!context.tone) {
      context.tone = message;
      return {
        action: 'chat',
        response: {
          type: 'gathering_info',
          message: "Perfect tone direction. Finally, are there any specific calls-to-action, key messages, or strategic points that absolutely must be included?"
        }
      };
    }
    
    if (!context.keyRequirements) {
      context.keyRequirements = message;
      context.readyToGenerate = true;
      return {
        action: 'chat',
        response: {
          type: 'ready_to_generate',
          message: `Outstanding! I have everything needed to create a strategic ${context.type ? context.type.replace('-', ' ') : 'content'} piece that aligns with your objectives and resonates with your audience. Ready to generate?`
        }
      };
    }
    
    // User is adding additional details
    context.keyPoints.push(message);
    return {
      action: 'chat',
      response: {
        type: 'gathering_info',
        message: "Noted. Any other strategic considerations, or should I create your content now?"
      }
    };
  }

  // Process content editing conversation - stay focused on current content
  processContentEditingConversation(message) {
    const lower = message.toLowerCase();
    const context = this.conversationState.contentContext;
    
    // Detect editing requests
    const editingKeywords = [
      'shorter', 'longer', 'more concise', 'expand', 'cut', 'add',
      'remove', 'change', 'update', 'revise', 'rewrite', 'edit',
      'make it', 'can you', 'please', 'linkedin', 'twitter', 'facebook',
      'social media', 'platform', 'audience', 'tone', 'formal', 'casual'
    ];
    
    const hasEditingIntent = editingKeywords.some(keyword => lower.includes(keyword));
    
    if (hasEditingIntent) {
      // This is an editing request - provide guidance on refining the current content
      const contentType = context.type;
      const editingAdvice = {
        'press-release': "I'll help you refine this press release. For different platforms or audiences, I can adjust the tone, length, or focus while maintaining the core newsworthy elements.",
        'thought-leadership': "I can adapt this thought leadership piece for different contexts - perhaps making it more concise for social sharing or expanding certain insights for different audiences.",
        'blog-post': "Let me help you optimize this blog content. I can adjust the length, tone, or focus to better match your distribution strategy and audience needs.",
        'social-post': "I'll refine this social content to better fit your platform and engagement goals. Different social platforms require different approaches.",
        'email': "I can adjust this email content for better performance - whether that's changing the length, tone, or call-to-action based on your audience.",
        'qa-doc': "I'll help you refine these Q&As to better address your audience's concerns or adjust the format for different use cases.",
        'crisis-response': "I can help you adapt this crisis response for different stakeholder groups or communication channels while maintaining consistency.",
        'media-pitch': "Let me help you tailor this pitch for different journalists or publications while keeping the core story compelling."
      };
      
      return {
        action: 'edit_current_content',
        response: {
          type: 'editing_guidance',
          message: editingAdvice[contentType] || "I'll help you refine this content to better meet your needs. What specific changes would you like me to make?"
        }
      };
    }
    
    // If not a clear editing request, treat as general refinement conversation
    return {
      action: 'chat',
      response: {
        type: 'content_focused',
        message: "I'm here to help you perfect this content. What adjustments would you like to make? I can help with tone, length, platform optimization, or audience targeting."
      }
    };
  }

  // Check if user wants to generate content
  shouldGenerateContent(message) {
    const lower = message.toLowerCase();
    const generatePhrases = [
      'generate', 'create it', 'write it', 'go ahead', 
      'that\'s all', 'that\'s it', 'nothing else', 'no more',
      'create now', 'generate now', 'write now', 'do it',
      'yes', 'yep', 'sure', 'ok', 'okay', 'ready'
    ];
    
    return generatePhrases.some(phrase => lower.includes(phrase)) && 
           this.conversationState.contentContext.topic;
  }

  // Prepare content generation parameters
  prepareContentGeneration() {
    const context = this.conversationState.contentContext;
    
    if (!context.type || !context.topic) {
      return {
        action: 'chat',
        response: {
          type: 'need_more_info',
          message: "I need a bit more information. What type of content would you like to create, and what's the topic?"
        }
      };
    }
    
    return {
      action: 'generate_content',
      feature: 'content-generator',
      params: {
        type: context.type,
        topic: context.topic,
        objective: context.objective || 'general communication',
        audience: context.audience || 'general audience',
        competitive: context.competitive || 'no specific competitive context',
        credibility: context.credibility || 'no specific supporting data',
        tone: context.tone || 'professional',
        keyRequirements: context.keyRequirements || 'no specific requirements',
        keyPoints: context.keyPoints
      },
      response: {
        type: 'generating',
        message: `Creating your strategic ${context.type ? context.type.replace('-', ' ') : 'content'} now. You'll see it appear in the Content Generator...`
      }
    };
  }

  // Get feature activation message
  getFeatureActivationMessage(feature) {
    const messages = {
      'media-intelligence': "I'll help you find the right journalists and media contacts. What industry or topic are you looking for?",
      'campaign-intelligence': "I'll help you plan your campaign. What's your main campaign objective?",
      'crisis-command': "I'll help you manage this situation. What's happening that needs immediate attention?",
      'memory-vault': "I'll help you organize your information. What would you like to save or retrieve?"
    };
    
    return messages[feature] || "Feature activated. How can I help you with this?";
  }

  // Set active feature when manually selected
  setActiveFeature(featureId) {
    this.conversationState.activeFeature = featureId;
    
    // Reset content context if switching away from content generator
    if (featureId !== 'content-generator') {
      this.conversationState.contentContext = {
        type: null,
        topic: null,
        objective: null,
        audience: null,
        competitive: null,
        credibility: null,
        tone: null,
        keyRequirements: null,
        keyPoints: [],
        readyToGenerate: false
      };
    }
  }

  // Reset conversation state
  reset() {
    this.conversationState = {
      mode: 'general',
      activeFeature: null,
      contentContext: {
        type: null,
        topic: null,
        objective: null,
        audience: null,
        competitive: null,
        credibility: null,
        tone: null,
        keyRequirements: null,
        keyPoints: [],
        readyToGenerate: false
      }
    };
  }

  // Format tips for display
  formatTipsMessage(tips) {
    return `${tips.title}\n\n${tips.tips.join('\n')}`;
  }

  // Check if currently gathering content info
  isGatheringContentInfo() {
    const context = this.conversationState.contentContext;
    return this.conversationState.activeFeature === 'content-generator' && 
           context.type && !context.readyToGenerate;
  }

  // Get contextual greeting for feature (for manual feature selection)
  getFeatureGreeting(featureId) {
    const greetings = {
      'content-generator': "I'm now in Content Generation mode. I can help you create press releases, blog posts, social media content, and more. What would you like to create?",
      'media-intelligence': "I'm now in Media Intelligence mode. I can help you find journalists, build media lists, and track coverage. What are you looking for?",
      'campaign-intelligence': "I'm now in Campaign Intelligence mode. I can help you plan and optimize your PR campaigns. What's your campaign goal?",
      'crisis-command': "I'm now in Crisis Command mode. I can help you manage and respond to crisis situations. What's the situation?",
      'memory-vault': "I'm now in Memory Vault mode. I can help you save and organize important information. What would you like to store?",
      'reports': "I'm now in Analytics mode. I can help you analyze performance and generate reports. What metrics interest you?"
    };

    return greetings[featureId] || "How can I help you with this feature?";
  }
}

export default new AdaptiveAIService();