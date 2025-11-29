const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function test() {
  // Fetch WSJ Google News sitemap
  const sitemapUrl = "https://www.wsj.com/wsjsitemaps/wsj_google_news.xml";
  const res = await fetch(sitemapUrl, { headers: { "User-Agent": USER_AGENT } });
  const xml = await res.text();

  console.log("Sitemap length:", xml.length);

  // Parse
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  console.log("URL blocks found:", urlBlocks.length);

  // Check date filtering
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

  let validCount = 0;
  let dateFilteredCount = 0;
  let validationFailedCount = 0;
  const validArticles = [];

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    if (!locMatch) continue;
    const url = locMatch[1];

    // Date filter
    const dateMatch = block.match(/<news:publication_date>(.*?)<\/news:publication_date>/);
    if (dateMatch) {
      const articleDate = new Date(dateMatch[1]);
      if (articleDate < fortyEightHoursAgo) {
        dateFilteredCount++;
        continue;
      }
    }

    // Validation
    const urlLower = url.toLowerCase();
    const hasHashSuffix = /[a-f0-9]{8}$/i.test(url);
    const isContentSection = urlLower.includes("/business") ||
                             urlLower.includes("/politics") ||
                             urlLower.includes("/tech") ||
                             urlLower.includes("/world") ||
                             urlLower.includes("/finance") ||
                             urlLower.includes("/markets") ||
                             urlLower.includes("/opinion") ||
                             urlLower.includes("/lifestyle") ||
                             urlLower.includes("/arts-culture") ||
                             urlLower.includes("/health");

    const isValid = hasHashSuffix && isContentSection;
    if (isValid) {
      validCount++;
      validArticles.push({ url, date: dateMatch ? dateMatch[1] : 'none' });
    } else {
      validationFailedCount++;
      if (validationFailedCount <= 5) {
        console.log("Failed validation:", url.substring(20, 80));
        console.log("  hasHash:", hasHashSuffix, "isSection:", isContentSection);
      }
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log("Total URL blocks:", urlBlocks.length);
  console.log("Filtered by date (>48h old):", dateFilteredCount);
  console.log("Failed URL validation:", validationFailedCount);
  console.log("Valid articles:", validCount);

  console.log("\n=== SAMPLE VALID ARTICLES ===");
  validArticles.slice(0, 10).forEach(a => {
    console.log(a.url);
    console.log("  Date:", a.date);
  });
}

test().catch(console.error);
