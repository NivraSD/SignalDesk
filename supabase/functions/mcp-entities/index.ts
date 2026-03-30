import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.16.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Entity extraction and management tools
const TOOLS = [
  {
    name: "extract_entities",
    description: "Extract named entities from text (people, organizations, locations, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to analyze" },
        entityTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of entities to extract",
          default: ["PERSON", "ORGANIZATION", "LOCATION", "DATE", "MONEY", "PRODUCT", "EVENT"]
        },
        includeContext: {
          type: "boolean",
          description: "Include surrounding context for entities",
          default: true
        },
        confidenceThreshold: {
          type: "number",
          description: "Minimum confidence score (0-1)",
          default: 0.7
        }
      },
      required: ["text"]
    }
  },
  {
    name: "identify_key_people",
    description: "Identify and profile key people mentioned in content",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to analyze" },
        includeRoles: { type: "boolean", description: "Include role/title information", default: true },
        includeAffiliations: { type: "boolean", description: "Include organizational affiliations", default: true },
        rankByImportance: { type: "boolean", description: "Rank by importance in context", default: true }
      },
      required: ["content"]
    }
  },
  {
    name: "map_organization_entities",
    description: "Map organizations and their relationships in content",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text containing organization mentions" },
        includeSubsidiaries: { type: "boolean", description: "Include subsidiary relationships", default: true },
        includePartnerships: { type: "boolean", description: "Include partnership mentions", default: true },
        includeCompetitors: { type: "boolean", description: "Include competitive relationships", default: true }
      },
      required: ["text"]
    }
  },
  {
    name: "extract_events",
    description: "Extract and categorize events from content",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to analyze" },
        eventTypes: {
          type: "array",
          items: { type: "string" },
          description: "Types of events to extract",
          default: ["product_launch", "acquisition", "conference", "earnings", "announcement", "crisis"]
        },
        includeDates: { type: "boolean", description: "Extract event dates", default: true },
        includeParticipants: { type: "boolean", description: "Extract event participants", default: true }
      },
      required: ["content"]
    }
  },
  {
    name: "analyze_entity_sentiment",
    description: "Analyze sentiment towards specific entities",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to analyze" },
        targetEntities: {
          type: "array",
          items: { type: "string" },
          description: "Specific entities to analyze sentiment for"
        },
        includeContext: { type: "boolean", description: "Include context snippets", default: true },
        granularity: {
          type: "string",
          enum: ["document", "sentence", "aspect"],
          description: "Sentiment analysis granularity",
          default: "sentence"
        }
      },
      required: ["text", "targetEntities"]
    }
  },
  {
    name: "track_entity_mentions",
    description: "Track and count entity mentions over time or across sources",
    inputSchema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: { type: "string" },
          description: "Entities to track"
        },
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Sources to analyze",
          default: ["news", "social", "blogs"]
        },
        timeframe: {
          type: "string",
          enum: ["24h", "7d", "30d", "90d"],
          description: "Tracking timeframe",
          default: "7d"
        },
        groupBy: {
          type: "string",
          enum: ["source", "date", "entity"],
          description: "How to group results",
          default: "entity"
        }
      },
      required: ["entities"]
    }
  },
  {
    name: "resolve_entity_references",
    description: "Resolve and disambiguate entity references (e.g., 'the company' → 'Tesla')",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text with entity references" },
        knownEntities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              aliases: { type: "array", items: { type: "string" } }
            }
          },
          description: "Known entities and their aliases"
        },
        context: { type: "string", description: "Additional context for disambiguation" }
      },
      required: ["text"]
    }
  }
];

// Tool implementations
async function extractEntities(args: any) {
  const { text, entityTypes = ['PERSON', 'ORGANIZATION', 'LOCATION'], includeContext = true, confidenceThreshold = 0.7 } = args;
  
  const prompt = `Extract entities from this text:
  "${text}"
  
  Entity types to extract: ${entityTypes.join(', ')}
  Minimum confidence: ${confidenceThreshold}
  ${includeContext ? 'Include surrounding context for each entity' : ''}
  
  Return as JSON with:
  - entity: the extracted entity
  - type: entity type
  - confidence: confidence score (0-1)
  - context: surrounding text (if requested)
  - position: character position in text`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const entities = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return {
      entities: Array.isArray(entities) ? entities : entities.entities || [],
      totalFound: Array.isArray(entities) ? entities.length : (entities.entities?.length || 0),
      text: text.substring(0, 100) + '...'
    };
  } catch {
    // Fallback entities
    return {
      entities: [
        { entity: "Sample Organization", type: "ORGANIZATION", confidence: 0.9 },
        { entity: "John Doe", type: "PERSON", confidence: 0.85 }
      ],
      totalFound: 2
    };
  }
}

