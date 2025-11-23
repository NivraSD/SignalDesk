/**
 * Monitoring Stage 2: Claude-Enhanced Data Extraction & Intelligence Layer
 * Uses Claude to deeply analyze ~30 full-content articles from relevance stage
 * Intelligently decides if additional articles need fetching based on coverage gaps
 * Provides high-quality extracted intelligence for synthesis
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

/**
 * HTML cleaning and validation utilities
 */
function stripHtmlTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function isValidContent(text: string): boolean {
  if (!text || text.length < 50) return false; // Increased minimum length
  
  // Check for HTML garbage patterns
  const htmlGarbagePatterns = [
    /<[^>]+>/,  // Contains HTML tags
    /&[^;]+;/,  // Contains HTML entities
    /^[\s\W]{0,10}$/, // Only whitespace/punctuation
    /^(undefined|null|NaN)$/i, // Invalid values
    /^\[.*\]$/,  // Looks like array stringification
    /^{.*}$/,    // Looks like object stringification
  ];
  
  // EXPANDED navigation/garbage patterns based on rawResponse.md
  const navigationPatterns = [
    /\]\s*\[/,  // Multiple bracketed items in sequence
    /https?:\/\/[^\s]+\.(com|org|net)/i,  // URLs in content
    /\(https:\/\//,  // Markdown-style links
    /Stock Lists|IBD 50|Sector Leaders/i,  // IBD navigation
    /Log In|Sign Up|Subscribe|Accessibility/i,  // Auth UI
    /Cookie|cookie|privacy policy/i,  // Legal text
    // NEW: Specific garbage patterns from rawResponse.md
    /ft-content-uuid/i,  // Financial Times URLs
    /ffer\//,  // Broken URL fragments
    /What's included/i,  // Subscription promos
    /Expert opinion/i,  // Menu items
    /FT App|Android & iOS/i,  // App promotion
    /FirstFT|curated newsletters/i,  // Newsletter signup
    /Follow topics|set al/i,  // UI elements
    /Forward-Looking Statements/i,  // Legal boilerplate
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}/i,  // UUIDs
    /41218b9e-c8ae-c934/i,  // Specific UUID garbage
    /\) What$/,  // Truncated text
    /20\+ curated/i,  // Newsletter count
    /©|\(c\)|Copyright/i,  // Copyright notices
    /Menu|Navigation|Header|Footer/i,  // Navigation keywords
    /\w+\]\(\/\w+/,  // Markdown links pattern
  ];
  
  const hasHTMLGarbage = htmlGarbagePatterns.some(pattern => pattern.test(text));
  const hasNavigation = navigationPatterns.some(pattern => pattern.test(text));
  
  if (hasHTMLGarbage || hasNavigation) return false;
  
  // Additional quality checks
  const words = text.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 8) return false; // Need at least 8 real words
  
  // Check for too many special characters (likely garbage)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,'"\-]/g) || []).length / text.length;
  if (specialCharRatio > 0.25) return false; // More than 25% special chars is suspicious
  
  return true;
}

function extractValidText(content: string, maxLength = 200): string {
  if (!content) return '';
  
  const cleaned = stripHtmlTags(content);
  if (!isValidContent(cleaned)) return '';
  
  return cleaned.substring(0, maxLength);
}

/**
 * Claude-powered deep analysis of articles with full content
 */
async function analyzeWithClaude(articlesWithContent: any[], profile: any, orgName: string, coverageContext?: any) {
  console.log(`🔍 analyzeWithClaude called with ${articlesWithContent.length} articles, API key exists: ${!!ANTHROPIC_API_KEY}`);

  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is missing!');
    return null;
  }

  if (articlesWithContent.length === 0) {
    console.log('⚠️ Claude analysis skipped - no articles provided');
    return null;
  }

  try {
    console.log(`🤖 Using Claude to deeply analyze ${articlesWithContent.length} full-content articles...`);

    // Extract company profile and intelligence context
    const companyProfile = profile?.company_profile || {};
    const intelligenceContext = profile?.intelligence_context;

    // Prepare discovery targets - FULLY DYNAMIC
    const targets = {
      organization: orgName || profile?.organization_name || profile?.organization,
      competitors: [
        ...(profile?.competition?.direct_competitors || []),
        ...(profile?.competition?.indirect_competitors || []),
        ...(profile?.competition?.emerging_threats || [])
      ].filter(Boolean).slice(0, 30),
      stakeholders: [
        ...(profile?.stakeholders?.regulators || []),
        ...(profile?.stakeholders?.major_investors || []),
        ...(profile?.stakeholders?.major_customers || []),
        ...(profile?.stakeholders?.partners || []),
        ...(profile?.stakeholders?.executives || []),
        ...(profile?.stakeholders?.critics || []),
        ...(profile?.stakeholders?.influencers || [])
      ].filter(Boolean).slice(0, 20),
      topics: [
        ...(profile?.monitoring_config?.keywords || []),
        ...(profile?.keywords || []),
        ...(profile?.topics || []),
        ...(intelligenceContext?.topics || []),
        ...(profile?.trending?.hot_topics || [])
      ].filter(Boolean).slice(0, 40),
      extraction_focus: intelligenceContext?.extraction_focus || []
    };

    // DEBUG: Log what targets we're using
    console.log(`🎯 Intelligence targets loaded:`, {
      organization: targets.organization,
      competitors: targets.competitors,
      stakeholders: targets.stakeholders.slice(0, 5),
      topics: targets.topics.slice(0, 5)
    });

    // Process articles in batches optimized for full content summarization
    // Smaller batches = more content per article for better summaries
    const batchSize = 15; // 15 articles × ~8K chars = ~120K tokens (fits in Haiku's 200K context)
    const allExtractedData = {
      events: [],
      entities: [],
      quotes: [],
      metrics: [],
      insights: [],
      gaps: [],
      recommendations: [],
      summaries: [] // NEW: Article summaries from Claude
    };
    
    for (let i = 0; i < articlesWithContent.length; i += batchSize) {
      const batch = articlesWithContent.slice(i, i + batchSize);
      
      const prompt = `You are summarizing articles for ${targets.organization}'s intelligence synthesis.

🎯 CONTEXT:
${targets.organization} monitors these competitors: ${targets.competitors.slice(0, 10).join(', ')}
${targets.stakeholders.length > 0 ? `Key stakeholders: ${targets.stakeholders.slice(0, 5).join(', ')}` : ''}
${intelligenceContext?.monitoring_prompt || ''}

YOUR JOB: Create concise, actionable summaries that help executive synthesis understand what's relevant.

ARTICLES TO SUMMARIZE:
${batch.map((a, idx) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTICLE ${idx + 1}
Title: ${a.title}
Source: ${a.source}
Content: ${a.full_content?.substring(0, 8000) || a.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`).join('\n\n')}

