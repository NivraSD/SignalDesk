import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Google API configuration
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

// Note: Google's Imagen 3 and Veo are currently in limited access
// This implementation uses the Gemini API with image generation capabilities as fallback
// For production Imagen 3 and Veo, you need Google Cloud Vertex AI access

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
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'cinematic' | 'documentary' | 'animation' | 'corporate'
  framework?: any
}

// Transform framework into visual prompts
function buildImagePrompt(request: ImageGenerationRequest): string {
  const { prompt, framework, style = 'professional' } = request

  if (prompt) return prompt

  if (framework?.strategy?.visual_brief) {
    return framework.strategy.visual_brief
  }

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

  let videoScript = `Create a ${duration}-second ${style} video script:\n\n`
  videoScript += `Opening (0-3s): Establish professional, modern setting\n`
  videoScript += `Main message (3-${duration-3}s): ${objective}\n`

  if (narrative) {
    videoScript += `Narrative flow: ${narrative}\n`
  }

  if (keyMessages.length > 0) {
    const timePerMessage = Math.floor((duration - 6) / keyMessages.length)
    keyMessages.slice(0, 3).forEach((msg, i) => {
      const start = 3 + (i * timePerMessage)
      const end = start + timePerMessage
      videoScript += `Scene ${i+1} (${start}-${end}s): ${msg}\n`
    })
  }

  videoScript += `Closing (${duration-3}-${duration}s): Clear call-to-action\n`
  videoScript += `\nVisual style: ${style}, professional, engaging`

  return videoScript
}

// Generate image using available Google APIs
async function generateImage(request: ImageGenerationRequest) {
  const prompt = buildImagePrompt(request)
  console.log('🎨 Generating image with prompt:', prompt.substring(0, 200))

  // Since Imagen 3 requires Vertex AI access, we'll provide multiple options:

  // Option 1: Try using Gemini's image capabilities (if available)
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image based on this description: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (geminiResponse.ok) {
      const data = await geminiResponse.json()

      // Check if Gemini can provide image generation guidance
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Gemini can't generate images directly, but can provide detailed descriptions
        return {
          success: false,
          fallback: {
            type: 'visual_brief',
            content: data.candidates[0].content.parts[0].text,
            instructions: 'Use this detailed description to create the image with design tools'
          }
        }
      }
    }
  } catch (error) {
    console.log('Gemini API not available for image generation')
  }

  // Option 2: For actual image generation, return detailed brief
  // In production, you would integrate with:
  // - Google Cloud Vertex AI for Imagen 3
  // - Stable Diffusion API
  // - DALL-E 3 API
  // - Midjourney API

  return {
    success: false,
    fallback: {
      type: 'visual_brief',
      content: prompt,
      instructions: 'Image generation requires Google Cloud Vertex AI access. Use this brief to create the image manually or with other tools.',
      alternativeServices: [
        {
          name: 'Google Cloud Vertex AI',
          url: 'https://cloud.google.com/vertex-ai/docs/generative-ai/image/generate-images',
          requirement: 'Google Cloud project with Imagen API enabled'
        },
        {
          name: 'Stable Diffusion',
          url: 'https://stability.ai/stable-diffusion',
          requirement: 'Stability AI API key'
        },
        {
          name: 'DALL-E 3',
          url: 'https://openai.com/dall-e-3',
          requirement: 'OpenAI API key'
        }
      ]
    }
  }
}

// Generate video script (Veo requires Vertex AI access)
async function generateVideo(request: VideoGenerationRequest) {
  const script = buildVideoScript(request)
  console.log('🎬 Generating video script:', script.substring(0, 200))

  // Use Gemini to enhance the video script
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a detailed shot-by-shot video production guide based on this script:\n\n${script}\n\nInclude camera angles, transitions, visual elements, and timing for each scene.`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      }
    )

    if (geminiResponse.ok) {
      const data = await geminiResponse.json()

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          success: false,
          fallback: {
            type: 'video_production_guide',
            content: data.candidates[0].content.parts[0].text,
            originalScript: script,
            instructions: 'Use this production guide to create the video with video editing tools',
            alternativeServices: [
              {
                name: 'Google Cloud Vertex AI (Veo)',
                url: 'https://cloud.google.com/vertex-ai/docs/generative-ai/video/generate-videos',
                requirement: 'Google Cloud project with Veo API enabled'
              },
              {
                name: 'Synthesia',
                url: 'https://www.synthesia.io/',
                requirement: 'Synthesia API key'
              },
              {
                name: 'Runway ML',
                url: 'https://runwayml.com/',
                requirement: 'Runway account'
              }
            ]
          }
        }
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error)
  }

  // Fallback to basic script
  return {
    success: false,
    fallback: {
      type: 'video_script',
      content: script,
      instructions: 'Video generation requires Google Cloud Vertex AI access. Use this script to produce the video with video editing tools.'
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

    // Log generation attempt
    console.log(`📊 ${type} generation attempt:`, {
      success: result.success,
      hasFallback: !!result.fallback,
      fallbackType: result.fallback?.type
    })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Always 200 since we provide fallbacks
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
          instructions: 'Please create content manually using your preferred tools'
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
 * IMPORTANT: Full Image/Video Generation Setup
 *
 * For actual image and video generation, you need:
 *
 * 1. Google Cloud Vertex AI Access:
 *    - Create a Google Cloud Project
 *    - Enable Vertex AI API
 *    - Enable Imagen and Veo APIs (if available in your region)
 *    - Create a service account with proper permissions
 *    - Download service account JSON key
 *
 * 2. Environment Setup:
 *    - GOOGLE_CLOUD_PROJECT_ID=your-project-id
 *    - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *    - GOOGLE_CLOUD_REGION=us-central1 (or your region)
 *
 * 3. Alternative Options:
 *    - OpenAI DALL-E 3: Easier to implement, requires OpenAI API key
 *    - Stability AI: Good quality, requires Stability API key
 *    - Replicate: Multiple models available, requires Replicate API key
 *
 * Current Implementation:
 * - Uses Gemini API to generate detailed visual briefs
 * - Provides fallback descriptions for manual creation
 * - Lists alternative services for actual generation
 */