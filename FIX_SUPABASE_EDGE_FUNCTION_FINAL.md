# DEFINITIVE FIX for Supabase Edge Functions

## The Problem
Your Edge Functions are failing because:
1. Wrong Deno serve syntax (using old `serve` instead of new `Deno.serve`)
2. CORS headers not properly configured
3. Possible missing environment variables

## Step 1: Create the CORRECT Edge Function Code

Go to Supabase Dashboard > Edge Functions and update `niv-simple-test` with this EXACT code:

```typescript
Deno.serve(async (req) => {
  // CRITICAL: Define CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // CRITICAL: Handle OPTIONS request FIRST
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Parse request body if needed
    let body = {}
    try {
      body = await req.json()
    } catch {
      // Ignore JSON parse errors
    }

    // Simple static response for now
    const responseData = {
      response: 'Hello! I am Niv, your AI PR strategist. I can help with press releases and media strategies.',
      message: 'Niv is ready to help!',
      chatMessage: 'I can assist with your PR needs.',
      shouldSave: false
    }

    // Return successful response with CORS headers
    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200
      }
    )
  } catch (error) {
    // Return error with CORS headers
    return new Response(
      JSON.stringify({ 
        error: 'Function error', 
        message: error.message 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500
      }
    )
  }
})
```

## Step 2: Check Supabase Settings

1. **Go to Settings > API**
   - Copy your `anon public` key
   - Make sure it matches what's in your `.env` file

2. **Go to Authentication > Policies**
   - Make sure "Enable Row Level Security" is OFF for testing on:
     - `niv_conversations`
     - `niv_artifacts`
     - `niv_workspace_edits`

3. **Go to Edge Functions**
   - Click on your function
   - Check the "Logs" tab for any deployment errors

## Step 3: Test the Function

Test directly in terminal:
```bash
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-simple-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message":"test"}'
```

## Step 4: Alternative - Use Database Functions Instead

If Edge Functions still don't work, create a PostgreSQL function instead:

```sql
-- Run this in SQL Editor
CREATE OR REPLACE FUNCTION niv_chat(
  user_message TEXT,
  session_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  response_json JSON;
BEGIN
  -- For now, return a static response
  response_json := json_build_object(
    'response', 'I am Niv, your AI PR strategist. You said: ' || user_message,
    'message', 'Response from database function',
    'shouldSave', false
  );
  
  -- Save to conversations table
  INSERT INTO niv_conversations (session_id, role, content)
  VALUES (session_id, 'user', user_message);
  
  INSERT INTO niv_conversations (session_id, role, content)
  VALUES (session_id, 'assistant', response_json->>'response');
  
  RETURN response_json;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION niv_chat TO anon;
GRANT EXECUTE ON FUNCTION niv_chat TO authenticated;
```

Then update your frontend to call the database function:
```javascript
// In supabaseApiService.js
const { data, error } = await supabase.rpc('niv_chat', {
  user_message: message,
  session_id: sessionId
});
```

## Step 5: Nuclear Option - Direct Database Operations

If nothing else works, skip functions entirely and just save/retrieve from database:

```javascript
// In your React component
const sendMessage = async (message) => {
  // Save user message
  await supabase.from('niv_conversations').insert({
    session_id: sessionId,
    role: 'user',
    content: message
  });
  
  // Create mock AI response
  const aiResponse = `I understand you need help with: ${message}`;
  
  // Save AI response
  await supabase.from('niv_conversations').insert({
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse
  });
  
  // Update UI
  setMessages([...messages, 
    { role: 'user', content: message },
    { role: 'assistant', content: aiResponse }
  ]);
};
```

## The KEY Issue

The main problem is likely that you're using the OLD Deno syntax:
- ❌ WRONG: `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`
- ✅ RIGHT: `Deno.serve(async (req) => { ... })`

The new syntax is simpler and handles CORS better.

## If All Else Fails

Contact Supabase support with:
- Your project ID: zskaxjtyuaqazydouifp
- The error: CORS preflight failing on Edge Functions
- Request they check if Edge Functions are enabled for your project