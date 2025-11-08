import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlaybookRequest {
  organizationId: string
  contentType: string
  topic: string
  force?: boolean  // Force regeneration even if cached
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organizationId, contentType, topic, force = false }: PlaybookRequest = await req.json()

    console.log(`📚 Playbook request: ${contentType} + ${topic} for org ${organizationId}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check cache unless force=true
    if (!force) {
      const { data: cached } = await supabase
        .from('playbooks')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('content_type', contentType)
        .eq('topic', topic)
        .single()

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime()
        const daysOld = age / (1000 * 60 * 60 * 24)

        if (daysOld < 7) {
          console.log(`✅ Using cached playbook (${daysOld.toFixed(1)} days old)`)
          return new Response(JSON.stringify({
            success: true,
            playbook: cached.playbook,
            cached: true,
            age_days: daysOld.toFixed(1)
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log(`⏰ Cached playbook is stale (${daysOld.toFixed(1)} days old), regenerating...`)
      }
    }

    // Fetch organization profile for context
    console.log(`🏢 Fetching organization profile...`)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, industry, url, company_profile')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.warn('Failed to fetch org profile:', orgError.message)
    }

    // Gather relevant content for analysis
    console.log(`🔍 Gathering content for playbook synthesis...`)

    const { data: content, error: contentError } = await supabase
      .from('content_library')
      .select('id, title, content, content_type, created_at, executed, execution_score, feedback, folder')
      .eq('organization_id', organizationId)
      .eq('content_type', contentType)
      .ilike('folder', `%${topic}%`)  // Topic-based filtering via folder
      .order('execution_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (contentError) {
      throw new Error(`Failed to fetch content: ${contentError.message}`)
    }

    console.log(`📦 Found ${content?.length || 0} pieces of content`)

    if (!content || content.length < 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'INSUFFICIENT_DATA',
        message: `Need at least 3 pieces of ${contentType} content about ${topic} to generate playbook. Found: ${content?.length || 0}`,
        min_required: 3,
        found: content?.length || 0
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use Claude to synthesize playbook
    console.log(`🤖 Using Claude to synthesize playbook...`)

    const orgProfileContext = org ? `
ORGANIZATION PROFILE:
Company: ${org.name}
Industry: ${org.industry || 'Not specified'}
Website: ${org.url || 'Not specified'}
${org.company_profile ? `
Leadership: ${org.company_profile.leadership?.map((l: any) => `${l.name} (${l.title})`).join(', ') || 'Not specified'}
Headquarters: ${org.company_profile.headquarters?.city ? `${org.company_profile.headquarters.city}, ${org.company_profile.headquarters.state || org.company_profile.headquarters.country}` : 'Not specified'}
Size: ${org.company_profile.company_size?.employees || 'Not specified'} employees
Founded: ${org.company_profile.founded || 'Not specified'}
Products: ${org.company_profile.product_lines?.join(', ') || 'Not specified'}
Markets: ${org.company_profile.key_markets?.join(', ') || 'Not specified'}
Business Model: ${org.company_profile.business_model || 'Not specified'}
` : ''}
` : ''

    const synthesisPrompt = `You are a strategic communications analyst. Analyze these ${content.length} pieces of ${contentType} content about ${topic} and create a compact playbook for future content creation.

${orgProfileContext}

CONTENT TO ANALYZE:
${content.map((c, i) => `
${i + 1}. "${c.title}"
   Success: ${c.execution_score ? `${(c.execution_score * 100).toFixed(0)}%` : 'Not tracked'}
   Executed: ${c.executed ? 'Yes' : 'No'}
   ${c.feedback ? `Feedback: ${c.feedback}` : ''}
   Content: ${c.content?.substring(0, 800)}...
`).join('\n---\n')}

CREATE A PLAYBOOK (JSON format) with:

1. **proven_hooks**: What messaging/hooks worked best? List 3-5 with success rates.
2. **brand_voice**: What tone/voice to use? (based on patterns you see)
3. **proven_structure**: What format/structure works? (outline with sections)
4. **success_patterns**: What patterns lead to success? (3-5 specific observations)
5. **failure_patterns**: What to avoid? (if you see failed content, analyze why)
6. **typical_length**: What's the optimal word count?
7. **audience_insights**: Who responds well to this content?

BE SPECIFIC. Cite examples. Include success rates where trackable.
KEEP IT COMPACT (max 500 words total across all fields).

Return as structured JSON matching this format:
{
  "proven_hooks": [{"hook": "...", "success_rate": 0.8, "example": "..."}],
  "brand_voice": {"tone": "...", "style_points": ["..."], "avoid": ["..."]},
  "proven_structure": {"format": "...", "sections": [{"name": "...", "purpose": "...", "length": "..."}]},
  "success_patterns": ["..."],
  "failure_patterns": ["..."],
  "typical_length": {"words": {"min": 500, "max": 1000, "optimal": 750}},
  "audience_insights": ["..."]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: synthesisPrompt
        }]
      })
    })

    const claudeData = await response.json()
    const synthesisText = claudeData.content[0].text

    // Parse JSON from Claude's response
    const jsonMatch = synthesisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON')
    }

    const guidance = JSON.parse(jsonMatch[0])
    console.log(`✅ Playbook synthesized successfully`)

    // Build complete playbook object
    const playbook = {
      guidance,
      based_on: {
        content_count: content.length,
        date_range: {
          from: content[content.length - 1]?.created_at,
          to: content[0]?.created_at
        },
        avg_execution_score: content
          .filter(c => c.execution_score)
          .reduce((sum, c) => sum + (c.execution_score || 0), 0) /
          content.filter(c => c.execution_score).length || 0
      },
      top_performers: content
        .filter(c => c.execution_score && c.execution_score > 0.7)
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          title: c.title,
          execution_score: c.execution_score,
          why_successful: 'High execution score'
        }))
    }

    // Save to database (upsert)
    console.log(`💾 Saving playbook to database...`)

    const { error: upsertError } = await supabase
      .from('playbooks')
      .upsert({
        organization_id: organizationId,
        content_type: contentType,
        topic: topic,
        playbook: playbook,
        updated_at: new Date().toISOString(),
        version: 1  // TODO: Increment version on updates
      }, {
        onConflict: 'organization_id,content_type,topic'
      })

    if (upsertError) {
      throw new Error(`Failed to save playbook: ${upsertError.message}`)
    }

    console.log(`✅ Playbook saved successfully`)

    return new Response(JSON.stringify({
      success: true,
      playbook: playbook,
      cached: false,
      based_on_count: content.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ Playbook generation error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
