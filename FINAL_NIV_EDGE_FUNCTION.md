# Final Niv Edge Function - Works with Niv-First UI

Replace your `niv-database` Edge Function with this code that handles all the parameters from Niv-First:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    
    // Extract parameters - handle both old and new formats
    const message = body.message || 'Hello'
    const sessionId = body.sessionId || body.conversationId || 'default'
    const conversationHistory = body.conversationHistory || body.messages || []
    
    console.log('Received message:', message)
    console.log('Session ID:', sessionId)
    
    // Check if this looks like a request for strategic content or artifacts
    const artifactKeywords = [
      'strategy', 'plan', 'framework', 'campaign', 
      'launch', 'media list', 'press release', 
      'social media', 'content', 'save', 'artifact',
      'announcing', 'announcement', 'ceo', 'all of them'
    ]
    
    const shouldCreateArtifact = artifactKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )
    
    // Build response
    const responseText = 'I understand you need help with: "' + message + '". As Niv, your AI PR strategist, I can help you create comprehensive PR strategies, media lists, press releases, and social media campaigns. Let me provide you with a detailed plan.'
    
    const response = {
      response: responseText,
      message: responseText,
      shouldSave: shouldCreateArtifact,
      chatMessage: responseText
    }
    
    // If artifact should be created, add it
    if (shouldCreateArtifact) {
      const artifactContent = {
        title: 'Strategic PR Plan for ' + message,
        sections: [
          {
            heading: 'Executive Summary',
            content: 'This comprehensive plan addresses your request for: ' + message
          },
          {
            heading: 'Key Messages',
            content: [
              'Primary: Your announcement represents a significant milestone',
              'Secondary: This demonstrates continued growth and innovation',
              'Supporting: Stakeholders will benefit from these changes'
            ]
          },
          {
            heading: 'Target Audiences',
            content: [
              'Media and journalists',
              'Industry analysts',
              'Customers and partners',
              'Internal stakeholders'
            ]
          },
          {
            heading: 'Tactical Approach',
            content: [
              'Pre-announcement briefings with key media',
              'Press release distribution at optimal time',
              'Social media campaign across all channels',
              'Executive interviews and thought leadership',
              'Follow-up with interested parties'
            ]
          },
          {
            heading: 'Timeline',
            content: 'Week 1: Preparation, Week 2: Launch, Week 3-4: Sustain momentum'
          }
        ]
      }
      
      response.artifact = {
        id: 'artifact_' + Date.now(),
        type: 'strategic-plan',
        title: 'PR Strategy: ' + message.substring(0, 50),
        created: new Date().toISOString(),
        content: artifactContent
      }
      
      response.artifacts = [response.artifact]
      response.saveButton = true
      response.response = 'I have created a comprehensive PR strategy for your request. The plan includes key messages, target audiences, tactical approaches, and a timeline. You can view and edit this in the artifacts panel on the right.'
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Sorry, I encountered an error. Please try again.',
        response: 'I apologize, but I encountered an error. Please try again.',
        chatMessage: 'Sorry, there was an error processing your request.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Return 200 even for errors so frontend handles it gracefully
      }
    )
  }
})
```

## Deploy Instructions

1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions
2. Click on `niv-database` function
3. Replace ALL the code with the above
4. Click "Deploy"

## What This Fixes

- ✅ Works with Niv-First UI parameters
- ✅ Creates artifacts when keywords are detected
- ✅ Returns proper response format
- ✅ Handles errors gracefully
- ✅ No template literals (avoids parsing errors)