For EACH article, provide:
1. **Summary** (2-3 sentences): What happened and why it matters
2. **Relevance** tags: competitor_move | regulatory_change | market_shift | crisis_signal | opportunity
3. **Key points** (3-5 bullets): Specific facts, quotes, or data points
4. **Entities mentioned**: Any competitors or stakeholders from the monitoring list

Return ONLY valid JSON in this EXACT format:
{
  "summaries": [
    {
      "article_id": 1,
      "title": "Article title",
      "summary": "2-3 sentence summary focusing on what matters to ${targets.organization}",
      "relevance_tags": ["competitor_move", "market_shift"],
      "key_points": [
        "Specific fact or quote",
        "Important data point",
        "Strategic implication"
      ],
      "entities_mentioned": {
        "competitors": ["Name if mentioned"],
        "stakeholders": ["Name if mentioned"]
      }
    }
  ]
}

RULES:
- Be concise but informative - synthesis will use these summaries
- Focus on facts, not speculation
- Tag relevance accurately (helps synthesis prioritize)
- Only list competitors/stakeholders actually mentioned in the article
- If article isn't relevant to ${targets.organization}, say so in summary`;

      // DEBUG: Log entity extraction rules being sent to Claude
      const entityRulesStart = prompt.indexOf('CRITICAL ENTITY EXTRACTION RULES:');
      if (entityRulesStart !== -1) {
        const rulesSection = prompt.substring(entityRulesStart, entityRulesStart + 800);
        console.log(`📋 Entity extraction rules sent to Claude:\n${rulesSection}`);
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content?.[0]?.text || '{}';

        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\{[^]*\}/s);
          const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

          // DEBUG: Show what entities Claude extracted
          if (extracted.events && extracted.events.length > 0) {
            const extractedEntities = extracted.events.map((e: any) => e.entity).filter(Boolean);
            const uniqueEntities = [...new Set(extractedEntities)];
            console.log(`🔍 Claude extracted ${extracted.events.length} events with entities:`, uniqueEntities.slice(0, 10));
          }

          // TRANSFORMATION LAYER: Normalize event structure
          if (extracted.events) {
            const normalizedEvents = extracted.events.map((event: any) => {
              // Handle both new structured format and legacy formats
              if (event.type && event.entity && event.description) {
                // Already in correct format
                return event;
              } else if (event.date && event.event && event.significance) {
                // Legacy format from previous prompt - transform it
                return {
                  type: 'general',
                  entity: 'Unknown', // Extract from event text if possible
                  description: event.event,
                  category: 'market',
                  date: event.date
                };
              } else {
                // Unrecognized format - try to salvage it
                return {
                  type: event.type || 'general',
                  entity: event.entity || event.company || event.person || 'Unknown',
                  description: event.description || event.event || event.text || 'No description',
                  category: event.category || 'market',
                  date: event.date || event.timestamp
                };
              }
            }).filter(e => e.entity !== 'Unknown' && e.description !== 'No description'); // Filter out garbage

            // 🔥 CRITICAL FIX: Use article publish dates, not Claude's extraction
            // Claude might extract wrong dates from content
            // Use the article's published_at (which comes from Firecrawl or title parsing)
            // Build a map of article index to published_at
            const articleDates = new Map();
            batch.forEach((article, idx) => {
              // Try to extract date from title if published_at is missing or defaulted to now
              let articleDate = article.published_at;

              // If no published_at or it was defaulted to "now", try parsing title
              const hasExtractedDate = article.had_published_time || false;
              if (!hasExtractedDate && article.title) {
                // Look for dates in title like "11/14/2025" or "November 14, 2025"
                const dateMatches = article.title.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\w+ \d{1,2},? \d{4})/);
                if (dateMatches) {
                  try {
                    const parsedDate = new Date(dateMatches[0]);
                    if (!isNaN(parsedDate.getTime())) {
                      articleDate = parsedDate.toISOString();
                      console.log(`   📅 Extracted date from title: "${dateMatches[0]}" → ${articleDate}`);
                    }
                  } catch (e) {
                    // Parsing failed, use article.published_at
                  }
                }
              }

              articleDates.set(idx, articleDate || new Date().toISOString());
            });

            // Map events to their source articles' dates
            normalizedEvents.forEach(event => {
              // Events don't have article index, so use current batch start time as fallback
              // This is better than using Claude's extracted dates which can be wrong
              event.date = articleDates.get(0) || new Date().toISOString();
            });

            allExtractedData.events.push(...normalizedEvents);
          }

          if (extracted.entities) allExtractedData.entities.push(...extracted.entities);
          if (extracted.quotes) allExtractedData.quotes.push(...extracted.quotes);
          if (extracted.metrics) allExtractedData.metrics.push(...extracted.metrics);
          if (extracted.insights) allExtractedData.insights.push(...extracted.insights);
          if (extracted.discovery_matches) {
            allExtractedData.recommendations.push(`Coverage found: ${JSON.stringify(extracted.discovery_matches)}`);
          }

          // NEW: Extract summaries from Claude's response
          if (extracted.summaries && Array.isArray(extracted.summaries)) {
            // Map summaries to include article data from batch
            const enrichedSummaries = extracted.summaries.map((summary: any) => {
              const article = batch[summary.article_id - 1]; // article_id is 1-indexed
              return {
                ...summary,
                url: article?.url,
                source: article?.source,
                published_at: article?.published_at || article?.created_at
              };
            });
            allExtractedData.summaries.push(...enrichedSummaries);
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse Claude extraction for batch, skipping');
        }
      } else {
        console.log(`⚠️ Claude API error: ${response.status}`);
      }
    }
    
    console.log(`✅ Claude analysis complete:`);
    console.log(`   - Summaries created: ${allExtractedData.summaries.length}`);
    console.log(`   - Events extracted: ${allExtractedData.events.length}`);
    console.log(`   - Entities found: ${allExtractedData.entities.length}`);
    console.log(`   - Quotes captured: ${allExtractedData.quotes.length}`);
    console.log(`   - Insights generated: ${allExtractedData.insights.length}`);
    
    return allExtractedData;
  } catch (error) {
    console.error('❌ Claude analysis error:', error.message);
    return null;
  }
}

