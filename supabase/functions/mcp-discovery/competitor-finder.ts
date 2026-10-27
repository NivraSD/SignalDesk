// Who a company actually competes with, from evidence rather than its industry label.
// "E-commerce" covers Walmart and a three-person Shopify agency alike; competitors are the companies
// that sell the same thing to the same buyers. So: read what the company sells from its own site,
// then search the web (Gemini grounded in Google Search) for companies selling that to those buyers.
// Platforms and partners the company depends on (Shopify, for a Shopify agency) are kept apart.
import { callGeminiFlash } from '../_shared/gemini-flash.ts'

export type CompetitorFinding = {
  offering: string                  // what they sell, specifically
  buyers: string                    // who buys it
  business_model: string
  size: string
  direct_competitors: { name: string; why: string }[]
  indirect_competitors: { name: string; why: string }[]
  ecosystem: { name: string; relationship: string }[]   // platforms, partners, channels they depend on
  rejected: string[]                // big names that only share the broad industry
}

function parseJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  return JSON.parse(raw)
}

export async function findCompetitors(p: {
  name: string
  website?: string
  siteText?: string
  industryHint?: string
  namedCompetitors?: string[]       // ones the company told us about itself (always kept)
}): Promise<CompetitorFinding | null> {
  const prompt = `Company: ${p.name}${p.website ? ` (${p.website})` : ''}
${p.industryHint ? `Broad industry they gave (context only; industries are broad, don't pick competitors from it): ${p.industryHint}` : ''}
${p.namedCompetitors?.length ? `Competitors they named themselves: ${p.namedCompetitors.join(', ')}` : ''}

Their website says:
"""
${(p.siteText || '(not available)').slice(0, 6000)}
"""

1. From the website, say precisely what ${p.name} sells, to whom, how they make money, and roughly how big they are. Be specific (e.g. "custom Shopify store design and development agency for DTC brands", not "e-commerce").
2. Search the web to find their real competitors: companies that sell that same thing to those same buyers, at a similar scale. Useful searches: "${p.name} competitors", "${p.name} alternatives", "${p.name} vs", and searches for the specific offering (e.g. "Shopify Plus agencies", "best <offering> companies"). Prefer names that show up alongside ${p.name} in comparisons, directories, reviews and partner listings.
3. Separately, list the platforms, partners and channels ${p.name} depends on or builds on (e.g. Shopify for a Shopify agency, Salesforce for a Salesforce consultancy, Walmart as a retail channel for a food brand). These matter to monitor but are not competitors. One specific company per entry, by name; no categories like "retail chains".
4. Do NOT list giant companies that merely share the broad industry (a Shopify agency doesn't compete with Walmart or Amazon; a K-12 edtech startup doesn't compete with Google). Put any such names you considered in "rejected".

Return only JSON:
{"offering": "...", "buyers": "...", "business_model": "...", "size": "...",
 "direct_competitors": [{"name": "...", "why": "one line: what they sell that overlaps"}],   // 6-12, real companies only
 "indirect_competitors": [{"name": "...", "why": "..."}],                                  // 0-6
 "ecosystem": [{"name": "...", "relationship": "platform | partner | channel | supplier, one line"}],
 "rejected": ["..."]}`
  try {
    const text = await callGeminiFlash(prompt, { googleSearch: true, maxOutputTokens: 6000, timeoutMs: 75000 })
    const j = parseJson(text)
    const clean = (xs: any[]) => (Array.isArray(xs) ? xs : [])
      .filter((x) => x?.name && typeof x.name === 'string')
      .filter((x) => x.name.toLowerCase() !== p.name.toLowerCase())
    return {
      offering: String(j.offering || ''), buyers: String(j.buyers || ''), business_model: String(j.business_model || ''), size: String(j.size || ''),
      direct_competitors: clean(j.direct_competitors).slice(0, 15),
      indirect_competitors: clean(j.indirect_competitors).slice(0, 8),
      ecosystem: (Array.isArray(j.ecosystem) ? j.ecosystem : []).filter((x: any) => x?.name).slice(0, 8),
      rejected: (Array.isArray(j.rejected) ? j.rejected : []).map(String),
    }
  } catch (e) {
    console.warn('   ⚠️ Grounded competitor search failed:', e instanceof Error ? e.message : e)
    return null
  }
}
