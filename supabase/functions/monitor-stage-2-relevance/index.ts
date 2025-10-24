// Monitor Stage 2: Intelligent PR-Focused Relevance Scoring
// This stage ensures we get COVERAGE of all important entities from the profile

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Helper functions for extraction
function extractKeyPhrases(text: string): string[] {
  const phrases = [];
  
  // Extract quoted phrases
  const quotedMatches = text.match(/["']([^"']{5,100})["']/g) || [];
  phrases.push(...quotedMatches.map(m => m.replace(/["']/g, '')));
  
  // Extract capitalized multi-word phrases (likely proper nouns/products)
  const capitalizedPhrases = text.match(/[A-Z][a-z]+(\s+[A-Z][a-z]+)+/g) || [];
  phrases.push(...capitalizedPhrases);
  
  // Extract percentage/number patterns with context
  const numberPatterns = text.match(/\d+(\.\d+)?\s*(percent|%|billion|million|thousand)/gi) || [];
  phrases.push(...numberPatterns);
  
  return [...new Set(phrases)].slice(0, 10);
}

function detectEventType(text: string): string {
  const eventPatterns = {
    'product_launch': /launch|unveil|introduce|debut|release|announce/i,
    'financial': /earnings|revenue|profit|loss|quarterly|ipo|funding|investment/i,
    'partnership': /partner|collaborate|alliance|joint venture|agreement/i,
    'acquisition': /acquire|merger|buyout|purchase|takeover/i,
    'legal': /lawsuit|litigation|settlement|court|ruling|investigation/i,
    'leadership': /ceo|executive|appoint|resign|hire|fire|departure/i,
    'crisis': /recall|breach|scandal|crisis|emergency|failure/i,
    'expansion': /expand|growth|new market|international|global/i,
    'innovation': /breakthrough|innovation|patent|research|development/i,
    'regulatory': /regulation|compliance|fda|sec|ftc|approval/i
  };
  
  for (const [type, pattern] of Object.entries(eventPatterns)) {
    if (pattern.test(text)) return type;
  }
  
  return 'general_update';
}

function detectSentiment(text: string): { positive: string[], negative: string[], neutral: string[] } {
  const positive = [];
  const negative = [];
  const neutral = [];
  
  // Positive indicators
  const positiveWords = ['breakthrough', 'success', 'growth', 'innovation', 'record', 'leading', 'surge', 'boost', 'improve', 'gain'];
  const negativeWords = ['decline', 'loss', 'fail', 'crash', 'scandal', 'lawsuit', 'recall', 'crisis', 'threat', 'risk'];
  const neutralWords = ['announce', 'report', 'state', 'reveal', 'disclose', 'update'];
  
  positiveWords.forEach(word => {
    if (text.toLowerCase().includes(word)) positive.push(word);
  });
  
  negativeWords.forEach(word => {
    if (text.toLowerCase().includes(word)) negative.push(word);
  });
  
  neutralWords.forEach(word => {
    if (text.toLowerCase().includes(word)) neutral.push(word);
  });
  
  return { positive, negative, neutral };
}

function calculateStrategicRelevance(text: string, targetEntities: any): number {
  let relevance = 0;
  
  // Check for strategic keywords
  const strategicTerms = ['strategy', 'competitive', 'market share', 'positioning', 'differentiation', 'advantage'];
  strategicTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) relevance += 10;
  });
  
  // Check for multiple entity mentions (indicates comparison/analysis)
  const competitorMentions = targetEntities.competitors.filter(comp => 
    comp && text.toLowerCase().includes(comp.toLowerCase())
  ).length;
  
  if (competitorMentions > 1) relevance += 20; // Multiple competitors mentioned
  
  // Check for forward-looking statements
  const futurePhrases = ['will', 'plan to', 'expect', 'forecast', 'predict', 'upcoming', 'future'];
  futurePhrases.forEach(phrase => {
    if (text.toLowerCase().includes(phrase)) relevance += 5;
  });
  
  return Math.min(relevance, 100);
}

function extractPotentialEvents(text: string): string[] {
  const events = [];
  
  // Pattern for event-like phrases (verb + noun combinations)
  const eventPatterns = [
    /(?:announce|launch|release|unveil)\s+(?:a |an |the )?([\w\s]{3,30})/gi,
    /(?:acquire|purchase|buy)\s+([\w\s]{3,30})/gi,
    /(?:partner with|collaborate with|team up with)\s+([\w\s]{3,30})/gi,
    /(?:invest|raise|secure)\s+\$?[\d.]+(\s+\w+)?/gi
  ];
  
  eventPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    events.push(...matches);
  });
  
  return [...new Set(events)].slice(0, 5);
}