/**
 * Decide if we need to fetch additional articles based on coverage report gaps
 */
function identifyArticlesToFetch(coverageReport: any, articlesWithoutContent: any[], profile: any) {
  if (!coverageReport || !coverageReport.gaps) {
    return [];
  }
  
  const articlesToFetch = [];
  // Use gaps from coverage report instead of Claude analysis
  const gapCompetitors = coverageReport.gaps.competitors || [];
  const gapStakeholders = coverageReport.gaps.stakeholders || [];
  const gapTopics = coverageReport.gaps.topics || [];
  
  // Check if articles could fill identified gaps
  articlesWithoutContent.forEach(article => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    
    let shouldFetch = false;
    
    // Check for gap competitors
    if (gapCompetitors.length > 0) {
      if (gapCompetitors.some(comp => text.includes(comp.toLowerCase()))) {
        shouldFetch = true;
      }
    }
    
    // Check for gap stakeholders
    if (gapStakeholders.length > 0) {
      if (gapStakeholders.some(sh => text.includes(sh.toLowerCase()))) {
        shouldFetch = true;
      }
    }
    
    // Check for gap topics
    if (gapTopics.length > 0) {
      if (gapTopics.some(topic => text.includes(topic.toLowerCase()))) {
        shouldFetch = true;
      }
    }
    
    if (shouldFetch) {
      articlesToFetch.push(article);
    }
  });
  
  // Limit to 5 additional fetches to avoid timeout
  return articlesToFetch.slice(0, 5);
}

/**
 * Fallback pattern-based extraction for articles without Claude analysis
 */
