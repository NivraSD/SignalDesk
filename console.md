turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 121ms
intelligenceService.ts:26 🚨🚨🚨 CRITICAL TEST - THIS CODE IS RUNNING - VERSION 2 🚨🚨🚨
intelligenceService.ts:27 Starting pipeline for organization: OpenAI Industry: Artificial Intelligence
intelligenceService.ts:39 Calling mcp-discovery with payload: Object
SimpleIntelligence.tsx:72 Pipeline stage mcp-discovery: running undefined
intelligenceService.ts:58 Pipeline started successfully: Object
SimpleIntelligence.tsx:72 Pipeline stage mcp-discovery: completed Object
intelligenceService.ts:64 Starting monitor-stage-1 with profile
SimpleIntelligence.tsx:72 Pipeline stage monitor-stage-1: running undefined
intelligenceService.ts:74 monitor-stage-1 response: Object
SimpleIntelligence.tsx:72 Pipeline stage monitor-stage-1: completed Object
intelligenceService.ts:80 Starting monitor-stage-2-relevance
SimpleIntelligence.tsx:72 Pipeline stage monitor-stage-2-relevance: running undefined
intelligenceService.ts:92 monitor-stage-2-relevance response: Object
SimpleIntelligence.tsx:72 Pipeline stage monitor-stage-2-relevance: completed Object
intelligenceService.ts:98 Starting monitoring-stage-2-enrichment directly
SimpleIntelligence.tsx:72 Pipeline stage monitoring-stage-2-enrichment: running undefined
intelligenceService.ts:111 monitoring-stage-2-enrichment response: Object
SimpleIntelligence.tsx:72 Pipeline stage monitoring-stage-2-enrichment: completed Object
intelligenceService.ts:122 Starting intelligence-orchestrator-v2 with pre-enriched data
SimpleIntelligence.tsx:72 Pipeline stage intelligence-orchestrator-v2: running undefined
intelligenceService.ts:125 Passing to orchestrator: Object
(index):1 Access to fetch at 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-orchestrator-v2' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-orchestrator-v2:1  Failed to load resource: net::ERR_FAILED
intelligenceService.ts:152 intelligence-orchestrator-v2 response: Object
hook.js:608 Orchestrator error: FunctionsFetchError: Failed to send a request to the Edge Function
    at FunctionsClient.ts:103:15
overrideMethod @ hook.js:608
SimpleIntelligence.tsx:72 Pipeline stage intelligence-orchestrator-v2: failed FunctionsFetchError: Failed to send a request to the Edge Function
    at FunctionsClient.ts:103:15
hook.js:608 Failed to start pipeline: Error: Orchestrator failed: Failed to send a request to the Edge Function
    at IntelligenceService.startPipeline (intelligenceService.ts:173:25)
    at async runPipeline (SimpleIntelligence.tsx:67:30)
overrideMethod @ hook.js:608
hook.js:608 Pipeline error: Error: Pipeline error: Orchestrator failed: Failed to send a request to the Edge Function
    at IntelligenceService.startPipeline (intelligenceService.ts:250:13)
    at async runPipeline (SimpleIntelligence.tsx:67:30)
overrideMethod @ hook.js:608
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 177ms
