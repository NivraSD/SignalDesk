// Batch Embed Targets
// Embeds intelligence targets that haven't been embedded yet
// Uses Voyage AI for embeddings

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!;

const BATCH_SIZE = 50;
const MAX_TEXT_LENGTH = 8000;

interface IntelligenceTarget {
  id: string;
  name: string;
  target_type: string;
  monitoring_context: string | null;
  keywords: string[] | null;
  monitoring_keywords: string[] | null;
  accumulated_context: string | Record<string, unknown> | null;
  priority: string | null;
  organization_id: string;
  organization?: {
    name: string;
    industry: string | null;
  };
}

function buildTargetEmbeddingText(target: IntelligenceTarget): string {
  const parts: string[] = [];

  // Target identity
  parts.push(`Target: ${target.name}`);
  parts.push(`Type: ${target.target_type}`);

  if (target.priority) {
    parts.push(`Priority: ${target.priority}`);
  }

  // Monitoring context is key context
  if (target.monitoring_context) {
    parts.push(`Context: ${target.monitoring_context}`);
  }

  // Keywords expand semantic matching
  if (target.keywords?.length) {
    parts.push(`Keywords: ${target.keywords.join(', ')}`);
  }

  // Monitoring keywords for additional matching
  if (target.monitoring_keywords?.length) {
    parts.push(`Monitoring Keywords: ${target.monitoring_keywords.join(', ')}`);
  }

  // Accumulated context adds business relevance
  if (target.accumulated_context) {
    const accContext = typeof target.accumulated_context === 'string'
      ? target.accumulated_context
      : JSON.stringify(target.accumulated_context);
    parts.push(`Accumulated Context: ${accContext.slice(0, 1000)}`);
  }

  // Org context helps with industry-relevant matching
  if (target.organization?.name) {
    parts.push(`Organization: ${target.organization.name}`);
  }
  if (target.organization?.industry) {
    parts.push(`Industry: ${target.organization.industry}`);
  }

  const text = parts.join('\n');
  return text.slice(0, MAX_TEXT_LENGTH);
}

async function embedTexts(texts: string[]): Promise<number[][] | null> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3',
        input: texts,
        input_type: 'document'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Voyage API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  } catch (error) {
    console.error('Error calling Voyage API:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || BATCH_SIZE;
    const organizationId = body.organization_id; // Optional: embed only for specific org

    console.log('🎯 BATCH EMBED TARGETS');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Batch size: ${batchSize}`);
    if (organizationId) {
      console.log(`   Organization: ${organizationId}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Build query for targets that need embedding
    let query = supabase
      .from('intelligence_targets')
      .select(`
        id, name, target_type, monitoring_context, keywords,
        monitoring_keywords, accumulated_context, priority, organization_id,
        organization:organizations(name, industry)
      `)
      .is('embedding', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(batchSize);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: targets, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch targets: ${fetchError.message}`);
    }

    if (!targets || targets.length === 0) {
      console.log('   No targets to embed');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No targets need embedding'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${targets.length} targets to embed`);

    // Build embedding texts and store the context
    const embeddingData = targets.map(t => {
      const text = buildTargetEmbeddingText(t as IntelligenceTarget);
      return { target: t, text };
    });

    const texts = embeddingData.map(d => d.text);
    console.log(`   Average text length: ${Math.round(texts.reduce((a, t) => a + t.length, 0) / texts.length)} chars`);

    // Get embeddings from Voyage
    console.log('   Calling Voyage AI...');
    const embeddings = await embedTexts(texts);

    if (!embeddings) {
      throw new Error('Failed to get embeddings from Voyage AI');
    }

    console.log(`   Got ${embeddings.length} embeddings`);

    // Update targets with embeddings
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      // pgvector expects embedding as a string like "[0.1, 0.2, ...]"
      const embeddingStr = JSON.stringify(embeddings[i]);
      const { error: updateError } = await supabase
        .from('intelligence_targets')
        .update({
          embedding: embeddingStr,
          embedding_context: embeddingData[i].text,
          embedded_at: new Date().toISOString()
        })
        .eq('id', targets[i].id);

      if (updateError) {
        console.error(`   Failed to update target ${targets[i].id}: ${updateError.message}`);
        failCount++;
      } else {
        successCount++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('📊 RESULTS:');
    console.log(`   Processed: ${targets.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Duration: ${duration}s`);

    // Log job to embedding_jobs table
    await supabase.from('embedding_jobs').insert({
      job_type: 'targets',
      status: 'completed',
      items_total: targets.length,
      items_processed: successCount,
      items_failed: failCount,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      metadata: organizationId ? { organization_id: organizationId } : null
    });

    return new Response(JSON.stringify({
      success: true,
      processed: targets.length,
      embedded: successCount,
      failed: failCount,
      duration_seconds: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
