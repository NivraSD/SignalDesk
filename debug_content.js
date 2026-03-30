const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://zskaxjtyuaqazydouifp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM"
);

async function analyze() {
  // Find articles that contain the country list garbage
  const { data: articles } = await supabase
    .from("raw_articles")
    .select("id, title, description, source_name, full_content")
    .eq("scrape_status", "completed")
    .ilike("full_content", "%LesothoLiberia%")
    .limit(5);

  console.log(`Found ${articles?.length || 0} articles with country list garbage\n`);

  for (const article of articles || []) {
    console.log("---");
    console.log("Source:", article.source_name);
    console.log("Title:", article.title);
    console.log("Description:", article.description?.substring(0, 100));

    // Find where the garbage starts
    const countryIdx = article.full_content?.indexOf("LesothoLiberia");
    console.log("Country list starts at char:", countryIdx, "of", article.full_content?.length);
    console.log();
  }
}
analyze();
