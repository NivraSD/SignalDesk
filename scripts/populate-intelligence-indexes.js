/**
 * Populate Intelligence Indexes
 * Loads all 25+ industries with subcategories into the database
 */

const pool = require('../src/config/db');
const MasterSourceRegistry = require('../src/services/MasterSourceRegistry');
const industryKeywordDatabase = require('../frontend/src/services/industryKeywordDatabase');

async function populateIntelligenceIndexes() {
  console.log('🚀 Populating Intelligence Indexes with all industries and subcategories');
  
  try {
    // First, clear existing data
    console.log('🗑️ Clearing existing intelligence indexes...');
    await pool.query('DELETE FROM industry_indexes');
    
    const registry = new MasterSourceRegistry();
    const industries = Object.keys(registry.sources);
    
    console.log(`📊 Found ${industries.length} industries to process`);
    
    for (const industry of industries) {
      console.log(`\n📁 Processing ${industry.toUpperCase()}...`);
      
      const industryData = registry.sources[industry];
      const keywordData = industryKeywordDatabase.default?.[industry] || {};
      
      // Base industry entry (no subcategory)
      const baseEntry = {
        industry,
        subcategory: null,
        keywords: keywordData.keywords || industryData.google_news || [],
        competitors: keywordData.majorPlayers || [],
        rss_feeds: industryData.rss || [],
        news_queries: industryData.google_news || [],
        websites: industryData.websites || [],
        trending_topics: keywordData.trendingTopics || [],
        priority: 'high'
      };
      
      await insertIndustryIndex(baseEntry);
      
      // Add subcategory-specific entries based on industry
      const subcategories = getIndustrySubcategories(industry);
      
      for (const subcategory of subcategories) {
        const subEntry = {
          ...baseEntry,
          subcategory: subcategory.name,
          keywords: [...baseEntry.keywords, ...subcategory.keywords],
          competitors: subcategory.competitors || baseEntry.competitors,
          priority: subcategory.priority || 'medium'
        };
        
        await insertIndustryIndex(subEntry);
      }
      
      console.log(`  ✅ Inserted ${industry} with ${subcategories.length} subcategories`);
    }
    
    // Add statistics
    const result = await pool.query('SELECT COUNT(*) FROM industry_indexes');
    console.log(`\n✅ Successfully populated ${result.rows[0].count} industry index entries`);
    
  } catch (error) {
    console.error('❌ Error populating intelligence indexes:', error);
    throw error;
  }
}

async function insertIndustryIndex(entry) {
  try {
    await pool.query(
      `INSERT INTO industry_indexes 
       (industry, subcategory, keywords, competitors, rss_feeds, news_queries, websites, trending_topics, priority) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (industry, subcategory) 
       DO UPDATE SET 
         keywords = $3,
         competitors = $4,
         rss_feeds = $5,
         news_queries = $6,
         websites = $7,
         trending_topics = $8,
         priority = $9,
         updated_at = CURRENT_TIMESTAMP`,
      [
        entry.industry,
        entry.subcategory,
        JSON.stringify(entry.keywords),
        JSON.stringify(entry.competitors),
        JSON.stringify(entry.rss_feeds),
        JSON.stringify(entry.news_queries),
        JSON.stringify(entry.websites),
        JSON.stringify(entry.trending_topics),
        entry.priority
      ]
    );
  } catch (error) {
    console.error(`Failed to insert ${entry.industry}/${entry.subcategory}:`, error.message);
  }
}

