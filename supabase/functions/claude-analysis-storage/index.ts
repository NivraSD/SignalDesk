import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Claude Analysis Storage Service
 * Stores and retrieves Claude's rich analyses from each stage
 * Separate from main persistence to ensure Claude insights are preserved
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, organization_name, stage_name, claude_analysis, request_id } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🧠 Claude Analysis Storage - Action: ${action}, Org: ${organization_name}, Stage: ${stage_name}`);

    switch (action) {
      case 'store': {
        // Store Claude's analysis for a specific stage
        const { data, error } = await supabase
          .from('claude_analyses')
          .upsert({
            organization_name,
            stage_name,
            claude_analysis,
            request_id,
            created_at: new Date().toISOString(),
            metadata: {
              has_executive_summary: !!claude_analysis?.executive_summary,
              has_opportunities: !!claude_analysis?.opportunities,
              has_insights: !!claude_analysis?.insights,
              model_used: claude_analysis?.metadata?.model || 'claude-sonnet-4',
              analysis_duration: claude_analysis?.metadata?.duration || 0
            }
          }, {
            onConflict: 'organization_name,stage_name,request_id'
          });

        if (error) {
          console.error('❌ Error storing Claude analysis:', error);
          throw error;
        }

        console.log(`✅ Stored Claude analysis for ${organization_name} - ${stage_name}`);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Claude analysis stored for ${stage_name}`,
          stored_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'retrieve': {
        // Retrieve all Claude analyses for synthesis
        const { data: analyses, error } = await supabase
          .from('claude_analyses')
          .select('*')
          .eq('organization_name', organization_name)
          .eq('request_id', request_id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error retrieving Claude analyses:', error);
          throw error;
        }

        // Transform into a map by stage name for easy access
        const analysesByStage = {};
        analyses?.forEach(analysis => {
          analysesByStage[analysis.stage_name] = analysis.claude_analysis;
        });

        console.log(`✅ Retrieved ${analyses?.length || 0} Claude analyses for synthesis`);
        console.log('📊 Stages with Claude analysis:', Object.keys(analysesByStage));

        return new Response(JSON.stringify({
          success: true,
          analyses: analysesByStage,
          count: analyses?.length || 0,
          stages: Object.keys(analysesByStage)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cleanup': {
        // Clean up old analyses (older than 24 hours)
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24);

        const { data, error } = await supabase
          .from('claude_analyses')
          .delete()
          .lt('created_at', cutoffDate.toISOString());

        if (error) {
          console.error('❌ Error cleaning up old analyses:', error);
          throw error;
        }

        console.log(`🧹 Cleaned up old Claude analyses`);

        return new Response(JSON.stringify({
          success: true,
          message: 'Old analyses cleaned up'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ Claude Analysis Storage Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});