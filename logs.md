hook.js:608 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
overrideMethod @ hook.js:608
858-23c03b66c33493b8.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ⚠️ Same organization selected, skipping reload
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🔍 Running MCP discovery...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ Pre-populated GEO service lines from MCP: Array(5)
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ Discovery complete
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🚀 handleCreateOrganization CALLED - START OF FUNCTION
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 Organization details: Object
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 📝 Creating organization...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🎯 Saving targets...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 💾 Saving organization profile to mcp_discovery...
zskaxjtyuaqazydouifp.supabase.co/rest/v1/mcp_discovery?on_conflict=organization_id:1 Failed to load resource: the server responded with a status of 400 ()
hook.js:608 Failed to save profile to mcp_discovery: Object
overrideMethod @ hook.js:608
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🎯 Saving GEO targets...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ GEO targets saved
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ Organization created successfully! Object
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 📝 Stored organization in state: ce97afd6-e744-49f0-81fc-296b42b99c7c
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ➡️ Moved to step 6 (GEO Discovery)
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🎯 Running GEO Discovery...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🔍 Generating queries...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ Generated 5 queries for testing
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🚀 Testing all platforms in parallel...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ All platform tests complete: Object
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🎯 Synthesizing 20 test results...
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 ✅ GEO Discovery Complete: Object
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🚀 Starting schema onboarding pipeline
page-dbefd7cb0c2a2d49.js?dpl=dpl_9wLkCZmwDZCNE1sDmpH7DjXRaYYb:1 🚀 Starting Schema Onboarding Pipeline...
zskaxjtyuaqazydouifp.supabase.co/functions/v1/schema-onboarding-orchestrator:1 Failed to load resource: the server responded with a status of 500 ()
hook.js:608 Schema onboarding failed: {"error":"Entity extraction failed: {\"error\":\"Failed to parse entity extraction results\",\"details\":\"Error: Failed to parse entity extraction results\"}","details":"Error: Entity extraction failed: {\"error\":\"Failed to parse entity extraction results\",\"details\":\"Error: Failed to parse entity extraction results\"}"}
overrideMethod @ hook.js:608

