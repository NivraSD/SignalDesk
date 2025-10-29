import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

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
2. Extract 3-5 key stakeholder profiles (use stakeholderResearch)
3. Identify dominant narratives and vacuums (use narrativeResearch)
4. Map channels to stakeholders (use channelResearch + stakeholderResearch)
5. **CRITICALLY IMPORTANT**: Extract ALL journalist names, outlets, beats, and tiers from channelResearch.journalists[] array and put them in channelIntelligence.journalists[]
6. Infer publications list from the journalist outlets (both tier1 AND tier2 - include trade/industry publications)
7. Extract actionable patterns (use historicalResearch)
8. Create 5-10 key insights that synthesize findings across all categories
9. Rate synthesis quality honestly (completeness, confidence, gaps)

Return ONLY the JSON object. No markdown, no explanation, just pure JSON.`;

    // Build the user prompt with ALL research data
    const userPrompt = `Campaign Goal: ${campaignGoal}
Organization: ${organizationContext.name || 'Unknown'}
Industry: ${organizationContext.industry || 'General'}
${refinementRequest ? `Refinement: ${refinementRequest}` : ''}

===== ORGANIZATION PROFILE =====
${JSON.stringify(compiledResearch?.discovery?.profile, null, 2)}

===== STAKEHOLDER RESEARCH =====
${JSON.stringify(stakeholderResearch, null, 2)}

===== NARRATIVE RESEARCH =====
${JSON.stringify(narrativeResearch, null, 2)}

===== CHANNEL RESEARCH =====
${JSON.stringify(channelResearch, null, 2)}

===== HISTORICAL RESEARCH =====
${JSON.stringify(historicalResearch, null, 2)}

===== SYNTHESIS TASK =====
Synthesize ALL of the above research into a complete CampaignIntelligenceBrief with the exact JSON structure specified in the system prompt.

Focus on creating actionable, detailed intelligence that will enable:
1. Strategic positioning decisions (Stage 3)
2. VECTOR campaign blueprint creation (Stage 5)

Return ONLY the JSON object.`;

    console.log('🤖 Calling Claude for final synthesis...');
    console.log(`📏 System prompt size: ${systemPrompt.length} chars`);
    console.log(`📏 User prompt size: ${userPrompt.length} chars`);
    console.log(`📏 Total prompt size: ${systemPrompt.length + userPrompt.length} chars`);

    // Call Claude for synthesis with timeout and error handling
    const claudeRequestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 32000,  // Increased for comprehensive synthesis with all research data
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    };

    console.log(`🚀 Sending request to Claude API...`);

    // Add timeout to prevent hanging (5 minutes for large research synthesis with extensive data)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes instead of 2

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(claudeRequestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`📨 Received response from Claude API: ${response.status}`);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Claude API request timed out after 5 minutes');
        throw new Error('Claude API request timed out after 5 minutes - research payload may be too large or Claude is overloaded');
      }
      console.error('❌ Fetch error calling Claude API:', fetchError);
      throw new Error(`Failed to call Claude API: ${fetchError.message}`);
    }

    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text();
      } catch (e) {
        errorBody = `Failed to read error body: ${e.message}`;
      }
      console.error(`❌ Claude API returned error ${response.status}:`, errorBody);
      throw new Error(`Claude API error: ${response.status} - ${errorBody.substring(0, 500)}`);
    }

    console.log('📦 Parsing Claude response...');
    let claudeResponse;
    try {
      const responseText = await response.text();
      console.log(`📏 Raw response size: ${responseText.length} bytes`);
      claudeResponse = JSON.parse(responseText);
      console.log(`✅ Claude response parsed successfully`);
    } catch (jsonError: any) {
      console.error('❌ Failed to parse Claude response as JSON:', jsonError);
      throw new Error(`Failed to parse Claude response: ${jsonError.message}`);
    }

    // Check for usage info
    if (claudeResponse.usage) {
      console.log(`📊 Token usage:`, JSON.stringify(claudeResponse.usage));
    }

    const textContent = claudeResponse.content?.find((c: any) => c.type === 'text');

    if (!textContent) {
      console.error('❌ No text content in Claude response');
      console.error('Response structure:', JSON.stringify(claudeResponse, null, 2).substring(0, 1000));
      throw new Error('No text content in Claude response');
    }

    console.log(`📝 Claude returned ${textContent.text.length} characters`);

    // Parse the synthesized CampaignIntelligenceBrief
    let campaignIntelligenceBrief;
    try {
      let cleanedText = textContent.text;

      // Remove markdown code fences - try multiple patterns
      // First, remove leading `json\n or ```json\n
      if (cleanedText.startsWith('```json\n')) {
        cleanedText = cleanedText.substring(8); // Remove ```json\n
      } else if (cleanedText.startsWith('`json\n')) {
        cleanedText = cleanedText.substring(6); // Remove `json\n
      } else if (cleanedText.startsWith('```\n')) {
        cleanedText = cleanedText.substring(4); // Remove ```\n
      }

      // Remove trailing backticks
      cleanedText = cleanedText.replace(/\n```$/g, '').replace(/`+$/g, '').trim();

      // Try to parse the cleaned response as JSON
      campaignIntelligenceBrief = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse Claude synthesis response as JSON');
      console.error('Parse error:', e.message);
      console.error('Raw response (first 1000 chars):', textContent.text.substring(0, 1000));
      console.error('Response length:', textContent.text.length);

      // Try more aggressive JSON extraction - find the outermost JSON object
      try {
        // Look for any JSON object in the response
        let testText = textContent.text;
        // Remove all markdown formatting
        testText = testText.replace(/```[a-z]*\n?/g, '').replace(/`+/g, '').trim();

        const jsonStart = testText.indexOf('{');
        const jsonEnd = testText.lastIndexOf('}') + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const extracted = testText.substring(jsonStart, jsonEnd);
          campaignIntelligenceBrief = JSON.parse(extracted);
          console.log('✅ Extracted JSON from position', jsonStart, 'to', jsonEnd);
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (extractError) {
        console.error('Even aggressive extraction failed:', extractError);
        throw new Error(`Failed to parse synthesis response as JSON. Response starts with: ${textContent.text.substring(0, 200)}`);
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
