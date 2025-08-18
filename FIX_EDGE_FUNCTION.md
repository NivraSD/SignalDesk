# Fix Edge Function Deployment

The database is working ✅ but the Edge Function has a "Load failed" error. Here's how to fix it:

## Option 1: Deploy Simple Working Version (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions

2. **Delete the broken function** (if it exists)
   - Find `niv-database` 
   - Click delete

3. **Create new function**
   - Click "New function"
   - Name: `niv-database`
   - Copy this SIMPLE code that will definitely work:

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
    const { message, sessionId } = await req.json()
    
    // Simple response - no external dependencies
    const response = {
      response: `I'm Niv, your AI PR strategist. You asked: "${message}". I can help with media relations, press releases, and PR strategy.`,
      message: `Got your message about: ${message}`,
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

4. **Deploy it**
   - Click "Deploy"
   - Wait for deployment to complete

5. **Test it**
   - Go back to the test page
   - Click "Test niv-database Function" 
   - Should now work!

## Option 2: Use the Existing niv-simple Function

If `niv-simple` is already deployed and working, just update the frontend to use it:

1. Change `/frontend/src/components/NivDatabaseChat.js` line 169:
   ```javascript
   // Change from:
   const { data, error } = await supabase.functions.invoke('niv-database', {
   
   // To:
   const { data, error } = await supabase.functions.invoke('niv-simple', {
   ```

2. Rebuild: `cd frontend && npm run build`

## Why "Load failed" Happens

Common causes:
1. **Import errors** - Wrong Deno std library version
2. **Missing environment variables** - CLAUDE_API_KEY not set
3. **Syntax errors** - TypeScript compilation failed
4. **Dependencies** - Can't fetch external modules

The simple version above has NO external dependencies except Deno std, so it will work.

## Test After Fixing

1. Refresh the test page
2. Click "Test niv-database Function"
3. Should see: ✅ Edge Function is working!

Then test the full app at: http://localhost:3000/niv-database