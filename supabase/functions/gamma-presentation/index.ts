import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Gamma API configuration
const GAMMA_API_URL = 'https://public-api.gamma.app/v0.2'
const GAMMA_API_KEY = Deno.env.get('GAMMA_API_KEY') || 'sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Store pending capture requests (in-memory, for this Edge Function instance)
// Key: generationId, Value: PresentationRequest
const pendingCaptures = new Map<string, PresentationRequest>()

interface PresentationRequest {
  title?: string
  topic?: string  // Also accept 'topic' from NIVContentOrchestrator
  content?: string
  framework?: any
  format?: 'presentation' | 'document' | 'social'
  slideCount?: number  // Also accept slideCount
  style?: string  // Also accept style
  // NEW: Capture options
  capture?: boolean  // Enable capture to campaign_presentations table
  campaign_id?: string  // Link to campaign
  organization_id?: string  // Required for capture
  // Export options are provided by Gamma after generation, not requested upfront
  options?: {
    numCards?: number
    themeName?: string
    imageSource?: 'ai' | 'unsplash' | 'web'
    tone?: string
    audience?: string
    cardSplit?: 'auto' | 'heading' | 'paragraph'
  }
}

// Convert framework to presentation-optimized content
function frameworkToPresentation(framework: any, title?: string): string {
  const objective = framework?.strategy?.objective || framework?.core?.objective || title || 'Strategic Presentation'
  const narrative = framework?.strategy?.narrative || framework?.core?.narrative || ''
  const proofPoints = framework?.strategy?.proof_points || framework?.proofPoints || []
  const tactics = framework?.tactics || {}
  const keyMessages = framework?.strategy?.keyMessages || []

  let presentationContent = `# ${objective}\n\n`

  // Executive Summary
  if (narrative) {
    presentationContent += `## Executive Summary\n${narrative}\n\n`
  }

  // Strategic Overview
  if (framework?.strategy?.rationale) {
    presentationContent += `## Strategic Rationale\n${framework.strategy.rationale}\n\n`
  }

  // Key Proof Points as individual slides
  if (proofPoints.length > 0) {
    presentationContent += `## Key Value Propositions\n\n`
    proofPoints.forEach((point: any, index: number) => {
      if (typeof point === 'string') {
        presentationContent += `### Point ${index + 1}\n${point}\n\n`
      } else if (point.title) {
        presentationContent += `### ${point.title}\n`
        if (point.description) presentationContent += `${point.description}\n`
        if (point.metrics?.length > 0) {
          presentationContent += `\n**Key Metrics:**\n`
          point.metrics.forEach((metric: string) => presentationContent += `- ${metric}\n`)
        }
        presentationContent += '\n'
      }
    })
  }

  // Key Messages
  if (keyMessages.length > 0) {
    presentationContent += `## Core Messages\n`
    keyMessages.forEach((msg: string) => {
      presentationContent += `- ${msg}\n`
    })
    presentationContent += '\n'
  }

  // Tactics & Implementation
  if (Object.keys(tactics).length > 0) {
    presentationContent += `## Implementation Strategy\n\n`

    if (tactics.content_creation?.length > 0) {
      presentationContent += `### Content Strategy\n`
      tactics.content_creation.forEach((item: string) => presentationContent += `- ${item}\n`)
      presentationContent += '\n'
    }

    if (tactics.distribution?.length > 0) {
      presentationContent += `### Distribution Channels\n`
      tactics.distribution.forEach((item: string) => presentationContent += `- ${item}\n`)
      presentationContent += '\n'
    }

    if (tactics.next_steps?.length > 0) {
      presentationContent += `### Next Steps\n`
      tactics.next_steps.forEach((item: string) => presentationContent += `- ${item}\n`)
      presentationContent += '\n'
    }
  }

  // Call to Action
  presentationContent += `## Call to Action\n`
  presentationContent += `Let's bring this vision to life together.\n`
  presentationContent += `Contact us to discuss next steps and implementation.\n`

  return presentationContent
}

