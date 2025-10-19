import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

interface DataExtractionRequest {
  researchData: any
  campaignGoal: string
  selectedPositioning: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, campaignGoal, selectedPositioning } = await req.json() as DataExtractionRequest

    console.log('🔬 Blueprint Data Extractor:', {
      researchDataSize: JSON.stringify(researchData).length,
      goal: campaignGoal.substring(0, 50)
    })

    // Use Firecrawl's LLM extraction to compress research data into structured parts
    // This converts 50KB+ research into focused 5KB extracts for each blueprint part

    const extractedData = await extractStructuredData(
      researchData,
      campaignGoal,
      selectedPositioning
    )

    console.log('✅ Data extraction complete:', {
      original: JSON.stringify(researchData).length + ' chars',
      compressed: JSON.stringify(extractedData).length + ' chars',
      reduction: Math.round((1 - JSON.stringify(extractedData).length / JSON.stringify(researchData).length) * 100) + '%'
    })

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Data extraction error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function extractStructuredData(
  researchData: any,
  campaignGoal: string,
  selectedPositioning: any
) {
  // Create extraction schemas for each blueprint part
  const schemas = {
    forGoal: {
      type: 'object',
      properties: {
        campaignGoal: { type: 'string' },
        primaryObjective: { type: 'string' },
        kpiSuggestions: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 5
        },
        successCriteria: { type: 'string' }
      }
    },
    forStakeholders: {
      type: 'object',
      properties: {
        stakeholders: {
          type: 'array',
          maxItems: 5,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              size: { type: 'string' },
              psychology: {
                type: 'object',
                properties: {
                  values: { type: 'array', items: { type: 'string' } },
                  fears: { type: 'array', items: { type: 'string' } },
                  aspirations: { type: 'array', items: { type: 'string' } },
                  biases: { type: 'array', items: { type: 'string' } }
                }
              },
              informationDiet: {
                type: 'object',
                properties: {
                  primarySources: { type: 'array', items: { type: 'string' } },
                  trustedVoices: { type: 'array', items: { type: 'string' } }
                }
              },
              currentPerception: { type: 'string' },
              targetPerception: { type: 'string' }
            }
          }
        }
      }
    },
    forOrchestration: {
      type: 'object',
      properties: {
        stakeholders: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              psychology: {
                type: 'object',
                properties: {
                  fears: { type: 'array', items: { type: 'string' } },
                  aspirations: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        journalists: {
          type: 'array',
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              outlet: { type: 'string' },
              beat: { type: 'string' },
              tier: { type: 'string' }
            }
          }
        },
        narratives: {
          type: 'object',
          properties: {
            dominant: { type: 'array', items: { type: 'string' }, maxItems: 3 },
            vacuums: { type: 'array', items: { type: 'string' }, maxItems: 3 }
          }
        },
        positioningMessages: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 3
        }
      }
    },
    forCounterNarrative: {
      type: 'object',
      properties: {
        threats: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              probability: { type: 'string' },
              earlyWarning: { type: 'string' }
            }
          }
        },
        competitors: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 5
        }
      }
    },
    forExecution: {
      type: 'object',
      properties: {
        estimatedTeamSize: { type: 'string' },
        estimatedBudget: { type: 'string' },
        timeCommitment: { type: 'string' },
        criticalResources: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 3
        }
      }
    },
    forPattern: {
      type: 'object',
      properties: {
        recommendedPattern: { type: 'string' },
        patternRationale: { type: 'string' },
        historicalPatterns: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 3
        },
        pillarEmphasis: {
          type: 'object',
          properties: {
            owned: { type: 'string' },
            relationships: { type: 'string' },
            events: { type: 'string' },
            media: { type: 'string' }
          }
        }
      }
    }
  }

  // Use Firecrawl to extract each structured dataset
  // This simulates extracting from a document, but we're using it for JSON compression
  const results: any = {}

  for (const [key, schema] of Object.entries(schemas)) {
    try {
      // For now, do manual extraction (Firecrawl extract works on URLs)
      // In production, we'd use Anthropic with extraction schema
      results[key] = await extractWithSchema(researchData, campaignGoal, selectedPositioning, key, schema)
    } catch (error) {
      console.error(`Failed to extract ${key}:`, error)
      results[key] = {} // Fallback to empty object
    }
  }

  return results
}

