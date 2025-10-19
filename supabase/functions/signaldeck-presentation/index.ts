import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface SignalDeckRequest {
  approved_outline: {
    topic: string
    audience: string
    purpose: string
    key_messages: string[]
    slide_count?: number
    sections: Array<{
      title: string
      talking_points: string[]
      visual_suggestion?: string
    }>
  }
  theme?: {
    primary: string
    secondary: string
    accent: string
  }
  include_speaker_notes?: boolean
  organization_id?: string
}

interface GenerationStatus {
  generationId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  fileUrl?: string
  error?: string
  progress?: number
}

// Database-backed status storage (replaces in-memory Map)
async function getGenerationStatus(generationId: string): Promise<GenerationStatus | null> {
  const { data, error } = await supabase
    .from('presentation_generations')
    .select('*')
    .eq('id', generationId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    generationId: data.id,
    status: data.status,
    fileUrl: data.file_url || data.download_url,
    error: data.error,
    progress: data.progress
  }
}

async function setGenerationStatus(status: GenerationStatus, organizationId: string, metadata?: any): Promise<void> {
  const { error } = await supabase
    .from('presentation_generations')
    .upsert({
      id: status.generationId,
      organization_id: organizationId,
      status: status.status,
      progress: status.progress || 0,
      file_url: status.fileUrl,
      download_url: status.fileUrl,
      error: status.error,
      metadata: metadata || {},
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving generation status:', error)
    throw error
  }
}

// Parse visual suggestion to determine type and details
function parseVisualSuggestion(suggestion: string) {
  const lower = suggestion.toLowerCase()

  // Determine visual type
  if (lower.includes('chart') || lower.includes('graph')) {
    // Determine chart type
    let chart_type = 'bar'
    if (lower.includes('line')) chart_type = 'line'
    else if (lower.includes('pie')) chart_type = 'pie'
    else if (lower.includes('column')) chart_type = 'column'
    else if (lower.includes('area')) chart_type = 'area'

    return {
      type: 'chart',
      chart_type,
      description: suggestion,
      needsVertexAI: false
    }
  } else if (lower.includes('timeline') || lower.includes('roadmap')) {
    return {
      type: 'timeline',
      description: suggestion,
      needsVertexAI: false
    }
  } else if (lower.includes('diagram') || lower.includes('flow') || lower.includes('process')) {
    return {
      type: 'diagram',
      description: suggestion,
      needsVertexAI: false
    }
  } else if (lower.includes('photo') || lower.includes('image') || lower.includes('picture') ||
             lower.includes('workspace') || lower.includes('team') || lower.includes('office') ||
             lower.includes('illustration') || lower.includes('scene')) {
    return {
      type: 'visual',
      description: suggestion,
      needsVertexAI: true,
      imagePrompt: suggestion
    }
  } else if (lower.includes('quote')) {
    return {
      type: 'quote',
      description: suggestion,
      needsVertexAI: false
    }
  } else if (lower.includes('table') || lower.includes('data')) {
    return {
      type: 'data_table',
      description: suggestion,
      needsVertexAI: false
    }
  } else {
    return {
      type: 'content',
      description: suggestion,
      needsVertexAI: false
    }
  }
}

// Generate AI image using Vertex AI
async function generateAIImage(prompt: string, organizationId: string): Promise<string | null> {
  try {
    console.log('🎨 Generating AI image with Vertex AI:', prompt)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        prompt,
        organizationId,
        aspectRatio: '16:9' // Standard presentation aspect ratio
      })
    })

    if (!response.ok) {
      console.error('Vertex AI error:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.imageUrl || data.url || null
  } catch (error) {
    console.error('Error generating AI image:', error)
    return null
  }
}

