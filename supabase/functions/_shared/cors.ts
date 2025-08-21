/**
 * Shared CORS Handler for all Supabase Edge Functions
 * Provides consistent CORS handling across all functions
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }
  return null
}

/**
 * Add CORS headers to any response
 */
export function addCorsHeaders(response: Response): Response {
  // If response already has CORS headers, don't override
  const hasOriginHeader = response.headers.has('Access-Control-Allow-Origin')
  if (hasOriginHeader) {
    return response
  }

  // Clone the response and add CORS headers
  const newHeaders = new Headers(response.headers)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

/**
 * Wrap an async handler with CORS support
 * This ensures CORS headers are added to ALL responses, including errors
 */
export function withCors(
  handler: (req: Request) => Promise<Response> | Response
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle OPTIONS preflight
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
      // Execute the actual handler
      const response = await handler(req)
      // Ensure CORS headers are added
      return addCorsHeaders(response)
    } catch (error) {
      console.error('Handler error:', error)
      // Even error responses need CORS headers
      const errorResponse = new Response(
        JSON.stringify({ 
          error: error.message || 'Internal server error',
          timestamp: new Date().toISOString()
        }),
        { 
          status: error.status || 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
      return errorResponse
    }
  }
}

/**
 * Create a standardized JSON response with CORS headers
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...additionalHeaders
      }
    }
  )
}

/**
 * Create a standardized error response with CORS headers
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    status
  )
}