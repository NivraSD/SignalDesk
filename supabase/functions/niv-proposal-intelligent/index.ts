import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface ProposalCreationRequest {
  // User's new proposal requirements
  clientName?: string
  industry: string
  sector?: string
  servicesOffered: string[]
  proposalType: string
  dealValueRange?: string

  // User preferences for references
  useReferences?: boolean
  specificReferences?: string[]
  sectionReferences?: Record<string, string[]>

  // Additional context
  clientRequirements?: string
  competitiveContext?: string
  budgetConstraints?: string
  timeline?: string
  keyDifferentiators?: string[]

  // Organization context
  organizationId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const requestData: ProposalCreationRequest = await req.json()

    console.log('Proposal creation request:', {
      industry: requestData.industry,
      services: requestData.servicesOffered,
      useReferences: requestData.useReferences
    })

    // Step 1: Find similar proposals if requested
    let similarProposals: any[] = []
    let proposalSuggestions: any[] = []

    if (requestData.useReferences !== false && !requestData.specificReferences) {
      console.log('Finding similar proposals...')

      const { data: proposals, error: proposalError } = await supabase
        .rpc('find_similar_proposals_mv', {
          p_organization_id: requestData.organizationId,
          p_industry: requestData.industry,
          p_services_offered: requestData.servicesOffered,
          p_limit: 5
        })

      if (proposalError) {
        console.error('Error finding similar proposals:', proposalError)
      } else {
        similarProposals = proposals || []
        console.log(`Found ${similarProposals.length} similar proposals`)
      }
    }

    // Step 2: Fetch specified proposals or use similar ones
    const proposalsToUse = requestData.specificReferences ||
      similarProposals.slice(0, 3).map(p => p.id)

    let referenceContent: any[] = []
    if (proposalsToUse.length > 0) {
      console.log('Fetching reference proposals:', proposalsToUse)

      const { data: references, error: refError } = await supabase
        .from('content_library')
        .select('*')
        .in('id', proposalsToUse)
        .eq('organization_id', requestData.organizationId)
        .eq('folder', 'proposals')
        .eq('content_type', 'proposal')

      if (refError) {
        console.error('Error fetching reference proposals:', refError)
      } else {
        referenceContent = references || []
        console.log(`Retrieved ${referenceContent.length} reference proposals`)
      }
    }

    // Step 3: Build context for Claude
    const systemPrompt = buildProposalSystemPrompt(requestData, referenceContent, similarProposals)

    // Step 4: Generate proposal with Claude
    console.log('Generating proposal with Claude...')

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: buildUserPrompt(requestData)
        }]
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const anthropicData = await anthropicResponse.json()
    const generatedProposal = anthropicData.content[0].text

    // Step 5: Return response with proposal and metadata
    return new Response(
      JSON.stringify({
        success: true,
        proposal: generatedProposal,
        metadata: {
          referencedProposals: referenceContent.map(p => ({
            id: p.id,
            title: p.title,
            clientName: p.client_name,
            outcome: p.outcome,
            matchScore: similarProposals.find(s => s.id === p.id)?.match_score
          })),
          suggestedProposals: similarProposals.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            clientName: p.client_name,
            industry: p.industry,
            outcome: p.outcome,
            matchScore: p.match_score,
            proposalDate: p.proposal_date
          })),
          generationTime: Date.now()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in niv-proposal-intelligent:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function buildProposalSystemPrompt(
  request: ProposalCreationRequest,
  referenceContent: any[],
  similarProposals: any[]
): string {
  let prompt = `You are NIV, an expert business development proposal writer. Your task is to create a compelling, professional business proposal.

# Your Capabilities
- Expert in proposal structure and persuasive business writing
- Able to adapt successful approaches from past proposals
- Skilled at highlighting differentiators and value propositions
- Data-driven and evidence-based
- Understand industry-specific requirements and expectations

# Proposal Requirements
Client: ${request.clientName || 'Prospective Client'}
Industry: ${request.industry}
${request.sector ? `Sector: ${request.sector}` : ''}
Proposal Type: ${request.proposalType}
Services: ${request.servicesOffered.join(', ')}
${request.dealValueRange ? `Deal Size: ${request.dealValueRange}` : ''}

`

  if (request.clientRequirements) {
    prompt += `\n# Client Requirements\n${request.clientRequirements}\n`
  }

  if (request.competitiveContext) {
    prompt += `\n# Competitive Context\n${request.competitiveContext}\n`
  }

  if (request.keyDifferentiators && request.keyDifferentiators.length > 0) {
    prompt += `\n# Key Differentiators to Emphasize\n${request.keyDifferentiators.map(d => `- ${d}`).join('\n')}\n`
  }

  // Add reference proposal context
  if (referenceContent.length > 0) {
    prompt += `\n# Reference Proposals Available\n`
    prompt += `You have access to ${referenceContent.length} past proposals for reference:\n\n`

    referenceContent.forEach((ref, index) => {
      const matchInfo = similarProposals.find(s => s.id === ref.id)
      const metadata = ref.metadata?.proposalMetadata || {}

      prompt += `## Reference ${index + 1}: ${ref.title}\n`
      prompt += `- Client: ${metadata.clientName}\n`
      prompt += `- Industry: ${metadata.industry}${metadata.sector ? ` / ${metadata.sector}` : ''}\n`
      prompt += `- Outcome: ${metadata.outcome?.toUpperCase()}`
      if (matchInfo) {
        prompt += ` (Match Score: ${Math.round(matchInfo.match_score)}/100)\n`
      } else {
        prompt += '\n'
      }

      if (metadata.outcome === 'won' && metadata.outcomeNotes) {
        prompt += `- Why We Won: ${metadata.outcomeNotes}\n`
      } else if (metadata.outcome === 'lost' && metadata.outcomeNotes) {
        prompt += `- Why We Lost: ${metadata.outcomeNotes}\n`
      }

      if (metadata.keyDifferentiators && metadata.keyDifferentiators.length > 0) {
        prompt += `- Differentiators Used: ${metadata.keyDifferentiators.join(', ')}\n`
      }

      // Add proposal sections if available
      if (metadata.proposalSections) {
        const sections = metadata.proposalSections
        if (sections.executiveSummary) {
          prompt += `\n### Executive Summary\n${sections.executiveSummary}\n`
        }
        if (sections.technicalApproach) {
          prompt += `\n### Technical Approach\n${sections.technicalApproach}\n`
        }
        if (sections.teamCredentials) {
          prompt += `\n### Team Credentials\n${sections.teamCredentials}\n`
        }
        if (sections.caseStudies) {
          prompt += `\n### Case Studies\n${sections.caseStudies}\n`
        }
      }

      // Add full content if available
      if (ref.content && ref.content.length > 100) {
        prompt += `\n### Full Proposal Content\n${ref.content}\n`
      }

      prompt += '\n---\n\n'
    })

    prompt += `# How to Use References\n`
    prompt += `- Learn from winning proposals - what made them successful?\n`
    prompt += `- Avoid mistakes from lost proposals\n`
    prompt += `- Adapt successful approaches to this new context\n`
    prompt += `- Maintain consistency in quality and style\n`
    prompt += `- Do NOT copy verbatim - adapt and customize\n\n`
  }

  prompt += `# Proposal Structure\n`
  prompt += `Create a comprehensive proposal with the following sections:\n\n`
  prompt += `1. **Executive Summary** - Compelling overview of the opportunity and our solution\n`
  prompt += `2. **Understanding of Requirements** - Demonstrate deep understanding of client needs\n`
  prompt += `3. **Technical Approach** - Detailed methodology and approach\n`
  prompt += `4. **Team & Credentials** - Why we're qualified, relevant experience\n`
  prompt += `5. **Case Studies** - Relevant success stories demonstrating capability\n`
  prompt += `6. **Timeline & Deliverables** - Clear project plan\n`
  prompt += `7. **Pricing** - Value-based pricing structure\n`
  prompt += `8. **Why Choose Us** - Compelling differentiators\n\n`

  prompt += `# Writing Guidelines\n`
  prompt += `- Professional, confident tone\n`
  prompt += `- Client-focused (emphasize their benefits, not just our capabilities)\n`
  prompt += `- Evidence-based (use data, case studies, specific examples)\n`
  prompt += `- Clear value proposition throughout\n`
  prompt += `- Address potential concerns proactively\n`
  prompt += `- Strong, action-oriented language\n`
  prompt += `- Well-structured with clear headings\n`

  return prompt
}

function buildUserPrompt(request: ProposalCreationRequest): string {
  let prompt = `Please create a comprehensive business proposal for ${request.clientName || 'this prospective client'}.`

  if (request.timeline) {
    prompt += `\n\nTimeline: ${request.timeline}`
  }

  if (request.budgetConstraints) {
    prompt += `\n\nBudget Considerations: ${request.budgetConstraints}`
  }

  prompt += `\n\nGenerate a complete, professional proposal that:\n`
  prompt += `1. Addresses the client's specific needs in the ${request.industry} industry\n`
  prompt += `2. Highlights our unique value proposition and differentiators\n`
  prompt += `3. Demonstrates relevant experience and capability\n`
  prompt += `4. Presents a clear, compelling case for choosing us\n`

  if (request.specificReferences) {
    prompt += `5. Adapts successful elements from the reference proposals provided\n`
  }

  prompt += `\nFormat the proposal with clear section headers using markdown.`

  return prompt
}
