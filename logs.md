[
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "7e6e1eb9-adba-472b-967b-c7805a5da37e",
"level": "info",
"timestamp": 1760901398490000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "9510a4e6-3b36-4517-83a8-254be84d473d",
"level": "info",
"timestamp": 1760901398487000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "22715994-0396-4ad6-a952-1a75c8a3fa1f",
"level": "log",
"timestamp": 1760901398481000
},
{
"event_message": "Builder API error: {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "14a13824-22f3-4004-84b9-02750b7469d2",
"level": "error",
"timestamp": 1760901396126000
},
{
"event_message": "❌ Build presentation error: Error: Builder API failed: 500 {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n at buildPresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:301:13)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async generatePresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:428:22)\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "caa085b6-ecb1-4906-9acb-e1dcf7badb0a",
"level": "error",
"timestamp": 1760901396126000
},
{
"event_message": "❌ Generation error: Error: Builder API failed: 500 {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n at buildPresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:301:13)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async generatePresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:428:22)\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "de7212e6-68c3-4586-ba20-de1db6e514ad",
"level": "error",
"timestamp": 1760901396126000
},
{
"event_message": "🏗️ Building PowerPoint presentation\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8c3eff83-9ec6-4a63-ada2-e7a70f7ff027",
"level": "info",
"timestamp": 1760901396020000
},
{
"event_message": "📤 Calling builder API: https://signaldesk-v3.vercel.app/api/build-presentation\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8d378757-7158-48c9-8769-57ff7cc3441a",
"level": "info",
"timestamp": 1760901396020000
},
{
"event_message": "Step 2: Building PowerPoint...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "4bc86823-9eb5-40dd-a06b-97ac519cec8c",
"level": "info",
"timestamp": 1760901396020000
},
{
"event_message": "Step 1.5: Processing visual suggestions...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "aebc47de-2c40-4283-a4ed-469da7a065e5",
"level": "info",
"timestamp": 1760901395978000
},
{
"event_message": "✅ Valid presentation data with 14 slides\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "7f856731-6e69-4690-9f10-9c09ffc98eda",
"level": "info",
"timestamp": 1760901395929000
},
{
"event_message": "📝 Parsing JSON response...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "a0964917-d6ff-4c72-8e2b-7aeae8c66af1",
"level": "info",
"timestamp": 1760901395928000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "21503e4f-64fc-485f-b34e-266118849e46",
"level": "info",
"timestamp": 1760901395474000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "3c5fa339-e045-473e-a0ba-ef38c84a898f",
"level": "info",
"timestamp": 1760901395474000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "9de87aea-fc32-47b2-ad63-ee247342b03d",
"level": "info",
"timestamp": 1760901395474000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "f8d16236-7128-4e0a-8d05-61c7e366e0c6",
"level": "info",
"timestamp": 1760901395470000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "c4e4c3df-4b3d-4240-be88-baaafaf5b5b9",
"level": "info",
"timestamp": 1760901395470000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8af35bd5-2209-45cc-ab75-429820185cc3",
"level": "info",
"timestamp": 1760901395470000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "03010948-58a6-4988-9428-8e0a674df658",
"level": "log",
"timestamp": 1760901395465000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "cd99fc02-3fc3-4783-b256-b7b38d878698",
"level": "log",
"timestamp": 1760901395465000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "737eda23-fb9e-4cf9-93c6-e6ec7b6460a2",
"level": "log",
"timestamp": 1760901395465000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "20aff81f-45a4-415b-b4b7-0bb4d3753b8f",
"level": "info",
"timestamp": 1760901392488000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "eb24984d-e298-46fd-b068-e8327bb92a9b",
"level": "info",
"timestamp": 1760901392478000
},
{
"event_message": "booted (time: 30ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "6345435c-022e-4ce8-b61c-b395bb51810d",
"level": "log",
"timestamp": 1760901392472000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "341c590c-aa9f-4b6e-b1b3-c428885098af",
"level": "info",
"timestamp": 1760901389438000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "c03bd548-cb77-4a28-acb2-e4b0c3eebddf",
"level": "info",
"timestamp": 1760901386519000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "aaf942ae-036d-42f6-b9f9-f356670136de",
"level": "info",
"timestamp": 1760901386516000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "06653580-aba9-4fc2-80d4-a45a07042751",
"level": "log",
"timestamp": 1760901386510000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "ef3a2909-910a-437e-b20a-ba1a35dedf27",
"level": "info",
"timestamp": 1760901383450000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "4d0fc29c-2d30-4477-b64c-b0046cda70c4",
"level": "info",
"timestamp": 1760901380459000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "02d88551-8b8c-4f45-a4db-d424f23a74df",
"level": "info",
"timestamp": 1760901377515000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "453606fe-0034-4681-9193-cf38cc35b69a",
"level": "info",
"timestamp": 1760901377506000
},
{
"event_message": "booted (time: 30ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "f8faa84a-17c9-49c9-9d70-10a19797ae8e",
"level": "log",
"timestamp": 1760901377500000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "e9729693-e1a4-4bea-ad41-7fe235f31c88",
"level": "info",
"timestamp": 1760901374487000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "d9403071-c61d-498c-b00c-e301774abbcf",
"level": "info",
"timestamp": 1760901374483000
},
{
"event_message": "booted (time: 42ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "e8742185-4c12-4171-b6f2-83a8ee015813",
"level": "log",
"timestamp": 1760901374474000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "849d6ca4-f16c-464d-b1b9-71bbd18385eb",
"level": "info",
"timestamp": 1760901371466000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "6048773e-512f-4771-97fc-3da56cc0f911",
"level": "info",
"timestamp": 1760901371463000
},
{
"event_message": "booted (time: 28ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "d84c2daa-fb22-400d-8dc9-94f49c72c51d",
"level": "log",
"timestamp": 1760901371458000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "1b3f9a63-f28d-4217-9e1c-51534b73a30b",
"level": "info",
"timestamp": 1760901368482000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "bf1e9fec-df9c-443e-9621-be2cd7459269",
"level": "info",
"timestamp": 1760901368479000
},
{
"event_message": "booted (time: 28ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "1e1fc1f9-9120-473d-845e-c3cfd50cc07c",
"level": "log",
"timestamp": 1760901368474000
},
{
"event_message": "❌ Build presentation error: Error: Builder API failed: 500 {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n at buildPresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:301:13)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async generatePresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:428:22)\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "6d6f7d6c-4263-4c13-a828-9a07385267fd",
"level": "error",
"timestamp": 1760901367849000
},
{
"event_message": "❌ Generation error: Error: Builder API failed: 500 {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n at buildPresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:301:13)\n at eventLoopTick (ext:core/01_core.js:175:7)\n at async generatePresentation (file:///Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts:428:22)\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "ff51f3e2-54df-454c-9cd4-3b092e1c78fb",
"level": "error",
"timestamp": 1760901367849000
},
{
"event_message": "Builder API error: {\"success\":false,\"error\":\"Cannot read properties of undefined (reading 'length')\",\"details\":\"TypeError: Cannot read properties of undefined (reading 'length')\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:18856\\n at new Promise (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1935\\n at Generator.next (<anonymous>)\\n at /var/task/.next/server/app/api/build-presentation/route.js:1:82567\\n at new Promise (<anonymous>)\\n at M (/var/task/.next/server/app/api/build-presentation/route.js:1:82316)\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:1876\\n at /var/task/.next/server/app/api/build-presentation/route.js:38:29676\\n at Array.forEach (<anonymous>)\"}\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "a106b12c-7441-4ff4-99fc-f6769a5d5bd8",
"level": "error",
"timestamp": 1760901367847000
},
{
"event_message": "📤 Calling builder API: https://signaldesk-v3.vercel.app/api/build-presentation\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8949883f-3f21-49ca-b29e-60c56e1675cb",
"level": "info",
"timestamp": 1760901367741000
},
{
"event_message": "Step 2: Building PowerPoint...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "a3645efc-0adc-492f-b837-809de03589f8",
"level": "info",
"timestamp": 1760901367741000
},
{
"event_message": "🏗️ Building PowerPoint presentation\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8c6aba18-d4c8-47c7-a517-50a017c9ff9e",
"level": "info",
"timestamp": 1760901367741000
},
{
"event_message": "Step 1.5: Processing visual suggestions...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "c1dd6840-77bc-45cc-aa01-39790a0faf3f",
"level": "info",
"timestamp": 1760901367665000
},
{
"event_message": "✅ Valid presentation data with 14 slides\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "571d8361-e3f2-46a2-b892-1704c23e813d",
"level": "info",
"timestamp": 1760901367576000
},
{
"event_message": "📝 Parsing JSON response...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "2c0bd48a-4add-4a36-8e0f-2bed08cbad2e",
"level": "info",
"timestamp": 1760901367576000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "ac69eb82-4f46-4208-b7a3-3d3103187905",
"level": "info",
"timestamp": 1760901365472000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "7f8a55e8-6a2c-40bd-a3ec-aaf5eae09682",
"level": "info",
"timestamp": 1760901365469000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "d950d3b9-88b6-4360-9441-28aa0d7e557f",
"level": "log",
"timestamp": 1760901365463000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "35b06111-c8c0-43e4-bed1-45864de1a49d",
"level": "info",
"timestamp": 1760901362483000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "5ce4b16d-479f-4aff-b0f0-ac4d10b694ff",
"level": "info",
"timestamp": 1760901362480000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "1db52ad4-b12c-4179-a22f-c024270e90bc",
"level": "log",
"timestamp": 1760901362474000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "e302acba-84f4-4a29-9f2b-45e77d146237",
"level": "info",
"timestamp": 1760901359486000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "03d63e57-6103-4488-8358-8cef2d626eaf",
"level": "info",
"timestamp": 1760901359481000
},
{
"event_message": "booted (time: 40ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "13a1a5f7-8c5c-46c8-9597-60a8c379d89d",
"level": "log",
"timestamp": 1760901359473000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "b4b7980a-3002-4696-b791-4b843de9e065",
"level": "info",
"timestamp": 1760901356452000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "049cac09-ed5b-4f87-b970-34f5cf1084ba",
"level": "info",
"timestamp": 1760901353467000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "e3438a51-d0b6-4d51-b709-c2386237c512",
"level": "info",
"timestamp": 1760901353464000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "567ef027-05da-43b9-b755-541661cbac11",
"level": "log",
"timestamp": 1760901353459000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "5f5bed9f-5a35-4608-8ded-769046984353",
"level": "info",
"timestamp": 1760901350469000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "ce19d249-8caf-46b4-8612-8ce891a803e3",
"level": "info",
"timestamp": 1760901350466000
},
{
"event_message": "booted (time: 28ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "f859c037-be80-456f-930b-f1148d266b5c",
"level": "log",
"timestamp": 1760901350460000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8b1217f1-2705-4a68-bf75-bca7a8ee6e3c",
"level": "info",
"timestamp": 1760901347483000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "97074127-3855-42d7-9c85-e1a87f7089fa",
"level": "info",
"timestamp": 1760901347479000
},
{
"event_message": "booted (time: 37ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8fa0ffa5-b739-4591-97cb-375ab1c9caab",
"level": "log",
"timestamp": 1760901347472000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "f8a8da3d-4e96-452d-8935-dd631fa6240d",
"level": "info",
"timestamp": 1760901344490000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "c76c23c8-3d66-4e85-b55e-f24e4403e09b",
"level": "info",
"timestamp": 1760901344486000
},
{
"event_message": "booted (time: 38ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "a2a1b029-0b5f-4eae-9edd-a22b1b12869b",
"level": "log",
"timestamp": 1760901344478000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "65043800-b726-461f-8ca4-1aafe6a59bb1",
"level": "info",
"timestamp": 1760901341467000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "9f67d555-7245-4d30-8d3f-8fe2e4707acc",
"level": "info",
"timestamp": 1760901341463000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "894e6d1e-a55b-4e61-909c-2fbd19728506",
"level": "log",
"timestamp": 1760901341457000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "822e7ccc-494f-45ca-a3b2-7c1e9f056035",
"level": "info",
"timestamp": 1760901338473000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "b19c26e6-99bd-4f5d-8618-d3f8fdae3c30",
"level": "info",
"timestamp": 1760901338470000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "7742fc72-842e-4996-8847-871c9278fcdf",
"level": "log",
"timestamp": 1760901338465000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "f0c2f2e6-2eef-4d09-bef2-be59fb228bae",
"level": "info",
"timestamp": 1760901335480000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "7d28f273-841f-43fa-9f65-b61b2d7587e7",
"level": "info",
"timestamp": 1760901335476000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "5ba44786-afd2-4ccf-b9d7-d888b856e46f",
"level": "log",
"timestamp": 1760901335470000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "5224d99b-df56-4725-8307-a14183eddd3f",
"level": "info",
"timestamp": 1760901332508000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8d7f82be-4779-4f21-a44a-b96671d69f16",
"level": "info",
"timestamp": 1760901332505000
},
{
"event_message": "booted (time: 37ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "1e2b16d9-6bfa-4ef2-aa1f-830b3fc0ebcb",
"level": "log",
"timestamp": 1760901332497000
},
{
"event_message": "🔍 Status check for generation: e29be37c-154f-44a4-94f1-f2cfb6df49d8\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "0a5a38a0-313a-43dd-9589-5d0cf40df964",
"level": "info",
"timestamp": 1760901329630000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "0fed6133-416b-4b51-ad3b-362647e567a9",
"level": "info",
"timestamp": 1760901329626000
},
{
"event_message": "booted (time: 38ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "595be9ca-5a0c-4e00-875c-409f69212fb6",
"level": "log",
"timestamp": 1760901329618000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "826d58de-c42f-428e-9a40-42b7a73b1edb",
"level": "info",
"timestamp": 1760901329481000
},
{
"event_message": "booted (time: 29ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "0f980a42-4c16-4e56-97ca-631a594a87ad",
"level": "log",
"timestamp": 1760901329475000
},
{
"event_message": "📝 Generating presentation content with Claude\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "742ff094-0283-4791-a9ae-b8864ce0282d",
"level": "info",
"timestamp": 1760901326428000
},
{
"event_message": "Step 1: Generating content...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "e59a1b04-7e55-4348-9e62-c67b515a7da2",
"level": "info",
"timestamp": 1760901326428000
},
{
"event_message": "✅ SignalDeck generation request: {\n topic: \"Adult Content Policy Clarification Strategy\",\n slideCount: undefined\n}\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "4a21f975-b4c1-4576-9d0a-5e0fa97c43e9",
"level": "info",
"timestamp": 1760901325802000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "1a1ef8f0-d96c-42cc-adec-5b9ce8e23e5f",
"level": "info",
"timestamp": 1760901325655000
},
{
"event_message": "booted (time: 28ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "944fc351-a665-43b3-96c0-6808e183d9d5",
"level": "log",
"timestamp": 1760901310460000
},
{
"event_message": "Step 1: Generating content...\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "6f55f112-3ada-4595-bd42-798086e24b5e",
"level": "info",
"timestamp": 1760901295910000
},
{
"event_message": "📝 Generating presentation content with Claude\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "8c3923c6-35be-4b5b-bbe3-60e3af3f7c7f",
"level": "info",
"timestamp": 1760901295910000
},
{
"event_message": "✅ SignalDeck generation request: {\n topic: \"Adult Content Policy Clarification Strategy\",\n slideCount: undefined\n}\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "ae4c7c4e-add4-48df-b80b-c5b1fc92658e",
"level": "info",
"timestamp": 1760901294031000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "65225877-b095-47b1-8f65-16a1e5d8ad98",
"level": "info",
"timestamp": 1760901294026000
},
{
"event_message": "booted (time: 28ms)",
"event_type": "Boot",
"function_id": "8eeaa3f5-e899-4918-895b-80b5551fe7fc",
"id": "4b8d0ab0-dbc9-4b13-982a-dd24376a2407",
"level": "log",
"timestamp": 1760901294020000
}
]
