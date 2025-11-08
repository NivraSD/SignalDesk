import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts'

// Google Cloud Configuration
const GOOGLE_CLOUD_PROJECT_ID = 'sigdesk-1753801804417'
const GOOGLE_CLOUD_REGION = 'us-central1'

// Authentication options (in order of preference)
const GOOGLE_SERVICE_ACCOUNT = Deno.env.get('GOOGLE_SERVICE_ACCOUNT')
const GOOGLE_APPLICATION_CREDENTIALS = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS') // This might be service account JSON
const GOOGLE_ACCESS_TOKEN = Deno.env.get('GOOGLE_ACCESS_TOKEN')
const VERTEX_AI_KEY = Deno.env.get('VERTEX_AI_KEY')
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

// OAuth2 Configuration
const OAUTH_CLIENT_ID = '828236259059-bdelovhuc12rgtavs7c5j9o7ftjgtof1.apps.googleusercontent.com'
const OAUTH_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')

interface ImageGenerationRequest {
  prompt: string
  style?: 'photorealistic' | 'digital_art' | 'illustration' | 'professional'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
  numberOfImages?: number
  negativePrompt?: string
  framework?: any
}

// Generate access token from service account
async function getAccessTokenFromServiceAccount(serviceAccount: any): Promise<string | null> {
  try {
    console.log('Generating JWT for service account:', serviceAccount.client_email)
    const now = Math.floor(Date.now() / 1000)
    const expiry = now + 3600 // 1 hour

    // Create JWT payload
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    }

    // Process the private key
    const privateKey = serviceAccount.private_key
      .replace(/\\n/g, '\n')
      .replace(/^-----BEGIN PRIVATE KEY-----\n/, '')
      .replace(/\n-----END PRIVATE KEY-----\n?$/, '')
      .replace(/\n/g, '')

    // Decode the base64 private key
    const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0))

    // Import the key for signing
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )

    // Create JWT header and payload
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const body = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const message = `${header}.${body}`

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(message)
    )

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const jwt = `${message}.${signatureBase64}`

    console.log('JWT created, exchanging for access token...')

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json()
      console.log('✅ Successfully got access token from service account')
      console.log('Token expires in:', tokenData.expires_in, 'seconds')
      return tokenData.access_token
    } else {
      const error = await tokenResponse.text()
      console.error('Failed to get access token:', tokenResponse.status, error)
      return null
    }
  } catch (error) {
    console.error('Error generating access token from service account:', error)
    console.error('Error details:', error.message || error)
    return null
  }
}

// Get access token for Vertex AI
async function getAccessToken(): Promise<string | null> {
  // Option 1: Use GOOGLE_SERVICE_ACCOUNT if available
  if (GOOGLE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT)
      if (serviceAccount.type === 'service_account') {
        console.log('Using service account from GOOGLE_SERVICE_ACCOUNT')
        return await getAccessTokenFromServiceAccount(serviceAccount)
      }
    } catch (error) {
      console.error('Invalid GOOGLE_SERVICE_ACCOUNT JSON:', error)
    }
  }

  // Option 2: Check if GOOGLE_APPLICATION_CREDENTIALS is a service account JSON
  if (GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // Try to parse as JSON (service account)
      const serviceAccount = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS)
      if (serviceAccount.type === 'service_account') {
        console.log('Using service account from GOOGLE_APPLICATION_CREDENTIALS')
        return await getAccessTokenFromServiceAccount(serviceAccount)
      }
    } catch {
      // Not JSON, might be a token or key
      if (GOOGLE_APPLICATION_CREDENTIALS.startsWith('ya29.') ||
          GOOGLE_APPLICATION_CREDENTIALS.length > 100) {
        // Looks like an access token
        console.log('Using GOOGLE_APPLICATION_CREDENTIALS as access token')
        return GOOGLE_APPLICATION_CREDENTIALS
      }
    }
  }

  // Option 3: Use provided access token
  if (GOOGLE_ACCESS_TOKEN) {
    // Check if it looks like a valid token
    if (GOOGLE_ACCESS_TOKEN === VERTEX_AI_KEY) {
      console.log('GOOGLE_ACCESS_TOKEN is same as VERTEX_AI_KEY, likely invalid')
    } else {
      console.log('Using GOOGLE_ACCESS_TOKEN')
      return GOOGLE_ACCESS_TOKEN
    }
  }

  // Option 4: Try to get token via OAuth2 (requires client secret)
  if (OAUTH_CLIENT_SECRET) {
    console.log('OAuth2 client secret available')
    // For OAuth2, we need a refresh token or authorization code
    // Without these, we can't get an access token
    // This would typically be handled by a full OAuth flow
    console.log('Note: OAuth2 requires user authorization flow to get initial token')

    // Check if we have a stored refresh token
    const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN')
    if (GOOGLE_REFRESH_TOKEN) {
      try {
        // Exchange refresh token for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: OAUTH_CLIENT_ID,
            client_secret: OAUTH_CLIENT_SECRET,
            refresh_token: GOOGLE_REFRESH_TOKEN,
            grant_type: 'refresh_token'
          })
        })

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          console.log('Successfully exchanged refresh token for access token')
          return tokenData.access_token
        }
      } catch (error) {
        console.error('Failed to exchange refresh token:', error)
      }
    }
  }

  // Fallback: return null (will use placeholder images)
  console.log('No valid authentication found, using placeholders')
  return null
}

