/**
 * GEO INTELLIGENCE REGISTRY
 * Comprehensive registry of AI query patterns, schema priorities, and platform
 * preferences across 25+ industries for Generative Experience Optimization
 *
 * Mirrors MasterSourceRegistry structure for consistency
 */

interface SchemaType {
  type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  fields: string[]
  reasoning: string
}

interface QueryPattern {
  pattern: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  intent: string
  expectedRank?: number // Target rank for this query
}

interface PlatformPreference {
  platform: 'chatgpt' | 'claude' | 'perplexity' | 'gemini'
  importance: 'critical' | 'high' | 'medium' | 'low'
  optimizationFocus: string[]
}

interface IndustryPriorities {
  // What this industry cares about most in AI visibility
  primary_concerns: string[] // e.g., ["price", "quality", "speed"]
  positioning_focus: string[] // e.g., ["expertise", "reliability", "innovation"]
  query_framing: {
    comparison: string[]  // How to frame comparison queries
    expertise: string[]   // How to show expertise
    transactional: string[] // How to frame buying intent
  }
  avoid_terms: string[] // Terms to avoid in positioning
}

interface IndustryGEO {
  priorities: IndustryPriorities // NEW - What this industry cares about
  schemas: SchemaType[]
  queries: QueryPattern[]
  platforms: PlatformPreference[]
  competitors_to_monitor: string[]
  success_metrics: string[]
}

export class GEOIntelligenceRegistry {
  private industries: Record<string, IndustryGEO>

