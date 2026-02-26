# Ultra Simple Edge Function - GUARANTEED TO WORK

## Delete the broken function and create a new one

1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions
2. Delete `niv-database` if it exists
3. Create NEW function called `niv-simple-test`
4. Use this code:

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
      response: 'Hello! I am Niv, your AI PR strategist. I can help you with press releases, media strategies, and PR campaigns.',
      message: 'Test response from Niv',
      chatMessage: 'I am here to help with your PR needs!',
      shouldSave: false
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    }
  )
})
```

5. Deploy it
6. Then update the frontend to use this function

## Update Frontend to Use New Function

Replace the function name in `/frontend/src/services/supabaseApiService.js`:

Line 231: Change from `niv-database` to `niv-simple-test`

## Why This Will Work

- NO external dependencies
- NO JSON parsing
- NO variables
- Just returns a static response
- Absolute minimum code

Once this works, we can gradually add features back.