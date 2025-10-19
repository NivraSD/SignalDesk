#!/bin/bash

echo "🧠 SMART CLAUDE SYNTHESIS UPDATE"
echo "================================"
echo "This update ensures:"
echo "1. Each stage's Claude analysis is stored separately"
echo "2. Synthesis gets ONLY Claude insights + data summaries (not raw data)"
echo "3. Prevents timeout by reducing data size"
echo ""

# Create the update for Stage 1 (Competitors)
cat > /tmp/stage1_update.ts << 'STAGE1'
// Add this after line 252 where Claude analysis happens
// Line 252: const results = await analyzeWithClaudeCompetitive(

// Generate request ID if not provided
const requestId = requestData.request_id || `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
console.log(`🔑 Request ID: ${requestId}`);

// After Claude analysis (around line 268)
// Store Claude's analysis separately for synthesis
if (results && results.metadata?.claude_enhanced !== false) {
  try {
    // Extract just the Claude insights (not raw data)
    const claudeInsights = {
      competitive_landscape: results.competitive_landscape,
      battle_cards: results.battle_cards,
      market_positioning: results.market_positioning,
      threat_assessment: results.threat_assessment,
      opportunities: results.opportunities,
      key_insights: results.key_insights,
      executive_summary: results.executive_summary,
      metadata: {
        stage: 'competitive',
        timestamp: new Date().toISOString(),
        competitors_analyzed: totalCompetitors,
        monitoring_signals_processed: monitoringData.raw_count || 0
      }
    };

    await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          action: 'store',
          organization_name: organizationName,
          stage_name: 'competitive',
          claude_analysis: claudeInsights, // Just insights, not raw data
          request_id: requestId
        })
      }
    );
    console.log('🧠 Claude competitive insights stored for synthesis');
  } catch (e) {
    console.error('Could not store Claude analysis:', e);
  }
}

// IMPORTANT: Add request_id to response (around line 336)
return new Response(JSON.stringify({
  success: true,
  stage: 'competitor_analysis',
  data: results,
  intelligence: monitoringData, // Still pass for next stages
  request_id: requestId, // Pass to next stage
  tabs: tabs,
  debug: {
    inputCompetitorCount: competitors.length,
    analyzedCompetitorCount: totalCompetitors,
    hadFullProfile: !!fullProfile,
    hadDatabaseData: !!dbProfile,
    monitoringSignals: monitoringData?.raw_signals?.length || 0,
    requestId: requestId
  }
}), {
STAGE1

echo "✅ Stage 1 update prepared"

# Create the update for Synthesis Stage
cat > /tmp/synthesis_update.ts << 'SYNTHESIS'
// Add this at the beginning of the synthesis stage (after line 30)
const requestId = requestData.request_id;
console.log(`🔑 Synthesis using request ID: ${requestId}`);

// Retrieve ALL Claude analyses from previous stages
let allClaudeInsights = {};
if (requestId) {
  try {
    const analysisResponse = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          action: 'retrieve',
          organization_name: organization.name,
          request_id: requestId
        })
      }
    );
    
    const analysisData = await analysisResponse.json();
    if (analysisData.success && analysisData.analyses) {
      allClaudeInsights = analysisData.analyses;
      console.log('🧠 Retrieved Claude insights from stages:', Object.keys(allClaudeInsights));
      console.log('📊 Insights summary:', {
        competitive: !!allClaudeInsights.competitive,
        media: !!allClaudeInsights.media,
        regulatory: !!allClaudeInsights.regulatory,
        trends: !!allClaudeInsights.trends
      });
    }
  } catch (e) {
    console.error('Could not retrieve Claude analyses:', e);
  }
}

// REPLACE the normalizedData section with smart data preparation
// Instead of passing ALL raw data, pass summaries + Claude insights
const synthesisData = {
  // Claude insights from each stage (rich analysis)
  claude_insights: {
    competitive: allClaudeInsights.competitive || {},
    media: allClaudeInsights.media || {},
    regulatory: allClaudeInsights.regulatory || {},
    trends: allClaudeInsights.trends || {}
  },
  
  // Data summaries only (not full raw data)
  data_summary: {
    organization: organization.name,
    industry: organization.industry,
    
    competitive_summary: {
      total_competitors: normalizedData.competitors?.all?.length || 0,
      direct_count: normalizedData.competitors?.direct?.length || 0,
      indirect_count: normalizedData.competitors?.indirect?.length || 0,
      emerging_count: normalizedData.competitors?.emerging?.length || 0,
      top_threats: normalizedData.competitors?.direct?.slice(0, 3).map(c => c.name || c)
    },
    
    media_summary: {
      coverage_count: normalizedData.media?.coverage?.length || 0,
      sentiment: normalizedData.media?.sentiment?.[0] || 'Unknown',
      top_topics: normalizedData.media?.topics?.slice(0, 5),
      opportunities_count: normalizedData.media?.opportunities?.length || 0
    },
    
    regulatory_summary: {
      developments_count: normalizedData.regulatory?.developments?.length || 0,
      risks_count: normalizedData.regulatory?.risks?.length || 0,
      opportunities_count: normalizedData.regulatory?.opportunities?.length || 0,
      compliance_status: 'Active monitoring'
    },
    
    trends_summary: {
      trending_topics_count: normalizedData.trends?.topics?.length || 0,
      gaps_identified: normalizedData.trends?.gaps?.length || 0,
      opportunities_count: normalizedData.trends?.opportunities?.length || 0,
      top_trends: normalizedData.trends?.topics?.slice(0, 3)
    },
    
    monitoring_summary: {
      total_signals: normalizedData.monitoring?.raw_signals?.length || 0,
      sources_count: normalizedData.monitoring?.metadata?.sources?.length || 0,
      time_range: normalizedData.monitoring?.metadata?.time_range || 'Last 7 days'
    }
  }
};

// Now pass ONLY the synthesis data to Claude (much smaller!)
console.log('📦 Synthesis data size:', JSON.stringify(synthesisData).length, 'bytes');

// Update the Claude call (around line 125)
claudeAnalysis = await analyzeWithClaudeSynthesis(
  organization,
  synthesisData,  // Smart data: Claude insights + summaries only
  null,  // Don't pass previousResults (too much data)
  null
);
SYNTHESIS

echo "✅ Synthesis update prepared"

# Create update for the Claude synthesis prompt
cat > /tmp/claude_synthesis_prompt_update.ts << 'PROMPT'
// Update claude-analyst.ts in synthesis stage (around line 34)
const prompt = `You are an elite intelligence synthesizer for ${organization.name} in the ${organization.industry || 'business'} industry.

