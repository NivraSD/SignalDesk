import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

// Google Vertex AI endpoints
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImage'
const VEO_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/veo:generateVideo'

interface ImageGenerationRequest {
  prompt: string
  style?: 'photorealistic' | 'digital_art' | 'illustration' | 'professional'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
  numberOfImages?: number
  negativePrompt?: string
  framework?: any
}

interface VideoGenerationRequest {
  prompt: string
  duration?: number // seconds (up to 60)
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'cinematic' | 'documentary' | 'animation' | 'corporate'
  fps?: 24 | 30 | 60
  framework?: any
}

// Transform framework into visual prompts
function buildImagePrompt(request: ImageGenerationRequest): string {
  const { prompt, framework, style = 'professional' } = request

  if (prompt) return prompt

  if (framework?.strategy?.visual_brief) {
    return framework.strategy.visual_brief
  }

  // Build intelligent prompt from framework
  const objective = framework?.strategy?.objective || framework?.core?.objective
  const narrative = framework?.strategy?.narrative || framework?.core?.narrative
  const proofPoints = framework?.strategy?.proof_points || []

  let generatedPrompt = `Create a ${style} image that represents: ${objective}. `

  if (narrative) {
    generatedPrompt += `The image should convey: ${narrative}. `
  }

  if (proofPoints.length > 0) {
    generatedPrompt += `Key elements to include: ${proofPoints.slice(0, 3).join(', ')}. `
  }

  generatedPrompt += `Style: Clean, modern, professional, suitable for business presentation. `
  generatedPrompt += `Avoid: Stock photo clichés, human faces, text overlays.`

  return generatedPrompt
}

function buildVideoScript(request: VideoGenerationRequest): string {
  const { prompt, framework, style = 'corporate', duration = 15 } = request

  if (prompt) return prompt

  const objective = framework?.strategy?.objective || framework?.core?.objective
  const narrative = framework?.strategy?.narrative || framework?.core?.narrative
  const keyMessages = framework?.strategy?.keyMessages || []

  let videoScript = `Create a ${duration}-second ${style} video. `
  videoScript += `Opening scene: Professional, modern setting. `
  videoScript += `Main message: ${objective}. `

  if (narrative) {
    videoScript += `Narrative arc: ${narrative}. `
  }

  if (keyMessages.length > 0) {
    videoScript += `Key scenes should illustrate: ${keyMessages.slice(0, 3).join(', ')}. `
  }

  videoScript += `Visual style: Clean, professional, engaging. `
  videoScript += `Ending: Clear call-to-action or summary.`

  return videoScript
}

async function generateImage(request: ImageGenerationRequest) {
  const prompt = buildImagePrompt(request)

  console.log('🎨 Generating image with prompt:', prompt.substring(0, 200))

  try {
    const response = await fetch(`${IMAGEN_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        samples: request.numberOfImages || 1,
        aspectRatio: request.aspectRatio || '16:9',
        modelVersion: 'imagen-3.0-generate-001',
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH'
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Imagen API error:', error)
      throw new Error(`Image generation failed: ${response.status}`)
    }

    const data = await response.json()

    // Process and return images
    const images = data.predictions?.map((prediction: any) => ({
      url: prediction.bytesBase64Encoded
        ? `data:image/png;base64,${prediction.bytesBase64Encoded}`
        : prediction.imageUrl,
      metadata: {
        prompt,
        model: 'imagen-3',
        aspectRatio: request.aspectRatio,
        timestamp: new Date().toISOString()
      }
    })) || []

    // Save to Supabase storage if needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (supabaseUrl && supabaseKey && images.length > 0) {
      // Store images in Supabase for persistence
      for (const image of images) {
        if (image.url.startsWith('data:')) {
          // Convert base64 to blob and upload
          const base64Data = image.url.split(',')[1]
          const blob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

          const fileName = `generated-images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`

          const { data: uploadData, error: uploadError } = await fetch(
            `${supabaseUrl}/storage/v1/object/content-assets/${fileName}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'image/png'
              },
              body: blob
            }
          ).then(res => res.json())

          if (!uploadError) {
            image.url = `${supabaseUrl}/storage/v1/object/public/content-assets/${fileName}`
          }
        }
      }
    }

    return {
      success: true,
      images,
      prompt,
      creditsUsed: images.length
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return {
      success: false,
      error: error.message,
      fallback: {
        type: 'visual_brief',
        content: prompt,
        instructions: 'Manual image creation required based on this brief'
      }
    }
  }
}

async function generateVideo(request: VideoGenerationRequest) {
  const script = buildVideoScript(request)

  console.log('🎬 Generating video with script:', script.substring(0, 200))

  try {
    const response = await fetch(`${VEO_API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: script,
        videoLength: `${request.duration || 15}s`,
        aspectRatio: request.aspectRatio || '16:9',
        modelVersion: 'veo-001-preview',
        fps: request.fps || 30
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Veo API error:', error)
      throw new Error(`Video generation failed: ${response.status}`)
    }

    const data = await response.json()

    // Veo returns a job ID for async processing
    return {
      success: true,
      jobId: data.name,
      status: 'processing',
      estimatedTime: data.metadata?.estimatedProcessingTime || '2-5 minutes',
      script,
      webhookUrl: `/api/webhooks/veo/${data.name}`
    }
  } catch (error) {
    console.error('Video generation error:', error)
    return {
      success: false,
      error: error.message,
      fallback: {
        type: 'video_script',
        content: script,
        instructions: 'Manual video creation required based on this script'
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, ...request } = await req.json()

    if (!type || !['image', 'video'].includes(type)) {
      throw new Error('Invalid content type. Must be "image" or "video"')
    }

    let result

    if (type === 'image') {
      result = await generateImage(request)
    } else if (type === 'video') {
      result = await generateVideo(request)
    }

    // Log generation for analytics
    if (result.success) {
      console.log(`✅ ${type} generation successful`)
    } else {
      console.log(`⚠️ ${type} generation failed, fallback provided`)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 207 // 207 for partial success with fallback
      }
    )
  } catch (error) {
    console.error('Visual generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: {
          type: 'manual',
          instructions: 'Manual content creation required'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})