function extractProducts(text: string): string[] {
  const products = [];
  
  // Common product indicators
  const productPatterns = [
    /(?:Model|Version)\s+[A-Z0-9][\w-]*/gi,
    /[A-Z][\w]+(?:Pro|Plus|Max|Ultra|X|S)\b/g,
    /(?:the |new |latest )([A-Z][\w]+\s+[A-Z][\w]+)/g
  ];
  
  productPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    products.push(...matches);
  });
  
  // Also check for known product categories
  const categories = ['vehicle', 'car', 'truck', 'suv', 'sedan', 'software', 'platform', 'service', 'app', 'device'];
  categories.forEach(cat => {
    const pattern = new RegExp(`(?:new |latest |upcoming )?${cat}s?\\b`, 'gi');
    const matches = text.match(pattern) || [];
    products.push(...matches);
  });
  
  return [...new Set(products)].slice(0, 10);
}

function extractFinancialSignals(text: string): any {
  const signals = {
    amounts: [],
    percentages: [],
    metrics: []
  };
  
  // Extract dollar amounts
  const dollarAmounts = text.match(/\$[\d.]+(\s*(?:billion|million|thousand|B|M|K))?/gi) || [];
  signals.amounts.push(...dollarAmounts);
  
  // Extract percentages
  const percentages = text.match(/\d+(\.\d+)?\s*%/g) || [];
  signals.percentages.push(...percentages);
  
  // Extract financial metrics
  const metricKeywords = ['revenue', 'profit', 'earnings', 'ebitda', 'margin', 'growth', 'valuation'];
  metricKeywords.forEach(metric => {
    if (text.toLowerCase().includes(metric)) {
      signals.metrics.push(metric);
    }
  });
  
  return signals;
}

function extractTimeMarkers(text: string): string[] {
  const markers = [];
  
  // Extract quarters
  const quarters = text.match(/Q[1-4]\s*20\d{2}/gi) || [];
  markers.push(...quarters);
  
  // Extract months and years
  const monthYear = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}/gi) || [];
  markers.push(...monthYear);
  
  // Extract relative time markers
  const relativeTime = text.match(/(?:next|last|this)\s+(?:week|month|quarter|year)/gi) || [];
  markers.push(...relativeTime);
  
  // Extract specific dates
  const dates = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || [];
  markers.push(...dates);
  
  return [...new Set(markers)].slice(0, 5);
}

