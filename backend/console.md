supabase.js:16 🔧 Supabase Configuration: Object
supabase.js:73 ✅ Supabase singleton client created successfully
api.js:24 SignalDesk Configuration - SUPABASE ONLY:
api.js:25 - Backend Mode: Supabase Edge Functions
api.js:26 - Supabase URL: https://zskaxjtyuaqazydouifp.supabase.co
api.js:27 - Environment: production
api.js:28 - Auth: Supabase Auth
api.js:29 - Database: Supabase PostgreSQL
api.js:30 - APIs: Supabase Edge Functions
api.js:31 ✅ Supabase-only configuration loaded
api.js:38 ✅ Supabase-only mode: No API_BASE_URL needed
api.js:5 API URL:
migrateProfile.js:5 ✅ Unified profile already exists, skipping migration
supabaseApiService.js:11 ✅ Supabase API Service initialized
supabaseApiService.js:12 🚀 Using Supabase for ALL backend operations
unifiedIntelligenceService.js:22 UnifiedIntelligenceService initialized
apiUrl.js:9 🚀 SUPABASE-ONLY MODE ACTIVE
apiUrl.js:10 ✅ Using Supabase URL: https://zskaxjtyuaqazydouifp.supabase.co
apiUrl.js:11 🔒 No backend server required
apiUrl.js:12 ⚡ All APIs handled by Supabase Edge Functions
apiUrl.js:13 📅 Build time: 2025-08-31T16:01:27.458Z
apiService.js:9 ✅ API Service initialized with FORCE URL:
apiService.js:16 API Service using URL:
intelligenceOrchestratorV4.js:13 🎯 V4 Elite Orchestrator - Edge Function Mode (No Cache)
App.js:52 🚀 SignalDesk initialized with Supabase: Connected
App.js:92 ⚡⚡⚡ RAILWAY V2 NEON INTERFACE - DEPLOYED: 2025-08-31T16:01:27.460Z
App.js:93 🎯 Modern Railway design with neon buttons
App.js:94 💎 Intelligence Hub with practical insights
App.js:95 🚀 VERSION 0.2.0 - Firecrawl Integration Active
App.js:96 📅 Build Date: August 23, 2025
SimpleOrgInit.js:17 🚀 Starting with simple org data: Object
SimpleOrgInit.js:40 ✅ Organization saved to localStorage: Object
SimpleOrgInit.js:63 ✅ Organization saved to edge function database
MultiStageIntelligence.js:99 🔍 Loading organization from edge function (single source of truth)...
MultiStageIntelligence.js:113 📱 Using organization from localStorage: Meta
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: Object
MultiStageIntelligence.js:1324 ⏳ No organization yet
unifiedDataLoader.js:9 🔍 Loading organization from edge function... for: Meta
MultiStageIntelligence.js:198 🚀 Organization loaded: Meta - Running FRESH pipeline
MultiStageIntelligence.js:209 📝 Ready to run COMPLETE fresh analysis pipeline - no cache loading
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: Object
MultiStageIntelligence.js:1330 🚀 Starting pipeline for the first time
MultiStageIntelligence.js:228 🔄 Starting stage 1: Organization Data Extraction
MultiStageIntelligence.js:377 🎯 Creating config for Stage 1 (extraction): Object
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Data gathering and organization profiling
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Organization Data Extraction
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: Object
intelligenceOrchestratorV4.js:105 🏢 Stage 1: Organization Data Extraction & Discovery
intelligenceOrchestratorV4.js:115 🔍 Step 1: Discovering organization profile for: Meta
intelligenceOrchestratorV4.js:116 📦 Discovery request payload: Object
intelligenceOrchestratorV4.js:143 🚀 Calling discovery edge function at: https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-discovery-v3
unifiedDataLoader.js:42 ✅ Loaded organization from edge function: Object
RailwayV2Enhanced.js:43 🏢 RailwayV2Enhanced loaded organization from edge function: Object
intelligenceOrchestratorV4.js:172 📥 Discovery response received, parsing...
intelligenceOrchestratorV4.js:174 ✅ Discovery complete: {hasEntities: true, entities: Array(6), saved: true, request_id: 'req_1756656091701_2ms0dzr5m'}
intelligenceOrchestratorV4.js:184 🔑 Pipeline request_id from discovery: req_1756656091701_2ms0dzr5m
intelligenceOrchestratorV4.js:195 📡 Step 2: Collecting intelligence signals...
intelligenceOrchestratorV4.js:223 📥 Collection response received, parsing...
intelligenceOrchestratorV4.js:225 ✅ Collection data parsed: {hasIntelligence: true, signalCount: 135}
intelligenceOrchestratorV4.js:269 ✅ Saved extraction stage data to Supabase
intelligenceOrchestratorV4.js:1253 ✅ Saved extraction Claude analysis to storage
MultiStageIntelligence.js:254 ✅ Stage 1 (extraction) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: false, opportunityCount: 0, …}
MultiStageIntelligence.js:299 📊 Stage 1 (extraction) results stored. Total stages accumulated: 1
MultiStageIntelligence.js:300 📋 Current accumulated stages: ['extraction']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 1, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1350 🚀 RUNNING STAGE 2: Competitive Intelligence Analysis
MultiStageIntelligence.js:228 🔄 Starting stage 2: Competitive Intelligence Analysis
MultiStageIntelligence.js:377 🎯 Creating config for Stage 2 (competitive): {hasStageResults: true, stageResultsKeys: Array(1), stageResultsCount: 1}
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Competitor actions, market positioning, competitive threats
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Competitive Intelligence Analysis
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: {stageConfig: {…}, organization: {…}, organizationType: 'object', hasOrgName: true, config: {…}, …}
intelligenceOrchestratorV4.js:294 🎯 Stage 2: Competitive Intelligence Analysis
intelligenceOrchestratorV4.js:299 🔑 Using request_id from extraction stage: req_1756656091701_2ms0dzr5m
intelligenceOrchestratorV4.js:303 🔍 DEBUG runCompetitiveStage inputs: {organizationParam: {…}, organizationType: 'object', requestId: 'req_1756656091701_2ms0dzr5m', organizationKeys: Array(16), configParam: {…}, …}
intelligenceOrchestratorV4.js:325 📊 Loading organization profile from edge function for: Meta
intelligenceOrchestratorV4.js:361 ✅ Loaded profile from edge function with 0 competitors
intelligenceOrchestratorV4.js:374 📊 Skipping backend persistence calls to avoid 500 errors
intelligenceOrchestratorV4.js:401 📤 Sending to competitor stage: {hasProfile: true, competitorCount: 0, competitors: Array(0), organizationName: 'Meta', fullRequestBody: {…}}
intelligenceOrchestratorV4.js:459 ✅ Saved competitive stage data to Supabase
intelligenceOrchestratorV4.js:1253 ✅ Saved competitive Claude analysis to storage
intelligenceOrchestratorV4.js:469 🔄 Stage 2 (competitive) returning data: {hasData: true, hasCompetitors: true, competitorsStructure: Array(4), hasTabs: true}
MultiStageIntelligence.js:254 ✅ Stage 2 (competitive) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: false, opportunityCount: 0, …}
MultiStageIntelligence.js:299 📊 Stage 2 (competitive) results stored. Total stages accumulated: 2
MultiStageIntelligence.js:300 📋 Current accumulated stages: (2) ['extraction', 'competitive']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 2, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1350 🚀 RUNNING STAGE 3: Media Landscape Mapping
MultiStageIntelligence.js:228 🔄 Starting stage 3: Media Landscape Mapping
MultiStageIntelligence.js:377 🎯 Creating config for Stage 3 (media): {hasStageResults: true, stageResultsKeys: Array(1), stageResultsCount: 1}
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Media relations, coverage analysis, journalist identification
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Media Landscape Mapping
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: {stageConfig: {…}, organization: {…}, organizationType: 'object', hasOrgName: true, config: {…}, …}
intelligenceOrchestratorV4.js:598 📰 Stage 3: Media Landscape Mapping
intelligenceOrchestratorV4.js:608 📊 Loading media profile from edge function for: Meta
intelligenceOrchestratorV4.js:632 ✅ Retrieved saved profile from edge function with media outlets: 0
intelligenceOrchestratorV4.js:690 ✅ Saved media stage data to Supabase
intelligenceOrchestratorV4.js:1253 ✅ Saved media Claude analysis to storage
MultiStageIntelligence.js:254 ✅ Stage 3 (media) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: false, opportunityCount: 0, …}
MultiStageIntelligence.js:299 📊 Stage 3 (media) results stored. Total stages accumulated: 3
MultiStageIntelligence.js:300 📋 Current accumulated stages: (3) ['extraction', 'competitive', 'media']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 3, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1350 🚀 RUNNING STAGE 4: Regulatory & Stakeholder Environment
MultiStageIntelligence.js:228 🔄 Starting stage 4: Regulatory & Stakeholder Environment
MultiStageIntelligence.js:377 🎯 Creating config for Stage 4 (regulatory): {hasStageResults: true, stageResultsKeys: Array(1), stageResultsCount: 1}
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Compliance requirements, analyst opinions, investor relations
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Regulatory & Stakeholder Environment
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: {stageConfig: {…}, organization: {…}, organizationType: 'object', hasOrgName: true, config: {…}, …}
intelligenceOrchestratorV4.js:708 ⚖️ Stage 4: Regulatory & Stakeholder Analysis
intelligenceOrchestratorV4.js:715 🔑 Using request_id in regulatory stage: req_1756656091701_2ms0dzr5m
intelligenceOrchestratorV4.js:726 📊 Retrieving saved stakeholders from database for: Meta
intelligenceOrchestratorV4.js:744 ✅ Retrieved saved profile with stakeholders: {regulators: 0, analysts: 0, investors: 0}
intelligenceOrchestratorV4.js:814 ✅ Saved regulatory stage data to Supabase
intelligenceOrchestratorV4.js:1253 ✅ Saved regulatory Claude analysis to storage
MultiStageIntelligence.js:254 ✅ Stage 4 (regulatory) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: false, opportunityCount: 0, …}
MultiStageIntelligence.js:299 📊 Stage 4 (regulatory) results stored. Total stages accumulated: 4
MultiStageIntelligence.js:300 📋 Current accumulated stages: (4) ['extraction', 'competitive', 'media', 'regulatory']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 4, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1350 🚀 RUNNING STAGE 5: Market Trends & Topic Analysis
MultiStageIntelligence.js:228 🔄 Starting stage 5: Market Trends & Topic Analysis
MultiStageIntelligence.js:377 🎯 Creating config for Stage 5 (trends): {hasStageResults: true, stageResultsKeys: Array(1), stageResultsCount: 1}
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Market trends, topic analysis, narrative gaps
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Market Trends & Topic Analysis
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: {stageConfig: {…}, organization: {…}, organizationType: 'object', hasOrgName: true, config: {…}, …}
intelligenceOrchestratorV4.js:831 📈 Stage 5: Market Trends & Topic Analysis
intelligenceOrchestratorV4.js:839 🔑 Using request_id in trends stage: req_1756656091701_2ms0dzr5m
intelligenceOrchestratorV4.js:850 📊 Retrieving saved topics and previous intelligence...
intelligenceOrchestratorV4.js:871 ✅ Retrieved saved profile with keywords: 1
intelligenceOrchestratorV4.js:897 ✅ Retrieved 50 recent intelligence items for trend analysis
intelligenceOrchestratorV4.js:952 ✅ Saved trends stage data to Supabase
intelligenceOrchestratorV4.js:1253 ✅ Saved trends Claude analysis to storage
MultiStageIntelligence.js:254 ✅ Stage 5 (trends) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: false, opportunityCount: 0, …}
MultiStageIntelligence.js:299 📊 Stage 5 (trends) results stored. Total stages accumulated: 5
MultiStageIntelligence.js:300 📋 Current accumulated stages: (5) ['extraction', 'competitive', 'media', 'regulatory', 'trends']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 5, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1350 🚀 RUNNING STAGE 6: Strategic Synthesis & Pattern Recognition
MultiStageIntelligence.js:228 🔄 Starting stage 6: Strategic Synthesis & Pattern Recognition
MultiStageIntelligence.js:377 🎯 Creating config for Stage 6 (synthesis): {hasStageResults: true, stageResultsKeys: Array(1), stageResultsCount: 1}
intelligenceOrchestratorV4.js:24 🚀 V4 Elaborate Analysis for Meta
intelligenceOrchestratorV4.js:25 📊 Stage focus: Pattern recognition, strategic implications, actionable recommendations
intelligenceOrchestratorV4.js:40 🎯 Running Elaborate Stage: Strategic Synthesis & Pattern Recognition
intelligenceOrchestratorV4.js:43 🔍 DEBUG runElaborateStage params: {stageConfig: {…}, organization: {…}, organizationType: 'object', hasOrgName: true, config: {…}, …}
intelligenceOrchestratorV4.js:969 🧠 Stage 6: Strategic Synthesis & Pattern Recognition
intelligenceOrchestratorV4.js:970 📊 Previous stage results structure: {hasResults: true, stageCount: 1, stages: Array(1), sampleStage: 'extraction'}
intelligenceOrchestratorV4.js:985 📊 Retrieving saved intelligence from database...
intelligenceOrchestratorV4.js:1005 ✅ Retrieved 200 saved intelligence items
intelligenceOrchestratorV4.js:1035 📊 Transformed results for synthesis: {originalKeys: Array(1), transformedKeys: Array(1), hasCompetitors: false, hasMedia: false}
intelligenceOrchestratorV4.js:1089 🔑 Using request_id for synthesis: req_1756656091701_2ms0dzr5m
intelligenceOrchestratorV4.js:1136 ✅ Synthesis Stage 5 response received: {success: true, hasData: true, dataKeys: Array(1)}
intelligenceOrchestratorV4.js:1199 🚀 SYNTHESIS RETURN DATA: {hasAnalysis: true, analysisKeys: Array(1), hasTabs: true, tabCount: 7, hasPatterns: true, …}
intelligenceOrchestratorV4.js:1224 ✅ Saved synthesis stage data to Supabase
MultiStageIntelligence.js:254 ✅ Stage 6 (synthesis) completed with: {hasData: true, hasTabs: true, hasAnalysis: true, hasOpportunities: true, opportunityCount: 0, …}
MultiStageIntelligence.js:268 🎯 SYNTHESIS STAGE OPPORTUNITIES CHECK: {directOpportunities: Array(0), consolidatedPath: undefined, analysisPath: undefined, totalFound: 0}
MultiStageIntelligence.js:299 📊 Stage 6 (synthesis) results stored. Total stages accumulated: 6
MultiStageIntelligence.js:300 📋 Current accumulated stages: (6) ['extraction', 'competitive', 'media', 'regulatory', 'trends', 'synthesis']
MultiStageIntelligence.js:301 🔍 Stage data has: {hasData: true, hasAnalysis: true, hasTabs: true}
MultiStageIntelligence.js:1313 🎯 ELABORATE PIPELINE - Stage trigger check: {hasOrganization: true, hasStarted: true, currentStage: 6, totalStages: 6, hasError: false, …}
MultiStageIntelligence.js:1354 🎉 All stages done, completing pipeline...
MultiStageIntelligence.js:407 🎉 ELABORATE PIPELINE COMPLETE in 223 seconds
MultiStageIntelligence.js:408 📊 Final stage results: (6) ['extraction', 'competitive', 'media', 'regulatory', 'trends', 'synthesis']
MultiStageIntelligence.js:439 🔄 ELABORATE SYNTHESIS: Combining insights from all stages...
MultiStageIntelligence.js:440 📊 Stage results structure: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
MultiStageIntelligence.js:467 📈 Extracted data from stages: (6) ['extraction', 'competitive', 'media', 'regulatory', 'trends', 'synthesis']
MultiStageIntelligence.js:474 🧠 SYNTHESIS STAGE CONTENT: {hasSynthesis: true, synthesisKeys: Array(10), hasData: true, dataKeys: Array(1), hasAnalysis: true, …}
MultiStageIntelligence.js:699 🔍 EXTRACTING OPPORTUNITIES FROM STAGES: {stageCount: 6, stages: Array(6)}
MultiStageIntelligence.js:705 📋 Checking stage 'extraction' for opportunities: {hasDirectOps: false, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:705 📋 Checking stage 'competitive' for opportunities: {hasDirectOps: false, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:705 📋 Checking stage 'media' for opportunities: {hasDirectOps: false, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:705 📋 Checking stage 'regulatory' for opportunities: {hasDirectOps: false, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:705 📋 Checking stage 'trends' for opportunities: {hasDirectOps: false, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:705 📋 Checking stage 'synthesis' for opportunities: {hasDirectOps: true, directCount: 0, hasDataField: true, hasConsolidatedInData: false, consolidatedInDataCount: 0, …}
MultiStageIntelligence.js:752 📊 FINAL OPPORTUNITY EXTRACTION: {totalOpportunities: 0, opportunitiesList: Array(0), sources: Array(0)}
RailwayV2Enhanced.js:83 🎯 Intelligence complete: {success: true, analysis: {…}, tabs: {…}, opportunities: Array(0), stageInsights: {…}, …}
MultiStageIntelligence.js:1305 ✅ Pipeline complete or no organization
