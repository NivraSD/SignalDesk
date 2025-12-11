import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('=== NewsAPI WSJ Importer ===')
    console.log(`Started at: ${new Date().toISOString()}`)

    // Fetch WSJ articles from NewsAPI
    const newsApiUrl = 'https://newsapi.org/v2/everything?domains=wsj.com&pageSize=100&sortBy=publishedAt&language=en'

    console.log('Fetching from NewsAPI...')
    const response = await fetch(newsApiUrl, {
      headers: {
        'X-Api-Key': NEWS_API_KEY
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NewsAPI error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned error: ${JSON.stringify(data)}`)
    }

    const articles = data.articles || []
    console.log(`Found ${articles.length} WSJ articles from NewsAPI`)

    // Import articles into raw_articles
    let imported = 0
    let duplicates = 0
    let errors = 0

    for (const article of articles) {
      // Skip articles without title
      if (!article.title) continue

      // Skip "removed" articles
      if (article.title === '[Removed]') continue

      const payload = {
        title: article.title,
        description: article.description || null,
        url: article.url,
        source_name: 'Wall Street Journal',
        published_at: article.publishedAt,
        scrape_status: 'metadata_only',
        scraped_at: article.publishedAt
      }

      // Use upsert with URL as the conflict key
      const { error } = await supabase
        .from('raw_articles')
        .upsert(payload, {
          onConflict: 'url',
          ignoreDuplicates: true
        })

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          duplicates++
        } else {
          console.error(`Error inserting article: ${error.message}`)
          errors++
        }
      } else {
        imported++
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      total_fetched: articles.length,
      imported: imported,
      duplicates: duplicates,
      errors: errors
    }

    console.log('=== Import Complete ===')
    console.log(JSON.stringify(result, null, 2))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
