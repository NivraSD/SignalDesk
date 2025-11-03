import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Memory Vault API
// Handles storage and retrieval of ALL generated content:
// - NIV strategies
// - Blog posts, articles, press releases
// - Images and visual content
// - Patterns and templates that work
// - User attachments with AI analysis
// - Any generated content that should be remembered

interface ContentItem {
  id?: string;
  organization_id: string;
  content_type: string; // 'strategy', 'blog-post', 'press-release', 'image', 'template', 'attachment', etc.
  title: string;
  content: string | any; // The actual content (text, JSON, base64 for images)
  version?: number;

  // Metadata for any type of content
  metadata?: {
    // For strategies
    research_sources?: any[];
    research_key_findings?: string[];
    strategy_objective?: string;
    strategy_approach?: string;
    framework_data?: any;

    // For generated content
    prompt_used?: string;
    model_used?: string;
    generation_params?: any;

    // For images
    image_url?: string;
    alt_text?: string;
    dimensions?: { width: number; height: number };

    // For templates/patterns
    usage_count?: number;
    success_rate?: number;
    last_used?: string;

    // For attachments
    original_filename?: string;
    file_type?: string;
    file_size?: number;
    ai_analysis?: any;

    // General
    source?: string;
    confidence?: number;
    keywords?: string[];
    [key: string]: any; // Allow flexible metadata
  };

  // Common fields
  created_by?: string;
  status?: 'draft' | 'published' | 'template' | 'archived' | 'saved';
  tags?: string[];

  // Performance tracking
  performance_metrics?: {
    views?: number;
    engagement?: number;
    effectiveness?: number;
    reuse_count?: number;
  };
}

// Legacy interface for backward compatibility
interface NivStrategy extends ContentItem {
  // Keep specific NIV fields for compatibility
  research_sources?: any[];
  research_key_findings?: string[];
  research_gaps?: string[];
  research_confidence?: number;
  research_timestamp?: string;
  strategy_objective?: string;
  strategy_approach?: string;
  strategy_positioning?: string;
  strategy_key_messages?: string[];
  strategy_narratives?: string[];
  strategy_timeline?: string;
  strategy_urgency_level?: 'immediate' | 'high' | 'medium' | 'low';
  strategy_rationale?: string;
  workflow_campaign_intelligence?: any;
  workflow_content_generation?: any;
  workflow_strategic_planning?: any;
  workflow_media_outreach?: any;
  framework_data?: any;