  constructor() {
    this.industries = {
      // TECHNOLOGY INDUSTRY
      technology: {
        priorities: {
          primary_concerns: ['features', 'integration', 'ease of use', 'pricing', 'support', 'scalability'],
          positioning_focus: ['innovation', 'reliability', 'technical excellence', 'developer experience'],
          query_framing: {
            comparison: ['best {category} for {use_case}', '{product} vs {competitor} features', 'top {category} tools for {team_size}'],
            expertise: ['how to {task} with {product}', '{product} {advanced_feature} tutorial', '{product} best practices'],
            transactional: ['{product} pricing plans', '{product} free trial', 'buy {product} for {use_case}']
          },
          avoid_terms: ['cheap', 'basic', 'limited', 'outdated']
        },
        schemas: [
          {
            type: 'SoftwareApplication',
            priority: 'critical',
            fields: ['name', 'applicationCategory', 'operatingSystem', 'offers', 'aggregateRating', 'review', 'featureList', 'screenshot'],
            reasoning: 'AI platforms heavily cite software apps when recommending tools'
          },
          {
            type: 'Product',
            priority: 'critical',
            fields: ['name', 'description', 'brand', 'offers', 'aggregateRating', 'review'],
            reasoning: 'Essential for product comparisons and recommendations'
          },
          {
            type: 'FAQPage',
            priority: 'critical',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Directly answers "how to" and "what is" queries'
          },
          {
            type: 'Organization',
            priority: 'high',
            fields: ['name', 'description', 'foundingDate', 'founder', 'numberOfEmployees', 'award', 'knowsAbout'],
            reasoning: 'Establishes credibility and expertise'
          },
          {
            type: 'TechArticle',
            priority: 'high',
            fields: ['headline', 'author', 'datePublished', 'articleBody'],
            reasoning: 'Technical content and documentation'
          }
        ],
        queries: [
          { pattern: 'best [category] software', priority: 'critical', intent: 'comparison', expectedRank: 3 },
          { pattern: 'best [category] tools', priority: 'critical', intent: 'comparison', expectedRank: 3 },
          { pattern: '[problem] solution software', priority: 'high', intent: 'solution_seeking', expectedRank: 5 },
          { pattern: 'alternatives to [competitor]', priority: 'critical', intent: 'competitive', expectedRank: 3 },
          { pattern: '[product] vs [competitor]', priority: 'high', intent: 'comparison', expectedRank: 2 },
          { pattern: '[category] software comparison', priority: 'high', intent: 'comparison', expectedRank: 5 },
          { pattern: 'how to [task] with [software]', priority: 'high', intent: 'instructional', expectedRank: 5 },
          { pattern: '[product] features', priority: 'medium', intent: 'informational', expectedRank: 3 },
          { pattern: '[product] pricing', priority: 'high', intent: 'transactional', expectedRank: 3 },
          { pattern: '[product] reviews', priority: 'high', intent: 'research', expectedRank: 5 },
          { pattern: 'top [category] platforms', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: '[use_case] software recommendations', priority: 'medium', intent: 'recommendation', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['aggregateRating', 'review', 'offers', 'featureList'] },
          { platform: 'claude', importance: 'critical', optimizationFocus: ['description', 'featureList', 'knowsAbout', 'TechArticle'] },
          { platform: 'perplexity', importance: 'high', optimizationFocus: ['citations', 'aggregateRating', 'sameAs'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['image', 'video', 'screenshot'] }
        ],
        competitors_to_monitor: ['competitor_urls', 'tech_review_sites', 'g2', 'capterra', 'trustpilot'],
        success_metrics: ['citation_rate', 'average_rank', 'feature_mentions', 'review_citations']
      },

      // FINANCE INDUSTRY
      finance: {
        priorities: {
          primary_concerns: ['security', 'compliance', 'fees', 'returns', 'transparency', 'reputation'],
          positioning_focus: ['trust', 'expertise', 'regulatory compliance', 'track record', 'financial stability'],
          query_framing: {
            comparison: ['best {service} for {investor_type}', '{product} vs {competitor} fees', 'top rated {financial_service}'],
            expertise: ['{firm} investment philosophy', '{advisor} credentials', '{service} regulatory compliance'],
            transactional: ['{product} minimum investment', '{service} account types', 'open {product} account']
          },
          avoid_terms: ['risky', 'unregulated', 'guaranteed returns', 'get rich quick']
        },
        schemas: [
          {
            type: 'FinancialProduct',
            priority: 'critical',
            fields: ['name', 'description', 'feesAndCommissionsSpecification', 'interestRate', 'annualPercentageRate'],
            reasoning: 'Essential for financial product recommendations'
          },
          {
            type: 'Service',
            priority: 'critical',
            fields: ['name', 'description', 'provider', 'serviceType', 'areaServed', 'aggregateRating'],
            reasoning: 'Financial services and advisory'
          },
          {
            type: 'FAQPage',
            priority: 'critical',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Financial education and advice queries'
          },
          {
            type: 'Organization',
            priority: 'high',
            fields: ['name', 'description', 'award', 'accreditation', 'numberOfEmployees'],
            reasoning: 'Trust and credibility in finance'
          }
        ],
        queries: [
          { pattern: 'best [financial_product]', priority: 'critical', intent: 'comparison', expectedRank: 3 },
          { pattern: '[financial_product] rates', priority: 'critical', intent: 'informational', expectedRank: 3 },
          { pattern: 'how to [financial_goal]', priority: 'high', intent: 'instructional', expectedRank: 5 },
          { pattern: '[service] comparison', priority: 'high', intent: 'comparison', expectedRank: 5 },
          { pattern: 'top [financial_service] providers', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: '[product] vs [competitor]', priority: 'high', intent: 'comparison', expectedRank: 3 },
          { pattern: '[financial_product] reviews', priority: 'high', intent: 'research', expectedRank: 5 },
          { pattern: 'what is [financial_term]', priority: 'medium', intent: 'educational', expectedRank: 5 },
          { pattern: '[financial_product] fees', priority: 'high', intent: 'informational', expectedRank: 3 },
          { pattern: 'is [financial_product] worth it', priority: 'medium', intent: 'evaluation', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['FinancialProduct', 'interestRate', 'fees'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_descriptions', 'educational_content'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['citations', 'official_sources'] },
          { platform: 'gemini', importance: 'low', optimizationFocus: ['visual_data', 'charts'] }
        ],
        competitors_to_monitor: ['competitor_financial_institutions', 'comparison_sites', 'consumer_finance_sites'],
        success_metrics: ['citation_rate', 'trust_mentions', 'rate_citations', 'product_recommendations']
      },

      // HEALTHCARE INDUSTRY
      healthcare: {
        schemas: [
          {
            type: 'MedicalBusiness',
            priority: 'critical',
            fields: ['name', 'description', 'medicalSpecialty', 'priceRange', 'address', 'telephone', 'aggregateRating'],
            reasoning: 'Local healthcare provider discovery'
          },
          {
            type: 'Physician',
            priority: 'critical',
            fields: ['name', 'medicalSpecialty', 'alumniOf', 'award', 'hospitalAffiliation'],
            reasoning: 'Provider selection and credibility'
          },
          {
            type: 'MedicalCondition',
            priority: 'high',
            fields: ['name', 'description', 'possibleTreatment', 'riskFactor'],
            reasoning: 'Medical information queries'
          },
          {
            type: 'FAQPage',
            priority: 'critical',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Medical questions and advice'
          },
          {
            type: 'Service',
            priority: 'high',
            fields: ['name', 'description', 'serviceType', 'provider'],
            reasoning: 'Medical services and procedures'
          }
        ],
        queries: [
          { pattern: '[condition] treatment', priority: 'critical', intent: 'informational', expectedRank: 5 },
          { pattern: 'find [specialist]', priority: 'critical', intent: 'local', expectedRank: 3 },
          { pattern: 'find [specialist] near me', priority: 'critical', intent: 'local', expectedRank: 3 },
          { pattern: '[procedure] cost', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'best [provider] near me', priority: 'high', intent: 'comparison', expectedRank: 5 },
          { pattern: 'what is [medical_term]', priority: 'high', intent: 'educational', expectedRank: 5 },
          { pattern: '[condition] symptoms', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: '[procedure] recovery time', priority: 'medium', intent: 'informational', expectedRank: 7 },
          { pattern: '[provider] reviews', priority: 'high', intent: 'research', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['MedicalBusiness', 'Physician', 'localBusiness'] },
          { platform: 'claude', importance: 'critical', optimizationFocus: ['detailed_medical_info', 'citations', 'MedicalCondition'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['medical_sources', 'citations', 'credibility'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['local_search', 'maps'] }
        ],
        competitors_to_monitor: ['healthcare_directories', 'provider_review_sites', 'medical_info_sites'],
        success_metrics: ['local_citations', 'provider_mentions', 'treatment_recommendations', 'trust_signals']
      },

      // E-COMMERCE & RETAIL
      ecommerce: {
        priorities: {
          primary_concerns: ['price', 'quality', 'shipping', 'customer reviews', 'return policy', 'product availability'],
          positioning_focus: ['value', 'customer experience', 'product selection', 'fast delivery', 'easy returns'],
          query_framing: {
            comparison: ['best {product} under ${price}', '{brand} vs {competitor} quality', 'cheapest {category} with free shipping'],
            expertise: ['{brand} {product_type} guide', 'how to choose {product}', '{product} buying guide'],
            transactional: ['buy {product}', '{product} on sale', 'where to buy {product}', '{brand} discount code']
          },
          avoid_terms: ['overpriced', 'poor quality', 'slow shipping', 'bad customer service']
        },
        schemas: [
          {
            type: 'Product',
            priority: 'critical',
            fields: ['name', 'description', 'brand', 'image', 'offers', 'aggregateRating', 'review', 'sku'],
            reasoning: 'Product discovery and comparison'
          },
          {
            type: 'Offer',
            priority: 'critical',
            fields: ['price', 'priceCurrency', 'availability', 'priceValidUntil', 'seller'],
            reasoning: 'Pricing and availability information'
          },
          {
            type: 'Review',
            priority: 'critical',
            fields: ['author', 'reviewRating', 'reviewBody', 'datePublished'],
            reasoning: 'Social proof and credibility'
          },
          {
            type: 'FAQPage',
            priority: 'high',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Product questions and sizing'
          },
          {
            type: 'Organization',
            priority: 'medium',
            fields: ['name', 'description', 'sameAs', 'contactPoint'],
            reasoning: 'Brand credibility'
          }
        ],
        queries: [
          { pattern: 'buy [product]', priority: 'critical', intent: 'transactional', expectedRank: 3 },
          { pattern: '[product] reviews', priority: 'critical', intent: 'research', expectedRank: 3 },
          { pattern: 'best [product] for [use_case]', priority: 'critical', intent: 'comparison', expectedRank: 3 },
          { pattern: '[product] vs [competitor_product]', priority: 'high', intent: 'comparison', expectedRank: 3 },
          { pattern: 'where to buy [product]', priority: 'high', intent: 'transactional', expectedRank: 5 },
          { pattern: '[product] price', priority: 'high', intent: 'informational', expectedRank: 3 },
          { pattern: '[product] discount code', priority: 'medium', intent: 'transactional', expectedRank: 7 },
          { pattern: 'is [product] worth it', priority: 'medium', intent: 'evaluation', expectedRank: 5 },
          { pattern: '[brand] [product]', priority: 'high', intent: 'navigational', expectedRank: 3 },
          { pattern: 'best [category] brands', priority: 'medium', intent: 'comparison', expectedRank: 7 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['Product', 'aggregateRating', 'review', 'offers'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_descriptions', 'featureList', 'specifications'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['Product', 'reviews', 'price_comparison'] },
          { platform: 'gemini', importance: 'critical', optimizationFocus: ['Product', 'image', 'visual_search'] }
        ],
        competitors_to_monitor: ['direct_competitors', 'amazon', 'marketplace_sellers', 'review_aggregators'],
        success_metrics: ['product_mentions', 'citation_rate', 'review_citations', 'price_mentions']
      },

      // SAAS (Subset of Technology, but important enough to separate)
      saas: {
        schemas: [
          {
            type: 'SoftwareApplication',
            priority: 'critical',
            fields: ['name', 'applicationCategory', 'operatingSystem', 'offers', 'aggregateRating', 'review', 'featureList'],
            reasoning: 'Core for SaaS product visibility'
          },
          {
            type: 'Product',
            priority: 'critical',
            fields: ['name', 'description', 'brand', 'offers', 'aggregateRating'],
            reasoning: 'Product positioning and pricing'
          },
          {
            type: 'FAQPage',
            priority: 'critical',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Common SaaS questions (pricing, features, integrations)'
          },
          {
            type: 'Organization',
            priority: 'high',
            fields: ['name', 'description', 'foundingDate', 'founder', 'award'],
            reasoning: 'Company credibility'
          },
          {
            type: 'HowTo',
            priority: 'high',
            fields: ['name', 'step', 'tool', 'totalTime'],
            reasoning: 'Use case and tutorial content'
          }
        ],
        queries: [
          { pattern: 'best [category] software', priority: 'critical', intent: 'comparison', expectedRank: 3 },
          { pattern: '[problem] software solution', priority: 'critical', intent: 'solution_seeking', expectedRank: 5 },
          { pattern: 'alternatives to [competitor]', priority: 'critical', intent: 'competitive', expectedRank: 3 },
          { pattern: '[product] pricing', priority: 'critical', intent: 'transactional', expectedRank: 3 },
          { pattern: '[product] vs [competitor]', priority: 'high', intent: 'comparison', expectedRank: 3 },
          { pattern: '[product] features', priority: 'high', intent: 'informational', expectedRank: 3 },
          { pattern: 'how to use [product]', priority: 'high', intent: 'instructional', expectedRank: 5 },
          { pattern: '[product] integrations', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: '[product] reviews', priority: 'high', intent: 'research', expectedRank: 5 },
          { pattern: 'is [product] worth it', priority: 'medium', intent: 'evaluation', expectedRank: 5 },
          { pattern: '[category] tool comparison', priority: 'medium', intent: 'comparison', expectedRank: 7 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['SoftwareApplication', 'featureList', 'offers', 'aggregateRating'] },
          { platform: 'claude', importance: 'critical', optimizationFocus: ['detailed_features', 'use_cases', 'technical_specs'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['citations', 'comparisons', 'reviews'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['screenshots', 'video_demos'] }
        ],
        competitors_to_monitor: ['g2_competitors', 'capterra_competitors', 'direct_competitors'],
        success_metrics: ['alternative_mentions', 'feature_comparisons', 'integration_mentions', 'use_case_citations']
      },

      // PROFESSIONAL SERVICES
      professional_services: {
        priorities: {
          primary_concerns: ['expertise', 'credentials', 'experience', 'industry knowledge', 'client results', 'reputation'],
          positioning_focus: ['thought leadership', 'specialization', 'proven track record', 'client testimonials', 'industry recognition'],
          query_framing: {
            comparison: ['best {service} firm for {industry}', 'top {specialty} consultants', '{firm} vs {competitor} expertise'],
            expertise: ['{firm} {specialty} experience', '{service} case studies', '{firm} industry insights'],
            transactional: ['{service} consultation', 'hire {firm} for {project}', '{service} pricing']
          },
          avoid_terms: ['cheap', 'inexperienced', 'generalist', 'junior']
        },
        schemas: [
          {
            type: 'ProfessionalService',
            priority: 'critical',
            fields: ['name', 'description', 'priceRange', 'address', 'telephone', 'aggregateRating', 'review'],
            reasoning: 'Local service provider discovery'
          },
          {
            type: 'Service',
            priority: 'critical',
            fields: ['name', 'description', 'provider', 'serviceType', 'areaServed'],
            reasoning: 'Service offerings and capabilities'
          },
          {
            type: 'Person',
            priority: 'high',
            fields: ['name', 'jobTitle', 'worksFor', 'alumniOf', 'award'],
            reasoning: 'Expert and professional credibility'
          },
          {
            type: 'FAQPage',
            priority: 'high',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Service questions and process'
          },
          {
            type: 'Organization',
            priority: 'high',
            fields: ['name', 'description', 'foundingDate', 'award', 'numberOfEmployees'],
            reasoning: 'Firm credibility'
          }
        ],
        queries: [
          { pattern: 'best [service_type] near me', priority: 'critical', intent: 'local', expectedRank: 3 },
          { pattern: '[service_type] [city]', priority: 'critical', intent: 'local', expectedRank: 3 },
          { pattern: 'top [service_type] firms', priority: 'high', intent: 'comparison', expectedRank: 5 },
          { pattern: '[service_type] cost', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'how to choose [service_type]', priority: 'medium', intent: 'educational', expectedRank: 7 },
          { pattern: '[firm_name] reviews', priority: 'high', intent: 'research', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['ProfessionalService', 'local_business', 'reviews'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_service_descriptions', 'expertise'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['local_citations', 'reviews', 'credentials'] },
          { platform: 'gemini', importance: 'high', optimizationFocus: ['local_search', 'maps'] }
        ],
        competitors_to_monitor: ['local_competitors', 'national_firms', 'directory_listings'],
        success_metrics: ['local_citations', 'service_mentions', 'expert_recognition', 'review_citations']
      },

      // EDUCATION
      education: {
        schemas: [
          {
            type: 'EducationalOrganization',
            priority: 'critical',
            fields: ['name', 'description', 'address', 'telephone', 'aggregateRating', 'alumniOf'],
            reasoning: 'Institution discovery and selection'
          },
          {
            type: 'Course',
            priority: 'critical',
            fields: ['name', 'description', 'provider', 'hasCourseInstance', 'educationalLevel', 'timeRequired'],
            reasoning: 'Course discovery and information'
          },
          {
            type: 'FAQPage',
            priority: 'high',
            fields: ['mainEntity', 'acceptedAnswer'],
            reasoning: 'Admissions and program questions'
          }
        ],
        queries: [
          { pattern: 'best [program] courses', priority: 'critical', intent: 'comparison', expectedRank: 5 },
          { pattern: 'online [subject] courses', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: '[institution] vs [institution]', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: 'how to learn [subject]', priority: 'high', intent: 'instructional', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['Course', 'educational_content', 'recommendations'] },
          { platform: 'claude', importance: 'critical', optimizationFocus: ['detailed_course_info', 'learning_paths'] },
          { platform: 'perplexity', importance: 'high', optimizationFocus: ['course_comparisons', 'rankings'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['video_content', 'tutorials'] }
        ],
        competitors_to_monitor: ['course_platforms', 'institutions', 'online_learning_sites'],
        success_metrics: ['course_recommendations', 'institution_mentions', 'learning_path_citations']
      },

      // REAL ESTATE
      real_estate: {
        schemas: [
          { type: 'RealEstateListing', priority: 'critical', fields: ['name', 'description', 'address', 'price', 'numberOfRooms', 'floorSize', 'image'], reasoning: 'Property discovery and details' },
          { type: 'Residence', priority: 'high', fields: ['name', 'address', 'floorSize', 'numberOfRooms', 'accommodationCategory'], reasoning: 'Residential property information' },
          { type: 'Apartment', priority: 'high', fields: ['name', 'address', 'floorSize', 'numberOfRooms', 'petsAllowed'], reasoning: 'Apartment listings' },
          { type: 'FAQPage', priority: 'high', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Real estate questions' },
          { type: 'RealEstateAgent', priority: 'medium', fields: ['name', 'telephone', 'email', 'address', 'aggregateRating'], reasoning: 'Agent discovery' }
        ],
        queries: [
          { pattern: '[location] homes for sale', priority: 'critical', intent: 'local', expectedRank: 5 },
          { pattern: '[location] apartments', priority: 'critical', intent: 'local', expectedRank: 5 },
          { pattern: '[property_type] [location]', priority: 'high', intent: 'local', expectedRank: 5 },
          { pattern: 'homes under [price] [location]', priority: 'high', intent: 'local', expectedRank: 7 },
          { pattern: 'best neighborhoods in [city]', priority: 'medium', intent: 'informational', expectedRank: 7 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['RealEstateListing', 'price', 'location'] },
          { platform: 'claude', importance: 'medium', optimizationFocus: ['detailed_descriptions', 'neighborhood_info'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['local_listings', 'citations'] },
          { platform: 'gemini', importance: 'critical', optimizationFocus: ['maps', 'images', 'local_search'] }
        ],
        competitors_to_monitor: ['zillow', 'realtor_com', 'redfin', 'local_mls'],
        success_metrics: ['listing_citations', 'location_mentions', 'price_range_mentions']
      },

      // AUTOMOTIVE
      automotive: {
        schemas: [
          { type: 'Car', priority: 'critical', fields: ['name', 'brand', 'model', 'vehicleModelDate', 'fuelType', 'vehicleEngine', 'offers'], reasoning: 'Vehicle listings and specs' },
          { type: 'Product', priority: 'critical', fields: ['name', 'brand', 'offers', 'aggregateRating', 'review'], reasoning: 'Car as product for comparisons' },
          { type: 'AutoDealer', priority: 'high', fields: ['name', 'address', 'telephone', 'priceRange', 'aggregateRating'], reasoning: 'Dealer discovery' },
          { type: 'FAQPage', priority: 'high', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Car buying questions' }
        ],
        queries: [
          { pattern: 'best [vehicle_type]', priority: 'critical', intent: 'comparison', expectedRank: 5 },
          { pattern: '[make] [model] review', priority: 'critical', intent: 'research', expectedRank: 3 },
          { pattern: '[make] [model] vs [competitor_model]', priority: 'high', intent: 'comparison', expectedRank: 3 },
          { pattern: '[make] dealers near me', priority: 'high', intent: 'local', expectedRank: 5 },
          { pattern: '[vehicle_type] price', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'is [model] reliable', priority: 'medium', intent: 'evaluation', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['Car', 'specifications', 'comparisons'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_specs', 'features'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['reviews', 'comparisons', 'citations'] },
          { platform: 'gemini', importance: 'high', optimizationFocus: ['images', 'video_reviews'] }
        ],
        competitors_to_monitor: ['car_review_sites', 'manufacturer_sites', 'dealer_networks'],
        success_metrics: ['model_mentions', 'comparison_citations', 'feature_highlights']
      },

      // FOOD & BEVERAGE / RESTAURANTS
      food: {
        schemas: [
          { type: 'Restaurant', priority: 'critical', fields: ['name', 'description', 'servesCuisine', 'address', 'telephone', 'priceRange', 'aggregateRating', 'menu'], reasoning: 'Restaurant discovery' },
          { type: 'FoodEstablishment', priority: 'critical', fields: ['name', 'address', 'telephone', 'servesCuisine', 'acceptsReservations'], reasoning: 'Food venue information' },
          { type: 'Menu', priority: 'high', fields: ['name', 'description', 'hasMenuItem'], reasoning: 'Menu information for queries' },
          { type: 'Recipe', priority: 'medium', fields: ['name', 'recipeIngredient', 'recipeInstructions', 'nutrition'], reasoning: 'Recipe and food content' },
          { type: 'FAQPage', priority: 'high', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Restaurant FAQs' }
        ],
        queries: [
          { pattern: 'best [cuisine] restaurant [location]', priority: 'critical', intent: 'local', expectedRank: 5 },
          { pattern: '[restaurant_name] menu', priority: 'critical', intent: 'informational', expectedRank: 3 },
          { pattern: 'restaurants near me', priority: 'critical', intent: 'local', expectedRank: 5 },
          { pattern: '[cuisine] restaurant [location]', priority: 'high', intent: 'local', expectedRank: 5 },
          { pattern: '[restaurant_name] reviews', priority: 'high', intent: 'research', expectedRank: 5 },
          { pattern: '[dish] recipe', priority: 'medium', intent: 'instructional', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['Restaurant', 'Menu', 'recommendations'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_menu', 'descriptions'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['local_search', 'reviews'] },
          { platform: 'gemini', importance: 'critical', optimizationFocus: ['maps', 'images', 'local'] }
        ],
        competitors_to_monitor: ['yelp', 'google_maps', 'opentable', 'local_competitors'],
        success_metrics: ['restaurant_mentions', 'menu_citations', 'review_references']
      },

      // SPORTS & FITNESS
      sports: {
        schemas: [
          { type: 'SportsTeam', priority: 'high', fields: ['name', 'sport', 'athlete', 'coach', 'location'], reasoning: 'Team information' },
          { type: 'Product', priority: 'critical', fields: ['name', 'brand', 'category', 'offers', 'aggregateRating', 'review'], reasoning: 'Sports equipment and apparel' },
          { type: 'ExerciseGym', priority: 'high', fields: ['name', 'address', 'telephone', 'priceRange', 'amenityFeature'], reasoning: 'Gym and fitness center discovery' },
          { type: 'FAQPage', priority: 'medium', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Fitness and training questions' }
        ],
        queries: [
          { pattern: 'best [equipment_type]', priority: 'critical', intent: 'comparison', expectedRank: 5 },
          { pattern: '[brand] [product] review', priority: 'critical', intent: 'research', expectedRank: 3 },
          { pattern: 'best gym near me', priority: 'high', intent: 'local', expectedRank: 5 },
          { pattern: '[sport] training tips', priority: 'medium', intent: 'instructional', expectedRank: 7 },
          { pattern: '[product] vs [competitor]', priority: 'high', intent: 'comparison', expectedRank: 3 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['Product', 'recommendations', 'reviews'] },
          { platform: 'claude', importance: 'medium', optimizationFocus: ['training_advice', 'specifications'] },
          { platform: 'perplexity', importance: 'high', optimizationFocus: ['comparisons', 'reviews'] },
          { platform: 'gemini', importance: 'critical', optimizationFocus: ['visual_content', 'product_images'] }
        ],
        competitors_to_monitor: ['major_brands', 'sports_retailers', 'specialty_stores'],
        success_metrics: ['product_mentions', 'brand_citations', 'review_references']
      },

      // LEGAL SERVICES
      legal: {
        schemas: [
          { type: 'LegalService', priority: 'critical', fields: ['name', 'description', 'provider', 'areaServed', 'address', 'telephone'], reasoning: 'Law firm discovery' },
          { type: 'Attorney', priority: 'critical', fields: ['name', 'worksFor', 'knowsAbout', 'alumniOf', 'award'], reasoning: 'Attorney credentials' },
          { type: 'FAQPage', priority: 'critical', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Legal questions and guidance' },
          { type: 'Article', priority: 'high', fields: ['headline', 'author', 'datePublished', 'articleBody'], reasoning: 'Legal content and thought leadership' }
        ],
        queries: [
          { pattern: '[practice_area] lawyer near me', priority: 'critical', intent: 'local', expectedRank: 3 },
          { pattern: 'best [practice_area] attorney [city]', priority: 'critical', intent: 'local', expectedRank: 5 },
          { pattern: 'how to [legal_action]', priority: 'high', intent: 'instructional', expectedRank: 5 },
          { pattern: '[legal_issue] lawyer', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: '[law_firm] reviews', priority: 'medium', intent: 'research', expectedRank: 7 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['LegalService', 'Attorney', 'practice_areas'] },
          { platform: 'claude', importance: 'critical', optimizationFocus: ['legal_content', 'detailed_expertise'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['credentials', 'citations', 'case_law'] },
          { platform: 'gemini', importance: 'low', optimizationFocus: ['local_search'] }
        ],
        competitors_to_monitor: ['local_firms', 'national_firms', 'legal_directories'],
        success_metrics: ['practice_area_citations', 'attorney_mentions', 'expertise_recognition']
      },

      // INSURANCE
      insurance: {
        schemas: [
          { type: 'InsuranceAgency', priority: 'critical', fields: ['name', 'description', 'address', 'telephone', 'areaServed'], reasoning: 'Agency discovery' },
          { type: 'FinancialProduct', priority: 'critical', fields: ['name', 'description', 'provider', 'category'], reasoning: 'Insurance products' },
          { type: 'Service', priority: 'high', fields: ['name', 'description', 'provider', 'serviceType'], reasoning: 'Insurance services' },
          { type: 'FAQPage', priority: 'critical', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Insurance questions' }
        ],
        queries: [
          { pattern: 'best [insurance_type]', priority: 'critical', intent: 'comparison', expectedRank: 5 },
          { pattern: '[insurance_type] cost', priority: 'critical', intent: 'informational', expectedRank: 5 },
          { pattern: 'how to choose [insurance_type]', priority: 'high', intent: 'instructional', expectedRank: 5 },
          { pattern: '[provider] vs [competitor]', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: '[insurance_type] near me', priority: 'high', intent: 'local', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'critical', optimizationFocus: ['comparisons', 'recommendations'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['educational_content', 'detailed_explanations'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['citations', 'provider_comparisons'] },
          { platform: 'gemini', importance: 'low', optimizationFocus: ['visual_comparisons'] }
        ],
        competitors_to_monitor: ['major_insurers', 'comparison_sites', 'brokers'],
        success_metrics: ['product_mentions', 'comparison_citations', 'recommendation_rate']
      },

      // MANUFACTURING
      manufacturing: {
        schemas: [
          { type: 'Organization', priority: 'critical', fields: ['name', 'description', 'foundingDate', 'numberOfEmployees', 'naics', 'award'], reasoning: 'Company information' },
          { type: 'Product', priority: 'critical', fields: ['name', 'description', 'manufacturer', 'model', 'material'], reasoning: 'Manufactured products' },
          { type: 'Service', priority: 'high', fields: ['name', 'description', 'provider', 'serviceType'], reasoning: 'Manufacturing services' },
          { type: 'FAQPage', priority: 'medium', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Technical specifications' }
        ],
        queries: [
          { pattern: '[product_type] manufacturer', priority: 'high', intent: 'supplier_search', expectedRank: 5 },
          { pattern: 'best [material] manufacturer', priority: 'high', intent: 'comparison', expectedRank: 7 },
          { pattern: '[process_type] manufacturing', priority: 'medium', intent: 'informational', expectedRank: 7 },
          { pattern: '[company] capabilities', priority: 'medium', intent: 'informational', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'medium', optimizationFocus: ['capabilities', 'specifications'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['technical_details', 'processes'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['industry_citations', 'certifications'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['visual_content', 'facility_tours'] }
        ],
        competitors_to_monitor: ['industry_competitors', 'suppliers', 'trade_publications'],
        success_metrics: ['capability_mentions', 'specification_citations', 'industry_recognition']
      },

      // ENERGY
      energy: {
        schemas: [
          { type: 'Organization', priority: 'critical', fields: ['name', 'description', 'foundingDate', 'numberOfEmployees', 'naics'], reasoning: 'Energy company information' },
          { type: 'Service', priority: 'critical', fields: ['name', 'description', 'provider', 'serviceType', 'areaServed'], reasoning: 'Energy services' },
          { type: 'Product', priority: 'high', fields: ['name', 'description', 'manufacturer', 'category'], reasoning: 'Energy products and solutions' },
          { type: 'FAQPage', priority: 'high', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Energy efficiency questions' }
        ],
        queries: [
          { pattern: '[energy_type] provider [location]', priority: 'high', intent: 'local', expectedRank: 5 },
          { pattern: 'best [energy_solution]', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: '[energy_type] cost [location]', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'how to reduce [energy_type] costs', priority: 'medium', intent: 'instructional', expectedRank: 7 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'medium', optimizationFocus: ['solutions', 'comparisons'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['technical_content', 'sustainability'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['citations', 'data', 'trends'] },
          { platform: 'gemini', importance: 'low', optimizationFocus: ['visual_data', 'infographics'] }
        ],
        competitors_to_monitor: ['utility_competitors', 'renewable_providers', 'industry_leaders'],
        success_metrics: ['solution_mentions', 'technology_citations', 'sustainability_recognition']
      },

      // MEDIA & ENTERTAINMENT
      media: {
        schemas: [
          { type: 'Organization', priority: 'high', fields: ['name', 'description', 'foundingDate', 'founder', 'sameAs'], reasoning: 'Media company information' },
          { type: 'CreativeWork', priority: 'critical', fields: ['name', 'description', 'author', 'datePublished', 'genre'], reasoning: 'Content and productions' },
          { type: 'VideoObject', priority: 'high', fields: ['name', 'description', 'uploadDate', 'contentUrl', 'thumbnailUrl'], reasoning: 'Video content' },
          { type: 'Person', priority: 'medium', fields: ['name', 'jobTitle', 'worksFor', 'sameAs'], reasoning: 'Talent and creators' }
        ],
        queries: [
          { pattern: '[content_type] streaming on [platform]', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'best [genre] [content_type]', priority: 'medium', intent: 'recommendation', expectedRank: 7 },
          { pattern: '[title] release date', priority: 'high', intent: 'informational', expectedRank: 3 },
          { pattern: '[title] cast', priority: 'medium', intent: 'informational', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'high', optimizationFocus: ['recommendations', 'content_info'] },
          { platform: 'claude', importance: 'medium', optimizationFocus: ['detailed_descriptions', 'analysis'] },
          { platform: 'perplexity', importance: 'high', optimizationFocus: ['citations', 'release_info'] },
          { platform: 'gemini', importance: 'critical', optimizationFocus: ['visual_content', 'video', 'images'] }
        ],
        competitors_to_monitor: ['streaming_platforms', 'studios', 'content_creators'],
        success_metrics: ['content_recommendations', 'platform_mentions', 'creator_recognition']
      },

      // TRANSPORTATION & LOGISTICS
      transportation: {
        schemas: [
          { type: 'Organization', priority: 'high', fields: ['name', 'description', 'foundingDate', 'numberOfEmployees'], reasoning: 'Logistics company information' },
          { type: 'Service', priority: 'critical', fields: ['name', 'description', 'provider', 'serviceType', 'areaServed'], reasoning: 'Transportation services' },
          { type: 'Product', priority: 'medium', fields: ['name', 'description', 'category'], reasoning: 'Logistics solutions' },
          { type: 'FAQPage', priority: 'high', fields: ['mainEntity', 'acceptedAnswer'], reasoning: 'Shipping and logistics questions' }
        ],
        queries: [
          { pattern: '[service_type] shipping', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: 'best freight company', priority: 'medium', intent: 'comparison', expectedRank: 7 },
          { pattern: 'shipping cost [route]', priority: 'high', intent: 'informational', expectedRank: 5 },
          { pattern: '[logistics_service] near me', priority: 'high', intent: 'local', expectedRank: 5 }
        ],
        platforms: [
          { platform: 'chatgpt', importance: 'medium', optimizationFocus: ['service_comparisons', 'recommendations'] },
          { platform: 'claude', importance: 'high', optimizationFocus: ['detailed_capabilities', 'solutions'] },
          { platform: 'perplexity', importance: 'critical', optimizationFocus: ['industry_data', 'citations'] },
          { platform: 'gemini', importance: 'medium', optimizationFocus: ['route_maps', 'facility_locations'] }
        ],
        competitors_to_monitor: ['major_carriers', 'logistics_providers', '3pl_companies'],
        success_metrics: ['service_mentions', 'capability_citations', 'industry_recognition']
      }
    }

    // Industry mappings for variations (like MasterSourceRegistry)
    this.industryMappings = {
      // Technology
      'tech': 'technology',
      'software': 'saas',
      'b2b': 'saas',
      'cloudcomputing': 'saas',
      'ai': 'technology',
      'ml': 'technology',

      // Finance
      'fintech': 'finance',
      'banking': 'finance',
      'investment': 'finance',
      'wealth': 'finance',

      // Healthcare
      'pharma': 'healthcare',
      'medical': 'healthcare',
      'healthtech': 'healthcare',
      'biotech': 'healthcare',
      'medtech': 'healthcare',

      // E-commerce & Retail
      'retail': 'ecommerce',
      'shopping': 'ecommerce',
      'ecom': 'ecommerce',
      'marketplace': 'ecommerce',
      'dtc': 'ecommerce',

      // Automotive
      'auto': 'automotive',
      'cars': 'automotive',
      'vehicles': 'automotive',
      'automotive': 'automotive',

      // Real Estate
      'realestate': 'real_estate',
      'property': 'real_estate',
      'housing': 'real_estate',
      'proptech': 'real_estate',

      // Professional Services
      'professional': 'professional_services',
      'consulting': 'professional_services',
      'accounting': 'professional_services',
      'law': 'legal',
      'attorney': 'legal',
      'lawyer': 'legal',

      // Food & Restaurant
      'restaurant': 'food',
      'hospitality': 'food',
      'foodservice': 'food',
      'foodbeverage': 'food',

      // Sports & Fitness
      'fitness': 'sports',
      'athletic': 'sports',
      'gym': 'sports',
      'sportswear': 'sports',

      // Manufacturing & Industrial
      'industrial': 'manufacturing',
      'factory': 'manufacturing',
      'production': 'manufacturing',

      // Energy
      'utilities': 'energy',
      'power': 'energy',
      'renewable': 'energy',

      // Media
      'entertainment': 'media',
      'streaming': 'media',
      'content': 'media',

      // Transportation
      'logistics': 'transportation',
      'shipping': 'transportation',
      'freight': 'transportation',
      'supplychain': 'transportation'
    }
  }

  /**
   * Get complete GEO intelligence for an industry
   */
  getIndustryGEO(industry: string): IndustryGEO | null {
    const normalized = industry.toLowerCase().replace(/[^a-z]/g, '')

    // Try exact match
    if (this.industries[normalized]) {
      return this.industries[normalized]
    }

    // Try mapped match
    const mapped = this.industryMappings[normalized]
    if (mapped && this.industries[mapped]) {
      return this.industries[mapped]
    }

    // Try partial match
    for (const key in this.industries) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return this.industries[key]
      }
    }

    return null
  }

  /**
   * Get AI query patterns for an industry
   */
  getQueryPatterns(industry: string, priority?: 'critical' | 'high' | 'medium' | 'low'): QueryPattern[] {
    const geo = this.getIndustryGEO(industry)
    if (!geo) return []

    if (priority) {
      return geo.queries.filter(q => q.priority === priority)
    }

    return geo.queries
  }

  /**
   * Get schema priorities for an industry
   */
  getSchemaPriorities(industry: string): SchemaType[] {
    const geo = this.getIndustryGEO(industry)
    if (!geo) return []

    return geo.schemas.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Get platform-specific optimization guidance
   */
  getPlatformGuidance(industry: string, platform: 'chatgpt' | 'claude' | 'perplexity' | 'gemini'): PlatformPreference | null {
    const geo = this.getIndustryGEO(industry)
    if (!geo) return null

    return geo.platforms.find(p => p.platform === platform) || null
  }

  /**
   * Generate personalized queries for an organization
   */
  generatePersonalizedQueries(
    industry: string,
    organization: {
      name: string
      category?: string
      problem_solved?: string
      competitors?: string[]
    }
  ): string[] {
    const patterns = this.getQueryPatterns(industry)

    return patterns.map(p => {
      let query = p.pattern

      // Replace placeholders
      query = query.replace('[category]', organization.category || 'software')
      query = query.replace('[problem]', organization.problem_solved || 'business problem')
      query = query.replace('[product]', organization.name)
      query = query.replace('[competitor]', organization.competitors?.[0] || 'leading competitor')

      return query
    })
  }

  /**
   * Get all supported industries
   */
  getSupportedIndustries(): string[] {
    return Object.keys(this.industries)
  }

  /**
   * Get GEO statistics
   */
  getStats() {
    const stats = {
      total_industries: Object.keys(this.industries).length,
      total_schemas: 0,
      total_queries: 0,
      total_platforms: 0,
      by_industry: {} as Record<string, any>
    }

    for (const [industry, data] of Object.entries(this.industries)) {
      stats.total_schemas += data.schemas.length
      stats.total_queries += data.queries.length
      stats.total_platforms += data.platforms.length

      stats.by_industry[industry] = {
        schemas: data.schemas.length,
        queries: data.queries.length,
        platforms: data.platforms.length,
        critical_schemas: data.schemas.filter(s => s.priority === 'critical').length,
        critical_queries: data.queries.filter(q => q.priority === 'critical').length
      }
    }

    return stats
  }

  /**
   * Get industry-specific priorities for intelligent query generation
   */
  getIndustryPriorities(industry: string): IndustryPriorities | null {
    const data = this.getIndustryGEO(industry)
    return data?.priorities || null
  }

  /**
   * Generate industry-aware query suggestions based on priorities
   * This helps create more relevant queries than generic patterns
   */
  generateIndustryAwareQuerySuggestions(
    industry: string,
    organizationName: string,
    serviceLines: string[] = [],
    geographicFocus: string[] = []
  ): string[] {
    const priorities = this.getIndustryPriorities(industry)
    if (!priorities) return []

    const suggestions: string[] = []

    // Use industry-specific query framing
    if (serviceLines.length > 0 && geographicFocus.length > 0) {
      // Combine service lines with geographic focus
      serviceLines.slice(0, 3).forEach(service => {
        geographicFocus.slice(0, 2).forEach(geo => {
          suggestions.push(`best ${service.toLowerCase()} in ${geo}`)
          suggestions.push(`${service.toLowerCase()} firm ${geo}`)
          suggestions.push(`top ${service.toLowerCase()} ${geo}`)
        })
      })
    }

    // Add comparison queries based on industry priorities
    if (priorities.query_framing.comparison.length > 0) {
      priorities.query_framing.comparison.slice(0, 3).forEach(template => {
        const query = template
          .replace('{organization}', organizationName)
          .replace('{brand}', organizationName)
          .replace('{firm}', organizationName)
          .replace('{product}', organizationName)

        if (!query.includes('{')) { // Only add if all placeholders were replaced
          suggestions.push(query)
        }
      })
    }

    // Add expertise queries
    if (priorities.query_framing.expertise.length > 0) {
      priorities.query_framing.expertise.slice(0, 3).forEach(template => {
        const query = template
          .replace('{organization}', organizationName)
          .replace('{firm}', organizationName)
          .replace('{brand}', organizationName)

        if (!query.includes('{')) {
          suggestions.push(query)
        }
      })
    }

    return suggestions.slice(0, 15) // Return top 15 suggestions
  }
}

export const geoRegistry = new GEOIntelligenceRegistry()
