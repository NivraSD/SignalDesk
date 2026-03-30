// Simple journalist lookup - HARDCODED DATA like master-source-registry
// NO DATABASE, NO RLS BULLSHIT
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getJournalists } from "./journalists-data.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { industry, tier = 'tier1', count = 20 } = await req.json();

    console.log(`📊 Journalist lookup: industry=${industry}, tier=${tier}, count=${count}`);

    // Get journalists from HARDCODED data - no database query
    const allJournalists = getJournalists(industry, tier);

    console.log(`✅ Found ${allJournalists.length} journalists from hardcoded registry`);

    // Limit to requested count
    const journalists = allJournalists.slice(0, count);

    if (journalists.length > 0) {
      console.log(`   Sample journalist:`, journalists[0]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        journalists: journalists,
        count: journalists.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        journalists: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
