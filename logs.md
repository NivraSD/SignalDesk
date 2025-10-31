hook.js:608 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
overrideMethod @ hook.js:608
858-23c03b66c33493b8.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ⚠️ Same organization selected, skipping reload
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Deleted organization: Anthropic
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Deleted organization: OpenAI
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Deleted organization: KARV
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🔍 Running MCP discovery...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Discovery complete
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🚀 handleCreateOrganization CALLED - START OF FUNCTION
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 Organization details: Object
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 📝 Creating organization...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🎯 Saving targets...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 💾 Saving organization profile to mcp_discovery...
zskaxjtyuaqazydouifp.supabase.co/rest/v1/mcp_discovery?on_conflict=organization_id:1 Failed to load resource: the server responded with a status of 400 ()
hook.js:608 Failed to save profile to mcp_discovery: Object
overrideMethod @ hook.js:608
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Organization created successfully! Object
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 📝 Stored organization in state: 5ff115e2-9738-4bf3-83fe-d6aa5760508b
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ➡️ Moved to step 6 (GEO Discovery)
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🎯 Running GEO Discovery...
(index):1 Access to fetch at 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/geo-intelligence-monitor' from origin 'https://signaldesk-v3.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
zskaxjtyuaqazydouifp.supabase.co/functions/v1/geo-intelligence-monitor:1 Failed to load resource: net::ERR_FAILED
hook.js:608 GEO Discovery error: TypeError: Failed to fetch
at eW (page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:573857)
at i8 (4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:135364)
at 4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:141450
at nz (4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:19198)
at sn (4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:136597)
at cc (4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:163599)
at ci (4bd1b696-f785427dddbba9fb.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1:163421)
overrideMethod @ hook.js:608

hook.js:608 Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.
overrideMethod @ hook.js:608
858-23c03b66c33493b8.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🔄 Switching from Mitsui & Co. to KARV
858-23c03b66c33493b8.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Organization switched to KARV
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 Received addComponentToCanvas event: Object
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 Adding component: intelligence
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 New component: Object
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🔄 Organization changed to KARV, loading latest synthesis
zskaxjtyuaqazydouifp.supabase.co/rest/v1/executive_synthesis?select=\*&organization_id=eq.5ff115e2-9738-4bf3-83fe-d6aa5760508b&order=created_at.desc&limit=1:1 Failed to load resource: the server responded with a status of 404 ()
hook.js:608 Failed to get synthesis: Object
overrideMethod @ hook.js:608
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 No previous synthesis found
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🌍 Starting GEO Intelligence Monitor for KARV
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🔍 Generating queries...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ Generated 5 queries for testing
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🚀 Testing all platforms in parallel...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ All platform tests complete: {claude: '2/5', gemini: '2/5', perplexity: '2/5', chatgpt: '2/5'}
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 🎯 Synthesizing 20 test results...
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 ✅ GEO monitor complete
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 - 5 queries tested
page-dca0e9a1628bff29.js?dpl=dpl_DMbixJEust21ZNanYHniEoExDgHu:1 - 4 platforms tested in parallel
