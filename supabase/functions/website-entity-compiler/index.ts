import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * WEBSITE ENTITY COMPILER
 *
 * Validates, cleans, and structures raw website entities using Claude:
 * 1. Validates extracted data quality
 * 2. Deduplicates similar entities
 * 3. Enriches descriptions
 * 4. Categorizes properly
 * 5. Structures for schema generation
 * 6. Saves to content_library
 */

interface CompilerRequest {
  organization_id: string
  organization_name: string
  entities: {
    products: any[]
    services: any[]
    locations: any[]
    subsidiaries: any[]
    team: any[]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      entities
    }: CompilerRequest = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🔨 Website Entity Compiler Starting:', {
      organization_name,
      products: entities.products?.length || 0,
      services: entities.services?.length || 0,
      locations: entities.locations?.length || 0,
      subsidiaries: entities.subsidiaries?.length || 0,
      team: entities.team?.length || 0
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!
    const voyageKey = Deno.env.get('VOYAGE_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helper: Generate embedding using Voyage AI
    async function generateEmbedding(text: string): Promise<number[] | null> {
      if (!voyageKey) return null
      try {
        const response = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${voyageKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'voyage-3-large',
            input: text.substring(0, 8000),
            input_type: 'document'
          })
        })
        if (!response.ok) return null
        const data = await response.json()
        return data.data[0].embedding
      } catch (error) {
        console.error('❌ Embedding error:', error)
        return null
      }
    }

    const compiledEntities: any = {
      products: [],
      services: [],
      locations: [],
      subsidiaries: [],
      team: []
    }

    // STEP 1: Compile Products (if any)
    if (entities.products && entities.products.length > 0) {
      console.log('📦 Compiling products...')
      compiledEntities.products = await compileEntities(
        anthropicKey,
        'products',
        entities.products,
        organization_name
      )
      console.log(`   ✓ Compiled ${compiledEntities.products.length} products`)
    }

    // STEP 2: Compile Services (if any)
    if (entities.services && entities.services.length > 0) {
      console.log('🛠️ Compiling services...')
      compiledEntities.services = await compileEntities(
        anthropicKey,
        'services',
        entities.services,
        organization_name
      )
      console.log(`   ✓ Compiled ${compiledEntities.services.length} services`)
    }

    // STEP 3: Compile Locations (if any)
    if (entities.locations && entities.locations.length > 0) {
      console.log('📍 Compiling locations...')
      compiledEntities.locations = await compileEntities(
        anthropicKey,
        'locations',
        entities.locations,
        organization_name
      )
      console.log(`   ✓ Compiled ${compiledEntities.locations.length} locations`)
    }

    // STEP 4: Compile Subsidiaries (if any)
    if (entities.subsidiaries && entities.subsidiaries.length > 0) {
      console.log('🏢 Compiling subsidiaries...')
      compiledEntities.subsidiaries = await compileEntities(
        anthropicKey,
        'subsidiaries',
        entities.subsidiaries,
        organization_name
      )
      console.log(`   ✓ Compiled ${compiledEntities.subsidiaries.length} subsidiaries`)
    }

    // STEP 5: Compile Team (if any)
    if (entities.team && entities.team.length > 0) {
      console.log('👥 Compiling team...')
      compiledEntities.team = await compileEntities(
        anthropicKey,
        'team',
        entities.team,
        organization_name
      )
      console.log(`   ✓ Compiled ${compiledEntities.team.length} team members`)
    }

    // STEP 6: Save to content_library
    console.log('💾 Saving compiled entities to content_library...')
    let savedCount = 0

    // Save products
    for (const product of compiledEntities.products) {
      try {
        const text = `${product.name}\n\n${product.description}`.substring(0, 8000)
        const embedding = await generateEmbedding(text)

        await supabase.from('content_library').insert({
          organization_id,
          content_type: 'product',
          title: product.name,
          content: product.description,
          folder: 'Products/',
          status: 'published',
          metadata: {
            category: product.category,
            price_range: product.price_range,
            features: product.features,
            url: product.url,
            compiled_by: 'website-entity-compiler',
            schema_ready: true
          },
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: embedding ? new Date().toISOString() : null
        })
        savedCount++
      } catch (error) {
        console.error(`   ✗ Failed to save product: ${product.name}`)
      }
    }

    // Save services
    for (const service of compiledEntities.services) {
      try {
        const text = `${service.name}\n\n${service.description}`.substring(0, 8000)
        const embedding = await generateEmbedding(text)

        await supabase.from('content_library').insert({
          organization_id,
          content_type: 'service',
          title: service.name,
          content: service.description,
          folder: 'Services/',
          status: 'published',
          metadata: {
            category: service.category,
            service_type: service.service_type,
            url: service.url,
            compiled_by: 'website-entity-compiler',
            schema_ready: true
          },
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: embedding ? new Date().toISOString() : null
        })
        savedCount++
      } catch (error) {
        console.error(`   ✗ Failed to save service: ${service.name}`)
      }
    }

    // Save locations
    for (const location of compiledEntities.locations) {
      try {
        const locationContent = `${location.address}, ${location.city}, ${location.state} ${location.postal_code}`
        const text = `${location.name}\n\n${locationContent}`.substring(0, 8000)
        const embedding = await generateEmbedding(text)

        await supabase.from('content_library').insert({
          organization_id,
          content_type: 'location',
          title: location.name,
          content: locationContent,
          folder: 'Locations/',
          status: 'published',
          metadata: {
            type: location.type,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            postal_code: location.postal_code,
            phone: location.phone,
            email: location.email,
            compiled_by: 'website-entity-compiler',
            schema_ready: true
          },
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: embedding ? new Date().toISOString() : null
        })
        savedCount++
      } catch (error) {
        console.error(`   ✗ Failed to save location: ${location.name}`)
      }
    }

    // Save subsidiaries
    for (const subsidiary of compiledEntities.subsidiaries) {
      try {
        const text = `${subsidiary.name}\n\n${subsidiary.description}`.substring(0, 8000)
        const embedding = await generateEmbedding(text)

        await supabase.from('content_library').insert({
          organization_id,
          content_type: 'subsidiary',
          title: subsidiary.name,
          content: subsidiary.description,
          folder: 'Subsidiaries/',
          status: 'published',
          metadata: {
            type: subsidiary.type,
            industry: subsidiary.industry,
            url: subsidiary.url,
            compiled_by: 'website-entity-compiler',
            schema_ready: true
          },
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: embedding ? new Date().toISOString() : null
        })
        savedCount++
      } catch (error) {
        console.error(`   ✗ Failed to save subsidiary: ${subsidiary.name}`)
      }
    }

    // Save team members
    for (const member of compiledEntities.team) {
      try {
        const text = `${member.name}\n\n${member.title}\n\n${member.bio}`.substring(0, 8000)
        const embedding = await generateEmbedding(text)

        await supabase.from('content_library').insert({
          organization_id,
          content_type: 'person',
          title: member.name,
          content: member.bio,
          folder: 'Team/',
          status: 'published',
          metadata: {
            title: member.title,
            role: member.role,
            image_url: member.image_url,
            linkedin_url: member.linkedin_url,
            compiled_by: 'website-entity-compiler',
            schema_ready: true
          },
          embedding,
          embedding_model: 'voyage-3-large',
          embedding_updated_at: embedding ? new Date().toISOString() : null
        })
        savedCount++
      } catch (error) {
        console.error(`   ✗ Failed to save team member: ${member.name}`)
      }
    }

    console.log(`   ✓ Saved ${savedCount} entities to content_library`)

    const summary = {
      total_compiled: Object.values(compiledEntities).reduce((sum: number, arr: any[]) => sum + arr.length, 0),
      total_saved: savedCount,
      by_type: {
        products: compiledEntities.products.length,
        services: compiledEntities.services.length,
        locations: compiledEntities.locations.length,
        subsidiaries: compiledEntities.subsidiaries.length,
        team: compiledEntities.team.length
      }
    }

    console.log('✅ Website Entity Compiler Complete:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        compiled_entities: compiledEntities,
        saved_count: savedCount,
        summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Website Entity Compiler Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Compile entities using Claude
 */
async function compileEntities(
  anthropicKey: string,
  entityType: string,
  entities: any[],
  organizationName: string
): Promise<any[]> {
  try {
    const prompt = buildCompilationPrompt(entityType, entities, organizationName)

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      console.error('Claude API error')
      return entities // Return raw entities if compilation fails
    }

    const claudeResult = await claudeResponse.json()
    const responseText = claudeResult.content[0].text

    // Parse Claude's response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.compiled || entities
    }

    return entities

  } catch (error) {
    console.error('Compilation error:', error)
    return entities // Return raw entities if compilation fails
  }
}

/**
 * Build compilation prompt for Claude
 */
function buildCompilationPrompt(entityType: string, entities: any[], organizationName: string): string {
  const entitiesJson = JSON.stringify(entities, null, 2)

  return `You are compiling and validating ${entityType} data for "${organizationName}".

**RAW ENTITIES:**
${entitiesJson}

**YOUR TASK:**
1. **Validate**: Remove duplicates, invalid entries, or placeholder text
2. **Clean**: Fix formatting, standardize fields
3. **Enrich**: Improve descriptions (make them more complete and informative)
4. **Categorize**: Ensure proper categorization
5. **Structure**: Format for schema.org generation

**OUTPUT FORMAT:**
Return a JSON object with this structure:
{
  "compiled": [
    ... array of cleaned and validated ${entityType}
  ]
}

**IMPORTANT:**
- Keep all valid entities, just improve their quality
- Remove obvious duplicates
- Fix any formatting issues
- Enhance descriptions to be more informative
- Return empty array if all entities are invalid

Generate the compiled entities now:`
}