// Generate presentation data using Claude (like orchestrator.js)
async function generatePresentationData(outline: SignalDeckRequest['approved_outline']) {
  console.log('📝 Generating presentation content with Claude')

  const prompt = `Transform this presentation outline into detailed slide content.

Topic: ${outline.topic}
Audience: ${outline.audience}
Purpose: ${outline.purpose}

Key Messages:
${outline.key_messages.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Approved Outline (use these exact sections as your slides):
${outline.sections.map((s, i) => `
Slide ${i + 2}: ${s.title}
Talking Points: ${s.talking_points.join('; ')}
Visual: ${s.visual_suggestion || 'content only'}
`).join('\n')}

Instructions:
1. Create a title slide (slide 1) with the topic and a subtitle summarizing the purpose
2. For each section in the outline, create one slide using:
   - The section title as the slide title (keep it exactly as provided)
   - Transform the talking points into polished bullet points (3-5 points)
   - Generate speaker notes that expand on the talking points
   - Parse the visual suggestion to create the visual_element:
     * If it mentions "chart" or "graph": create chart with realistic sample data
     * If it mentions "timeline": create timeline with events and dates
     * If it mentions "image", "photo", "illustration": mark as image type
     * Otherwise: set type to "content"
3. Add a closing slide thanking the audience

Return JSON format (IMPORTANT: return ONLY this JSON, no other text):
{
  "title": "${outline.topic}",
  "slides": [
    {
      "type": "title",
      "title": "${outline.topic}",
      "body": ["${outline.purpose}"],
      "notes": "Opening slide - introduce yourself and the topic"
    },
${outline.sections.map((s, i) => `    {
      "type": "content",
      "title": "${s.title}",
      "body": [${s.talking_points.map(p => `"${p.replace(/"/g, '\\"')}"`).join(', ')}],
      "notes": "Expand on these points: ${s.talking_points.join('; ')}",
      "visual_element": ${s.visual_suggestion ? `{ "type": "to_be_determined", "description": "${s.visual_suggestion.replace(/"/g, '\\"')}" }` : 'null'}
    }`).join(',\n')},
    {
      "type": "closing",
      "title": "Thank You",
      "body": ["Questions?", "Contact information"],
      "notes": "Wrap up and invite questions"
    }
  ]
}

CRITICAL:
- For visual_element, if description contains "chart"/"graph", add: "chart_type": "bar", "data": {"labels": ["Q1","Q2","Q3","Q4"], "values": [100,120,150,180]}
- If description contains "timeline", add realistic events with dates
- If description contains "image"/"photo"/"illustration", set type to "image"
- Return ONLY valid JSON, no markdown code blocks, no extra text`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,  // Increased for larger presentations
        messages: [{
          role: 'user',
          content: prompt + '\n\nIMPORTANT: Return ONLY valid JSON with no additional text before or after. Escape all quotes in content properly.'
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    let content = data.content?.[0]?.text

    if (!content) {
      throw new Error('No content in Claude response')
    }

    // Try to extract JSON more carefully
    // First, try to find JSON wrapped in code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (codeBlockMatch) {
      content = codeBlockMatch[1]
    } else {
      // Otherwise, look for JSON object boundaries
      // Find the first { and count braces to find matching }
      const firstBrace = content.indexOf('{')
      if (firstBrace === -1) {
        throw new Error('No JSON object found in Claude response')
      }

      let braceCount = 0
      let inString = false
      let escapeNext = false
      let jsonEnd = -1

      for (let i = firstBrace; i < content.length; i++) {
        const char = content[i]

        if (escapeNext) {
          escapeNext = false
          continue
        }

        if (char === '\\') {
          escapeNext = true
          continue
        }

        if (char === '"') {
          inString = !inString
          continue
        }

        if (!inString) {
          if (char === '{') braceCount++
          if (char === '}') {
            braceCount--
            if (braceCount === 0) {
              jsonEnd = i + 1
              break
            }
          }
        }
      }

      if (jsonEnd === -1) {
        throw new Error('Could not find complete JSON object')
      }

      content = content.substring(firstBrace, jsonEnd)
    }

    console.log('📝 Parsing JSON response...')
    const parsed = JSON.parse(content)

    // Validate the parsed data has the required structure
    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      console.error('❌ Invalid presentation data structure - missing slides array')
      console.error('Parsed data:', JSON.stringify(parsed, null, 2).substring(0, 1000))
      throw new Error('Claude response missing slides array')
    }

    console.log('✅ Valid presentation data with', parsed.slides.length, 'slides')
    return parsed
  } catch (error) {
    console.error('Error generating with Claude:', error)
    if (error instanceof SyntaxError) {
      console.error('JSON parse error - response may be too large or malformed')
      console.error('First 500 chars of content:', content?.substring(0, 500))
    }
    throw error
  }
}

