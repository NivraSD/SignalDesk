// Master Source Registry - COMPREHENSIVE VERSION WITH ALL SOURCES
// From MasterSourceRegistry.js - includes all industries, sources, search queries, track URLs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

/**
 * Intelligent industry mapping - converts ANY industry name to supported categories
 * Returns null if no mapping found (will check exact match)
 */
function mapIndustryToCategory(industryInput: string): string | null {
  const input = industryInput.toLowerCase().replace(/[^a-z]/g, '')

  // TECHNOLOGY - AI, Software, SaaS, Cloud, etc.
  if (
    input.includes('artificial') || input.includes('intelligence') ||
    input.includes('ai') || input.includes('machine') || input.includes('learning') ||
    input.includes('software') || input.includes('saas') || input.includes('cloud') ||
    input.includes('tech') || input.includes('computing') || input.includes('cyber') ||
    input.includes('data') || input.includes('analytics') || input.includes('internet') ||
    input.includes('digital') || input.includes('semiconductor') || input.includes('chip') ||
    input.includes('hardware') || input.includes('electronics') || input.includes('gaming') ||
    input.includes('esports') || input.includes('social') || input.includes('media') && input.includes('tech')
  ) {
    return 'technology'
  }

  // HEALTHCARE - Biotech, Pharma, Medical, Health Insurance
  if (
    input.includes('health') || input.includes('medical') || input.includes('pharma') ||
    input.includes('biotech') || input.includes('clinical') || input.includes('hospital') ||
    input.includes('drug') || input.includes('therapeutic') || input.includes('medicine') ||
    input.includes('life') && input.includes('science') || input.includes('diagnostic') ||
    input.includes('wellness') || input.includes('fitness') || input.includes('nutrition')
  ) {
    return 'healthcare'
  }

  // FINANCIAL SERVICES - Banking, Fintech, Insurance, Investment
  if (
    input.includes('financ') || input.includes('bank') || input.includes('fintech') ||
    input.includes('payment') || input.includes('credit') || input.includes('insurance') ||
    input.includes('invest') || input.includes('capital') || input.includes('trading') ||
    input.includes('crypto') || input.includes('blockchain') || input.includes('asset') ||
    input.includes('wealth') || input.includes('lending') || input.includes('mortgage')
  ) {
    return 'financial_services'
  }

  // AUTOMOTIVE - Cars, EVs, Autonomous Vehicles
  if (
    input.includes('auto') || input.includes('vehicle') || input.includes('car') ||
    input.includes('electric') && input.includes('vehicle') || input.includes('ev') ||
    input.includes('transport') || input.includes('mobility') || input.includes('autonomous')
  ) {
    return 'automotive'
  }

  // RETAIL & E-COMMERCE
  if (
    input.includes('retail') || input.includes('ecommerce') || input.includes('commerce') ||
    input.includes('consumer') || input.includes('shopping') || input.includes('marketplace') ||
    input.includes('fashion') || input.includes('apparel') || input.includes('grocery') ||
    input.includes('brand') || input.includes('luxury')
  ) {
    return 'retail'
  }

  // ENERGY - Oil & Gas, Renewable, Utilities
  if (
    input.includes('energy') || input.includes('oil') || input.includes('gas') ||
    input.includes('solar') || input.includes('wind') || input.includes('renewable') ||
    input.includes('power') || input.includes('electric') && input.includes('utility') ||
    input.includes('battery') || input.includes('nuclear')
  ) {
    return 'energy'
  }

  // REAL ESTATE & CONSTRUCTION
  if (
    input.includes('real') && input.includes('estate') || input.includes('property') ||
    input.includes('construction') || input.includes('housing') || input.includes('building') ||
    input.includes('reit')
  ) {
    return 'real_estate'
  }

  // FOOD & BEVERAGE
  if (
    input.includes('food') || input.includes('beverage') || input.includes('restaurant') ||
    input.includes('agriculture') || input.includes('farming') || input.includes('agtech')
  ) {
    return 'food_beverage'
  }

  // MANUFACTURING & INDUSTRIAL
  if (
    input.includes('manufactur') || input.includes('industrial') || input.includes('factory') ||
    input.includes('supply') && input.includes('chain') || input.includes('logistics')
  ) {
    return 'manufacturing'
  }

  // TELECOMMUNICATIONS
  if (
    input.includes('telecom') || input.includes('wireless') || input.includes('mobile') ||
    input.includes('network') || input.includes('broadband') || input.includes('fiber')
  ) {
    return 'telecommunications'
  }

  // MEDIA & ENTERTAINMENT
  if (
    input.includes('media') || input.includes('entertainment') || input.includes('film') ||
    input.includes('music') || input.includes('streaming') || input.includes('content') ||
    input.includes('publishing') || input.includes('news')
  ) {
    return 'media_entertainment'
  }

  // EDUCATION
  if (
    input.includes('education') || input.includes('edtech') || input.includes('learning') ||
    input.includes('university') || input.includes('school') || input.includes('academic')
  ) {
    return 'education'
  }

  // TRAVEL & HOSPITALITY
  if (
    input.includes('travel') || input.includes('tourism') || input.includes('hotel') ||
    input.includes('hospitality') || input.includes('airline') || input.includes('aviation')
  ) {
    return 'travel_hospitality'
  }

  // LEGAL & PROFESSIONAL SERVICES
  if (
    input.includes('legal') || input.includes('law') || input.includes('consulting') ||
    input.includes('professional') && input.includes('service')
  ) {
    return 'professional_services'
  }

  // AEROSPACE & DEFENSE
  if (
    input.includes('aerospace') || input.includes('defense') || input.includes('military') ||
    input.includes('aviation') || input.includes('space')
  ) {
    return 'aerospace_defense'
  }

  // CONGLOMERATE & DIVERSIFIED TRADING HOUSES
  if (
    input.includes('conglomerate') || input.includes('diversified') || input.includes('holding') ||
    input.includes('trading') && input.includes('house') || input.includes('sogo') || input.includes('shosha') ||
    input.includes('trading') && input.includes('investment') || input.includes('multi') && input.includes('industry')
  ) {
    return 'conglomerate'
  }

  // PUBLIC RELATIONS & COMMUNICATIONS - PR agencies, strategic communications (NOT management consulting)
  if (
    input.includes('public') && input.includes('relations') || input.includes('publicrelations') ||
    input.includes('communications') && !input.includes('consulting') // Exclude "strategic communications consulting" - that's professional services
  ) {
    return 'public_relations'
  }

  // No match found - will check exact industry key
  return null
}

