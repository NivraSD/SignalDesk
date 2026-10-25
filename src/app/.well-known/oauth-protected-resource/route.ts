// Protected resource metadata (RFC 9728) for NIV's MCP server at /api/mcp.
import { CORS, corsJson, protectedResourceMetadata, publicOrigin } from '@/lib/advisor/oauth'

export const GET = (req: Request) => corsJson(protectedResourceMetadata(publicOrigin(req)), 200, { 'Cache-Control': 'public, max-age=3600' })
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS })
