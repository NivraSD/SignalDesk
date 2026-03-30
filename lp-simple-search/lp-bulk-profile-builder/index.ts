import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders, jsonResponse, errorResponse, handleCors } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// All entities from the BatchEntityBuilder categorized list
const ENTITY_DATABASE: Record<string, Record<string, string[]>> = {
  us_government: {
    executive_branch: ['White House', 'State Department', 'Defense Department', 'Treasury Department', 'Justice Department', 'Commerce Department', 'EPA', 'FDA', 'FTC', 'SEC'],
    key_regulators: ['SEC', 'FTC', 'FDA', 'EPA', 'FCC', 'CFPB', 'OSHA', 'NHTSA', 'FAA', 'CFTC'],
    intelligence: ['CIA', 'NSA', 'FBI', 'DHS', 'DNI']
  },
  technology: {
    big_tech: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'NVIDIA', 'Tesla', 'Oracle', 'IBM', 'Salesforce'],
    ai_companies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'xAI', 'Mistral AI', 'Cohere', 'Stability AI', 'Inflection AI', 'Hugging Face', 'Runway'],
    cybersecurity: ['Palo Alto Networks', 'CrowdStrike', 'Fortinet', 'Zscaler', 'SentinelOne', 'Cloudflare', 'Okta', 'CyberArk'],
    enterprise_saas: ['Salesforce', 'ServiceNow', 'Workday', 'Adobe', 'Atlassian', 'Snowflake', 'Datadog', 'MongoDB'],
    fintech: ['Stripe', 'Square', 'PayPal', 'Adyen', 'Klarna', 'Plaid', 'Affirm', 'Coinbase'],
    cloud: ['AWS', 'Microsoft Azure', 'Google Cloud', 'Alibaba Cloud', 'Oracle Cloud'],
    semiconductors: ['NVIDIA', 'Intel', 'AMD', 'Qualcomm', 'Broadcom', 'TSMC', 'ASML', 'Applied Materials']
  },
  finance: {
    major_banks: ['JPMorgan Chase', 'Bank of America', 'Goldman Sachs', 'Morgan Stanley', 'Citigroup', 'Wells Fargo'],
    asset_managers: ['BlackRock', 'Vanguard', 'Fidelity', 'State Street', 'PIMCO', 'T. Rowe Price'],
    venture_capital: ['Sequoia Capital', 'Andreessen Horowitz', 'Kleiner Perkins', 'Accel', 'Benchmark', 'Greylock'],
    private_equity: ['KKR', 'Blackstone', 'Carlyle Group', 'Apollo', 'TPG', 'Bain Capital']
  },
  healthcare: {
    pharma: ['Pfizer', 'Johnson & Johnson', 'Merck', 'AbbVie', 'Eli Lilly', 'Novartis', 'Roche', 'Bristol-Myers Squibb'],
    biotech: ['Moderna', 'Regeneron', 'Gilead', 'Amgen', 'Biogen', 'Vertex', 'Illumina'],
    health_insurance: ['UnitedHealth', 'Anthem', 'Cigna', 'Humana', 'Aetna', 'Kaiser Permanente'],
    healthtech: ['Epic Systems', 'Cerner', 'Teladoc', 'Veeva Systems', 'IQVIA']
  },
  energy: {
    oil_majors: ['ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies', 'ConocoPhillips'],
    renewables: ['NextEra Energy', 'First Solar', 'Enphase', 'SunPower', 'Vestas', 'Ørsted'],
    utilities: ['Duke Energy', 'Southern Company', 'Dominion Energy', 'Exelon', 'PG&E']
  },
  media_outlets: {
    mainstream: ['New York Times', 'Wall Street Journal', 'Washington Post', 'Bloomberg', 'Reuters', 'Associated Press'],
    tech_focused: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'The Information', 'Protocol'],
    business: ['Financial Times', 'Forbes', 'Fortune', 'CNBC', 'The Economist', 'Business Insider']
  },
  think_tanks: {
    tech_policy: ['Brookings Institution', 'RAND Corporation', 'CSIS', 'New America', 'Aspen Institute'],
    economic: ['Peterson Institute', 'American Enterprise Institute', 'Cato Institute', 'Heritage Foundation'],
    foreign_policy: ['Council on Foreign Relations', 'Carnegie Endowment', 'CNAS', 'Hudson Institute']
  },
  advocacy: {
    tech_accountability: ['Electronic Frontier Foundation', 'ACLU', 'Access Now', 'Fight for the Future'],
    environmental: ['Sierra Club', 'Greenpeace', 'Environmental Defense Fund', 'NRDC', 'World Wildlife Fund'],
    consumer: ['Consumer Reports', 'Public Citizen', 'Consumer Federation of America']
  }
}

interface BuildResult {
  entity: string
  success: boolean
  error?: string
  cached?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCors()

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
    const body = await req.json().catch(() => ({}))

    const {
      organization_id,
      categories,        // Optional: specific categories to build ['technology', 'finance']
      subcategories,     // Optional: specific subcategories ['big_tech', 'ai_companies']
      entities,          // Optional: specific entity names to build
      force_refresh = false,
      batch_size = 3,
      dry_run = false    // If true, just return what would be built
    } = body

    if (!organization_id) {
      return errorResponse('organization_id is required', 400)
    }

    // Collect entities to build
    let entitiesToBuild: string[] = []

    if (entities && entities.length > 0) {
      // Use provided list
      entitiesToBuild = entities
    } else if (categories && categories.length > 0) {
      // Build from specific categories
      for (const category of categories) {
        const categoryData = ENTITY_DATABASE[category]
        if (categoryData) {
          if (subcategories && subcategories.length > 0) {
            // Only specific subcategories
            for (const sub of subcategories) {
              if (categoryData[sub]) {
                entitiesToBuild.push(...categoryData[sub])
              }
            }
          } else {
            // All subcategories in this category
            for (const subEntities of Object.values(categoryData)) {
              entitiesToBuild.push(...subEntities)
            }
          }
        }
      }
    } else {
      // Build ALL entities
      for (const categoryData of Object.values(ENTITY_DATABASE)) {
        for (const subEntities of Object.values(categoryData)) {
          entitiesToBuild.push(...subEntities)
        }
      }
    }

    // Dedupe
    entitiesToBuild = [...new Set(entitiesToBuild)]

    // Check which entities already have valid (non-expired) profiles
    if (!force_refresh) {
      const { data: existingProfiles } = await supabase
        .from('lp_entity_profiles')
        .select('entity_name')
        .eq('organization_id', organization_id)
        .gt('expires_at', new Date().toISOString())

      const existingNames = new Set(existingProfiles?.map(p => p.entity_name) || [])
      entitiesToBuild = entitiesToBuild.filter(e => !existingNames.has(e))
    }

    // Dry run - just return what would be built
    if (dry_run) {
      return jsonResponse({
        dry_run: true,
        total_entities: entitiesToBuild.length,
        entities: entitiesToBuild,
        estimated_time_seconds: entitiesToBuild.length * 15 // ~15s per entity
      })
    }

    if (entitiesToBuild.length === 0) {
      return jsonResponse({
        success: true,
        message: 'All entities already have valid profiles',
        built: 0,
        skipped: 0
      })
    }

    // Build profiles in batches
    const results: BuildResult[] = []
    const startTime = Date.now()

    for (let i = 0; i < entitiesToBuild.length; i += batch_size) {
      const batch = entitiesToBuild.slice(i, i + batch_size)

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (entityName) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/entity-context-manager`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_KEY}`
              },
              body: JSON.stringify({
                name: entityName,
                entity_type: 'company',
                organization_id,
                force_refresh
              })
            })

            if (!response.ok) {
              const error = await response.text()
              return { entity: entityName, success: false, error: error.substring(0, 200) }
            }

            const result = await response.json()
            return {
              entity: entityName,
              success: true,
              cached: result.metadata?.cached || false
            }
          } catch (err) {
            return {
              entity: entityName,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          }
        })
      )

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({ entity: 'unknown', success: false, error: result.reason })
        }
      }

      // Rate limit pause between batches (except last batch)
      if (i + batch_size < entitiesToBuild.length) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)
    const totalTime = Date.now() - startTime

    return jsonResponse({
      success: true,
      summary: {
        total_processed: results.length,
        successful,
        failed: failed.length,
        duration_ms: totalTime,
        avg_per_entity_ms: Math.round(totalTime / results.length)
      },
      failed_entities: failed.length > 0 ? failed : undefined
    })

  } catch (error) {
    console.error('Bulk profile builder error:', error)
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500)
  }
})