  // NEW: Auto-execution fields
  content_strategy?: any;
  execution_plan?: any;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Save any type of content to Memory Vault
async function saveContent(content: ContentItem): Promise<ApiResponse> {
  try {
    // Handle organization_id
    let organizationId = content.organization_id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(organizationId)) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', organizationId)
        .single();

      if (orgData) {
        organizationId = orgData.id;
      } else {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: organizationId,
            domain: `${organizationId.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: 'Technology',
            size: 'Medium'
          })
          .select('id')
          .single();

        organizationId = newOrg?.id || '00000000-0000-0000-0000-000000000000';
      }
    }

    // Save to content_library table (universal storage)
    const { data, error } = await supabase
      .from('content_library')
      .insert({
        organization_id: organizationId,
        content_type: content.content_type,
        title: content.title,
        content: typeof content.content === 'string' ? content.content : JSON.stringify(content.content),
        metadata: content.metadata || {},
        tags: content.tags || [],
        status: content.status || 'saved',
        created_by: content.created_by || 'memory-vault'
      })
      .select()
      .single();

    if (error) throw error;

    // Track successful patterns
    if (content.content_type === 'template' || content.tags?.includes('successful')) {
      await supabase.rpc('increment_usage_count', { content_id: data.id }).catch(() => {});
    }

    console.log(`✨ Memory Vault: Stored ${content.content_type} - "${content.title}"`);

    return {
      success: true,
      data: data,
      message: `${content.content_type} saved successfully to Memory Vault`
    };
  } catch (error: any) {
    console.error('Save content error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Save a new NIV strategy (legacy compatibility)
async function saveStrategy(strategy: NivStrategy): Promise<ApiResponse> {
  try {
    // Handle organization_id - if it's not a valid UUID, look it up or create it
    let organizationId = strategy.organization_id;

    // Check if it's not a valid UUID (like 'OpenAI', 'default', etc.)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organizationId)) {
      // Look up or create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', organizationId)
        .single();

      if (orgData) {
        organizationId = orgData.id;
      } else {
        // Create the organization if it doesn't exist
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            name: organizationId,
            domain: `${organizationId.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: 'Technology',
            size: 'Medium'
          })
          .select('id')
          .single();

        if (newOrg) {
          organizationId = newOrg.id;
        } else {
          // If all else fails, use null UUID
          organizationId = '00000000-0000-0000-0000-000000000000';
        }
      }
    }

    const { data, error } = await supabase
      .from('niv_strategies')
      .insert({
        organization_id: organizationId,
        title: strategy.title,
        version: strategy.version || 1,
        research_sources: strategy.research_sources || [],
        research_key_findings: strategy.research_key_findings || [],
        research_gaps: strategy.research_gaps || [],
        research_confidence: strategy.research_confidence || 0.75,
        research_timestamp: strategy.research_timestamp || new Date().toISOString(),
        strategy_objective: strategy.strategy_objective,
        strategy_approach: strategy.strategy_approach,
        strategy_positioning: strategy.strategy_positioning,
        strategy_key_messages: strategy.strategy_key_messages || [],
        strategy_narratives: strategy.strategy_narratives || [],
        strategy_timeline: strategy.strategy_timeline,
        strategy_urgency_level: strategy.strategy_urgency_level || 'medium',
        strategy_rationale: strategy.strategy_rationale,
        created_by: strategy.created_by || 'niv',
        status: strategy.status || 'draft',
        tags: strategy.tags || [],
        workflow_campaign_intelligence: strategy.workflow_campaign_intelligence || { enabled: false },
        workflow_content_generation: strategy.workflow_content_generation || { enabled: false },
        workflow_strategic_planning: strategy.workflow_strategic_planning || { enabled: false },
        workflow_media_outreach: strategy.workflow_media_outreach || { enabled: false },
        framework_data: {
          ...(strategy.framework_data || {}),
          // NEW: Store auto-execution fields
          contentStrategy: strategy.content_strategy || null,
          executionPlan: strategy.execution_plan || null
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger orchestration for enabled workflows
    const orchestrationTriggers = [];

    if (strategy.workflow_campaign_intelligence?.enabled) {
      orchestrationTriggers.push({
        component: 'campaign_intelligence',
        tasks: strategy.workflow_campaign_intelligence.tasks,
        priority: strategy.workflow_campaign_intelligence.priority
      });
    }

    if (strategy.workflow_content_generation?.enabled) {
      orchestrationTriggers.push({
        component: 'content_generation',
        tasks: strategy.workflow_content_generation.tasks,
        priority: strategy.workflow_content_generation.priority
      });
    }

    if (strategy.workflow_strategic_planning?.enabled) {
      orchestrationTriggers.push({
        component: 'strategic_planning',
        tasks: strategy.workflow_strategic_planning.tasks,
        priority: strategy.workflow_strategic_planning.priority
      });
    }

    if (strategy.workflow_media_outreach?.enabled) {
      orchestrationTriggers.push({
        component: 'media_outreach',
        tasks: strategy.workflow_media_outreach.tasks,
        priority: strategy.workflow_media_outreach.priority
      });
    }

    console.log(`🎯 Memory Vault: Strategy saved with ${orchestrationTriggers.length} workflow triggers`);
    orchestrationTriggers.forEach(trigger => {
      console.log(`  - ${trigger.component}: ${trigger.priority} priority`);
    });

    return {
      success: true,
      data: {
        ...data,
        orchestration_triggers: orchestrationTriggers
      },
      message: `Strategy "${strategy.title}" saved successfully with ${orchestrationTriggers.length} workflow triggers`
    };
  } catch (error: any) {
    console.error('Save strategy error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get a strategy by ID
async function getStrategy(strategyId: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('niv_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get recent content of any type
async function getRecentContent(organizationId: string, contentType?: string, limit: number = 50): Promise<ApiResponse> {
  try {
    let query = supabase
      .from('content_library')
      .select('*');

    if (organizationId && organizationId !== '') {
      query = query.eq('organization_id', organizationId);
    }

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get successful patterns and templates
async function getSuccessfulPatterns(organizationId: string, limit: number = 20): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`status.eq.template,tags.cs.{successful,high-performance}`)
      .order('metadata->usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Composite Retrieval Scoring
// Based on OpenMemory's multi-factor ranking approach
// Formula: score = 0.4 × similarity + 0.2 × salience + 0.1 × recency + 0.1 × relationship + 0.2 × execution_success
function scoreContentItems(items: any[], query: string, queryKeywords: string[]): any[] {
  return items.map(item => {
    // 1. Similarity score (0.0-1.0)
    const similarity = calculateSimilarity(item, query, queryKeywords);

    // 2. Salience score (0.0-1.0)
    const salience = item.salience_score ?? 1.0;

    // 3. Recency score (0.0-1.0)
    const recency = calculateRecency(item.created_at, item.last_accessed_at);

    // 4. Relationship strength (0.0-1.0) - future: use related_content_ids
    const relationship = 0.0;

    // 5. Execution success (0.0-1.0)
    const execution_success = calculateExecutionSuccess(item);

    // Composite score with weights
    const composite_score =
      0.4 * similarity +
      0.2 * salience +
      0.1 * recency +
      0.1 * relationship +
      0.2 * execution_success;

    // Generate retrieval reason
    const retrieval_reason = generateRetrievalReason({
      similarity,
      salience,
      recency,
      execution_success,
      item,
      query,
      queryKeywords
    });

    // Calculate confidence
    const confidence = similarity > 0.8 && salience > 0.7 ? 0.95 :
                      execution_success > 0.8 ? 0.9 :
                      similarity > 0.7 ? 0.85 :
                      similarity > 0.5 && salience > 0.5 ? 0.75 :
                      similarity > 0.3 ? 0.6 : 0.5;

    return {
      ...item,
      composite_score,
      score_breakdown: { similarity, salience, recency, relationship, execution_success },
      retrieval_reason,
      confidence
    };
  }).sort((a, b) => b.composite_score - a.composite_score);
}

function calculateSimilarity(item: any, query: string, queryKeywords: string[]): number {
  let score = 0;
  let factors = 0;

  // Keyword overlap
  if (queryKeywords.length > 0) {
    const itemKeywords = [
      ...(item.themes || []),
      ...(item.topics || []),
      item.content_type,
      ...(Array.isArray(item.tags) ? item.tags : [])
    ].map(k => String(k).toLowerCase());

    const matches = queryKeywords.filter(qk =>
      itemKeywords.some(ik => ik.includes(qk) || qk.includes(ik))
    );

    score += matches.length / queryKeywords.length;
    factors++;
  }

  // Title/content match
  if (query) {
    const queryLower = query.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(queryLower) ? 1 : 0;
    const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content || {});
    const contentMatch = contentStr.toLowerCase().includes(queryLower) ? 0.5 : 0;

    score += Math.max(titleMatch, contentMatch);
    factors++;
  }

  return factors > 0 ? score / factors : 0.5;
}

function calculateRecency(created_at: string, last_accessed_at?: string): number {
  const now = Date.now();
  const referenceTime = last_accessed_at || created_at;
  const referenceDate = new Date(referenceTime).getTime();
  const daysAgo = (now - referenceDate) / (1000 * 60 * 60 * 24);

  // Decay curve: e^(-days / 90)
  return Math.max(0.1, Math.min(1.0, Math.exp(-daysAgo / 90)));
}

function calculateExecutionSuccess(item: any): number {
  if (!item.executed) return 0.0;

  if (typeof item.feedback === 'number') {
    return Math.min(1.0, item.feedback / 5);
  }

  if (typeof item.feedback === 'string') {
    const feedbackLower = item.feedback.toLowerCase();
    const positiveWords = ['success', 'great', 'excellent', 'worked', 'effective', 'good'];
    const negativeWords = ['failed', 'poor', 'ineffective', 'bad'];

    const hasPositive = positiveWords.some(word => feedbackLower.includes(word));
    const hasNegative = negativeWords.some(word => feedbackLower.includes(word));

    if (hasPositive && !hasNegative) return 0.9;
    if (hasNegative) return 0.3;
  }

  return 0.5;
}

function generateRetrievalReason(params: any): string {
  const { similarity, salience, recency, execution_success, item, query, queryKeywords } = params;
  const reasons: string[] = [];

  if (similarity > 0.7) {
    const matchedKeywords = queryKeywords.filter((qk: string) =>
      item.themes?.some((t: string) => t.toLowerCase().includes(qk)) ||
      item.topics?.some((t: string) => t.toLowerCase().includes(qk))
    );

    if (matchedKeywords.length > 0) {
      reasons.push(`Strong match: ${matchedKeywords.slice(0, 3).join(', ')}`);
    } else {
      reasons.push(`High relevance to "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`);
    }
  }

  if (execution_success > 0.7) reasons.push('Proven successful');
  if (salience > 0.8) reasons.push('Highly relevant');
  if (recency > 0.8) reasons.push('Recently accessed');
  if (item.content_type) reasons.push(`Type: ${item.content_type}`);

  return reasons.length > 0 ? reasons.join(' • ') : 'General match';
}

// Search all content types with composite scoring
async function searchContent(organizationId: string, query: string, contentType?: string, limit: number = 50): Promise<ApiResponse> {
  try {
    console.log('🔍 Memory Vault Search Parameters:', {
      organizationId,
      query,
      contentType,
      limit
    });

    let allResults: any[] = [];

    // Search content_library table
    let contentQuery = supabase
      .from('content_library')
      .select('*');

    if (organizationId && organizationId !== '') {
      contentQuery = contentQuery.eq('organization_id', organizationId);
    }

    if (contentType && contentType !== 'all') {
      contentQuery = contentQuery.eq('content_type', contentType);
    }

    // Search in title and content
    contentQuery = contentQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`);

    const { data: contentData, error: contentError } = await contentQuery
      .order('created_at', { ascending: false })
      .limit(limit);

    if (contentError) {
      console.error('Error searching content_library:', contentError);
    } else if (contentData) {
      allResults.push(...contentData);
    }

    // ALSO search opportunities table
    let oppQuery = supabase
      .from('opportunities')
      .select('*');

    if (organizationId && organizationId !== '') {
      oppQuery = oppQuery.eq('organization_id', organizationId);
    }

    // Search in opportunity title, description, summary
    oppQuery = oppQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%`);

    const { data: oppData, error: oppError } = await oppQuery
      .order('created_at', { ascending: false })
      .limit(limit);

    if (oppError) {
      console.error('Error searching opportunities:', oppError);
    } else if (oppData) {
      // Format opportunities to match content_library structure
      const formattedOpps = oppData.map(opp => ({
        ...opp,
        content_type: 'opportunity',
        content: opp.description || opp.summary || '',
        // Preserve original opportunity fields
        opportunity_data: opp
      }));
      allResults.push(...formattedOpps);
    }

    console.log('📊 Database query results:', {
      content_library: contentData?.length || 0,
      opportunities: oppData?.length || 0,
      total: allResults.length
    });

    if (allResults.length === 0) {
      // Try broader search without filters to see what exists
      const { data: allContent } = await supabase
        .from('content_library')
        .select('id, title, content_type, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: allOpps } = await supabase
        .from('opportunities')
        .select('id, title, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('📋 Recent content in Memory Vault for this org:', {
        content_library: {
          count: allContent?.length || 0,
          items: allContent?.map(item => ({
            id: item.id,
            title: item.title,
            type: item.content_type,
            created: item.created_at
          }))
        },
        opportunities: {
          count: allOpps?.length || 0,
          items: allOpps?.map(item => ({
            id: item.id,
            title: item.title,
            created: item.created_at
          }))
        }
      });

      return { success: true, data: [] };
    }

    const data = allResults;

    // Apply composite scoring
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    const scoredData = scoreContentItems(data, query, queryKeywords);

    // Return top results
    const topResults = scoredData.slice(0, limit);

    return {
      success: true,
      data: topResults
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get recent strategies for an organization (legacy compatibility)
async function getRecentStrategies(organizationId: string, limit: number = 10): Promise<ApiResponse> {
  try {
    let query = supabase
      .from('niv_strategies')
      .select(`
        id,
        title,
        strategy_objective,
        created_at,
        updated_at,
        status,
        tags,
        version,
        organization_id,
        research_sources,
        research_key_findings,
        strategy_approach,
        strategy_positioning,
        strategy_key_messages,
        strategy_narratives,
        strategy_timeline,
        strategy_urgency_level,
        workflow_campaign_intelligence,
        workflow_content_generation,
        workflow_strategic_planning,
        workflow_media_outreach
      `);

    // Only filter by organization if ID is provided
    if (organizationId && organizationId !== '') {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Search strategies
async function searchStrategies(organizationId: string, query: string, limit: number = 10): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase.rpc('search_niv_strategies', {
      org_id: organizationId,
      search_query: query,
      limit_count: limit
    });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    // Fallback to simple search if the function doesn't exist
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('niv_strategies')
        .select('id, title, strategy_objective, created_at, updated_at, status')
        .eq('organization_id', organizationId)
        .or(`title.ilike.%${query}%,strategy_objective.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return {
        success: true,
        data: fallbackData || []
      };
    } catch (fallbackError: any) {
      return {
        success: false,
        error: fallbackError.message
      };
    }
  }
}

// Update an existing strategy
async function updateStrategy(strategyId: string, updates: Partial<NivStrategy>): Promise<ApiResponse> {
  try {
    // First get the current version
    const { data: current, error: fetchError } = await supabase
      .from('niv_strategies')
      .select('version')
      .eq('id', strategyId)
      .single();

    if (fetchError) throw fetchError;

    // Increment version number
    const newVersion = (current.version || 1) + 1;

    const { data, error } = await supabase
      .from('niv_strategies')
      .update({
        ...updates,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
      message: `Strategy updated to version ${newVersion}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Delete a strategy
async function deleteStrategy(strategyId: string): Promise<ApiResponse> {
  try {
    const { error } = await supabase
      .from('niv_strategies')
      .delete()
      .eq('id', strategyId);

    if (error) throw error;

    return {
      success: true,
      message: 'Strategy deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get strategy with execution history
async function getStrategyWithExecutions(strategyId: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase.rpc('get_strategy_with_executions', {
      strategy_uuid: strategyId
    });

    if (error) throw error;

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : null
    };
  } catch (error: any) {
    // Fallback to basic strategy fetch
    return await getStrategy(strategyId);
  }
}

// Export strategies for backup
async function exportStrategies(organizationId: string): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('niv_strategies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: {
        exportDate: new Date().toISOString(),
        organizationId,
        strategies: data || [],
        count: data?.length || 0
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;

    // For POST requests, action can be in body OR query params
    let action = url.searchParams.get('action');
    let body: any = null;

    if (method === 'POST' || method === 'PUT') {
      body = await req.json();
      // Prefer action from body if present
      if (body.action) {
        action = body.action;
      }
    }

    let result: ApiResponse;

    if (method === 'GET') {
      const strategyId = url.searchParams.get('id');
      const organizationId = url.searchParams.get('organizationId');
      const query = url.searchParams.get('query');
      const contentType = url.searchParams.get('contentType');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      switch (action) {
        case 'get':
          if (!strategyId) throw new Error('Content ID required');
          result = await getStrategy(strategyId);
          break;

        case 'recent':
          // Get recent content of any type
          result = await getRecentContent(organizationId || '', contentType, limit);
          break;

        case 'recentStrategies':
          // Legacy endpoint for strategies
          result = await getRecentStrategies(organizationId || '', limit);
          break;

        case 'patterns':
          // Get successful patterns and templates
          if (!organizationId) throw new Error('Organization ID required');
          result = await getSuccessfulPatterns(organizationId, limit);
          break;

        case 'search':
          if (!query) throw new Error('Search query required');
          result = await searchContent(organizationId || '', query, contentType, limit);
          break;

        case 'searchStrategies':
          // Legacy search for strategies
          if (!organizationId || !query) throw new Error('Organization ID and query required');
          result = await searchStrategies(organizationId, query, limit);
          break;

        case 'withExecutions':
          if (!strategyId) throw new Error('Strategy ID required');
          result = await getStrategyWithExecutions(strategyId);
          break;

        case 'export':
          if (!organizationId) throw new Error('Organization ID required');
          result = await exportStrategies(organizationId);
          break;

        default:
          throw new Error('Invalid action. Use: get, recent, recentStrategies, patterns, search, searchStrategies, withExecutions, export');
      }
    } else if (method === 'POST') {
      // Body already parsed above

      switch (action) {
        case 'search':
          // Support search via POST for function invocations
          if (!body.query) throw new Error('Search query required');
          result = await searchContent(
            body.organizationId || '',
            body.query,
            body.contentType,
            body.limit || 50
          );
          break;

        case 'save':
          // Accept either 'content' or 'strategy' for backward compatibility
          const contentData = body.content || body.strategy;
          if (!contentData) throw new Error('Content data required');

          // Route to appropriate save function
          if (body.strategy) {
            // NIV strategies go to niv_strategies table for orchestration triggers
            result = await saveStrategy(body.strategy);
          } else {
            // Other content goes to content_library
            if (!contentData.content_type) {
              contentData.content_type = 'content';
            }
            result = await saveContent(contentData);
          }
          break;

        case 'saveStrategy':
          // Legacy endpoint
          if (!body.strategy) throw new Error('Strategy data required');
          result = await saveStrategy(body.strategy);
          break;

        case 'trackSuccess':
          // Track when content performs well
          if (!body.contentId) throw new Error('Content ID required');
          const { data: tracked, error: trackError } = await supabase
            .from('content_library')
            .update({
              'metadata': supabase.rpc('jsonb_set', [
                'metadata',
                '{usage_count}',
                `(COALESCE(metadata->>'usage_count', '0')::int + 1)::text::jsonb`
              ]),
              'tags': supabase.rpc('array_append', ['tags', 'successful'])
            })
            .eq('id', body.contentId);

          result = trackError
            ? { success: false, error: trackError.message }
            : { success: true, message: 'Success tracked' };
          break;

        default:
          throw new Error('Invalid action for POST. Use: search, save, saveStrategy, trackSuccess');
      }
    } else if (method === 'PUT') {
      // Body already parsed above
      const strategyId = url.searchParams.get('id');

      switch (action) {
        case 'update':
          if (!strategyId) throw new Error('Strategy ID required');
          if (!body.updates) throw new Error('Update data required');
          result = await updateStrategy(strategyId, body.updates);
          break;

        default:
          throw new Error('Invalid action for PUT. Use: update');
      }
    } else if (method === 'DELETE') {
      const strategyId = url.searchParams.get('id');

      switch (action) {
        case 'delete':
          if (!strategyId) throw new Error('Strategy ID required');
          result = await deleteStrategy(strategyId);
          break;

        default:
          throw new Error('Invalid action for DELETE. Use: delete');
      }
    } else {
      throw new Error(`Method ${method} not supported`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400
      }
    );

  } catch (error: any) {
    console.error('NIV Memory Vault Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});