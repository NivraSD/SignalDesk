import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SCHEMA OPTIMIZER
 *
 * Strategic schema.org optimization based on:
 * - Industry analysis and best practices
 * - Competitive intelligence
 * - Organization strategic positioning
 * - AI visibility goals
 *
 * Generates comprehensive schema packages (Organization + Service/Product)
 * with rich, strategic content optimized for AI understanding.
 */

interface SchemaOptimizationRequest {
  organization_id: string
  organization_name: string
  industry: string
  url?: string
  website_content?: string
  force_regenerate?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      url,
      website_content,
      force_regenerate = false
    } = await req.json() as SchemaOptimizationRequest

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🎯 Starting strategic schema optimization for:', organization_name)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Gather strategic intelligence
    console.log('📊 Gathering strategic intelligence...')

    // Get organization profile
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    // Get intelligence targets (competitors, stakeholders)
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('active', true)

    // Get recent content from Memory Vault for context
    const { data: recentContent } = await supabase
      .from('content_library')
      .select('title, content, metadata')
      .eq('organization_id', organization_id)
      .in('content_type', ['strategic_framework', 'positioning', 'messaging'])
      .order('created_at', { ascending: false })
      .limit(5)

    // Check for existing schema
    const { data: existingSchema } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('content_type', 'schema')
      .eq('folder', 'Schemas/Active/')
      .maybeSingle()

    if (existingSchema && !force_regenerate) {
      console.log('✅ Schema already exists, use force_regenerate=true to rebuild')
      return new Response(
        JSON.stringify({
          success: true,
          schema_exists: true,
          schema_id: existingSchema.id,
          message: 'Schema already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // STEP 2: Build strategic context for Claude
    const strategicContext = buildStrategicContext({
      organization: orgData,
      industry,
      targets,
      recentContent,
      websiteContent: website_content,
      url
    })

    console.log('🤖 Generating comprehensive schema with Claude...')

    // STEP 3: Call Claude for strategic schema generation
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
          content: generateSchemaOptimizationPrompt(strategicContext)
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        body: errorText
      })
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`)
    }

    const claudeResult = await claudeResponse.json()
    const schemaPackage = parseSchemaResponse(claudeResult.content[0].text)

    console.log('✅ Schema package generated:', {
      schemas: schemaPackage.schemas?.length || 0,
      primaryType: schemaPackage.schemas?.[0]?.['@type']
    })

    // STEP 4: Save primary schema to Memory Vault
    const primarySchema = schemaPackage.schemas[0]

    const { data: savedSchema, error: saveError } = await supabase
      .from('content_library')
      .upsert({
        id: existingSchema?.id, // Update if exists, insert if new
        organization_id,
        content_type: 'schema',
        title: `${organization_name} - ${primarySchema['@type']} Schema`,
        content: JSON.stringify(primarySchema),
        folder: 'Schemas/Active/',
        status: 'published',
        metadata: {
          version: (existingSchema?.metadata?.version || 0) + 1,
          schema_type: primarySchema['@type'],
          generated_by: 'geo-schema-optimizer',
          optimization_date: new Date().toISOString(),
          platform_optimized: 'all',
          industry,
          field_count: Object.keys(primarySchema).length,
          strategy: schemaPackage.optimization_strategy
        },
        intelligence: {
          source: 'generated',
          fields: Object.keys(primarySchema),
          schemas_in_package: schemaPackage.schemas?.length || 1
        }
      }, { onConflict: 'id' })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save schema:', saveError)
      throw saveError
    }

    // Save additional schemas (Service, Product, etc.) to companion folder
    if (schemaPackage.schemas.length > 1) {
      const additionalSchemas = schemaPackage.schemas.slice(1)

      for (const schema of additionalSchemas) {
        await supabase
          .from('content_library')
          .insert({
            organization_id,
            content_type: 'schema',
            title: `${organization_name} - ${schema['@type']} Schema`,
            content: JSON.stringify(schema),
            folder: 'Schemas/Companion/',
            status: 'published',
            metadata: {
              version: 1,
              schema_type: schema['@type'],
              generated_by: 'geo-schema-optimizer',
              companion_to: savedSchema.id,
              platform_optimized: 'all'
            }
          })
      }

      console.log(`✅ Saved ${additionalSchemas.length} companion schemas`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        schema_id: savedSchema.id,
        schema_package: schemaPackage,
        schemas_created: schemaPackage.schemas?.length || 1,
        field_count: Object.keys(primarySchema).length,
        optimization_strategy: schemaPackage.optimization_strategy,
        message: 'Comprehensive schema package generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Schema Optimization Error:', error)
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
 * Build strategic context from gathered intelligence
 */
function buildStrategicContext(data: any): any {
  const competitors = data.targets?.filter((t: any) => t.type === 'competitor') || []
  const stakeholders = data.targets?.filter((t: any) => t.type === 'stakeholder') || []

  return {
    organization: {
      name: data.organization?.name,
      industry: data.industry,
      url: data.url || data.organization?.url,
      size: data.organization?.size,
      description: data.organization?.description
    },
    industry: data.industry,
    competitors: competitors.map((c: any) => c.name),
    stakeholders: stakeholders.map((s: any) => ({ name: s.name, category: s.category })),
    strategic_content: data.recentContent?.map((c: any) => ({
      title: c.title,
      type: c.metadata?.content_type,
      key_points: c.metadata?.key_points
    })) || [],
    website_content: data.websiteContent?.substring(0, 2000) // Sample for context
  }
}

/**
 * Generate comprehensive schema optimization prompt for Claude
 */
function generateSchemaOptimizationPrompt(context: any): string {
  return `You are a strategic schema.org optimization expert. Your goal is to create the most comprehensive, AI-optimized schema markup possible for this organization.

**ORGANIZATION INTELLIGENCE:**
Name: ${context.organization.name}
Industry: ${context.industry}
Website: ${context.organization.url || 'Not provided'}
Size: ${context.organization.size || 'Not provided'}

**COMPETITIVE CONTEXT:**
${context.competitors.length > 0 ? `Competitors: ${context.competitors.slice(0, 5).join(', ')}` : 'No competitor data'}

**STAKEHOLDER CONTEXT:**
${context.stakeholders.length > 0 ? `Key stakeholders: ${context.stakeholders.slice(0, 5).map((s: any) => s.name).join(', ')}` : 'No stakeholder data'}

**STRATEGIC POSITIONING:**
${context.strategic_content.length > 0 ? context.strategic_content.map((c: any) => `- ${c.title}`).join('\n') : 'No strategic content available'}

**YOUR TASK:**
Generate a comprehensive schema.org package optimized for AI visibility and understanding. This schema will be the organization's primary structured data for Claude, Gemini, ChatGPT, and other AI systems.

**REQUIREMENTS:**

1. **Multiple Schema Types** - Create 2-3 related schemas:
   - Primary: Organization schema (comprehensive)
   - Secondary: Service/Product/FinancialService (based on industry)
   - Optional: Additional relevant types

2. **Rich Field Population** - Include ALL relevant fields:
   - Core: name, url, description, logo, foundingDate
   - Contact: contactPoint (multiple), telephone, email
   - Social: sameAs (LinkedIn, Twitter, etc.)
   - Location: address, areaServed
   - Relationships: subOrganization, parentOrganization, memberOf
   - Industry: industry, keywords, knowsAbout, serviceType
   - Scale: numberOfEmployees, awards, certifications

3. **Strategic Content** - NOT generic descriptions:
   - Description should highlight unique positioning and value
   - knowsAbout should reflect actual expertise and domains
   - keywords should be strategically chosen for AI queries
   - Use industry-specific terminology

4. **Industry Optimization** - Tailor to industry best practices:
   ${getIndustryGuidance(context.industry)}

5. **AI Query Optimization** - Structure for discoverability:
   - What queries should return this org?
   - What expertise should AI associate?
   - What problems does this org solve?

**OUTPUT FORMAT:**
Return a JSON object with this structure:
{
  "schemas": [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      ... (all fields)
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      ... (secondary schema)
    }
  ],
  "optimization_strategy": {
    "primary_queries": ["query 1", "query 2", ...],
    "positioning": "one-sentence positioning",
    "differentiators": ["diff 1", "diff 2", ...]
  },
  "implementation_notes": "Any special considerations"
}

Generate the most comprehensive, strategic schema package possible. This is the organization's AI presence - make it exceptional.`
}

