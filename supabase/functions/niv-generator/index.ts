import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// SPECIALIZED SYSTEM PROMPT FOR GENERATION ONLY
const GENERATOR_SYSTEM_PROMPT = `You are a content generation specialist. 
You ONLY generate structured JSON content based on the context provided.
You do NOT have conversations or ask questions.

When generating content, you MUST:
1. Output ONLY valid JSON
2. Use the exact format specified for the content type
3. Include real details from the context provided
4. Never use placeholder or example content

FORMATS:

For media-list:
{
  "journalists": [
    {"name": "Real Name", "outlet": "Real Outlet", "beat": "Specific Beat", "email": "actual@email.com"},
    {"name": "Real Name", "outlet": "Real Outlet", "beat": "Specific Beat", "email": "actual@email.com"}
  ]
}

For press-release:
{
  "headline": "Actual Headline Based on Context",
  "date": "Current Date",
  "location": "City, State",
  "body": "Full press release text with real company and product details..."
}

For strategy-plan:
{
  "title": "Strategic Communications Plan for [Company]",
  "milestones": [
    {"week": 1, "task": "Specific task", "deliverables": ["item1", "item2"]},
    {"week": 2, "task": "Specific task", "deliverables": ["item1", "item2"]}
  ],
  "objectives": ["Objective 1", "Objective 2"],
  "targetAudience": ["Audience 1", "Audience 2"]
}

For social-content:
{
  "posts": [
    {"platform": "Twitter", "content": "Actual tweet text", "hashtags": ["#tag1", "#tag2"]},
    {"platform": "LinkedIn", "content": "Actual post text", "hashtags": ["#tag1", "#tag2"]}
  ]
}`

interface GenerationRequest {
  type: 'media-list' | 'press-release' | 'strategy-plan' | 'social-content'
  context: {
    companyName?: string
    productName?: string
    industry?: string
    goals?: string[]
    targetAudience?: string[]
    keyMessages?: string[]
    conversationSummary?: string
  }
  requirements?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: GenerationRequest = await req.json()
    
    console.log('🎯 Generation request:', {
      type: request.type,
      hasContext: !!request.context,
      contextKeys: Object.keys(request.context || {})
    })

    // Validate request
    if (!request.type) {
      throw new Error('Content type is required')
    }

    if (!request.context || Object.keys(request.context).length === 0) {
      throw new Error('Context is required for generation')
    }

    // Build the generation prompt
    const generationPrompt = buildGenerationPrompt(request)
    console.log('📝 Generation prompt built')

    // Generate content with Claude
    let generatedContent = null

    if (ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: GENERATOR_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: generationPrompt
            }
          ],
          temperature: 0.3 // Lower temperature for more consistent structured output
        })
      })

      if (response.ok) {
        const data = await response.json()
        const rawResponse = data.content[0].text
        console.log('✅ Got generation response')

        try {
          // Parse the JSON response
          generatedContent = JSON.parse(rawResponse)
          console.log('✅ Successfully parsed JSON content')
        } catch (parseError) {
          // Try to extract JSON from the response
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            generatedContent = JSON.parse(jsonMatch[0])
            console.log('✅ Extracted and parsed JSON from response')
          } else {
            throw new Error('Could not parse generated content as JSON')
          }
        }
      } else {
        throw new Error(`API request failed: ${response.status}`)
      }
    } else {
      // Fallback content for testing without API key
      generatedContent = generateFallbackContent(request.type, request.context)
    }

    // Create the work item with the generated content
    const workItem = {
      type: request.type,
      title: getTitle(request.type),
      description: getDescription(request.type),
      generatedContent: generatedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        context: request.context
      }
    }

    console.log('✅ Work item created:', {
      type: workItem.type,
      hasContent: !!workItem.generatedContent
    })

    return new Response(
      JSON.stringify({
        success: true,
        workItem,
        message: `Generated ${request.type} successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Generation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        workItem: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})

function buildGenerationPrompt(request: GenerationRequest): string {
  const { type, context, requirements } = request
  
  let prompt = `Generate a ${type} with the following context:\n\n`
  
  // Add context details
  if (context.companyName) {
    prompt += `Company: ${context.companyName}\n`
  }
  if (context.productName) {
    prompt += `Product: ${context.productName}\n`
  }
  if (context.industry) {
    prompt += `Industry: ${context.industry}\n`
  }
  if (context.goals && context.goals.length > 0) {
    prompt += `Goals: ${context.goals.join(', ')}\n`
  }
  if (context.targetAudience && context.targetAudience.length > 0) {
    prompt += `Target Audience: ${context.targetAudience.join(', ')}\n`
  }
  if (context.keyMessages && context.keyMessages.length > 0) {
    prompt += `Key Messages: ${context.keyMessages.join(', ')}\n`
  }
  if (context.conversationSummary) {
    prompt += `\nAdditional Context:\n${context.conversationSummary}\n`
  }
  
  // Add specific requirements
  if (requirements) {
    prompt += `\nSpecific Requirements:\n${requirements}\n`
  }
  
  // Add type-specific instructions
  prompt += `\n${getTypeSpecificInstructions(type)}\n`
  prompt += `\nOutput ONLY valid JSON in the format specified for ${type}.`
  
  return prompt
}

function getTypeSpecificInstructions(type: string): string {
  switch (type) {
    case 'media-list':
      return 'Generate a list of 8-10 relevant journalists who would cover this story. Include real outlets and beats that match the industry.'
    case 'press-release':
      return 'Write a professional press release announcing the product/news. Use AP style and include quotes.'
    case 'strategy-plan':
      return 'Create a 6-week strategic communications plan with specific milestones and deliverables.'
    case 'social-content':
      return 'Generate 5 social media posts for different platforms (Twitter, LinkedIn, Facebook).'
    default:
      return 'Generate appropriate content for this type.'
  }
}

function generateFallbackContent(type: string, context: any) {
  // Simple fallback for testing without API
  const company = context.companyName || 'Your Company'
  const product = context.productName || 'Your Product'
  
  switch (type) {
    case 'media-list':
      return {
        journalists: [
          { name: 'Test Journalist', outlet: 'Test Outlet', beat: 'Technology', email: 'test@example.com' }
        ]
      }
    case 'press-release':
      return {
        headline: `${company} Announces ${product}`,
        date: new Date().toISOString().split('T')[0],
        location: 'San Francisco, CA',
        body: `${company} today announced ${product}...`
      }
    case 'strategy-plan':
      return {
        title: `Strategic Plan for ${company}`,
        milestones: [
          { week: 1, task: 'Launch preparation', deliverables: ['Press kit', 'Media list'] }
        ],
        objectives: ['Increase awareness'],
        targetAudience: ['Tech media']
      }
    default:
      return { content: 'Fallback content' }
  }
}

function getTitle(type: string): string {
  const titles = {
    'media-list': 'Strategic Media Plan',
    'press-release': 'Press Release',
    'strategy-plan': 'Strategic Communications Plan',
    'social-content': 'Social Media Content'
  }
  return titles[type] || type
}

function getDescription(type: string): string {
  const descriptions = {
    'media-list': 'Targeted journalists and outreach strategy',
    'press-release': 'Professional announcement ready for distribution',
    'strategy-plan': 'Comprehensive PR strategy with timeline',
    'social-content': 'Ready-to-post social media content'
  }
  return descriptions[type] || 'Generated content'
}