// Build PowerPoint file by calling Next.js API
async function buildPresentation(presentationData: any, theme: any, generationId: string, orgId: string) {
  console.log('🏗️ Building PowerPoint presentation')

  const fileName = `${generationId}.pptx`

  try {
    // Call the Next.js API endpoint to build the presentation
    // In production, replace with your actual domain
    const apiUrl = Deno.env.get('NEXTJS_API_URL') || 'http://localhost:3000'
    const buildUrl = `${apiUrl}/api/build-presentation`

    console.log('📤 Calling builder API:', buildUrl)

    const response = await fetch(buildUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        presentationData,
        theme,
        organizationId: orgId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Builder API error:', errorText)
      throw new Error(`Builder API failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Builder failed')
    }

    console.log('✅ PowerPoint built:', result.fileName)

    return {
      fileName: result.fileName,
      filePath: result.filePath,
      fileSize: result.fileSize,
      fileData: result.fileData // Base64 encoded
    }
  } catch (error) {
    console.error('❌ Build presentation error:', error)
    throw error
  }
}

// Upload presentation to Supabase Storage
async function uploadPresentation(fileData: string, fileName: string, orgId: string) {
  console.log('📤 Uploading presentation to Supabase Storage')

  const bucketName = 'presentations'
  const storagePath = `${orgId}/${fileName}`

  try {
    // Decode base64 file data
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, binaryData, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    console.log('✅ Uploaded to storage:', storagePath)

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('❌ Upload error:', error)
    throw error
  }
}

// Save metadata to content_library
async function saveToContentLibrary(
  presentationData: any,
  fileUrl: string,
  outline: SignalDeckRequest['approved_outline'],
  orgId: string
) {
  console.log('💾 Saving to content_library')

  const { data, error } = await supabase
    .from('content_library')
    .insert({
      organization_id: orgId,
      content_type: 'signaldeck',
      title: presentationData.title || outline.topic,
      content: fileUrl,
      metadata: {
        outline,
        slide_count: presentationData.slides?.length || outline.slide_count,
        has_charts: outline.sections.some(s => s.visual_element?.type === 'chart'),
        has_timelines: outline.sections.some(s => s.visual_element?.type === 'timeline'),
        generated_at: new Date().toISOString()
      },
      tags: ['presentation', 'signaldeck', outline.topic],
      status: 'completed',
      folder: 'presentations',
      created_by: 'niv'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving to content_library:', error)
    throw error
  }

  return data
}

// Main generation function (runs asynchronously)
async function generatePresentation(generationId: string, request: SignalDeckRequest) {
  const orgId = request.organization_id || 'default'

  try {
    // Update status to processing
    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 10
    }, orgId, { outline: request.approved_outline })

    // Step 1: Generate content with Claude
    console.log('Step 1: Generating content...')
    const presentationData = await generatePresentationData(request.approved_outline)

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 40
    }, orgId)

    // Step 1.5: Generate AI images with Vertex AI for visual slides
    console.log('Step 1.5: Processing visual suggestions...')
    if (presentationData.slides) {
      for (const slide of presentationData.slides) {
        // Check if this slide needs Vertex AI image
        if (slide.visual_element) {
          const visualType = slide.visual_element.type
          const needsAI = visualType === 'visual' || visualType === 'image'

          if (needsAI && slide.visual_element.description) {
            console.log('🎨 Generating AI image for:', slide.title)
            const imageUrl = await generateAIImage(
              slide.visual_element.description,
              request.organization_id || 'default'
            )

            if (imageUrl) {
              slide.imageUrl = imageUrl
              console.log('✅ AI image generated:', imageUrl)
            } else {
              console.log('⚠️ AI image generation skipped (Vertex AI unavailable)')
            }
          }
        }
      }
    }

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 60
    }, orgId)

    // Step 2: Build PowerPoint
    console.log('Step 2: Building PowerPoint...')
    const theme = request.theme || {
      primary: '1a1a2e',
      secondary: '16213e',
      accent: '0f3460'
    }

    const fileInfo = await buildPresentation(presentationData, theme, generationId, orgId)

    await setGenerationStatus({
      generationId,
      status: 'processing',
      progress: 75
    }, orgId)

    // Step 3: Upload to storage
    console.log('Step 3: Uploading...')
    const fileUrl = await uploadPresentation(
      fileInfo.fileData,
      fileInfo.fileName,
      orgId
    )

    // Step 4: Save to content library
    console.log('Step 4: Saving metadata...')
    await saveToContentLibrary(
      presentationData,
      fileUrl,
      request.approved_outline,
      orgId
    )

    // Update status to completed
    await setGenerationStatus({
      generationId,
      status: 'completed',
      fileUrl,
      progress: 100
    }, orgId)

    console.log('✅ Presentation generation complete!')
  } catch (error) {
    console.error('❌ Generation error:', error)
    await setGenerationStatus({
      generationId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, orgId)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')

    // Check if this is a status check request
    const generationIdFromPath = pathParts.length > 2 && pathParts[pathParts.length - 2] === 'status'
      ? pathParts[pathParts.length - 1]
      : null
    const generationIdFromQuery = url.searchParams.get('generationId')
    const generationId = generationIdFromPath || generationIdFromQuery

    if (generationId) {
      console.log('🔍 Status check for generation:', generationId)
      const status = await getGenerationStatus(generationId)

      if (!status) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'not_found',
            message: 'Generation ID not found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...status,
          downloadUrl: status.fileUrl  // Add downloadUrl for frontend compatibility
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Regular generation request
    const body = await req.json()
    const request: SignalDeckRequest = body.parameters || body

    console.log('✅ SignalDeck generation request:', {
      topic: request.approved_outline?.topic,
      slideCount: request.approved_outline?.slide_count
    })

    // Generate unique ID
    const newGenerationId = crypto.randomUUID()

    // Store initial status in database
    await setGenerationStatus({
      generationId: newGenerationId,
      status: 'pending',
      progress: 0
    }, request.organization_id || 'default', { outline: request.approved_outline })

    // Start generation in background (fire and forget)
    generatePresentation(newGenerationId, request).catch(error => {
      console.error('Background generation error:', error)
    })

    // Return immediately with pending status
    return new Response(
      JSON.stringify({
        success: true,
        generationId: newGenerationId,
        status: 'pending',
        contentType: 'signaldeck',
        estimatedTime: '15-30 seconds',
        statusEndpoint: `${SUPABASE_URL}/functions/v1/signaldeck-presentation/status/${newGenerationId}`,
        message: 'Presentation generation started'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('SignalDeck presentation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/*
 * SIGNALDECK EDGE FUNCTION
 *
 * This function handles PowerPoint presentation generation using SignalDeck.
 *
 * Features:
 * - AI-powered content generation (Claude)
 * - Professional PowerPoint with charts, timelines, diagrams
 * - Automatic MemoryVault storage
 * - Status polling for async generation
 *
 * TODO for Production:
 * 1. Implement actual PowerPoint generation (call Node.js builder or port to Deno)
 * 2. Set up proper file storage in Supabase Storage
 * 3. Add chart/timeline/diagram generation
 * 4. Implement caching and cleanup for generation store
 * 5. Add error recovery and retry logic
 */
