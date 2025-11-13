[
{
"event_message": "Error saving recommendation: {\n code: \"23502\",\n details: \"Failing row contains (662d5b96-9c4e-4bd4-b49b-76c8850c19e3, 53ab1d52-5ee6-42da-8b69-97bab4748a6f, null, LocalBusiness, add_structured_data, medium, all, Add LocalBusiness schema if serving specific geographic markets, null, Location-based service queries often show higher conversion. If ..., Improve visibility for location + service queries, potentially 2..., {}, f, f, pending, null, null, null, null, null, null, 2025-11-13 11:40:32.588476+00, 2025-11-13 11:40:32.588476+00).\",\n hint: null,\n message: 'null value in column \"description\" of relation \"schema_recommendations\" violates not-null constraint'\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "13950cc7-d6a7-4f90-b433-137b2dcf1cb2",
"level": "error",
"timestamp": 1763034032597000
},
{
"event_message": "Error saving recommendation: {\n code: \"23502\",\n details: \"Failing row contains (9f811b93-16f7-4137-9f74-666b98072c7c, 53ab1d52-5ee6-42da-8b69-97bab4748a6f, null, FAQPage, add_structured_data, high, all, Implement FAQPage schema with industry-specific questions, null, AI platforms heavily favor FAQ content for conversational respon..., Potential to appear in 30-40% of advice-seeking queries about br..., {}, f, f, pending, null, null, null, null, null, null, 2025-11-13 11:40:32.548764+00, 2025-11-13 11:40:32.548764+00).\",\n hint: null,\n message: 'null value in column \"description\" of relation \"schema_recommendations\" violates not-null constraint'\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "560e26ff-90df-488e-b52f-85cf93b4cad7",
"level": "error",
"timestamp": 1763034032556000
},
{
"event_message": "Error saving recommendation: {\n code: \"23502\",\n details: \"Failing row contains (7c232d79-6da8-47d0-b557-5d901409bbcc, 53ab1d52-5ee6-42da-8b69-97bab4748a6f, null, Service, add_structured_data, critical, all, Add comprehensive Service schema for each offering, null, Service-specific queries showed 0% visibility - Service schema w..., Target 15-25% visibility improvement for service-specific querie..., {}, f, f, pending, null, null, null, null, null, null, 2025-11-13 11:40:32.521811+00, 2025-11-13 11:40:32.521811+00).\",\n hint: null,\n message: 'null value in column \"description\" of relation \"schema_recommendations\" violates not-null constraint'\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "2177e7c9-6971-4752-9b08-e5b6419ff98c",
"level": "error",
"timestamp": 1763034032529000
},
{
"event_message": "Error saving recommendation: {\n code: \"23502\",\n details: \"Failing row contains (8dab35a2-354a-473b-846f-34f8e7228d76, 53ab1d52-5ee6-42da-8b69-97bab4748a6f, null, Organization, deploy_schema, critical, all, Deploy existing Organization schema immediately, null, Schema exists in memory vault but isn't deployed - this is block..., Immediate improvement from 0% visibility to 10-20% mention rate ..., {}, f, f, pending, null, null, null, null, null, null, 2025-11-13 11:40:32.486708+00, 2025-11-13 11:40:32.486708+00).\",\n hint: null,\n message: 'null value in column \"description\" of relation \"schema_recommendations\" violates not-null constraint'\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "7745453b-a259-4e66-8803-750910ef54dd",
"level": "error",
"timestamp": 1763034032500000
},
{
"event_message": "💾 Saving 4 schema recommendations to database...\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "95cde2b3-96ca-4863-b2a2-10a6dae8e6bc",
"level": "info",
"timestamp": 1763034032385000
},
{
"event_message": "✅ Parsed synthesis: {\n has_executive_summary: true,\n key_findings_count: 4,\n has_competitive_analysis: true,\n has_source_strategy: true,\n schema_recommendations_count: 4,\n strategic_actions_count: 5\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "89bf0119-996a-41e4-bec8-fb8fdb24df11",
"level": "info",
"timestamp": 1763034032385000
},
{
"event_message": "✅ Synthesis Generated: {\n key_findings: 4,\n schema_recommendations: 4,\n strategic_actions: 5,\n has_competitive_analysis: true,\n has_source_strategy: true\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "0b74c54a-55ab-422a-9fa6-1524d2d66e7b",
"level": "info",
"timestamp": 1763034032385000
},
{
"event_message": "📝 Raw Claude response length: 8730\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "c038f55f-e569-4947-943a-a769886507e2",
"level": "info",
"timestamp": 1763034032384000
},
{
"event_message": "📝 First 500 chars: ```json\n{\n \"executive_summary\": \"Amplify faces a critical AI visibility crisis with 0% mention rate across 47 queries and all major AI platforms (Claude, ChatGPT, Gemini). The complete absence of competitor mentions in queries suggests either overly broad query targeting or an industry segment with inherently low AI visibility. This presents both a challenge and a massive first-mover opportunity. With schema markup created but not deployed and no website configured, Amplify is essentially invis\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "f35ea4d9-f406-42ad-8fa3-c132f14fb9f1",
"level": "info",
"timestamp": 1763034032384000
},
{
"event_message": "🤖 Calling Claude for executive synthesis...\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "4fdaa647-40d3-4a4c-994e-a0fe414c60c8",
"level": "info",
"timestamp": 1763033990548000
},
{
"event_message": "📊 Schema Status: { inMemoryVault: true, onWebsite: false, overall: \"Schema exists\" }\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "2fbb1f9f-c800-465e-9bb2-ce25f0ea19d2",
"level": "info",
"timestamp": 1763033990547000
},
{
"event_message": "✅ Schema found in Memory Vault: { type: undefined, fields: 0 }\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "edc785b7-405e-431d-acbb-2969d7b2483b",
"level": "info",
"timestamp": 1763033990547000
},
{
"event_message": "🌐 Organization website: Not set\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "9223537d-770b-4c87-a5ac-02071d4824a5",
"level": "info",
"timestamp": 1763033990517000
},
{
"event_message": "📈 Analysis Complete: {\n total_queries: 47,\n mention_rate: 0,\n critical_gaps: 44,\n opportunities: 0\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "d2093c9e-3caf-4b09-9448-1384f0951019",
"level": "info",
"timestamp": 1763033990405000
},
{
"event_message": "📊 GEO Executive Synthesis Starting: {\n organization: \"Amplify\",\n industry: undefined,\n results_count: 47,\n timestamp: \"2025-11-13T11:39:50.400Z\"\n}\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "3e259bda-e047-4429-a43a-bf8222e25fa7",
"level": "info",
"timestamp": 1763033990402000
},
{
"event_message": "Listening on http://localhost:9999/\n",
"event_type": "Log",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "4550460c-801c-4038-8cfe-d3d54d27a5ba",
"level": "info",
"timestamp": 1763033990397000
},
{
"event_message": "booted (time: 34ms)",
"event_type": "Boot",
"function_id": "4b0a9f1e-f9e2-46eb-951b-0bd14a69fb2c",
"id": "d7e3aa77-ca11-47ff-8135-50f1c13384a3",
"level": "log",
"timestamp": 1763033990392000
}
]