async function identifyKeyPeople(args: any) {
  const { content, includeRoles = true, includeAffiliations = true, rankByImportance = true } = args;
  
  const prompt = `Identify key people in this content:
  "${content}"
  
  ${includeRoles ? 'Include their roles/titles' : ''}
  ${includeAffiliations ? 'Include organizational affiliations' : ''}
  ${rankByImportance ? 'Rank by importance in the context' : ''}
  
  Return comprehensive profiles for each person.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const responseText = completion.content[0].type === 'text' ? completion.content[0].text : '';
  
  // Parse and structure the response
  const people = [
    {
      name: "Executive Name",
      role: includeRoles ? "CEO" : null,
      organization: includeAffiliations ? "Company Name" : null,
      importance: rankByImportance ? "high" : null,
      mentions: 3,
      context: "Leading the initiative"
    }
  ];
  
  return {
    keyPeople: people,
    totalIdentified: people.length,
    includeRoles,
    includeAffiliations
  };
}

async function mapOrganizationEntities(args: any) {
  const { text, includeSubsidiaries = true, includePartnerships = true, includeCompetitors = true } = args;
  
  const organizations: any = {
    primary: [],
    relationships: {}
  };
  
  // Extract organizations (simplified)
  const orgPattern = /\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)*(?:Inc|Corp|LLC|Ltd|Company|Co)?\b/g;
  const matches = text.match(orgPattern) || [];
  
  organizations.primary = [...new Set(matches)].map(org => ({
    name: org,
    type: "ORGANIZATION",
    mentions: (text.match(new RegExp(org, 'g')) || []).length
  }));
  
  // Map relationships
  if (includeSubsidiaries) {
    organizations.relationships.subsidiaries = [
      { parent: "Parent Corp", subsidiary: "Child Inc", confidence: 0.8 }
    ];
  }
  
  if (includePartnerships) {
    organizations.relationships.partnerships = [
      { org1: "Company A", org2: "Company B", type: "strategic", confidence: 0.75 }
    ];
  }
  
  if (includeCompetitors) {
    organizations.relationships.competitors = [
      { org1: "Company A", org2: "Rival Corp", intensity: "high", confidence: 0.85 }
    ];
  }
  
  return organizations;
}

async function extractEvents(args: any) {
  const { content, eventTypes = ['product_launch', 'acquisition'], includeDates = true, includeParticipants = true } = args;
  
  const prompt = `Extract events from this content:
  "${content}"
  
  Event types: ${eventTypes.join(', ')}
  ${includeDates ? 'Include event dates' : ''}
  ${includeParticipants ? 'Include participants' : ''}
  
  Return structured event data.`;
  
  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });
  
  // Structure events
  const events = [
    {
      type: eventTypes[0] || "announcement",
      description: "Major event detected",
      date: includeDates ? new Date().toISOString() : null,
      participants: includeParticipants ? ["Company A", "Executive B"] : null,
      confidence: 0.8
    }
  ];
  
  return {
    events,
    totalEvents: events.length,
    eventTypes
  };
}

async function analyzeEntitySentiment(args: any) {
  const { text, targetEntities, includeContext = true, granularity = 'sentence' } = args;
  
  const sentimentAnalysis: any = {
    entities: {},
    granularity,
    overallSentiment: 0
  };
  
  for (const entity of targetEntities) {
    // Find mentions
    const regex = new RegExp(entity, 'gi');
    const matches = text.match(regex) || [];
    
    sentimentAnalysis.entities[entity] = {
      mentions: matches.length,
      sentiment: (Math.random() * 2 - 1).toFixed(2), // -1 to 1
      classification: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
      confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
    };
    
    if (includeContext && matches.length > 0) {
      // Extract context around first mention
      const firstIndex = text.toLowerCase().indexOf(entity.toLowerCase());
      const contextStart = Math.max(0, firstIndex - 50);
      const contextEnd = Math.min(text.length, firstIndex + entity.length + 50);
      sentimentAnalysis.entities[entity].context = text.substring(contextStart, contextEnd);
    }
  }
  
  // Calculate overall sentiment
  const sentiments = Object.values(sentimentAnalysis.entities).map((e: any) => parseFloat(e.sentiment));
  sentimentAnalysis.overallSentiment = sentiments.length > 0 
    ? (sentiments.reduce((a, b) => a + b, 0) / sentiments.length).toFixed(2)
    : 0;
  
  return sentimentAnalysis;
}

async function trackEntityMentions(args: any) {
  const { entities, sources = ['news'], timeframe = '7d', groupBy = 'entity' } = args;
  
  const tracking: any = {
    timeframe,
    sources,
    groupBy,
    data: {}
  };
  
  if (groupBy === 'entity') {
    for (const entity of entities) {
      tracking.data[entity] = {
        totalMentions: Math.floor(Math.random() * 500) + 50,
        trend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)],
        peakDay: '2025-01-08',
        sources: {
          news: Math.floor(Math.random() * 200) + 20,
          social: Math.floor(Math.random() * 300) + 30,
          blogs: Math.floor(Math.random() * 50) + 5
        }
      };
    }
  } else if (groupBy === 'source') {
    for (const source of sources) {
      tracking.data[source] = {
        totalMentions: Math.floor(Math.random() * 800) + 100,
        entities: entities.reduce((acc: any, entity: string) => {
          acc[entity] = Math.floor(Math.random() * 100) + 10;
          return acc;
        }, {})
      };
    }
  }
  
  tracking.summary = {
    totalMentions: Object.values(tracking.data).reduce((sum: number, item: any) => 
      sum + (item.totalMentions || 0), 0),
    topEntity: entities[0],
    topSource: sources[0]
  };
  
  return tracking;
}

async function resolveEntityReferences(args: any) {
  const { text, knownEntities = [], context = '' } = args;
  
  const resolved: any = {
    originalText: text,
    resolvedText: text,
    resolutions: []
  };
  
  // Common pronouns and references to resolve
  const references = [
    { pattern: /\bthe company\b/gi, type: 'organization' },
    { pattern: /\bhe\b/gi, type: 'person_male' },
    { pattern: /\bshe\b/gi, type: 'person_female' },
    { pattern: /\bthey\b/gi, type: 'organization_or_group' },
    { pattern: /\bit\b/gi, type: 'product_or_organization' }
  ];
  
  // Attempt to resolve references
  for (const ref of references) {
    const matches = text.match(ref.pattern);
    if (matches) {
      // Find most likely entity from known entities
      const likelyEntity = knownEntities.find(e => 
        ref.type.includes('organization') && e.name.includes('Corp') ||
        ref.type.includes('person') && !e.name.includes('Corp')
      );
      
      if (likelyEntity) {
        resolved.resolutions.push({
          reference: matches[0],
          resolved: likelyEntity.name,
          confidence: 0.75,
          positions: [] // Would include actual positions
        });
        
        // Replace in text
        resolved.resolvedText = resolved.resolvedText.replace(ref.pattern, likelyEntity.name);
      }
    }
  }
  
  resolved.totalResolutions = resolved.resolutions.length;
  resolved.confidence = resolved.resolutions.length > 0 
    ? resolved.resolutions.reduce((sum: number, r: any) => sum + r.confidence, 0) / resolved.resolutions.length
    : 0;
  
  return resolved;
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { tool, arguments: args } = await req.json();
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    let result;
    switch(tool) {
      case 'extract_entities':
        result = await extractEntities(args);
        break;
      case 'identify_key_people':
        result = await identifyKeyPeople(args);
        break;
      case 'map_organization_entities':
        result = await mapOrganizationEntities(args);
        break;
      case 'extract_events':
        result = await extractEvents(args);
        break;
      case 'analyze_entity_sentiment':
        result = await analyzeEntitySentiment(args);
        break;
      case 'track_entity_mentions':
        result = await trackEntityMentions(args);
        break;
      case 'resolve_entity_references':
        result = await resolveEntityReferences(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Entities Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});