// Download file from URL
async function downloadFile(url: string): Promise<Uint8Array> {
  console.log('📥 Downloading file from:', url)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

// Upload file to Supabase Storage
async function uploadToStorage(
  file: Uint8Array,
  organizationId: string,
  gammaId: string,
  extension: string,
  opportunityId?: string,
  presentationTitle?: string
): Promise<string> {
  // Build file path based on whether this is linked to an opportunity
  let filePath: string

  if (opportunityId) {
    // Store within opportunity folder structure
    // Format: {org_id}/opportunities/{opportunity_id}/presentations/{title}_{gamma_id}.pptx
    const sanitizedTitle = (presentationTitle || 'presentation')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50)

    filePath = `${organizationId}/opportunities/${opportunityId}/presentations/${sanitizedTitle}_${gammaId}.${extension}`
  } else {
    // Standalone presentation (not linked to opportunity)
    filePath = `${organizationId}/presentations/${gammaId}.${extension}`
  }

  console.log('📤 Uploading to Supabase Storage:', filePath)

  const { data, error } = await supabase.storage
    .from('presentations')
    .upload(filePath, file, {
      contentType: extension === 'pptx'
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : 'application/pdf',
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('presentations')
    .getPublicUrl(filePath)

  console.log('✅ File uploaded successfully:', urlData.publicUrl)
  return urlData.publicUrl
}

// Extract text content from PPTX file using JSZip
async function extractPptxContent(pptxBuffer: Uint8Array): Promise<{ fullText: string; slides: any[] }> {
  try {
    console.log('📄 Extracting text from PPTX...')

    // Import JSZip dynamically
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default
    const zip = await JSZip.loadAsync(pptxBuffer)

    const slides: any[] = []
    let fullText = ''

    // Extract slide XMLs from ppt/slides/ folder
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort()

    console.log(`  Found ${slideFiles.length} slides`)

    for (const slideFile of slideFiles) {
      const xmlContent = await zip.files[slideFile].async('text')

      // Extract text from XML (simplified - gets text between <a:t> tags)
      const textMatches = xmlContent.match(/<a:t>([^<]+)<\/a:t>/g) || []
      const slideText = textMatches
        .map(match => match.replace(/<\/?a:t>/g, ''))
        .join(' ')

      slides.push({
        number: slides.length + 1,
        text: slideText,
        file: slideFile
      })

      fullText += `\n--- Slide ${slides.length} ---\n${slideText}\n`
    }

    console.log(`✅ Extracted ${fullText.length} characters from ${slides.length} slides`)

    return { fullText, slides }
  } catch (error) {
    console.error('Error extracting PPTX content:', error)
    // Return empty but don't fail the whole capture
    return { fullText: '', slides: [] }
  }
}

// Capture presentation to database with full content extraction
async function capturePresentation(
  generationId: string,
  gammaUrl: string,
  pptxDownloadUrl: string | null,
  request: PresentationRequest
) {
  console.log('📥 Capture function called with request:', {
    capture: request.capture,
    organization_id: request.organization_id,
    campaign_id: request.campaign_id,
    title: request.title,
    topic: request.topic
  })

  if (!request.capture || !request.organization_id) {
    console.log('⛔ Capture disabled or no organization_id provided', {
      capture: request.capture,
      org_id: request.organization_id,
      RETURNING_NULL: true
    })
    return null
  }

  console.log('✅ Capture validation passed, proceeding with capture...')

  try {
    const presentationTitle = request.title || request.topic || 'Untitled Presentation'

    let fullText = `${presentationTitle}\n\nGamma Presentation\nGenerated: ${new Date().toISOString()}`
    let slides: any[] = []
    let pptxStorageUrl: string | null = null

    // Download and process PPTX if URL is available
    if (pptxDownloadUrl) {
      console.log('📦 PPTX download URL available - processing...')

      try {
        // Download PPTX from Gamma
        const pptxBuffer = await downloadFile(pptxDownloadUrl)

        // Upload to Supabase Storage
        pptxStorageUrl = await uploadToStorage(
          pptxBuffer,
          request.organization_id,
          generationId,
          'pptx',
          request.campaign_id,  // This is the opportunity ID
          presentationTitle
        )

        // Extract text content
        const extracted = await extractPptxContent(pptxBuffer)
        if (extracted.fullText) {
          fullText = `${presentationTitle}\n\n${extracted.fullText}`
          slides = extracted.slides
          console.log(`✅ Extracted content from ${slides.length} slides`)
        }
      } catch (error) {
        console.error('Error downloading/processing PPTX:', error)
        // Continue with metadata only
        console.log('⚠️ Continuing with metadata only')
      }
    } else {
      console.log('⚠️ No PPTX download URL provided - saving metadata only')
    }

    // Store in campaign_presentations table
    const { data, error } = await supabase
      .from('campaign_presentations')
      .insert({
        organization_id: request.organization_id,
        campaign_id: request.campaign_id || null,
        gamma_id: generationId,
        gamma_url: gammaUrl,
        gamma_edit_url: `${gammaUrl}/edit`,
        title: presentationTitle,
        topic: request.topic || request.title,
        slide_count: slides.length || request.options?.numCards || request.slideCount || 10,
        full_text: fullText,
        slides: slides,
        pptx_url: pptxStorageUrl,
        format: request.format || 'presentation',
        generation_params: {
          inputText: request.content?.substring(0, 500),
          framework: request.framework ? 'included' : 'none',
          options: request.options
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving to campaign_presentations:', error)
      throw error
    }

    console.log('✅ Presentation captured to campaign_presentations:', data.id)

    // ALSO save to Memory Vault (content_library) for NIV access
    if (fullText && fullText.length > 100) {  // Only if we have real content
      console.log('💾 Saving to Memory Vault...')

      try {
        // Build folder path based on opportunity linkage
        let folderPath: string
        if (request.campaign_id) {
          // Store within opportunity folder in Memory Vault
          folderPath = `opportunities/${request.campaign_id}/presentations`
        } else {
          // Standalone presentation folder
          folderPath = `presentations`
        }

        await supabase
          .from('content_library')
          .insert({
            organization_id: request.organization_id,
            session_id: request.campaign_id,  // Links to opportunity if available
            content_type: 'presentation',
            title: presentationTitle,
            content: fullText,
            metadata: {
              gamma_id: generationId,
              gamma_url: gammaUrl,
              slide_count: slides.length,
              format: 'pptx',
              slides: slides,
              campaign_presentation_id: data.id,
              opportunity_id: request.campaign_id,  // Explicit link
              source: 'gamma'
            },
            tags: ['gamma', 'presentation', 'auto-generated', request.campaign_id ? 'opportunity' : 'standalone'],
            status: 'final',
            folder_path: folderPath,
            file_url: pptxStorageUrl
          })

        console.log(`✅ Saved to Memory Vault at: ${folderPath}`)
      } catch (mvError) {
        console.error('Error saving to Memory Vault:', mvError)
        // Don't fail if Memory Vault save fails
      }
    }

    return data
  } catch (error) {
    console.error('Capture error:', error)
    // Don't fail the whole request if capture fails
    return null
  }
}

// Generate presentation via Gamma API
async function generatePresentation(request: PresentationRequest) {
  console.log('🎨 Generating presentation with Gamma')

  // Handle both 'title' and 'topic' fields
  const presentationTitle = request.title || request.topic || ''

  // Prepare content
  let inputText = request.content || ''

  if (request.framework && !request.content) {
    inputText = frameworkToPresentation(request.framework, presentationTitle)
  } else if (!inputText && presentationTitle) {
    inputText = `# ${presentationTitle}\n\nCreate a comprehensive presentation about ${presentationTitle}`
  }

  // No need to add tone/audience to inputText - we'll use textOptions instead

  if (!inputText) {
    throw new Error('No content provided for presentation generation')
  }

  console.log('📝 Input text preview:', inputText.substring(0, 200))

  // Call Gamma API
  try {
    // Build Gamma API request with proper structure
    const requestBody: any = {
      inputText: inputText,
      textMode: request.content ? 'preserve' : 'generate',
      format: request.format || 'presentation',
      numCards: request.options?.numCards || request.slideCount || (request.framework ? 12 : 10),
      cardSplit: request.options?.cardSplit || 'auto',
      // REQUEST PPTX EXPORT - Gamma will provide download URL in status response
      exportAs: 'pptx'
    }

    // Export URLs will be available in the GET /generations/{id} response when completed

    // Add theme only if specified (let Gamma use workspace default otherwise)
    if (request.options?.themeName && request.options.themeName !== 'auto') {
      requestBody.themeName = request.options.themeName
    }

    // Add text options if provided
    const textOptions: any = {}
    if (request.options?.tone || request.style) {
      textOptions.tone = request.options?.tone || request.style
    }
    if (request.options?.audience) {
      textOptions.audience = request.options.audience
    }
    if (Object.keys(textOptions).length > 0) {
      requestBody.textOptions = textOptions
    }

    // Add image options
    requestBody.imageOptions = {
      source: request.options?.imageSource === 'ai' ? 'aiGenerated' :
               request.options?.imageSource === 'web' ? 'webAllImages' :
               request.options?.imageSource || 'aiGenerated'
    }

    console.log('📤 Gamma API request:', {
      url: `${GAMMA_API_URL}/generations`,
      bodyPreview: {
        inputTextLength: inputText.length,
        textMode: requestBody.textMode,
        format: requestBody.format,
        numCards: requestBody.numCards
      }
    })

    const gammaResponse = await fetch(`${GAMMA_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': GAMMA_API_KEY
      },
      body: JSON.stringify(requestBody)
    })

    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text()
      console.error('Gamma API error:', gammaResponse.status, errorText)

      // Try to parse error details
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.message || errorJson.error || errorText
      } catch {
        // Keep as text if not JSON
      }

      if (gammaResponse.status === 401) {
        throw new Error('Gamma API authentication failed. Please check API key.')
      } else if (gammaResponse.status === 429) {
        throw new Error('Gamma API rate limit exceeded. Try again later.')
      } else if (gammaResponse.status === 400) {
        throw new Error(`Gamma API bad request: ${errorDetails}`)
      }

      throw new Error(`Gamma generation failed (${gammaResponse.status}): ${errorDetails}`)
    }

    const result = await gammaResponse.json()
    console.log('✅ Gamma generation response:', JSON.stringify(result))

    // According to API docs: POST returns only generationId
    const generationId = result.generationId || result.id

    if (!generationId) {
      console.error('No generation ID in response:', result)
      throw new Error('Gamma API did not return a generation ID')
    }

    console.log('📝 Generation started with ID:', generationId)

    // Return immediately with pending status - let frontend poll for completion
    // Presentations take 30-60 seconds to generate, so don't wait here
    return {
      success: true,
      generationId: generationId,
      gammaUrl: null,
      presentationUrl: null,
      url: null,
      status: 'pending',
      exportUrls: {},
      estimatedTime: '30-60 seconds',
      message: `Presentation is being generated. Generation ID: ${generationId}. Check status endpoint for updates.`,
      statusEndpoint: `${SUPABASE_URL}/functions/v1/gamma-presentation/status/${generationId}`,
      metadata: {
        format: request.format || 'presentation',
        numCards: request.options?.numCards || request.slideCount,
        needsPolling: true
      }
    }
  } catch (error) {
    console.error('Gamma generation error:', error)
    throw error
  }
}

// Check generation status (for polling)
async function checkGenerationStatus(generationId: string, captureRequest?: PresentationRequest) {
  console.log('🔍 Checking status for generation:', generationId)

  try {
    // Add 15-second timeout to prevent edge function from hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${GAMMA_API_URL}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': GAMMA_API_KEY
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      console.log('📊 Status response:', JSON.stringify(data))

      // According to docs: completed response has gammaUrl field
      const isCompleted = data.status === 'completed'

      // Extract export options from the Gamma URL if available
      const exportUrls: any = {}
      if (data.gammaUrl) {
        // Gamma provides export functionality through their UI
        // We can construct the export URLs based on the gamma URL
        const presentationId = data.gammaUrl.split('/').pop()
        if (presentationId) {
          exportUrls.view = data.gammaUrl
          exportUrls.edit = `${data.gammaUrl}/edit`
          // Check if download URLs are provided
          // Gamma API returns 'exportUrl' field (not 'pptxDownloadUrl')
          const pptxDownloadUrl = data.exportUrl || data.pptxDownloadUrl
          if (pptxDownloadUrl) {
            exportUrls.pptx = pptxDownloadUrl
          }
          if (data.pdfDownloadUrl) {
            exportUrls.pdf = data.pdfDownloadUrl
          }
        }
      }

      // NEW: Capture presentation if completed and capture was requested
      let capturedData = null
      let captureDebug: any = {
        attempted: false,
        reason: null
      }

      if (isCompleted && captureRequest?.capture) {
        console.log('🎯 Presentation completed - triggering capture...')
        captureDebug.attempted = true
        const pptxDownloadUrl = data.exportUrl || data.pptxDownloadUrl
        capturedData = await capturePresentation(
          generationId,
          data.gammaUrl,
          pptxDownloadUrl || null,
          captureRequest
        )
        if (!capturedData) {
          captureDebug.reason = 'capturePresentation returned null'
        }
      } else {
        captureDebug.reason = `isCompleted=${isCompleted}, captureRequest=${!!captureRequest}, captureRequest.capture=${captureRequest?.capture}`
      }

      return {
        success: true,
        status: data.status || 'pending',
        gammaUrl: data.gammaUrl || null,  // This is the correct field from API
        generationId: generationId,
        exportUrls: exportUrls, // Export options available after generation
        credits: data.credits || {},  // Credit usage info
        message: data.message || (isCompleted ? 'Presentation ready!' : 'Still generating...'),
        captured: capturedData ? true : false,
        capturedId: capturedData?.id || null,
        captureDebug: captureDebug  // Debug info
      }
    } else if (response.status === 404) {
      // Generation not found
      return {
        success: false,
        status: 'not_found',
        generationId: generationId,
        message: 'Generation ID not found'
      }
    } else {
      const errorText = await response.text()
      console.error('Status check error:', response.status, errorText)
      return {
        success: false,
        status: 'error',
        generationId: generationId,
        message: `Status check failed: ${response.status}`
      }
    }
  } catch (error) {
    console.error('Status check error:', error)

    // If it's a timeout/abort error, return "still processing" instead of error
    // This allows frontend to keep polling
    if (error.name === 'AbortError') {
      console.log('⏱️ Gamma API status check timed out - returning pending status')
      return {
        success: true,
        status: 'pending',
        generationId: generationId,
        message: 'Still generating... (status check timed out, will retry)'
      }
    }

    return {
      success: false,
      status: 'error',
      generationId: generationId,
      message: error.message
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')

    // Check if this is a status check request (two formats supported)
    // 1. Path-based: /gamma-presentation/status/{generationId}
    // 2. Query-based: /gamma-presentation?generationId={id}
    const generationIdFromPath = pathParts.length > 2 && pathParts[pathParts.length - 2] === 'status'
      ? pathParts[pathParts.length - 1]
      : null
    const generationIdFromQuery = url.searchParams.get('generationId')
    const generationId = generationIdFromPath || generationIdFromQuery

    if (generationId) {
      console.log('🔍 Status check requested for generation:', generationId)

      // Check if this generation has a pending capture request
      const captureRequest = pendingCaptures.get(generationId)

      const status = await checkGenerationStatus(generationId, captureRequest)

      // If completed, clean up the pending capture
      if (status.status === 'completed' || status.status === 'error') {
        pendingCaptures.delete(generationId)
      }

      return new Response(
        JSON.stringify(status),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Regular generation request
    let body
    try {
      const text = await req.text()
      console.log('📥 Raw request body:', text.substring(0, 500))

      if (!text || text.trim() === '') {
        throw new Error('Request body is empty')
      }

      body = JSON.parse(text)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }

    // Check if this is a POST status check (body contains generationId without content/topic)
    // This handles Supabase client's .invoke() which sends POST instead of GET
    // Allow capture-related fields: generationId, capture, organization_id, campaign_id
    if (body.generationId && !body.content && !body.topic && !body.framework) {
      // Status check via POST (from Supabase client)
      console.log('🔍 Status check requested via POST for generation:', body.generationId)

      // Use capture request from pending map OR from request body
      let captureRequest = pendingCaptures.get(body.generationId)
      if (!captureRequest && body.capture) {
        // Create capture request from body params
        console.log('📋 Creating capture request from polling body:', {
          capture: body.capture,
          organization_id: body.organization_id,
          campaign_id: body.campaign_id
        })
        captureRequest = {
          capture: body.capture,
          organization_id: body.organization_id,
          campaign_id: body.campaign_id,
          title: body.title,
          topic: body.topic,
          format: body.format,
          options: body.options
        } as any
      }

      const status = await checkGenerationStatus(body.generationId, captureRequest)

      // If completed, clean up the pending capture
      if (status.status === 'completed' || status.status === 'error') {
        pendingCaptures.delete(body.generationId)
      }

      return new Response(
        JSON.stringify(status),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Handle both direct requests and MCP-style requests from niv-content-robust
    let request: PresentationRequest
    if (body.tool && body.parameters) {
      // MCP-style request from niv-content-robust
      request = body.parameters as PresentationRequest
    } else if (body.arguments) {
      // Alternative MCP-style
      request = body.arguments as PresentationRequest
    } else {
      // Direct request
      request = body as PresentationRequest
    }

    console.log('✅ Parsed request:', {
      hasTitle: !!request.title,
      hasTopic: !!request.topic,
      hasContent: !!request.content,
      hasFramework: !!request.framework,
      capture: !!request.capture,
      organizationId: request.organization_id
    })

    const result = await generatePresentation(request)

    // Store capture request if capture is enabled
    if (request.capture && result.generationId) {
      console.log('💾 Storing capture request for generation:', result.generationId)
      pendingCaptures.set(result.generationId, request)

      // Clean up after 10 minutes (in case status is never polled)
      setTimeout(() => {
        if (pendingCaptures.has(result.generationId)) {
          console.log('🗑️ Cleaning up stale capture request:', result.generationId)
          pendingCaptures.delete(result.generationId)
        }
      }, 10 * 60 * 1000)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Presentation generation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: {
          type: 'presentation_outline',
          instructions: 'Manual presentation creation required',
          suggestion: 'Try using the generated content with Google Slides or PowerPoint'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

/*
 * GAMMA API DOCUMENTATION
 *
 * API Key: sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM
 *
 * Endpoints:
 * - POST /v0.2/generations - Create new presentation
 * - GET /v0.2/generations/{id} - Check generation status
 *
 * Features:
 * - AI-powered presentation generation
 * - Multiple formats: presentation, document, social
 * - AI image generation included
 * - Export to PDF and PPTX
 * - 60+ languages supported
 *
 * Limits:
 * - 50 generations per day (Beta)
 * - Max 750,000 characters input
 * - Processing time: 1-3 minutes
 *
 * Best Practices:
 * - Use structured content with clear headings
 * - Specify audience and tone for better results
 * - Poll status endpoint for completion
 * - Cache generated presentations
 */