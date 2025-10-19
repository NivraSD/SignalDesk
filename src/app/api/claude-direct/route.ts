import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, system: directSystem, max_tokens = 1000, temperature = 0.7 } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Handle system parameter passed directly or extract from messages
    let system = directSystem
    let userMessages = messages

    if (!system) {
      // Extract system message if present in messages
      const systemMessages = messages.filter(m => m.role === 'system')
      userMessages = messages.filter(m => m.role !== 'system')

      // Build system prompt from system messages
      system = systemMessages.length > 0
        ? systemMessages.map(m => m.content).join('\n\n')
        : undefined
    }

    // Fast, direct Claude API call for conversational responses
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Using Claude Sonnet 4
      system: system,
      messages: userMessages,
      max_tokens: max_tokens,
      temperature: temperature,
    })

    // Extract the text content
    const content = response.content[0]?.type === 'text'
      ? response.content[0].text
      : ''

    return NextResponse.json({
      success: true,
      content: content,
      usage: response.usage,
      model: response.model
    })

  } catch (error) {
    console.error('Claude API error:', error)

    // Provide helpful error messages
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          status: error.status
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get response from Claude'
      },
      { status: 500 }
    )
  }
}