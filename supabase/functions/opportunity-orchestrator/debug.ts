export function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '')
}

export function checkApiKeys() {
  const keys = {
    ANTHROPIC_API_KEY: !!Deno.env.get('ANTHROPIC_API_KEY'),
    ANTHROPIC_KEY_LENGTH: Deno.env.get('ANTHROPIC_API_KEY')?.length || 0,
    FIRECRAWL_API_KEY: !!Deno.env.get('FIRECRAWL_API_KEY'),
    HAS_ENV_ACCESS: true
  }
  console.log('🔑 API Key Status:', JSON.stringify(keys))
  return keys
}