function getIndustrySubcategories(industry) {
  const subcategories = {
    technology: [
      { name: 'artificial_intelligence', keywords: ['AI', 'machine learning', 'deep learning', 'neural networks'], priority: 'critical' },
      { name: 'cloud_computing', keywords: ['AWS', 'Azure', 'GCP', 'cloud infrastructure'], priority: 'high' },
      { name: 'cybersecurity', keywords: ['data breach', 'ransomware', 'security vulnerability'], priority: 'critical' },
      { name: 'saas', keywords: ['software as a service', 'subscription', 'B2B software'], priority: 'high' },
      { name: 'developer_tools', keywords: ['GitHub', 'CI/CD', 'DevOps', 'API'], priority: 'medium' },
      { name: 'consumer_tech', keywords: ['smartphone', 'wearables', 'smart home'], priority: 'medium' }
    ],
    
    finance: [
      { name: 'banking', keywords: ['interest rates', 'Fed', 'deposits', 'lending'], priority: 'critical' },
      { name: 'fintech', keywords: ['payment processing', 'digital wallet', 'neobank'], priority: 'high' },
      { name: 'cryptocurrency', keywords: ['Bitcoin', 'Ethereum', 'DeFi', 'NFT'], priority: 'high' },
      { name: 'insurance', keywords: ['insurtech', 'claims', 'underwriting'], priority: 'medium' },
      { name: 'investment', keywords: ['hedge fund', 'private equity', 'venture capital'], priority: 'high' }
    ],
    
    healthcare: [
      { name: 'biotech', keywords: ['gene therapy', 'CRISPR', 'clinical trials'], priority: 'critical' },
      { name: 'pharma', keywords: ['drug approval', 'FDA', 'patent'], priority: 'critical' },
      { name: 'medical_devices', keywords: ['FDA clearance', 'medical equipment', 'diagnostics'], priority: 'high' },
      { name: 'digital_health', keywords: ['telemedicine', 'health app', 'remote monitoring'], priority: 'high' },
      { name: 'health_insurance', keywords: ['coverage', 'Medicare', 'Medicaid'], priority: 'medium' }
    ],
    
    retail: [
      { name: 'ecommerce', keywords: ['online shopping', 'marketplace', 'fulfillment'], priority: 'high' },
      { name: 'fashion', keywords: ['apparel', 'fast fashion', 'luxury brands'], priority: 'medium' },
      { name: 'grocery', keywords: ['food retail', 'supply chain', 'grocery delivery'], priority: 'medium' },
      { name: 'luxury', keywords: ['high-end', 'premium brands', 'exclusivity'], priority: 'low' }
    ],
    
    energy: [
      { name: 'renewable', keywords: ['solar', 'wind', 'green energy', 'sustainability'], priority: 'high' },
      { name: 'oil_gas', keywords: ['crude oil', 'natural gas', 'OPEC', 'drilling'], priority: 'high' },
      { name: 'electric_vehicles', keywords: ['EV', 'charging infrastructure', 'battery'], priority: 'critical' },
      { name: 'battery_tech', keywords: ['lithium', 'energy storage', 'solid-state'], priority: 'high' }
    ],
    
    media: [
      { name: 'streaming', keywords: ['subscription video', 'content library', 'original content'], priority: 'high' },
      { name: 'gaming', keywords: ['video games', 'esports', 'game development'], priority: 'medium' },
      { name: 'social_media', keywords: ['engagement', 'influencer', 'content creation'], priority: 'high' },
      { name: 'news_publishing', keywords: ['journalism', 'digital media', 'subscription'], priority: 'medium' }
    ],
    
    transportation: [
      { name: 'airlines', keywords: ['aviation', 'flight', 'airport', 'passenger'], priority: 'high' },
      { name: 'automotive', keywords: ['auto manufacturing', 'vehicle', 'car sales'], priority: 'high' },
      { name: 'logistics', keywords: ['shipping', 'freight', 'supply chain', 'warehouse'], priority: 'high' },
      { name: 'rideshare', keywords: ['gig economy', 'mobility', 'delivery'], priority: 'medium' }
    ],
    
    real_estate: [
      { name: 'commercial', keywords: ['office space', 'retail property', 'REIT'], priority: 'medium' },
      { name: 'residential', keywords: ['housing', 'mortgage', 'home sales'], priority: 'medium' },
      { name: 'proptech', keywords: ['real estate technology', 'property management'], priority: 'low' }
    ],
    
    education: [
      { name: 'edtech', keywords: ['online learning', 'e-learning', 'educational software'], priority: 'medium' },
      { name: 'higher_ed', keywords: ['university', 'college', 'tuition', 'enrollment'], priority: 'medium' },
      { name: 'k12', keywords: ['school', 'curriculum', 'student', 'teacher'], priority: 'low' }
    ],
    
    manufacturing: [
      { name: 'industrial', keywords: ['factory', 'production', 'assembly line'], priority: 'medium' },
      { name: 'automation', keywords: ['robotics', 'AI manufacturing', 'Industry 4.0'], priority: 'high' },
      { name: 'supply_chain', keywords: ['procurement', 'vendor', 'logistics'], priority: 'high' }
    ],
    
    agriculture: [
      { name: 'agtech', keywords: ['precision farming', 'agricultural technology', 'smart farming'], priority: 'medium' },
      { name: 'food_production', keywords: ['crop yield', 'livestock', 'farming'], priority: 'medium' },
      { name: 'sustainability', keywords: ['organic', 'regenerative agriculture', 'carbon farming'], priority: 'low' }
    ],
    
    telecommunications: [
      { name: '5g', keywords: ['5G network', 'wireless', 'spectrum'], priority: 'high' },
      { name: 'broadband', keywords: ['fiber optic', 'internet service', 'connectivity'], priority: 'medium' },
      { name: 'satellite', keywords: ['satellite internet', 'Starlink', 'space communications'], priority: 'medium' }
    ],
    
    aerospace: [
      { name: 'space', keywords: ['SpaceX', 'NASA', 'satellite', 'rocket launch'], priority: 'high' },
      { name: 'defense', keywords: ['military aircraft', 'defense contractor', 'Pentagon'], priority: 'high' },
      { name: 'commercial_aviation', keywords: ['Boeing', 'Airbus', 'aircraft orders'], priority: 'medium' }
    ],
    
    biotechnology: [
      { name: 'gene_therapy', keywords: ['CRISPR', 'gene editing', 'genomics'], priority: 'critical' },
      { name: 'cell_therapy', keywords: ['CAR-T', 'stem cells', 'regenerative medicine'], priority: 'high' },
      { name: 'diagnostics', keywords: ['biomarkers', 'liquid biopsy', 'precision medicine'], priority: 'high' }
    ],
    
    pharmaceuticals: [
      { name: 'drug_discovery', keywords: ['clinical trials', 'R&D', 'pipeline'], priority: 'critical' },
      { name: 'generics', keywords: ['generic drugs', 'biosimilars', 'patent expiry'], priority: 'medium' },
      { name: 'specialty_pharma', keywords: ['rare disease', 'orphan drugs', 'specialty medicine'], priority: 'high' }
    ]
  };
  
  return subcategories[industry] || [];
}

// Run the population script
populateIntelligenceIndexes()
  .then(() => {
    console.log('✅ Intelligence indexes population complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to populate intelligence indexes:', error);
    process.exit(1);
  });