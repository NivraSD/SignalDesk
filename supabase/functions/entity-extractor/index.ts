import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * ENTITY EXTRACTOR
 *
 * Stage 2 of Schema Generation Pipeline
 *
 * Uses Gemini 2.5 Flash (primary) / Claude (fallback) to extract
 * structured entities from scraped website text.
 *
 * Extracts:
 * - Products & Services
 * - Team members & Leadership
 * - Locations & Offices
 * - Subsidiaries & Business units
 */

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')

interface ExtractorRequest {
  organization_id: string
  organization_name: string
  scraped_pages: Array<{
    url: string
    title: string
    markdown: string
  }>
}

// === AI Helpers ===

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 2000
): Promise<Response> {
  const retryableStatuses = [429, 500, 502, 503, 529]
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.ok || !retryableStatuses.includes(response.status)) {
      return response
    }
    if (attempt < maxRetries) {
      const jitter = Math.random() * 0.5 + 1
      const delay = Math.round(baseDelay * Math.pow(2, attempt) * jitter)
      console.log(`⚠️ API returned ${response.status}, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    } else {
      return response
    }
  }
  throw new Error('Unexpected: retry loop exited without returning')
}

function parseJSON(text: string): any {
  let clean = text.trim()
  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  if (clean.includes('```json')) {
    const match = clean.match(/```json\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  } else if (clean.includes('```')) {
    const match = clean.match(/```\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  }
  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) } catch (_) { /* continue */ }
  }

  throw new Error('Failed to parse JSON from AI response')
}

async function callGemini(prompt: string): Promise<any> {
  if (!GOOGLE_API_KEY) throw new Error('No Google API key configured')

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8000 }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseJSON(content)
}

async function callClaude(prompt: string): Promise<any> {
  if (!ANTHROPIC_API_KEY) throw new Error('No Anthropic API key configured')

  const response = await fetchWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Claude error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text || ''
  return parseJSON(content)
}

async function callAI(prompt: string): Promise<any> {
  try {
    return await callGemini(prompt)
  } catch (err: any) {
    console.warn(`Gemini failed: ${err.message}, trying Claude...`)
    return await callClaude(prompt)
  }
}

// === Extraction prompt ===

function buildExtractionPrompt(organizationName: string, content: string): string {
  return `You are analyzing website content for ${organizationName}. Extract structured information about the organization.

<website_content>
${content}
</website_content>

Extract and return a JSON object with the following structure:

{
  "products": [
    {
      "name": "Product name",
      "description": "What it does",
      "category": "Product category",
      "url": "Product page URL if mentioned",
      "brand": "Brand name (use organization name if not specified)",
      "price": "Price as number (e.g., 99.99)",
      "currency": "Currency code (e.g., USD, EUR)",
      "image": "Product image URL if available",
      "sku": "Product SKU/ID if mentioned",
      "availability": "in_stock|out_of_stock|pre_order"
    }
  ],
  "services": [
    {
      "name": "Service name",
      "description": "What it provides",
      "category": "Service category",
      "service_type": "Type of service"
    }
  ],
  "team": [
    {
      "name": "Person name",
      "title": "Job title",
      "role": "Role/responsibility",
      "bio": "Brief bio if available",
      "linkedin_url": "LinkedIn URL if mentioned",
      "image_url": "Photo URL if available"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "type": "headquarters|office|store|facility",
      "address": "Full address",
      "city": "City",
      "state": "State/Province",
      "country": "Country",
      "postal_code": "Postal code",
      "phone": "Phone number",
      "email": "Email"
    }
  ],
  "subsidiaries": [
    {
      "name": "Subsidiary name",
      "description": "What they do",
      "type": "subsidiary|division|business_unit",
      "industry": "Industry",
      "url": "Website URL"
    }
  ]
}

Guidelines:
- Only extract information explicitly mentioned in the content
- Be thorough but accurate - don't invent information
- For team members, prioritize leadership and executives
- Include as much detail as available for each entity
- Return valid JSON only, no additional text`
}

// === Main handler ===

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const {
      organization_id,
      organization_name,
      scraped_pages
    }: ExtractorRequest = await req.json()

    if (!organization_id || !organization_name || !scraped_pages) {
      throw new Error('organization_id, organization_name, and scraped_pages required')
    }

    console.log('🔍 Entity Extractor Starting:', {
      organization_name,
      pages_count: scraped_pages.length
    })

    // Combine all page content
    const combinedContent = scraped_pages
      .map(page => {
        const pageContent = `# ${page.title || page.url}\n\n${page.markdown}`
        console.log(`   - Page: ${page.url} → ${page.markdown?.length || 0} chars`)
        return pageContent
      })
      .join('\n\n---\n\n')

    console.log(`📄 Processing ${combinedContent.length} characters of text from ${scraped_pages.length} pages`)

    if (combinedContent.length < 500) {
      console.warn(`⚠️  WARNING: Very little content (${combinedContent.length} chars) - extraction will likely fail`)
      console.log(`First 500 chars of content:`, combinedContent.substring(0, 500))
    }

    // Gemini has a large context window, so chunk threshold is generous
    const MAX_CHARS_PER_CHUNK = 400000
    const needsChunking = combinedContent.length > MAX_CHARS_PER_CHUNK

    if (needsChunking) {
      console.log(`⚠️  Content too large (${combinedContent.length} chars), chunking into ${Math.ceil(combinedContent.length / MAX_CHARS_PER_CHUNK)} parts`)
    }

    // Process content (chunked if necessary)
    let allEntities

    if (needsChunking) {
      const chunks: string[] = []
      let currentChunk = ''

      for (const page of scraped_pages) {
        const pageContent = `# ${page.title || page.url}\n\n${page.markdown}\n\n---\n\n`

        if (currentChunk.length + pageContent.length > MAX_CHARS_PER_CHUNK && currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = pageContent
        } else {
          currentChunk += pageContent
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
      }

      console.log(`📦 Processing ${chunks.length} chunks:`, chunks.map(c => `${c.length} chars`))

      const chunkResults = await Promise.all(
        chunks.map((chunk, idx) => {
          console.log(`   Processing chunk ${idx + 1}/${chunks.length}...`)
          return callAI(buildExtractionPrompt(organization_name, chunk))
        })
      )

      allEntities = {
        products: [],
        services: [],
        team: [],
        locations: [],
        subsidiaries: []
      }

      for (const result of chunkResults) {
        allEntities.products.push(...(result.products || []))
        allEntities.services.push(...(result.services || []))
        allEntities.team.push(...(result.team || []))
        allEntities.locations.push(...(result.locations || []))
        allEntities.subsidiaries.push(...(result.subsidiaries || []))
      }

      console.log(`✅ Merged results from ${chunks.length} chunks`)
    } else {
      allEntities = await callAI(buildExtractionPrompt(organization_name, combinedContent))
    }

    const totalEntities =
      (allEntities.products?.length || 0) +
      (allEntities.services?.length || 0) +
      (allEntities.team?.length || 0) +
      (allEntities.locations?.length || 0) +
      (allEntities.subsidiaries?.length || 0)

    console.log('✅ Entity Extraction Complete:', {
      total_entities: totalEntities,
      products: allEntities.products?.length || 0,
      services: allEntities.services?.length || 0,
      team: allEntities.team?.length || 0,
      locations: allEntities.locations?.length || 0,
      subsidiaries: allEntities.subsidiaries?.length || 0
    })

    return new Response(
      JSON.stringify({
        success: true,
        entities: {
          products: allEntities.products || [],
          services: allEntities.services || [],
          team: allEntities.team || [],
          locations: allEntities.locations || [],
          subsidiaries: allEntities.subsidiaries || []
        },
        summary: {
          total_entities: totalEntities,
          by_type: {
            products: allEntities.products?.length || 0,
            services: allEntities.services?.length || 0,
            team: allEntities.team?.length || 0,
            locations: allEntities.locations?.length || 0,
            subsidiaries: allEntities.subsidiaries?.length || 0
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Entity Extractor Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