/**
 * Industry-specific guidance for schema optimization
 */
function getIndustryGuidance(industry: string): string {
  const guidance: { [key: string]: string } = {
    'Trading and Investment': `
- Use FinancialService as secondary schema
- Focus on: serviceType, areaServed, featureList
- Highlight: trading capabilities, investment sectors, global reach
- Include: subOrganization for divisions/funds`,

    'Technology': `
- Use SoftwareApplication or Product as secondary schema
- Focus on: applicationCategory, offers, featureList
- Highlight: technical capabilities, integrations, platforms
- Include: products/services catalog`,

    'Healthcare': `
- Use MedicalOrganization as secondary schema
- Focus on: medicalSpecialty, availableService, healthcareReporting
- Highlight: specialties, certifications, patient services
- Include: locations, departments`,

    'default': `
- Choose appropriate secondary schema based on primary business
- Focus on core services and value proposition
- Highlight unique capabilities and market position`
  }

  return guidance[industry] || guidance['default']
}

/**
 * Parse Claude's schema response
 */
function parseSchemaResponse(response: string): any {
  try {
    // Try to find JSON in response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback: basic schema structure
    return {
      schemas: [{
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Organization",
        "description": "Schema generation failed - manual review needed"
      }],
      optimization_strategy: {
        primary_queries: [],
        positioning: "Unable to generate",
        differentiators: []
      }
    }
  } catch (error) {
    console.error('Error parsing schema response:', error)
    throw new Error('Failed to parse schema response from Claude')
  }
}
