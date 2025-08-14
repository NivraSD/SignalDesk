// Supabase Edge Function: Intelligence Monitoring
// Runs monitoring jobs without timeout limitations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Claude AI Integration
async function analyzeWithClaude(content: string, targetName: string) {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicApiKey) return null

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this content about ${targetName} for PR relevance and opportunities. Be concise: ${content.substring(0, 1000)}`
        }]
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.content[0].text
    }
  } catch (error) {
    console.error('Claude API error:', error)
  }
  return null
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get monitoring configuration
    const { organizationId, targetId, targetType } = await req.json()

    console.log(`🔍 Starting monitoring for org: ${organizationId}`)

    // Get intelligence targets
    let query = supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)

    if (targetId) {
      query = query.eq('id', targetId)
    }

    if (targetType) {
      query = query.eq('type', targetType)
    }

    const { data: targets, error: targetsError } = await query

    if (targetsError) throw targetsError
    if (!targets || targets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active targets found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allFindings = []
    
    // Process each target
    for (const target of targets) {
      console.log(`📊 Processing target: ${target.name} (${target.type})`)
      
      // Create monitoring run record
      const { data: run, error: runError } = await supabase
        .from('monitoring_runs')
        .insert({
          organization_id: organizationId,
          target_id: target.id,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (runError) {
        console.error('Error creating monitoring run:', runError)
        continue
      }

      const startTime = Date.now()
      let targetFindings = []

      try {
        // Monitor based on target type
        if (target.type === 'competitor') {
          targetFindings = await monitorCompetitor(target, supabase)
        } else if (target.type === 'topic') {
          targetFindings = await monitorTopic(target, supabase)
        } else if (target.type === 'stakeholder') {
          targetFindings = await monitorStakeholder(target, supabase)
        }

        // Analyze findings with Claude if available
        for (const finding of targetFindings) {
          const analysis = await analyzeWithClaude(
            finding.content || finding.title,
            target.name
          )
          if (analysis) {
            finding.ai_analysis = analysis
          }
        }

        // Store findings
        if (targetFindings.length > 0) {
          const { error: findingsError } = await supabase
            .from('intelligence_findings')
            .insert(targetFindings)

          if (findingsError) {
            console.error('Error storing findings:', findingsError)
          } else {
            allFindings.push(...targetFindings)
            console.log(`✅ Stored ${targetFindings.length} findings for ${target.name}`)
          }
        }

        // Update monitoring run as successful
        await supabase
          .from('monitoring_runs')
          .update({
            status: 'completed',
            findings_count: targetFindings.length,
            completed_at: new Date().toISOString(),
            execution_time: Date.now() - startTime
          })
          .eq('id', run.id)

        // Update target last_monitored
        await supabase
          .from('intelligence_targets')
          .update({ last_monitored: new Date().toISOString() })
          .eq('id', target.id)

      } catch (error) {
        console.error(`❌ Error monitoring target ${target.name}:`, error)
        
        // Update monitoring run with error
        await supabase
          .from('monitoring_runs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
            execution_time: Date.now() - startTime
          })
          .eq('id', run.id)
      }
    }

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        targets_processed: targets.length,
        findings_count: allFindings.length,
        findings: allFindings,
        message: `Monitoring complete. Found ${allFindings.length} new findings.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in monitor-intelligence function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

// Monitor competitor activities
async function monitorCompetitor(target: any, supabase: any) {
  const findings = []
  
  // Monitor RSS feeds if configured
  if (target.sources?.rss && Array.isArray(target.sources.rss)) {
    for (const feedUrl of target.sources.rss) {
      try {
        console.log(`📰 Fetching RSS: ${feedUrl}`)
        const response = await fetch(feedUrl)
        if (!response.ok) continue
        
        const text = await response.text()
        
        // Parse RSS (basic parsing - in production use proper parser)
        const items = text.match(/<item>[\s\S]*?<\/item>/g) || []
        
        for (const item of items.slice(0, 5)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const description = item.match(/<description>(.*?)<\/description>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          
          // Check relevance using keywords
          const content = `${title} ${description}`.toLowerCase()
          const isRelevant = !target.keywords || target.keywords.length === 0 ||
            target.keywords.some((keyword: string) => 
              content.includes(keyword.toLowerCase())
            )
          
          if (isRelevant) {
            findings.push({
              organization_id: target.organization_id,
              target_id: target.id,
              finding_type: 'competitor_news',
              title: cleanHtml(title).substring(0, 500),
              content: cleanHtml(description),
              source_url: link,
              relevance_score: calculateRelevance(content, target.keywords),
              sentiment: 'neutral',
              metadata: { 
                source: 'rss', 
                feed: feedUrl,
                published: pubDate
              },
              action_required: false,
              processed: false
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching RSS feed ${feedUrl}:`, error)
      }
    }
  }
  
  return findings
}

// Monitor topics
async function monitorTopic(target: any, supabase: any) {
  const findings = []
  
  // For demo purposes, create a sample finding
  // In production, integrate with news APIs, Google Alerts, etc.
  if (target.sources?.monitoring_enabled) {
    findings.push({
      organization_id: target.organization_id,
      target_id: target.id,
      finding_type: 'topic_trend',
      title: `${target.name} - Monitoring Active`,
      content: `Monitoring for ${target.name} is active. Configure RSS feeds or APIs for real-time updates.`,
      source_url: 'https://signaldesk.com',
      relevance_score: 0.75,
      sentiment: 'neutral',
      metadata: { 
        source: 'system',
        keywords: target.keywords
      },
      action_required: false,
      processed: false
    })
  }
  
  return findings
}

// Monitor stakeholders
async function monitorStakeholder(target: any, supabase: any) {
  const findings = []
  
  // Monitor configured sources
  if (target.sources?.rss && Array.isArray(target.sources.rss)) {
    // Similar to competitor monitoring but focused on stakeholder activities
    for (const feedUrl of target.sources.rss) {
      try {
        const response = await fetch(feedUrl)
        if (!response.ok) continue
        
        const text = await response.text()
        const items = text.match(/<item>[\s\S]*?<\/item>/g) || []
        
        for (const item of items.slice(0, 3)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          
          findings.push({
            organization_id: target.organization_id,
            target_id: target.id,
            finding_type: 'stakeholder_activity',
            title: `${target.name}: ${cleanHtml(title).substring(0, 400)}`,
            content: `New content from ${target.name}`,
            source_url: link,
            relevance_score: 0.65,
            sentiment: 'neutral',
            metadata: { source: 'rss_monitor' },
            action_required: false,
            processed: false
          })
        }
      } catch (error) {
        console.error(`Error monitoring stakeholder ${target.name}:`, error)
      }
    }
  }
  
  return findings
}

// Helper functions
function cleanHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateRelevance(content: string, keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 0.5
  
  const lowerContent = content.toLowerCase()
  const matches = keywords.filter(k => lowerContent.includes(k.toLowerCase())).length
  return Math.min(0.95, 0.5 + (matches * 0.15))
}