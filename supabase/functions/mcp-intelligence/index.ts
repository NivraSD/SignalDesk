import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Intelligence MCP - Marcus Chen PR strategist personality
const TOOLS = [
  {
    name: "analyze_competition_with_personality",
    description: "Analyze competitive landscape with sharp PR strategist insights",
  }
];

// Fast extraction of key events from articles
async function extractCompetitorEvents(findings: any[], competitors: any) {
  const competitorNames = [...competitors.direct, ...competitors.indirect]
    .filter(name => name && name.length > 2)
    .map(name => name.toLowerCase());
  
  const events = [];
  
  for (const finding of findings) {
    const title = (finding.title || '').toLowerCase();
    const content = (finding.content || finding.description || '').toLowerCase();
    const text = `${title} ${content}`;
    
    // Check which competitors are mentioned
    const mentionedCompetitors = competitorNames.filter(comp => text.includes(comp));
    
    if (mentionedCompetitors.length > 0) {
      // Extract key event indicators
      const eventPatterns = [
        { pattern: /\$[\d.]+(m|b|billion|million)/gi, type: 'funding' },
        { pattern: /(raises?|raised|funding|investment|series [a-z])/gi, type: 'funding' },
        { pattern: /(lawsuit|sue|sued|settlement|legal)/gi, type: 'legal' },
        { pattern: /(launch|launches|launched|unveil|announce)/gi, type: 'product' },
        { pattern: /(acquire|acquired|acquisition|merge|merger)/gi, type: 'acquisition' },
        { pattern: /(partner|partnership|collaboration|deal)/gi, type: 'partnership' },
        { pattern: /(layoff|cuts?|eliminate|reduce.*workforce)/gi, type: 'layoffs' },
        { pattern: /(appoint|hired|hires|ceo|cto|executive)/gi, type: 'executive' },
        { pattern: /(ipo|public|listing)/gi, type: 'ipo' },
        { pattern: /(expand|expansion|enter.*market|open)/gi, type: 'expansion' }
      ];
      
      const detectedEvents = [];
      for (const {pattern, type} of eventPatterns) {
        if (pattern.test(text)) {
          detectedEvents.push(type);
        }
      }
      
      // Extract numbers/amounts
      const amountMatch = text.match(/\$[\d.]+(m|b|million|billion)/i);
      const amount = amountMatch ? amountMatch[0] : null;
      
      events.push({
        competitors: mentionedCompetitors,
        title: finding.title,
        event_types: detectedEvents,
        amount: amount,
        source: finding.source,
        date: finding.date || 'today',
        summary: finding.title + (amount ? ` (${amount})` : '')
      });
    }
  }
  
  return events;
}

