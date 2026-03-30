import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Memory management tools
const TOOLS = [
  {
    name: "search_memory",
    description: "Search the MemoryVault for relevant information",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        searchType: { 
          type: "string", 
          enum: ["semantic", "keyword", "hybrid"],
          description: "Search type",
          default: "hybrid"
        },
        limit: { type: "number", description: "Max results", default: 10 }
      },
      required: ["query"]
    }
  },
  {
    name: "add_to_memory",
    description: "Add new information to the MemoryVault",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title" },
        content: { type: "string", description: "Content to store" },
        category: { type: "string", description: "Category" },
        tags: { type: "array", items: { type: "string" }, description: "Tags" },
        metadata: { type: "object", description: "Additional metadata" }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "get_memory_context",
    description: "Get related context for a memory item or topic",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Memory item ID" },
        topic: { type: "string", description: "Topic to get context for" },
        depth: { type: "number", description: "Levels of related items", default: 1 }
      }
    }
  },
  {
    name: "list_memory_categories",
    description: "List all categories in MemoryVault",
    inputSchema: {
      type: "object",
      properties: {
        includeCount: { type: "boolean", description: "Include item count", default: true }
      }
    }
  },
  {
    name: "update_memory",
    description: "Update an existing memory item",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Memory item ID" },
        title: { type: "string", description: "Updated title" },
        content: { type: "string", description: "Updated content" },
        category: { type: "string", description: "Updated category" },
        tags: { type: "array", items: { type: "string" }, description: "Updated tags" }
      },
      required: ["itemId"]
    }
  },
  {
    name: "delete_memory",
    description: "Delete a memory item",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Memory item ID to delete" }
      },
      required: ["itemId"]
    }
  }
];

// Tool implementations
async function searchMemory(args: any) {
  const { query, searchType = 'hybrid', limit = 10 } = args;
  
  // For keyword search
  const { data, error } = await supabase
    .from('memoryvault_items')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(limit)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return {
    results: data || [],
    count: data?.length || 0,
    searchType,
    query
  };
}

async function addToMemory(args: any) {
  const { title, content, category = 'general', tags = [], metadata = {} } = args;
  
  const { data, error } = await supabase
    .from('memoryvault_items')
    .insert({
      title,
      content,
      category,
      tags,
      metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    itemId: data.id,
    title: data.title,
    category: data.category,
    message: `Memory item "${title}" added successfully`
  };
}

async function getMemoryContext(args: any) {
  const { itemId, topic, depth = 1 } = args;
  
  if (itemId) {
    // Get specific item and related items
    const { data: item, error } = await supabase
      .from('memoryvault_items')
      .select('*')
      .eq('id', itemId)
      .single();
    
    if (error) throw error;
    
    // Get related items by tags or category
    const { data: related } = await supabase
      .from('memoryvault_items')
      .select('*')
      .or(`category.eq.${item.category},tags.ov.{${item.tags?.join(',')}}`)
      .neq('id', itemId)
      .limit(depth * 5);
    
    return {
      item,
      relatedItems: related || [],
      depth
    };
  } else if (topic) {
    // Search for topic-related items
    const { data, error } = await supabase
      .from('memoryvault_items')
      .select('*')
      .or(`title.ilike.%${topic}%,content.ilike.%${topic}%,category.ilike.%${topic}%`)
      .limit(depth * 10)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      topic,
      items: data || [],
      count: data?.length || 0
    };
  }
  
  throw new Error('Either itemId or topic must be provided');
}

async function listMemoryCategories(args: any) {
  const { includeCount = true } = args;
  
  // Get all unique categories
  const { data, error } = await supabase
    .from('memoryvault_items')
    .select('category')
    .order('category');
  
  if (error) throw error;
  
  // Count items per category
  const categories = new Map<string, number>();
  data?.forEach(item => {
    const cat = item.category || 'uncategorized';
    categories.set(cat, (categories.get(cat) || 0) + 1);
  });
  
  if (includeCount) {
    return {
      categories: Array.from(categories.entries()).map(([name, count]) => ({
        name,
        count
      }))
    };
  } else {
    return {
      categories: Array.from(categories.keys())
    };
  }
}

async function updateMemory(args: any) {
  const { itemId, title, content, category, tags } = args;
  
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  
  updates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('memoryvault_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    itemId: data.id,
    title: data.title,
    message: 'Memory item updated successfully'
  };
}

async function deleteMemory(args: any) {
  const { itemId } = args;
  
  const { error } = await supabase
    .from('memoryvault_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
  
  return {
    itemId,
    message: 'Memory item deleted successfully'
  };
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
      case 'search_memory':
        result = await searchMemory(args);
        break;
      case 'add_to_memory':
        result = await addToMemory(args);
        break;
      case 'get_memory_context':
        result = await getMemoryContext(args);
        break;
      case 'list_memory_categories':
        result = await listMemoryCategories(args);
        break;
      case 'update_memory':
        result = await updateMemory(args);
        break;
      case 'delete_memory':
        result = await deleteMemory(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Memory Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});