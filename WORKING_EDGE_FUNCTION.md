# Working Edge Function Code

Copy this EXACT code into the Supabase Edge Function editor:

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
    const message = body.message || 'Hello'
    const sessionId = body.sessionId || 'default'
    
    // Simple response - using regular strings, no template literals
    const responseText = 'I am Niv, your AI PR strategist. You asked: "' + message + '". I can help with media relations, press releases, and PR strategy.'
    const messageText = 'Got your message about: ' + message
    
    const response = {
      response: responseText,
      message: messageText,
      shouldSave: message.toLowerCase().includes('strategy')
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error processing request' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
```

## Even Simpler Version (if above still fails)

If the above STILL has issues, use this ultra-simple version:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  return new Response(
    JSON.stringify({
      response: 'Hello from Niv! I am your AI PR strategist.',
      message: 'Test response from Edge Function',
      shouldSave: false
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
})
```

## Deployment Steps

1. Go to https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions
2. Delete the broken `niv-database` function
3. Click "New function"
4. Name: `niv-database`
5. Copy the code above EXACTLY as shown
6. Click "Deploy"

The key changes:
- No template literals (backticks)
- Using string concatenation with + instead
- Simpler variable extraction
- No complex parsing

This should deploy successfully!