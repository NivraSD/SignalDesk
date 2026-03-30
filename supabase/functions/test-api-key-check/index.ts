import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  const CLAUDE_KEY = Deno.env.get('CLAUDE_API_KEY')

  return new Response(JSON.stringify({
    anthropic_set: !!ANTHROPIC_KEY,
    anthropic_length: ANTHROPIC_KEY?.length || 0,
    anthropic_prefix: ANTHROPIC_KEY?.substring(0, 10) || 'none',
    claude_set: !!CLAUDE_KEY,
    claude_length: CLAUDE_KEY?.length || 0,
    claude_prefix: CLAUDE_KEY?.substring(0, 10) || 'none',
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})