// Helper function to find source profile
function findSourceProfile(sourceName: string, profile: any): any {
  if (!profile?.sources) return null;

  const allSources = [
    ...(profile.sources.competitive || []),
    ...(profile.sources.media || []),
    ...(profile.sources.regulatory || []),
    ...(profile.sources.market || [])
  ];

  return allSources.find(s =>
    s.name.toLowerCase() === sourceName.toLowerCase() ||
    sourceName.toLowerCase().includes(s.name.toLowerCase())
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, profile, organization_name, top_k = 50, coverage_report } = await req.json();
    
    console.log('🎯 RELEVANCE SCORING STAGE 2');
    console.log(`Organization: ${organization_name}`);
    console.log(`Input articles: ${articles?.length || 0}`);
    console.log(`Will return top: ${top_k}`);
    
    if (coverage_report) {
      console.log('📊 Coverage report received:');
      console.log(`   Context: ${coverage_report.context}`);
      console.log(`   Priority articles: ${coverage_report.priorities?.length || 0}`);
      console.log(`   Coverage gaps:`, coverage_report.gaps);
    }
    
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        findings: [],
        articles: [],
        statistics: {},
        success: false,
        error: 'No articles to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract key entities from profile - FULLY DYNAMIC
    // Use intelligence context if available, otherwise fall back to standard profile fields
    const intelligenceContext = profile?.intelligence_context;
    const scoringWeights = intelligenceContext?.relevance_criteria?.scoring_weights || {
      organization_mention: 40,
      competitor_action: 30,
      regulatory_news: 25,
      market_signal: 15
    };

    const targetEntities = {
      organization: [
        organization_name,
        profile?.organization_name,
        profile?.organization
      ].filter(Boolean),
      competitors: [
        ...(profile?.competition?.direct_competitors || []),
        ...(profile?.competition?.indirect_competitors || []),
        ...(profile?.competition?.emerging_threats || []),
        ...(profile?.competitors?.direct || []),
        ...(profile?.competitors?.indirect || [])
      ].filter(Boolean),
      stakeholders: [
        ...(profile?.stakeholders?.regulators || []),
        ...(profile?.stakeholders?.major_investors || []),
        ...(profile?.stakeholders?.major_customers || []),
        ...(profile?.stakeholders?.partners || []),
        ...(profile?.stakeholders?.executives || []),
        ...(profile?.stakeholders?.critics || []),
        ...(profile?.stakeholders?.influencers || [])
      ].filter(Boolean),
      keywords: [
        ...(profile?.monitoring_config?.keywords || []),
        ...(profile?.keywords || []),
        ...(profile?.trending?.hot_topics || []),
        ...(intelligenceContext?.topics || []),
        ...(profile?.topics || [])
      ].filter(Boolean)
    };

    // Log if we're using intelligence context
    if (intelligenceContext) {
      console.log('🎯 Using intelligence context from discovery:', {
        hasMonitoringPrompt: !!intelligenceContext.monitoring_prompt,
        hasRelevanceCriteria: !!intelligenceContext.relevance_criteria,
        topicsCount: intelligenceContext.topics?.length || 0,
        scoringWeights
      });
    }
    
    console.log('📋 Coverage targets:', {
      organization: targetEntities.organization,
      competitors: targetEntities.competitors.slice(0, 10),
      stakeholders: targetEntities.stakeholders.slice(0, 10),
      keywords: targetEntities.keywords.slice(0, 10),
      counts: {
        organization: targetEntities.organization.length,
        competitors: targetEntities.competitors.length,
        stakeholders: targetEntities.stakeholders.length,
        keywords: targetEntities.keywords.length
      }
    });
    
    // Track coverage to ensure diversity
    const coverageTracker = {
      organization: new Set(),
      competitors: new Map(), // Track count per competitor
      stakeholders: new Map(),
      keywords: new Map(),
      topics: new Map()
    };
    
    // Score and categorize each article
    const scoredArticles = articles.map(article => {
      const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      const titleText = (article.title || '').toLowerCase();
      
      let score = 0;
      const factors = [];
      const entities_found = [];
      let category = 'general';
      let intelligence_type = 'none';
      
      // CRITICAL: Identify ACTIONABLE intelligence types first
      const hasProductLaunch = /launch|unveil|introduce|debut|release|announce.*new|new.*product|new.*service|new.*model/i.test(text);
      const hasFinancialData = /earnings|revenue|profit|loss|quarterly|guidance|forecast|billion|million|growth.*%|decline.*%/i.test(text);
      const hasLeadershipChange = /ceo|cfo|cto|executive|appoint|resign|hire|fire|departure|replacement|new.*chief/i.test(text);
      const hasCrisisEvent = /recall|lawsuit|investigation|breach|scandal|violation|fine|penalty|sue|complaint|regulatory/i.test(text);
      const hasStrategicMove = /acquire|merger|partnership|collaborate|expand|enter.*market|exit|divest|restructure|pivot/i.test(text);
      const hasTechnologyUpdate = /ai|autonomous|battery|software|patent|innovation|breakthrough|research|development|upgrade/i.test(text);

      // NEW: Source-aware scoring boost
      const articleSource = article.source || article.feed_name || 'unknown';
      const sourceProfile = findSourceProfile(articleSource, profile);

      if (sourceProfile) {
        // Check if article uses this source's typical patterns
        const sourceKeywords = profile?.monitoring_config?.keywords_by_source?.[articleSource] || [];
        const matchedSourceKeywords = sourceKeywords.filter(kw =>
          text.includes(kw.toLowerCase())
        );

        if (matchedSourceKeywords.length > 0) {
          score += 25 * matchedSourceKeywords.length;
          factors.push(`SOURCE_OPTIMIZED: ${articleSource} (${matchedSourceKeywords.length} matches)`);
        }

        // Critical sources get priority
        if (sourceProfile.priority === 'critical') {
          score += 20;
          factors.push('CRITICAL_SOURCE');
        } else if (sourceProfile.priority === 'high') {
          score += 10;
          factors.push('HIGH_PRIORITY_SOURCE');
        }
      }

      // PRIORITY 1: Direct competitive intelligence (HIGHEST VALUE)
      // Check both exact and partial matches
      const competitorInTitle = targetEntities.competitors.find(comp =>
        comp && titleText.includes(comp.toLowerCase())
      );
      const competitorMentioned = targetEntities.competitors.filter(comp =>
        comp && text.includes(comp.toLowerCase())
      );

      // BONUS: Articles covering multiple diverse topics get higher scores
      const topicDiversity = new Set();
      if (competitorMentioned.length > 0) topicDiversity.add('competitor');

      // Dynamic topic detection based on profile keywords
      targetEntities.keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          // Categorize the keyword
          if (/technolog|ai|software|hardware|innovation|patent|research/i.test(keyword)) {
            topicDiversity.add('technology');
          } else if (/regulat|compliance|law|legal|investigation|fine|penalty/i.test(keyword)) {
            topicDiversity.add('regulatory');
          } else if (/production|manufactur|supply|factory|output/i.test(keyword)) {
            topicDiversity.add('operations');
          } else if (/earnings|revenue|profit|financial|stock|invest/i.test(keyword)) {
            topicDiversity.add('financial');
          } else if (/partner|merger|acquisition|collaborate|alliance/i.test(keyword)) {
            topicDiversity.add('strategic');
          }
        }
      });

      const diversityBonus = topicDiversity.size * 10;
      
      // BOOSTED: Competitor intelligence is our PRIMARY focus
      const baseCompetitorScore = 60; // Doubled from 30 - competitors are priority

      if (competitorInTitle && (hasProductLaunch || hasStrategicMove || hasCrisisEvent)) {
        score += baseCompetitorScore * 3 + diversityBonus; // 180+ points for critical competitor actions
        factors.push(`CRITICAL_COMPETITOR_ACTION: ${competitorInTitle} (+${diversityBonus} diversity)`);
        entities_found.push(competitorInTitle);
        category = 'competitive_intelligence';
        intelligence_type = 'competitor_action';
        coverageTracker.competitors.set(competitorInTitle, (coverageTracker.competitors.get(competitorInTitle) || 0) + 1);
      } else if (competitorInTitle) {
        score += baseCompetitorScore * 2 + diversityBonus; // 120+ points for competitor in title
        factors.push(`COMPETITOR_FOCUS: ${competitorInTitle} (+${diversityBonus} diversity)`);
        entities_found.push(competitorInTitle);
        category = 'competitive';
        intelligence_type = 'competitor_mention';
        coverageTracker.competitors.set(competitorInTitle, (coverageTracker.competitors.get(competitorInTitle) || 0) + 1);
      }

      // Multiple competitor mentions = comparative analysis opportunity
      if (competitorMentioned.length > 1) {
        score += baseCompetitorScore * 1.5 * competitorMentioned.length + diversityBonus; // More points for multi-competitor analysis
        factors.push(`MULTI_COMPETITOR_ANALYSIS: ${competitorMentioned.slice(0, 5).join(', ')} (+${diversityBonus} diversity)`);
        intelligence_type = 'market_comparison';
        // Track all mentioned competitors
        competitorMentioned.forEach(comp => {
          coverageTracker.competitors.set(comp, (coverageTracker.competitors.get(comp) || 0) + 1);
        });
      }
      
      // PRIORITY 2: Our organization with actionable context
      const orgInTitle = targetEntities.organization.find(org =>
        org && titleText.includes(org.toLowerCase())
      );
      const orgMentioned = targetEntities.organization.find(org =>
        org && text.includes(org.toLowerCase())
      );

      if (orgInTitle) {
        // REDUCED WEIGHT: Organization-only articles should have lower priority
        // We want them for context, but competitive intelligence is more valuable
        const baseOrgScore = 15; // Reduced from 40

        // Only boost if article ALSO mentions competitors (comparative context)
        const hasComparativeContext = competitorMentioned.length > 0;

        if (hasComparativeContext) {
          // Articles comparing us to competitors are HIGH value
          score += baseOrgScore * 4; // 60 points for comparative analysis
          factors.push(`ORG_VS_COMPETITORS: ${orgInTitle} vs ${competitorMentioned.join(',')}`);
          category = 'competitive_comparison';
          intelligence_type = 'comparative_analysis';
        } else if (hasProductLaunch || hasStrategicMove) {
          score += baseOrgScore * 2; // 30 points (reduced from 120)
          factors.push(`ORG_OPPORTUNITY: ${orgInTitle}`);
          category = 'organization_opportunity';
          intelligence_type = 'org_positive';
        } else if (hasCrisisEvent) {
          score += baseOrgScore * 2.5; // 37.5 points (reduced from 100)
          factors.push(`ORG_CRISIS: ${orgInTitle}`);
          category = 'organization_risk';
          intelligence_type = 'org_crisis';
        } else {
          // Pure org mentions get minimal weight
          score += baseOrgScore * 0.5; // Only 7.5 points for org-only articles
          factors.push(`ORG_ONLY: ${orgInTitle}`);
          category = 'organization';
        }
        entities_found.push(orgInTitle);
        coverageTracker.organization.add(orgInTitle);
      }
      
      // PRIORITY 3: Regulatory and stakeholder intelligence
      const regulatorMentioned = targetEntities.stakeholders.filter(sh => {
        if (!sh) return false;
        const mentioned = text.includes(sh.toLowerCase());
        if (mentioned && /regulat|investigat|fine|penalty|compliance|approval|ruling/i.test(text)) {
          return true;
        }
        return false;
      });
      
      if (regulatorMentioned.length > 0) {
        const baseRegulatoryScore = scoringWeights.regulatory_news || 25;
        score += baseRegulatoryScore * 2.8; // Regulatory news is high priority
        factors.push(`REGULATORY_INTEL: ${regulatorMentioned.join(', ')}`);
        entities_found.push(...regulatorMentioned);
        category = 'regulatory';
        intelligence_type = 'regulatory_action';
        regulatorMentioned.forEach(reg => {
          coverageTracker.stakeholders.set(reg, (coverageTracker.stakeholders.get(reg) || 0) + 1);
        });
      }
      
      // PRIORITY 3: Stakeholder coverage
      const stakeholderMentioned = targetEntities.stakeholders.find(sh => 
        sh && text.includes(sh.toLowerCase())
      );
      
      if (stakeholderMentioned) {
        const currentCount = coverageTracker.stakeholders.get(stakeholderMentioned) || 0;
        const diversityBonus = currentCount < 2 ? 10 : 0;
        
        score += 25 + diversityBonus;
        factors.push(`STAKEHOLDER: ${stakeholderMentioned}`);
        entities_found.push(stakeholderMentioned);
        if (category === 'general') category = 'regulatory';
        coverageTracker.stakeholders.set(stakeholderMentioned, currentCount + 1);
      }
      
      // PRIORITY 4: Technology and innovation intelligence
      const techKeywords = profile?.monitoring_config?.keywords || [];
      const hasTechInnovation = techKeywords.some(kw => kw && text.includes(kw.toLowerCase()));
      
      if (hasTechnologyUpdate && (competitorMentioned.length > 0 || orgMentioned)) {
        score += 60;
        factors.push('TECH_INTELLIGENCE');
        if (intelligence_type === 'none') intelligence_type = 'technology';
      }
      
      // PRIORITY 5: Market dynamics that affect positioning
      if (hasFinancialData) {
        if (competitorMentioned.length > 0) {
          score += 50; // Competitor financials = benchmark opportunity
          factors.push('COMPETITOR_FINANCIALS');
          if (intelligence_type === 'none') intelligence_type = 'financial';
        } else if (orgMentioned) {
          score += 40;
          factors.push('ORG_FINANCIALS');
        } else {
          score += 20; // Industry financials still matter
          factors.push('MARKET_FINANCIALS');
        }
      }
      
      // PRIORITY 6: Strategic moves and market shifts
      if (hasStrategicMove) {
        const entities = [...competitorMentioned, orgMentioned].filter(Boolean);
        if (entities.length > 0) {
          score += 45 * entities.length;
          factors.push(`STRATEGIC_MOVE: ${entities.join(', ')}`);
          if (intelligence_type === 'none') intelligence_type = 'strategic';
        }
      }
      
      // PENALTY: Downrank generic content without specific entities
      const totalEntities = competitorMentioned.length + (orgMentioned ? 1 : 0) + regulatorMentioned.length;
      if (totalEntities === 0) {
        score = Math.floor(score * 0.3); // Massive penalty for no entity mentions
        factors.push('NO_ENTITIES_PENALTY');
      }
      
      // BONUS: Time-sensitive and exclusive content
      const hasExclusive = /exclusive|breaking|first|reveal|uncover|leak|source.*said|told.*exclusively/i.test(text);
      const hasTimeSensitive = /today|tomorrow|this week|deadline|urgent|immediate|now|just.*announced/i.test(text);
      
      if (hasExclusive) {
        score += 30;
        factors.push('EXCLUSIVE_CONTENT');
      }
      if (hasTimeSensitive) {
        score += 25;
        factors.push('TIME_SENSITIVE');
      }
      
      // PRIORITY 5: Keyword and topic coverage
      const keywordMatches = targetEntities.keywords.filter(kw => 
        kw && text.includes(kw.toLowerCase())
      );
      
      keywordMatches.forEach(kw => {
        const currentCount = coverageTracker.keywords.get(kw) || 0;
        const diversityBonus = currentCount < 2 ? 5 : 0;
        
        score += 10 + diversityBonus;
        factors.push(`KEYWORD: ${kw}`);
        coverageTracker.keywords.set(kw, currentCount + 1);
      });
      
      // PRIORITY 6: HUNT for market dynamics and actionable patterns
      const marketSignals = ['ipo', 'merger', 'billion', 'million', 'valuation', 'market share', 'quarterly', 'earnings',
                            'revenue', 'profit', 'stock', 'shares', 'invest', 'capital', 'fund', 'deal', 'transaction'];
      const actionablePatterns = ['announce', 'plan to', 'will', 'expect', 'target', 'aim', 'launch', 'introduce', 
                                 'partner with', 'acquire', 'expand', 'enter', 'exit', 'close', 'open', 'hire', 'appoint'];
      
      const hasMarketSignal = marketSignals.some(signal => text.includes(signal));
      const hasActionablePattern = actionablePatterns.some(pattern => text.includes(pattern));
      
      if (hasMarketSignal) {
        if (orgMentioned || competitorMentioned) {
          score += 40; // Increased from 20
          factors.push('MARKET_SIGNAL');
          if (category === 'general') category = 'market';
        } else {
          score += 15; // Even general market signals have value
          factors.push('MARKET_CONTEXT');
        }
      }
      
      if (hasActionablePattern) {
        score += 25; // New: reward action-oriented content
        factors.push('ACTIONABLE_PATTERN');
        
        // If it's about a competitor taking action, that's critical
        if (competitorMentioned && !orgMentioned) {
          score += 20;
          factors.push('COMPETITOR_ACTION');
        }
      }
      
      // BONUS: Time-sensitive content (dates, deadlines, "today", "tomorrow", "this week")
      const timeMarkers = ['today', 'tomorrow', 'yesterday', 'this week', 'next week', 'monday', 'tuesday', 'wednesday', 
                          'thursday', 'friday', 'deadline', 'by', 'before', 'until', 'q1', 'q2', 'q3', 'q4'];
      const hasTimeMarker = timeMarkers.some(marker => text.includes(marker));
      
      if (hasTimeMarker) {
        score += 15;
        factors.push('TIME_SENSITIVE');
      }
      
      // Extract key data and initial analysis for enrichment
      const pr_extraction = {
        mentioned_entities: entities_found,
        intelligence_type,
        has_actionable_intel: intelligence_type !== 'none',
        competitor_count: competitorMentioned.length,
        primary_category: category,
        coverage_gaps: [], // Will be filled in final selection
        
        // Context for synthesis and opportunities
        actionable_signals: {
          product_launch: hasProductLaunch,
          financial_data: hasFinancialData,
          leadership_change: hasLeadershipChange,
          crisis_event: hasCrisisEvent,
          strategic_move: hasStrategicMove,
          technology_update: hasTechnologyUpdate
        },
        
        // Extract key phrases and context for enrichment
        key_phrases: extractKeyPhrases(text),
        event_type: detectEventType(text),
        sentiment_indicators: detectSentiment(text),
        strategic_relevance: calculateStrategicRelevance(text, targetEntities),
        
        // Pre-extract for enrichment efficiency
        potential_events: extractPotentialEvents(text),
        mentioned_products: extractProducts(text),
        financial_signals: extractFinancialSignals(text),
        temporal_markers: extractTimeMarkers(text)
      };
      
      return {
        ...article,
        pr_relevance_score: score,
        pr_factors: factors,
        pr_extraction,
        pr_category: category
      };
    });
    
    // Sort by score
    scoredArticles.sort((a, b) => b.pr_relevance_score - a.pr_relevance_score);
    
    // INTELLIGENT SELECTION: Prioritize actionable intelligence
    const selectedArticles = [];
    const selectedUrls = new Set();
    const intelligenceTypeCounts = {};
    
    // First pass: Get articles with actionable intelligence (50% of quota)
    const actionableArticles = scoredArticles.filter(a => a.pr_extraction.has_actionable_intel);
    for (const article of actionableArticles) {
      if (selectedArticles.length >= Math.floor(top_k * 0.5)) break;
      if (!selectedUrls.has(article.url)) {
        selectedArticles.push(article);
        selectedUrls.add(article.url);
        intelligenceTypeCounts[article.pr_extraction.intelligence_type] = 
          (intelligenceTypeCounts[article.pr_extraction.intelligence_type] || 0) + 1;
      }
    }
    
    // Second pass: Get high-scoring articles with good entity coverage (30% of quota)
    for (const article of scoredArticles) {
      if (selectedArticles.length >= Math.floor(top_k * 0.8)) break;
      if (!selectedUrls.has(article.url) && article.pr_relevance_score >= 50) {
        selectedArticles.push(article);
        selectedUrls.add(article.url);
      }
    }
    
    // Second pass: AGGRESSIVELY fill gaps in coverage
    // Prioritize competitors from profile that we haven't covered
    const priorityCompetitors = targetEntities.competitors.slice(0, 7); // Top 7 competitors from profile
    const uncoveredPriorityCompetitors = priorityCompetitors.filter(comp =>
      !coverageTracker.competitors.has(comp) || coverageTracker.competitors.get(comp) < 1
    );
    
    const uncoveredCompetitors = targetEntities.competitors.filter(comp => 
      !coverageTracker.competitors.has(comp) || coverageTracker.competitors.get(comp) < 2
    );
    const uncoveredStakeholders = targetEntities.stakeholders.filter(sh => 
      !coverageTracker.stakeholders.has(sh)
    );
    
    // Check for topic gaps
    const topicsCovered = new Set();
    selectedArticles.forEach(article => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      if (text.includes('battery') || text.includes('charging')) topicsCovered.add('technology');
      if (text.includes('production') || text.includes('manufacturing')) topicsCovered.add('operations');
      if (text.includes('regulation') || text.includes('safety')) topicsCovered.add('regulatory');
      if (text.includes('earnings') || text.includes('financial')) topicsCovered.add('financial');
    });
    
    const missingTopics = ['technology', 'operations', 'regulatory', 'financial'].filter(t => !topicsCovered.has(t));
    
    console.log('📊 Coverage gaps:', {
      uncoveredPriorityCompetitors,
      uncoveredCompetitors: uncoveredCompetitors.slice(0, 10),
      uncoveredStakeholders: uncoveredStakeholders.slice(0, 10),
      missingTopics,
      topicsCovered: Array.from(topicsCovered)
    });
    
    // Find articles that fill coverage gaps
    for (const article of scoredArticles) {
      if (selectedArticles.length >= top_k) break;
      if (selectedUrls.has(article.url)) continue;
      
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      
      // Prioritize articles that cover gaps
      let gapScore = 0;
      const gaps = [];
      
      // Check for priority competitors
      uncoveredPriorityCompetitors.forEach(comp => {
        if (text.includes(comp.toLowerCase())) {
          gapScore += 50;
          gaps.push(`PRIORITY_COMP:${comp}`);
        }
      });
      
      // Check for any uncovered competitors
      uncoveredCompetitors.forEach(comp => {
        if (text.includes(comp.toLowerCase())) {
          gapScore += 30;
          gaps.push(`COMP:${comp}`);
        }
      });
      
      // Check for uncovered stakeholders
      uncoveredStakeholders.forEach(sh => {
        if (text.includes(sh.toLowerCase())) {
          gapScore += 20;
          gaps.push(`STAKEHOLDER:${sh}`);
        }
      });
      
      // Check for missing topics
      missingTopics.forEach(topic => {
        let hasTopicContent = false;
        if (topic === 'technology' && (text.includes('battery') || text.includes('charging') || text.includes('ai'))) hasTopicContent = true;
        if (topic === 'operations' && (text.includes('production') || text.includes('manufacturing') || text.includes('factory'))) hasTopicContent = true;
        if (topic === 'regulatory' && (text.includes('regulation') || text.includes('safety') || text.includes('nhtsa'))) hasTopicContent = true;
        if (topic === 'financial' && (text.includes('earnings') || text.includes('revenue') || text.includes('profit'))) hasTopicContent = true;
        
        if (hasTopicContent) {
          gapScore += 25;
          gaps.push(`TOPIC:${topic}`);
        }
      });
      
      if (gapScore > 0) {
        article.pr_extraction.coverage_gaps = gaps;
        article.pr_relevance_score += gapScore; // Boost score for gap coverage
        selectedArticles.push(article);
        selectedUrls.add(article.url);
      }
    }
    
    // Final pass: Fill remaining slots with diverse content
    for (const article of scoredArticles) {
      if (selectedArticles.length >= top_k) break;
      if (!selectedUrls.has(article.url)) {
        selectedArticles.push(article);
        selectedUrls.add(article.url);
      }
    }
    
    // Calculate statistics
    const scoreDistribution = {
      high: selectedArticles.filter(a => a.pr_relevance_score >= 70).length,
      medium: selectedArticles.filter(a => a.pr_relevance_score >= 30 && a.pr_relevance_score < 70).length,
      low: selectedArticles.filter(a => a.pr_relevance_score < 30).length
    };
    
    const categoryBreakdown = selectedArticles.reduce((acc, article) => {
      acc[article.pr_category] = (acc[article.pr_category] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate actual coverage achieved
    const coverageAchieved = {
      competitors: Array.from(coverageTracker.competitors.keys()),
      stakeholders: Array.from(coverageTracker.stakeholders.keys()),
      keywords: Array.from(coverageTracker.keywords.keys())
    };
    
    console.log('✅ PR relevance scoring complete:', {
      input_count: articles.length,
      output_count: selectedArticles.length,
      articles_with_extraction: selectedArticles.filter(a => a.pr_extraction?.mentioned_entities?.length > 0).length,
      avg_score: selectedArticles.reduce((sum, a) => sum + a.pr_relevance_score, 0) / selectedArticles.length,
      score_distribution: scoreDistribution,
      category_breakdown: categoryBreakdown,
      coverage_achieved: {
        competitors_covered: coverageAchieved.competitors.length,
        stakeholders_covered: coverageAchieved.stakeholders.length,
        keywords_covered: coverageAchieved.keywords.length
      }
    });
    
    // Log top articles for debugging
    console.log('🏆 Top 5 articles:');
    selectedArticles.slice(0, 5).forEach((article, i) => {
      console.log(`  ${i + 1}. [${article.pr_relevance_score}] "${article.title?.substring(0, 60)}..."`);
      if (article.pr_factors.length > 0) {
        console.log(`     Factors: ${article.pr_factors.slice(0, 3).join(', ')}`);
      }
    });
    
    // MCP FIRECRAWL ENHANCEMENT: Dynamic tiered scraping for maximum intelligence
    console.log('🔥 Preparing articles for MCP Firecrawl with tiered strategy');
    
    // Dynamic scraping strategy based on score tiers
    const articlesToScrape = [];
    
    // Tier 1: CRITICAL (score 80+) - Scrape ALL
    const tier1Articles = selectedArticles.filter(a => a.pr_relevance_score >= 80);
    articlesToScrape.push(...tier1Articles.map(a => ({ ...a, tier: 1, scrape: true })));
    
    // Tier 2: HIGH VALUE (score 60-79) - Scrape 80% (increased for better coverage)
    const tier2Articles = selectedArticles.filter(a => a.pr_relevance_score >= 60 && a.pr_relevance_score < 80);
    const tier2Sample = tier2Articles.slice(0, Math.ceil(tier2Articles.length * 0.80));
    articlesToScrape.push(...tier2Sample.map(a => ({ ...a, tier: 2, scrape: true })));
    
    // Tier 3: COVERAGE (score 40-59) - Scrape 40% (increased for diversity)
    const tier3Articles = selectedArticles.filter(a => a.pr_relevance_score >= 40 && a.pr_relevance_score < 60);
    const tier3Sample = tier3Articles.slice(0, Math.ceil(tier3Articles.length * 0.40));
    articlesToScrape.push(...tier3Sample.map(a => ({ ...a, tier: 3, scrape: true })));
    
    // Cap at 30 total for better coverage while maintaining quality control
    const finalScrapeList = articlesToScrape.slice(0, 30);
    
    console.log(`📊 Tiered scraping strategy:`, {
      tier1_critical: tier1Articles.length,
      tier2_selected: tier2Sample.length,
      tier3_selected: tier3Sample.length,
      total_to_scrape: finalScrapeList.length
    });
    
    // Call MCP Firecrawl with batch scraping
    if (finalScrapeList.length > 0) {
      try {
        const firecrawlResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-firecrawl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            method: 'tools/call',
            params: {
              name: 'batch_scrape_articles',
              arguments: {
                articles: finalScrapeList.map(article => ({
                  url: article.url,
                  priority: article.pr_relevance_score,
                  metadata: {
                    title: article.title,
                    tier: article.tier,
                    factors: article.pr_factors,
                    category: article.pr_category
                  }
                })),
                formats: ['markdown'],
                extractSchema: {
                  quotes: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Important quotes from executives or experts'
                  },
                  metrics: {
                    type: 'object',
                    properties: {
                      financial: { type: 'array', items: { type: 'string' } },
                      percentages: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  entities: {
                    type: 'object',
                    properties: {
                      companies: { type: 'array', items: { type: 'string' } },
                      people: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  key_points: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key takeaways for intelligence'
                  }
                },
                maxTimeout: 15000
              }
            }
          })
        });
        
        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json();
          const scrapeResults = JSON.parse(firecrawlData.content[0].text);
          
          console.log('✅ MCP Firecrawl results:', scrapeResults.stats);
          
          // DEBUG: Log sample result structure
          if (scrapeResults.results && scrapeResults.results.length > 0) {
            const sampleResult = scrapeResults.results[0];
            console.log('🔍 Sample Firecrawl result structure:', {
              success: sampleResult.success,
              has_data: !!sampleResult.data,
              has_markdown: !!sampleResult.data?.markdown,
              markdown_length: sampleResult.data?.markdown?.length || 0,
              has_content: !!sampleResult.data?.content,
              content_length: sampleResult.data?.content?.length || 0,
              has_extracted: !!sampleResult.extracted,
              url: sampleResult.url
            });
          }
          
          // Merge scraped content back into articles
          for (const result of scrapeResults.results) {
            if (result.success && result.data) {
              const article = selectedArticles.find(a => a.url === result.url);
              if (article) {
                // CRITICAL FIX: Only set has_full_content if we actually have substantial, valid content
                const markdown = result.data.markdown || result.data.content || '';
                
                // Enhanced validation: Check for real content, not just length
                const hasSubstantialContent = markdown && 
                                           markdown.length > 500 && // Increased minimum length
                                           !/<[^>]+>/g.test(markdown.substring(0, 200)) && // No HTML in first 200 chars
                                           markdown.split(' ').length > 50; // At least 50 words
                
                if (hasSubstantialContent) {
                  article.full_content = markdown;
                  article.content_length = markdown.length;
                  article.has_full_content = true;
                  console.log(`✅ Quality content for ${new URL(article.url).hostname}: ${markdown.length} chars, ${markdown.split(' ').length} words`);
                } else {
                  // Log when we don't get quality content
                  console.warn(`⚠️ Poor quality content for ${article.url}: markdown length = ${markdown?.length}, words = ${markdown?.split(' ').length || 0}`);
                  article.full_content = '';
                  article.content_length = 0;
                  article.has_full_content = false;
                }
                article.firecrawl_extracted = result.extracted || null;
                
                // Add extracted intelligence to pr_extraction
                if (result.extracted) {
                  article.pr_extraction.extracted_quotes = result.extracted.quotes || [];
                  article.pr_extraction.extracted_metrics = result.extracted.metrics || {};
                  article.pr_extraction.extracted_entities = result.extracted.entities || {};
                  article.pr_extraction.key_points = result.extracted.key_points || [];
                  article.pr_extraction.has_actionable_data = true;
                }
              }
            }
          }
          
          const enhancedCount = selectedArticles.filter(a => a.has_full_content).length;
          const withRealContent = selectedArticles.filter(a => a.full_content && a.full_content.length > 100).length;
          console.log(`🎯 Enhanced ${enhancedCount} articles with full content and extraction`);
          console.log(`📊 Final content status: ${withRealContent} have real content, ${selectedArticles.length - withRealContent} without`);
        }
      } catch (error) {
        console.error('❌ MCP Firecrawl error:', error);
        // Continue without scraping - fallback to RSS summaries
      }
    }
    
    return new Response(JSON.stringify({
      findings: selectedArticles,
      articles: selectedArticles, // Include both for compatibility
      statistics: {
        total_processed: articles.length,
        total_selected: selectedArticles.length,
        avg_relevance_score: Math.round(selectedArticles.reduce((sum, a) => sum + a.pr_relevance_score, 0) / selectedArticles.length),
        score_distribution: scoreDistribution,
        category_breakdown: categoryBreakdown,
        extraction_summary: {
          companies_found: coverageAchieved.competitors.length,
          stakeholders_found: coverageAchieved.stakeholders.length,
          keywords_matched: coverageAchieved.keywords.length,
          crisis_signals: selectedArticles.filter(a => a.pr_extraction?.has_crisis_signal).length,
          opportunity_signals: selectedArticles.filter(a => a.pr_extraction?.has_opportunity_signal).length
        },
        coverage_achieved: coverageAchieved
      },
      metadata: {
        stage: 'relevance_scoring',
        organization: organization_name,
        profile_used: !!profile,
        timestamp: new Date().toISOString(),
        coverage_report: coverage_report  // Pass it along to enrichment
      },
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Relevance scoring error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stage: 'relevance_scoring'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});