// TIER 1 SOURCES - Always included regardless of industry
const TIER1_SOURCES = {
  mainstream_media: [
    { name: 'Wall Street Journal', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', type: 'rss', priority: 'critical' },
    { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', type: 'rss', priority: 'critical' },
    { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/businessNews', type: 'rss', priority: 'critical' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', type: 'rss', priority: 'critical' },
    { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'rss', priority: 'critical' },
    { name: 'CNN Business', url: 'https://www.cnn.com/services/rss/', type: 'rss', priority: 'critical' },
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', type: 'rss', priority: 'critical' },
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', type: 'rss', priority: 'critical' },
    { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/', type: 'rss', priority: 'critical' },
    { name: 'Fortune', url: 'https://fortune.com/feed/', type: 'rss', priority: 'critical' },
    { name: 'Business Insider', url: 'https://www.businessinsider.com/rss', type: 'rss', priority: 'high' },
    { name: 'The Economist', url: 'https://www.economist.com/feeds/print-sections/77/business.xml', type: 'rss', priority: 'high' },
    { name: 'Harvard Business Review', url: 'https://hbr.org/feed', type: 'rss', priority: 'high' },
    { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', type: 'rss', priority: 'high' },
    { name: 'Inc Magazine', url: 'https://www.inc.com/rss', type: 'rss', priority: 'medium' },
    // INTERNATIONAL
    { name: 'Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', type: 'rss', priority: 'critical' },
    { name: 'Telegraph Business', url: 'https://www.telegraph.co.uk/business/rss', type: 'rss', priority: 'high' },
    { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss', type: 'rss', priority: 'critical' },
    { name: 'South China Morning Post', url: 'https://www.scmp.com/rss', type: 'rss', priority: 'high' },
    { name: 'Economic Times India', url: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms', type: 'rss', priority: 'high' },
    { name: 'Les Echos', url: 'https://www.lesechos.fr/rss/en/rss.xml', type: 'rss', priority: 'medium' },
    { name: 'Handelsblatt Global', url: 'https://www.handelsblatt.com/contentexport/feed/en', type: 'rss', priority: 'medium' },
    // INVESTIGATIVE
    { name: 'ProPublica', url: 'https://www.propublica.org/feeds/propublica/main', type: 'rss', priority: 'critical' },
    { name: 'The Intercept', url: 'https://theintercept.com/feed/', type: 'rss', priority: 'high' },
    { name: 'Center for Investigative Reporting', url: 'https://revealnews.org/feed/', type: 'rss', priority: 'high' },
    { name: 'ICIJ', url: 'https://www.icij.org/feed/', type: 'rss', priority: 'high' },
    // BUSINESS DEEP DIVES
    { name: 'Quartz', url: 'https://qz.com/feed/', type: 'rss', priority: 'high' },
    { name: 'Axios', url: 'https://api.axios.com/feed/', type: 'rss', priority: 'critical' },
    { name: 'Morning Brew', url: 'https://www.morningbrew.com/feed', type: 'rss', priority: 'medium' },
    { name: 'The Information', url: 'https://www.theinformation.com/feed', type: 'rss', priority: 'critical' },
    { name: 'Semafor Business', url: 'https://www.semafor.com/rss', type: 'rss', priority: 'high' },
    { name: 'Punchbowl News', url: 'https://punchbowl.news/feed/', type: 'rss', priority: 'high' },
    { name: 'Puck News', url: 'https://puck.news/feed/', type: 'rss', priority: 'high' }
  ],
  pr_sources: [
    { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss', type: 'rss', priority: 'critical' },
    { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home', type: 'rss', priority: 'critical' },
    { name: 'Globe Newswire', url: 'https://www.globenewswire.com/RssFeed/', type: 'rss', priority: 'high' },
    { name: 'PR Week', url: 'https://www.prweek.com/rss', type: 'rss', priority: 'high' },
    { name: "O'Dwyer's PR", url: 'https://www.odwyerpr.com/rss.xml', type: 'rss', priority: 'medium' },
    { name: 'EIN Presswire', url: 'https://www.einpresswire.com/rss', type: 'rss', priority: 'high' },
    { name: 'PR Log', url: 'https://www.prlog.org/news/rss/', type: 'rss', priority: 'medium' },
    { name: 'CSRwire', url: 'https://www.csrwire.com/rss/all', type: 'rss', priority: 'high' },
    { name: 'PR Leap', url: 'https://www.prleap.com/rss/', type: 'rss', priority: 'medium' },
    { name: '24-7PressRelease', url: 'https://www.24-7pressrelease.com/rss/', type: 'rss', priority: 'medium' },
    { name: 'Cision PR Web', url: 'https://www.prweb.com/rss/', type: 'rss', priority: 'high' },
    { name: 'MarketWired', url: 'https://www.marketwired.com/rss', type: 'rss', priority: 'high' },
    { name: 'PR Underground', url: 'https://www.prunderground.com/rss-feeds/', type: 'rss', priority: 'low' }
  ],
  regulatory_sources: [
    { name: 'SEC Press', url: 'https://www.sec.gov/rss/news/press-releases.xml', type: 'rss', priority: 'critical' },
    { name: 'FTC News', url: 'https://www.ftc.gov/feeds/press-releases.xml', type: 'rss', priority: 'critical' },
    { name: 'DOJ News', url: 'https://www.justice.gov/feeds/usdoj/news.xml', type: 'rss', priority: 'critical' },
    { name: 'FDA News', url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds', type: 'rss', priority: 'high' },
    { name: 'EPA News', url: 'https://www.epa.gov/newsreleases/rss', type: 'rss', priority: 'high' },
    { name: 'CPSC Recalls', url: 'https://www.cpsc.gov/Newsroom/CPSC-RSS-Feed/Recalls-RSS', type: 'rss', priority: 'high' },
    { name: 'NHTSA', url: 'https://www.nhtsa.gov/rss', type: 'rss', priority: 'high' },
    { name: 'Law360', url: 'https://www.law360.com/rss', type: 'rss', priority: 'high' },
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', type: 'rss', priority: 'high' },
    // US AGENCIES
    { name: 'CFPB', url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', type: 'rss', priority: 'critical' },
    { name: 'CFTC', url: 'https://www.cftc.gov/RSS/index.htm', type: 'rss', priority: 'high' },
    { name: 'Treasury News', url: 'https://home.treasury.gov/news/rss-feeds', type: 'rss', priority: 'critical' },
    { name: 'Commerce Department', url: 'https://www.commerce.gov/news/rss-feeds', type: 'rss', priority: 'high' },
    { name: 'State Department', url: 'https://www.state.gov/rss-feeds/', type: 'rss', priority: 'high' },
    { name: 'FCC', url: 'https://www.fcc.gov/rss', type: 'rss', priority: 'high' },
    { name: 'IRS News', url: 'https://www.irs.gov/newsroom/news-releases-for-current-month', type: 'rss', priority: 'high' },
    // INTERNATIONAL REGULATORY
    { name: 'EU Commission', url: 'https://ec.europa.eu/commission/presscorner/home/en/rss', type: 'rss', priority: 'critical' },
    { name: 'UK FCA', url: 'https://www.fca.org.uk/news/rss.xml', type: 'rss', priority: 'high' },
    { name: 'ASIC Australia', url: 'https://asic.gov.au/about-asic/news-centre/news-releases/rss-feeds/', type: 'rss', priority: 'medium' },
    { name: 'BaFin Germany', url: 'https://www.bafin.de/SiteGlobals/Functions/RSSFeed/EN/RSSFeedNews/RSSFeedNews.xml', type: 'rss', priority: 'medium' },
    { name: 'China CSRC', url: 'http://www.csrc.gov.cn/pub/csrc_en/rss/', type: 'rss', priority: 'high' },
    // LEGAL
    { name: 'SCOTUS Blog', url: 'https://www.scotusblog.com/feed/', type: 'rss', priority: 'critical' },
    { name: 'Legal Futures', url: 'https://www.legalfutures.co.uk/feed', type: 'rss', priority: 'medium' },
    { name: 'Above the Law', url: 'https://abovethelaw.com/feed/', type: 'rss', priority: 'medium' }
  ],
  market_sources: [
    { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', type: 'rss', priority: 'critical' },
    { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', type: 'rss', priority: 'critical' },
    { name: 'Barrons', url: 'https://www.barrons.com/xml/rss/main', type: 'rss', priority: 'critical' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/', type: 'rss', priority: 'critical' },
    { name: 'Morningstar', url: 'https://www.morningstar.com/rss/rss.aspx', type: 'rss', priority: 'high' },
    { name: 'Zacks', url: 'https://www.zacks.com/feed', type: 'rss', priority: 'high' },
    { name: 'Benzinga', url: 'https://www.benzinga.com/rss.php', type: 'rss', priority: 'medium' },
    // MARKET DATA & ANALYSIS
    { name: 'Trading Economics', url: 'https://tradingeconomics.com/rss/', type: 'rss', priority: 'critical' },
    { name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', type: 'rss', priority: 'high' },
    { name: 'Alpha Vantage', url: 'https://www.alphavantage.co/feed/', type: 'rss', priority: 'medium' },
    { name: 'StockTwits', url: 'https://stocktwits.com/rss', type: 'rss', priority: 'medium' },
    { name: 'The Motley Fool', url: 'https://www.fool.com/feeds/index.aspx', type: 'rss', priority: 'medium' },
    { name: 'InvestorPlace', url: 'https://investorplace.com/feed/', type: 'rss', priority: 'medium' },
    { name: "Investor's Business Daily", url: 'https://www.investors.com/feed/', type: 'rss', priority: 'high' },
    // ALTERNATIVE DATA
    { name: 'Thinknum', url: 'https://www.thinknum.com/feed.xml', type: 'rss', priority: 'high' },
    { name: 'Alternative Data News', url: 'https://alternativedata.org/feed/', type: 'rss', priority: 'high' },
    { name: 'Eagle Alpha', url: 'https://eaglealpha.com/feed/', type: 'rss', priority: 'high' },
    // CRYPTO/BLOCKCHAIN
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', type: 'rss', priority: 'high' },
    { name: 'The Block', url: 'https://www.theblock.co/rss.xml', type: 'rss', priority: 'high' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed', type: 'rss', priority: 'medium' }
  ],
  forward_sources: [
    { name: 'Gartner', url: 'https://www.gartner.com/en/rss', type: 'rss', priority: 'critical' },
    { name: 'Forrester', url: 'https://www.forrester.com/rss/', type: 'rss', priority: 'critical' },
    { name: 'McKinsey', url: 'https://www.mckinsey.com/rss/insights', type: 'rss', priority: 'critical' },
    { name: 'BCG', url: 'https://www.bcg.com/rss/insights.xml', type: 'rss', priority: 'critical' },
    { name: 'Deloitte', url: 'https://www2.deloitte.com/us/en/feeds/insights.xml', type: 'rss', priority: 'high' },
    { name: 'Accenture', url: 'https://www.accenture.com/us-en/rss.xml', type: 'rss', priority: 'high' },
    { name: 'PwC', url: 'https://www.pwc.com/gx/en/rss.xml', type: 'rss', priority: 'high' },
    // THINK TANKS & RESEARCH
    { name: 'Brookings', url: 'https://www.brookings.edu/feed/', type: 'rss', priority: 'critical' },
    { name: 'RAND Corporation', url: 'https://www.rand.org/feeds/all.xml', type: 'rss', priority: 'critical' },
    { name: 'Pew Research', url: 'https://www.pewresearch.org/feed/', type: 'rss', priority: 'critical' },
    { name: 'World Economic Forum', url: 'https://www.weforum.org/feed', type: 'rss', priority: 'critical' },
    { name: 'MIT Sloan Review', url: 'https://sloanreview.mit.edu/rss/', type: 'rss', priority: 'high' },
    { name: 'Stanford Business', url: 'https://www.gsb.stanford.edu/feeds/all/rss.xml', type: 'rss', priority: 'high' },
    { name: 'Harvard Business School', url: 'https://hbswk.hbs.edu/rss/', type: 'rss', priority: 'high' },
    { name: 'Wharton Knowledge', url: 'https://knowledge.wharton.upenn.edu/feed/', type: 'rss', priority: 'high' },
    // FUTURE & INNOVATION
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', priority: 'critical' },
    { name: 'Singularity Hub', url: 'https://singularityhub.com/feed/', type: 'rss', priority: 'medium' },
    { name: 'Future of Life Institute', url: 'https://futureoflife.org/feed/', type: 'rss', priority: 'high' },
    { name: 'AI News', url: 'https://artificialintelligence-news.com/feed/', type: 'rss', priority: 'high' },
    // VC & STARTUPS
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', priority: 'critical' },
    { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', type: 'rss', priority: 'critical' },
    { name: 'PitchBook', url: 'https://pitchbook.com/feed', type: 'rss', priority: 'critical' },
    { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/', type: 'rss', priority: 'high' },
    { name: 'Term Sheet', url: 'https://fortune.com/section/term-sheet/feed/', type: 'rss', priority: 'high' },
    { name: 'StrictlyVC', url: 'https://www.strictlyvc.com/feed/', type: 'rss', priority: 'medium' },
    { name: 'Recode', url: 'https://www.vox.com/recode/rss/index.xml', type: 'rss', priority: 'high' },
    { name: 'AngelList', url: 'https://angel.co/blog/feed', type: 'rss', priority: 'high' },
    { name: 'Sifted', url: 'https://sifted.eu/feed/', type: 'rss', priority: 'high' },
    { name: 'Bessemer Venture Partners', url: 'https://www.bvp.com/atlas/rss', type: 'rss', priority: 'high' },
    { name: 'First Round Review', url: 'https://review.firstround.com/feed.xml', type: 'rss', priority: 'high' },
    { name: 'Y Combinator', url: 'https://www.ycombinator.com/blog/rss', type: 'rss', priority: 'critical' }
  ]
}

// INDUSTRY-SPECIFIC SOURCES organized by tabs
const INDUSTRY_SOURCES = {
  // TECHNOLOGY INDUSTRY
  technology: {
    competitive: {
      rss: [
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss', priority: 'critical' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'rss', priority: 'critical' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', type: 'rss', priority: 'critical' },
        { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', type: 'rss', priority: 'high' },
        { name: 'The Information', url: 'https://www.theinformation.com/feed', type: 'rss', priority: 'critical' },
        { name: 'Protocol', url: 'https://www.protocol.com/feeds/feed.rss', type: 'rss', priority: 'high' },
        { name: 'Techmeme', url: 'https://www.techmeme.com/feed.xml', type: 'rss', priority: 'high' },
        { name: 'Stratechery', url: 'https://stratechery.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', type: 'rss', priority: 'critical' },
        { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', type: 'rss', priority: 'high' },
        { name: 'Recode', url: 'https://www.vox.com/recode/rss/index.xml', type: 'rss', priority: 'high' },
        { name: 'AngelList', url: 'https://angel.co/blog/feed', type: 'rss', priority: 'high' },
        { name: 'Sifted', url: 'https://sifted.eu/feed/', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'tech startup funding', 'tech acquisition', 'tech product launch',
        'tech partnership', 'tech competitor analysis', 'tech market share'
      ],
      track_urls: [
        'https://techcrunch.com/category/startups/',
        'https://www.theverge.com/tech',
        'https://arstechnica.com/',
        'https://www.producthunt.com/'
      ]
    },
    media: {
      rss: [
        { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', type: 'rss', priority: 'high' },
        { name: 'Gizmodo', url: 'https://gizmodo.com/rss', type: 'rss', priority: 'medium' },
        { name: 'The Next Web', url: 'https://thenextweb.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Mashable Tech', url: 'https://mashable.com/feeds/rss/tech', type: 'rss', priority: 'medium' },
        { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', type: 'rss', priority: 'high' },
        { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', priority: 'high' },
        { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss', type: 'rss', priority: 'high' }
      ],
      key_journalists: [
        '@karaswisher', '@waltmossberg', '@caseynewton', '@alexkantrowitz',
        '@taylorlorenz', '@ashleevance', '@mikeisaac', '@nickbilton'
      ],
      podcasts: [
        'All-In Podcast', 'The Vergecast', 'Pivot', 'Decoder',
        'This Week in Tech', 'Reply All', 'Acquired'
      ]
    },
    regulatory: {
      agencies: ['FTC', 'FCC', 'SEC', 'DOJ Antitrust', 'EU Commission'],
      track_urls: [
        'https://www.ftc.gov/news-events/topics/competition-enforcement',
        'https://www.fcc.gov/news-events/headlines',
        'https://ec.europa.eu/commission/presscorner/home/en'
      ],
      compliance_areas: [
        'data privacy', 'antitrust', 'content moderation', 'AI regulation',
        'cryptocurrency', 'platform liability', 'net neutrality'
      ]
    }
  },

  // FINANCE INDUSTRY
  finance: {
    competitive: {
      rss: [
        { name: 'American Banker', url: 'https://www.americanbanker.com/feed', type: 'rss', priority: 'critical' },
        { name: 'Banking Dive', url: 'https://www.bankingdive.com/feeds/news/', type: 'rss', priority: 'high' },
        { name: 'Finextra', url: 'https://www.finextra.com/rss/fxnews.xml', type: 'rss', priority: 'high' },
        { name: 'The Financial Brand', url: 'https://thefinancialbrand.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Bank Innovation', url: 'https://bankinnovation.net/feed/', type: 'rss', priority: 'medium' },
        { name: 'Tearsheet', url: 'https://tearsheet.co/feed/', type: 'rss', priority: 'medium' },
        { name: 'Finovate', url: 'https://finovate.com/feed/', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'fintech funding', 'bank merger', 'digital banking launch',
        'payment platform', 'crypto regulation', 'neobank expansion'
      ]
    },
    regulatory: {
      rss: [
        { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', type: 'rss', priority: 'critical' },
        { name: 'OCC News', url: 'https://www.occ.gov/rss/news-issuances.xml', type: 'rss', priority: 'critical' },
        { name: 'FDIC News', url: 'https://www.fdic.gov/news/feed/', type: 'rss', priority: 'critical' },
        { name: 'CFPB', url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', type: 'rss', priority: 'critical' }
      ],
      agencies: ['Federal Reserve', 'OCC', 'FDIC', 'CFPB', 'SEC', 'CFTC', 'FinCEN', 'NCUA'],
      compliance_areas: [
        'Basel III', 'Dodd-Frank', 'AML/KYC', 'GDPR', 'PSD2', 'Open Banking',
        'stress testing', 'capital requirements', 'consumer protection'
      ]
    }
  },

  // HEALTHCARE INDUSTRY
  healthcare: {
    competitive: {
      rss: [
        { name: 'Healthcare Dive', url: 'https://www.healthcaredive.com/feeds/news/', type: 'rss', priority: 'critical' },
        { name: 'Modern Healthcare', url: 'https://www.modernhealthcare.com/section/rss', type: 'rss', priority: 'critical' },
        { name: 'FierceHealthcare', url: 'https://www.fiercehealthcare.com/rss/xml', type: 'rss', priority: 'critical' },
        { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/rss', type: 'rss', priority: 'high' },
        { name: 'Becker\'s Hospital Review', url: 'https://www.beckershospitalreview.com/rss/current-issue-rss.rss', type: 'rss', priority: 'high' },
        { name: 'STAT News', url: 'https://www.statnews.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'MedTech Dive', url: 'https://www.medtechdive.com/feeds/news/', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'healthcare merger', 'hospital acquisition', 'pharma clinical trial',
        'FDA approval', 'medical device launch', 'telehealth expansion'
      ]
    },
    regulatory: {
      rss: [
        { name: 'FDA News', url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/fda-newsroom/rss.xml', type: 'rss', priority: 'critical' },
        { name: 'CMS News', url: 'https://www.cms.gov/feeds/newsroom.xml', type: 'rss', priority: 'critical' },
        { name: 'HHS News', url: 'https://www.hhs.gov/rss/index.xml', type: 'rss', priority: 'high' },
        { name: 'CDC Newsroom', url: 'https://tools.cdc.gov/podcasts/feed.asp?feedid=183', type: 'rss', priority: 'high' }
      ],
      agencies: ['FDA', 'CMS', 'CDC', 'NIH', 'HHS', 'DEA', 'EMA (Europe)', 'WHO'],
      compliance_areas: [
        'HIPAA', 'clinical trials', 'drug approvals', 'medical device regulations',
        'Medicare/Medicaid', 'price transparency', 'data privacy', '340B program'
      ]
    }
  },

  // AUTOMOTIVE INDUSTRY
  automotive: {
    competitive: {
      rss: [
        { name: 'Automotive News', url: 'https://www.autonews.com/feed', type: 'rss', priority: 'critical' },
        { name: 'Electrek', url: 'https://electrek.co/feed/', type: 'rss', priority: 'critical' },
        { name: 'InsideEVs', url: 'https://insideevs.com/rss/news/', type: 'rss', priority: 'critical' },
        { name: 'Green Car Reports', url: 'https://www.greencarreports.com/rss', type: 'rss', priority: 'high' },
        { name: 'Motor Authority', url: 'https://www.motorauthority.com/rss', type: 'rss', priority: 'medium' },
        { name: 'Car and Driver', url: 'https://www.caranddriver.com/rss/all.xml', type: 'rss', priority: 'medium' },
        { name: 'Autoblog', url: 'https://www.autoblog.com/rss.xml', type: 'rss', priority: 'medium' }
      ],
      search_queries: [
        'EV launch', 'auto recall', 'autonomous vehicle', 'auto plant closure',
        'vehicle sales data', 'auto partnership', 'battery technology'
      ]
    },
    regulatory: {
      agencies: ['NHTSA', 'EPA', 'CARB', 'Euro NCAP', 'IIHS'],
      compliance_areas: [
        'emissions standards', 'safety regulations', 'fuel economy',
        'autonomous vehicle laws', 'EV incentives', 'recall procedures'
      ]
    }
  },

  // RETAIL INDUSTRY
  retail: {
    competitive: {
      rss: [
        { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', type: 'rss', priority: 'critical' },
        { name: 'Chain Store Age', url: 'https://chainstoreage.com/rss.xml', type: 'rss', priority: 'high' },
        { name: 'Retail Week', url: 'https://www.retail-week.com/rss/', type: 'rss', priority: 'high' },
        { name: 'WWD', url: 'https://wwd.com/feed/', type: 'rss', priority: 'high' },
        { name: 'The Business of Fashion', url: 'https://www.businessoffashion.com/rss', type: 'rss', priority: 'high' },
        { name: 'Footwear News', url: 'https://footwearnews.com/feed/', type: 'rss', priority: 'medium' },
        { name: 'Grocery Dive', url: 'https://www.grocerydive.com/feeds/news/', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'retail bankruptcy', 'store closures', 'retail earnings', 'e-commerce growth',
        'retail acquisition', 'omnichannel strategy', 'retail theft'
      ]
    }
  },

  // ENERGY INDUSTRY
  energy: {
    competitive: {
      rss: [
        { name: 'Oil & Gas Journal', url: 'https://www.ogj.com/rss', type: 'rss', priority: 'critical' },
        { name: 'Platts', url: 'https://www.spglobal.com/platts/en/rss-feed/oil', type: 'rss', priority: 'critical' },
        { name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Utility Dive', url: 'https://www.utilitydive.com/feeds/news/', type: 'rss', priority: 'high' },
        { name: 'Energy Digital', url: 'https://energydigital.com/rss.xml', type: 'rss', priority: 'medium' },
        { name: 'CleanTechnica', url: 'https://cleantechnica.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Greentech Media', url: 'https://www.greentechmedia.com/feeds/news', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'oil price', 'renewable energy project', 'pipeline approval', 'energy merger',
        'solar wind investment', 'grid modernization', 'carbon capture'
      ]
    },
    regulatory: {
      agencies: ['FERC', 'EPA', 'DOE', 'EIA', 'NRC', 'OPEC'],
      compliance_areas: [
        'emissions regulations', 'renewable mandates', 'grid reliability',
        'pipeline safety', 'nuclear safety', 'carbon pricing'
      ]
    }
  },

  // CONGLOMERATE & DIVERSIFIED TRADING HOUSES (Sogo Shosha)
  conglomerate: {
    competitive: {
      rss: [
        // Asian Business News - Critical for trading houses
        { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar', type: 'rss', priority: 'critical' },
        { name: 'South China Morning Post Business', url: 'https://www.scmp.com/rss/2/feed', type: 'rss', priority: 'critical' },
        { name: 'Japan Times Business', url: 'https://www.japantimes.co.jp/feed/topstories/', type: 'rss', priority: 'critical' },
        { name: 'Economic Times India', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', type: 'rss', priority: 'high' },

        // Commodities & Trading
        { name: 'Reuters Commodities', url: 'https://feeds.reuters.com/reuters/commoditiesNews', type: 'rss', priority: 'critical' },
        { name: 'Bloomberg Commodities', url: 'https://feeds.bloomberg.com/commodities/news.rss', type: 'rss', priority: 'critical' },
        { name: 'S&P Global Platts', url: 'https://www.spglobal.com/platts/en/rss-feed/oil', type: 'rss', priority: 'critical' },
        { name: 'Metal Bulletin', url: 'https://www.metalbulletin.com/rss.xml', type: 'rss', priority: 'high' },
        { name: 'Agrimoney', url: 'https://www.agrimoney.com/feed/', type: 'rss', priority: 'high' },

        // Energy & Resources
        { name: 'Oil Price', url: 'https://oilprice.com/rss/main', type: 'rss', priority: 'high' },
        { name: 'Energy Intelligence', url: 'https://www.energyintel.com/rss', type: 'rss', priority: 'high' },
        { name: 'Mining.com', url: 'https://www.mining.com/feed/', type: 'rss', priority: 'high' },

        // Infrastructure & Shipping
        { name: 'TradeWinds', url: 'https://www.tradewindsnews.com/rss', type: 'rss', priority: 'high' },
        { name: 'Lloyd\'s List', url: 'https://lloydslist.maritimeintelligence.informa.com/rss', type: 'rss', priority: 'high' },
        { name: 'Infrastructure Investor', url: 'https://www.infrastructureinvestor.com/feed/', type: 'rss', priority: 'medium' },

        // General Business - Asia Focus
        { name: 'Asian Business Review', url: 'https://asianbusinessreview.com/rss', type: 'rss', priority: 'medium' },
        { name: 'The Straits Times Business', url: 'https://www.straitstimes.com/business/rss.xml', type: 'rss', priority: 'medium' }
      ],
      search_queries: [
        'trading house acquisition', 'sogo shosha investment', 'commodity trading deal',
        'Japanese conglomerate', 'Mitsubishi Marubeni Itochu Sumitomo Mitsui',
        'LNG deal', 'mining investment', 'infrastructure project Asia',
        'energy transition investment', 'supply chain diversification',
        'Japan overseas investment', 'trading company partnership'
      ],
      track_urls: [
        'https://asia.nikkei.com/Business',
        'https://www.japantimes.co.jp/business/',
        'https://www.reuters.com/business/energy/',
        'https://www.bloomberg.com/commodities'
      ]
    },
    media: {
      rss: [
        { name: 'Financial Times Asia', url: 'https://www.ft.com/asia-pacific?format=rss', type: 'rss', priority: 'high' },
        { name: 'Asia Financial', url: 'https://www.asiafinancial.com/feed', type: 'rss', priority: 'medium' },
        { name: 'Quartz', url: 'https://qz.com/feed', type: 'rss', priority: 'high' }
      ],
      key_journalists: [
        '@nikkeiasia', '@SCMPNews', '@JapanTimesNews', '@ReutersChina',
        '@BloombergAsia', '@FTAsia'
      ],
      podcasts: [
        'Asia Business', 'Nikkei Asian Review Podcast', 'China Money Podcast',
        'Asia Tech Podcast', 'Commodities People'
      ]
    },
    regulatory: {
      rss: [
        { name: 'Japan FSA', url: 'https://www.fsa.go.jp/en/rss.xml', type: 'rss', priority: 'high' },
        { name: 'METI Japan', url: 'https://www.meti.go.jp/english/rss/', type: 'rss', priority: 'high' }
      ],
      agencies: [
        'Japan Fair Trade Commission (JFTC)',
        'Financial Services Agency (FSA) Japan',
        'Ministry of Economy, Trade and Industry (METI)',
        'China CSRC', 'ASEAN regulators', 'WTO', 'IOSCO'
      ],
      compliance_areas: [
        'cross-border M&A', 'commodity market regulation', 'trade compliance',
        'anti-corruption (FCPA, UK Bribery Act)', 'sanctions compliance',
        'export controls', 'supply chain due diligence', 'ESG reporting'
      ]
    },
    market: {
      rss: [
        { name: 'Nikkei 225', url: 'https://asia.nikkei.com/Business/Markets/rss', type: 'rss', priority: 'high' },
        { name: 'Shanghai Stock Exchange', url: 'https://english.sse.com.cn/rss/', type: 'rss', priority: 'medium' }
      ]
    }
  },

  // MARKETING & ADVERTISING INDUSTRY
  marketing_advertising: {
    competitive: {
      rss: [
        { name: 'AdAge', url: 'https://adage.com/rss/all', type: 'rss', priority: 'critical' },
        { name: 'AdWeek', url: 'https://www.adweek.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Marketing Week', url: 'https://www.marketingweek.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Digiday', url: 'https://digiday.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Campaign', url: 'https://www.campaignlive.com/rss/', type: 'rss', priority: 'high' },
        { name: 'The Drum', url: 'https://www.thedrum.com/feeds/rss/news', type: 'rss', priority: 'high' },
        { name: 'MarketingLand', url: 'https://martech.org/feed/', type: 'rss', priority: 'high' },
        { name: 'Search Engine Land', url: 'https://searchengineland.com/feed', type: 'rss', priority: 'high' },
        { name: 'Marketing Dive', url: 'https://www.marketingdive.com/feeds/news/', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'agency wins account', 'advertising pitch', 'marketing campaign launch',
        'agency merger acquisition', 'CMO appointment', 'marketing budget cuts',
        'agency loses client', 'creative awards', 'marketing effectiveness'
      ],
      track_urls: [
        'https://adage.com/agency-news',
        'https://www.adweek.com/agencies/',
        'https://www.campaignlive.com/agency'
      ]
    },
    media: {
      key_journalists: [
        '@shareenp', '@parkermolloy', '@swodinsky', '@ronanshields',
        '@georgeslefo', '@ritson', '@katconlon', '@kevinroose'
      ],
      podcasts: [
        'Marketing Over Coffee', 'Call to Action', 'The GaryVee Audio Experience',
        'Online Marketing Made Easy', 'Social Media Marketing Podcast', 'Marketing School'
      ]
    },
    regulatory: {
      agencies: [
        'FTC Advertising Division', 'NAD', 'COPPA', 'IAB', 'GDPR (for digital)',
        'CCPA', 'CAN-SPAM', 'ASA (UK)', 'ASAI (Ireland)'
      ],
      compliance_areas: [
        'truth in advertising', 'influencer disclosure', 'data privacy',
        'cookie compliance', 'email marketing', 'comparative advertising',
        'children\'s advertising', 'native advertising'
      ]
    }
  },

  // PUBLIC RELATIONS INDUSTRY
  public_relations: {
    competitive: {
      rss: [
        { name: 'PR Week', url: 'https://www.prweek.com/rss', type: 'rss', priority: 'critical' },
        { name: 'PR Daily', url: 'https://www.prdaily.com/Main/RSS.aspx', type: 'rss', priority: 'critical' },
        { name: 'Holmes Report', url: 'https://www.provokemedia.com/feed', type: 'rss', priority: 'critical' },
        { name: 'PRNEWS', url: 'https://www.prnewsonline.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Ragan', url: 'https://www.ragan.com/feed/', type: 'rss', priority: 'high' },
        { name: 'CommPRO', url: 'https://www.commpro.biz/feed/', type: 'rss', priority: 'high' },
        { name: 'Everything PR', url: 'https://everything-pr.com/feed/', type: 'rss', priority: 'medium' },
        { name: 'Spin Sucks', url: 'https://spinsucks.com/feed/', type: 'rss', priority: 'medium' }
      ],
      search_queries: [
        'PR agency wins', 'PR crisis', 'PR campaign', 'reputation management',
        'PR firm merger', 'publicist appointment', 'media relations',
        'crisis communications', 'PR awards'
      ]
    },
    media: {
      key_journalists: [
        '@richardaedelman', '@paulholmespr', '@ginidietrich', '@kengagne',
        '@prkaren', '@stuartbruce', '@wadds', '@sarahevans'
      ],
      podcasts: [
        'For Immediate Release', 'On the Record Online', 'PR Talk',
        'Spin Sucks Podcast', 'PR After Hours', 'Coffee with a Journalist'
      ]
    },
    regulatory: {
      agencies: [
        'PRSA Ethics', 'CIPR', 'PRCA', 'Global Alliance', 'Arthur Page Society',
        'FTC (disclosure)', 'SEC (material disclosure)', 'FDA (healthcare PR)'
      ],
      compliance_areas: [
        'disclosure requirements', 'material information', 'insider trading',
        'crisis disclosure', 'earnings guidance', 'media ethics',
        'paid promotion disclosure', 'lobbying registration'
      ]
    }
  },

  // FASHION & APPAREL INDUSTRY
  fashion_apparel: {
    competitive: {
      rss: [
        { name: 'Business of Fashion', url: 'https://www.businessoffashion.com/rss', type: 'rss', priority: 'critical' },
        { name: 'WWD', url: 'https://wwd.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Vogue Business', url: 'https://www.voguebusiness.com/rss', type: 'rss', priority: 'critical' },
        { name: 'FashionUnited', url: 'https://fashionunited.com/rss/news', type: 'rss', priority: 'high' },
        { name: 'Drapers', url: 'https://www.drapersonline.com/rss/', type: 'rss', priority: 'high' },
        { name: 'Glossy', url: 'https://www.glossy.co/feed/', type: 'rss', priority: 'high' },
        { name: 'Hypebeast', url: 'https://hypebeast.com/feed', type: 'rss', priority: 'high' }
      ],
      search_queries: [
        'fashion brand acquisition', 'luxury merger', 'fashion IPO',
        'designer appointment', 'fashion bankruptcy', 'brand collaboration',
        'fashion week', 'sustainability fashion', 'fast fashion controversy'
      ]
    }
  },

  // ADD MORE INDUSTRIES (real_estate_construction, entertainment_media, manufacturing_industrial, etc.)
  real_estate_construction: {
    competitive: {
      rss: [
        { name: 'Real Estate Weekly', url: 'https://rew-online.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Construction Dive', url: 'https://www.constructiondive.com/feeds/news/', type: 'rss', priority: 'high' },
        { name: 'The Real Deal', url: 'https://therealdeal.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Curbed', url: 'https://www.curbed.com/rss/index.xml', type: 'rss', priority: 'medium' }
      ]
    }
  },

  entertainment_media: {
    competitive: {
      rss: [
        { name: 'Variety', url: 'https://variety.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed', type: 'rss', priority: 'critical' },
        { name: 'Deadline', url: 'https://deadline.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Entertainment Weekly', url: 'https://ew.com/feed/', type: 'rss', priority: 'high' }
      ]
    }
  },

  manufacturing_industrial: {
    competitive: {
      rss: [
        { name: 'IndustryWeek', url: 'https://www.industryweek.com/rss', type: 'rss', priority: 'high' },
        { name: 'Manufacturing.net', url: 'https://www.manufacturing.net/rss/all', type: 'rss', priority: 'high' },
        { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', type: 'rss', priority: 'high' }
      ]
    }
  },

  transportation_logistics: {
    competitive: {
      rss: [
        { name: 'Transport Topics', url: 'https://www.ttnews.com/rss', type: 'rss', priority: 'high' },
        { name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', type: 'rss', priority: 'high' },
        { name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', type: 'rss', priority: 'high' }
      ]
    }
  },

  hospitality_tourism: {
    competitive: {
      rss: [
        { name: 'Skift', url: 'https://skift.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Hotel News Now', url: 'https://www.hotelnewsnow.com/rss/', type: 'rss', priority: 'high' },
        { name: 'PhocusWire', url: 'https://www.phocuswire.com/rss', type: 'rss', priority: 'high' }
      ]
    }
  },

  agriculture_food: {
    competitive: {
      rss: [
        { name: 'Food Dive', url: 'https://www.fooddive.com/feeds/news/', type: 'rss', priority: 'high' },
        { name: 'AgFunder News', url: 'https://agfundernews.com/feed', type: 'rss', priority: 'high' },
        { name: 'Food Business News', url: 'https://www.foodbusinessnews.net/rss', type: 'rss', priority: 'high' }
      ]
    }
  },

  professional_services: {
    competitive: {
      rss: [
        { name: 'Consulting Magazine', url: 'https://www.consultingmag.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'Management Consulting News', url: 'https://www.consultancy.uk/news/rss', type: 'rss', priority: 'critical' },
        { name: 'Harvard Business Review', url: 'https://hbr.org/feed', type: 'rss', priority: 'high' },
        { name: 'Strategy+Business', url: 'https://www.strategy-business.com/rss', type: 'rss', priority: 'high' },
        { name: 'McKinsey Insights', url: 'https://www.mckinsey.com/insights/rss', type: 'rss', priority: 'high' },
        { name: 'BCG Insights', url: 'https://www.bcg.com/rss', type: 'rss', priority: 'high' },
        { name: 'Accounting Today', url: 'https://www.accountingtoday.com/feed', type: 'rss', priority: 'medium' },
        { name: 'Law.com', url: 'https://www.law.com/rss/', type: 'rss', priority: 'medium' }
      ],
      search_queries: [
        'management consulting news', 'consulting firm merger', 'strategy consulting',
        'corporate restructuring', 'M&A advisory', 'crisis management consulting',
        'consulting firm appointments', 'professional services growth', 'Big Four consulting'
      ]
    }
  },

  insurance: {
    competitive: {
      rss: [
        { name: 'Insurance Journal', url: 'https://www.insurancejournal.com/rss/', type: 'rss', priority: 'critical' },
        { name: 'PropertyCasualty360', url: 'https://www.propertycasualty360.com/feed/', type: 'rss', priority: 'high' },
        { name: 'Risk & Insurance', url: 'https://riskandinsurance.com/feed/', type: 'rss', priority: 'high' }
      ]
    }
  },

  education: {
    competitive: {
      rss: [
        { name: 'EdSurge', url: 'https://www.edsurge.com/news/feed', type: 'rss', priority: 'high' },
        { name: 'Chronicle of Higher Education', url: 'https://www.chronicle.com/section/News/6/rss', type: 'rss', priority: 'critical' },
        { name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss/feed', type: 'rss', priority: 'high' }
      ]
    }
  },

  sports_recreation: {
    competitive: {
      rss: [
        { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', type: 'rss', priority: 'critical' },
        { name: 'Sports Business Journal', url: 'https://www.sportsbusinessjournal.com/rss/main.aspx', type: 'rss', priority: 'critical' },
        { name: 'The Athletic', url: 'https://theathletic.com/rss/', type: 'rss', priority: 'high' }
      ]
    }
  },

  telecommunications: {
    competitive: {
      rss: [
        { name: 'Light Reading', url: 'https://www.lightreading.com/rss.xml', type: 'rss', priority: 'high' },
        { name: 'FierceWireless', url: 'https://www.fiercewireless.com/rss/xml', type: 'rss', priority: 'high' },
        { name: 'RCR Wireless', url: 'https://www.rcrwireless.com/feed', type: 'rss', priority: 'high' }
      ]
    }
  },

  defense_aerospace: {
    competitive: {
      rss: [
        { name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/', type: 'rss', priority: 'critical' },
        { name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml', type: 'rss', priority: 'critical' },
        { name: 'SpaceNews', url: 'https://spacenews.com/feed/', type: 'rss', priority: 'high' }
      ]
    }
  },

  chemicals_materials: {
    competitive: {
      rss: [
        { name: 'Chemical & Engineering News', url: 'https://cen.acs.org/rss/feedsportal.rss', type: 'rss', priority: 'critical' },
        { name: 'ICIS', url: 'https://www.icis.com/rss/', type: 'rss', priority: 'high' },
        { name: 'Plastics News', url: 'https://www.plasticsnews.com/rss', type: 'rss', priority: 'medium' }
      ]
    }
  },

  government_public_sector: {
    competitive: {
      rss: [
        { name: 'Government Executive', url: 'https://www.govexec.com/rss/all/', type: 'rss', priority: 'high' },
        { name: 'Federal Times', url: 'https://www.federaltimes.com/arc/outboundfeeds/rss/', type: 'rss', priority: 'high' },
        { name: 'GovTech', url: 'https://www.govtech.com/rss/', type: 'rss', priority: 'high' }
      ]
    }
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { industry, organization_name, company_description } = await req.json()

    console.log(`📚 Master Source Registry: Fetching comprehensive sources`)
    console.log(`   Industry: ${industry || 'general'}`)
    console.log(`   Organization: ${organization_name || 'N/A'}`)
    console.log(`   Description: ${company_description ? company_description.substring(0, 100) + '...' : 'N/A'}`)
    
    // Build response with tier1 sources always included
    const sources = {
      competitive: [],
      media: [],
      regulatory: [],
      market: [],
      forward: [],
      specialized: []
    }
    
    // Add tier-1 sources to appropriate categories
    sources.media.push(...TIER1_SOURCES.mainstream_media)
    sources.media.push(...TIER1_SOURCES.pr_sources)
    sources.regulatory.push(...TIER1_SOURCES.regulatory_sources)
    sources.market.push(...TIER1_SOURCES.market_sources)
    sources.forward.push(...TIER1_SOURCES.forward_sources)
    
    // SEMANTIC MULTI-INDUSTRY MATCHING
    // Instead of forcing single industry, scan description for ALL relevant industries
    const matchedIndustries = new Set<string>()

    // If industry explicitly provided, include it
    if (industry) {
      const industryMapping = mapIndustryToCategory(industry.toLowerCase())
      if (industryMapping) {
        matchedIndustries.add(industryMapping)
        console.log(`📌 Primary industry: "${industry}" → "${industryMapping}"`)
      }
    }

    // Scan company description for additional industry keywords
    if (company_description) {
      const desc = company_description.toLowerCase()
      const industryKeywords = {
        'energy': ['energy', 'oil', 'gas', 'solar', 'wind', 'renewable', 'power', 'utility', 'electricity', 'petroleum', 'lng', 'crude'],
        'technology': ['software', 'tech', 'digital', 'ai', 'cloud', 'saas', 'data', 'cyber', 'semiconductor'],
        'healthcare': ['health', 'medical', 'pharma', 'biotech', 'hospital', 'drug', 'therapeutic', 'clinical'],
        'financial_services': ['financial', 'banking', 'investment', 'trading', 'capital', 'fintech', 'payment', 'securities', 'brokerage'],
        'retail': ['retail', 'consumer', 'ecommerce', 'shopping', 'brand', 'store', 'merchandise'],
        'manufacturing': ['manufacturing', 'industrial', 'factory', 'production', 'machinery', 'equipment', 'chemical', 'materials'],
        'automotive': ['automotive', 'vehicle', 'car', 'electric vehicle', 'mobility', 'automobile'],
        'real_estate': ['real estate', 'property', 'construction', 'housing', 'building', 'infrastructure', 'development'],
        'food_beverage': ['food', 'beverage', 'restaurant', 'agriculture', 'farming', 'agribusiness', 'grain', 'livestock'],
        'transportation': ['transportation', 'logistics', 'shipping', 'freight', 'supply chain', 'maritime', 'port', 'warehouse'],
        'telecommunications': ['telecom', 'wireless', 'internet provider', 'broadband', '5g', 'network'],
        'public_relations': ['public relations', 'pr agency', 'corporate communications'],
        'professional_services': ['management consulting', 'strategic advisory', 'consulting', 'professional services', 'advisory', 'legal services', 'accounting', 'audit']
      }

      for (const [industryKey, keywords] of Object.entries(industryKeywords)) {
        if (keywords.some(keyword => desc.includes(keyword))) {
          matchedIndustries.add(industryKey)
        }
      }

      console.log(`🔍 Semantic match found ${matchedIndustries.size} relevant industries:`, Array.from(matchedIndustries))
    }

    // Aggregate sources from ALL matched industries
    const aggregatedMetadata = {
      search_queries: [],
      track_urls: [],
      agencies: [],
      compliance_areas: [],
      keyJournalists: [],
      podcasts: []
    }

    for (const industryKey of matchedIndustries) {
      const industrySources = INDUSTRY_SOURCES[industryKey]

      if (industrySources) {
        console.log(`   ✓ Adding sources from: ${industryKey}`)

          // Add competitive sources
          if (industrySources.competitive?.rss) {
            sources.competitive.push(...industrySources.competitive.rss)
          }

          // Add media sources
          if (industrySources.media?.rss) {
            sources.media.push(...industrySources.media.rss)
          }

          // Add regulatory sources
          if (industrySources.regulatory?.rss) {
            sources.regulatory.push(...industrySources.regulatory.rss)
          }

          // Add market sources
          if (industrySources.market?.rss) {
            sources.market.push(...industrySources.market.rss)
          }

          // Add forward-looking sources
          if (industrySources.forward?.rss) {
            sources.forward.push(...industrySources.forward.rss)
          }

          // Aggregate metadata from this industry
          if (industrySources.competitive?.track_urls) {
            aggregatedMetadata.track_urls.push(...industrySources.competitive.track_urls)
          }
          if (industrySources.competitive?.search_queries) {
            aggregatedMetadata.search_queries.push(...industrySources.competitive.search_queries)
          }
          if (industrySources.regulatory?.agencies) {
            aggregatedMetadata.agencies.push(...industrySources.regulatory.agencies)
          }
          if (industrySources.regulatory?.compliance_areas) {
            aggregatedMetadata.compliance_areas.push(...industrySources.regulatory.compliance_areas)
          }
          if (industrySources.competitive?.key_journalists) {
            aggregatedMetadata.keyJournalists.push(...industrySources.competitive.key_journalists)
          }
          if (industrySources.forward?.podcasts) {
            aggregatedMetadata.podcasts.push(...industrySources.forward.podcasts)
          }
      }
    }

    // If we found matching industries, return aggregated results
    if (matchedIndustries.size > 0) {
      const totalSources = Object.values(sources).reduce((sum, arr) => sum + arr.length, 0)

      console.log(`✅ Returning ${totalSources} sources from ${matchedIndustries.size} industries`)
      console.log(`   Search queries: ${aggregatedMetadata.search_queries.length}`)
      console.log(`   Track URLs: ${aggregatedMetadata.track_urls.length}`)
      console.log(`   Agencies: ${aggregatedMetadata.agencies.length}`)

      return new Response(JSON.stringify({
        success: true,
        industries: Array.from(matchedIndustries),
        data: sources,
        metadata: aggregatedMetadata,
        total_sources: totalSources,
        categories: Object.keys(sources)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Return base sources if no industry match
    const totalSources = Object.values(sources).reduce((sum, arr) => sum + arr.length, 0)
    
    console.log(`✅ Returning ${totalSources} tier-1 sources (no industry match)`)
    
    return new Response(JSON.stringify({
      success: true,
      industry: industry || 'general',
      data: sources,
      total_sources: totalSources,
      categories: Object.keys(sources)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Registry error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})