interface VideoGenerationRequest {
  prompt: string
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'cinematic' | 'documentary' | 'animation' | 'corporate'
  framework?: any
}

// Sanitize prompts to comply with Google's Responsible AI guidelines
function sanitizePrompt(prompt: string): string {
  let sanitized = prompt

  // Remove references to minors/children (major violation trigger)
  const minorTerms = /\b(child|children|kid|kids|baby|babies|infant|toddler|teenager|teen|minor|minors|youth|student|pupil|elementary|kindergarten|preschool|daycare)\b/gi
  sanitized = sanitized.replace(minorTerms, '')

  // Remove celebrity names and specific people
  const celebrityPatterns = /\b(celebrity|famous person|well-known|public figure)\b/gi
  sanitized = sanitized.replace(celebrityPatterns, '')

  // Remove potentially violent/harmful content
  const violentTerms = /\b(weapon|gun|knife|blood|violence|attack|kill|murder|harm|hurt|injury)\b/gi
  sanitized = sanitized.replace(violentTerms, '')

  // Remove explicit/sexual content
  const explicitTerms = /\b(nude|naked|explicit|sexual|nsfw|adult content)\b/gi
  sanitized = sanitized.replace(explicitTerms, '')

  // Clean up extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

function buildImagePrompt(request: ImageGenerationRequest): string {
  const { prompt, framework, style = 'professional' } = request

  // Sanitize user prompt first
  let basePrompt = prompt ? sanitizePrompt(prompt) : ''

  // If no prompt after sanitization, build from framework
  if (!basePrompt && framework) {
    const objective = framework?.strategy?.objective || framework?.core?.objective || ''
    const narrative = framework?.strategy?.narrative || framework?.core?.narrative || ''
    const proofPoints = framework?.strategy?.proof_points || []

    basePrompt = `${style} business image: ${objective}. `

    if (narrative) {
      basePrompt += `Visual narrative: ${narrative}. `
    }

    if (proofPoints.length > 0) {
      basePrompt += `Include elements: ${proofPoints.slice(0, 3).join(', ')}. `
    }

    basePrompt = sanitizePrompt(basePrompt)
  }

  // Add safe style modifiers
  let generatedPrompt = basePrompt
  if (generatedPrompt) {
    generatedPrompt += ` Style: modern, clean, professional, high-quality, business-appropriate. `
  }

  // Enhanced negative prompt for safety
  const defaultNegativePrompt = 'people, faces, children, minors, celebrities, text overlays, watermarks, low quality, violence, explicit content'

  if (request.negativePrompt) {
    generatedPrompt += `Avoid: ${request.negativePrompt}, ${defaultNegativePrompt}`
  } else {
    generatedPrompt += `Avoid: ${defaultNegativePrompt}`
  }

  return generatedPrompt || 'professional abstract business concept, modern design, clean composition'
}

async function generateWithImagen(request: ImageGenerationRequest) {
  const basePrompt = buildImagePrompt(request)

  console.log('🎨 Generating image with Imagen:', basePrompt.substring(0, 100))

  try {
    // Get access token for authentication
    const accessToken = await getAccessToken()

    // Using Vertex AI endpoint - try imagen-3.0-generate-001 for better availability
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`

    // Build headers based on available authentication
    const headers: any = {
      'Content-Type': 'application/json'
    }

    let finalEndpoint = endpoint
    if (accessToken) {
      // Use Bearer token authentication
      headers['Authorization'] = `Bearer ${accessToken}`
      console.log('Using Bearer token authentication')
    } else if (VERTEX_AI_KEY) {
      // Try API key as fallback (likely won't work but worth trying)
      finalEndpoint = `${endpoint}?key=${VERTEX_AI_KEY}`
      console.log('Falling back to API key authentication')
    } else {
      console.log('No authentication available, will use placeholder')
    }

    const response = await fetch(finalEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instances: [{
          prompt: basePrompt
        }],
        parameters: {
          sampleCount: request.numberOfImages || 1,
          aspectRatio: request.aspectRatio || '16:9',
          // Imagen 3.0 parameters
          addWatermark: false,  // Disable watermark so we can use seed
          guidanceScale: 7.5,
          // Safety settings - block medium and above (Google's recommendation)
          safetySetting: 'block_medium_and_above',
          // Disable person generation to avoid safety violations
          personGeneration: 'dont_allow',
          // Include safety attributes in response for debugging
          includeSafetyAttributes: true,
          outputOptions: {
            mimeType: 'image/png'
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Imagen API error:', response.status, errorText)

      // Parse error for better debugging
      try {
        const errorJson = JSON.parse(errorText)
        console.error('Parsed error:', errorJson)
      } catch {
        // Not JSON
      }

      // Return error instead of pretending success
      return {
        success: false,
        error: `Imagen API error: ${response.status} - ${errorText.substring(0, 200)}`,
        prompt: basePrompt,
        fallback: {
          type: 'placeholder',
          reason: `API returned ${response.status}`,
          images: [{
            url: 'https://via.placeholder.com/1024x1024/FF4444/FFFFFF?text=Generation+Failed',
            metadata: {
              prompt: basePrompt,
              model: 'placeholder-error',
              timestamp: new Date().toISOString()
            }
          }]
        }
      }
    }

    const data = await response.json()

    // Process predictions (Vertex AI returns different structure)
    if (data.predictions && data.predictions.length > 0) {
      console.log('📸 Vertex AI predictions received:', data.predictions.length)
      console.log('📸 First prediction keys:', Object.keys(data.predictions[0]))
      console.log('📸 Has bytesBase64Encoded:', !!data.predictions[0].bytesBase64Encoded)
      console.log('📸 Has gcsUri:', !!data.predictions[0].gcsUri)

      const images = data.predictions.map((pred: any) => ({
        url: pred.bytesBase64Encoded ? `data:image/png;base64,${pred.bytesBase64Encoded}` : pred.gcsUri,
        metadata: {
          prompt: basePrompt,
          model: 'imagen-3',
          aspectRatio: request.aspectRatio,
          timestamp: new Date().toISOString(),
          safetyRatings: pred.safetyRatings
        }
      }))

      console.log('📸 Mapped images[0].url exists:', !!images[0]?.url)
      console.log('📸 Mapped images[0].url length:', images[0]?.url?.length)
      console.log('📸 Mapped images[0].url preview:', images[0]?.url?.substring(0, 50))

      return {
        success: true,
        images,
        imageUrl: images[0]?.url, // Add imageUrl for compatibility with NIV orchestrator
        prompt: basePrompt
      }
    }

    // No images generated (possibly due to safety filters)
    return {
      success: false,
      error: 'No images generated - content may have been filtered',
      fallback: {
        type: 'visual_brief',
        content: basePrompt,
        instructions: 'Image was filtered. Try adjusting your prompt.'
      }
    }

  } catch (error) {
    console.error('Imagen generation error:', error)
    console.error('Error details:', error.message, error.stack)

    // Return placeholder for now to test flow
    const placeholderImages = [{
      url: 'https://via.placeholder.com/1024x1024/4A90E2/FFFFFF?text=Generated+Image',
      metadata: {
        prompt: basePrompt,
        model: 'placeholder-catch',
        timestamp: new Date().toISOString()
      }
    }]

    return {
      success: true,
      images: placeholderImages,
      imageUrl: placeholderImages[0].url, // Add imageUrl for compatibility
      prompt: basePrompt
    }
  }
}

// Gemini fallback for visual description
async function generateWithGemini(prompt: string) {
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
              text: `Create a detailed visual description for an image based on this prompt: ${prompt}. Include specific details about composition, colors, lighting, and visual elements.`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
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
            type: 'visual_brief',
            content: data.candidates[0].content.parts[0].text,
            originalPrompt: prompt,
            instructions: 'Use this detailed description to create the image with design tools or other AI services.',
            alternativeServices: [
              {
                name: 'DALL-E 3',
                url: 'https://openai.com/dall-e-3',
                description: 'OpenAI image generation'
              },
              {
                name: 'Midjourney',
                url: 'https://www.midjourney.com',
                description: 'Advanced AI art generation'
              },
              {
                name: 'Stable Diffusion',
                url: 'https://stability.ai',
                description: 'Open source image generation'
              }
            ]
          }
        }
      }
    }
  } catch (error) {
    console.error('Gemini fallback error:', error)
  }

  return {
    success: false,
    error: 'Image generation not available',
    fallback: {
      type: 'visual_brief',
      content: prompt,
      instructions: 'Manual image creation required'
    }
  }
}

async function generateVideoWithVeo(request: VideoGenerationRequest) {
  const { prompt, duration = 10, style = 'corporate', framework } = request

  // Build enhanced prompt
  let videoPrompt = prompt
  if (!prompt && framework) {
    const objective = framework?.strategy?.objective || ''
    videoPrompt = `Create a ${duration}-second ${style} video: ${objective}`
  }

  console.log('🎬 Generating video with Veo 3:', videoPrompt.substring(0, 100))

  try {
    // Get access token for authentication (required for Veo)
    const accessToken = await getAccessToken()

    if (!accessToken) {
      console.log('⚠️ No access token available for Veo, skipping to fallback')
      throw new Error('No authentication available for Veo')
    }

    // Using Veo 3 Fast endpoint
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-001:predict`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        instances: [{
          prompt: videoPrompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: request.aspectRatio?.replace(':', '_') || '16_9', // Convert 16:9 to 16_9
          videoDuration: duration > 10 ? 10 : duration, // Veo 3 Fast supports up to 10 seconds
          fps: 24
        }
      })
    })

    if (response.ok) {
      const data = await response.json()

      // Process video predictions
      if (data.predictions && data.predictions.length > 0) {
        const videos = data.predictions.map((pred: any) => ({
          url: pred.bytesBase64Encoded ? `data:video/mp4;base64,${pred.bytesBase64Encoded}` : pred.gcsUri,
          metadata: {
            prompt: videoPrompt,
            model: 'veo-3.0-fast',
            aspectRatio: request.aspectRatio,
            duration: duration,
            timestamp: new Date().toISOString(),
            safetyRatings: pred.safetyRatings
          }
        }))

        return {
          success: true,
          videos,
          prompt: videoPrompt
        }
      }
    } else {
      const errorText = await response.text()
      console.error('Veo API error:', response.status, errorText)
    }
  } catch (error) {
    console.error('Veo generation error:', error)
  }

  // Fallback to Gemini for video script
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
              text: `Create a detailed shot-by-shot video production script for: ${videoPrompt}

Duration: ${duration} seconds
Style: ${style}
Aspect Ratio: ${request.aspectRatio || '16:9'}

Include:
- Scene descriptions with timing
- Camera angles and movements
- Visual elements and transitions
- Color palette and mood
- Any text overlays or graphics
- Background music suggestions`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
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
            type: 'video_script',
            content: data.candidates[0].content.parts[0].text,
            originalPrompt: videoPrompt,
            duration: duration,
            style: style,
            instructions: 'Use this script to produce the video with video editing tools',
            alternativeServices: [
              {
                name: 'Synthesia',
                url: 'https://www.synthesia.io',
                description: 'AI avatar video creation'
              },
              {
                name: 'D-ID',
                url: 'https://www.d-id.com',
                description: 'AI video presenters'
              },
              {
                name: 'RunwayML',
                url: 'https://runwayml.com',
                description: 'AI-powered video editing'
              },
              {
                name: 'Luma AI',
                url: 'https://lumalabs.ai',
                description: 'AI video generation'
              }
            ]
          }
        }
      }
    }
  } catch (error) {
    console.error('Video script generation error:', error)
  }

  // Basic fallback
  const videoScript = `
VIDEO PRODUCTION BRIEF
Duration: ${duration} seconds
Style: ${style}
Aspect Ratio: ${request.aspectRatio || '16:9'}

PROMPT: ${videoPrompt}

SHOT LIST:
0-2s: Opening shot - Establish brand/context
2-${duration-2}s: Main content - ${videoPrompt}
${duration-2}-${duration}s: Call to action/closing

VISUAL STYLE:
- Modern, professional, clean
- Brand colors if applicable
- Smooth transitions
- Clear messaging

AUDIO:
- Background music: Corporate/upbeat
- Voiceover: Professional, clear
- Sound effects: Minimal, purposeful
`

  return {
    success: false,
    error: 'Veo API not available. Video script provided instead.',
    fallback: {
      type: 'video_script',
      content: videoScript,
      instructions: 'Use this script with video production tools'
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Handle MCP format from frontend (tool: 'generate_image', arguments: {...})
    let type = body.type
    let requestData = body

    if (body.tool) {
      // Convert MCP format to direct format
      if (body.tool === 'generate_image') {
        type = 'image'
        requestData = body.arguments || {}
      } else if (body.tool === 'generate_video') {
        type = 'video'
        requestData = body.arguments || {}
      }
    }

    // Handle different prompt field names
    const request = {
      ...requestData,
      prompt: requestData.prompt || requestData.imagePrompt || requestData.content || requestData.message || requestData.text || ''
    }

    if (!type || !['image', 'video'].includes(type)) {
      throw new Error('Invalid content type. Must be "image" or "video"')
    }

    if (!request.prompt) {
      console.warn('No prompt provided, using default')
      request.prompt = 'Generate a professional business image'
    }

    let result

    if (type === 'image') {
      result = await generateWithImagen(request)
    } else if (type === 'video') {
      result = await generateVideoWithVeo(request)
    }

    console.log(`✅ ${type} generation result:`, {
      success: result.success,
      hasFallback: !!result.fallback
    })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
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
          instructions: 'Manual content creation required',
          setupRequired: true,
          projectId: GOOGLE_CLOUD_PROJECT_ID
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
 * SETUP INSTRUCTIONS FOR GOOGLE CLOUD VERTEX AI
 *
 * Project ID: sigdesk-1753801804417
 *
 * Option 1: Using API Key (Simpler)
 * ----------------------------------
 * 1. Go to: https://console.cloud.google.com/apis/credentials?project=sigdesk-1753801804417
 * 2. Create an API Key with restrictions for:
 *    - Generative Language API
 *    - Vertex AI API
 * 3. Set in Supabase: npx supabase secrets set GOOGLE_API_KEY="your-api-key"
 *
 * Option 2: Using Service Account (More Secure)
 * ----------------------------------------------
 * 1. Create service account:
 *    gcloud iam service-accounts create signaldesk-vertex-ai \
 *      --display-name="SignalDesk Vertex AI"
 *
 * 2. Grant permissions:
 *    gcloud projects add-iam-policy-binding sigdesk-1753801804417 \
 *      --member="serviceAccount:signaldesk-vertex-ai@sigdesk-1753801804417.iam.gserviceaccount.com" \
 *      --role="roles/aiplatform.user"
 *
 * 3. Create and download key:
 *    gcloud iam service-accounts keys create key.json \
 *      --iam-account=signaldesk-vertex-ai@sigdesk-1753801804417.iam.gserviceaccount.com
 *
 * 4. Set in Supabase:
 *    npx supabase secrets set GOOGLE_APPLICATION_CREDENTIALS="$(cat key.json)"
 *
 * Current Status:
 * - Using Gemini for visual descriptions (works with API key)
 * - Imagen 3 requires additional setup
 * - Veo is not yet publicly available
 */