You have received:
1. ANALYZED INSIGHTS from specialist Claude analysts (not raw data)
2. DATA SUMMARIES showing counts and key metrics
3. You do NOT need to re-analyze raw data - focus on SYNTHESIS

CLAUDE INSIGHTS FROM EACH STAGE:
${JSON.stringify(synthesisData.claude_insights, null, 2)}

DATA SUMMARIES:
${JSON.stringify(synthesisData.data_summary, null, 2)}

Your role is to SYNTHESIZE these insights into:
1. Cross-dimensional patterns that connect different analyses
2. Strategic implications of the combined intelligence
3. Priority opportunities based on ALL insights
4. Executive summary that captures the essence

Focus on:
- CONNECTING insights across stages (not re-analyzing)
- IDENTIFYING patterns between competitive, media, regulatory, and trends
- PRIORITIZING opportunities based on multiple signals
- CREATING actionable intelligence from the synthesis

You have 45 seconds to complete this synthesis.
`
PROMPT

echo "✅ Prompt update prepared"

echo ""
echo "📝 IMPLEMENTATION PLAN:"
echo "====================="
echo ""
echo "1. UPDATE EACH STAGE (1-4) to store Claude insights:"
echo "   - Extract key insights from Claude analysis"
echo "   - Store to claude-analysis-storage"
echo "   - Pass request_id forward"
echo ""
echo "2. UPDATE SYNTHESIS (Stage 5):"
echo "   - Retrieve Claude insights from storage"
echo "   - Create data summaries (not full data)"
echo "   - Pass smaller payload to Claude"
echo ""
echo "3. BENEFITS:"
echo "   ✅ Synthesis gets rich Claude insights"
echo "   ✅ No raw data overload (prevents timeout)"
echo "   ✅ Smaller payload = faster processing"
echo "   ✅ Each Claude focuses on its expertise"
echo ""
echo "4. DATA FLOW:"
echo "   Stage 1: Raw data → Claude 1 → Insights stored"
echo "   Stage 2: Raw data → Claude 2 → Insights stored"
echo "   Stage 3: Raw data → Claude 3 → Insights stored"
echo "   Stage 4: Raw data → Claude 4 → Insights stored"
echo "   Stage 5: All insights + summaries → Claude Synthesis → Final report"
echo ""
echo "5. SIZE REDUCTION:"
echo "   Before: ~50KB of raw data to synthesis"
echo "   After:  ~10KB of insights + summaries"
echo "   Result: 80% reduction in data size!"
echo ""
echo "Files created in /tmp/:"
echo "  - stage1_update.ts (example for stages 1-4)"
echo "  - synthesis_update.ts (for stage 5)"
echo "  - claude_synthesis_prompt_update.ts (updated prompt)"