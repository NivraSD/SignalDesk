import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeCompetitive } from './claude-analyst.ts';

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';

/**
 * Stage 1: Deep Competitor Analysis - WITH CLAUDE
 * Uses Claude AI for real competitive intelligence
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract ALL data from request
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { 
      organization,
      competitors = [],
      competitorsNested,
      stakeholders,
      fullProfile,
      savedProfile,
      dataVersion,
      previousResults = {},
      request_id
    } = requestData;

    console.log(`🎯 Stage 1: Starting Competitor Analysis`);
    console.log(`📊 Data received:`, {
      hasOrganization: !!organization,
      organizationType: typeof organization,
      organizationName: organization?.name,
      organizationKeys: organization ? Object.keys(organization).join(', ') : 'none',
      flatCompetitors: competitors.length,
      hasNestedCompetitors: !!competitorsNested,
      hasFullProfile: !!fullProfile,
      hasSavedProfile: !!savedProfile,
      dataVersion: dataVersion || 'unknown',
      hasPreviousResults: Object.keys(previousResults).length > 0
    });

    // Debug: Log the actual organization object
    console.log('📋 Full organization object:', JSON.stringify(organization, null, 2));

    // CRITICAL FIX: Try to extract organization name from multiple sources
    let organizationName = null;
    
    // Try multiple sources for the organization name
    organizationName = organization?.name || 
                      organization?.organization?.name ||
                      savedProfile?.name ||
                      savedProfile?.organization?.name ||
                      fullProfile?.organization?.name ||
                      fullProfile?.name ||
                      requestData?.organization_name ||
                      requestData?.name;
    
    // If still no name, check if organization has nested structure
    if (!organizationName && organization) {
      // Check if the organization object has any property that might contain the name
      const possibleNameKeys = ['companyName', 'company_name', 'orgName', 'org_name', 'title', 'entity'];
      for (const key of possibleNameKeys) {
        if (organization[key]) {
          organizationName = organization[key];
          break;
        }
      }
    }
    
    // Final fallback
    if (!organizationName) {
      console.error('❌ Could not find organization name in any field');
      console.error('Searched in:', {
        'organizationName': organization?.name,
        'savedProfile.name': savedProfile?.name,
        'fullProfile.name': fullProfile?.name,
        'requestData keys': Object.keys(requestData)
      });
      
      // Use a default but log warning
      organizationName = 'Unknown Organization';
      console.warn('⚠️ Using default organization name:', organizationName);
    }
    
    // Create a proper organization object with the extracted name
    const safeOrganization = {
      ...organization,
      name: organizationName
    };
    
    console.log(`✅ Extracted organization name: ${organizationName}`);

    // Step 1: Get existing data AND monitoring data from database
    let dbCompetitors = { direct: [], indirect: [], emerging: [] };
    let dbProfile = null;
    let monitoringData = {};
    
    try {
      // Try to get saved profile first
      const profileResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'getProfile',
            organization_name: organizationName
          })
        }
      );
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.profile) {
          dbProfile = profileData.profile;
          dbCompetitors = dbProfile.competitors || { direct: [], indirect: [], emerging: [] };
          console.log(`✅ Retrieved profile from database with ${countCompetitors(dbCompetitors)} competitors`);
        }
      }
      
      // Get recent intelligence findings (monitoring data)
      const findingsResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'retrieve',
            organization_name: organizationName,
            limit: 100
          })
        }
      );
      
      if (findingsResponse.ok) {
        const findingsData = await findingsResponse.json();
        if (findingsData.success && findingsData.data) {
          monitoringData = {
            findings: findingsData.data.findings || [],
            stage_data: findingsData.data.stage_data || [],
            raw_count: findingsData.data.findings?.length || 0
          };
          console.log(`✅ Retrieved ${monitoringData.raw_count} monitoring findings`);
        }
      }
      
      // Also try to get targets
      const targetsResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'getTargets',
            organization_name: organizationName
          })
        }
      );
      
      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        if (targetsData.success && targetsData.targets?.competitors) {
          const targetCompetitors = targetsData.targets.competitors;
          // Merge with existing
          dbCompetitors = mergeCompetitors(dbCompetitors, targetCompetitors);
          console.log(`✅ Retrieved targets from database`);
        }
      }
    } catch (e) {
      console.log('Could not retrieve existing data:', e);
    }

    // Step 2: Determine which competitors to analyze
    let competitorsToAnalyze = { direct: [], indirect: [], emerging: [] };
    
    // Use fullProfile if available
    if (fullProfile?.competitors) {
      competitorsToAnalyze = mergeCompetitors(competitorsToAnalyze, fullProfile.competitors);
    }
    
    // Use nested competitors if provided
    if (competitorsNested) {
      competitorsToAnalyze = mergeCompetitors(competitorsToAnalyze, competitorsNested);
    }
    
    // Use flat array if that's what we have
    if (competitors && competitors.length > 0) {
      // Convert flat array to nested structure
      competitors.forEach((comp: any) => {
        const type = comp.type || comp.category || 'direct';
        if (!competitorsToAnalyze[type]) {
          competitorsToAnalyze[type] = [];
        }
        
        // Ensure we have a proper competitor object
        const competitorObj = typeof comp === 'string' ? { name: comp } : comp;
        competitorsToAnalyze[type].push(competitorObj);
      });
    }
    
    // Merge with database competitors
    competitorsToAnalyze = mergeCompetitors(competitorsToAnalyze, dbCompetitors);
    
    const totalCompetitors = countCompetitors(competitorsToAnalyze);
    console.log(`📊 Total competitors to analyze: ${totalCompetitors}`);
    console.log(`  - Direct: ${competitorsToAnalyze.direct.length}`);
    console.log(`  - Indirect: ${competitorsToAnalyze.indirect.length}`);
    console.log(`  - Emerging: ${competitorsToAnalyze.emerging.length}`);

    // Step 3: Perform REAL analysis with Claude using monitoring data
    const startTime = Date.now();
    
    // Prepare comprehensive data for Claude
    const dataForClaude = {
      monitoring_findings: monitoringData.findings || [],
      identified_competitors: competitorsToAnalyze,
      previous_analysis: previousResults,
      organization_context: {
        name: organizationName,
        industry: organization.industry,
        profile: dbProfile
      }
    };
    
    // Generate request ID if not provided
    const requestId = request_id || `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔑 Request ID: ${requestId}`);

    // Use Claude to analyze the REAL monitoring data
    const results = await analyzeWithClaudeCompetitive(
      safeOrganization,
      dataForClaude,
      {
        // Basic structure as fallback if Claude fails
        competitors: competitorsToAnalyze,
        metadata: {
          stage: 1,
          duration: 0,
          competitors_analyzed: totalCompetitors,
          data_source: 'claude_ai_with_monitoring',
          competitors_from_db: countCompetitors(dbCompetitors),
          monitoring_findings_analyzed: monitoringData.raw_count || 0,
          dataVersion: dataVersion || '2.0'
        }
      }
    );

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

    results.metadata.duration = Date.now() - startTime;
    console.log(`✅ Stage 1 complete in ${results.metadata.duration}ms with Claude analysis`);

    // Step 4: Save results
    try {
      // Save the complete analyzed data
      await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'saveStageData',
            organization_name: organizationName,
            stage: 'competitor_analysis',
            stage_data: results,
            metadata: results.metadata
          })
        }
      );
      console.log('💾 Stage 1 results saved to database');
      
      // Also update targets with analyzed competitors
      await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'saveTargets',
            organization_name: organizationName,
            competitors: results.competitors,
            stakeholders: stakeholders || fullProfile?.stakeholders || {}
          })
        }
      );
      console.log('💾 Updated intelligence targets');
    } catch (e) {
      console.log('Could not save results:', e);
    }

    // Format for UI display - with safe access
    const directCompetitors = results?.competitors?.direct || [];
    const indirectCompetitors = results?.competitors?.indirect || [];
    
    const tabs = {
      competitive: {
        competitor_actions: directCompetitors.map((c: any) => ({
          entity: c?.name || 'Unknown',
          action: c?.recent_action || 'Active in market',
          impact: c?.threat_level || 'Medium',
          timestamp: new Date().toISOString()
        })),
        summary: `Analyzing ${directCompetitors.length} direct competitors, ${indirectCompetitors.length} indirect competitors`,
        positioning: {
          threats: results?.market_positioning?.threats || []
        }
      }
    };

    return new Response(JSON.stringify({
      success: true,
      stage: 'competitor_analysis',
      data: results,
      intelligence: monitoringData, // CRITICAL: Pass through monitoring data
      request_id: requestId, // Pass to next stage
      tabs: tabs, // UI-formatted data
      debug: {
        inputCompetitorCount: competitors.length,
        analyzedCompetitorCount: totalCompetitors,
        hadFullProfile: !!fullProfile,
        hadDatabaseData: !!dbProfile,
        monitoringSignals: monitoringData?.raw_signals?.length || 0,
        requestId: requestId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Stage 1 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      stage: 'competitor_analysis',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper: Count competitors
function countCompetitors(competitors: any): number {
  if (Array.isArray(competitors)) {
    return competitors.length;
  }
  
  let count = 0;
  if (competitors?.direct) count += competitors.direct.length;
  if (competitors?.indirect) count += competitors.indirect.length;
  if (competitors?.emerging) count += competitors.emerging.length;
  return count;
}

// Helper: Merge competitor lists
function mergeCompetitors(base: any, additional: any): any {
  const result = {
    direct: [...(base?.direct || [])],
    indirect: [...(base?.indirect || [])],
    emerging: [...(base?.emerging || [])]
  };
  
  // Add additional competitors, avoiding duplicates
  if (additional?.direct) {
    for (const comp of additional.direct) {
      const name = comp.name || comp;
      if (!result.direct.some((c: any) => (c.name || c) === name)) {
        result.direct.push(comp);
      }
    }
  }
  
  if (additional?.indirect) {
    for (const comp of additional.indirect) {
      const name = comp.name || comp;
      if (!result.indirect.some((c: any) => (c.name || c) === name)) {
        result.indirect.push(comp);
      }
    }
  }
  
  if (additional?.emerging) {
    for (const comp of additional.emerging) {
      const name = comp.name || comp;
      if (!result.emerging.some((c: any) => (c.name || c) === name)) {
        result.emerging.push(comp);
      }
    }
  }
  
  return result;
}

// These placeholder functions are kept as fallback options
// They're not used when Claude is available but provide structure if needed