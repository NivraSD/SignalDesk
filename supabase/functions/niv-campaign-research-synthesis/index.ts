import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callAI(prompt: string, opts: { maxTokens?: number, temperature?: number, systemPrompt?: string, timeoutMs?: number } = {}): Promise<string> {
  const { maxTokens = 4000, temperature = 0.3, systemPrompt, timeoutMs = 45000 } = opts;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (GEMINI_API_KEY) {
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          temperature,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Claude error: ${res.status}`);
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }

    throw new Error('No AI API key configured');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Campaign Research Synthesis - Final Synthesis Function
 *
 * Receives ALL collected research from the 4 sequential stages:
 * - Stakeholder Intelligence
 * - Narrative Landscape
 * - Channel Intelligence
 * - Historical Patterns
 *
 * Uses Claude to synthesize everything into a properly structured
 * CampaignIntelligenceBrief that matches the VECTOR spec exactly.
 */

serve(withCors(async (req) => {
  try {
    console.log('🧪 Campaign Research Synthesis - Final Synthesis');

    // Check if request has body
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    // Clone request to read body for logging
    const bodyText = await req.text();
    console.log('Raw body length:', bodyText.length);
    console.log('Raw body preview:', bodyText.substring(0, 200));

    if (!bodyText || bodyText.length === 0) {
      throw new Error('Empty request body received');
    }

    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Body that failed to parse:', bodyText);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    const {
      compiledResearch,
      campaignGoal,
      organizationContext,
      refinementRequest
    } = requestData;

    // Support both old format (4 separate research objects) and new format (compiled)
    const stakeholderResearch = compiledResearch?.stakeholder || requestData.stakeholderResearch
    const narrativeResearch = compiledResearch?.narrative || requestData.narrativeResearch
    const channelResearch = compiledResearch?.channel || requestData.channelResearch
    const historicalResearch = compiledResearch?.historical || requestData.historicalResearch
    const metadata = compiledResearch?.metadata || requestData.metadata

    console.log(`📦 Received research from ${metadata?.totalToolCalls || 'N/A'} tool calls`);
    console.log(`⏱️  Research collection took ${metadata?.researchTime || 'N/A'}ms`);

    // Log research data sizes
    console.log(`📊 Research data sizes:`);
    console.log(`  - Stakeholder: ${stakeholderResearch?.results?.length || 0} results`);
    console.log(`  - Narrative: ${narrativeResearch?.results?.length || 0} results`);
    console.log(`  - Channel: ${channelResearch?.journalists?.length || 0} journalists`);
    console.log(`  - Historical: ${historicalResearch?.results?.length || 0} results`);

    const startTime = Date.now();

    // ==================== PRE-SUMMARIZATION STEP ====================
    // Summarize each research section separately to reduce final payload size
    console.log('📝 Pre-summarizing research sections to reduce payload size...');

    const summarizeResearchSection = async (sectionName: string, sectionData: any, focus: string) => {
      if (!sectionData || (!sectionData.results && !sectionData.journalists)) {
        return `No ${sectionName} data available.`;
      }

      const summarizationPrompt = `Summarize the following ${sectionName} research data concisely (max 400 words).

Focus on: ${focus}

Research Data:
${JSON.stringify(sectionData, null, 2)}

Provide a clear, structured summary that captures:
- Key findings and patterns
- Most important entities, names, and data points
- Critical insights relevant to campaign planning

Be concise but preserve all important specific details (names, numbers, outlets, etc.).`;

      try {
        return await callAI(summarizationPrompt, { maxTokens: 1000, temperature: 0.3 });
      } catch (error) {
        console.error(`Error summarizing ${sectionName}:`, error);
        return `Summary unavailable for ${sectionName}`;
      }
    };

    // Summarize each section in parallel
    // NOTE: Stakeholder research is skipped - stakeholders are inferred during synthesis
    const [narrativeSummary, channelSummary, historicalSummary] = await Promise.all([
      summarizeResearchSection('Narrative', narrativeResearch, 'dominant narratives, narrative vacuums, and messaging opportunities'),
      summarizeResearchSection('Channel', channelResearch, 'journalists (names, outlets, beats, tiers), publications, and media landscape'),
      summarizeResearchSection('Historical', historicalResearch, 'patterns, trends, successful tactics, and timing insights')
    ]);

    console.log('✅ Pre-summarization complete');
    console.log(`📏 Summary sizes - Narrative: ${narrativeSummary.length}, Channel: ${channelSummary.length}, Historical: ${historicalSummary.length}`);

    // ==================== BUILD FINAL SYNTHESIS PROMPT ====================

    // Build the system prompt with exact JSON schema
    const systemPrompt = `You are synthesizing campaign research into a CampaignIntelligenceBrief for a VECTOR campaign.

You have been provided with research from 4 sequential stages. Your job is to synthesize ALL of it into a single, comprehensive, properly structured JSON object.

The CampaignIntelligenceBrief MUST have this EXACT structure:

{
  "stakeholders": [
    {
      "name": "string",
      "size": number,
      "psychology": {
        "values": ["string"],
        "fears": ["string"],
        "aspirations": ["string"],
        "biases": ["string"]
      },
      "informationDiet": {
        "primarySources": ["string"],
        "trustedVoices": ["string"],
        "consumptionPatterns": "string",
        "shareDrivers": ["string"]
      },
      "currentPerceptions": {
        "ofOrganization": "string",
        "ofIndustry": "string",
        "ofTopic": "string"
      },
      "decisionJourney": {
        "currentStage": "string",
        "movementTriggers": ["string"],
        "validationNeeds": ["string"],
        "socialProofRequirements": ["string"]
      },
      "influencePathways": {
        "directInfluencers": ["string"],
        "peerNetworks": ["string"],
        "authorityFigures": ["string"]
      },
      "decisionTriggers": ["string"],
      "objectionPatterns": ["string"]
    }
  ],
  "narrativeLandscape": {
    "dominantNarratives": [
      {
        "narrative": "string",
        "source": "string",
        "resonance": "string"
      }
    ],
    "narrativeVacuums": [
      {
        "opportunity": "string",
        "rationale": "string",
        "potential": "string"
      }
    ],
    "competitivePositioning": [
      {
        "competitor": "string",
        "positioning": "string",
        "strengths": ["string"],
        "vulnerabilities": ["string"]
      }
    ],
    "culturalContext": "string"
  },
  "channelIntelligence": {
    "byStakeholder": [
      {
        "stakeholder": "string",
        "channels": [
          {
            "name": "string",
            "type": "string",
            "trustLevel": "high" | "medium" | "low",
            "reach": "string",
            "engagement": "string"
          }
        ],
        "optimalTiming": "string",
        "contentPreferences": ["string"],
        "amplificationOpportunities": ["string"]
      }
    ],
    "journalists": [
      {
        "name": "string",
        "outlet": "string",
        "beat": "string",
        "tier": "tier1" | "tier2",
        "relevance": "string"
      }
    ],
    "publications": [
      {
        "name": "string",
        "type": "string",
        "audience": "string",
        "trustLevel": "string"
      }
    ]
  },
  "historicalInsights": {
    "successfulCampaigns": [
      {
        "campaign": "string",
        "context": "string",
        "approach": "string",
        "results": "string",
        "keyLessons": ["string"]
      }
    ],
    "successFactors": [
      {
        "factor": "string",
        "why": "string",
        "application": "string"
      }
    ],
    "patternRecommendations": [
      {
        "pattern": "string",
        "rationale": "string",
        "implementation": "string"
      }
    ],
    "riskFactors": [
      {
        "risk": "string",
        "context": "string",
        "mitigation": "string"
      }
    ]
  },
  "keyInsights": [
    {
      "insight": "string",
      "category": "stakeholder" | "narrative" | "channel" | "historical",
      "significance": "critical" | "high" | "medium",
      "actionImplication": "string"
    }
  ],
  "synthesisQuality": {
    "completeness": number,
    "confidence": number,
    "dataGaps": ["string"],
    "recommendedAdditionalResearch": ["string"]
  }
}

IMPORTANT SYNTHESIS GUIDELINES:
1. Merge insights from all 4 research stages into the proper structure
2. **STAKEHOLDER INFERENCE**: Since stakeholder web research is not provided, INFER 3-5 key stakeholder profiles based on:
   - Organization profile (industry, description, existing relationships)
   - Campaign goal (who needs to be influenced to achieve this?)
   - Industry norms (typical B2B/B2C audiences for this sector)
   - Use your knowledge of the organization and industry to build realistic persona profiles
3. Identify dominant narratives and vacuums (use narrativeResearch)
4. Map channels to stakeholders (use channelResearch + inferred stakeholders)
5. **CRITICALLY IMPORTANT**: Extract ALL journalist names, outlets, beats, and tiers from channelResearch.journalists[] array and put them in channelIntelligence.journalists[]
6. Infer publications list from the journalist outlets (both tier1 AND tier2 - include trade/industry publications)
7. Extract actionable patterns (use historicalResearch)
8. Create 5-10 key insights that synthesize findings across all categories
   - **GROUND INSIGHTS IN THE CAMPAIGN GOAL** - insights must relate to the specific campaign objective, not generic industry trends
   - **USE ONLY RESEARCH DATA** - do not make assumptions about "AI transformation", "technology trends", or "industry disruption" unless explicitly found in the research
   - **BE SPECIFIC** - avoid generic statements like "leverage technology angle" or "position as innovative leader" unless the research explicitly supports this
   - **FOCUS ON DISCOVERY** - what did we actually learn? What gaps exist? What opportunities are present in THIS campaign context?
9. Rate synthesis quality honestly (completeness, confidence, gaps)
   - NOTE: Stakeholder profiles being inferred (not researched) is NORMAL and does not constitute a data gap

Return ONLY the JSON object. No markdown, no explanation, just pure JSON.`;

    // Build the user prompt with SUMMARIZED research data (much smaller payload)
    const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${organizationContext.name || 'Unknown'}
Industry: ${organizationContext.industry || 'General'}
${refinementRequest ? `Refinement: ${refinementRequest}` : ''}

===== ORGANIZATION PROFILE =====
${JSON.stringify(compiledResearch?.discovery?.profile, null, 2)}

===== STAKEHOLDER PROFILES (INFER FROM ORG PROFILE + CAMPAIGN GOAL) =====
Infer 3-5 key stakeholder profiles based on:
- Who needs to be influenced to achieve the campaign goal
- Typical audiences for this organization and industry
- Decision-makers, influencers, and end-users relevant to this campaign

NOTE: Stakeholder research data is intentionally not provided - infer from context.

===== NARRATIVE RESEARCH SUMMARY =====
${narrativeSummary}

===== CHANNEL RESEARCH SUMMARY =====
${channelSummary}

===== HISTORICAL RESEARCH SUMMARY =====
${historicalSummary}

===== SYNTHESIS TASK =====
Synthesize ALL of the above pre-summarized research into a complete CampaignIntelligenceBrief with the exact JSON structure specified in the system prompt.

The summaries above were created from extensive raw research data and contain all the key insights, specific names, numbers, and patterns.

Focus on creating actionable, detailed intelligence that will enable:
1. Strategic positioning decisions (Stage 3)
2. VECTOR campaign blueprint creation (Stage 5)

Return ONLY the JSON object.`;

    console.log('🤖 Calling AI for final synthesis...');
    console.log(`📏 System prompt size: ${systemPrompt.length} chars`);
    console.log(`📏 User prompt size: ${userPrompt.length} chars`);

    const rawText = await callAI(userPrompt, {
      systemPrompt,
      maxTokens: 16000,
      temperature: 0.3,
      timeoutMs: 180000
    });

    console.log(`📝 AI returned ${rawText.length} characters`);

    // Parse the synthesized CampaignIntelligenceBrief
    let campaignIntelligenceBrief;
    try {
      let cleanedText = rawText.trim();
      // Remove markdown code fences
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
      campaignIntelligenceBrief = JSON.parse(cleanedText);
    } catch (e) {
      // Try aggressive JSON extraction
      try {
        let testText = rawText.replace(/```[a-z]*\n?/g, '').replace(/`+/g, '').trim();
        const jsonStart = testText.indexOf('{');
        const jsonEnd = testText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          campaignIntelligenceBrief = JSON.parse(testText.substring(jsonStart, jsonEnd));
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (extractError) {
        throw new Error(`Failed to parse synthesis response as JSON. Response starts with: ${rawText.substring(0, 200)}`);
      }
    }

    // Validate structure (basic checks)
    if (!campaignIntelligenceBrief.stakeholders || !Array.isArray(campaignIntelligenceBrief.stakeholders)) {
      console.warn('⚠️  Missing or invalid stakeholders array in synthesis');
    }
    if (!campaignIntelligenceBrief.narrativeLandscape) {
      console.warn('⚠️  Missing narrativeLandscape in synthesis');
    }
    if (!campaignIntelligenceBrief.channelIntelligence) {
      console.warn('⚠️  Missing channelIntelligence in synthesis');
    }
    if (!campaignIntelligenceBrief.historicalInsights) {
      console.warn('⚠️  Missing historicalInsights in synthesis');
    }

    const synthesisTime = Date.now() - startTime;
    console.log(`✅ Synthesis complete in ${synthesisTime}ms`);
    console.log(`📊 Synthesized ${campaignIntelligenceBrief.stakeholders?.length || 0} stakeholder profiles`);
    console.log(`📰 Identified ${campaignIntelligenceBrief.narrativeLandscape?.narrativeVacuums?.length || 0} narrative opportunities`);
    console.log(`💡 Generated ${campaignIntelligenceBrief.keyInsights?.length || 0} key insights`);

    return jsonResponse({
      success: true,
      campaignIntelligenceBrief,
      synthesisTime,
      service: 'Campaign Research Synthesis',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Synthesis error:', error);
    return errorResponse(
      error.message || 'Synthesis failed',
      500
    );
  }
}));