[
{
"event_message": "shutdown",
"event_type": "Shutdown",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "827b017d-1000-4cb1-8785-ebbb1d7480cd",
"level": "log",
"timestamp": 1761931190009000
},
{
"event_message": "❌ Entity Extractor Error: Error: Failed to parse entity extraction results\n at Server.<anonymous> (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/entity-extractor/index.ts:112:13)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async Server.#respond (https://deno.land/std@0.168.0/http/server.ts:221:18)\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "354ed1b9-a2b0-4f0d-8e64-ed5fa83b1c57",
"level": "error",
"timestamp": 1761931002175000
},
{
"event_message": "Failed to parse Claude response: SyntaxError: Unexpected token 'B', \"Based on t\"... is not valid JSON\n at JSON.parse (<anonymous>)\n at Server.<anonymous> (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/entity-extractor/index.ts:108:23)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async Server.#respond (https://deno.land/std@0.168.0/http/server.ts:221:18)\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "7d182e3d-b209-4fbe-804a-6d955ea5a5a9",
"level": "error",
"timestamp": 1761931002175000
},
{
"event_message": "Response was: Based on the website content, here's the structured JSON:\n\n{\n \"products\": [],\n \"services\": [\n {\n \"name\": \"Brand Experience\",\n \"description\": \"Connecting dots between people, brands, and culture\",\n \"category\": \"Marketing\",\n \"service_type\": \"Creative Agency\"\n },\n {\n \"name\": \"Storytelling\",\n \"description\": \"Narrative design at the heart of brand experiences\",\n \"category\": \"Brand Communication\",\n \"service_type\": \"Narrative Design\"\n },\n {\n \"name\": \"Worldbuilding\",\n \"description\": \"Evolution of brand building\",\n \"category\": \"Brand Strategy\",\n \"service_type\": \"Brand Development\"\n }\n ],\n \"team\": [],\n \"locations\": [],\n \"subsidiaries\": [],\n \"organization_details\": {\n \"name\": \"Amplify\",\n \"type\": \"Global Brand Experience Agency\",\n \"awards\": [\"Brand Experience Agency of the Decade\"],\n \"focus_areas\": [\"Experience\", \"Entertainment\", \"Culture\"]\n }\n}\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "2cbcc9f2-6046-48d3-9af6-ba1fc4572640",
"level": "error",
"timestamp": 1761931002175000
},
{
"event_message": "📄 Processing 6861 characters of text\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "a1f2aed1-5827-4ee7-834f-8242e18bb062",
"level": "info",
"timestamp": 1761930989993000
},
{
"event_message": "🔍 Entity Extractor Starting: { organization_name: \"Amplify\", pages_count: 10 }\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "8dd10c64-05bc-471f-9c6f-bc1d439830a1",
"level": "info",
"timestamp": 1761930989992000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "69dda685-d64d-4289-bff6-8f29356b3a48",
"level": "info",
"timestamp": 1761930989986000
},
{
"event_message": "booted (time: 38ms)",
"event_type": "Boot",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "ed31759a-9e7d-4bdb-ac1e-f67a025a1a94",
"level": "log",
"timestamp": 1761930989983000
},
{
"event_message": "shutdown",
"event_type": "Shutdown",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "7fde00f5-0f97-439f-b196-ebb05fa52e99",
"level": "log",
"timestamp": 1761930101984000
},
{
"event_message": "✅ Entity Extraction Complete: {\n total_entities: 18,\n products: 0,\n services: 5,\n team: 9,\n locations: 4,\n subsidiaries: 0\n}\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "22e06259-fb0d-4e8e-a29d-5280fbc15315",
"level": "info",
"timestamp": 1761930015241000
},
{
"event_message": "📄 Processing 17309 characters of text\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "315206a2-4875-4eda-b5f2-3dbb476886b0",
"level": "info",
"timestamp": 1761929982383000
},
{
"event_message": "🔍 Entity Extractor Starting: { organization_name: \"KARV\", pages_count: 10 }\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "f296303c-c2fd-489e-a8f9-ffeb2fbab4d2",
"level": "info",
"timestamp": 1761929982382000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "ed86fe72-0077-4146-ba91-0cb5ef266e97",
"level": "info",
"timestamp": 1761929965603000
},
{
"event_message": "booted (time: 42ms)",
"event_type": "Boot",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "c3d67820-9186-4f24-8633-6af03fc85d8f",
"level": "log",
"timestamp": 1761929964842000
},
{
"event_message": "shutdown",
"event_type": "Shutdown",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "ffd1f4cf-e078-4595-9329-50805625f593",
"level": "log",
"timestamp": 1761928452470000
},
{
"event_message": "✅ Entity Extraction Complete: {\n total_entities: 18,\n products: 0,\n services: 5,\n team: 9,\n locations: 4,\n subsidiaries: 0\n}\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "8f2b197b-f5cf-4041-bd9b-8586b1b5413b",
"level": "info",
"timestamp": 1761928283347000
},
{
"event_message": "📄 Processing 19418 characters of text\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "bcee1066-805d-49d9-8546-12af5a4f0ff8",
"level": "info",
"timestamp": 1761928252460000
},
{
"event_message": "🔍 Entity Extractor Starting: { organization_name: \"KARV\", pages_count: 10 }\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "e9c0ebcb-9069-4e0a-8a64-65a15c88c3c7",
"level": "info",
"timestamp": 1761928252459000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "12451a0e-be5d-42d5-b772-10a03f2d22c0",
"level": "info",
"timestamp": 1761928252451000
},
{
"event_message": "booted (time: 43ms)",
"event_type": "Boot",
"function_id": "075e42eb-5b48-47ff-b5a5-521fe5fcaf40",
"id": "935795a4-6ee8-47de-8804-f7515748781f",
"level": "log",
"timestamp": 1761928252447000
}
]
