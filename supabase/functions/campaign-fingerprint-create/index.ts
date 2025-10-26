// Campaign Fingerprint Creation
// Purpose: Create fingerprint when content is exported for automatic attribution tracking
// Trigger: Called when user exports content (PDF, DOCX, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface FingerprintRequest {
  campaignId?: string
  contentId: string
  content: string
  contentType: string
  organizationId: string
  exportFormat?: string
  intendedChannels?: string[]
  intendedUrls?: string[]
}

interface FingerprintResult {
  success: boolean
  fingerprintId?: string
  error?: string
}

serve(async (req) => {
  try {
    const body: FingerprintRequest = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('🔍 Creating fingerprint for content:', body.contentId)

    // 1. Extract key phrases using Claude
    console.log('   Extracting key phrases...')
    const keyPhrases = await extractKeyPhrases(body.content)
    console.log(`   Found ${keyPhrases.length} key phrases`)

    // 2. Identify unique angles using Claude
    console.log('   Identifying unique angles...')
    const uniqueAngles = await identifyAngles(body.content, body.contentType)
    console.log('   Angles identified')

    // 3. Generate embeddings using OpenAI
    console.log('   Generating embeddings...')
    const embeddings = await generateFingerprints(body.content)
    console.log('   Embeddings generated')

    // 4. Store fingerprint
    const { data: fingerprint, error: fpError } = await supabase
      .from('campaign_fingerprints')
      .insert({
        organization_id: body.organizationId,
        campaign_id: body.campaignId || null,
        content_id: body.contentId,
        key_phrases: keyPhrases,
        semantic_embedding: embeddings.semantic,
        headline_embedding: embeddings.headline,
        unique_angles: uniqueAngles,
        content_type: body.contentType,
        content_preview: body.content.slice(0, 500),
        expected_channels: body.intendedChannels || [],
        known_urls: body.intendedUrls || [],
        exported_at: new Date().toISOString(),
        tracking_end: new Date(Date.now() + 90*24*60*60*1000).toISOString() // 90 days
      })
      .select()
      .single()

    if (fpError) {
      console.error('❌ Failed to create fingerprint:', fpError)
      throw new Error(`Failed to create fingerprint: ${fpError.message}`)
    }

    console.log('✅ Fingerprint created:', fingerprint.id)

    // 5. Record export event
    await supabase
      .from('content_exports')
      .insert({
        organization_id: body.organizationId,
        content_id: body.contentId,
        fingerprint_id: fingerprint.id,
        export_format: body.exportFormat || 'unknown',
        intended_channels: body.intendedChannels || [],
        intended_urls: body.intendedUrls || []
      })

    console.log('✅ Export event recorded')

    return new Response(
      JSON.stringify({
        success: true,
        fingerprintId: fingerprint.id,
        keyPhrases: keyPhrases,
        trackingUntil: fingerprint.tracking_end
      } as FingerprintResult),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in campaign-fingerprint-create:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Fingerprint creation failed'
      } as FingerprintResult),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function extractKeyPhrases(content: string): Promise<string[]> {
  const prompt = `Extract 5-10 distinctive key phrases from this content that would uniquely identify it if seen in media coverage.

Content: ${content.slice(0, 2000)}

Return phrases that are:
- 3-7 words long
- Unique/distinctive (not generic)
- Likely to be quoted or referenced
- Include specific claims, data points, or unique positioning

Return as JSON object: {"phrases": ["phrase1", "phrase2", ...]}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  try {
    const result = JSON.parse(text)
    return result.phrases || []
  } catch (e) {
    console.error('Failed to parse key phrases:', e)
    return []
  }
}

async function identifyAngles(content: string, contentType: string): Promise<any> {
  const prompt = `Identify the unique angles and positioning in this ${contentType}.

Content: ${content.slice(0, 2000)}

Extract:
- Main narrative angle
- Key data points/statistics mentioned
- Unique claims or differentiators
- Quoted individuals (if any)
- Specific company/product names
- Key messages or themes

Return as JSON object with these fields.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('Failed to parse angles:', e)
    return {}
  }
}

async function generateFingerprints(content: string): Promise<{semantic: number[], headline: number[]}> {
  // Extract headline/first paragraph for headline embedding
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  const headline = lines[0]?.slice(0, 500) || content.slice(0, 500)

  // Generate both embeddings in parallel
  const [semanticResp, headlineResp] = await Promise.all([
    fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content.slice(0, 8000) // Full content
      })
    }),
    fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: headline // Just headline
      })
    })
  ])

  const semanticData = await semanticResp.json()
  const headlineData = await headlineResp.json()

  return {
    semantic: semanticData.data[0].embedding,
    headline: headlineData.data[0].embedding
  }
}