async function analyzeCompetitionWithPersonality(args: any) {
  const { findings, organization, competition_context, analysis_depth = 'standard' } = args;
  
  console.log('🎯 Marcus Chen MCP Starting:', {
    hasOrg: !!organization,
    findingsCount: findings?.length || 0,
    analysisDepth: analysis_depth,
    hasCompetitionContext: !!competition_context,
    directCompetitors: competition_context?.direct_competitors?.length || 0,
    indirectCompetitors: competition_context?.indirect_competitors?.length || 0
  });
  
  // Extract competitor list for targeted analysis
  const competitors = {
    direct: competition_context?.direct_competitors || [],
    indirect: competition_context?.indirect_competitors || [],
    emerging: competition_context?.emerging_threats || []
  };
  
  console.log('🏢 Known Competitors:', {
    direct: competitors.direct.slice(0, 5),
    indirect: competitors.indirect.slice(0, 3),
    emerging: competitors.emerging.slice(0, 3)
  });
  
  // STAGE 1: Extract events from ALL findings (up to 100)
  console.log(`📊 Stage 1: Extracting events from ${findings?.length || 0} findings`);
  
  // Take up to 100 findings for comprehensive coverage
  const allFindings = (findings || []).slice(0, 100);
  
  // Extract key events from all findings
  const extractedEvents = await extractCompetitorEvents(allFindings, competitors);
  
  console.log(`✅ Extracted ${extractedEvents.length} competitor events from ${allFindings.length} articles`);
  
  if (extractedEvents.length === 0) {
    console.log('⚠️ No competitor events found in monitoring data');
    // Return early with no events found
    return {
      content: [{
        type: "analysis",
        whats_happening: {
          key_moves: [],
          market_dynamics: "No competitor activity detected in today's monitoring."
        },
        competitive_landscape: {
          whos_winning: "No significant competitor wins in today's news.",
          whos_struggling: "No competitor challenges reported today.",
          where_we_stand: `${organization?.name} has an opportunity to dominate the news cycle.`,
          our_advantages: "Clear field for our messaging today.",
          our_vulnerabilities: "May be missing from important conversations."
        },
        deeper_insights: ["Limited competitor activity provides opportunity for proactive PR."],
        executive_summary: "Quiet competitive landscape today - opportunity for proactive messaging.",
        metadata: {
          personality: 'marcus_chen',
          findings_analyzed: allFindings.length,
          events_extracted: 0
        }
      }],
      success: true
    };
  }
  
  // Group events by competitor for better analysis
  const eventsByCompetitor = {};
  for (const event of extractedEvents) {
    for (const comp of event.competitors) {
      if (!eventsByCompetitor[comp]) {
        eventsByCompetitor[comp] = [];
      }
      eventsByCompetitor[comp].push(event);
    }
  }
  
  console.log('📊 Events by competitor:', Object.keys(eventsByCompetitor).map(comp => 
    `${comp}: ${eventsByCompetitor[comp].length} events`
  ));
  
  // STAGE 2: Send extracted events to Claude for PR analysis
  console.log('📊 Stage 2: Analyzing extracted events with Claude');
  
  const prompt = `You are Marcus Chen, a sharp PR strategist preparing a competitive intelligence briefing for ${organization?.name || 'the organization'}'s communications team.

CLIENT: ${organization?.name || 'Unknown'}
INDUSTRY: ${organization?.industry || 'Unknown'}

EXTRACTED COMPETITOR EVENTS FROM TODAY'S NEWS:
${Object.entries(eventsByCompetitor).map(([competitor, events]: [string, any[]]) => {
  return `\n${competitor.toUpperCase()}:
${events.map((e, i) => `  ${i+1}. ${e.summary} (${e.event_types.join(', ')}) - ${e.source}`).join('\n')}`;
}).join('\n')}

SUMMARY: ${extractedEvents.length} events extracted from ${allFindings.length} articles covering ${Object.keys(eventsByCompetitor).length} competitors.

YOUR MISSION: Extract EVERY competitor move from the news above and explain the PR implications for ${organization?.name}. Focus on what actually happened TODAY based on these news items.

Structure your analysis as follows:

{
  "whats_happening": {
    "key_moves": [
      {
        "competitor": "EXACT company name from news item",
        "move": "EXACTLY what happened as reported in the news - quote specific details, numbers, names",
        "source_item": "[X] - cite the exact item number",
        "why_it_matters": "PR IMPACT: How does this affect public perception? What narrative are they pushing? How should we respond in our communications?"
      }
    ],
    "market_dynamics": "What PR narrative is emerging from these collective moves? What story is the media telling about this industry right now?"
  },
  
  "competitive_landscape": {
    "whos_winning": "WHO is winning the PR game today? Which competitor got the best media coverage? What positive narrative are they controlling?",
    "whos_struggling": "WHO is having a PR crisis or bad news cycle? What negative stories are hurting their brand today?",
    "where_we_stand": "How does ${organization?.name} look compared to these news stories? Are we missing from the conversation? Should we insert ourselves into these narratives?",
    "our_advantages": "What PR advantages do we have? What positive stories can we tell that competitors can't?",
    "our_vulnerabilities": "What PR vulnerabilities do these stories expose for us? What questions might journalists ask us?"
  },
  
  "deeper_insights": [
    "MEDIA PATTERNS: What patterns do you see in how media is covering these competitors? Who's getting favorable treatment?",
    "NARRATIVE MOMENTUM: Based on today's news, which narratives are gaining traction? What stories will dominate tomorrow?",
    "PR IMPLICATIONS: What does this mean for our PR strategy? What messages should we prepare?"
  ],
  
  "competitive_positioning": {
    "market_position": "MEDIA POSITIONING: How is ${organization?.name} positioned in media coverage compared to these competitors? Are we seen as leader, challenger, or absent?",
    "competitive_moat": "NARRATIVE MOAT: What unique story can only ${organization?.name} tell? What PR assets do we have that competitors lack?",
    "positioning_recommendations": "POSITIONING STRATEGY: How should we position ourselves in response to these news stories? What counter-narrative should we deploy?"
  },
  
  "pr_opportunities": {
    "immediate_opportunities": "IMMEDIATE PR MOVES: Based on today's news, what PR opportunities can we execute TODAY? Be specific - which journalists to call, what story to pitch.",
    "counter_narratives": "DEFENSIVE MESSAGING: If journalists ask about these competitor moves, what's our response? Give me actual talking points.",
    "media_strategy": "MEDIA TARGETS: Which specific reporters/outlets are covering these stories? Who should we engage immediately?"
  },
  
  "narrative_intelligence": {
    "competitor_narratives": "THEIR STORY: What narrative is each competitor pushing based on today's news? What's their PR strategy?",
    "market_perception": "PUBLIC PERCEPTION: How is the public/market receiving these stories? Check the sentiment in the news coverage.",
    "narrative_gaps": "UNCLAIMED NARRATIVES: What stories are NOT being told that ${organization?.name} could own?"
  },
  
  "executive_summary": "PR BRIEF FOR CEO: The biggest competitor news today is [SPECIFIC EVENT]. This creates a PR [opportunity/threat] because [SPECIFIC REASON]. We should immediately [SPECIFIC PR ACTION]. The media narrative is shifting toward [TREND], and we need to [POSITION/RESPONSE]."
}

REQUIREMENTS:
- Extract ACTUAL NEWS EVENTS from the items above - not generic analysis
- Every claim must cite [item number] from the news feed
- Focus on PR and media implications, not business strategy
- If a competitor is mentioned in multiple stories, note the pattern
- Fill EVERY section even if you have to note "No crisis stories today" or "No positive coverage today"
- This is a PR briefing - everything should relate to public perception, media narrative, and communications strategy`;

  // Single attempt - no retries to avoid timeouts
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Claude API timeout after 50 seconds`);
      controller.abort();
    }, 50000); // 50 second timeout (10s buffer for Supabase's 60s limit)
    
    console.log(`🤖 Calling Claude API from MCP...`);
    const fetchStart = Date.now();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',  // Use correct model
          max_tokens: 3000,  // Reduced for speed while maintaining quality
          temperature: 0.3,  // Lower for more focused, factual PR analysis
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`⏱️ Claude API response received in ${Date.now() - fetchStart}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API failed:', {
          status: response.status,
          error: errorText
        });
        throw new Error(`Claude API failed: ${response.status}`);
      }
      
      const claudeData = await response.json();
      console.log('✅ Claude response received');
      const content = claudeData.content[0].text;
      
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        let analysis;
        try {
          analysis = JSON.parse(jsonMatch[0]);
          
          // Ensure all expected fields exist
          if (!analysis.whats_happening) {
            console.warn('⚠️ Missing whats_happening in Claude response');
            analysis.whats_happening = { key_moves: [], market_dynamics: '' };
          }
          if (!analysis.competitive_landscape) {
            console.warn('⚠️ Missing competitive_landscape in Claude response');
            analysis.competitive_landscape = {};
          }
          if (!analysis.deeper_insights) {
            console.warn('⚠️ Missing deeper_insights in Claude response');
            analysis.deeper_insights = [];
          }
          
        } catch (parseError) {
          console.error('❌ Failed to parse Claude response as JSON:', parseError);
          console.error('Raw content:', content.substring(0, 500));
          throw new Error('Failed to parse Claude response as JSON');
        }
        
        console.log('✅ Marcus Chen MCP analysis completed:', {
          // New structure fields
          hasWhatsHappening: !!analysis.whats_happening,
          keyMoves: analysis.whats_happening?.key_moves?.length || 0,
          hasCompetitiveLandscape: !!analysis.competitive_landscape,
          hasDeeperInsights: !!analysis.deeper_insights,
          insightCount: analysis.deeper_insights?.length || 0,
          hasExecutiveSummary: !!analysis.executive_summary,
          // Competitive positioning details
          hasWhosWinning: !!analysis.competitive_landscape?.whos_winning,
          hasWhosStruggling: !!analysis.competitive_landscape?.whos_struggling,
          hasWhereWeStand: !!analysis.competitive_landscape?.where_we_stand,
          hasOurAdvantages: !!analysis.competitive_landscape?.our_advantages,
          hasOurVulnerabilities: !!analysis.competitive_landscape?.our_vulnerabilities
        });
        
        // LOG ACTUAL CONTENT to debug
        if (analysis.whats_happening?.key_moves?.length > 0) {
          console.log('🎯 ACTUAL KEY MOVES:');
          analysis.whats_happening.key_moves.slice(0, 3).forEach((move: any, i: number) => {
            console.log(`  ${i+1}. ${move.competitor}: ${move.move} (item ${move.source_item})`);
          });
        }
        if (analysis.executive_summary) {
          console.log('📝 ACTUAL EXECUTIVE SUMMARY:', analysis.executive_summary.substring(0, 200));
        }
        
        // Success! Return the analysis
        return {
          content: [{
            type: "analysis",
            // Explicitly spread all fields to ensure they're included
            whats_happening: analysis.whats_happening || {},
            competitive_landscape: analysis.competitive_landscape || {},
            deeper_insights: analysis.deeper_insights || [],
            executive_summary: analysis.executive_summary || '',
            // Include any other fields that might exist
            ...analysis,
            metadata: {
              analysis, // Keep full analysis in metadata for backward compatibility
              personality: 'marcus_chen',
              analyst: 'competitive_intelligence',
              analysis_depth,
              articles_processed: allFindings.length,
              events_extracted: extractedEvents.length,
              competitors_covered: Object.keys(eventsByCompetitor).length,
              claude_enhanced: true,
              two_stage_analysis: true
            }
          }],
          success: true
        };
    } else {
      throw new Error('No JSON found in Claude response');
    }
    
  } catch (error: any) {
    console.error('❌ MCP analysis failed:', error.message);
    
    // Return error response
    return {
      content: [{
        type: "error",
        message: error.message || 'Analysis failed',
        metadata: {
          error: true,
          personality: 'marcus_chen',
          error_details: error.stack?.substring(0, 500),
          articles_attempted: allFindings?.length || 0,
          events_extracted: extractedEvents?.length || 0
        }
      }],
      success: false
    };
  }
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { tool, arguments: args } = await req.json();
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    let result;
    switch(tool) {
      case 'analyze_competition_with_personality':
        result = await analyzeCompetitionWithPersonality(args);
        break;
      default:
        result = {
          content: [{
            type: "error",
            message: `Unknown tool: ${tool}`
          }],
          success: false
        };
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});