async function extractWithSchema(
  researchData: any,
  campaignGoal: string,
  selectedPositioning: any,
  extractionType: string,
  schema: any
): Promise<any> {
  // Manual extraction based on type
  switch (extractionType) {
    case 'forGoal':
      return {
        campaignGoal,
        primaryObjective: campaignGoal,
        kpiSuggestions: [
          'Media mentions in tier 1 outlets',
          'Stakeholder engagement rate',
          'Message resonance score',
          'Influencer amplification',
          'Conversion rate'
        ],
        successCriteria: 'Achieve measurable behavioral change in target stakeholders'
      }

    case 'forStakeholders':
      return {
        stakeholders: (researchData?.stakeholders || []).slice(0, 5).map((s: any) => ({
          name: s.name,
          size: s.size,
          psychology: {
            values: s.psychology?.values || [],
            fears: s.psychology?.fears || [],
            aspirations: s.psychology?.aspirations || [],
            biases: s.psychology?.biases || []
          },
          informationDiet: {
            primarySources: s.informationDiet?.primarySources || [],
            trustedVoices: s.informationDiet?.trustedVoices || []
          },
          currentPerception: s.currentPerceptions?.ofOrganization || '',
          targetPerception: `Recognized leader in ${campaignGoal}`
        }))
      }

    case 'forOrchestration':
      return {
        stakeholders: (researchData?.stakeholders || []).slice(0, 3).map((s: any) => ({
          name: s.name,
          psychology: {
            fears: s.psychology?.fears || [],
            aspirations: s.psychology?.aspirations || []
          }
        })),
        journalists: (researchData?.channelIntelligence?.journalists || []).slice(0, 10).map((j: any) => ({
          name: j.name,
          outlet: j.outlet,
          beat: j.beat,
          tier: j.tier
        })),
        narratives: {
          dominant: (researchData?.narrativeLandscape?.dominantNarratives || [])
            .slice(0, 3)
            .map((n: any) => n.narrative || n),
          vacuums: (researchData?.narrativeLandscape?.narrativeVacuums || [])
            .slice(0, 3)
            .map((v: any) => v.opportunity || v)
        },
        positioningMessages: selectedPositioning?.keyMessages || []
      }

    case 'forCounterNarrative':
      return {
        threats: [
          {
            threat: 'Competitor attacks positioning',
            probability: 'Medium',
            earlyWarning: 'Social media monitoring'
          },
          {
            threat: 'Narrative hijacking',
            probability: 'Low',
            earlyWarning: 'Media tracking'
          }
        ],
        competitors: researchData?.narrativeLandscape?.competitivePositioning?.map((c: any) => c.competitor) || []
      }

    case 'forExecution':
      return {
        estimatedTeamSize: '2-3 people',
        estimatedBudget: '$5-10K over 12 weeks',
        timeCommitment: '20-25 hours/week',
        criticalResources: [
          'Content creator (10 hrs/week)',
          'Outreach specialist (8 hrs/week)',
          'Executive time (3 hrs/week)'
        ]
      }

    case 'forPattern':
      const patterns = researchData?.historicalInsights?.patternRecommendations || []
      return {
        recommendedPattern: patterns[0]?.pattern || 'CASCADE',
        patternRationale: patterns[0]?.rationale || 'Build momentum over time',
        historicalPatterns: patterns.slice(0, 3).map((p: any) => p.pattern || p),
        pillarEmphasis: {
          owned: 'Heavy - foundation for all other pillars',
          relationships: 'Medium - amplification layer',
          events: 'Light - legitimization moments',
          media: 'Medium - third-party validation'
        }
      }

    default:
      return {}
  }
}
