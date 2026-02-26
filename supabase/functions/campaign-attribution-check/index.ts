// Campaign Attribution Check
// Purpose: Check if detected content matches any campaign fingerprints
// Trigger: Called during intelligence monitoring when new articles/content detected

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface AttributionCheckRequest {
  organizationId: string
  articleContent: string
  articleTitle: string
  articleUrl: string
  sourceType: string // 'news', 'twitter', 'linkedin', 'blog'
  sourceOutlet?: string
  publishedAt?: string
  estimatedReach?: number
}

interface AttributionResult {
  match: boolean
  attribution?: any
  reason?: string
}

serve(async (req) => {
  try {
    const body: AttributionCheckRequest = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('🔍 Checking attribution for:', body.articleUrl)

    // 1. Get active fingerprints for this org
    const { data: fingerprints, error: fpError } = await supabase
      .from('campaign_fingerprints')
      .select('*')
      .eq('organization_id', body.organizationId)
      .in('export_status', ['exported', 'matched'])
      .gte('tracking_end', new Date().toISOString())

    if (fpError) {
      console.error('Error fetching fingerprints:', fpError)
      throw fpError
    }

    if (!fingerprints || fingerprints.length === 0) {
      console.log('   No active fingerprints found')
      return new Response(
        JSON.stringify({
          match: false,
          reason: 'no_active_fingerprints'
        } as AttributionResult),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`   Found ${fingerprints.length} active fingerprints`)

    // 2. Check exact phrase matches (HIGH confidence - 95%)
    console.log('   Checking exact phrase matches...')
    for (const fingerprint of fingerprints) {
      const exactMatches = findExactPhraseMatches(
        body.articleContent,
        fingerprint.key_phrases || []
      )

      if (exactMatches.length >= 2) {
        console.log(`   ✅ Found ${exactMatches.length} exact phrase matches!`)
        const attribution = await recordAttribution(supabase, {
          fingerprintId: fingerprint.id,
          campaignId: fingerprint.campaign_id,
          organizationId: body.organizationId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: 0.95,
          matchType: 'exact_phrase',
          matchDetails: { matched_phrases: exactMatches },
          estimatedReach: body.estimatedReach
        })

        return new Response(
          JSON.stringify({
            match: true,
            attribution
          } as AttributionResult),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    // 3. Check semantic similarity (MEDIUM confidence - 75-85%)
    console.log('   Checking semantic similarity...')
    const articleEmbedding = await generateEmbedding(body.articleContent)

    const { data: semanticMatches, error: semError } = await supabase
      .rpc('match_content_to_fingerprints', {
        content_embedding: articleEmbedding,
        org_filter: body.organizationId,
        match_threshold: 0.75,
        match_count: 3
      })

    if (semError) {
      console.error('Error in semantic matching:', semError)
    }

    if (semanticMatches && semanticMatches.length > 0) {
      const match = semanticMatches[0]

      // Check timing - published within reasonable window of campaign
      const daysSinceCampaign = match.exported_at
        ? daysBetween(
            new Date(match.exported_at),
            new Date(body.publishedAt || Date.now())
          )
        : 0

      if (daysSinceCampaign <= 30) {
        console.log(`   ✅ Semantic match found (similarity: ${match.similarity.toFixed(2)})`)
        const attribution = await recordAttribution(supabase, {
          fingerprintId: match.fingerprint_id,
          campaignId: match.campaign_id,
          organizationId: body.organizationId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: match.similarity,
          matchType: 'semantic',
          matchDetails: {
            similarity: match.similarity,
            days_since_campaign: daysSinceCampaign
          },
          estimatedReach: body.estimatedReach
        })

        return new Response(
          JSON.stringify({
            match: true,
            attribution
          } as AttributionResult),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    // 4. Check contextual signals for remaining fingerprints (LOWER confidence - 65-75%)
    console.log('   Checking contextual matches...')
    for (const fingerprint of fingerprints.slice(0, 5)) {
      const contextMatch = await checkContextualMatch(
        body.articleTitle,
        body.articleContent,
        body.sourceOutlet || '',
        body.publishedAt || new Date().toISOString(),
        fingerprint
      )

      if (contextMatch.score > 0.65) {
        console.log(`   ✅ Contextual match found (score: ${contextMatch.score.toFixed(2)})`)
        const attribution = await recordAttribution(supabase, {
          fingerprintId: fingerprint.id,
          campaignId: fingerprint.campaign_id,
          organizationId: body.organizationId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: contextMatch.score,
          matchType: 'contextual',
          matchDetails: contextMatch.details,
          estimatedReach: body.estimatedReach
        })

        return new Response(
          JSON.stringify({
            match: true,
            attribution
          } as AttributionResult),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    // No match found
    console.log('   ❌ No sufficient match found')
    return new Response(
      JSON.stringify({
        match: false,
        reason: 'no_sufficient_match'
      } as AttributionResult),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in campaign-attribution-check:', error)

    return new Response(
      JSON.stringify({
        match: false,
        error: error instanceof Error ? error.message : 'Attribution check failed'
      } as AttributionResult),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function findExactPhraseMatches(articleText: string, keyPhrases: string[]): string[] {
  const lowerArticle = articleText.toLowerCase()
  return keyPhrases.filter(phrase =>
    lowerArticle.includes(phrase.toLowerCase())
  )
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000)
    })
  })

  const data = await response.json()
  return data.data[0].embedding
}

function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime())
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

async function checkContextualMatch(
  articleTitle: string,
  articleContent: string,
  articleSource: string,
  articlePublishedAt: string,
  fingerprint: any
): Promise<{score: number, details: any}> {
  const prompt = `Determine if this article is likely from this campaign.

CAMPAIGN INFO:
- Key angles: ${JSON.stringify(fingerprint.unique_angles)}
- Key phrases: ${(fingerprint.key_phrases || []).join(', ')}
- Expected channels: ${(fingerprint.expected_channels || []).join(', ') || 'unknown'}
- Content type: ${fingerprint.content_type}
- Exported: ${fingerprint.exported_at}

ARTICLE INFO:
- Title: ${articleTitle}
- Content: ${articleContent.slice(0, 1000)}
- Source: ${articleSource}
- Published: ${articlePublishedAt}

Return JSON:
{
  "is_match": true/false,
  "confidence": 0-1,
  "reasoning": "brief explanation",
  "matched_elements": ["what matched"]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  try {
    const result = JSON.parse(text)
    return {
      score: result.is_match ? result.confidence : 0,
      details: {
        reasoning: result.reasoning,
        matched_elements: result.matched_elements
      }
    }
  } catch (e) {
    console.error('Failed to parse contextual match:', e)
    return { score: 0, details: {} }
  }
}

async function recordAttribution(supabase: any, data: any) {
  // Check if attribution already exists
  const { data: existing } = await supabase
    .from('campaign_attributions')
    .select('id')
    .eq('fingerprint_id', data.fingerprintId)
    .eq('source_url', data.sourceUrl)
    .maybeSingle()

  if (existing) {
    console.log('   Attribution already exists')
    return { id: existing.id, status: 'already_exists' }
  }

  // Create new attribution
  const { data: attribution, error } = await supabase
    .from('campaign_attributions')
    .insert({
      organization_id: data.organizationId,
      fingerprint_id: data.fingerprintId,
      campaign_id: data.campaignId,
      source_type: data.sourceType,
      source_url: data.sourceUrl,
      source_outlet: data.sourceOutlet,
      content_title: data.contentTitle,
      content_text: data.contentText,
      published_at: data.publishedAt,
      confidence_score: data.confidence,
      match_type: data.matchType,
      match_details: data.matchDetails,
      estimated_reach: data.estimatedReach
    })
    .select()
    .single()

  if (error) {
    console.error('Error recording attribution:', error)
    throw new Error(`Failed to record attribution: ${error.message}`)
  }

  // Update fingerprint status
  await supabase
    .from('campaign_fingerprints')
    .update({ export_status: 'matched' })
    .eq('id', data.fingerprintId)

  console.log('   ✅ Attribution recorded:', attribution.id)

  return attribution
}