function extractAndOrganizeData(articles: any[], profile: any, organization_name: string, claudeData?: any) {
  console.log(`📊 Organizing data from ${articles.length} articles (Claude-enhanced: ${!!claudeData})`);
  
  // DEBUG: Log what we're receiving
  if (articles.length > 0) {
    const sample = articles[0];
    console.log('🔍 DEBUG - Sample article structure:', {
      has_full_content: sample.has_full_content,
      full_content_exists: !!sample.full_content,
      full_content_length: sample.full_content?.length || 0,
      content_length_field: sample.content_length,
      keys: Object.keys(sample).slice(0, 20)
    });
  }
  
  // CRITICAL: Process both full content and partial content intelligently
  // Full content articles get deep extraction, partial content gets metadata extraction
  const articlesWithFullContent = articles.filter(a => a.has_full_content && a.full_content && a.full_content.length > 500);
  const articlesWithPartialContent = articles.filter(a => 
    (!a.has_full_content || !a.full_content || a.full_content.length <= 500) &&
    (a.description || a.content || a.summary || a.title)
  );
  const articlesWithContent = [...articlesWithFullContent, ...articlesWithPartialContent];
  const articlesWithoutContent = articles.filter(a => 
    !articlesWithContent.includes(a)
  );
  
  console.log(`📊 Article content breakdown:`, {
    total: articles.length,
    with_full_content: articlesWithFullContent.length,
    with_partial_content: articlesWithPartialContent.length,
    with_any_content: articlesWithContent.length,
    with_firecrawl: articles.filter(a => a.firecrawl_extracted).length,
    has_full_content_true: articles.filter(a => a.has_full_content === true).length,
    has_full_content_field: articles.filter(a => a.full_content).length
  });
  
  // INTELLIGENCE TARGETS from the profile - FULLY DYNAMIC
  // Use intelligence context if available for better extraction
  const intelligenceContext = profile?.intelligence_context;

  // Helper to extract names and convert to lowercase
  const extractNamesLower = (items: any[]) => items.map(item => {
    const name = typeof item === 'string' ? item : item?.name;
    return name?.toLowerCase();
  }).filter(Boolean);

  const targets = {
    competitors: extractNamesLower([
      ...(profile?.competition?.direct_competitors || []),
      ...(profile?.competition?.indirect_competitors || []),
      ...(profile?.competition?.emerging_threats || [])
    ]),

    stakeholders: extractNamesLower([
      ...(profile?.stakeholders?.regulators || []),
      ...(profile?.stakeholders?.key_analysts || []),  // NEW: Analysts who cover this industry
      ...(profile?.stakeholders?.activists || []),     // NEW: Critics, activist groups
      ...(profile?.stakeholders?.major_investors || []),
      ...(profile?.stakeholders?.major_customers || []),
      ...(profile?.stakeholders?.key_partners || [])   // Renamed from 'partners'
    ]),

    keywords: [
      ...(profile?.monitoring_config?.keywords || []),
      ...(profile?.keywords || []),
      ...(profile?.topics || []),
      ...(intelligenceContext?.topics || []),
      ...(profile?.trending?.hot_topics || [])
    ].map(k => k?.toLowerCase()).filter(Boolean),

    organization: [organization_name, profile?.organization_name, profile?.organization]
      .map(o => o?.toLowerCase()).filter(Boolean),

    // Add extraction focus from intelligence context
    extraction_focus: intelligenceContext?.extraction_focus || []
  };
  
  console.log(`🎯 Intelligence targets:`, {
    competitors: targets.competitors.length,
    stakeholders: targets.stakeholders.length,
    keywords: targets.keywords.length
  });
  
  // Core data containers
  const events = new Map(); // Deduplicated events
  const entities = new Map(); // Deduplicated entities
  const quotes = [];
  const metrics = [];
  const articleSummaries = [];
  
  // Process both full and partial content articles intelligently
  articlesWithContent.forEach((article, idx) => {
    // Use full content if available, otherwise use whatever we have
    const content = article.full_content || 
                   article.content || 
                   article.description || 
                   article.summary || 
                   `${article.title || ''} ${article.description || ''}`;
    const title = article.title || '';
    const hasFullContent = article.has_full_content && article.full_content && article.full_content.length > 500;
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Create article summary (condensed version for synthesis)
    const summary = {
      id: idx,
      title: title.substring(0, 200),
      url: article.url,
      source: article.source,
      published: article.published_at,
      relevance_score: article.pr_relevance_score || 0,
      category: article.pr_category,
      // Condensed content - just the key parts
      summary: content.substring(0, 500),
      has_full_content: hasFullContent,
      content_quality: hasFullContent ? 'full' : 'partial',
      content_length: content.length
    };
    
    // Extract from Firecrawl data if available
    if (article.firecrawl_extracted || article.pr_extraction) {
      const extracted = article.firecrawl_extracted || article.pr_extraction || {};
      
      // Add quotes with source
      if (extracted.quotes) {
        extracted.quotes.forEach(quote => {
          if (quote && quote.length > 30) {
            quotes.push({
              text: quote,
              article_id: idx,
              article_title: title.substring(0, 100),
              url: article.url
            });
          }
        });
      }
      
      // Add entities - handle both v1 format (nested) and v2 format (flat array)
      const extractedEntities = [
        // v2 format: flat array of entities
        ...(Array.isArray(extracted.entities) ? extracted.entities : []),
        // v1 format: nested structure
        ...(extracted.entities?.companies || []),
        ...(extracted.entities?.people || []),
        // Fallback fields
        ...(extracted.mentioned_entities || [])
      ];
      
      extractedEntities.forEach(entityName => {
        if (!entityName || entityName.length < 2) return;
        
        if (!entities.has(entityName)) {
          entities.set(entityName, {
            name: entityName,
            type: extracted.entities?.people?.includes(entityName) ? 'person' : 'company',
            mentions: [],
            total_mentions: 0
          });
        }
        
        const entity = entities.get(entityName);
        entity.mentions.push({
          article_id: idx,
          article_title: title.substring(0, 100),
          context: findContext(content, String(entityName), 100)
        });
        entity.total_mentions++;
      });
      
      // Add metrics - handle both v1 format (nested) and v2 format (flat array)
      if (extracted.metrics) {
        // v2 format: flat array of metrics
        if (Array.isArray(extracted.metrics)) {
          metrics.push(...extracted.metrics.map(m => ({
            type: /\$|billion|million|thousand/i.test(m) ? 'financial' : 'general',
            value: m,
            article_id: idx
          })));
        } 
        // v1 format: nested structure
        else {
          if (extracted.metrics.financial) {
            metrics.push(...extracted.metrics.financial.map(m => ({
              type: 'financial',
              value: m,
              article_id: idx
            })));
          }
          if (extracted.metrics.percentages) {
            metrics.push(...extracted.metrics.percentages.map(m => ({
              type: 'percentage',
              value: m,
              article_id: idx
            })));
          }
        }
      }
      
      // Add key points to summary - handle both formats
      if (extracted.key_points || extracted.keyPoints) {
        summary.key_points = (extracted.key_points || extracted.keyPoints || []).slice(0, 3);
      }
    }
    
    // SMART EVENT EXTRACTION - Look for mentions of our targets
    const smartEvents = [];
    
    // Check for competitor mentions
    targets.competitors.forEach(competitor => {
      if (lowerContent.includes(competitor) || lowerTitle.includes(competitor)) {
        // Look for context around competitor mention
        const index = lowerContent.indexOf(competitor);
        if (index >= 0) {
          const start = Math.max(0, index - 150);
          const end = Math.min(content.length, index + competitor.length + 150);
          const context = content.substring(start, end);
          
          // Determine event type based on context
          let eventType = 'competitive';
          if (/recall|defect|problem|issue|flaw/i.test(context)) eventType = 'competitor_crisis';
          else if (/launch|unveil|announce|release|introduce/i.test(context)) eventType = 'competitor_product';
          else if (/partner|deal|agreement|contract/i.test(context)) eventType = 'competitor_partnership';
          else if (/expand|factory|plant|facility/i.test(context)) eventType = 'competitor_expansion';
          
          smartEvents.push({
            type: eventType,
            entity: competitor,
            context: extractValidText(context, 300),
            relevance: 'HIGH'
          });
        }
      }
    });
    
    // Check for stakeholder mentions
    targets.stakeholders.forEach(stakeholder => {
      if (lowerContent.includes(stakeholder) || lowerTitle.includes(stakeholder)) {
        const index = lowerContent.indexOf(stakeholder);
        if (index >= 0) {
          const start = Math.max(0, index - 150);
          const end = Math.min(content.length, index + stakeholder.length + 150);
          const context = content.substring(start, end);
          
          let eventType = 'regulatory';
          if (/invest|stake|share|holding/i.test(context)) eventType = 'investor_activity';
          else if (/fine|penalty|violation|investigation/i.test(context)) eventType = 'regulatory_action';
          
          smartEvents.push({
            type: eventType,
            entity: stakeholder,
            context: extractValidText(context, 300),
            relevance: 'HIGH'
          });
        }
      }
    });
    
    // Check for key topics
    targets.keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        const index = lowerContent.indexOf(keyword);
        if (index >= 0) {
          const start = Math.max(0, index - 150);
          const end = Math.min(content.length, index + keyword.length + 150);
          const context = content.substring(start, end);
          
          if (isValidContent(context)) {
            smartEvents.push({
              type: 'strategic_topic',
              entity: keyword,
              context: extractValidText(context, 300),
              relevance: 'MEDIUM'
            });
          }
        }
      }
    });
    
    // Add smart events to the events map
    smartEvents.forEach(smartEvent => {
      if (smartEvent.context && smartEvent.context.length > 30) {
        const eventKey = `${smartEvent.type}:${smartEvent.entity}:${smartEvent.context.substring(0, 50)}`;
        
        if (!events.has(eventKey)) {
          events.set(eventKey, {
            type: smartEvent.type,
            description: smartEvent.context,
            entity: smartEvent.entity,
            articles: [],
            validated: true,
            relevance: smartEvent.relevance
          });
        }
        
        events.get(eventKey).articles.push({
          id: idx,
          title: title.substring(0, 100),
          url: article.url
        });
      }
    });
    
    // ALSO extract general events from article content if we have it
    if (content && content.length > 100) {
      // Look for event patterns in the content
      const eventPatterns = [
        { pattern: /announced|announces|unveils?|launches?|introduces?/gi, type: 'announcement' },
        { pattern: /partners?|partnership|collaboration|deal|agreement/gi, type: 'partnership' },
        { pattern: /acquires?|acquisition|merger|buys?|purchase/gi, type: 'acquisition' },
        { pattern: /invests?|investment|funding|raises?|valuation/gi, type: 'investment' },
        { pattern: /expands?|expansion|opens?|new facility|new plant/gi, type: 'expansion' },
        { pattern: /layoffs?|cuts?|restructur|downsiz/gi, type: 'restructuring' },
        { pattern: /lawsuit|sues?|legal|court|ruling/gi, type: 'legal' },
        { pattern: /recall|defect|issue|problem|flaw/gi, type: 'product_issue' }
      ];
      
      eventPatterns.forEach(({ pattern, type }) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          // Extract context around the match
          const firstMatch = matches[0];
          const context = findContext(content, firstMatch, 200);
          if (context && context.length > 50 && isValidContent(context)) {
            const eventKey = `${type}:general:${context.substring(0, 50)}`;
            if (!events.has(eventKey)) {
              // Try to extract entity from context or use "Market" as fallback
              let entityName = 'Market'; // Default for general market events

              // Try to find a competitor or stakeholder mentioned in the context
              const contextLower = context.toLowerCase();
              const foundCompetitor = targets.competitors.find(c =>
                c && contextLower.includes(c.toLowerCase())
              );
              const foundStakeholder = targets.stakeholders.find(s =>
                s && contextLower.includes(s.toLowerCase())
              );

              if (foundCompetitor) {
                entityName = foundCompetitor;
              } else if (foundStakeholder) {
                entityName = foundStakeholder;
              } else {
                // Try to extract company name from context (look for capitalized words)
                const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
                const matches = context.match(companyPattern);
                if (matches && matches.length > 0) {
                  // Filter out common words
                  const potentialEntity = matches.find(m =>
                    m.length > 3 &&
                    !['The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Why', 'How'].includes(m)
                  );
                  if (potentialEntity) {
                    entityName = potentialEntity;
                  }
                }
              }

              events.set(eventKey, {
                type: type,
                description: extractValidText(context, 300),
                entity: entityName, // Use extracted entity or "Market"
                articles: [],
                validated: false,
                relevance: 'MEDIUM'
              });
            }
            events.get(eventKey).articles.push({
              id: idx,
              title: title.substring(0, 100),
              url: article.url
            });
          }
        }
      });
    }
    
    articleSummaries.push(summary);
  });
  
  // For articles WITHOUT content, just add basic summaries (NO EXTRACTION AT ALL)
  articlesWithoutContent.forEach((article, idx) => {
    // Clean the description to prevent HTML garbage
    const cleanDescription = extractValidText(article.description || '', 500);
    
    const summary = {
      id: articlesWithContent.length + idx, // Continue numbering
      title: extractValidText(article.title || '', 200),
      url: article.url,
      source: article.source,
      published: article.published_at,
      relevance_score: article.pr_relevance_score || 0,
      category: article.pr_category,
      summary: cleanDescription,
      has_full_content: false,
      content_length: 0,
      // CRITICAL: No extraction data - this prevents HTML garbage from flowing downstream
      key_points: [],
      extraction_skipped: 'No full content available - extraction skipped to prevent garbage data'
    };
    
    // IMPORTANT: Do NOT add these articles to event/entity extraction
    // Only add to summaries for basic tracking
    articleSummaries.push(summary);
  });
  
  // Convert to arrays and organize
  const organizedEvents = Array.from(events.values())
    .sort((a, b) => b.articles.length - a.articles.length) // Most mentioned first
    .slice(0, 50);
  
  const organizedEntities = Array.from(entities.values())
    .sort((a, b) => b.total_mentions - a.total_mentions)
    .slice(0, 100);
  
  // Group articles by theme/topic for easier consumption
  const articlesByCategory = {};
  articleSummaries.forEach(summary => {
    const category = summary.category || 'general';
    if (!articlesByCategory[category]) {
      articlesByCategory[category] = [];
    }
    articlesByCategory[category].push(summary);
  });
  
  // Create topic clusters based on co-occurrence
  const topicClusters = createTopicClusters(organizedEvents, organizedEntities);
  
  // Log extraction quality with warnings
  const qualityWarnings = [];
  
  if (articlesWithContent.length === 0) {
    qualityWarnings.push('NO_FULL_CONTENT_AVAILABLE');
  }
  
  if (organizedEvents.length === 0) {
    qualityWarnings.push('NO_EVENTS_EXTRACTED');
  }
  
  if (quotes.length === 0 && articlesWithContent.length > 0) {
    qualityWarnings.push('NO_QUOTES_FOUND');
  }
  
  console.log(`✅ Extraction complete:`, {
    articles_with_full_content: articlesWithFullContent.length,
    articles_with_partial_content: articlesWithPartialContent.length,
    total_processed: articlesWithContent.length,
    events_extracted: organizedEvents.length,
    entities_found: organizedEntities.length,
    quotes_extracted: quotes.length,
    metrics_found: metrics.length,
    quality_score: articlesWithContent.length > 0 ? 'HIGH' : 'LOW',
    warnings: qualityWarnings,
    extraction_success_rate: `${((articlesWithContent.length / articles.length) * 100).toFixed(1)}%`
  });
  
  return {
    // Raw extracted data
    events: organizedEvents,
    entities: organizedEntities,
    quotes: quotes.slice(0, 50),
    metrics: metrics.slice(0, 50),
    
    // Organized summaries
    article_summaries: articleSummaries,
    articles_by_category: articlesByCategory,
    topic_clusters: topicClusters,
    
    // Statistics for context
    stats: {
      total_articles: articles.length,
      articles_with_full_content: articlesWithFullContent.length,
      articles_with_partial_content: articlesWithPartialContent.length,
      articles_processed: articlesWithContent.length,
      unique_events: organizedEvents.length,
      unique_entities: organizedEntities.length,
      articles_with_firecrawl_data: articles.filter(a => a.has_full_content).length,
      articles_with_extraction: articles.filter(a => a.firecrawl_extracted || a.pr_extraction).length,
      category_distribution: Object.entries(articlesByCategory).map(([cat, arts]) => ({
        category: cat,
        count: arts.length
      }))
    }
  };
}

