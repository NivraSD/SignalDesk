// External Data Fetcher - Gets real-time competitor data from multiple sources
// Combines Yahoo Finance (for public companies) and web search (for all companies)

// Fetch competitors from Yahoo Finance
export async function fetchYahooFinanceCompetitors(organizationName: string): Promise<string[]> {
  console.log(`📊 Fetching Yahoo Finance competitors for ${organizationName}`);
  
  try {
    // First, we need to get the ticker symbol
    // Try common variations of the company name
    const searchVariations = [
      organizationName,
      organizationName.toUpperCase(),
      organizationName.replace(/\s+Inc\.?|\s+Corp\.?|\s+LLC/gi, ''),
      organizationName.split(' ')[0] // First word only (e.g., "Microsoft" from "Microsoft Corporation")
    ];
    
    for (const searchTerm of searchVariations) {
      try {
        // Yahoo Finance quote endpoint to get ticker and peers
        const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(quoteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
          }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const quote = data?.quoteResponse?.result?.[0];
        
        if (!quote?.symbol) continue;
        
        // Now get the company profile with peers
        const profileUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${quote.symbol}?modules=recommendationTrend,summaryProfile,competitors`;
        const profileResponse = await fetch(profileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
          }
        });
        
        if (!profileResponse.ok) continue;
        
        const profileData = await profileResponse.json();
        const competitors = profileData?.quoteSummary?.result?.[0]?.competitors?.competitors || [];
        
        if (competitors.length > 0) {
          console.log(`   ✅ Found ${competitors.length} competitors from Yahoo Finance`);
          return competitors.map((c: any) => c.name || c.symbol).filter((c: string) => c);
        }
      } catch (e) {
        // Try next variation
        continue;
      }
    }
    
    console.log(`   ⚠️ No Yahoo Finance data found for ${organizationName}`);
    return [];
    
  } catch (error) {
    console.error('Yahoo Finance error:', error);
    return [];
  }
}

// Search web for competitors using DuckDuckGo (no API key required)
export async function searchWebForCompetitors(organizationName: string): Promise<string[]> {
  console.log(`🔍 Searching web for ${organizationName} competitors`);
  
  try {
    const competitors = new Set<string>();
    
    // Search queries to find competitors
    const searchQueries = [
      `${organizationName} competitors`,
      `companies like ${organizationName}`,
      `${organizationName} vs`,
      `${organizationName} alternatives`,
      `${organizationName} market share competitors`
    ];
    
    for (const query of searchQueries) {
      try {
        // Use DuckDuckGo HTML search (no API needed)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
          }
        });
        
        if (!response.ok) continue;
        
        const html = await response.text();
        
        // Extract competitor names from search results using patterns
        // Look for "vs CompanyName" or "CompanyName vs" patterns
        const vsPattern = /(?:vs\.?|versus)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s|,|\.|\)|<)/gi;
        const matches = html.matchAll(vsPattern);
        
        for (const match of matches) {
          const companyName = match[1].trim();
          // Filter out common words and the organization itself
          if (companyName.length > 2 && 
              !companyName.toLowerCase().includes(organizationName.toLowerCase()) &&
              !['the', 'and', 'or', 'in', 'with'].includes(companyName.toLowerCase())) {
            competitors.add(companyName);
          }
        }
        
        // Also look for lists like "competitors include X, Y, Z"
        const listPattern = /competitors?\s+(?:include|are|such as)[:\s]+([^.]+)/gi;
        const listMatches = html.matchAll(listPattern);
        
        for (const match of listMatches) {
          const competitorList = match[1];
          // Split by common separators
          const names = competitorList.split(/,|\sand\s|\sor\s/);
          for (const name of names) {
            const cleaned = name.trim().replace(/<[^>]*>/g, '');
            if (cleaned.length > 2 && cleaned.length < 50) {
              competitors.add(cleaned);
            }
          }
        }
        
        // Limit to prevent too many results
        if (competitors.size > 20) break;
        
      } catch (e) {
        console.error(`Search error for query "${query}":`, e);
        continue;
      }
    }
    
    const competitorList = Array.from(competitors).slice(0, 15); // Limit to top 15
    console.log(`   ✅ Found ${competitorList.length} potential competitors from web search`);
    return competitorList;
    
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// Combined fetcher that uses both sources
export async function fetchRealTimeCompetitors(organizationName: string): Promise<{
  yahooFinance: string[],
  webSearch: string[],
  combined: string[]
}> {
  console.log(`🌐 Fetching real-time competitor data for ${organizationName}`);
  
  // Run both in parallel for speed
  const [yahooCompetitors, webCompetitors] = await Promise.all([
    fetchYahooFinanceCompetitors(organizationName),
    searchWebForCompetitors(organizationName)
  ]);
  
  // Combine and deduplicate
  const allCompetitors = new Set<string>();
  
  // Add Yahoo Finance competitors (most reliable)
  yahooCompetitors.forEach(c => allCompetitors.add(c));
  
  // Add web search competitors
  webCompetitors.forEach(c => {
    // Basic normalization to avoid duplicates
    const normalized = c.replace(/\s+Inc\.?|\s+Corp\.?|\s+LLC|\s+Ltd\.?/gi, '').trim();
    if (normalized && !Array.from(allCompetitors).some(existing => 
      existing.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(existing.toLowerCase())
    )) {
      allCompetitors.add(c);
    }
  });
  
  const combined = Array.from(allCompetitors);
  
  console.log(`   📊 Combined results: ${yahooCompetitors.length} from Yahoo, ${webCompetitors.length} from web, ${combined.length} total unique`);
  
  return {
    yahooFinance: yahooCompetitors,
    webSearch: webCompetitors,
    combined: combined
  };
}