function findContext(text: string, term: string | any, contextLength: number): string {
  // Ensure term is a string
  if (!term || typeof term !== 'string') return '';
  if (!text || typeof text !== 'string') return '';

  const termStr = String(term);
  const index = text.toLowerCase().indexOf(termStr.toLowerCase());
  if (index === -1) return '';

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + termStr.length + contextLength / 2);
  return text.substring(start, end).trim();
}

function createTopicClusters(events: any[], entities: any[]) {
  const clusters = new Map();
  
  // Group events by type
  events.forEach(event => {
    if (!clusters.has(event.type)) {
      clusters.set(event.type, {
        theme: event.type,
        events: [],
        entities: new Set(),
        article_count: 0
      });
    }
    
    const cluster = clusters.get(event.type);
    cluster.events.push(event.description.substring(0, 200));
    cluster.article_count += event.articles.length;
    
    // Extract entities from event description
    entities.forEach(entity => {
      if (event.description.includes(entity.name)) {
        cluster.entities.add(entity.name);
      }
    });
  });
  
  return Array.from(clusters.values()).map(cluster => ({
    theme: cluster.theme,
    events: cluster.events.slice(0, 5),
    key_entities: Array.from(cluster.entities).slice(0, 10),
    article_count: cluster.article_count
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { articles, profile, organization_name, coverage_report } = await req.json();

    // Extract company_profile from profile (passed by orchestrator from discovery)
    const companyProfile = profile?.company_profile || {};

    console.log(`📊 Enrichment received ${articles?.length || 0} articles`);

    // Log article dates to understand timeframe
    if (articles && articles.length > 0) {
      const sortedArticles = [...articles].sort((a, b) =>
        new Date(b.published_at || b.publishedAt || 0).getTime() -
        new Date(a.published_at || a.publishedAt || 0).getTime()
      );

      const newest = sortedArticles[0];
      const oldest = sortedArticles[sortedArticles.length - 1];

      console.log('📅 ARTICLE TIMEFRAME IN ENRICHMENT:');
      console.log(`  - Newest article: ${newest.published_at || newest.publishedAt} - "${newest.title?.substring(0, 50)}..."`);
      console.log(`  - Oldest article: ${oldest.published_at || oldest.publishedAt} - "${oldest.title?.substring(0, 50)}..."`);

      // Check for date distribution
      const today = new Date();
      const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const last24h = articles.filter(a => new Date(a.published_at || a.publishedAt || 0) > oneDayAgo).length;
      const last3Days = articles.filter(a => new Date(a.published_at || a.publishedAt || 0) > threeDaysAgo).length;
      const last7Days = articles.filter(a => new Date(a.published_at || a.publishedAt || 0) > sevenDaysAgo).length;

      console.log('📊 ARTICLE AGE DISTRIBUTION:');
      console.log(`  - Last 24 hours: ${last24h} articles`);
      console.log(`  - Last 3 days: ${last3Days} articles`);
      console.log(`  - Last 7 days: ${last7Days} articles`);
      console.log(`  - Older than 7 days: ${articles.length - last7Days} articles`);
    }

    // Log coverage context if provided
    if (coverage_report) {
      console.log('📄 Coverage context received:', coverage_report.context || 'No context');
    }
    
    console.log('🚀 Data Extraction Starting:', {
      organization: organization_name,
      articles: articles?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!articles || !articles.length) {
      return new Response(JSON.stringify({
        success: true,
        extracted_data: {
          events: [],
          entities: [],
          quotes: [],
          metrics: [],
          article_summaries: [],
          topic_clusters: []
        },
        stats: { total_articles: 0 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // CRITICAL FIX: Don't wait for full_content - use title + description from ALL articles
    // Process them in LARGER batches since we're not relying on full scrapes
    console.log(`📄 Analyzing ALL ${articles.length} articles with Claude (title + description + any content)`);

    // Step 1: Use Claude to analyze ALL articles in larger batches (not just 30)
    // Since we're using title + description, we can process more at once
    let claudeAnalysis = null;
    if (articles.length > 0) {
      claudeAnalysis = await analyzeWithClaude(articles, profile, organization_name, coverage_report);
    }
    
    // Step 2: Identify if we need to fetch additional articles based on coverage gaps
    // DISABLED: Gap-filling was causing timeouts by making additional Firecrawl calls
    let additionalArticlesToFetch = [];
    const ENABLE_GAP_FILLING = false; // Disabled to prevent timeout
    if (ENABLE_GAP_FILLING && coverage_report && coverage_report.gaps) {
      additionalArticlesToFetch = identifyArticlesToFetch(coverage_report, articlesWithoutFullContent, profile);
      
      if (additionalArticlesToFetch.length > 0) {
        console.log(`🔍 Intelligence gaps detected - fetching ${additionalArticlesToFetch.length} additional articles...`);
        
        // Fetch additional content via Firecrawl
        try {
          const firecrawlResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-firecrawl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
              name: 'batch_scrape_articles',
              arguments: {
                articles: additionalArticlesToFetch.map(a => ({
                  url: a.url,
                  priority: 'gap_fill',
                  metadata: { title: a.title }
                }))
              }
            })
          });
          
          if (firecrawlResponse.ok) {
            const firecrawlData = await firecrawlResponse.json();
            const scrapeResults = JSON.parse(firecrawlData.content?.[0]?.text || '{}');
            
            // Add fetched content to articles and re-analyze with Claude
            if (scrapeResults.results) {
              const newlyFetchedArticles = [];
              scrapeResults.results.forEach((result, idx) => {
                if (result.success && result.content) {
                  const article = additionalArticlesToFetch[idx];
                  article.full_content = result.content;
                  article.has_full_content = true;
                  newlyFetchedArticles.push(article);
                }
              });
              
              if (newlyFetchedArticles.length > 0) {
                console.log(`✅ Successfully fetched ${newlyFetchedArticles.length} gap-filling articles`);
                const gapAnalysis = await analyzeWithClaude(newlyFetchedArticles, profile, organization_name);
                
                // Merge gap analysis with main Claude analysis
                if (gapAnalysis) {
                  if (gapAnalysis.events) claudeAnalysis.events.push(...gapAnalysis.events);
                  if (gapAnalysis.entities) claudeAnalysis.entities.push(...gapAnalysis.entities);
                  if (gapAnalysis.quotes) claudeAnalysis.quotes.push(...gapAnalysis.quotes);
                  if (gapAnalysis.metrics) claudeAnalysis.metrics.push(...gapAnalysis.metrics);
                  if (gapAnalysis.insights) claudeAnalysis.insights.push(...gapAnalysis.insights);
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch gap-filling articles:', error.message);
        }
      }
    }
    
    // Step 3: Combine Claude analysis with pattern-based extraction
    const extractedData = extractAndOrganizeData(articles, profile, organization_name, claudeAnalysis);
    
    // Merge Claude data if available
    if (claudeAnalysis) {
      // Enhance extracted data with Claude's deep analysis
      if (claudeAnalysis.events && claudeAnalysis.events.length > 0) {
        extractedData.events = [...claudeAnalysis.events, ...extractedData.events];
      }
      if (claudeAnalysis.entities && claudeAnalysis.entities.length > 0) {
        extractedData.entities = [...claudeAnalysis.entities, ...extractedData.entities];
      }
      if (claudeAnalysis.quotes && claudeAnalysis.quotes.length > 0) {
        extractedData.quotes = [...claudeAnalysis.quotes, ...extractedData.quotes];
      }
      if (claudeAnalysis.insights && claudeAnalysis.insights.length > 0) {
        extractedData.strategic_insights = claudeAnalysis.insights;
      }
      // NEW: Replace rule-based article summaries with Claude's AI summaries
      if (claudeAnalysis.summaries && claudeAnalysis.summaries.length > 0) {
        extractedData.article_summaries = claudeAnalysis.summaries.map((summary: any) => ({
          id: summary.article_id - 1,
          title: summary.title,
          url: summary.url,
          source: summary.source,
          published: summary.published_at,
          summary: summary.summary,
          relevance_tags: summary.relevance_tags,
          key_points: summary.key_points,
          entities_mentioned: summary.entities_mentioned,
          relevance_score: 75, // Default score for AI-selected articles
          has_full_content: true,
          content_quality: 'full'
        }));
        console.log(`   ✨ Using ${claudeAnalysis.summaries.length} AI-generated article summaries`);
      }
      extractedData.claude_enhanced = true;
      extractedData.intelligence_gaps = claudeAnalysis.gaps || [];
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Extraction complete in ${processingTime}ms:`, {
      events: extractedData.events.length,
      entities: extractedData.entities.length,
      quotes: extractedData.quotes.length,
      clusters: extractedData.topic_clusters.length,
      claude_enhanced: !!claudeAnalysis,
      gaps_filled: additionalArticlesToFetch.length
    });

    // Log EXACTLY what we're sending to synthesis
    console.log('🚀🚀🚀 ENRICHMENT SENDING TO SYNTHESIS:');
    console.log('📊 Events being sent:', extractedData.events.length, 'events');
    console.log('🎯 Sample events:', extractedData.events.slice(0, 3).map(e => ({
      type: e.type,
      description: e.description?.substring(0, 100) + '...',
      entities: e.entities,
      impact: e.impact
    })));
    console.log('👥 Entities being sent:', extractedData.entities.length, 'entities');
    console.log('💬 Quotes being sent:', extractedData.quotes.length, 'quotes');
    console.log('📈 Metrics being sent:', extractedData.metrics.length, 'metrics');
    console.log('📰 Article summaries being sent:', extractedData.article_summaries.length, 'summaries');

    // Log the structure we're sending
    const responsePayload = {
      success: true,

      // CRITICAL: Pass profile with company_profile to synthesis
      profile: profile,

      // Provide data in multiple formats for compatibility
      extracted_data: extractedData,

      // For synthesis - give it the organized data
      organized_intelligence: {
        events: extractedData.events,
        entities: extractedData.entities,
        quotes: extractedData.quotes,
        metrics: extractedData.metrics,
        topic_clusters: extractedData.topic_clusters,
        article_summaries: extractedData.article_summaries
      },
      
      // For opportunity detector - structured data
      structured_data: {
        events_by_type: extractedData.events.reduce((acc, event) => {
          if (!acc[event.type]) acc[event.type] = [];
          acc[event.type].push(event);
          return acc;
        }, {}),
        top_entities: extractedData.entities.slice(0, 20),
        key_quotes: extractedData.quotes.slice(0, 10),
        financial_metrics: extractedData.metrics.filter(m => m.type === 'financial')
      },
      
      // Keep enriched_articles but minimal for compatibility
      enriched_articles: extractedData.article_summaries.map(summary => ({
        ...summary,
        // Preserve pr_ prefixed fields for synthesis compatibility
        pr_category: summary.category,
        pr_relevance_score: summary.relevance_score,
        deep_analysis: {
          strategic_implications: 'See organized_intelligence for analysis',
          competitive_impact: 'See organized_intelligence for analysis',
          key_events: [],
          opportunities: [],
          risks: [],
          market_signals: [],
          stakeholder_impact: '',
          time_sensitivity: summary.relevance_score > 70 ? 'immediate' : 'medium-term',
          data_points: [],
          strategic_category: summary.category || 'general'
        }
      })),
      
      // Provide executive summary with FILTERED data
      executive_summary: {
        // Filter events to only include valid content
        immediate_actions: extractedData.events
          .filter(e => {
            // Only include validated events with clean descriptions
            return e.validated && 
                   e.description && 
                   e.description.length > 50 &&
                   isValidContent(e.description) &&
                   !e.description.includes('ft-content-uuid') &&
                   !e.description.includes('ffer/') &&
                   !e.description.includes("What's included");
          })
          .slice(0, 10)
          .map(e => ({
            title: `${e.type}: ${e.description.substring(0, 100)}`,
            implication: `Mentioned in ${e.articles.length} articles`,
            source: e.articles[0]?.title || 'Multiple sources',
            url: e.articles[0]?.url || '#'
          })),
        strategic_opportunities: extractedData.events
          .filter(e => {
            return e.validated && 
                   (e.type === 'opportunity' || e.type === 'expansion' || e.type === 'product') &&
                   isValidContent(e.description);
          })
          .slice(0, 5)
          .map(e => ({
            opportunity: e.description.substring(0, 200),
            type: e.type,
            articles: e.articles.length
          })),
        competitive_threats: extractedData.events
          .filter(e => {
            return e.validated && 
                   (e.type === 'regulatory' || e.type === 'crisis' || e.type === 'competitive') &&
                   isValidContent(e.description);
          })
          .slice(0, 5)
          .map(e => ({
            threat: e.description.substring(0, 200),
            type: e.type,
            articles: e.articles.length
          })),
        market_trends: extractedData.topic_clusters.map(c => c.theme),
        key_metrics: extractedData.metrics.map(m => m.value).slice(0, 20),
        category_breakdown: extractedData.stats.category_distribution
      },
      
      // Knowledge graph for relationships
      knowledge_graph: {
        entities: {
          companies: extractedData.entities.filter(e => e.type === 'company').slice(0, 50),
          people: extractedData.entities.filter(e => e.type === 'person').slice(0, 50),
          events: extractedData.events.slice(0, 30)
        },
        clusters: extractedData.topic_clusters
      },
      
      statistics: {
        ...extractedData.stats,
        processing_time_ms: processingTime,
        claude_enhanced: extractedData.claude_enhanced || false,
        intelligence_gaps_identified: extractedData.intelligence_gaps?.length || 0,
        gap_articles_fetched: additionalArticlesToFetch.length
      },
      
      // Include Claude's strategic insights if available
      strategic_insights: extractedData.strategic_insights || [],
      intelligence_gaps: extractedData.intelligence_gaps || []
    };

    // Log complete payload structure
    console.log('📦 COMPLETE ENRICHMENT PAYLOAD STRUCTURE:');
    console.log('  - extracted_data: ✅ (full extracted data)');
    console.log('  - organized_intelligence: ✅ (events, entities, quotes, metrics, clusters)');
    console.log('  - structured_data: ✅ (events_by_type, top_entities, key_quotes)');
    console.log('  - enriched_articles: ✅ (', responsePayload.enriched_articles.length, 'articles)');
    console.log('  - executive_summary: ✅ (immediate_actions, threats, trends)');
    console.log('  - knowledge_graph: ✅ (entities and relationships)');
    console.log('  - statistics: ✅ (processing stats)');

    // Log a sample of the actual data being sent
    console.log('🔍 SAMPLE OF ACTUAL DATA BEING SENT:');
    console.log('First 3 events:', JSON.stringify(responsePayload.organized_intelligence.events.slice(0, 3), null, 2));
    console.log('First 5 entities:', JSON.stringify(responsePayload.organized_intelligence.entities.slice(0, 5), null, 2));
    console.log('First 2 quotes:', JSON.stringify(responsePayload.organized_intelligence.quotes.slice(0, 2), null, 2));

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});